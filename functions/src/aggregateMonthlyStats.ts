import {onSchedule} from 'firebase-functions/v2/scheduler';
import {onCall, HttpsError} from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';

// Lazy initialization - db is already initialized in index.ts
const getDb = () => admin.firestore();

/**
 * Cloud Function para agregar estadísticas mensuales
 *
 * SE EJECUTA AUTOMÁTICAMENTE:
 * - Día 1 de cada mes a las 2:00 AM
 * - Procesa el mes anterior
 *
 * EJEMPLO:
 * - 1 de Mayo 2025, 2:00 AM → Agrega Abril 2025
 * - 1 de Junio 2025, 2:00 AM → Agrega Mayo 2025
 *
 * BENEFICIO:
 * - Reduce lecturas de Firebase en 95%
 * - Datos históricos pre-calculados (1 lectura vs 100)
 */
export const aggregateMonthlyStats = onSchedule({
  schedule: '0 2 1 * *', // Día 1 de cada mes a las 2:00 AM
  timeZone: 'Europe/Madrid',
  region: 'europe-west1'
}, async () => {
    console.log('🌙 ===== INICIO AGREGACIÓN MENSUAL =====');
    console.log('⏰ Timestamp:', new Date().toISOString());

    try {
      // Calcular el mes anterior
      const now = new Date();
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastMonthKey = `${lastMonth.getFullYear()}-${String(lastMonth.getMonth() + 1).padStart(2, '0')}`;

      console.log(`📅 Agregando mes: ${lastMonthKey}`);

      // Obtener todos los calendarios profesionales
      const db = getDb();
      const calendarsSnapshot = await db.collection('shared_calendars').get();
      console.log(`📊 Total calendarios encontrados: ${calendarsSnapshot.size}`);

      let processedCalendars = 0;
      let totalEventsProcessed = 0;
      let errors = 0;

      // Procesar cada calendario
      for (const calendarDoc of calendarsSnapshot.docs) {
        const calendarId = calendarDoc.id;
        const calendarData = calendarDoc.data();

        try {
          console.log(`\n🔄 Procesando calendario: ${calendarId}`);
          console.log(`   Nombre: ${calendarData.name || 'Sin nombre'}`);

          // Verificar si ya existe agregación para este mes
          const existingAggregation = await db
            .collection('shared_calendars')
            .doc(calendarId)
            .collection('monthlyStats')
            .doc(lastMonthKey)
            .get();

          if (existingAggregation.exists) {
            console.log(`   ⏭️  Ya existe agregación para ${lastMonthKey}, saltando...`);
            continue;
          }

          // Calcular fechas del mes
          const monthStart = new Date(lastMonth.getFullYear(), lastMonth.getMonth(), 1);
          const monthEnd = new Date(lastMonth.getFullYear(), lastMonth.getMonth() + 1, 0, 23, 59, 59, 999);

          console.log(`   📆 Rango: ${monthStart.toISOString()} - ${monthEnd.toISOString()}`);

          // Obtener eventos del mes
          const eventsSnapshot = await db
            .collection('calendar_events')
            .where('calendarId', '==', calendarId)
            .where('startDate', '>=', Timestamp.fromDate(monthStart))
            .where('startDate', '<=', Timestamp.fromDate(monthEnd))
            .get();

          console.log(`   📋 Eventos encontrados: ${eventsSnapshot.size}`);
          totalEventsProcessed += eventsSnapshot.size;

          // Calcular estadísticas
          let totalHours = 0;
          let totalAmount = 0;
          let totalEvents = 0;
          let completedEvents = 0;

          const hourlyRate = typeof calendarData.hourlyRate === 'number' ? calendarData.hourlyRate : 0;
          const currency = calendarData.hourlyRateCurrency || 'EUR';

          eventsSnapshot.forEach((eventDoc) => {
            const event = eventDoc.data();

            // Solo contar eventos completados
            if (event.serviceStatus === 'completed') {
              completedEvents++;

              if (event.duration && event.duration > 0) {
                const hours = event.duration / 60;
                totalHours += hours;
                totalAmount += hours * hourlyRate;
              }
            }

            totalEvents++;
          });

          // Redondear valores
          totalHours = Math.round(totalHours * 100) / 100;
          totalAmount = Math.round(totalAmount * 100) / 100;

          // Guardar agregación
          const aggregation = {
            month: lastMonthKey,
            totalHours,
            totalAmount,
            totalEvents,
            completedEvents,
            currency,
            hourlyRate,
            calculatedAt: Timestamp.now(),
            version: 1
          };

          await db
            .collection('shared_calendars')
            .doc(calendarId)
            .collection('monthlyStats')
            .doc(lastMonthKey)
            .set(aggregation);

          console.log(`   ✅ Agregación guardada:`);
          console.log(`      - Horas: ${totalHours}h`);
          console.log(`      - Monto: ${totalAmount} ${currency}`);
          console.log(`      - Eventos: ${completedEvents}/${totalEvents} completados`);

          processedCalendars++;

        } catch (error) {
          console.error(`   ❌ Error procesando calendario ${calendarId}:`, error);
          errors++;
        }
      }

      // Resumen final
      console.log('\n📊 ===== RESUMEN AGREGACIÓN =====');
      console.log(`✅ Calendarios procesados: ${processedCalendars}/${calendarsSnapshot.size}`);
      console.log(`📋 Total eventos procesados: ${totalEventsProcessed}`);
      console.log(`❌ Errores: ${errors}`);
      console.log(`📅 Mes agregado: ${lastMonthKey}`);
      console.log('🎉 ===== AGREGACIÓN COMPLETADA =====\n');

    } catch (error) {
      console.error('💥 ERROR FATAL en agregación mensual:', error);
      throw error;
    }
  });

