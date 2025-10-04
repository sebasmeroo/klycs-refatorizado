import { useQuery } from '@tanstack/react-query';
import { subscriptionsService } from '@/services/subscriptions';
import { useAuth } from '@/hooks/useAuth';

export interface SubscriptionStatus {
  isActive: boolean;
  planName: string;
  currentPeriodEnd: Date | null;
  daysUntilExpiration: number | null;
  isExpiringSoon: boolean; // Menos de 7 días
  canAccessFeature: (feature: 'cards' | 'calendars' | 'professionals' | 'bookings') => boolean;
}

/**
 * Hook para verificar el estado de la suscripción del usuario
 * y bloquear funciones si está expirada
 */
export const useSubscriptionStatus = () => {
  const { user, firebaseUser } = useAuth();
  const userId = user?.id || firebaseUser?.uid;

  const { data: subscriptionStatus, isLoading, error } = useQuery({
    queryKey: ['subscriptionStatus', userId],
    queryFn: async (): Promise<SubscriptionStatus> => {
      if (!userId) {
        return {
          isActive: false,
          planName: 'FREE',
          currentPeriodEnd: null,
          daysUntilExpiration: null,
          isExpiringSoon: false,
          canAccessFeature: () => false
        };
      }

      try {
        // Obtener suscripción actual
        const result = await subscriptionsService.getUserSubscription(userId);

        if (!result.success || !result.data) {
          // Sin suscripción = FREE por defecto
          return {
            isActive: true,
            planName: 'FREE',
            currentPeriodEnd: null,
            daysUntilExpiration: null,
            isExpiringSoon: false,
            canAccessFeature: (feature) => {
              // FREE solo puede crear 1 tarjeta
              if (feature === 'cards') return true; // La validación se hace al crear
              return false; // No puede acceder a calendarios, profesionales ni reservas
            }
          };
        }

        const subscription = result.data;
        const now = new Date();
        const periodEnd = subscription.currentPeriodEnd;

        // Verificar si está activa
        const isActive = ['active', 'trialing'].includes(subscription.status);

        // Calcular días hasta expiración
        let daysUntilExpiration: number | null = null;
        let isExpiringSoon = false;

        if (periodEnd) {
          const diffTime = periodEnd.getTime() - now.getTime();
          daysUntilExpiration = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          isExpiringSoon = daysUntilExpiration <= 7 && daysUntilExpiration > 0;
        }

        const planName = subscription.plan.name;

        return {
          isActive,
          planName,
          currentPeriodEnd: periodEnd,
          daysUntilExpiration,
          isExpiringSoon,
          canAccessFeature: (feature) => {
            if (!isActive) return false;

            const planLower = planName.toLowerCase();

            // FREE
            if (planLower === 'free' || planLower === 'básico') {
              return feature === 'cards'; // Solo tarjetas
            }

            // PRO
            if (planLower === 'pro' || planLower === 'profesional' || planLower === 'pro anual') {
              if (feature === 'cards') return true;
              if (feature === 'calendars') return true;
              if (feature === 'professionals') return true;
              if (feature === 'bookings') return true;
              return false;
            }

            // BUSINESS
            if (planLower === 'business' || planLower === 'business anual') {
              return true; // Todo ilimitado
            }

            return false;
          }
        };

      } catch (error) {
        console.error('Error obteniendo estado de suscripción:', error);
        // En caso de error, asumir FREE
        return {
          isActive: true,
          planName: 'FREE',
          currentPeriodEnd: null,
          daysUntilExpiration: null,
          isExpiringSoon: false,
          canAccessFeature: (feature) => feature === 'cards'
        };
      }
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos
  });

  return {
    subscriptionStatus,
    isLoading,
    error,
    isActive: subscriptionStatus?.isActive ?? false,
    planName: subscriptionStatus?.planName ?? 'FREE',
    isExpiringSoon: subscriptionStatus?.isExpiringSoon ?? false,
    daysUntilExpiration: subscriptionStatus?.daysUntilExpiration ?? null,
    canAccessFeature: (feature: 'cards' | 'calendars' | 'professionals' | 'bookings') => {
      return subscriptionStatus?.canAccessFeature(feature) ?? false;
    }
  };
};
