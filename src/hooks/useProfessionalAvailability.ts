import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ProfessionalAvailabilityService } from '@/services/professionalAvailability';
import { ProfessionalAvailability, AvailabilityStatus } from '@/types/calendar';
import { costMonitoring } from '@/utils/costMonitoring';

/**
 * Hook para obtener disponibilidades por rango de fechas con cache
 * ✅ Optimizado: Solo 1 lectura con query compuesta
 */
export const useAvailabilityByDateRange = (
  calendarId: string | undefined,
  startDate: Date,
  endDate: Date,
  status?: AvailabilityStatus
) => {
  const startKey = startDate.toISOString();
  const endKey = endDate.toISOString();
  const statusKey = status ?? 'all';

  return useQuery({
    queryKey: ['availability', 'dateRange', calendarId, startKey, endKey, statusKey],
    queryFn: async () => {
      if (!calendarId) return { availabilities: [], count: 0 };

      costMonitoring.trackFirestoreRead(1); // Query inicial
      const result = await ProfessionalAvailabilityService.getAvailabilityByDateRange(
        calendarId,
        startDate,
        endDate,
        status
      );

      // Track lecturas adicionales (1 por cada disponibilidad)
      costMonitoring.trackFirestoreRead(result.count);

      return result;
    },
    staleTime: 5 * 60 * 1000, // 5 minutos - cache agresivo
    gcTime: 10 * 60 * 1000, // React Query v5 usa gcTime en lugar de cacheTime
    enabled: !!calendarId,
    refetchOnWindowFocus: false,
    placeholderData: (previousData) => previousData, // React Query v5 usa placeholderData en lugar de keepPreviousData
  });
};

/**
 * Hook para obtener solicitudes pendientes (Inbox del owner)
 * ✅ Optimizado: Query con límite para badge y lista
 */
export const usePendingAvailabilities = (
  ownerId: string | undefined,
  calendarIds: string[] | undefined,
  limitCount: number = 50
) => {
  const normalizedIds = calendarIds && calendarIds.length > 0
    ? [...calendarIds].sort().join(',')
    : 'empty';

  return useQuery({
    queryKey: ['availability', 'pending', ownerId, normalizedIds, limitCount],
    queryFn: async () => {
      if (!ownerId || !calendarIds || calendarIds.length === 0) {
        return { availabilities: [], count: 0 };
      }

      costMonitoring.trackFirestoreRead(1); // Query inicial
      const result = await ProfessionalAvailabilityService.getPendingAvailabilities(
        ownerId,
        calendarIds,
        limitCount
      );

      // Track lecturas adicionales
      costMonitoring.trackFirestoreRead(result.count);

      return result;
    },
    staleTime: 2 * 60 * 1000, // 2 minutos - más frecuente para inbox
    gcTime: 10 * 60 * 1000,
    enabled: !!ownerId && !!calendarIds && calendarIds.length > 0,
    refetchOnWindowFocus: true, // Refetch al volver a la ventana para inbox
  });
};

/**
 * Hook para obtener conteo de solicitudes pendientes (para badge)
 * ✅ Optimizado: Solo conteo sin cargar datos
 */
export const usePendingCount = (calendarIds: string[] | undefined) => {
  const normalizedIds = calendarIds && calendarIds.length > 0
    ? [...calendarIds].sort().join(',')
    : 'empty';

  return useQuery({
    queryKey: ['availability', 'pendingCount', normalizedIds],
    queryFn: async () => {
      if (!calendarIds || calendarIds.length === 0) return 0;

      costMonitoring.trackFirestoreRead(1);
      return await ProfessionalAvailabilityService.getPendingCount(calendarIds);
    },
    staleTime: 1 * 60 * 1000, // 1 minuto - muy frecuente para badge
    gcTime: 5 * 60 * 1000,
    enabled: !!calendarIds && calendarIds.length > 0,
    refetchOnWindowFocus: true,
  });
};

/**
 * Hook para crear nueva solicitud de disponibilidad
 * ✅ Solo 1 escritura + invalidación de cache
 */
export const useCreateAvailability = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      data: Omit<ProfessionalAvailability, 'id' | 'status' | 'requestedAt' | 'createdAt' | 'updatedAt'>
    ) => {
      costMonitoring.trackFirestoreWrite(1);
      return await ProfessionalAvailabilityService.createAvailability(data);
    },
    onSuccess: (_, variables) => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: ['availability', 'dateRange', variables.calendarId] });
      queryClient.invalidateQueries({ queryKey: ['availability', 'pending'] });
      queryClient.invalidateQueries({ queryKey: ['availability', 'pendingCount'] });
    },
  });
};

/**
 * Hook para crear múltiples disponibilidades en batch
 * ✅ Escrituras agrupadas (máximo 500 por batch)
 */
