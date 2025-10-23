import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { WorkHoursAnalyticsService } from '@/services/workHoursAnalytics';
import { WorkHoursStats } from '@/types/calendar';
import { useUserCalendars } from './useCalendar';
import { logger } from '@/utils/logger';
import { getCurrentPaymentPeriod, PaymentPeriod } from '@/utils/paymentPeriods';

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

      logger.log('🔄 Calculando estadísticas por periodo de pago (lectura en vivo)...');

      const now = new Date();
      const results: WorkHoursByPeriod[] = [];

      const MAX_HISTORY_PERIODS = 3;

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

        // Encontrar el último pago registrado
        let lastPaymentDate: string | undefined;
        let latestTimestamp = 0;

        Object.values(payoutRecords).forEach(record => {
          if (record?.lastPaymentDate) {
            const timestamp = new Date(record.lastPaymentDate).getTime();
            if (timestamp > latestTimestamp) {
              latestTimestamp = timestamp;
              lastPaymentDate = record.lastPaymentDate;
            }
          }
        });

        // Calcular periodo de pago actual
        const period = getCurrentPaymentPeriod(now, paymentType, paymentDay, lastPaymentDate);

        logger.log(`📅 Periodo para ${calendar.name}: ${period.label} (${period.start.toISOString()} - ${period.end.toISOString()})`);

        const buildStatsForPeriod = async (targetPeriod: PaymentPeriod) => {
          const { hours, events } = await WorkHoursAnalyticsService.calculateWorkHours(
            calendar.id,
            targetPeriod.start,
            targetPeriod.end,
            onlyCompleted
          );

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
              events,
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
      return results;
    },
    staleTime: 0,
    gcTime: 2 * 60 * 1000, // GC corto, recalculamos a menudo
    enabled: !!calendars && calendars.length > 0 && !calendarsLoading && !!userId,
    refetchOnWindowFocus: false,
    refetchOnMount: true, // Siempre recargar al montar (datos en tiempo real)
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
