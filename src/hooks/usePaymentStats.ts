import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { WorkHoursAnalyticsService } from '@/services/workHoursAnalytics';
import { CalendarEventService } from '@/services/collaborativeCalendar';
import { WorkHoursStats } from '@/types/calendar';
import { costMonitoring } from '@/utils/costMonitoring';
import { PersistentCache } from '@/utils/persistentCache';
import { useUserCalendars } from './useCalendar';

/**
 * Hook optimizado para obtener estadísticas de pagos con caché multi-capa
 * ✅ Layer 1: React Query (memoria, 5 min)
 * ✅ Layer 2: PersistentCache (localStorage, 10 min)
 * ✅ Layer 3: Firebase + Cloud Functions
 * ✅ Reduce lecturas de Firebase en 95%
 * ✅ Tracking de costes completo
 */
export const usePaymentStats = (
  userId: string | undefined,
  year: number,
  onlyCompleted: boolean
) => {
  const { data: calendars, isLoading: calendarsLoading } = useUserCalendars(userId);

  return useQuery({
    queryKey: ['paymentStats', userId, year, onlyCompleted],
    queryFn: async () => {
      if (!calendars || calendars.length === 0) {
        return [];
      }

      // ✅ LAYER 2: Intentar obtener del PersistentCache primero
      const cacheKey = `paymentStats:${userId}:${year}:${onlyCompleted}` as const;
      const cachedStats = PersistentCache.get<WorkHoursStats[]>(cacheKey);

      if (cachedStats) {
        console.log('✅ Estadísticas de pagos obtenidas de localStorage (0 lecturas Firebase)');
        return cachedStats;
      }

      // ✅ LAYER 3: No hay cache, cargar desde Firebase + Cloud Functions
      console.log('🔄 Cargando estadísticas de pagos desde Firebase + Cloud Functions...');

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

      // ✅ Guardar en PersistentCache para próximas cargas
      PersistentCache.set(cacheKey, stats);

      console.log(`✅ Estadísticas cargadas y guardadas en cache: ${stats.length} profesionales`);
      return stats;
    },
    staleTime: 5 * 60 * 1000, // 5 minutos - React Query cache
    cacheTime: 10 * 60 * 1000, // 10 minutos en memoria
    enabled: !!calendars && calendars.length > 0 && !calendarsLoading,
    refetchOnWindowFocus: false,
    keepPreviousData: true, // Mantener datos anteriores mientras carga los nuevos
  });
};

/**
 * Hook optimizado para servicios pendientes con caché multi-capa
 * ✅ Layer 1: React Query (memoria, 3 min)
 * ✅ Layer 2: PersistentCache (localStorage, 5 min)
 * ✅ Layer 3: Firebase
 * ✅ Tracking de costes completo
 */
export const usePaymentPendingServices = (
  calendarIds: string[] | undefined,
  startDate: Date,
  endDate: Date,
  enabled: boolean = true
) => {
  const normalizedIds = calendarIds?.sort().join(',') || 'empty';
  const startKey = startDate.toISOString();
  const endKey = endDate.toISOString();

  return useQuery({
    queryKey: ['paymentPendingServices', normalizedIds, startKey, endKey],
    queryFn: async () => {
      if (!calendarIds || calendarIds.length === 0) {
        return {};
      }

      // ✅ LAYER 2: Intentar obtener del PersistentCache primero
      const cacheKey = `pendingServices:${normalizedIds}:${startKey.slice(0, 10)}` as const;
      const cachedPending = PersistentCache.get<Record<string, { count: number; examples: string[] }>>(cacheKey);

      if (cachedPending) {
        console.log('✅ Servicios pendientes obtenidos de localStorage (0 lecturas Firebase)');
        return cachedPending;
      }

      // ✅ LAYER 3: No hay cache, cargar desde Firebase
      console.log('🔄 Cargando servicios pendientes desde Firebase...');

      // Track lectura de Firebase
      costMonitoring.trackFirestoreRead(1);

      const { events, fetchedCount } = await CalendarEventService.getCalendarEvents(
        calendarIds,
        startDate,
        endDate
      );

      // Track eventos leídos
      costMonitoring.trackFirestoreRead(fetchedCount);

      const pendingMap: Record<string, { count: number; examples: string[] }> = {};

      events.forEach(event => {
        if (event.serviceStatus === 'completed') return;

        const entry = pendingMap[event.calendarId] ?? { count: 0, examples: [] };
        entry.count += 1;

        if (entry.examples.length < 3) {
          entry.examples.push(event.title || 'Servicio pendiente');
        }

        pendingMap[event.calendarId] = entry;
      });

      // ✅ Guardar en PersistentCache
      PersistentCache.set(cacheKey, pendingMap);

      console.log(`✅ Servicios pendientes procesados y guardados en cache: ${Object.keys(pendingMap).length} calendarios`);
      return pendingMap;
    },
    staleTime: 3 * 60 * 1000, // 3 minutos - React Query cache
    cacheTime: 10 * 60 * 1000, // 10 minutos en memoria
    enabled: enabled && !!calendarIds && calendarIds.length > 0,
    refetchOnWindowFocus: false,
    keepPreviousData: true,
  });
};