export const useCreateBatchAvailabilities = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      dataArray: Omit<ProfessionalAvailability, 'id' | 'status' | 'requestedAt' | 'createdAt' | 'updatedAt'>[]
    ) => {
      const batches = Math.ceil(dataArray.length / 500);
      costMonitoring.trackFirestoreWrite(batches); // 1 batch write por cada 500 items
      return await ProfessionalAvailabilityService.createBatchAvailabilities(dataArray);
    },
    onSuccess: (_, variables) => {
      // Invalidar todas las queries de disponibilidad
      const firstCalendarId = variables[0]?.calendarId;
      if (firstCalendarId) {
        queryClient.invalidateQueries({ queryKey: ['availability', 'dateRange', firstCalendarId] });
      }
      queryClient.invalidateQueries({ queryKey: ['availability', 'pending'] });
      queryClient.invalidateQueries({ queryKey: ['availability', 'pendingCount'] });
    },
  });
};

/**
 * Hook para aprobar solicitud
 * ✅ Solo 1 escritura + optimistic update
 */
export const useApproveAvailability = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      availabilityId,
      reviewedBy,
    }: {
      availabilityId: string;
      reviewedBy: string;
    }) => {
      costMonitoring.trackFirestoreWrite(1);
      return await ProfessionalAvailabilityService.approveAvailability(
        availabilityId,
        reviewedBy
      );
    },
    onMutate: async ({ availabilityId }) => {
      // Cancelar queries en curso
      await queryClient.cancelQueries({ queryKey: ['availability', 'pending'] });

      // Snapshot del estado anterior
      const previousPending = queryClient.getQueryData(['availability', 'pending']);

      // Optimistic update: remover de pending
      queryClient.setQueryData(
        ['availability', 'pending'],
        (old: any) => {
          if (!old) return old;
          return {
            ...old,
            availabilities: old.availabilities.filter((a: ProfessionalAvailability) => a.id !== availabilityId),
            count: old.count - 1,
          };
        }
      );

      return { previousPending };
    },
    onError: (err, variables, context) => {
      // Rollback en caso de error
      if (context?.previousPending) {
        queryClient.setQueryData(['availability', 'pending'], context.previousPending);
      }
    },
    onSuccess: () => {
      // Invalidar todas las queries relacionadas
      queryClient.invalidateQueries({ queryKey: ['availability', 'pending'] });
      queryClient.invalidateQueries({ queryKey: ['availability', 'pendingCount'] });
      queryClient.invalidateQueries({ queryKey: ['availability', 'dateRange'] });
    },
  });
};

/**
 * Hook para rechazar solicitud
 * ✅ Solo 1 escritura + optimistic update
 */
export const useRejectAvailability = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      availabilityId,
      reviewedBy,
      rejectionReason,
    }: {
      availabilityId: string;
      reviewedBy: string;
      rejectionReason?: string;
    }) => {
      costMonitoring.trackFirestoreWrite(1);
      return await ProfessionalAvailabilityService.rejectAvailability(
        availabilityId,
        reviewedBy,
        rejectionReason
      );
    },
    onMutate: async ({ availabilityId }) => {
      await queryClient.cancelQueries({ queryKey: ['availability', 'pending'] });

      const previousPending = queryClient.getQueryData(['availability', 'pending']);

      // Optimistic update: remover de pending
      queryClient.setQueryData(
        ['availability', 'pending'],
        (old: any) => {
          if (!old) return old;
          return {
            ...old,
            availabilities: old.availabilities.filter((a: ProfessionalAvailability) => a.id !== availabilityId),
            count: old.count - 1,
          };
        }
      );

      return { previousPending };
    },
    onError: (err, variables, context) => {
      if (context?.previousPending) {
        queryClient.setQueryData(['availability', 'pending'], context.previousPending);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['availability', 'pending'] });
      queryClient.invalidateQueries({ queryKey: ['availability', 'pendingCount'] });
      queryClient.invalidateQueries({ queryKey: ['availability', 'dateRange'] });
    },
  });
};

/**
 * Hook para aprobar múltiples solicitudes en batch
 * ✅ Escrituras agrupadas + optimistic update
 */
export const useApproveBatchAvailabilities = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      availabilityIds,
      reviewedBy,
    }: {
      availabilityIds: string[];
      reviewedBy: string;
    }) => {
      const batches = Math.ceil(availabilityIds.length / 500);
      costMonitoring.trackFirestoreWrite(batches);
      return await ProfessionalAvailabilityService.approveBatchAvailabilities(
        availabilityIds,
        reviewedBy
      );
    },
    onMutate: async ({ availabilityIds }) => {
      await queryClient.cancelQueries({ queryKey: ['availability', 'pending'] });

      const previousPending = queryClient.getQueryData(['availability', 'pending']);

      // Optimistic update: remover todos los IDs aprobados
      queryClient.setQueryData(
        ['availability', 'pending'],
        (old: any) => {
          if (!old) return old;
          return {
            ...old,
            availabilities: old.availabilities.filter(
              (a: ProfessionalAvailability) => !availabilityIds.includes(a.id)
            ),
            count: old.count - availabilityIds.length,
          };
        }
      );

      return { previousPending };
    },
    onError: (err, variables, context) => {
      if (context?.previousPending) {
        queryClient.setQueryData(['availability', 'pending'], context.previousPending);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['availability', 'pending'] });
      queryClient.invalidateQueries({ queryKey: ['availability', 'pendingCount'] });
      queryClient.invalidateQueries({ queryKey: ['availability', 'dateRange'] });
    },
  });
};

