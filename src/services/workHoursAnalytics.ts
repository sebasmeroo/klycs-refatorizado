import { CalendarEventService } from '@/services/collaborativeCalendar';
import { WorkHoursStats } from '@/types/calendar';
import { costMonitoring } from '@/utils/costMonitoring';
import { db } from '@/lib/firebase';
import { collection, doc, getDoc } from 'firebase/firestore';
import { logger } from '@/utils/logger';

interface ProfessionalCalendarConfig {
  id: string;
  name: string;
  hourlyRate?: number;
  currency?: string;
}

class CurrencyFormatterRegistry {
  private static cache = new Map<string, Intl.NumberFormat>();

  static format({ amount, currency, locale }: { amount: number; currency: string; locale: string }): string {
    const normalizedCurrency = currency?.trim().toUpperCase() || 'EUR';
    const normalizedLocale = locale || 'es-ES';
    const cacheKey = `${normalizedLocale}-${normalizedCurrency}`;

    let formatter = this.cache.get(cacheKey);

    if (!formatter) {
      formatter = this.createFormatter(normalizedLocale, normalizedCurrency);
      this.cache.set(cacheKey, formatter);
    }

    return formatter.format(amount);
  }

  private static createFormatter(locale: string, currency: string): Intl.NumberFormat {
    try {
      return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      });
    } catch (error) {
      logger.warn('Fallo creando Intl.NumberFormat, usando formato por defecto');
      const fallbackCurrency = currency === 'EUR' ? currency : 'EUR';
      try {
        return new Intl.NumberFormat(locale || 'es-ES', {
          style: 'currency',
          currency: fallbackCurrency,
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        });
      } catch (fallbackError) {
        logger.warn('Fallo creando formatter de respaldo, devolviendo formatter simple');
        return new Intl.NumberFormat('es-ES', {
          style: 'currency',
          currency: 'EUR',
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        });
      }
    }
  }
}

/**
 * Helper: Intentar leer agregación mensual (si existe)
 * @returns Agregación si existe, null si no está disponible
 */
async function tryGetMonthlyAggregation(
  calendarId: string,
  year: number,
  month: number // 0-indexed (0 = Enero)
): Promise<{ hours: number; amount: number; events: number } | null> {
  try {
    const monthKey = `${year}-${String(month + 1).padStart(2, '0')}`;

    // ✅ Track lectura de agregación
    costMonitoring.trackFirestoreRead(1);

    const aggregationRef = doc(
      db,
      'shared_calendars',
      calendarId,
      'monthlyStats',
      monthKey
    );

    const aggregationSnap = await getDoc(aggregationRef);

    if (aggregationSnap.exists()) {
      const data = aggregationSnap.data();
      logger.log(`📦 Usando agregación para ${monthKey}: ${data.totalHours}h, ${data.totalAmount} ${data.currency}`);

      return {
        hours: data.totalHours || 0,
        amount: data.totalAmount || 0,
        events: data.completedEvents || 0
      };
    }

    return null;
  } catch (error) {
    logger.warn(`⚠️ Error leyendo agregación para ${year}-${month}`);
    return null;
  }
}

/**
 * Servicio para calcular horas trabajadas y analytics de profesionales
 */
export class WorkHoursAnalyticsService {
  private static missingAggregationWarnings = new Set<string>();