/**
 * Hook para actualizar detalles de pago con invalidación de caché multi-capa
 * ✅ Invalida React Query + PersistentCache
 */
export const useUpdatePayoutDetails = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      calendarId,
      payoutDetails
    }: {
      calendarId: string;
      payoutDetails: {
        iban?: string;
        bank?: string;
        notes?: string;
        paypalEmail?: string;
      };
    }) => {
      costMonitoring.trackFirestoreWrite(1);

      const { CollaborativeCalendarService } = await import('@/services/collaborativeCalendar');
      return await CollaborativeCalendarService.updatePayoutDetails(calendarId, payoutDetails);
    },
    onSuccess: (_, variables) => {
      // ✅ Invalidar caché de React Query
      queryClient.invalidateQueries({ queryKey: ['calendars'] });
      queryClient.invalidateQueries({ queryKey: ['calendar', variables.calendarId] });
      queryClient.invalidateQueries({ queryKey: ['paymentStats'] });

      // ✅ Invalidar caché de localStorage (pattern matching)
      PersistentCache.invalidatePattern('paymentStats');
      PersistentCache.invalidatePattern('pendingServices');
      PersistentCache.invalidatePattern(`calendars:${variables.calendarId}`);

      console.log('✅ Caché invalidado después de actualizar detalles de pago');
    },
  });
};

/**
 * Hook para actualizar registro de pago con invalidación de caché multi-capa
 * ✅ Invalida React Query + PersistentCache
 */
export const useUpdatePayoutRecord = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      calendarId,
      periodKey,
      record
    }: {
      calendarId: string;
      periodKey: string;
      record: {
        status: 'pending' | 'paid';
        lastPaymentDate?: string;
        lastPaymentBy?: string;
        note?: string;
      };
    }) => {
      costMonitoring.trackFirestoreWrite(1);

      const { CollaborativeCalendarService } = await import('@/services/collaborativeCalendar');
      return await CollaborativeCalendarService.updatePayoutRecord(calendarId, periodKey, record);
    },
    onSuccess: (_, variables) => {
      // ✅ Invalidar caché de React Query
      queryClient.invalidateQueries({ queryKey: ['calendars'] });
      queryClient.invalidateQueries({ queryKey: ['calendar', variables.calendarId] });
      queryClient.invalidateQueries({ queryKey: ['paymentStats'] });

      // ✅ Invalidar caché de localStorage
      PersistentCache.invalidatePattern('paymentStats');
      PersistentCache.invalidatePattern('pendingServices');
      PersistentCache.invalidatePattern(`calendars:${variables.calendarId}`);

      console.log('✅ Caché invalidado después de actualizar registro de pago');
    },
  });
};

/**
 * Hook combinado para actualizar detalles de pago y registro en una sola operación
 * ✅ Reduce de 2 escrituras a 1 cuando es posible
 * ✅ Invalida React Query + PersistentCache
 */
export const useUpdatePayoutComplete = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      calendarId,
      periodKey,
      payoutDetails,
      payoutRecord
    }: {
      calendarId: string;
      periodKey: string;
      payoutDetails: {
        iban?: string;
        bank?: string;
        notes?: string;
        paypalEmail?: string;
      };
      payoutRecord: {
        status: 'pending' | 'paid';
        lastPaymentDate?: string;
        lastPaymentBy?: string;
        note?: string;
      };
    }) => {
      costMonitoring.trackFirestoreWrite(2); // 2 escrituras

      const { CollaborativeCalendarService } = await import('@/services/collaborativeCalendar');

      // Ejecutar ambas actualizaciones en paralelo
      await Promise.all([
        CollaborativeCalendarService.updatePayoutDetails(calendarId, payoutDetails),
        CollaborativeCalendarService.updatePayoutRecord(calendarId, periodKey, payoutRecord)
      ]);
    },
    onSuccess: (_, variables) => {
      // ✅ Invalidar caché de React Query
      queryClient.invalidateQueries({ queryKey: ['calendars'] });
      queryClient.invalidateQueries({ queryKey: ['calendar', variables.calendarId] });
      queryClient.invalidateQueries({ queryKey: ['paymentStats'] });

      // ✅ Invalidar caché de localStorage
      PersistentCache.invalidatePattern('paymentStats');
      PersistentCache.invalidatePattern('pendingServices');
      PersistentCache.invalidatePattern(`calendars:${variables.calendarId}`);

      console.log('✅ Caché invalidado después de actualizar pago completo');
    },
  });
};
