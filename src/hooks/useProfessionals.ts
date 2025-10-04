import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CollaborativeCalendarService } from '@/services/collaborativeCalendar';
import { costMonitoring } from '@/utils/costMonitoring';

/**
 * Hook para obtener profesionales con cache de 5 minutos
 */
export const useProfessionals = (userId: string | undefined) => {
  return useQuery({
    queryKey: ['professionals', userId],
    queryFn: async () => {
      if (!userId) return [];

      costMonitoring.trackFirestoreRead(1);
      const professionals = await CollaborativeCalendarService.getProfessionals(userId);
      costMonitoring.trackFirestoreRead(professionals.length);

      return professionals;
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutos
    cacheTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
};

/**
 * Hook para actualizar un profesional
 */
export const useUpdateProfessional = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      calendarId,
      professionalId,
      updates
    }: {
      calendarId: string;
      professionalId: string;
      updates: any;
    }) => {
      costMonitoring.trackFirestoreWrite(1);
      return await CollaborativeCalendarService.updateProfessional(
        calendarId,
        professionalId,
        updates
      );
    },
    onSuccess: (_, variables) => {
      // Invalidar cache de profesionales
      queryClient.invalidateQueries({ queryKey: ['professionals'] });
    },
  });
};
