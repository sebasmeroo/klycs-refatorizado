import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CollaborativeCalendarService, CalendarEventService } from '@/services/collaborativeCalendar';
import { SharedCalendar } from '@/types/calendar';
import { costMonitoring } from '@/utils/costMonitoring';

/**
 * Hook para obtener calendarios del usuario con cache de 5 minutos
 */
export const useUserCalendars = (userId: string | undefined) => {
  return useQuery({
    queryKey: ['calendars', userId],
    queryFn: async () => {
      if (!userId) return [];

      costMonitoring.trackFirestoreRead(1);
      const calendars = await CollaborativeCalendarService.getUserCalendars(userId);

      // Track lecturas adicionales (1 por cada calendario)
      costMonitoring.trackFirestoreRead(calendars.length);

      return calendars;
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
    cacheTime: 10 * 60 * 1000, // 10 minutos
    enabled: !!userId,
    refetchOnWindowFocus: false,
  });
};

/**
 * Hook para obtener un calendario específico con cache
 */
export const useCalendar = (calendarId: string | undefined) => {
  return useQuery({
    queryKey: ['calendar', calendarId],
    queryFn: async () => {
      if (!calendarId) return null;

      costMonitoring.trackFirestoreRead(1);
      return await CollaborativeCalendarService.getCalendarById(calendarId);
    },
    staleTime: 5 * 60 * 1000,
    cacheTime: 10 * 60 * 1000,
    enabled: !!calendarId,
    refetchOnWindowFocus: false,
  });
};

/**
 * Hook para obtener eventos de un calendario con cache
 */
export const useCalendarEvents = (
  calendarId: string | undefined,
  options?: { startDate?: Date; endDate?: Date }
) => {
  const startKey = options?.startDate?.toISOString() ?? 'start';
  const endKey = options?.endDate?.toISOString() ?? 'end';

  return useQuery({
    queryKey: ['calendarEvents', calendarId, startKey, endKey],
    queryFn: async () => {
      if (!calendarId) return [];

      costMonitoring.trackFirestoreRead(1);
      const { events, fetchedCount } = await CalendarEventService.getCalendarEvents(
        [calendarId],
        options?.startDate,
        options?.endDate
      );

      // Track lecturas adicionales (1 por cada evento)
      costMonitoring.trackFirestoreRead(fetchedCount);

      return events;
    },
    staleTime: 3 * 60 * 1000,
    cacheTime: 10 * 60 * 1000,
    enabled: !!calendarId,
    refetchOnWindowFocus: false,
    keepPreviousData: true,
  });
};

/**
 * Hook para obtener eventos de múltiples calendarios con cache
 */
export const useMultipleCalendarEvents = (
  calendarIds: string[] | undefined,
  options?: { startDate?: Date; endDate?: Date }
) => {
  const normalizedIds = calendarIds && calendarIds.length > 0
    ? [...calendarIds].sort().join(',')
    : 'empty';
  const startKey = options?.startDate?.toISOString() ?? 'start';
  const endKey = options?.endDate?.toISOString() ?? 'end';

  return useQuery({
    queryKey: ['multipleCalendarEvents', normalizedIds, startKey, endKey],
    queryFn: async () => {
      if (!calendarIds || calendarIds.length === 0) return [];

      costMonitoring.trackFirestoreRead(1);
      const { events, fetchedCount } = await CalendarEventService.getCalendarEvents(
        calendarIds,
        options?.startDate,
        options?.endDate
      );

      // Track lecturas adicionales (1 por cada evento)
      costMonitoring.trackFirestoreRead(fetchedCount);

      return events;
    },
    staleTime: 3 * 60 * 1000,
    cacheTime: 10 * 60 * 1000,
    enabled: !!calendarIds && calendarIds.length > 0,
    refetchOnWindowFocus: false,
    keepPreviousData: true,
  });
};

/**
 * Hook para crear un calendario con invalidación automática del cache
 */
export const useCreateCalendar = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      ownerId,
      name,
      description,
      color
    }: {
      ownerId: string;
      name: string;
      description?: string;
      color?: string;
    }) => {
      costMonitoring.trackFirestoreWrite(1);
      return await CollaborativeCalendarService.createCalendar(
        ownerId,
        name,
        description,
        color
      );
    },
    onSuccess: (_, variables) => {
      // Invalidar cache de calendarios del usuario
      queryClient.invalidateQueries({ queryKey: ['calendars', variables.ownerId] });
    },
  });
};

/**
 * Hook para crear un calendario profesional con invalidación automática
 */
export const useCreateProfessionalCalendar = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (calendarData: Omit<SharedCalendar, 'id' | 'createdAt' | 'updatedAt'>) => {
      costMonitoring.trackFirestoreWrite(1);
      return await CollaborativeCalendarService.createProfessionalCalendar(calendarData);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['calendars', variables.ownerId] });
    },
  });
};

/**
 * Hook para actualizar configuración del calendario
 */
export const useUpdateCalendarSettings = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      calendarId,
      settings
    }: {
      calendarId: string;
      settings: Partial<any>;
    }) => {
      costMonitoring.trackFirestoreWrite(1);
      return await CollaborativeCalendarService.updateCalendarSettings(calendarId, settings);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['calendar', variables.calendarId] });
      queryClient.invalidateQueries({ queryKey: ['calendars'] });
    },
  });
};

/**
 * Hook para crear un evento con invalidación automática
 */
export const useCreateEvent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (eventData: any) => {
      costMonitoring.trackFirestoreWrite(1);
      return await CollaborativeCalendarService.createEvent(eventData);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['calendarEvents', variables.calendarId] });
    },
  });
};

/**
 * Hook para actualizar un evento
 */
export const useUpdateEvent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      eventId,
      calendarId,
      updates
    }: {
      eventId: string;
      calendarId: string;
      updates: any;
    }) => {
      costMonitoring.trackFirestoreWrite(1);
      return await CollaborativeCalendarService.updateEvent(eventId, updates);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['calendarEvents', variables.calendarId] });
    },
  });
};

/**
 * Hook para eliminar un evento
 */
export const useDeleteEvent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      eventId,
      calendarId
    }: {
      eventId: string;
      calendarId: string;
    }) => {
      costMonitoring.trackFirestoreWrite(1);
      return await CollaborativeCalendarService.deleteEvent(eventId);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['calendarEvents', variables.calendarId] });
    },
  });
};
