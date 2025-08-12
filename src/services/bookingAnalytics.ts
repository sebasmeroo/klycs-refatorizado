import { 
  collection, 
  query, 
  where, 
  getDocs,
  orderBy,
  limit,
  startAfter,
  endAt,
  startAt
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { AdvancedBookingData, AdvancedBookingsService } from './advancedBookings';
import { secureLogger } from '@/utils/secureLogger';

export interface BookingMetrics {
  totalBookings: number;
  confirmedBookings: number;
  cancelledBookings: number;
  completedBookings: number;
  noShowBookings: number;
  totalRevenue: number;
  averageBookingValue: number;
  conversionRate: number;
  cancellationRate: number;
  noShowRate: number;
  repeatClientRate: number;
}

export interface TimeSlotAnalytics {
  timeSlot: string;
  totalBookings: number;
  revenue: number;
  averageOccupancy: number;
  preferenceScore: number;
}

export interface ServiceAnalytics {
  serviceId: string;
  serviceName: string;
  totalBookings: number;
  revenue: number;
  averageDuration: number;
  popularityRank: number;
  profitabilityScore: number;
}

export interface ClientAnalytics {
  totalClients: number;
  newClients: number;
  returningClients: number;
  averageBookingsPerClient: number;
  clientLifetimeValue: number;
  topClients: {
    email: string;
    name: string;
    totalBookings: number;
    totalSpent: number;
  }[];
}

export interface TrendAnalysis {
  period: 'daily' | 'weekly' | 'monthly';
  data: {
    date: string;
    bookings: number;
    revenue: number;
    newClients: number;
  }[];
  growth: {
    bookingsGrowth: number;
    revenueGrowth: number;
    clientGrowth: number;
  };
}

export interface PredictiveInsights {
  busyPeriods: {
    date: string;
    expectedBookings: number;
    confidence: number;
  }[];
  revenueProjection: {
    month: string;
    projectedRevenue: number;
    confidence: number;
  }[];
  capacityOptimization: {
    timeSlot: string;
    currentUtilization: number;
    recommendedAction: 'increase_slots' | 'reduce_slots' | 'maintain' | 'add_buffer';
    potentialImpact: number;
  }[];
}

export interface OperationalInsights {
  peakHours: string[];
  slowHours: string[];
  optimalBufferTimes: { [serviceId: string]: number };
  recommendedPricing: { [serviceId: string]: number };
  staffingRecommendations: {
    date: string;
    timeSlot: string;
    recommendedStaff: number;
    reasoning: string;
  }[];
}

export class BookingAnalyticsService {
  private static cache = new Map<string, any>();
  private static cacheExpiry = new Map<string, number>();

  /**
   * Obtiene métricas generales de reservas
   */
  static async getBookingMetrics(
    cardId: string, 
    dateFrom: string, 
    dateTo: string
  ): Promise<BookingMetrics> {
    try {
      const cacheKey = `metrics_${cardId}_${dateFrom}_${dateTo}`;
      const cached = this.getCachedData(cacheKey);
      if (cached) return cached;

      const bookings = await AdvancedBookingsService.getBookingsForCard(cardId, {
        dateFrom,
        dateTo,
        includeCompleted: true
      });

      const metrics: BookingMetrics = {
        totalBookings: bookings.length,
        confirmedBookings: bookings.filter(b => b.status === 'confirmed').length,
        cancelledBookings: bookings.filter(b => b.status === 'cancelled').length,
        completedBookings: bookings.filter(b => b.status === 'completed').length,
        noShowBookings: bookings.filter(b => b.status === 'no_show').length,
        totalRevenue: bookings
          .filter(b => ['confirmed', 'completed'].includes(b.status))
          .reduce((sum, b) => sum + b.price, 0),
        averageBookingValue: 0,
        conversionRate: 0,
        cancellationRate: 0,
        noShowRate: 0,
        repeatClientRate: 0
      };

      // Calcular promedios y tasas
      if (metrics.totalBookings > 0) {
        metrics.averageBookingValue = metrics.totalRevenue / (metrics.confirmedBookings + metrics.completedBookings);
        metrics.cancellationRate = (metrics.cancelledBookings / metrics.totalBookings) * 100;
        metrics.noShowRate = (metrics.noShowBookings / metrics.totalBookings) * 100;
        metrics.conversionRate = ((metrics.confirmedBookings + metrics.completedBookings) / metrics.totalBookings) * 100;
      }

      // Calcular tasa de clientes recurrentes
      metrics.repeatClientRate = await this.calculateRepeatClientRate(cardId, bookings);

      this.setCachedData(cacheKey, metrics, 300000); // 5 minutos
      return metrics;
    } catch (error) {
      secureLogger.error('Error obteniendo métricas de reservas', error);
      return this.getEmptyMetrics();
    }
  }

  /**
   * Analiza popularidad y rendimiento por franjas horarias
   */
  static async getTimeSlotAnalytics(
    cardId: string, 
    dateFrom: string, 
    dateTo: string
  ): Promise<TimeSlotAnalytics[]> {
    try {
      const cacheKey = `timeslots_${cardId}_${dateFrom}_${dateTo}`;
      const cached = this.getCachedData(cacheKey);
      if (cached) return cached;

      const bookings = await AdvancedBookingsService.getBookingsForCard(cardId, {
        dateFrom,
        dateTo,
        includeCompleted: true
      });

      const timeSlotMap = new Map<string, {
        bookings: number;
        revenue: number;
        totalSlots: number;
      }>();

      // Agrupar por franjas horarias (por horas)
      bookings.forEach(booking => {
        const hour = booking.startTime.split(':')[0] + ':00';
        
        if (!timeSlotMap.has(hour)) {
          timeSlotMap.set(hour, { bookings: 0, revenue: 0, totalSlots: 0 });
        }
        
        const slot = timeSlotMap.get(hour)!;
        slot.bookings++;
        slot.revenue += ['confirmed', 'completed'].includes(booking.status) ? booking.price : 0;
      });

      // Calcular número total de slots disponibles por hora (estimación)
      const totalDays = this.getDaysBetweenDates(dateFrom, dateTo);
      
      const analytics: TimeSlotAnalytics[] = [];
      
      for (const [timeSlot, data] of timeSlotMap.entries()) {
        const totalAvailableSlots = totalDays * 4; // Asumiendo 4 slots de 15min por hora
        const occupancyRate = (data.bookings / totalAvailableSlots) * 100;
        
        analytics.push({
          timeSlot,
          totalBookings: data.bookings,
          revenue: data.revenue,
          averageOccupancy: Math.min(occupancyRate, 100),
          preferenceScore: this.calculatePreferenceScore(data.bookings, timeSlot)
        });
      }

      analytics.sort((a, b) => b.totalBookings - a.totalBookings);

      this.setCachedData(cacheKey, analytics, 300000);
      return analytics;
    } catch (error) {
      secureLogger.error('Error obteniendo analytics de franjas horarias', error);
      return [];
    }
  }

  /**
   * Analiza rendimiento por servicio
   */
  static async getServiceAnalytics(
    cardId: string, 
    dateFrom: string, 
    dateTo: string
  ): Promise<ServiceAnalytics[]> {
    try {
      const cacheKey = `services_${cardId}_${dateFrom}_${dateTo}`;
      const cached = this.getCachedData(cacheKey);
      if (cached) return cached;

      const bookings = await AdvancedBookingsService.getBookingsForCard(cardId, {
        dateFrom,
        dateTo,
        includeCompleted: true
      });

      const serviceMap = new Map<string, {
        serviceName: string;
        bookings: number;
        revenue: number;
        totalDuration: number;
      }>();

      bookings.forEach(booking => {
        if (!serviceMap.has(booking.serviceId)) {
          serviceMap.set(booking.serviceId, {
            serviceName: booking.serviceName,
            bookings: 0,
            revenue: 0,
            totalDuration: 0
          });
        }
        
        const service = serviceMap.get(booking.serviceId)!;
        service.bookings++;
        service.revenue += ['confirmed', 'completed'].includes(booking.status) ? booking.price : 0;
        service.totalDuration += booking.duration;
      });

      const analytics: ServiceAnalytics[] = [];
      let rank = 1;
      
      // Convertir a array y ordenar por popularidad
      const sortedServices = Array.from(serviceMap.entries()).sort((a, b) => b[1].bookings - a[1].bookings);
      
      sortedServices.forEach(([serviceId, data]) => {
        analytics.push({
          serviceId,
          serviceName: data.serviceName,
          totalBookings: data.bookings,
          revenue: data.revenue,
          averageDuration: data.totalDuration / data.bookings,
          popularityRank: rank++,
          profitabilityScore: this.calculateProfitabilityScore(data.revenue, data.bookings, data.totalDuration)
        });
      });

      this.setCachedData(cacheKey, analytics, 300000);
      return analytics;
    } catch (error) {
      secureLogger.error('Error obteniendo analytics de servicios', error);
      return [];
    }
  }

  /**
   * Analiza comportamiento de clientes
   */
  static async getClientAnalytics(
    cardId: string, 
    dateFrom: string, 
    dateTo: string
  ): Promise<ClientAnalytics> {
    try {
      const cacheKey = `clients_${cardId}_${dateFrom}_${dateTo}`;
      const cached = this.getCachedData(cacheKey);
      if (cached) return cached;

      const bookings = await AdvancedBookingsService.getBookingsForCard(cardId, {
        dateFrom,
        dateTo,
        includeCompleted: true
      });

      const clientMap = new Map<string, {
        name: string;
        bookings: number;
        totalSpent: number;
        firstBooking: string;
      }>();

      bookings.forEach(booking => {
        if (!clientMap.has(booking.clientEmail)) {
          clientMap.set(booking.clientEmail, {
            name: booking.clientName,
            bookings: 0,
            totalSpent: 0,
            firstBooking: booking.date
          });
        }
        
        const client = clientMap.get(booking.clientEmail)!;
        client.bookings++;
        client.totalSpent += ['confirmed', 'completed'].includes(booking.status) ? booking.price : 0;
        
        if (booking.date < client.firstBooking) {
          client.firstBooking = booking.date;
        }
      });

      // Identificar clientes nuevos vs recurrentes
      const periodStart = new Date(dateFrom);
      const newClients = Array.from(clientMap.values()).filter(client => 
        new Date(client.firstBooking) >= periodStart
      );

      const topClients = Array.from(clientMap.entries())
        .map(([email, data]) => ({
          email,
          name: data.name,
          totalBookings: data.bookings,
          totalSpent: data.totalSpent
        }))
        .sort((a, b) => b.totalSpent - a.totalSpent)
        .slice(0, 10);

      const analytics: ClientAnalytics = {
        totalClients: clientMap.size,
        newClients: newClients.length,
        returningClients: clientMap.size - newClients.length,
        averageBookingsPerClient: bookings.length / Math.max(clientMap.size, 1),
        clientLifetimeValue: Array.from(clientMap.values()).reduce((sum, client) => sum + client.totalSpent, 0) / Math.max(clientMap.size, 1),
        topClients
      };

      this.setCachedData(cacheKey, analytics, 300000);
      return analytics;
    } catch (error) {
      secureLogger.error('Error obteniendo analytics de clientes', error);
      return {
        totalClients: 0,
        newClients: 0,
        returningClients: 0,
        averageBookingsPerClient: 0,
        clientLifetimeValue: 0,
        topClients: []
      };
    }
  }

  /**
   * Analiza tendencias temporales
   */
  static async getTrendAnalysis(
    cardId: string, 
    period: 'daily' | 'weekly' | 'monthly',
    dateFrom: string, 
    dateTo: string
  ): Promise<TrendAnalysis> {
    try {
      const cacheKey = `trends_${cardId}_${period}_${dateFrom}_${dateTo}`;
      const cached = this.getCachedData(cacheKey);
      if (cached) return cached;

      const bookings = await AdvancedBookingsService.getBookingsForCard(cardId, {
        dateFrom,
        dateTo,
        includeCompleted: true
      });

      const data = this.groupBookingsByPeriod(bookings, period);
      const growth = this.calculateGrowthRates(data);

      const analysis: TrendAnalysis = {
        period,
        data,
        growth
      };

      this.setCachedData(cacheKey, analysis, 600000); // 10 minutos
      return analysis;
    } catch (error) {
      secureLogger.error('Error obteniendo análisis de tendencias', error);
      return {
        period,
        data: [],
        growth: { bookingsGrowth: 0, revenueGrowth: 0, clientGrowth: 0 }
      };
    }
  }

  /**
   * Genera insights predictivos usando tendencias históricas
   */
  static async getPredictiveInsights(
    cardId: string,
    forecastDays: number = 30
  ): Promise<PredictiveInsights> {
    try {
      const cacheKey = `predictions_${cardId}_${forecastDays}`;
      const cached = this.getCachedData(cacheKey);
      if (cached) return cached;

      // Obtener datos históricos de los últimos 90 días
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 90);

      const historicalBookings = await AdvancedBookingsService.getBookingsForCard(cardId, {
        dateFrom: startDate.toISOString().split('T')[0],
        dateTo: endDate.toISOString().split('T')[0],
        includeCompleted: true
      });

      const insights: PredictiveInsights = {
        busyPeriods: this.predictBusyPeriods(historicalBookings, forecastDays),
        revenueProjection: this.projectRevenue(historicalBookings, forecastDays),
        capacityOptimization: await this.analyzeCapacityOptimization(cardId, historicalBookings)
      };

      this.setCachedData(cacheKey, insights, 3600000); // 1 hora
      return insights;
    } catch (error) {
      secureLogger.error('Error generando insights predictivos', error);
      return {
        busyPeriods: [],
        revenueProjection: [],
        capacityOptimization: []
      };
    }
  }

  /**
   * Genera insights operacionales
   */
  static async getOperationalInsights(
    cardId: string,
    dateFrom: string,
    dateTo: string
  ): Promise<OperationalInsights> {
    try {
      const cacheKey = `operational_${cardId}_${dateFrom}_${dateTo}`;
      const cached = this.getCachedData(cacheKey);
      if (cached) return cached;

      const bookings = await AdvancedBookingsService.getBookingsForCard(cardId, {
        dateFrom,
        dateTo,
        includeCompleted: true
      });

      const insights: OperationalInsights = {
        peakHours: this.identifyPeakHours(bookings),
        slowHours: this.identifySlowHours(bookings),
        optimalBufferTimes: this.calculateOptimalBufferTimes(bookings),
        recommendedPricing: this.recommendPricing(bookings),
        staffingRecommendations: this.generateStaffingRecommendations(bookings)
      };

      this.setCachedData(cacheKey, insights, 1800000); // 30 minutos
      return insights;
    } catch (error) {
      secureLogger.error('Error generando insights operacionales', error);
      return {
        peakHours: [],
        slowHours: [],
        optimalBufferTimes: {},
        recommendedPricing: {},
        staffingRecommendations: []
      };
    }
  }

  // Métodos auxiliares privados

  private static calculateRepeatClientRate(cardId: string, bookings: AdvancedBookingData[]): number {
    const clientBookingCounts = new Map<string, number>();
    
    bookings.forEach(booking => {
      clientBookingCounts.set(
        booking.clientEmail, 
        (clientBookingCounts.get(booking.clientEmail) || 0) + 1
      );
    });

    const repeatClients = Array.from(clientBookingCounts.values()).filter(count => count > 1).length;
    const totalClients = clientBookingCounts.size;
    
    return totalClients > 0 ? (repeatClients / totalClients) * 100 : 0;
  }

  private static calculatePreferenceScore(bookings: number, timeSlot: string): number {
    const hour = parseInt(timeSlot.split(':')[0]);
    
    // Factores que afectan la preferencia
    let baseScore = bookings * 10;
    
    // Bonus por horarios preferenciales (10-12, 15-17)
    if ((hour >= 10 && hour <= 12) || (hour >= 15 && hour <= 17)) {
      baseScore *= 1.2;
    }
    
    // Penalización por horarios extremos
    if (hour < 9 || hour > 18) {
      baseScore *= 0.8;
    }
    
    return Math.round(baseScore);
  }

  private static calculateProfitabilityScore(revenue: number, bookings: number, totalDuration: number): number {
    if (bookings === 0) return 0;
    
    const revenuePerBooking = revenue / bookings;
    const revenuePerMinute = revenue / totalDuration;
    
    // Combinar ambas métricas con pesos
    return Math.round((revenuePerBooking * 0.6) + (revenuePerMinute * 100 * 0.4));
  }

  private static getDaysBetweenDates(dateFrom: string, dateTo: string): number {
    const start = new Date(dateFrom);
    const end = new Date(dateTo);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  }

  private static groupBookingsByPeriod(bookings: AdvancedBookingData[], period: 'daily' | 'weekly' | 'monthly'): any[] {
    const groupedData = new Map<string, {
      bookings: number;
      revenue: number;
      clients: Set<string>;
    }>();

    bookings.forEach(booking => {
      let key: string;
      const date = new Date(booking.date);
      
      switch (period) {
        case 'daily':
          key = booking.date;
          break;
        case 'weekly':
          const weekStart = new Date(date);
          weekStart.setDate(date.getDate() - date.getDay());
          key = weekStart.toISOString().split('T')[0];
          break;
        case 'monthly':
          key = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
          break;
        default:
          key = booking.date;
      }

      if (!groupedData.has(key)) {
        groupedData.set(key, { bookings: 0, revenue: 0, clients: new Set() });
      }

      const group = groupedData.get(key)!;
      group.bookings++;
      group.revenue += ['confirmed', 'completed'].includes(booking.status) ? booking.price : 0;
      group.clients.add(booking.clientEmail);
    });

    return Array.from(groupedData.entries())
      .map(([date, data]) => ({
        date,
        bookings: data.bookings,
        revenue: data.revenue,
        newClients: data.clients.size
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  private static calculateGrowthRates(data: any[]): any {
    if (data.length < 2) {
      return { bookingsGrowth: 0, revenueGrowth: 0, clientGrowth: 0 };
    }

    const firstHalf = data.slice(0, Math.floor(data.length / 2));
    const secondHalf = data.slice(Math.floor(data.length / 2));

    const firstHalfAvg = {
      bookings: firstHalf.reduce((sum, d) => sum + d.bookings, 0) / firstHalf.length,
      revenue: firstHalf.reduce((sum, d) => sum + d.revenue, 0) / firstHalf.length,
      clients: firstHalf.reduce((sum, d) => sum + d.newClients, 0) / firstHalf.length
    };

    const secondHalfAvg = {
      bookings: secondHalf.reduce((sum, d) => sum + d.bookings, 0) / secondHalf.length,
      revenue: secondHalf.reduce((sum, d) => sum + d.revenue, 0) / secondHalf.length,
      clients: secondHalf.reduce((sum, d) => sum + d.newClients, 0) / secondHalf.length
    };

    return {
      bookingsGrowth: firstHalfAvg.bookings > 0 ? 
        ((secondHalfAvg.bookings - firstHalfAvg.bookings) / firstHalfAvg.bookings) * 100 : 0,
      revenueGrowth: firstHalfAvg.revenue > 0 ? 
        ((secondHalfAvg.revenue - firstHalfAvg.revenue) / firstHalfAvg.revenue) * 100 : 0,
      clientGrowth: firstHalfAvg.clients > 0 ? 
        ((secondHalfAvg.clients - firstHalfAvg.clients) / firstHalfAvg.clients) * 100 : 0
    };
  }

  private static predictBusyPeriods(historicalBookings: AdvancedBookingData[], forecastDays: number): any[] {
    // Implementación simplificada - en producción usaríamos ML
    const dayOfWeekPatterns = new Map<number, number>();
    
    historicalBookings.forEach(booking => {
      const dayOfWeek = new Date(booking.date).getDay();
      dayOfWeekPatterns.set(dayOfWeek, (dayOfWeekPatterns.get(dayOfWeek) || 0) + 1);
    });

    const predictions = [];
    const today = new Date();
    
    for (let i = 0; i < forecastDays; i++) {
      const futureDate = new Date(today);
      futureDate.setDate(today.getDate() + i);
      
      const dayOfWeek = futureDate.getDay();
      const expectedBookings = dayOfWeekPatterns.get(dayOfWeek) || 0;
      
      if (expectedBookings >= 3) { // Considerar "ocupado" si se esperan 3+ reservas
        predictions.push({
          date: futureDate.toISOString().split('T')[0],
          expectedBookings,
          confidence: Math.min(85, expectedBookings * 20) // Confianza basada en volumen histórico
        });
      }
    }

    return predictions.slice(0, 10); // Top 10 días más ocupados
  }

  private static projectRevenue(historicalBookings: AdvancedBookingData[], forecastDays: number): any[] {
    const monthlyRevenue = new Map<string, number>();
    
    historicalBookings.forEach(booking => {
      if (['confirmed', 'completed'].includes(booking.status)) {
        const month = booking.date.substring(0, 7); // YYYY-MM
        monthlyRevenue.set(month, (monthlyRevenue.get(month) || 0) + booking.price);
      }
    });

    const avgMonthlyRevenue = Array.from(monthlyRevenue.values())
      .reduce((sum, revenue) => sum + revenue, 0) / Math.max(monthlyRevenue.size, 1);

    const projections = [];
    const currentDate = new Date();
    
    for (let i = 1; i <= 6; i++) { // Proyectar 6 meses
      const futureMonth = new Date(currentDate);
      futureMonth.setMonth(currentDate.getMonth() + i);
      
      projections.push({
        month: futureMonth.toISOString().substring(0, 7),
        projectedRevenue: Math.round(avgMonthlyRevenue * (1 + Math.random() * 0.2 - 0.1)), // ±10% variación
        confidence: Math.max(60, 90 - (i * 5)) // Menos confianza para proyecciones más lejanas
      });
    }

    return projections;
  }

  private static async analyzeCapacityOptimization(cardId: string, historicalBookings: AdvancedBookingData[]): Promise<any[]> {
    const timeSlotUtilization = new Map<string, { used: number, total: number }>();
    
    // Analizar utilización por franja horaria
    historicalBookings.forEach(booking => {
      const hour = booking.startTime.split(':')[0] + ':00';
      if (!timeSlotUtilization.has(hour)) {
        timeSlotUtilization.set(hour, { used: 0, total: 0 });
      }
      timeSlotUtilization.get(hour)!.used++;
    });

    // Estimar slots totales disponibles
    const uniqueDays = new Set(historicalBookings.map(b => b.date)).size;
    
    const optimizations = [];
    
    for (const [timeSlot, data] of timeSlotUtilization.entries()) {
      const estimatedTotalSlots = uniqueDays * 4; // 4 slots por hora
      const utilizationRate = (data.used / estimatedTotalSlots) * 100;
      
      let recommendation: string;
      let impact = 0;
      
      if (utilizationRate > 90) {
        recommendation = 'increase_slots';
        impact = 25;
      } else if (utilizationRate < 30) {
        recommendation = 'reduce_slots';
        impact = 15;
      } else if (utilizationRate > 70) {
        recommendation = 'add_buffer';
        impact = 10;
      } else {
        recommendation = 'maintain';
        impact = 0;
      }

      optimizations.push({
        timeSlot,
        currentUtilization: Math.round(utilizationRate),
        recommendedAction: recommendation,
        potentialImpact: impact
      });
    }

    return optimizations.filter(opt => opt.potentialImpact > 0);
  }

  private static identifyPeakHours(bookings: AdvancedBookingData[]): string[] {
    const hourCounts = new Map<string, number>();
    
    bookings.forEach(booking => {
      const hour = booking.startTime.split(':')[0] + ':00';
      hourCounts.set(hour, (hourCounts.get(hour) || 0) + 1);
    });

    const avgBookingsPerHour = Array.from(hourCounts.values())
      .reduce((sum, count) => sum + count, 0) / Math.max(hourCounts.size, 1);

    return Array.from(hourCounts.entries())
      .filter(([_, count]) => count > avgBookingsPerHour * 1.5)
      .map(([hour, _]) => hour)
      .sort();
  }

  private static identifySlowHours(bookings: AdvancedBookingData[]): string[] {
    const hourCounts = new Map<string, number>();
    
    bookings.forEach(booking => {
      const hour = booking.startTime.split(':')[0] + ':00';
      hourCounts.set(hour, (hourCounts.get(hour) || 0) + 1);
    });

    const avgBookingsPerHour = Array.from(hourCounts.values())
      .reduce((sum, count) => sum + count, 0) / Math.max(hourCounts.size, 1);

    return Array.from(hourCounts.entries())
      .filter(([_, count]) => count < avgBookingsPerHour * 0.5)
      .map(([hour, _]) => hour)
      .sort();
  }

  private static calculateOptimalBufferTimes(bookings: AdvancedBookingData[]): { [serviceId: string]: number } {
    const serviceBuffers: { [serviceId: string]: number } = {};
    
    // Análisis simplificado - en producción analizaríamos patrones de retraso
    const uniqueServices = [...new Set(bookings.map(b => b.serviceId))];
    
    uniqueServices.forEach(serviceId => {
      const serviceBookings = bookings.filter(b => b.serviceId === serviceId);
      const avgDuration = serviceBookings.reduce((sum, b) => sum + b.duration, 0) / serviceBookings.length;
      
      // Buffer recomendado basado en duración del servicio
      if (avgDuration <= 30) {
        serviceBuffers[serviceId] = 10;
      } else if (avgDuration <= 60) {
        serviceBuffers[serviceId] = 15;
      } else {
        serviceBuffers[serviceId] = 20;
      }
    });
    
    return serviceBuffers;
  }

  private static recommendPricing(bookings: AdvancedBookingData[]): { [serviceId: string]: number } {
    const servicePricing: { [serviceId: string]: number } = {};
    
    const serviceStats = new Map<string, { prices: number[], demand: number }>();
    
    bookings.forEach(booking => {
      if (!serviceStats.has(booking.serviceId)) {
        serviceStats.set(booking.serviceId, { prices: [], demand: 0 });
      }
      
      const stats = serviceStats.get(booking.serviceId)!;
      stats.prices.push(booking.price);
      stats.demand++;
    });

    serviceStats.forEach((stats, serviceId) => {
      const avgPrice = stats.prices.reduce((sum, price) => sum + price, 0) / stats.prices.length;
      
      // Ajustar precio según demanda
      if (stats.demand > 20) { // Alta demanda
        servicePricing[serviceId] = Math.round(avgPrice * 1.1); // +10%
      } else if (stats.demand < 5) { // Baja demanda
        servicePricing[serviceId] = Math.round(avgPrice * 0.9); // -10%
      } else {
        servicePricing[serviceId] = Math.round(avgPrice);
      }
    });
    
    return servicePricing;
  }

  private static generateStaffingRecommendations(bookings: AdvancedBookingData[]): any[] {
    // Implementación simplificada
    const recommendations = [];
    const peakHours = this.identifyPeakHours(bookings);
    
    peakHours.forEach(hour => {
      const hourBookings = bookings.filter(b => b.startTime.startsWith(hour.split(':')[0]));
      const avgConcurrentBookings = Math.ceil(hourBookings.length / 7); // Promedio por día de la semana
      
      recommendations.push({
        date: 'Días de la semana',
        timeSlot: hour,
        recommendedStaff: Math.max(1, Math.ceil(avgConcurrentBookings / 2)),
        reasoning: `Alta demanda promedio de ${avgConcurrentBookings} reservas en esta franja`
      });
    });
    
    return recommendations.slice(0, 5); // Top 5 recomendaciones
  }

  // Cache utilities
  private static getCachedData(key: string): any {
    const expiry = this.cacheExpiry.get(key);
    if (expiry && Date.now() > expiry) {
      this.cache.delete(key);
      this.cacheExpiry.delete(key);
      return null;
    }
    return this.cache.get(key);
  }

  private static setCachedData(key: string, data: any, ttlMs: number): void {
    this.cache.set(key, data);
    this.cacheExpiry.set(key, Date.now() + ttlMs);
  }

  private static getEmptyMetrics(): BookingMetrics {
    return {
      totalBookings: 0,
      confirmedBookings: 0,
      cancelledBookings: 0,
      completedBookings: 0,
      noShowBookings: 0,
      totalRevenue: 0,
      averageBookingValue: 0,
      conversionRate: 0,
      cancellationRate: 0,
      noShowRate: 0,
      repeatClientRate: 0
    };
  }
}