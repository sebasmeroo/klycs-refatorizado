import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  query, 
  where, 
  getDocs,
  deleteDoc
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { logger } from '@/utils/logger';

export interface CalendarIntegration {
  id: string;
  userId: string;
  provider: 'google' | 'outlook' | 'apple';
  calendarId: string;
  calendarName: string;
  accessToken: string;
  refreshToken?: string;
  expiresAt?: Date;
  isActive: boolean;
  permissions: string[];
  metadata: {
    email?: string;
    timeZone?: string;
    syncEnabled?: boolean;
    autoCreateEvents?: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface CalendarEvent {
  id: string;
  integrationId: string;
  bookingId?: string;
  externalEventId: string;
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  attendees: Array<{
    email: string;
    name?: string;
    status: 'accepted' | 'declined' | 'tentative' | 'needsAction';
  }>;
  location?: string;
  meetingLink?: string;
  isAllDay: boolean;
  status: 'confirmed' | 'tentative' | 'cancelled';
  createdAt: Date;
  updatedAt: Date;
}

export interface AvailabilitySlot {
  start: Date;
  end: Date;
  isAvailable: boolean;
  eventTitle?: string;
}

class CalendarIntegrationsService {
  private readonly GOOGLE_API_BASE = 'https://www.googleapis.com/calendar/v3';
  private readonly MICROSOFT_API_BASE = 'https://graph.microsoft.com/v1.0';

  /**
   * Iniciar flujo de autorización de Google Calendar
   */
  getGoogleAuthUrl(userId: string, redirectUri: string): string {
    const clientId = process.env.VITE_GOOGLE_CLIENT_ID;
    if (!clientId) {
      throw new Error('Google Client ID not configured');
    }

    const scopes = [
      'https://www.googleapis.com/auth/calendar',
      'https://www.googleapis.com/auth/calendar.events'
    ].join(' ');

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: scopes,
      access_type: 'offline',
      prompt: 'consent',
      state: userId // Para identificar al usuario en el callback
    });

    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }

  /**
   * Intercambiar código de autorización por tokens de Google
   */
  async exchangeGoogleCode(
    code: string,
    redirectUri: string,
    userId: string
  ): Promise<{ success: boolean; data?: CalendarIntegration; error?: string }> {
    try {
      const clientId = process.env.VITE_GOOGLE_CLIENT_ID;
      const clientSecret = process.env.VITE_GOOGLE_CLIENT_SECRET;

      if (!clientId || !clientSecret) {
        throw new Error('Google credentials not configured');
      }

      // Intercambiar código por tokens
      const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          code,
          grant_type: 'authorization_code',
          redirect_uri: redirectUri
        })
      });

      if (!tokenResponse.ok) {
        const error = await tokenResponse.json();
        throw new Error(error.error_description || 'Failed to exchange code');
      }

      const tokens = await tokenResponse.json();

      // Obtener información del calendario principal
      const calendarResponse = await fetch(`${this.GOOGLE_API_BASE}/calendars/primary`, {
        headers: {
          'Authorization': `Bearer ${tokens.access_token}`
        }
      });

      if (!calendarResponse.ok) {
        throw new Error('Failed to fetch calendar info');
      }

      const calendarInfo = await calendarResponse.json();

      // Guardar integración en Firestore
      const integrationData: Omit<CalendarIntegration, 'id'> = {
        userId,
        provider: 'google',
        calendarId: calendarInfo.id,
        calendarName: calendarInfo.summary || 'Google Calendar',
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiresAt: tokens.expires_in ? new Date(Date.now() + tokens.expires_in * 1000) : undefined,
        isActive: true,
        permissions: ['read', 'write'],
        metadata: {
          email: calendarInfo.id,
          timeZone: calendarInfo.timeZone,
          syncEnabled: true,
          autoCreateEvents: true
        },
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const docRef = doc(collection(db, 'calendar_integrations'));
      await setDoc(docRef, integrationData);

      logger.info('Google Calendar integration created', { 
        userId, 
        calendarId: calendarInfo.id 
      });

      return {
        success: true,
        data: { id: docRef.id, ...integrationData }
      };

    } catch (error) {
      logger.error('Error exchanging Google code', { 
        userId,
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to connect Google Calendar'
      };
    }
  }

  /**
   * Iniciar flujo de autorización de Outlook
   */
  getOutlookAuthUrl(userId: string, redirectUri: string): string {
    const clientId = process.env.VITE_MICROSOFT_CLIENT_ID;
    if (!clientId) {
      throw new Error('Microsoft Client ID not configured');
    }

    const scopes = [
      'https://graph.microsoft.com/calendars.readwrite',
      'https://graph.microsoft.com/calendars.read'
    ].join(' ');

    const params = new URLSearchParams({
      client_id: clientId,
      response_type: 'code',
      redirect_uri: redirectUri,
      response_mode: 'query',
      scope: scopes,
      state: userId
    });

    return `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?${params.toString()}`;
  }

  /**
   * Intercambiar código de autorización por tokens de Microsoft
   */
  async exchangeOutlookCode(
    code: string,
    redirectUri: string,
    userId: string
  ): Promise<{ success: boolean; data?: CalendarIntegration; error?: string }> {
    try {
      const clientId = process.env.VITE_MICROSOFT_CLIENT_ID;
      const clientSecret = process.env.VITE_MICROSOFT_CLIENT_SECRET;

      if (!clientId || !clientSecret) {
        throw new Error('Microsoft credentials not configured');
      }

      // Intercambiar código por tokens
      const tokenResponse = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          code,
          grant_type: 'authorization_code',
          redirect_uri: redirectUri
        })
      });

      if (!tokenResponse.ok) {
        const error = await tokenResponse.json();
        throw new Error(error.error_description || 'Failed to exchange code');
      }

      const tokens = await tokenResponse.json();

      // Obtener información del usuario y calendario
      const userResponse = await fetch(`${this.MICROSOFT_API_BASE}/me`, {
        headers: {
          'Authorization': `Bearer ${tokens.access_token}`
        }
      });

      if (!userResponse.ok) {
        throw new Error('Failed to fetch user info');
      }

      const userInfo = await userResponse.json();

      // Obtener calendarios
      const calendarsResponse = await fetch(`${this.MICROSOFT_API_BASE}/me/calendars`, {
        headers: {
          'Authorization': `Bearer ${tokens.access_token}`
        }
      });

      if (!calendarsResponse.ok) {
        throw new Error('Failed to fetch calendars');
      }

      const calendars = await calendarsResponse.json();
      const primaryCalendar = calendars.value.find((cal: any) => cal.isDefaultCalendar) || calendars.value[0];

      // Guardar integración en Firestore
      const integrationData: Omit<CalendarIntegration, 'id'> = {
        userId,
        provider: 'outlook',
        calendarId: primaryCalendar.id,
        calendarName: primaryCalendar.name || 'Outlook Calendar',
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiresAt: tokens.expires_in ? new Date(Date.now() + tokens.expires_in * 1000) : undefined,
        isActive: true,
        permissions: ['read', 'write'],
        metadata: {
          email: userInfo.mail || userInfo.userPrincipalName,
          timeZone: userInfo.mailboxSettings?.timeZone || 'UTC',
          syncEnabled: true,
          autoCreateEvents: true
        },
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const docRef = doc(collection(db, 'calendar_integrations'));
      await setDoc(docRef, integrationData);

      logger.info('Outlook integration created', { 
        userId, 
        calendarId: primaryCalendar.id 
      });

      return {
        success: true,
        data: { id: docRef.id, ...integrationData }
      };

    } catch (error) {
      logger.error('Error exchanging Outlook code', { 
        userId,
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to connect Outlook'
      };
    }
  }

  /**
   * Obtener integraciones de calendario del usuario
   */
  async getUserIntegrations(userId: string): Promise<{ success: boolean; data?: CalendarIntegration[]; error?: string }> {
    try {
      const q = query(
        collection(db, 'calendar_integrations'),
        where('userId', '==', userId),
        where('isActive', '==', true)
      );

      const snapshot = await getDocs(q);
      const integrations = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as CalendarIntegration));

      return { success: true, data: integrations };

    } catch (error) {
      logger.error('Error getting user integrations', { 
        userId,
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get integrations'
      };
    }
  }

  /**
   * Crear evento en calendario
   */
  async createCalendarEvent(
    integrationId: string,
    eventData: {
      title: string;
      description?: string;
      startTime: Date;
      endTime: Date;
      attendees?: Array<{ email: string; name?: string }>;
      location?: string;
      meetingLink?: string;
    },
    bookingId?: string
  ): Promise<{ success: boolean; data?: CalendarEvent; error?: string }> {
    try {
      const integrationDoc = await getDoc(doc(db, 'calendar_integrations', integrationId));
      if (!integrationDoc.exists()) {
        throw new Error('Integration not found');
      }

      const integration = { id: integrationDoc.id, ...integrationDoc.data() } as CalendarIntegration;

      // Verificar si el token ha expirado y renovarlo si es necesario
      if (integration.expiresAt && integration.expiresAt < new Date()) {
        const refreshResult = await this.refreshAccessToken(integration);
        if (!refreshResult.success) {
          throw new Error('Failed to refresh access token');
        }
        integration.accessToken = refreshResult.newToken!;
      }

      let externalEventId: string;

      if (integration.provider === 'google') {
        externalEventId = await this.createGoogleEvent(integration, eventData);
      } else if (integration.provider === 'outlook') {
        externalEventId = await this.createOutlookEvent(integration, eventData);
      } else {
        throw new Error('Unsupported calendar provider');
      }

      // Guardar evento en Firestore
      const calendarEventData: Omit<CalendarEvent, 'id'> = {
        integrationId,
        bookingId,
        externalEventId,
        title: eventData.title,
        description: eventData.description,
        startTime: eventData.startTime,
        endTime: eventData.endTime,
        attendees: eventData.attendees?.map(att => ({
          ...att,
          status: 'needsAction' as const
        })) || [],
        location: eventData.location,
        meetingLink: eventData.meetingLink,
        isAllDay: false,
        status: 'confirmed',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const docRef = doc(collection(db, 'calendar_events'));
      await setDoc(docRef, calendarEventData);

      logger.info('Calendar event created', { 
        integrationId, 
        externalEventId, 
        bookingId 
      });

      return {
        success: true,
        data: { id: docRef.id, ...calendarEventData }
      };

    } catch (error) {
      logger.error('Error creating calendar event', { 
        integrationId,
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create event'
      };
    }
  }

  /**
   * Crear evento en Google Calendar
   */
  private async createGoogleEvent(
    integration: CalendarIntegration,
    eventData: any
  ): Promise<string> {
    const googleEvent = {
      summary: eventData.title,
      description: eventData.description,
      start: {
        dateTime: eventData.startTime.toISOString(),
        timeZone: integration.metadata.timeZone || 'UTC'
      },
      end: {
        dateTime: eventData.endTime.toISOString(),
        timeZone: integration.metadata.timeZone || 'UTC'
      },
      attendees: eventData.attendees?.map((att: any) => ({
        email: att.email,
        displayName: att.name
      })),
      location: eventData.location,
      conferenceData: eventData.meetingLink ? {
        createRequest: {
          requestId: `klycs-${Date.now()}`,
          conferenceSolutionKey: { type: 'hangoutsMeet' }
        }
      } : undefined
    };

    const response = await fetch(`${this.GOOGLE_API_BASE}/calendars/${integration.calendarId}/events`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${integration.accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(googleEvent)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to create Google event');
    }

    const createdEvent = await response.json();
    return createdEvent.id;
  }

  /**
   * Crear evento en Outlook
   */
  private async createOutlookEvent(
    integration: CalendarIntegration,
    eventData: any
  ): Promise<string> {
    const outlookEvent = {
      subject: eventData.title,
      body: {
        contentType: 'text',
        content: eventData.description || ''
      },
      start: {
        dateTime: eventData.startTime.toISOString(),
        timeZone: integration.metadata.timeZone || 'UTC'
      },
      end: {
        dateTime: eventData.endTime.toISOString(),
        timeZone: integration.metadata.timeZone || 'UTC'
      },
      attendees: eventData.attendees?.map((att: any) => ({
        emailAddress: {
          address: att.email,
          name: att.name
        }
      })),
      location: eventData.location ? {
        displayName: eventData.location
      } : undefined,
      onlineMeeting: eventData.meetingLink ? {
        conferenceId: `klycs-${Date.now()}`
      } : undefined
    };

    const response = await fetch(`${this.MICROSOFT_API_BASE}/me/calendars/${integration.calendarId}/events`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${integration.accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(outlookEvent)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to create Outlook event');
    }

    const createdEvent = await response.json();
    return createdEvent.id;
  }

  /**
   * Obtener disponibilidad del calendario
   */
  async getAvailability(
    integrationId: string,
    startDate: Date,
    endDate: Date,
    timeSlotDuration: number = 60 // en minutos
  ): Promise<{ success: boolean; data?: AvailabilitySlot[]; error?: string }> {
    try {
      const integrationDoc = await getDoc(doc(db, 'calendar_integrations', integrationId));
      if (!integrationDoc.exists()) {
        throw new Error('Integration not found');
      }

      const integration = { id: integrationDoc.id, ...integrationDoc.data() } as CalendarIntegration;

      // Verificar token
      if (integration.expiresAt && integration.expiresAt < new Date()) {
        const refreshResult = await this.refreshAccessToken(integration);
        if (!refreshResult.success) {
          throw new Error('Failed to refresh access token');
        }
        integration.accessToken = refreshResult.newToken!;
      }

      let events: any[];

      if (integration.provider === 'google') {
        events = await this.getGoogleEvents(integration, startDate, endDate);
      } else if (integration.provider === 'outlook') {
        events = await this.getOutlookEvents(integration, startDate, endDate);
      } else {
        throw new Error('Unsupported calendar provider');
      }

      // Generar slots de disponibilidad
      const availabilitySlots = this.generateAvailabilitySlots(
        startDate,
        endDate,
        events,
        timeSlotDuration
      );

      return { success: true, data: availabilitySlots };

    } catch (error) {
      logger.error('Error getting availability', { 
        integrationId,
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get availability'
      };
    }
  }

  /**
   * Obtener eventos de Google Calendar
   */
  private async getGoogleEvents(
    integration: CalendarIntegration,
    startDate: Date,
    endDate: Date
  ): Promise<any[]> {
    const params = new URLSearchParams({
      timeMin: startDate.toISOString(),
      timeMax: endDate.toISOString(),
      singleEvents: 'true',
      orderBy: 'startTime'
    });

    const response = await fetch(
      `${this.GOOGLE_API_BASE}/calendars/${integration.calendarId}/events?${params}`,
      {
        headers: {
          'Authorization': `Bearer ${integration.accessToken}`
        }
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch Google events');
    }

    const data = await response.json();
    return data.items || [];
  }

  /**
   * Obtener eventos de Outlook
   */
  private async getOutlookEvents(
    integration: CalendarIntegration,
    startDate: Date,
    endDate: Date
  ): Promise<any[]> {
    const params = new URLSearchParams({
      startDateTime: startDate.toISOString(),
      endDateTime: endDate.toISOString(),
      '$orderby': 'start/dateTime'
    });

    const response = await fetch(
      `${this.MICROSOFT_API_BASE}/me/calendars/${integration.calendarId}/events?${params}`,
      {
        headers: {
          'Authorization': `Bearer ${integration.accessToken}`
        }
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch Outlook events');
    }

    const data = await response.json();
    return data.value || [];
  }

  /**
   * Generar slots de disponibilidad
   */
  private generateAvailabilitySlots(
    startDate: Date,
    endDate: Date,
    events: any[],
    slotDuration: number
  ): AvailabilitySlot[] {
    const slots: AvailabilitySlot[] = [];
    const slotDurationMs = slotDuration * 60 * 1000;

    let currentTime = new Date(startDate);
    
    while (currentTime < endDate) {
      const slotEnd = new Date(currentTime.getTime() + slotDurationMs);
      
      // Verificar si hay conflicto con eventos existentes
      const hasConflict = events.some(event => {
        let eventStart: Date, eventEnd: Date;
        
        // Manejar diferentes formatos de fecha según el proveedor
        if (event.start?.dateTime) {
          eventStart = new Date(event.start.dateTime);
          eventEnd = new Date(event.end.dateTime);
        } else if (event.start?.date) {
          eventStart = new Date(event.start.date);
          eventEnd = new Date(event.end.date);
        } else {
          return false;
        }

        return (currentTime < eventEnd && slotEnd > eventStart);
      });

      // Solo incluir slots en horario laboral (9 AM - 6 PM)
      const hour = currentTime.getHours();
      const isWorkingHours = hour >= 9 && hour < 18;
      const isWeekday = currentTime.getDay() >= 1 && currentTime.getDay() <= 5;

      if (isWorkingHours && isWeekday) {
        slots.push({
          start: new Date(currentTime),
          end: new Date(slotEnd),
          isAvailable: !hasConflict,
          eventTitle: hasConflict ? 'Ocupado' : undefined
        });
      }

      currentTime = new Date(currentTime.getTime() + slotDurationMs);
    }

    return slots;
  }

  /**
   * Renovar token de acceso
   */
  private async refreshAccessToken(
    integration: CalendarIntegration
  ): Promise<{ success: boolean; newToken?: string; error?: string }> {
    try {
      if (!integration.refreshToken) {
        throw new Error('No refresh token available');
      }

      let tokenResponse: Response;

      if (integration.provider === 'google') {
        const clientId = process.env.VITE_GOOGLE_CLIENT_ID;
        const clientSecret = process.env.VITE_GOOGLE_CLIENT_SECRET;

        tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            client_id: clientId!,
            client_secret: clientSecret!,
            refresh_token: integration.refreshToken,
            grant_type: 'refresh_token'
          })
        });
      } else {
        const clientId = process.env.VITE_MICROSOFT_CLIENT_ID;
        const clientSecret = process.env.VITE_MICROSOFT_CLIENT_SECRET;

        tokenResponse = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            client_id: clientId!,
            client_secret: clientSecret!,
            refresh_token: integration.refreshToken,
            grant_type: 'refresh_token'
          })
        });
      }

      if (!tokenResponse.ok) {
        throw new Error('Failed to refresh token');
      }

      const tokens = await tokenResponse.json();

      // Actualizar en Firestore
      await updateDoc(doc(db, 'calendar_integrations', integration.id), {
        accessToken: tokens.access_token,
        expiresAt: tokens.expires_in ? new Date(Date.now() + tokens.expires_in * 1000) : undefined,
        updatedAt: new Date()
      });

      return { success: true, newToken: tokens.access_token };

    } catch (error) {
      logger.error('Error refreshing access token', { 
        integrationId: integration.id,
        provider: integration.provider,
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to refresh token'
      };
    }
  }

  /**
   * Desconectar integración de calendario
   */
  async disconnectCalendar(integrationId: string): Promise<{ success: boolean; error?: string }> {
    try {
      await updateDoc(doc(db, 'calendar_integrations', integrationId), {
        isActive: false,
        updatedAt: new Date()
      });

      logger.info('Calendar integration disconnected', { integrationId });

      return { success: true };

    } catch (error) {
      logger.error('Error disconnecting calendar', { 
        integrationId,
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to disconnect calendar'
      };
    }
  }

  /**
   * Sincronizar eventos desde calendario externo
   */
  async syncCalendarEvents(integrationId: string): Promise<{ success: boolean; syncedCount?: number; error?: string }> {
    try {
      const integrationDoc = await getDoc(doc(db, 'calendar_integrations', integrationId));
      if (!integrationDoc.exists()) {
        throw new Error('Integration not found');
      }

      const integration = { id: integrationDoc.id, ...integrationDoc.data() } as CalendarIntegration;

      if (!integration.metadata.syncEnabled) {
        return { success: true, syncedCount: 0 };
      }

      // Obtener eventos de los próximos 30 días
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 30);

      let events: any[];

      if (integration.provider === 'google') {
        events = await this.getGoogleEvents(integration, startDate, endDate);
      } else if (integration.provider === 'outlook') {
        events = await this.getOutlookEvents(integration, startDate, endDate);
      } else {
        throw new Error('Unsupported calendar provider');
      }

      // Procesar y guardar eventos
      let syncedCount = 0;
      for (const event of events) {
        await this.saveExternalEvent(integration, event);
        syncedCount++;
      }

      logger.info('Calendar events synced', { 
        integrationId, 
        syncedCount 
      });

      return { success: true, syncedCount };

    } catch (error) {
      logger.error('Error syncing calendar events', { 
        integrationId,
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to sync events'
      };
    }
  }

  /**
   * Guardar evento externo en Firestore
   */
  private async saveExternalEvent(integration: CalendarIntegration, event: any): Promise<void> {
    let eventData: Partial<CalendarEvent>;

    if (integration.provider === 'google') {
      eventData = {
        integrationId: integration.id,
        externalEventId: event.id,
        title: event.summary || 'Sin título',
        description: event.description,
        startTime: new Date(event.start.dateTime || event.start.date),
        endTime: new Date(event.end.dateTime || event.end.date),
        attendees: event.attendees?.map((att: any) => ({
          email: att.email,
          name: att.displayName,
          status: att.responseStatus
        })) || [],
        location: event.location,
        isAllDay: !event.start.dateTime,
        status: event.status === 'cancelled' ? 'cancelled' : 'confirmed'
      };
    } else {
      eventData = {
        integrationId: integration.id,
        externalEventId: event.id,
        title: event.subject || 'Sin título',
        description: event.body?.content,
        startTime: new Date(event.start.dateTime),
        endTime: new Date(event.end.dateTime),
        attendees: event.attendees?.map((att: any) => ({
          email: att.emailAddress.address,
          name: att.emailAddress.name,
          status: att.status?.response || 'needsAction'
        })) || [],
        location: event.location?.displayName,
        isAllDay: event.isAllDay,
        status: event.isCancelled ? 'cancelled' : 'confirmed'
      };
    }

    // Verificar si el evento ya existe
    const q = query(
      collection(db, 'calendar_events'),
      where('integrationId', '==', integration.id),
      where('externalEventId', '==', eventData.externalEventId)
    );

    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      // Crear nuevo evento
      const docRef = doc(collection(db, 'calendar_events'));
      await setDoc(docRef, {
        ...eventData,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    } else {
      // Actualizar evento existente
      const docRef = snapshot.docs[0].ref;
      await updateDoc(docRef, {
        ...eventData,
        updatedAt: new Date()
      });
    }
  }
}

export const calendarIntegrationsService = new CalendarIntegrationsService();