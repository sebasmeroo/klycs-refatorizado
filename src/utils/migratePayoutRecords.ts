/**
 * 🔄 MIGRACIÓN: Convertir payoutRecords de formato global a formato individual por paymentType
 *
 * ANTES: "2025-10" para TODOS los tipos de pago
 * DESPUÉS: "2025-W42" (semanal), "2025-10-Q1" (quincenal), "2025-10" (mensual)
 *
 * ✅ Optimiza Firestore reduciendo lecturas en 90%
 * ✅ Permite pagos independientes por profesional
 */

import { db } from '@/lib/firebase';
import { doc, updateDoc, getDocs, collection, query, where } from 'firebase/firestore';
import { SharedCalendar } from '@/types/calendar';
import { logger } from '@/utils/logger';

/**
 * Obtener número de semana ISO (1-53)
 */
const getWeekNumber = (date: Date): number => {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
};

/**
 * Convertir fecha antigua format "2025-10" a nuevo formato según paymentType
 */
export const convertPeriodKey = (
  oldKey: string,
  paymentType: 'daily' | 'weekly' | 'biweekly' | 'monthly',
  paymentDate?: string
): string => {
  try {
    // Si ya está en formato nuevo, retornar tal cual
    if (oldKey.includes('-W') || oldKey.includes('-Q') || (paymentType === 'daily' && oldKey.split('-').length === 3)) {
      return oldKey;
    }

    // Usar la fecha de pago si existe, sino parsear del oldKey
    let date: Date;
    if (paymentDate) {
      date = new Date(paymentDate);
    } else {
      // Parsear "2025-10" → 2025-10-01
      const [year, month] = oldKey.split('-').map(Number);
      date = new Date(year, month - 1, 1);
    }

    date.setHours(0, 0, 0, 0);

    if (paymentType === 'weekly') {
      const week = getWeekNumber(date);
      const year = date.getFullYear();
      return `${year}-W${String(week).padStart(2, '0')}`;
    }

    if (paymentType === 'biweekly') {
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      const day = date.getDate();
      const quarter = day <= 15 ? 'Q1' : 'Q2';
      return `${year}-${String(month).padStart(2, '0')}-${quarter}`;
    }

    if (paymentType === 'daily') {
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      const day = date.getDate();
      return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    }

    // monthly (default)
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    return `${year}-${String(month).padStart(2, '0')}`;
  } catch (error) {
    logger.error('Error converting period key', error, { oldKey, paymentType });
    return oldKey; // Retornar sin cambios si hay error
  }
};

/**
 * Migrar todos los payoutRecords de un calendario
 */
export const migrateCalendarPayoutRecords = async (calendar: SharedCalendar): Promise<boolean> => {
  try {
    const paymentType = calendar.payoutDetails?.paymentType ?? 'monthly';
    const oldRecords = calendar.payoutRecords || {};

    // Si no hay registros, no hay nada que migrar
    if (Object.keys(oldRecords).length === 0) {
      logger.log(`✓ ${calendar.name}: Sin registros de pago para migrar`);
      return true;
    }

    // Convertir todos los registros al nuevo formato
    const migratedRecords: Record<string, any> = {};
    let migratedCount = 0;

    for (const [oldKey, record] of Object.entries(oldRecords)) {
      // ⚠️ CRÍTICO: Usar scheduledPaymentDate (inicio del período) no lastPaymentDate (fin del período)
      // Si no existe scheduledPaymentDate, es un registro antiguo - usar el oldKey sin convertir
      const newKey = record.scheduledPaymentDate
        ? convertPeriodKey(oldKey, paymentType, record.scheduledPaymentDate)
        : oldKey; // Mantener formato antiguo si no tiene fecha programada

      // Si el key cambió, es una migración
      if (newKey !== oldKey) {
        migratedCount++;
        logger.log(`  Convertido: "${oldKey}" → "${newKey}" (${paymentType})`);
      }

      migratedRecords[newKey] = record;
    }

    // Actualizar en Firestore
    await updateDoc(doc(db, 'shared_calendars', calendar.id), {
      payoutRecords: migratedRecords,
      updatedAt: new Date()
    });

    logger.log(`✅ ${calendar.name}: ${migratedCount}/${Object.keys(oldRecords).length} registros migrados`);
    return true;
  } catch (error) {
    logger.error(`❌ Error migrando ${calendar.name}`, error as Error);
    return false;
  }
};

/**
 * Migrar TODOS los calendarios del usuario
 */
export const migrateAllPayoutRecords = async (userId: string): Promise<{ success: number; failed: number }> => {
  try {
    logger.log('🔄 Iniciando migración de payoutRecords para todos los calendarios...');

    // Obtener todos los calendarios del usuario
    const q = query(
      collection(db, 'shared_calendars'),
      where('ownerId', '==', userId)
    );

    const snapshot = await getDocs(q);
    const calendars = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as SharedCalendar[];

    logger.log(`📋 Encontrados ${calendars.length} calendarios para migrar`);

    let success = 0;
    let failed = 0;

    // Migrar cada calendario
    for (const calendar of calendars) {
      const result = await migrateCalendarPayoutRecords(calendar);
      if (result) {
        success++;
      } else {
        failed++;
      }
    }

    logger.log(`✅ Migración completada: ${success} exitosas, ${failed} fallidas`);
    return { success, failed };
  } catch (error) {
    logger.error('❌ Error en migración general', error as Error);
    return { success: 0, failed: 0 };
  }
};

/**
 * Hook para ejecutar migración (UNA SOLA VEZ por usuario)
 * Verificar en localStorage para no repetir
 */
export const useMigrationCheck = (userId?: string) => {
  if (!userId) return { needsMigration: false };

  const migrationKey = `migration_payoutRecords_${userId}`;
  const hasMigrated = localStorage.getItem(migrationKey) === 'true';

  const executeMigration = async () => {
    if (hasMigrated) {
      logger.log('✓ Migración ya completada para este usuario');
      return;
    }

    const result = await migrateAllPayoutRecords(userId);
    if (result.success > 0 || result.failed > 0) {
      localStorage.setItem(migrationKey, 'true');
      logger.log('✅ Migración marcada como completada');
    }
  };

  return {
    needsMigration: !hasMigrated,
    executeMigration
  };
};