/**
 * Hook para actualizar disponibilidad existente
 * ✅ Solo 1 escritura
 */
export const useUpdateAvailability = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      availabilityId,
      updates,
    }: {
      availabilityId: string;
      updates: Partial<Omit<ProfessionalAvailability, 'id' | 'createdAt'>>;
    }) => {
      costMonitoring.trackFirestoreWrite(1);
      return await ProfessionalAvailabilityService.updateAvailability(
        availabilityId,
        updates
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['availability'] });
    },
  });
};

/**
 * Hook para eliminar disponibilidad
 * ✅ Solo 1 escritura
 */
export const useDeleteAvailability = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      availabilityId,
      calendarId,
    }: {
      availabilityId: string;
      calendarId?: string;
    }) => {
      costMonitoring.trackFirestoreWrite(1);
      return await ProfessionalAvailabilityService.deleteAvailability(availabilityId);
    },
    onSuccess: (_, variables) => {
      if (variables.calendarId) {
        queryClient.invalidateQueries({ queryKey: ['availability', 'dateRange', variables.calendarId] });
      }
      queryClient.invalidateQueries({ queryKey: ['availability', 'pending'] });
      queryClient.invalidateQueries({ queryKey: ['availability', 'pendingCount'] });
    },
  });
};

/**
 * Hook para obtener disponibilidades aprobadas (para mostrar en calendario)
 * Expande recurrencias automáticamente
 */
export const useApprovedAvailabilities = (
  calendarIds: string[] | undefined,
  startDate: Date,
  endDate: Date
) => {
  const startKey = startDate.toISOString();
  const endKey = endDate.toISOString();
  const idsKey = calendarIds ? calendarIds.sort().join(',') : 'empty';

  return useQuery({
    queryKey: ['availability', 'approved', idsKey, startKey, endKey],
    queryFn: async () => {
      if (!calendarIds || calendarIds.length === 0) {
        return [];
      }

      const allApproved: ProfessionalAvailability[] = [];

      // Obtener aprobadas para cada calendario
      for (const calendarId of calendarIds) {
        costMonitoring.trackFirestoreRead(1);
        const result = await ProfessionalAvailabilityService.getAvailabilityByDateRange(
          calendarId,
          startDate,
          endDate,
          'approved'
        );
        costMonitoring.trackFirestoreRead(result.count);
        allApproved.push(...result.availabilities);
      }

      // Expandir recurrencias
      const expanded: ProfessionalAvailability[] = [];

      for (const availability of allApproved) {
        if (availability.recurrence === 'once') {
          // No es recurrente, agregar directamente
          expanded.push(availability);
        } else {
          // Es recurrente, expandir instancias
          const instances = expandRecurrence(availability, startDate, endDate);
          expanded.push(...instances);
        }
      }

      return expanded;
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000,
    enabled: !!calendarIds && calendarIds.length > 0,
    refetchOnWindowFocus: false,
    placeholderData: (previousData) => previousData,
  });
};

/**
 * Expande una disponibilidad recurrente en múltiples instancias dentro del rango de fechas
 */
function expandRecurrence(
  availability: ProfessionalAvailability,
  rangeStart: Date,
  rangeEnd: Date
): ProfessionalAvailability[] {
  const instances: ProfessionalAvailability[] = [];
  const baseDate = new Date(availability.date);

  // Fecha límite: recurrenceEndDate o rangeEnd
  const limitDate = availability.recurrenceEndDate
    ? new Date(Math.min(availability.recurrenceEndDate.getTime(), rangeEnd.getTime()))
    : rangeEnd;

  let currentDate = new Date(baseDate);

  // Protección: máximo 365 instancias
  let count = 0;
  const MAX_INSTANCES = 365;

  while (currentDate <= limitDate && count < MAX_INSTANCES) {
    // Solo agregar si está dentro del rango
    if (currentDate >= rangeStart && currentDate <= rangeEnd) {
      instances.push({
        ...availability,
        id: `${availability.id}-${currentDate.toISOString().split('T')[0]}`,
        date: new Date(currentDate),
      });
    }

    // Avanzar según tipo de recurrencia
    switch (availability.recurrence) {
      case 'daily':
        currentDate.setDate(currentDate.getDate() + 1);
        break;
      case 'weekly':
        currentDate.setDate(currentDate.getDate() + 7);
        break;
      case 'monthly':
        currentDate.setMonth(currentDate.getMonth() + 1);
        break;
      default:
        // No debería llegar aquí
        return instances;
    }

    count++;
  }

  return instances;
}
