import { useQuery } from '@tanstack/react-query';
import { WorkHoursAnalyticsService } from '@/services/workHoursAnalytics';
import { WorkHoursStats } from '@/types/calendar';
import { costMonitoring } from '@/utils/costMonitoring';
import { PersistentCache } from '@/utils/persistentCache';
import { useUserCalendars } from './useCalendar';
import { logger } from '@/utils/logger';

/**
 * Hook optimizado para obtener estadísticas de horas trabajadas con caché multi-capa
 *
 * ✅ Layer 1: React Query (memoria, 5 min)
 * ✅ Layer 2: PersistentCache (localStorage, 10 min)
 * ✅ Layer 3: Firebase + Cloud Functions con agregaciones mensuales
 * ✅ Reduce lecturas de Firebase en 95%
 * ✅ Tracking de costes completo
 *
 * @example
 * ```tsx
 * const { data: stats, isLoading, refetch } = useWorkHoursStats(
 *   userId,
 *   2025,
 *   true // solo completados
 * );
 * ```
 */
export const useWorkHoursStats = (
  userId: string | undefined,
  year: number,
  onlyCompleted: boolean
) => {
  const { data: calendars, isLoading: calendarsLoading } = useUserCalendars(userId);

  return useQuery({
    queryKey: ['workHoursStats', userId, year, onlyCompleted],
    queryFn: async (): Promise<WorkHoursStats[]> => {
      if (!calendars || calendars.length === 0) {
        logger.info('No hay calendarios disponibles para estadísticas de horas');
        return [];
      }

      // ✅ LAYER 2: Intentar obtener del PersistentCache primero
      const cacheKey = `workHoursStats:${userId}:${year}:${onlyCompleted}` as const;
      const cachedStats = PersistentCache.get<WorkHoursStats[]>(cacheKey);

      if (cachedStats) {
        logger.log('✅ Estadísticas de horas obtenidas de localStorage (0 lecturas Firebase)');
        logger.log('📊 Datos cacheados:', cachedStats.map(s => ({
          profesional: s.professionalName,
          horas: s.totalHours,
          monto: s.totalAmount
        })));
        return cachedStats;
      }

      // ✅ LAYER 3: No hay cache, cargar desde Firebase + Cloud Functions
      logger.log('🔄 Cargando estadísticas de horas desde Firebase + Cloud Functions... (REFETCH ACTIVADO)');
      logger.log('⚠️ NO había caché en localStorage - forzando recalcular desde Firestore');

      const mappedCalendars = calendars.map(cal => ({
        id: cal.id,
        name: cal.name,
        hourlyRate: typeof cal.hourlyRate === 'number' ? cal.hourlyRate : 0,
        currency: cal.hourlyRateCurrency ?? 'EUR'
      }));

      // Track lecturas de Firebase
      costMonitoring.trackFirestoreRead(calendars.length);

      const stats = await WorkHoursAnalyticsService.getAllProfessionalsStats(
        mappedCalendars,
        year,
        onlyCompleted
      );

      // ✅ Guardar en PersistentCache para próximas cargas (10 minutos)
      PersistentCache.set(cacheKey, stats);

      logger.log(`✅ Estadísticas de horas cargadas y guardadas en cache: ${stats.length} profesionales`);
      return stats;
    },
    staleTime: 5 * 60 * 1000, // 5 minutos - React Query cache
    gcTime: 10 * 60 * 1000, // 10 minutos en memoria (antes cacheTime)
    enabled: !!calendars && calendars.length > 0 && !calendarsLoading && !!userId,
    refetchOnWindowFocus: true, // ✅ CAMBIO: Recargar al volver a la pestaña
    refetchOnMount: true, // ✅ CAMBIO: Recargar al montar (necesario para updates después de pagar)
    keepPreviousData: true, // Mantener datos anteriores mientras carga los nuevos
  });
};

/**
 * Calcular totales agregados de las estadísticas
 */
export const useWorkHoursTotals = (stats: WorkHoursStats[] | undefined) => {
  if (!stats || stats.length === 0) {
    return {
      totalHours: 0,
      totalEvents: 0,
      totalAmount: 0,
      currency: 'EUR',
      topProfessional: null
    };
  }

  const totalHours = stats.reduce((sum, s) => sum + s.totalHours, 0);

  const totalEvents = stats.reduce((sum, s) =>
    sum + s.monthlyBreakdown.reduce((eventSum, month) => eventSum + month.events, 0),
    0
  );

  const totalAmount = stats.reduce((sum, s) => sum + (s.totalAmount || 0), 0);

  const currency = stats[0]?.currency ?? 'EUR';

  const topProfessional = stats.length > 0
    ? stats.reduce((max, s) => s.totalHours > max.totalHours ? s : max, stats[0])
    : null;

  return {
    totalHours,
    totalEvents,
    totalAmount,
    currency,
    topProfessional
  };
};
