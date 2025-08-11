import { useState, useEffect } from 'react';
import { analyticsService } from '@/services/analytics';
import { CardsService } from '@/services/cards';
import { BookingsService } from '@/services/bookings';
import { useAuth } from '@/hooks/useAuth';
import { error as logError } from '@/utils/logger';

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
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      setError(null);

      // Obtener estadísticas de los últimos 30 días
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - 30);

      // Estadísticas del período anterior para comparación
      const previousEndDate = new Date(startDate);
      const previousStartDate = new Date();
      previousStartDate.setDate(previousEndDate.getDate() - 30);

      // Ejecutar consultas en paralelo
      const [
        currentMetrics,
        previousMetrics,
        recentAnalytics,
        userCards,
        bookingStats
      ] = await Promise.all([
        analyticsService.getMetrics(user.id, undefined, 30),
        analyticsService.getMetrics(user.id, undefined, 30),
        analyticsService.getAnalytics(user.id, undefined, startDate, endDate, 50),
        CardsService.getUserCards(user.id),
        BookingsService.getBookingStats(user.id)
      ]);

      if (!currentMetrics.success || !currentMetrics.data) {
        throw new Error('Error al obtener métricas actuales');
      }

      const currentData = currentMetrics.data as any;
      const previousData = previousMetrics.data as any || {};

      // Calcular cambios porcentuales
      const calculateChange = (current: number, previous: number) => {
        if (previous === 0) return current > 0 ? 100 : 0;
        return ((current - previous) / previous) * 100;
      };

      // Procesar actividad reciente
      const recentActivity: ActivityItem[] = [];
      if (recentAnalytics.success && recentAnalytics.data) {
        const analytics = recentAnalytics.data as any[];
        analytics.slice(0, 10).forEach((event, index) => {
          let user = 'Usuario Anónimo';
          let item = 'Desconocido';
          
          if (event.eventType === 'card_view') {
            item = 'Tarjeta';
          } else if (event.eventType === 'link_click') {
            item = 'Enlace';
            user = 'Visitante';
          } else if (event.eventType === 'booking_created') {
            item = 'Reserva';
            user = 'Cliente';
          }

          recentActivity.push({
            id: `activity-${index}`,
            type: event.eventType.includes('view') ? 'view' : 
                  event.eventType.includes('click') ? 'click' : 
                  event.eventType.includes('booking') ? 'booking' : 'view',
            user,
            item,
            time: formatTimeAgo(event.timestamp),
            timestamp: event.timestamp
          });
        });
      }

      // Procesar rendimiento de tarjetas
      const topCards: CardPerformance[] = [];
      if (userCards.success && userCards.data) {
        const cards = Array.isArray(userCards.data) ? userCards.data : [userCards.data];
        cards.slice(0, 5).forEach(card => {
          const conversionRate = card.views > 0 ? (card.clicks / card.views) * 100 : 0;
          topCards.push({
            id: card.id,
            title: card.title,
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
      if (bookingStats.success && bookingStats.data) {
        const bookingData = bookingStats.data as any;
        totalRevenue = bookingData.totalRevenue || 0;
        totalBookings = bookingData.totalBookings || 0;
      }

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

      setStats(dashboardStats);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar estadísticas');
      logError('Error fetching real-time stats', err as Error, { component: 'useRealTimeStats' });
    } finally {
      setLoading(false);
    }
  };

  const formatTimeAgo = (date: Date): string => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return `${diffInSeconds}s`;
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}min`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h`;
    return `${Math.floor(diffInSeconds / 86400)}d`;
  };

  // Actualizar estadísticas cada 5 minutos
  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [user?.id]);

  // Función para refrescar manualmente
  const refresh = () => {
    fetchStats();
  };

  return {
    stats,
    loading,
    error,
    refresh
  };
};