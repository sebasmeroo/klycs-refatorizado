import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { WorkHoursAnalyticsService } from '@/services/workHoursAnalytics';
import { WorkHoursStats } from '@/types/calendar';
import { useUserCalendars } from './useCalendar';
import { logger } from '@/utils/logger';
import { PaymentPeriod } from '@/utils/paymentPeriods';
import { PersistentCache } from '@/utils/persistentCache';
import { costMonitoring } from '@/utils/costMonitoring';

interface PeriodStats {
  stats: WorkHoursStats;
  period: PaymentPeriod;
}

interface WorkHoursByPeriod {
  stats: WorkHoursStats;
  period: PaymentPeriod;
  history: PeriodStats[];
  professionalId: string;
  professionalName: string;
}

type PaymentFrequency = import('@/types/calendar').PaymentFrequency;

const DAY_IN_MS = 24 * 60 * 60 * 1000;

const normalizeDate = (value: Date | null | undefined): Date | null => {
  if (!value) return null;
  const normalized = new Date(value);
  normalized.setHours(0, 0, 0, 0);
  return normalized;
};

const addDays = (date: Date, days: number): Date => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  result.setHours(0, 0, 0, 0);
  return result;
};

const getIntervalDays = (paymentType: PaymentFrequency): number => {
  switch (paymentType) {
    case 'daily':
      return 1;
    case 'weekly':
      return 7;
    case 'biweekly':
      return 15;
    case 'monthly':
    default:
      return 30;
  }
};

const getLatestPaidRecord = (payoutRecords?: Record<string, any>) => {
  if (!payoutRecords) return null;
  let latest: any = null;
  Object.entries(payoutRecords).forEach(([periodKey, record]) => {
    if (record?.status !== 'paid') return;
    const dateToCheck = record?.actualPaymentDate || record?.cycleEnd || record?.lastPaymentDate;
    if (!dateToCheck) return;
    const currentDate = new Date(dateToCheck);
    if (Number.isNaN(currentDate.getTime())) return;
    if (!latest) {
      latest = { periodKey, ...record };
      return;
    }
    const latestDateToCheck = latest.actualPaymentDate || latest.cycleEnd || latest.lastPaymentDate;
    const latestDate = new Date(latestDateToCheck);
    if (currentDate.getTime() > latestDate.getTime()) {
      latest = { periodKey, ...record };
    }
  });
  return latest;
};

const buildCurrentCycle = (
  now: Date,
  paymentType: PaymentFrequency,
  paymentDay: number | null | undefined,
  payoutRecords?: Record<string, any>
): { period: PaymentPeriod; recordKey: string } => {
  const intervalDays = getIntervalDays(paymentType);
  const latestPaidRecord = getLatestPaidRecord(payoutRecords);

  let cycleStart: Date;
  let projectedCycleEnd: Date;

  if (latestPaidRecord?.cycleEnd) {
    const previousCycleEnd = normalizeDate(new Date(latestPaidRecord.cycleEnd));
    cycleStart = previousCycleEnd ? addDays(previousCycleEnd, 1) : normalizeDate(now) ?? now;
    projectedCycleEnd = addDays(cycleStart, intervalDays - 1);
  } else {
    cycleStart = normalizeDate(now) ?? now;
    projectedCycleEnd = addDays(cycleStart, intervalDays - 1);
  }

  const periodKey = cycleStart.toISOString().split('T')[0];
  const currentRecord = payoutRecords?.[periodKey];
  if (currentRecord?.cycleStart) {
    cycleStart = normalizeDate(new Date(currentRecord.cycleStart)) ?? cycleStart;
  }
  if (currentRecord?.status === 'paid' && currentRecord?.cycleEnd) {
    projectedCycleEnd = normalizeDate(new Date(currentRecord.cycleEnd)) ?? projectedCycleEnd;
  } else if (currentRecord?.scheduledPaymentDate) {
    const scheduled = normalizeDate(new Date(currentRecord.scheduledPaymentDate));
    if (scheduled) {
      projectedCycleEnd = scheduled;
    }
  }

  return {
    period: {
      start: cycleStart,
      end: projectedCycleEnd,
      label: `${cycleStart.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })} - ${projectedCycleEnd.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}`,
      periodKey
    },
    recordKey: periodKey
  };
};

