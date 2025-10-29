import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { WorkHoursAnalyticsService } from '@/services/workHoursAnalytics';
import { WorkHoursStats } from '@/types/calendar';
import { useUserCalendars } from './useCalendar';
import { logger } from '@/utils/logger';
import { PaymentPeriod } from '@/utils/paymentPeriods';
import { PersistentCache } from '@/utils/persistentCache';
import { costMonitoring } from '@/utils/costMonitoring';
import { buildPeriodFromRecord, getRecordReferenceDate } from '@/utils/paymentCycleContext';
import { computeScheduleFromCalendar } from '@/services/paymentSchedule';

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
      try {
        if (!calendars || calendars.length === 0) {
          logger.info('No hay calendarios disponibles para estadísticas por periodo');
          return [];
        }

        const cacheKey = `workHoursByPeriod:${userId}:${onlyCompleted}` as const;
        const cachedData = PersistentCache.get<WorkHoursByPeriod[]>(cacheKey);

        if (cachedData && cachedData.length > 0) {
          logger.log('✅ Estadísticas por período obtenidas de localStorage (0 lecturas Firebase)');
          logger.log('📊 Datos cacheados:', cachedData.map(d => ({
            profesional: d.professionalName,
            horas: d.stats.totalHours,
            periodo: d.period.label
          })));
          return cachedData;
        }

        if (cachedData && cachedData.length === 0) {
          logger.log('ℹ️ Caché encontrado vacío - se recalcula para evitar resultados obsoletos.');
        }

        logger.log('🔄 Calculando estadísticas por periodo de pago (lectura en vivo)...');
        logger.log('⚠️ NO había caché - forzando recálculo desde Firestore');

        const now = new Date();
        const results: WorkHoursByPeriod[] = [];

        const MAX_HISTORY_PERIODS = 1; // ⚠️ REDUCIDO de 3 a 1 para ahorrar lecturas

        for (const calendar of calendars) {
          logger.log(`➡️ Procesando calendario ${calendar.name} (${calendar.id})`);

          const paymentType = (calendar.payoutDetails?.paymentType || 'monthly') as PaymentFrequency;
          const paymentDay = calendar.payoutDetails?.paymentDay;
          const payoutRecords = calendar.payoutRecords || {};
          const customHourlyRate = typeof calendar.payoutDetails?.customHourlyRate === 'number'
            ? calendar.payoutDetails.customHourlyRate
          : null;
        const baseHourlyRate = typeof calendar.hourlyRate === 'number' ? calendar.hourlyRate : 0;
        const effectiveHourlyRate = customHourlyRate ?? baseHourlyRate;
        const currency = calendar.hourlyRateCurrency || 'EUR';
        const schedule = computeScheduleFromCalendar(calendar, {
          referenceDate: now,
          allowFutureStart: true
        });
        const currentPeriod = schedule?.current;

        if (!currentPeriod) {
          logger.log(`⚠️ No se encontró período activo para ${calendar.name}, se omite.`);
          continue;
        }

        logger.log(`📅 Periodo para ${calendar.name}: ${currentPeriod.label} (${currentPeriod.start.toISOString()} - ${currentPeriod.end.toISOString()})`);

        const recordKey = currentPeriod.periodKey;

        const buildStatsForPeriod = async (targetPeriod: PaymentPeriod) => {
          // Track cada lectura
          costMonitoring.trackFirestoreRead(1);

          logger.log(`🧪 buildStatsForPeriod INPUT`, {
            calendar: calendar.name,
            periodKey: targetPeriod.periodKey,
            startISO: targetPeriod.start?.toISOString?.(),
            endISO: targetPeriod.end?.toISOString?.(),
            startTime: targetPeriod.start?.getTime?.(),
            endTime: targetPeriod.end?.getTime?.()
          });

          logger.log(`🔍 buildStatsForPeriod - ${calendar.name}:`, {
            periodKey: targetPeriod.periodKey,
            label: targetPeriod.label,
            inicio: targetPeriod.start.toISOString().split('T')[0],
            fin: targetPeriod.end.toISOString().split('T')[0]
          });

          let hours = 0;
          let events: any[] = [];

          try {
            const result = await WorkHoursAnalyticsService.calculateWorkHours(
              calendar.id,
              targetPeriod.start,
              targetPeriod.end,
              onlyCompleted
            );
            hours = result.hours;
            events = result.events;
          } catch (error) {
            logger.error('❌ Error en calculateWorkHours', {
              calendar: calendar.name,
              periodKey: targetPeriod.periodKey,
              message: (error as Error)?.message,
              stack: (error as Error)?.stack
            });
            throw error;
          }

          logger.log('🧾 Reservas incluidas en cálculo de horas:', {
            calendario: calendar.name,
            periodo: targetPeriod.label,
            periodKey: targetPeriod.periodKey,
            rango: {
              inicio: targetPeriod.start.toISOString(),
              fin: targetPeriod.end.toISOString()
            },
            eventos: events.map(event => ({
              titulo: event.title,
              id: event.id,
              fecha: event.startDate ? new Date(event.startDate).toISOString() : null,
              duracionMin: event.duration ?? 0,
              estado: event.serviceStatus ?? 'completed'
            }))
          });

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

        const current = await buildStatsForPeriod({
          periodKey: currentPeriod.periodKey,
          start: currentPeriod.start,
          end: currentPeriod.end,
          label: currentPeriod.label
        });

        const history: PeriodStats[] = [];
        const orderedPaidRecords = Object.entries(payoutRecords)
          .filter(([, record]) => record?.status === 'paid')
          .sort((a, b) => {
            const dateA = getRecordReferenceDate(a[1], a[0]) ?? new Date(0);
            const dateB = getRecordReferenceDate(b[1], b[0]) ?? new Date(0);
            return dateB.getTime() - dateA.getTime();
          });

        let historyCount = 0;
        for (const [key, record] of orderedPaidRecords) {
          if (historyCount >= MAX_HISTORY_PERIODS) break;
          if (key === recordKey) continue;
          const periodFromRecord = buildPeriodFromRecord(key, record, paymentType, paymentDay);
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

      if (results.length === 0) {
        logger.warn('⚠️ No se obtuvieron resultados para workHoursByPeriod a pesar de completar la consulta.');
      }

      // ✅ Guardar en PersistentCache (30 minutos)
      logger.log('💾 Guardando en localStorage con TTL de 30 min...');
      PersistentCache.set(cacheKey, results, 30);
      logger.log('✅ Guardado en localStorage - próximas cargas usarán caché');

        return results;
      } catch (error) {
        logger.error('❌ Error calculando estadísticas por periodo', error as Error);
        throw error;
      }
    },
    staleTime: 15 * 60 * 1000, // 15 minutos - React Query cache
    gcTime: 30 * 60 * 1000, // 30 minutos en memoria (React Query v5)
    enabled: !!calendars && calendars.length > 0 && !calendarsLoading && !!userId,
    refetchOnWindowFocus: false,
    refetchOnMount: false, // ⚠️ CAMBIO: No recargar automáticamente al montar
    placeholderData: (previousData) => previousData, // React Query v5: Mantener datos anteriores
    retry: false
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
