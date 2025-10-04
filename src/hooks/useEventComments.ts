import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { EventCommentService } from '@/services/collaborativeCalendar';
import { EventComment } from '@/types/calendar';
import { costMonitoring } from '@/utils/costMonitoring';

/**
 * Hook para cargar comentarios de un evento con React Query
 * Cache de 5 minutos para reducir lecturas de Firebase
 */
export const useEventComments = (eventId: string | undefined) => {
  return useQuery({
    queryKey: ['eventComments', eventId],
    queryFn: async () => {
      if (!eventId) return [];

      costMonitoring.trackFirestoreRead(1);
      const comments = await EventCommentService.getEventComments(eventId);
      costMonitoring.trackFirestoreRead(comments.length);

      return comments;
    },
    enabled: !!eventId,
    staleTime: 5 * 60 * 1000, // 5 minutos
    cacheTime: 10 * 60 * 1000, // 10 minutos
    refetchOnWindowFocus: false,
  });
};

/**
 * Hook para agregar comentarios con optimistic updates
 */
export const useAddEventComment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      eventId,
      userId,
      userName,
      content
    }: {
      eventId: string;
      userId: string;
      userName: string;
      content: string;
    }) => {
      costMonitoring.trackFirestoreWrite(1);
      return await EventCommentService.addComment(eventId, userId, userName, content);
    },
    onSuccess: (_, variables) => {
      // Invalidar cache para refrescar comentarios
      queryClient.invalidateQueries({ queryKey: ['eventComments', variables.eventId] });
    },
  });
};

/**
 * Hook para eliminar comentarios
 */
export const useDeleteEventComment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      commentId,
      eventId
    }: {
      commentId: string;
      eventId: string;
    }) => {
      costMonitoring.trackFirestoreWrite(1);
      await EventCommentService.deleteComment(commentId);
    },
    onSuccess: (_, variables) => {
      // Invalidar cache para refrescar comentarios
      queryClient.invalidateQueries({ queryKey: ['eventComments', variables.eventId] });
    },
  });
};
