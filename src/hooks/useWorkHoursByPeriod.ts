import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { WorkHoursAnalyticsService } from '@/services/workHoursAnalytics';
import { WorkHoursStats } from '@/types/calendar';
import { useUserCalendars } from './useCalendar';
import { logger } from '@/utils/logger';
import { getCurrentPaymentPeriod, PaymentPeriod } from '@/utils/paymentPeriods';
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
        // Obtener configuración de pago del calendario
        const paymentType = calendar.payoutDetails?.paymentType || 'monthly';
        const paymentDay = calendar.payoutDetails?.paymentDay;
        const payoutRecords = calendar.payoutRecords || {};
        const customHourlyRate = typeof calendar.payoutDetails?.customHourlyRate === 'number'
          ? calendar.payoutDetails.customHourlyRate
          : null;
        const baseHourlyRate = typeof calendar.hourlyRate === 'number' ? calendar.hourlyRate : 0;
        const effectiveHourlyRate = customHourlyRate ?? baseHourlyRate;
        const currency = calendar.hourlyRateCurrency || 'EUR';

        // ✅ NO pasar lastPaymentDate - queremos el período ACTUAL EN EJECUCIÓN, no el del último pago
        // Calcular periodo de pago actual (basado en hoy, no en último pago)
        const period = getCurrentPaymentPeriod(now, paymentType, paymentDay);

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
        const visited = new Set<string>([period.periodKey]);
        let cursor = new Date(period.start.getTime());

        for (let i = 0; i < MAX_HISTORY_PERIODS; i += 1) {
          cursor.setDate(cursor.getDate() - 1);
          const previousPeriod = getCurrentPaymentPeriod(cursor, paymentType, paymentDay);
          if (visited.has(previousPeriod.periodKey)) {
            // Evitar duplicados (especialmente para diarios)
            break;
          }
          visited.add(previousPeriod.periodKey);

          const previousStats = await buildStatsForPeriod(previousPeriod);
          history.push(previousStats);

          // Mover cursor al inicio del periodo anterior para seguir retrocediendo
          cursor = new Date(previousPeriod.start.getTime());
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