  /**
   * Calcular horas trabajadas de un profesional en un rango de fechas
   * @param calendarId - ID del calendario del profesional
   * @param startDate - Fecha de inicio
   * @param endDate - Fecha de fin
   * @param onlyCompleted - Si true, solo cuenta servicios marcados como completados
   */
  static async calculateWorkHours(
    calendarId: string,
    startDate: Date,
    endDate: Date,
    onlyCompleted: boolean = true
  ): Promise<number> {
    try {
      // ✅ Track lectura de Firebase
      costMonitoring.trackFirestoreRead(1);

      const { events, fetchedCount } = await CalendarEventService.getCalendarEvents([
        calendarId
      ], startDate, endDate);

      // ✅ Track eventos leídos
      costMonitoring.trackFirestoreRead(fetchedCount);

      const totalMinutes = events.reduce((sum, event) => {
        if (onlyCompleted && event.serviceStatus !== 'completed') {
          return sum;
        }

        if (event.duration && event.duration > 0) {
          return sum + event.duration;
        }

        return sum;
      }, 0);

      return totalMinutes / 60; // Convertir a horas
    } catch (error) {
      logger.error('Error al calcular horas trabajadas', error as Error);
      return 0;
    }
  }

  /**
   * Obtener estadísticas completas de horas trabajadas para un profesional
   * @param onlyCompleted - Si true, solo cuenta servicios completados
   */
  static async getProfessionalStats(
    calendar: ProfessionalCalendarConfig,
    startYear: number = new Date().getFullYear(),
    onlyCompleted: boolean = true
  ): Promise<WorkHoursStats> {
    const {
      id: calendarId,
      name: professionalName,
      hourlyRate: rawHourlyRate,
      currency: rawCurrency
    } = calendar;

    const hourlyRate = typeof rawHourlyRate === 'number' && !Number.isNaN(rawHourlyRate)
      ? rawHourlyRate
      : 0;
    const currency = rawCurrency || 'EUR';

    try {
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth(); // 0-indexed

      const monthlyData: Record<string, { hours: number; events: number; amount: number }> = {};
      let totalHours = 0;
      let totalAmount = 0;
      let totalFirebaseReads = 0;

      // 🚀 ESTRATEGIA HÍBRIDA: Agregaciones para meses pasados, real-time para mes actual
      for (let month = 0; month < 12; month++) {
        const monthKey = `${startYear}-${String(month + 1).padStart(2, '0')}`;
        const isPastMonth = startYear < currentYear || (startYear === currentYear && month < currentMonth);
        const isCurrentMonth = startYear === currentYear && month === currentMonth;
        const isFutureMonth = startYear > currentYear || (startYear === currentYear && month > currentMonth);

        if (isFutureMonth) {
          // Mes futuro: sin datos
          continue;
        }

        if (isPastMonth) {
          // 📦 Intentar usar agregación para meses pasados (1 lectura)
          const aggregation = await tryGetMonthlyAggregation(calendarId, startYear, month);

          if (aggregation) {
            // ✅ Datos de agregación disponibles (1 lectura)
            monthlyData[monthKey] = aggregation;
            totalHours += aggregation.hours;
            totalAmount += aggregation.amount;
            totalFirebaseReads += 1;
            continue;
          }

          // ⚠️ Agregación no disponible, calcular en tiempo real (fallback)
          const warningKey = `${calendarId}-${monthKey}`;
          if (!WorkHoursAnalyticsService.missingAggregationWarnings.has(warningKey)) {
            WorkHoursAnalyticsService.missingAggregationWarnings.add(warningKey);
            const baseMessage = `Agregación no disponible para ${monthKey}, calculando en tiempo real...`;
            if (import.meta.env.DEV) {
              logger.info(`ℹ️ ${baseMessage} (esto es normal en entorno local si aún no se generaron agregaciones).`);
            } else {
              logger.warn(`⚠️ ${baseMessage}`);
            }
          }
        }

        // 🔴 Mes actual o fallback: calcular en tiempo real
        const monthStart = new Date(startYear, month, 1);
        const monthEnd = new Date(startYear, month + 1, 0, 23, 59, 59, 999);

        costMonitoring.trackFirestoreRead(1);
        const { events, fetchedCount } = await CalendarEventService.getCalendarEvents(
          [calendarId],
          monthStart,
          monthEnd
        );

        costMonitoring.trackFirestoreRead(fetchedCount);
        totalFirebaseReads += (1 + fetchedCount);

        if (isCurrentMonth) {
          logger.log(`🔴 Calculando mes actual ${monthKey}: ${fetchedCount} eventos leídos`);
        }

        let monthHours = 0;
        let monthEvents = 0;
        let monthAmount = 0;

        events.forEach(event => {
          if (onlyCompleted && event.serviceStatus !== 'completed') {
            return;
          }

          if (event.duration && event.duration > 0) {
            const hours = event.duration / 60;
            const amount = hours * hourlyRate;
            monthHours += hours;
            monthAmount += amount;
            monthEvents++;
          }
        });

        if (monthHours > 0 || monthEvents > 0) {
          monthlyData[monthKey] = {
            hours: monthHours,
            events: monthEvents,
            amount: monthAmount
          };
          totalHours += monthHours;
          totalAmount += monthAmount;
        }
      }

      logger.log(`📊 Stats para ${professionalName} (${startYear}): ${totalFirebaseReads} lecturas totales de Firebase`);

      // Convertir a array y ordenar por mes
      const monthlyBreakdown = Object.entries(monthlyData)
        .map(([month, data]) => ({
          month,
          hours: Math.round(data.hours * 100) / 100,
          events: data.events,
          amount: Math.round(data.amount * 100) / 100
        }))
        .sort((a, b) => a.month.localeCompare(b.month));

      // Calcular promedio mensual en horas (mantenido para compatibilidad)
      const monthsWithData = monthlyBreakdown.length;
      const averagePerMonth = monthsWithData > 0
        ? Math.round((totalHours / monthsWithData) * 100) / 100
        : 0;

      return {
        professionalId: calendarId,
        professionalName,
        totalHours: Math.round(totalHours * 100) / 100,
        totalAmount: Math.round(totalAmount * 100) / 100,
        currency,
        hourlyRate,
        monthlyBreakdown,
        yearlyTotal: Math.round(totalHours * 100) / 100,
        averagePerMonth
      };
    } catch (error) {
      logger.error('Error al obtener estadísticas', error as Error);
      return {
        professionalId: calendarId,
        professionalName,
        totalHours: 0,
        totalAmount: 0,
        currency,
        hourlyRate,
        monthlyBreakdown: [],
        yearlyTotal: 0,
        averagePerMonth: 0
      };
    }
  }

