import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { WorkHoursAnalyticsService } from '@/services/workHoursAnalytics';
import { WorkHoursStats } from '@/types/calendar';
import { costMonitoring } from '@/utils/costMonitoring';
import { PersistentCache } from '@/utils/persistentCache';
import { useUserCalendars } from './useCalendar';
import { logger } from '@/utils/logger';
import { getCurrentPaymentPeriod, PaymentPeriod } from '@/utils/paymentPeriods';

interface WorkHoursByPeriod {
  stats: WorkHoursStats;
  period: PaymentPeriod;
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

      // ✅ LAYER 2: Intentar cache primero
      const cacheKey = `workHoursByPeriod:${userId}:${onlyCompleted}` as const;
      const cachedStats = PersistentCache.get<WorkHoursByPeriod[]>(cacheKey);

      if (cachedStats) {
        logger.log('✅ Estadísticas por periodo obtenidas de cache');
        return cachedStats;
      }

      // ✅ LAYER 3: Cargar desde Firebase
      logger.log('🔄 Calculando estadísticas por periodo de pago...');

      const now = new Date();
      const results: WorkHoursByPeriod[] = [];

      for (const calendar of calendars) {
        // Obtener configuración de pago del calendario
        const paymentType = calendar.payoutDetails?.paymentType || 'monthly';
        const paymentDay = calendar.payoutDetails?.paymentDay;
        const payoutRecords = calendar.payoutRecords || {};

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

        // Calcular horas trabajadas en ese periodo
        costMonitoring.trackFirestoreRead(1);

        const hours = await WorkHoursAnalyticsService.calculateWorkHours(
          calendar.id,
          period.start,
          period.end,
          onlyCompleted
        );

        const hourlyRate = typeof calendar.hourlyRate === 'number' ? calendar.hourlyRate : 0;
        const amount = hours * hourlyRate;
        const currency = calendar.hourlyRateCurrency || 'EUR';

        // Construir estadísticas para este periodo
        const stats: WorkHoursStats = {
          professionalId: calendar.id,
          professionalName: calendar.name,
          totalHours: Math.round(hours * 100) / 100,
          totalAmount: Math.round(amount * 100) / 100,
          currency,
          hourlyRate,
          monthlyBreakdown: [{
            month: period.periodKey,
            hours: Math.round(hours * 100) / 100,
            events: 0, // Se calculará si es necesario
            amount: Math.round(amount * 100) / 100
          }],
          yearlyTotal: Math.round(hours * 100) / 100,
          averagePerMonth: Math.round(hours * 100) / 100
        };

        results.push({
          stats,
          period,
          professionalId: calendar.id,
          professionalName: calendar.name
        });
      }

      // ✅ Guardar en cache (5 minutos - más corto porque los datos cambian con frecuencia)
      PersistentCache.set(cacheKey, results, 5 * 60 * 1000);

      logger.log(`✅ Estadísticas por periodo calculadas: ${results.length} profesionales`);
      return results;
    },
    staleTime: 2 * 60 * 1000, // 2 minutos - más corto para datos en tiempo real
    gcTime: 5 * 60 * 1000, // 5 minutos en memoria
    enabled: !!calendars && calendars.length > 0 && !calendarsLoading && !!userId,
    refetchOnWindowFocus: false,
    refetchOnMount: true, // Siempre recargar al montar (datos en tiempo real)
    keepPreviousData: true
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
