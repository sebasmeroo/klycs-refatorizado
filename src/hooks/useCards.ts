import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CardsService } from '@/services/cards';
import { costMonitoring } from '@/utils/costMonitoring';

/**
 * Hook para obtener tarjetas del usuario con cache de 5 minutos
 */
export const useUserCards = (userId: string | undefined) => {
  return useQuery({
    queryKey: ['cards', userId],
    queryFn: async () => {
      if (!userId) return [];

      costMonitoring.trackFirestoreRead(1);
      const cards = await CardsService.getUserCards(userId);

      // Track lecturas adicionales (1 por cada tarjeta)
      costMonitoring.trackFirestoreRead(cards.length);
      return cards;
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
    cacheTime: 10 * 60 * 1000,
    enabled: !!userId,
    refetchOnWindowFocus: false,
  });
};

/**
 * Hook para obtener una tarjeta específica con cache
 */
export const useCard = (cardId: string | undefined) => {
  return useQuery({
    queryKey: ['card', cardId],
    queryFn: async () => {
      if (!cardId) return null;

      costMonitoring.trackFirestoreRead(1);
      const card = await CardsService.getCard(cardId);

      return card;
    },
    staleTime: 5 * 60 * 1000,
    cacheTime: 10 * 60 * 1000,
    enabled: !!cardId,
    refetchOnWindowFocus: false,
  });
};

/**
 * Hook para obtener tarjeta por slug con cache
 */
export const useCardBySlug = (slug: string | undefined) => {
  return useQuery({
    queryKey: ['cardBySlug', slug],
    queryFn: async () => {
      if (!slug) return null;

      costMonitoring.trackFirestoreRead(1);
      const card = await CardsService.getCardBySlug(slug);

      return card;
    },
    staleTime: 5 * 60 * 1000,
    cacheTime: 10 * 60 * 1000,
    enabled: !!slug,
    refetchOnWindowFocus: false,
  });
};

/**
 * Hook para crear una tarjeta con invalidación automática
 */
export const useCreateCard = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (cardData: any) => {
      costMonitoring.trackFirestoreWrite(1);
      return await CardsService.createCard(cardData.userId, cardData);
    },
    onSuccess: (_, variables) => {
      // Invalidar cache de tarjetas del usuario
      queryClient.invalidateQueries({ queryKey: ['cards', variables.userId] });
    },
  });
};

/**
 * Hook para actualizar una tarjeta
 */
export const useUpdateCard = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      cardId,
      userId,
      updates
    }: {
      cardId: string;
      userId: string;
      updates: any;
    }) => {
      costMonitoring.trackFirestoreWrite(1);
      return await CardsService.updateCard(cardId, userId, updates);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['card', variables.cardId] });
      queryClient.invalidateQueries({ queryKey: ['cards'] });
    },
  });
};

/**
 * Hook para eliminar una tarjeta
 */
export const useDeleteCard = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ cardId, userId }: { cardId: string; userId: string }) => {
      costMonitoring.trackFirestoreWrite(1);
      return await CardsService.deleteCard(cardId, userId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cards'] });
    },
  });
};

/**
 * Hook para incrementar vistas de una tarjeta
 * NOTA: Este hook NO usa cache porque cada vista debe contarse
 */
export const useIncrementCardViews = () => {
  return useMutation({
    mutationFn: async (cardId: string) => {
      costMonitoring.trackFirestoreWrite(1);
      return await CardsService.incrementViewCount(cardId);
    },
    // No invalidar cache aquí para evitar recargas innecesarias
  });
};
