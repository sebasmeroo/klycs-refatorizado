import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { BookingsService, BookingData } from '@/services/bookings';
import { costMonitoring } from '@/utils/costMonitoring';

/**
 * Hook para obtener reservas del usuario con cache de 5 minutos
 */
export const useUserBookings = (
  userId: string | undefined,
  filters?: {
    status?: string;
    dateFrom?: string;
    dateTo?: string;
    searchTerm?: string;
  }
) => {
  return useQuery({
    queryKey: ['bookings', userId, filters],
    queryFn: async () => {
      if (!userId) return { success: false, data: [] };

      // Track lectura para monitoreo de costes
      costMonitoring.trackFirestoreRead(1);

      const result = await BookingsService.getUserBookings(userId, filters);

      // Track lecturas adicionales (estimado: 1 lectura por cada 10 bookings)
      if (result.data) {
        costMonitoring.trackFirestoreRead(Math.ceil(result.data.length / 10));
      }

      return result;
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
    cacheTime: 10 * 60 * 1000, // 10 minutos
    enabled: !!userId, // Solo ejecutar si hay userId
    refetchOnWindowFocus: false,
  });
};

/**
 * Hook para obtener estadísticas de reservas con cache de 5 minutos
 */
export const useBookingStats = (userId: string | undefined) => {
  return useQuery({
    queryKey: ['bookingStats', userId],
    queryFn: async () => {
      if (!userId) return { success: false, data: null };

      costMonitoring.trackFirestoreRead(1);
      return await BookingsService.getBookingStats(userId);
    },
    staleTime: 5 * 60 * 1000,
    cacheTime: 10 * 60 * 1000,
    enabled: !!userId,
    refetchOnWindowFocus: false,
  });
};

/**
 * Hook para crear una reserva con invalidación automática del cache
 */
export const useCreateBooking = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (bookingData: Omit<BookingData, 'createdAt' | 'status' | 'updatedAt'>) => {
      costMonitoring.trackFirestoreWrite(1);
      return await BookingsService.createBooking(bookingData);
    },
    onSuccess: (_, variables) => {
      // Invalidar cache de reservas del usuario
      queryClient.invalidateQueries({ queryKey: ['bookings', variables.userId] });
      queryClient.invalidateQueries({ queryKey: ['bookingStats', variables.userId] });
    },
  });
};

/**
 * Hook para actualizar una reserva con invalidación automática del cache
 */
export const useUpdateBooking = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      bookingId,
      updates
    }: {
      bookingId: string;
      updates: Partial<BookingData>
    }) => {
      costMonitoring.trackFirestoreWrite(1);
      return await BookingsService.updateBooking(bookingId, updates);
    },
    onSuccess: () => {
      // Invalidar todos los caches de bookings
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['bookingStats'] });
    },
  });
};

/**
 * Hook para cancelar una reserva con invalidación automática del cache
 */
export const useCancelBooking = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (bookingId: string) => {
      costMonitoring.trackFirestoreWrite(1);
      return await BookingsService.cancelBooking(bookingId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['bookingStats'] });
    },
  });
};