/**
 * Cloud Function manual para agregar un mes específico
 *
 * USO:
 * - Ejecutar desde Firebase Console o CLI
 * - Útil para backfill de meses anteriores
 *
 * EJEMPLO:
 * firebase functions:call aggregateSpecificMonth --data '{"year": 2025, "month": 3}'
 */
export const aggregateSpecificMonth = onCall({
  region: 'europe-west1'
}, async (request) => {
    // Verificar autenticación
    if (!request.auth) {
      throw new HttpsError(
        'unauthenticated',
        'Debes estar autenticado para ejecutar esta función'
      );
    }
    
    const data = request.data;

    // Verificar que sea admin (opcional, personaliza según tu lógica)
    // const isAdmin = request.auth.token.admin === true;
    // if (!isAdmin) {
    //   throw new HttpsError('permission-denied', 'Solo administradores');
    // }

    const { year, month } = data;

    if (!year || !month || month < 1 || month > 12) {
      throw new HttpsError(
        'invalid-argument',
        'Debes proporcionar year y month válidos (month: 1-12)'
      );
    }

    const monthKey = `${year}-${String(month).padStart(2, '0')}`;
    console.log(`🔧 Agregación manual solicitada para: ${monthKey}`);

    try {
      const db = getDb();
      const monthStart = new Date(year, month - 1, 1);
      const monthEnd = new Date(year, month, 0, 23, 59, 59, 999);

      const calendarsSnapshot = await db.collection('shared_calendars').get();
      let processed = 0;

      for (const calendarDoc of calendarsSnapshot.docs) {
        const calendarId = calendarDoc.id;
        const calendarData = calendarDoc.data();

        const eventsSnapshot = await db
          .collection('calendar_events')
          .where('calendarId', '==', calendarId)
          .where('startDate', '>=', Timestamp.fromDate(monthStart))
          .where('startDate', '<=', Timestamp.fromDate(monthEnd))
          .get();

        let totalHours = 0;
        let totalAmount = 0;
        let totalEvents = 0;
        let completedEvents = 0;

        const hourlyRate = typeof calendarData.hourlyRate === 'number' ? calendarData.hourlyRate : 0;
        const currency = calendarData.hourlyRateCurrency || 'EUR';

        eventsSnapshot.forEach((eventDoc) => {
          const event = eventDoc.data();

          if (event.serviceStatus === 'completed') {
            completedEvents++;

            if (event.duration && event.duration > 0) {
              const hours = event.duration / 60;
              totalHours += hours;
              totalAmount += hours * hourlyRate;
            }
          }

          totalEvents++;
        });

        totalHours = Math.round(totalHours * 100) / 100;
        totalAmount = Math.round(totalAmount * 100) / 100;

        const aggregation = {
          month: monthKey,
          totalHours,
          totalAmount,
          totalEvents,
          completedEvents,
          currency,
          hourlyRate,
          calculatedAt: Timestamp.now(),
          version: 1,
          manualTrigger: true,
          triggeredBy: request.auth.uid
        };

        await db
          .collection('shared_calendars')
          .doc(calendarId)
          .collection('monthlyStats')
          .doc(monthKey)
          .set(aggregation, { merge: true });

        processed++;
      }

      console.log(`✅ Agregación manual completada: ${processed} calendarios`);

      return {
        success: true,
        month: monthKey,
        calendarsProcessed: processed
      };

    } catch (error) {
      console.error('❌ Error en agregación manual:', error);
      throw new HttpsError('internal', 'Error procesando agregación');
    }
  });