const recordToPeriod = (key: string, record: any, intervalDays: number): PaymentPeriod => {
  const start = record?.cycleStart
    ? normalizeDate(new Date(record.cycleStart)) ?? new Date()
    : normalizeDate(record?.actualPaymentDate ? new Date(record.actualPaymentDate) : record?.scheduledPaymentDate ? new Date(record.scheduledPaymentDate) : new Date()) ?? new Date();
  const end = record?.cycleEnd
    ? normalizeDate(new Date(record.cycleEnd)) ?? addDays(start, intervalDays - 1)
    : record?.scheduledPaymentDate
      ? normalizeDate(new Date(record.scheduledPaymentDate)) ?? addDays(start, intervalDays - 1)
      : addDays(start, intervalDays - 1);

  return {
    start,
    end,
    label: `${start.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })} - ${end.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}`,
    periodKey: key
  };
};

/**
 * Hook para obtener estadísticas de horas trabajadas filtradas por periodo de pago actual
 *
 * Este hook calcula automáticamente el periodo de pago actual basado en:
 * - paymentType: 'daily' | 'weekly' | 'biweekly' | 'monthly'
 * - paymentDay: Día configurado para el pago
 * - lastPaymentDate: Última fecha de pago registrada
 *
 * Y devuelve solo las horas trabajadas dentro de ese periodo.
 *
 * @example
 * ```tsx
 * const { data, isLoading } = useWorkHoursByPeriod(
 *   userId,
 *   true // solo completados
 * );
 *
 * // data será un array de estadísticas, una por profesional
 * data?.forEach(item => {
 *   console.log(`${item.professionalName}: ${item.stats.totalHours}h en periodo ${item.period.label}`);
 * });
 * ```
 */
