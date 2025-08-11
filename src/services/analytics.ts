import { 
  collection, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  getDocs,
  Timestamp,
  serverTimestamp,
  increment,
  doc,
  updateDoc,
  getDoc,
  setDoc
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { info, error } from '@/utils/logger';

export interface AnalyticsEvent {
  id?: string;
  eventType: 'page_view' | 'card_view' | 'link_click' | 'contact_click' | 'booking_created' | 'card_created' | 'user_signup';
  userId?: string;
  cardId?: string;
  metadata?: Record<string, any>;
  timestamp: Date;
  sessionId?: string;
  userAgent?: string;
  referrer?: string;
  ipAddress?: string;
}

export interface AnalyticsMetrics {
  totalViews: number;
  uniqueViews: number;
  totalClicks: number;
  uniqueClicks: number;
  bounceRate: number;
  averageSessionDuration: number;
  topReferrers: Array<{ source: string; count: number }>;
  deviceBreakdown: Array<{ device: string; count: number }>;
  popularPages: Array<{ page: string; views: number }>;
}

export interface AnalyticsResponse {
  success: boolean;
  data?: AnalyticsEvent[] | AnalyticsMetrics;
  error?: string;
}

class AnalyticsService {
  private sessionId: string;
  private startTime: number;

  constructor() {
    this.sessionId = this.generateSessionId();
    this.startTime = Date.now();
    this.setupBeforeUnload();
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  }

  private setupBeforeUnload(): void {
    window.addEventListener('beforeunload', () => {
      this.trackSessionEnd();
    });
  }

  async trackEvent(event: Omit<AnalyticsEvent, 'timestamp' | 'sessionId' | 'userAgent' | 'referrer'>): Promise<AnalyticsResponse> {
    try {
      const analyticsEvent: AnalyticsEvent = {
        ...event,
        timestamp: new Date(),
        sessionId: this.sessionId,
        userAgent: navigator.userAgent,
        referrer: document.referrer || 'direct'
      };

      await addDoc(collection(db, 'analytics'), {
        ...analyticsEvent,
        timestamp: serverTimestamp()
      });

      // Update aggregated metrics
      await this.updateAggregatedMetrics(analyticsEvent);

      info('Analytics event tracked', { 
        component: 'analytics', 
        eventType: event.eventType,
        userId: event.userId,
        cardId: event.cardId
      });

      return { success: true };
    } catch (err) {
      error('Failed to track analytics event', err as Error, { 
        component: 'analytics', 
        eventType: event.eventType 
      });
      return { 
        success: false, 
        error: 'Error al registrar evento de analytics' 
      };
    }
  }

  async trackPageView(page: string, userId?: string): Promise<AnalyticsResponse> {
    return this.trackEvent({
      eventType: 'page_view',
      userId,
      metadata: { page }
    });
  }

  async trackCardView(cardId: string, userId?: string): Promise<AnalyticsResponse> {
    // Also increment card view count
    if (cardId) {
      try {
        const cardRef = doc(db, 'cards', cardId);
        await updateDoc(cardRef, {
          views: increment(1),
          lastViewed: serverTimestamp()
        });
      } catch (err) {
        error('Failed to increment card views', err as Error, { cardId });
      }
    }

    return this.trackEvent({
      eventType: 'card_view',
      cardId,
      userId
    });
  }

  async trackLinkClick(linkUrl: string, cardId?: string, userId?: string): Promise<AnalyticsResponse> {
    // Also increment card click count
    if (cardId) {
      try {
        const cardRef = doc(db, 'cards', cardId);
        await updateDoc(cardRef, {
          clicks: increment(1)
        });
      } catch (err) {
        error('Failed to increment card clicks', err as Error, { cardId });
      }
    }

    return this.trackEvent({
      eventType: 'link_click',
      cardId,
      userId,
      metadata: { linkUrl }
    });
  }

  async trackContactClick(contactType: string, cardId?: string, userId?: string): Promise<AnalyticsResponse> {
    return this.trackEvent({
      eventType: 'contact_click',
      cardId,
      userId,
      metadata: { contactType }
    });
  }

  async trackBookingCreated(bookingId: string, cardId?: string, userId?: string): Promise<AnalyticsResponse> {
    return this.trackEvent({
      eventType: 'booking_created',
      cardId,
      userId,
      metadata: { bookingId }
    });
  }

  async trackUserSignup(userId: string): Promise<AnalyticsResponse> {
    return this.trackEvent({
      eventType: 'user_signup',
      userId
    });
  }

  private async updateAggregatedMetrics(event: AnalyticsEvent): Promise<void> {
    try {
      const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
      const metricsRef = doc(db, 'metrics', date);
      
      const updateData: Record<string, any> = {};
      
      switch (event.eventType) {
        case 'page_view':
          updateData.totalPageViews = increment(1);
          break;
        case 'card_view':
          updateData.totalCardViews = increment(1);
          if (event.cardId) {
            updateData[`cardViews.${event.cardId}`] = increment(1);
          }
          break;
        case 'link_click':
          updateData.totalLinkClicks = increment(1);
          break;
        case 'user_signup':
          updateData.totalSignups = increment(1);
          break;
      }

      await setDoc(metricsRef, updateData, { merge: true });
    } catch (err) {
      error('Failed to update aggregated metrics', err as Error, { eventType: event.eventType });
    }
  }

  async getAnalytics(
    userId?: string, 
    cardId?: string, 
    startDate?: Date, 
    endDate?: Date,
    limitCount: number = 100
  ): Promise<AnalyticsResponse> {
    try {
      let q = query(collection(db, 'analytics'));

      if (userId) {
        q = query(q, where('userId', '==', userId));
      }

      if (cardId) {
        q = query(q, where('cardId', '==', cardId));
      }

      if (startDate) {
        q = query(q, where('timestamp', '>=', Timestamp.fromDate(startDate)));
      }

      if (endDate) {
        q = query(q, where('timestamp', '<=', Timestamp.fromDate(endDate)));
      }

      q = query(q, orderBy('timestamp', 'desc'), limit(limitCount));

      const querySnapshot = await getDocs(q);
      const events: AnalyticsEvent[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        events.push({
          id: doc.id,
          ...data,
          timestamp: data.timestamp instanceof Timestamp ? data.timestamp.toDate() : new Date()
        } as AnalyticsEvent);
      });

      return { success: true, data: events };
    } catch (err) {
      error('Failed to get analytics', err as Error, { component: 'analytics', userId, cardId });
      return { 
        success: false, 
        error: 'Error al obtener datos de analytics' 
      };
    }
  }

  async getMetrics(
    userId?: string, 
    cardId?: string, 
    days: number = 30
  ): Promise<AnalyticsResponse> {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - days);

      // Get raw events
      const eventsResponse = await this.getAnalytics(userId, cardId, startDate, endDate, 1000);
      
      if (!eventsResponse.success || !eventsResponse.data) {
        return eventsResponse;
      }

      const events = eventsResponse.data as AnalyticsEvent[];
      
      // Calculate metrics
      const metrics: AnalyticsMetrics = {
        totalViews: events.filter(e => e.eventType === 'page_view' || e.eventType === 'card_view').length,
        uniqueViews: new Set(events.filter(e => e.eventType === 'page_view' || e.eventType === 'card_view').map(e => e.sessionId)).size,
        totalClicks: events.filter(e => e.eventType === 'link_click' || e.eventType === 'contact_click').length,
        uniqueClicks: new Set(events.filter(e => e.eventType === 'link_click' || e.eventType === 'contact_click').map(e => e.sessionId)).size,
        bounceRate: this.calculateBounceRate(events),
        averageSessionDuration: this.calculateAverageSessionDuration(events),
        topReferrers: this.getTopReferrers(events),
        deviceBreakdown: this.getDeviceBreakdown(events),
        popularPages: this.getPopularPages(events)
      };

      return { success: true, data: metrics };
    } catch (err) {
      error('Failed to calculate metrics', err as Error, { component: 'analytics' });
      return { 
        success: false, 
        error: 'Error al calcular métricas' 
      };
    }
  }

  private calculateBounceRate(events: AnalyticsEvent[]): number {
    const sessionGroups = this.groupEventsBySession(events);
    const totalSessions = Object.keys(sessionGroups).length;
    
    if (totalSessions === 0) return 0;
    
    const bouncedSessions = Object.values(sessionGroups).filter(
      sessionEvents => sessionEvents.length === 1
    ).length;
    
    return (bouncedSessions / totalSessions) * 100;
  }

  private calculateAverageSessionDuration(events: AnalyticsEvent[]): number {
    const sessionGroups = this.groupEventsBySession(events);
    let totalDuration = 0;
    let validSessions = 0;

    Object.values(sessionGroups).forEach(sessionEvents => {
      if (sessionEvents.length > 1) {
        const sortedEvents = sessionEvents.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
        const duration = sortedEvents[sortedEvents.length - 1].timestamp.getTime() - sortedEvents[0].timestamp.getTime();
        totalDuration += duration;
        validSessions++;
      }
    });

    return validSessions > 0 ? totalDuration / validSessions / 1000 : 0; // Return in seconds
  }

  private getTopReferrers(events: AnalyticsEvent[]): Array<{ source: string; count: number }> {
    const referrerCounts: Record<string, number> = {};
    
    events.forEach(event => {
      if (event.referrer) {
        referrerCounts[event.referrer] = (referrerCounts[event.referrer] || 0) + 1;
      }
    });

    return Object.entries(referrerCounts)
      .map(([source, count]) => ({ source, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }

  private getDeviceBreakdown(events: AnalyticsEvent[]): Array<{ device: string; count: number }> {
    const deviceCounts: Record<string, number> = {};
    
    events.forEach(event => {
      if (event.userAgent) {
        const device = this.getDeviceFromUserAgent(event.userAgent);
        deviceCounts[device] = (deviceCounts[device] || 0) + 1;
      }
    });

    return Object.entries(deviceCounts)
      .map(([device, count]) => ({ device, count }))
      .sort((a, b) => b.count - a.count);
  }

  private getPopularPages(events: AnalyticsEvent[]): Array<{ page: string; views: number }> {
    const pageCounts: Record<string, number> = {};
    
    events.filter(e => e.eventType === 'page_view').forEach(event => {
      const page = event.metadata?.page || 'unknown';
      pageCounts[page] = (pageCounts[page] || 0) + 1;
    });

    return Object.entries(pageCounts)
      .map(([page, views]) => ({ page, views }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 10);
  }

  private groupEventsBySession(events: AnalyticsEvent[]): Record<string, AnalyticsEvent[]> {
    const groups: Record<string, AnalyticsEvent[]> = {};
    
    events.forEach(event => {
      if (event.sessionId) {
        if (!groups[event.sessionId]) {
          groups[event.sessionId] = [];
        }
        groups[event.sessionId].push(event);
      }
    });

    return groups;
  }

  private getDeviceFromUserAgent(userAgent: string): string {
    if (/Mobi|Android/i.test(userAgent)) return 'Mobile';
    if (/Tablet|iPad/i.test(userAgent)) return 'Tablet';
    return 'Desktop';
  }

  private trackSessionEnd(): void {
    const duration = Date.now() - this.startTime;
    
    // Track session end event
    this.trackEvent({
      eventType: 'page_view', // Using page_view as a session end indicator
      metadata: { 
        sessionEnd: true, 
        sessionDuration: duration 
      }
    }).catch(() => {
      // Ignore errors on page unload
    });
  }
}

export const analyticsService = new AnalyticsService();