  /**
   * Obtener estadísticas de todos los profesionales
   * @param onlyCompleted - Si true, solo cuenta servicios completados
   */
  static async getAllProfessionalsStats(
    calendars: ProfessionalCalendarConfig[],
    startYear: number = new Date().getFullYear(),
    onlyCompleted: boolean = true
  ): Promise<WorkHoursStats[]> {
    try {
      const statsPromises = calendars.map(cal =>
        this.getProfessionalStats(cal, startYear, onlyCompleted)
      );

      return await Promise.all(statsPromises);
    } catch (error) {
      logger.error('Error al obtener estadísticas de todos los profesionales', error as Error);
      return [];
    }
  }

  /**
   * Formatear horas en formato legible
   */
  static formatHours(hours: number): string {
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);

    if (m === 0) {
      return `${h}h`;
    }

    return `${h}h ${m}m`;
  }

  /**
   * Formatear cantidades monetarias en función de la moneda
  */
  static formatCurrency(amount: number, currency: string = 'EUR', locale: string = 'es-ES'): string {
    if (typeof amount !== 'number' || !Number.isFinite(amount)) {
      return '0.00 EUR';
    }

    const safeCurrency = currency || 'EUR';
    const safeAmount = Math.round(amount * 100) / 100;

    try {
      return CurrencyFormatterRegistry.format({
        amount: safeAmount,
        currency: safeCurrency,
        locale
      });
    } catch (error) {
      logger.warn('Error al formatear moneda, usando fallback');
      return `${safeAmount.toFixed(2)} ${safeCurrency}`;
    }
  }
}