export const useWorkHoursByPeriod = (
  userId: string | undefined,
  onlyCompleted: boolean = true
) => {
  const { data: calendars, isLoading: calendarsLoading } = useUserCalendars(userId);

  return useQuery({
    queryKey: ['workHoursByPeriod', userId, onlyCompleted],
    queryFn: async (): Promise<WorkHoursByPeriod[]> => {
      if (!calendars || calendars.length === 0) {
        logger.info('No hay calendarios disponibles para estadísticas por periodo');
        return [];
      }

      // ✅ LAYER 2: Intentar obtener del PersistentCache primero (30 min para datos por período)
      const cacheKey = `workHoursByPeriod:${userId}:${onlyCompleted}` as const;
      const cachedData = PersistentCache.get<WorkHoursByPeriod[]>(cacheKey);

      if (cachedData) {
        logger.log('✅ Estadísticas por período obtenidas de localStorage (0 lecturas Firebase)');
        logger.log('📊 Datos cacheados:', cachedData.map(d => ({
          profesional: d.professionalName,
          horas: d.stats.totalHours,
          periodo: d.period.label
        })));
        return cachedData;
      }

      logger.log('🔄 Calculando estadísticas por periodo de pago (lectura en vivo)...');
      logger.log('⚠️ NO había caché - forzando recálculo desde Firestore');

      const now = new Date();
      const results: WorkHoursByPeriod[] = [];

      const MAX_HISTORY_PERIODS = 1; // ⚠️ REDUCIDO de 3 a 1 para ahorrar lecturas

      for (const calendar of calendars) {
        const paymentType = (calendar.payoutDetails?.paymentType || 'monthly') as PaymentFrequency;
        const paymentDay = calendar.payoutDetails?.paymentDay;
        const payoutRecords = calendar.payoutRecords || {};
        const customHourlyRate = typeof calendar.payoutDetails?.customHourlyRate === 'number'
          ? calendar.payoutDetails.customHourlyRate
          : null;
        const baseHourlyRate = typeof calendar.hourlyRate === 'number' ? calendar.hourlyRate : 0;
        const effectiveHourlyRate = customHourlyRate ?? baseHourlyRate;
        const currency = calendar.hourlyRateCurrency || 'EUR';
        const intervalDays = getIntervalDays(paymentType);

        const { period, recordKey } = buildCurrentCycle(now, paymentType, paymentDay, payoutRecords);

        logger.log(`📅 Periodo para ${calendar.name}: ${period.label} (${period.start.toISOString()} - ${period.end.toISOString()})`);

        const buildStatsForPeriod = async (targetPeriod: PaymentPeriod) => {
          // Track cada lectura
          costMonitoring.trackFirestoreRead(1);

          logger.log(`🔍 buildStatsForPeriod - ${calendar.name}:`, {
            periodKey: targetPeriod.periodKey,
            label: targetPeriod.label,
            inicio: targetPeriod.start.toISOString().split('T')[0],
            fin: targetPeriod.end.toISOString().split('T')[0]
          });

          const { hours, events } = await WorkHoursAnalyticsService.calculateWorkHours(
            calendar.id,
            targetPeriod.start,
            targetPeriod.end,
            onlyCompleted
          );

          logger.log(`✅ Resultados de calculateWorkHours - ${calendar.name}:`, {
            periodKey: targetPeriod.periodKey,
            horas: hours,
            eventos: Array.isArray(events) ? events.length : 'N/A',
            horasPorEvento: Array.isArray(events) && events.length > 0 ? (hours / events.length).toFixed(2) : 'N/A'
          });

          const roundedHours = Math.round(hours * 100) / 100;
          const amount = Math.round((hours * effectiveHourlyRate) * 100) / 100;

          const stats: WorkHoursStats = {
            professionalId: calendar.id,
            professionalName: calendar.name,
            totalHours: roundedHours,
            totalAmount: amount,
            currency,
            hourlyRate: effectiveHourlyRate,
            monthlyBreakdown: [{
              month: targetPeriod.periodKey,
              hours: roundedHours,
              events: Array.isArray(events) ? events.length : 0,
              amount
            }],
            yearlyTotal: roundedHours,
            averagePerMonth: roundedHours
          };

          return {
            stats,
            period: targetPeriod
          };
        };

        const current = await buildStatsForPeriod(period);

        const history: PeriodStats[] = [];
        const orderedPaidRecords = Object.entries(payoutRecords)
          .filter(([, record]) => record?.status === 'paid')
          .sort((a, b) => {
            const dateA = normalizeDate(new Date(a[1].cycleEnd ?? a[1].actualPaymentDate ?? a[1].lastPaymentDate ?? Date.now()))!;
            const dateB = normalizeDate(new Date(b[1].cycleEnd ?? b[1].actualPaymentDate ?? b[1].lastPaymentDate ?? Date.now()))!;
            return dateB.getTime() - dateA.getTime();
          });

        let historyCount = 0;
        for (const [key, record] of orderedPaidRecords) {
          if (historyCount >= MAX_HISTORY_PERIODS) break;
          if (key === recordKey) continue;
          const periodFromRecord = recordToPeriod(key, record, intervalDays);
          const stats = await buildStatsForPeriod(periodFromRecord);
          history.push(stats);
          historyCount += 1;
        }

        // Construir estadísticas para este periodo
        results.push({
          stats: current.stats,
          period: current.period,
          history,
          professionalId: calendar.id,
          professionalName: calendar.name
        });
      }

      logger.log(`✅ Estadísticas por periodo calculadas: ${results.length} profesionales`);
      logger.log('📊 Resultados finales:', results.map(r => ({
        profesional: r.professionalName,
        horas: r.stats.totalHours,
        monto: r.stats.totalAmount,
        periodo: r.period.label,
        periodKey: r.period.periodKey
      })));

      // ✅ Guardar en PersistentCache (30 minutos)
      logger.log('💾 Guardando en localStorage con TTL de 30 min...');
      PersistentCache.set(cacheKey, results, 30);
      logger.log('✅ Guardado en localStorage - próximas cargas usarán caché');

      return results;
    },
    staleTime: 15 * 60 * 1000, // 15 minutos - React Query cache
    gcTime: 30 * 60 * 1000, // 30 minutos en memoria (React Query v5)
    enabled: !!calendars && calendars.length > 0 && !calendarsLoading && !!userId,
    refetchOnWindowFocus: false,
    refetchOnMount: false, // ⚠️ CAMBIO: No recargar automáticamente al montar
    placeholderData: (previousData) => previousData // React Query v5: Mantener datos anteriores
  });
};

/**
 * Calcular totales agregados por periodo
 */
export const useWorkHoursByPeriodTotals = (data: WorkHoursByPeriod[] | undefined) => {
  return useMemo(() => {
    if (!data || data.length === 0) {
      return {
        totalHours: 0,
        totalAmount: 0,
        totalProfessionals: 0,
        currency: 'EUR',
        periods: []
      };
    }

    const totalHours = data.reduce((sum, item) => sum + item.stats.totalHours, 0);
    const totalAmount = data.reduce((sum, item) => sum + item.stats.totalAmount, 0);
    const currency = data[0]?.stats.currency || 'EUR';

    // Agrupar periodos únicos
    const periodsMap = new Map<string, PaymentPeriod>();
    data.forEach(item => {
      if (!periodsMap.has(item.period.periodKey)) {
        periodsMap.set(item.period.periodKey, item.period);
      }
    });

    return {
      totalHours: Math.round(totalHours * 100) / 100,
      totalAmount: Math.round(totalAmount * 100) / 100,
      totalProfessionals: data.length,
      currency,
      periods: Array.from(periodsMap.values())
    };
  }, [data]);
};
