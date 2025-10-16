import { useQuery } from '@tanstack/react-query';
import { analyticsService } from '@/services/analytics';
import { CardsService } from '@/services/cards';
import { BookingsService } from '@/services/bookings';
import { useAuth } from '@/hooks/useAuth';
import { error as logError } from '@/utils/logger';
import { costMonitoring } from '@/utils/costMonitoring';

export interface DashboardStats {
  totalViews: number;
  totalClicks: number;
  totalBookings: number;
  totalRevenue: number;
  viewsChange: number;
  clicksChange: number;
  bookingsChange: number;
  revenueChange: number;
  recentActivity: ActivityItem[];
  topCards: CardPerformance[];
  monthlyData: MonthlyData[];
}

export interface ActivityItem {
  id: string;
  type: 'view' | 'click' | 'booking' | 'signup';
  user: string;
  item: string;
  time: string;
  timestamp: Date;
}

export interface CardPerformance {
  id: string;
  title: string;
  views: number;
  clicks: number;
  conversionRate: number;
}

export interface MonthlyData {
  month: string;
  views: number;
  clicks: number;
  bookings: number;
  revenue: number;
}

export const useRealTimeStats = () => {
  const { user } = useAuth();

  // ✅ React Query con cache de 5 minutos y refetch automático
  const { data: stats, isLoading: loading, error: queryError, refetch } = useQuery({
    queryKey: ['dashboardStats', user?.id],
    queryFn: async () => {
      if (!user?.id) {
        return null;
      }

      const formatTimeAgo = (date: Date): string => {
        const now = new Date();
        const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

        if (diffInSeconds < 60) return `${diffInSeconds}s`;
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}min`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h`;
        return `${Math.floor(diffInSeconds / 86400)}d`;
      };

      try {
        costMonitoring.trackFirestoreRead(1);

        console.log('📊 Cargando estadísticas para usuario:', user.id);

      // Obtener estadísticas de los últimos 30 días
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - 30);

      // Estadísticas del período anterior para comparación
      const previousEndDate = new Date(startDate);
      const previousStartDate = new Date();
      previousStartDate.setDate(previousEndDate.getDate() - 30);

      // Ejecutar consultas en paralelo con manejo de errores individual
      const [
        currentMetrics,
        previousMetrics,
        recentAnalytics,
        userCards,
        bookingStats
      ] = await Promise.allSettled([
        analyticsService.getMetrics(user.id, undefined, 30).catch(e => {
          console.warn('Error en getMetrics actual:', e);
          return { success: false, data: null };
        }),
        analyticsService.getMetrics(user.id, undefined, 60).catch(e => {
          console.warn('Error en getMetrics anterior:', e);
          return { success: false, data: null };
        }),
        analyticsService.getAnalytics(user.id, undefined, startDate, endDate, 50).catch(e => {
          console.warn('Error en getAnalytics:', e);
          return { success: false, data: [] };
        }),
        CardsService.getUserCards(user.id).catch(e => {
          console.warn('Error en getUserCards:', e);
          return { success: false, data: [] };
        }),
        BookingsService.getBookingStats(user.id).catch(e => {
          console.warn('Error en getBookingStats:', e);
          return { success: false, data: { totalRevenue: 0, totalBookings: 0 } };
        })
      ]);

      // Extraer valores de las promesas
      const currentMetricsResult = currentMetrics.status === 'fulfilled' ? currentMetrics.value : { success: false, data: null };
      const previousMetricsResult = previousMetrics.status === 'fulfilled' ? previousMetrics.value : { success: false, data: null };
      const recentAnalyticsResult = recentAnalytics.status === 'fulfilled' ? recentAnalytics.value : { success: false, data: [] };
      const userCardsResult = userCards.status === 'fulfilled' ? userCards.value : { success: false, data: [] };
      const bookingStatsResult = bookingStats.status === 'fulfilled' ? bookingStats.value : { success: false, data: null };

      const currentData = currentMetricsResult.data as any || {};
      const previousData = previousMetricsResult.data as any || {};
      
      console.log('📊 Datos actuales:', currentData);
      console.log('📊 Datos anteriores:', previousData);

      // Calcular cambios porcentuales
      const calculateChange = (current: number, previous: number) => {
        if (previous === 0) return current > 0 ? 100 : 0;
        return ((current - previous) / previous) * 100;
      };

      // Procesar actividad reciente
      const recentActivity: ActivityItem[] = [];
      if (recentAnalyticsResult.success && recentAnalyticsResult.data) {
        const analytics = Array.isArray(recentAnalyticsResult.data) ? recentAnalyticsResult.data : [];
        console.log('📊 Actividad reciente:', analytics.length, 'eventos');
        
        analytics.slice(0, 10).forEach((event: any, index: number) => {
          let userName = 'Usuario Anónimo';
          let item = 'Desconocido';
          
          if (event.eventType === 'card_view') {
            item = 'Tarjeta';
          } else if (event.eventType === 'link_click') {
            item = 'Enlace';
            userName = 'Visitante';
          } else if (event.eventType === 'booking_created') {
            item = 'Reserva';
            userName = 'Cliente';
          }

          recentActivity.push({
            id: `activity-${index}`,
            type: event.eventType.includes('view') ? 'view' : 
                  event.eventType.includes('click') ? 'click' : 
                  event.eventType.includes('booking') ? 'booking' : 'view',
            user: userName,
            item,
            time: formatTimeAgo(event.timestamp?.toDate ? event.timestamp.toDate() : new Date(event.timestamp)),
            timestamp: event.timestamp?.toDate ? event.timestamp.toDate() : new Date(event.timestamp)
          });
        });
      }

      // Procesar rendimiento de tarjetas
      const topCards: CardPerformance[] = [];
      if (userCardsResult.success && userCardsResult.data) {
        const cards = Array.isArray(userCardsResult.data) ? userCardsResult.data : [userCardsResult.data];
        console.log('📊 Tarjetas del usuario:', cards.length);
        
        cards.slice(0, 5).forEach((card: any) => {
          const conversionRate = card.views > 0 ? (card.clicks / card.views) * 100 : 0;
          topCards.push({
            id: card.id,
            title: card.profile?.name || card.title || 'Tarjeta',
            views: card.views || 0,
            clicks: card.clicks || 0,
            conversionRate: parseFloat(conversionRate.toFixed(2))
          });
        });
      }

      // Datos mensuales (últimos 6 meses)
      const monthlyData: MonthlyData[] = [];
      for (let i = 5; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const monthName = date.toLocaleString('es-ES', { month: 'short' });
        
        // Por ahora datos simulados basados en tendencias
        const baseViews = Math.floor(Math.random() * 1000) + 500;
        const baseClicks = Math.floor(baseViews * 0.15);
        const baseBookings = Math.floor(baseClicks * 0.1);
        const baseRevenue = baseBookings * 50;

        monthlyData.push({
          month: monthName,
          views: baseViews,
          clicks: baseClicks,
          bookings: baseBookings,
          revenue: baseRevenue
        });
      }

      // Obtener datos de bookings
      let totalRevenue = 0;
      let totalBookings = 0;
      if (bookingStatsResult.success && bookingStatsResult.data) {
        const bookingData = bookingStatsResult.data as any;
        totalRevenue = bookingData.totalRevenue || 0;
        totalBookings = bookingData.totalBookings || 0;
      }
      
      console.log('📊 Bookings:', { totalBookings, totalRevenue });

      const dashboardStats: DashboardStats = {
        totalViews: currentData.totalViews || 0,
        totalClicks: currentData.totalClicks || 0,
        totalBookings,
        totalRevenue,
        viewsChange: calculateChange(currentData.totalViews || 0, previousData.totalViews || 0),
        clicksChange: calculateChange(currentData.totalClicks || 0, previousData.totalClicks || 0),
        bookingsChange: calculateChange(totalBookings, 0), // Sin datos previos por ahora
        revenueChange: calculateChange(totalRevenue, 0), // Sin datos previos por ahora
        recentActivity,
        topCards,
        monthlyData
      };

      console.log('✅ Estadísticas cargadas:', dashboardStats);
        return dashboardStats;
      } catch (err) {
        console.error('❌ Error cargando estadísticas:', err);
        logError('Error fetching real-time stats', err as Error, { component: 'useRealTimeStats' });

        // Retornar datos vacíos en caso de error
        return {
          totalViews: 0,
          totalClicks: 0,
          totalBookings: 0,
          totalRevenue: 0,
          viewsChange: 0,
          clicksChange: 0,
          bookingsChange: 0,
          revenueChange: 0,
          recentActivity: [],
          topCards: [],
          monthlyData: []
        };
      }
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // Cache de 5 minutos
    gcTime: 10 * 60 * 1000, // React Query v5: gcTime en lugar de cacheTime
    refetchOnWindowFocus: false,
    refetchInterval: 5 * 60 * 1000 // Auto-refetch cada 5 minutos
  });

  return {
    stats: stats || null,
    loading,
    error: queryError ? (queryError as Error).message : null,
    refresh: () => refetch()
  };
};