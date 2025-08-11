import { 
  collection, 
  query, 
  where, 
  orderBy, 
  limit, 
  onSnapshot, 
  Timestamp,
  doc,
  getDoc,
  getDocs
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { logger } from '@/utils/logger';

export interface RealTimeMetric {
  id: string;
  userId: string;
  cardId?: string;
  eventType: 'view' | 'click' | 'booking' | 'signup' | 'share';
  timestamp: Timestamp;
  metadata: {
    userAgent?: string;
    ip?: string;
    referrer?: string;
    country?: string;
    device?: string;
  };
}

export interface MetricsSummary {
  totalViews: number;
  totalClicks: number;
  totalBookings: number;
  totalShares: number;
  uniqueVisitors: number;
  conversionRate: number;
  avgSessionDuration: number;
  topReferrers: Array<{ source: string; count: number }>;
  deviceBreakdown: Array<{ device: string; count: number }>;
  hourlyData: Array<{ hour: number; views: number; clicks: number }>;
}

class RealTimeMetricsService {
  private listeners: Map<string, () => void> = new Map();

  /**
   * Suscribirse a métricas en tiempo real
   */
  subscribeToMetrics(
    userId: string, 
    callback: (metrics: MetricsSummary) => void,
    errorCallback?: (error: Error) => void
  ): () => void {
    try {
      const metricsQuery = query(
        collection(db, 'analytics'),
        where('userId', '==', userId),
        where('timestamp', '>=', Timestamp.fromDate(new Date(Date.now() - 24 * 60 * 60 * 1000))),
        orderBy('timestamp', 'desc'),
        limit(1000)
      );

      const unsubscribe = onSnapshot(
        metricsQuery,
        (snapshot) => {
          const metrics = this.processMetricsData(snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          } as RealTimeMetric)));
          
          callback(metrics);
        },
        (error) => {
          logger.error('Error en suscripción de métricas en tiempo real', { 
            userId, 
            error: error.message 
          });
          errorCallback?.(error);
        }
      );

      // Almacenar referencia para limpieza
      this.listeners.set(userId, unsubscribe);
      return unsubscribe;

    } catch (error) {
      logger.error('Error al configurar suscripción de métricas', { 
        userId, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      
      if (errorCallback) {
        errorCallback(error instanceof Error ? error : new Error('Unknown error'));
      }
      
      return () => {};
    }
  }

  /**
   * Procesar datos de métricas raw
   */
  private processMetricsData(rawData: RealTimeMetric[]): MetricsSummary {
    const now = new Date();
    const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // Filtrar últimas 24 horas
    const recentData = rawData.filter(metric => 
      metric.timestamp.toDate() >= last24Hours
    );

    // Calcular métricas básicas
    const totalViews = recentData.filter(m => m.eventType === 'view').length;
    const totalClicks = recentData.filter(m => m.eventType === 'click').length;
    const totalBookings = recentData.filter(m => m.eventType === 'booking').length;
    const totalShares = recentData.filter(m => m.eventType === 'share').length;

    // Visitantes únicos (por IP aproximadamente)
    const uniqueIPs = new Set(recentData.map(m => m.metadata.ip).filter(Boolean));
    const uniqueVisitors = uniqueIPs.size;

    // Tasa de conversión
    const conversionRate = totalViews > 0 ? (totalBookings / totalViews) * 100 : 0;

    // Referrers principales
    const referrerCounts = new Map<string, number>();
    recentData.forEach(metric => {
      if (metric.metadata.referrer) {
        const domain = this.extractDomain(metric.metadata.referrer);
        referrerCounts.set(domain, (referrerCounts.get(domain) || 0) + 1);
      }
    });

    const topReferrers = Array.from(referrerCounts.entries())
      .map(([source, count]) => ({ source, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Breakdown por dispositivo
    const deviceCounts = new Map<string, number>();
    recentData.forEach(metric => {
      if (metric.metadata.device) {
        deviceCounts.set(metric.metadata.device, (deviceCounts.get(metric.metadata.device) || 0) + 1);
      }
    });

    const deviceBreakdown = Array.from(deviceCounts.entries())
      .map(([device, count]) => ({ device, count }))
      .sort((a, b) => b.count - a.count);

    // Datos por hora (últimas 24 horas)
    const hourlyData = Array.from({ length: 24 }, (_, i) => {
      const hour = (now.getHours() - i + 24) % 24;
      const hourStart = new Date(now);
      hourStart.setHours(hour, 0, 0, 0);
      const hourEnd = new Date(hourStart);
      hourEnd.setHours(hour + 1, 0, 0, 0);

      const hourMetrics = recentData.filter(metric => {
        const metricTime = metric.timestamp.toDate();
        return metricTime >= hourStart && metricTime < hourEnd;
      });

      return {
        hour,
        views: hourMetrics.filter(m => m.eventType === 'view').length,
        clicks: hourMetrics.filter(m => m.eventType === 'click').length
      };
    }).reverse();

    // Duración promedio de sesión (estimación básica)
    const avgSessionDuration = this.calculateAvgSessionDuration(recentData);

    return {
      totalViews,
      totalClicks,
      totalBookings,
      totalShares,
      uniqueVisitors,
      conversionRate,
      avgSessionDuration,
      topReferrers,
      deviceBreakdown,
      hourlyData
    };
  }

  /**
   * Calcular duración promedio de sesión
   */
  private calculateAvgSessionDuration(metrics: RealTimeMetric[]): number {
    // Agrupar por IP para simular sesiones
    const sessionsByIP = new Map<string, RealTimeMetric[]>();
    
    metrics.forEach(metric => {
      const ip = metric.metadata.ip || 'unknown';
      if (!sessionsByIP.has(ip)) {
        sessionsByIP.set(ip, []);
      }
      sessionsByIP.get(ip)!.push(metric);
    });

    let totalDuration = 0;
    let sessionCount = 0;

    sessionsByIP.forEach(sessionMetrics => {
      if (sessionMetrics.length < 2) return;

      // Ordenar por timestamp
      sessionMetrics.sort((a, b) => a.timestamp.seconds - b.timestamp.seconds);
      
      const sessionStart = sessionMetrics[0].timestamp.toDate();
      const sessionEnd = sessionMetrics[sessionMetrics.length - 1].timestamp.toDate();
      
      const duration = (sessionEnd.getTime() - sessionStart.getTime()) / 1000; // en segundos
      
      // Solo contar sesiones realistas (entre 1 segundo y 1 hora)
      if (duration > 1 && duration < 3600) {
        totalDuration += duration;
        sessionCount++;
      }
    });

    return sessionCount > 0 ? Math.round(totalDuration / sessionCount) : 0;
  }

  /**
   * Extraer dominio de URL
   */
  private extractDomain(url: string): string {
    try {
      const domain = new URL(url).hostname;
      return domain.replace('www.', '');
    } catch {
      return 'Directo';
    }
  }

  /**
   * Registrar evento de métrica
   */
  async recordMetric(
    userId: string,
    eventType: RealTimeMetric['eventType'],
    metadata: RealTimeMetric['metadata'],
    cardId?: string
  ): Promise<void> {
    try {
      const metricData: Omit<RealTimeMetric, 'id'> = {
        userId,
        cardId,
        eventType,
        timestamp: Timestamp.now(),
        metadata: {
          ...metadata,
          // Anonimizar IP parcialmente para privacidad
          ip: metadata.ip ? this.anonymizeIP(metadata.ip) : undefined
        }
      };

      await collection(db, 'analytics').add(metricData);
      
      logger.info('Métrica registrada', { 
        userId, 
        eventType, 
        cardId 
      });

    } catch (error) {
      logger.error('Error al registrar métrica', { 
        userId, 
        eventType, 
        cardId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Anonimizar IP para privacidad (mantener solo primeros 3 octetos)
   */
  private anonymizeIP(ip: string): string {
    const parts = ip.split('.');
    if (parts.length === 4) {
      return `${parts[0]}.${parts[1]}.${parts[2]}.xxx`;
    }
    return 'xxx.xxx.xxx.xxx';
  }

  /**
   * Limpiar listeners
   */
  cleanup(userId?: string): void {
    if (userId && this.listeners.has(userId)) {
      this.listeners.get(userId)?.();
      this.listeners.delete(userId);
    } else {
      // Limpiar todos los listeners
      this.listeners.forEach(unsubscribe => unsubscribe());
      this.listeners.clear();
    }
  }

  /**
   * Obtener resumen de métricas para período específico
   */
  async getMetricsSummary(
    userId: string,
    startDate: Date,
    endDate: Date
  ): Promise<MetricsSummary> {
    try {
      const metricsQuery = query(
        collection(db, 'analytics'),
        where('userId', '==', userId),
        where('timestamp', '>=', Timestamp.fromDate(startDate)),
        where('timestamp', '<=', Timestamp.fromDate(endDate)),
        orderBy('timestamp', 'desc')
      );

      const snapshot = await getDocs(metricsQuery);
      const metrics = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as RealTimeMetric));

      return this.processMetricsData(metrics);

    } catch (error) {
      logger.error('Error al obtener resumen de métricas', { 
        userId, 
        startDate, 
        endDate,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }
}

export const realTimeMetricsService = new RealTimeMetricsService();