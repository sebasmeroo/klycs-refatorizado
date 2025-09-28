import {
  collection,
  doc,
  addDoc,
  getDocs,
  getDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  Timestamp,
  serverTimestamp,
  writeBatch,
  arrayUnion,
  arrayRemove
} from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import {
  SharedCalendar,
  CalendarEvent,
  EventComment,
  CalendarInvitation,
  CalendarNotification,
  CalendarUser,
  SharedCalendarFirestore,
  CalendarEventFirestore,
  UserCalendarSettings,
  CalendarStats
} from '@/types/calendar';
import { info, error as logError } from '@/utils/logger';

// ===== CALENDARIOS COMPARTIDOS =====

export class CollaborativeCalendarService {
  
  // Crear un nuevo calendario
  static async createCalendar(
    ownerId: string,
    name: string,
    description?: string,
    color: string = '#3B82F6'
  ): Promise<string> {
    try {
      const calendarData: Omit<SharedCalendarFirestore, 'id'> = {
        name,
        description,
        color,
        ownerId,
        members: [{
          id: ownerId,
          name: 'Propietario', // Se actualizará con datos reales
          email: '', // Se actualizará con datos reales
          color: color,
          role: 'owner',
          joinedAt: Timestamp.now(),
          isActive: true
        }],
        settings: {
          allowMemberInvites: true,
          allowEventEditing: true,
          allowEventDeleting: false,
          requireApproval: false,
          defaultEventDuration: 60,
          workingHours: {
            enabled: true,
            start: '09:00',
            end: '18:00',
            weekdays: [1, 2, 3, 4, 5]
          },
          notifications: {
            newEvents: true,
            eventChanges: true,
            reminders: true,
            comments: true
          },
          timezone: 'Europe/Madrid'
        },
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        isPublic: false
      };

      const docRef = await addDoc(collection(db, 'shared_calendars'), calendarData);
      
      info('Calendario colaborativo creado', { calendarId: docRef.id, ownerId });
      return docRef.id;
      
    } catch (error) {
      logError('Error al crear calendario', error as Error, { ownerId, name });
      throw error;
    }
  }

  // Crear calendario profesional con datos completos
  static async createProfessionalCalendar(
    calendarData: Omit<SharedCalendar, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<string> {
    try {
      console.log('🚀 Iniciando creación de calendario profesional:', calendarData);
      
      // Convertir datos a formato Firestore
      const firestoreData: Omit<SharedCalendarFirestore, 'id'> = {
        name: calendarData.name,
        description: calendarData.description,
        color: calendarData.color,
        ownerId: calendarData.ownerId,
        linkedEmail: calendarData.linkedEmail, // Email vinculado del profesional
        members: calendarData.members.map(member => ({
          ...member,
          joinedAt: Timestamp.fromDate(member.joinedAt)
        })),
        settings: {
          allowMemberInvites: calendarData.settings.allowMemberInvites,
          allowEventEditing: calendarData.settings.allowEventEditing,
          allowEventDeleting: calendarData.settings.allowEventDeleting,
          requireApproval: calendarData.settings.requireApproval,
          defaultEventDuration: calendarData.settings.defaultEventDuration,
          workingHours: {
            enabled: calendarData.settings.workingHours.enabled,
            start: calendarData.settings.workingHours.start,
            end: calendarData.settings.workingHours.end,
            weekdays: calendarData.settings.workingHours.weekdays
          },
          notifications: {
            newEvents: calendarData.settings.notifications.newEvents,
            eventChanges: calendarData.settings.notifications.eventChanges,
            reminders: calendarData.settings.notifications.reminders,
            comments: calendarData.settings.notifications.comments
          },
          timezone: calendarData.settings.timezone
        },
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        isPublic: calendarData.isPublic || false
      };

      console.log('📊 Datos convertidos para Firestore:', firestoreData);

      const docRef = await addDoc(collection(db, 'shared_calendars'), firestoreData);
      
      console.log('✅ Calendario creado exitosamente con ID:', docRef.id);
      info('Calendario profesional creado', { 
        calendarId: docRef.id, 
        ownerId: calendarData.ownerId,
        linkedEmail: calendarData.linkedEmail,
        name: calendarData.name 
      });
      
      return docRef.id;
      
    } catch (error) {
      console.error('❌ Error al crear calendario profesional:', error);
      logError('Error al crear calendario profesional', error as Error, { 
        ownerId: calendarData.ownerId,
        name: calendarData.name,
        linkedEmail: calendarData.linkedEmail 
      });
      throw error;
    }
  }

  // Obtener calendario por ID
  static async getCalendarById(calendarId: string): Promise<SharedCalendar | null> {
    try {
      const calendarRef = doc(db, 'shared_calendars', calendarId);
      const calendarSnap = await getDoc(calendarRef);

      if (!calendarSnap.exists()) {
        return null;
      }

      const data = calendarSnap.data() as SharedCalendarFirestore;

      return {
        ...data,
        id: calendarSnap.id,
        createdAt: data.createdAt.toDate(),
        updatedAt: data.updatedAt.toDate(),
        inviteExpiresAt: data.inviteExpiresAt?.toDate(),
        members: data.members.map(member => ({
          ...member,
          joinedAt: member.joinedAt.toDate()
        }))
      };

    } catch (error) {
      logError('Error obteniendo calendario por ID', error as Error, { calendarId });
      return null;
    }
  }

  // Obtener calendarios del usuario
  static async getUserCalendars(userId: string): Promise<SharedCalendar[]> {
    try {
      console.log('🔍 Buscando calendarios para userId:', userId);
      
      // ✅ BUSCAR POR OWNER ID (calendarios profesionales creados por el usuario)
      const ownerQuery = query(
        collection(db, 'shared_calendars'),
        where('ownerId', '==', userId)
      );
      
      const ownerSnapshot = await getDocs(ownerQuery);
      const calendars: SharedCalendar[] = [];
      
      console.log('📊 Calendarios encontrados por ownerId:', ownerSnapshot.size);
      
      ownerSnapshot.forEach(doc => {
        const data = doc.data() as SharedCalendarFirestore;
        const calendar: SharedCalendar = {
          ...data,
          id: doc.id,
          createdAt: data.createdAt.toDate(),
          updatedAt: data.updatedAt.toDate(),
          inviteExpiresAt: data.inviteExpiresAt?.toDate(),
          members: data.members.map(member => ({
            ...member,
            joinedAt: member.joinedAt.toDate()
          }))
        };
        
        console.log('📅 Calendario encontrado:', { 
          id: calendar.id, 
          name: calendar.name, 
          linkedEmail: calendar.linkedEmail 
        });
        
        calendars.push(calendar);
      });
      
      console.log('✅ Total calendarios devueltos:', calendars.length);
      return calendars;
      
    } catch (error) {
      logError('Error al obtener calendarios del usuario', error as Error, { userId });
      return [];
    }
  }

  // Escuchar cambios en calendarios
  static subscribeToUserCalendars(
    userId: string,
    callback: (calendars: SharedCalendar[]) => void
  ): () => void {
    const q = query(
      collection(db, 'shared_calendars'),
      where('members', 'array-contains-any', [
        { id: userId }
      ])
    );
    
    return onSnapshot(q, snapshot => {
      const calendars: SharedCalendar[] = [];
      
      snapshot.forEach(doc => {
        const data = doc.data() as SharedCalendarFirestore;
        calendars.push({
          ...data,
          id: doc.id,
          createdAt: data.createdAt.toDate(),
          updatedAt: data.updatedAt.toDate(),
          inviteExpiresAt: data.inviteExpiresAt?.toDate(),
          members: data.members.map(member => ({
            ...member,
            joinedAt: member.joinedAt.toDate()
          }))
        });
      });
      
      callback(calendars);
    });
  }

  // Generar código de invitación
  static async generateInviteCode(calendarId: string, expiresInHours: number = 72): Promise<string> {
    try {
      const inviteCode = Math.random().toString(36).substring(2, 15) + 
                        Math.random().toString(36).substring(2, 15);
      
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + expiresInHours);
      
      await updateDoc(doc(db, 'shared_calendars', calendarId), {
        inviteCode,
        inviteExpiresAt: Timestamp.fromDate(expiresAt),
        updatedAt: Timestamp.now()
      });
      
      return inviteCode;
      
    } catch (error) {
      logError('Error al generar código de invitación', error as Error, { calendarId });
      throw error;
    }
  }

  // Unirse a calendario con código
  static async joinCalendarWithCode(
    inviteCode: string,
    user: CalendarUser
  ): Promise<string> {
    try {
      const q = query(
        collection(db, 'shared_calendars'),
        where('inviteCode', '==', inviteCode)
      );
      
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        throw new Error('Código de invitación inválido');
      }
      
      const calendarDoc = snapshot.docs[0];
      const calendarData = calendarDoc.data() as SharedCalendarFirestore;
      
      // Verificar expiración
      if (calendarData.inviteExpiresAt && calendarData.inviteExpiresAt.toDate() < new Date()) {
        throw new Error('El código de invitación ha expirado');
      }
      
      // Verificar si el usuario ya es miembro
      const isMember = calendarData.members.some(member => member.id === user.id);
      if (isMember) {
        throw new Error('Ya eres miembro de este calendario');
      }
      
      // Añadir usuario al calendario
      await updateDoc(doc(db, 'shared_calendars', calendarDoc.id), {
        members: arrayUnion({
          ...user,
          joinedAt: Timestamp.now()
        }),
        updatedAt: Timestamp.now()
      });
      
      return calendarDoc.id;
      
    } catch (error) {
      logError('Error al unirse al calendario', error as Error, { inviteCode, userId: user.id });
      throw error;
    }
  }

  // ===== BÚSQUEDA POR EMAIL VINCULADO =====
  
  static async findCalendarsByLinkedEmail(linkedEmail: string): Promise<SharedCalendar[]> {
    try {
      console.log('🔍 INICIANDO BÚSQUEDA por linkedEmail:', linkedEmail);
      
      // ✅ VERIFICAR AUTENTICACIÓN
      const user = auth.currentUser;
      console.log('👤 Usuario autenticado:', user ? 'SÍ' : 'NO');
      if (user) {
        console.log('🆔 UID:', user.uid);
        console.log('📧 Email:', user.email);
        console.log('🎫 Usuario verificado:', !!user);
      }
      
      console.log('🏗️ Construyendo query para shared_calendars...');
      const q = query(
        collection(db, 'shared_calendars'),
        where('linkedEmail', '==', linkedEmail)
      );
      console.log('✅ Query construida exitosamente');
      
      console.log('🚀 Ejecutando getDocs...');
      const snapshot = await getDocs(q);
      console.log('📊 Respuesta recibida. Documentos encontrados:', snapshot.size);
      
      const calendars: SharedCalendar[] = [];
      
      snapshot.forEach(doc => {
        console.log('📄 Procesando documento:', doc.id);
        const data = doc.data() as SharedCalendarFirestore;
        console.log('📋 Datos del documento:', {
          name: data.name,
          linkedEmail: data.linkedEmail,
          ownerId: data.ownerId,
          createdAt: data.createdAt
        });
        
        const calendar: SharedCalendar = {
          ...data,
          id: doc.id,
          createdAt: data.createdAt.toDate(),
          updatedAt: data.updatedAt.toDate(),
          inviteExpiresAt: data.inviteExpiresAt?.toDate(),
          members: data.members.map(member => ({
            ...member,
            joinedAt: member.joinedAt.toDate()
          }))
        };
        
        console.log('📅 Calendario procesado:', { 
          id: calendar.id, 
          name: calendar.name, 
          linkedEmail: calendar.linkedEmail,
          ownerId: calendar.ownerId
        });
        
        calendars.push(calendar);
      });
      
      console.log('✅ BÚSQUEDA COMPLETADA. Total calendarios devueltos para', linkedEmail, ':', calendars.length);
      return calendars;
      
    } catch (error) {
      console.error('❌ ERROR DETALLADO buscando calendarios por linkedEmail:', error);
      console.error('🔥 Error name:', (error as any)?.name);
      console.error('🔥 Error message:', (error as any)?.message);
      console.error('🔥 Error code:', (error as any)?.code);
      console.error('🔥 Error stack:', (error as any)?.stack);
      
      // ✅ FALLBACK: Si falla la búsqueda específica, intentar buscar todos los calendarios
      console.log('🔄 INTENTANDO FALLBACK: Buscar todos los calendarios...');
      try {
        const allQuery = query(collection(db, 'shared_calendars'));
        const allSnapshot = await getDocs(allQuery);
        console.log('📊 Total calendarios en la base de datos:', allSnapshot.size);
        
        const matchingCalendars: SharedCalendar[] = [];
        allSnapshot.forEach(doc => {
          const data = doc.data() as SharedCalendarFirestore;
          if (data.linkedEmail === linkedEmail) {
            console.log('✅ ENCONTRADO MATCH en fallback:', {
              id: doc.id,
              name: data.name,
              linkedEmail: data.linkedEmail
            });
            
            const calendar: SharedCalendar = {
              ...data,
              id: doc.id,
              createdAt: data.createdAt.toDate(),
              updatedAt: data.updatedAt.toDate(),
              inviteExpiresAt: data.inviteExpiresAt?.toDate(),
              members: data.members.map(member => ({
                ...member,
                joinedAt: member.joinedAt.toDate()
              }))
            };
            matchingCalendars.push(calendar);
          }
        });
        
        console.log('🎯 FALLBACK COMPLETADO. Calendarios encontrados:', matchingCalendars.length);
        return matchingCalendars;
        
      } catch (fallbackError) {
        console.error('💥 FALLBACK TAMBIÉN FALLÓ:', fallbackError);
        logError('Error al buscar calendarios por linkedEmail', error as Error, { linkedEmail });
        return [];
      }
    }
  }

  // ===== ELIMINAR CALENDARIO =====
  
  static async deleteCalendar(calendarId: string): Promise<void> {
    try {
      console.log('🗑️ Eliminando calendario:', calendarId);
      
      // Eliminar todos los eventos del calendario primero
      const eventsQuery = query(
        collection(db, 'calendar_events'),
        where('calendarId', '==', calendarId)
      );
      
      const eventsSnapshot = await getDocs(eventsQuery);
      const batch = writeBatch(db);
      
      eventsSnapshot.forEach((eventDoc) => {
        batch.delete(eventDoc.ref);
      });
      
      // Eliminar el calendario
      batch.delete(doc(db, 'shared_calendars', calendarId));
      
      await batch.commit();
      
      console.log('✅ Calendario eliminado exitosamente:', calendarId);
      info('Calendario eliminado', { calendarId, eventsDeleted: eventsSnapshot.size });
      
    } catch (error) {
      console.error('❌ Error eliminando calendario:', error);
      logError('Error al eliminar calendario', error as Error, { calendarId });
      throw error;
    }
  }
}

// ===== EVENTOS DEL CALENDARIO =====

export class CalendarEventService {
  
  // Crear evento
  static async createEvent(
    calendarId: string,
    eventData: Omit<CalendarEvent, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<string> {
    try {
      console.log('📅 Datos del evento recibidos:', JSON.stringify(eventData, null, 2));
      
      // ✅ LIMPIAR VALORES UNDEFINED antes de enviar a Firebase
      const cleanEventData: any = {
        calendarId: eventData.calendarId,
        title: eventData.title,
        startDate: Timestamp.fromDate(eventData.startDate),
        endDate: Timestamp.fromDate(eventData.endDate),
        isAllDay: eventData.isAllDay || false,
        createdBy: eventData.createdBy,
        attendees: eventData.attendees || [],
        status: eventData.status || 'confirmed',
        visibility: eventData.visibility || 'public',
        color: eventData.color || '#3B82F6',
        comments: eventData.comments || [],
        attachments: eventData.attachments || [],
        reminders: eventData.reminders || [],
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      };
      
      // Solo agregar campos opcionales si tienen valor
      if (eventData.description && eventData.description.trim()) {
        cleanEventData.description = eventData.description.trim();
      }
      
      if (eventData.location && eventData.location.trim()) {
        cleanEventData.location = eventData.location.trim();
      }
      
      if (eventData.recurring) {
        cleanEventData.recurring = {
          ...eventData.recurring,
          endDate: eventData.recurring.endDate ? Timestamp.fromDate(eventData.recurring.endDate) : null
        };
      }
      
      console.log('🧹 Datos limpios para Firebase:', JSON.stringify(cleanEventData, null, 2));
      
      const docRef = await addDoc(collection(db, 'calendar_events'), cleanEventData);
      
      console.log('✅ Evento creado exitosamente con ID:', docRef.id);
      info('Evento creado', { eventId: docRef.id, calendarId });
      return docRef.id;
      
    } catch (error) {
      console.error('❌ Error detallado al crear evento:', error);
      logError('Error al crear evento', error as Error, { calendarId });
      throw error;
    }
  }

  // Obtener eventos de calendarios
  static async getCalendarEvents(
    calendarIds: string[],
    startDate?: Date,
    endDate?: Date
  ): Promise<CalendarEvent[]> {
    try {
      console.log('📅 INICIANDO CARGA DE EVENTOS para calendarios:', calendarIds);
      
      // ✅ VERIFICAR AUTENTICACIÓN
      const user = auth.currentUser;
      console.log('👤 Usuario autenticado al cargar eventos:', user ? 'SÍ' : 'NO');
      if (user) {
        console.log('🆔 UID:', user.uid);
        console.log('📧 Email:', user.email);
      }
      
      console.log('🏗️ Construyendo query para calendar_events...');
      console.log('📋 CalendarIds a buscar:', calendarIds);
      console.log('📅 Rango de fechas:', { startDate, endDate });
      
      let q = query(
        collection(db, 'calendar_events'),
        where('calendarId', 'in', calendarIds.slice(0, 10)) // Firestore limit
      );
      console.log('✅ Query base construida');
      
      if (startDate && endDate) {
        console.log('🗓️ Agregando filtros de fecha...');
        q = query(q,
          where('startDate', '>=', Timestamp.fromDate(startDate)),
          where('startDate', '<=', Timestamp.fromDate(endDate))
        );
        console.log('✅ Filtros de fecha agregados');
      }
      
      q = query(q, orderBy('startDate', 'asc'));
      console.log('✅ Ordenamiento agregado');
      
      console.log('🚀 Ejecutando getDocs para eventos...');
      const snapshot = await getDocs(q);
      console.log('📊 Eventos encontrados en Firestore:', snapshot.size);
      
      const events: CalendarEvent[] = [];
      
      snapshot.forEach(doc => {
        console.log('📄 Procesando evento:', doc.id);
        const data = doc.data() as CalendarEventFirestore;
        console.log('📋 Datos del evento:', {
          id: doc.id,
          title: data.title,
          calendarId: data.calendarId,
          startDate: data.startDate,
          createdBy: data.createdBy
        });
        
        const event: CalendarEvent = {
          ...data,
          id: doc.id,
          startDate: data.startDate.toDate(),
          endDate: data.endDate.toDate(),
          createdAt: data.createdAt.toDate(),
          updatedAt: data.updatedAt.toDate(),
          recurring: data.recurring ? {
            ...data.recurring,
            endDate: data.recurring.endDate?.toDate()
          } : undefined
        };
        
        events.push(event);
      });
      
      console.log('✅ CARGA DE EVENTOS COMPLETADA. Total eventos devueltos:', events.length);
      return events;
      
    } catch (error) {
      console.error('❌ ERROR DETALLADO cargando eventos:', error);
      console.error('🔥 Error name:', (error as any)?.name);
      console.error('🔥 Error message:', (error as any)?.message);
      console.error('🔥 Error code:', (error as any)?.code);
      console.error('🔥 Error stack:', (error as any)?.stack);
      
      logError('Error al obtener eventos', error as Error, { calendarIds });
      return [];
    }
  }

  // Escuchar eventos en tiempo real
  static subscribeToCalendarEvents(
    calendarIds: string[],
    callback: (events: CalendarEvent[]) => void,
    startDate?: Date,
    endDate?: Date
  ): () => void {
    let q = query(
      collection(db, 'calendar_events'),
      where('calendarId', 'in', calendarIds.slice(0, 10))
    );
    
    if (startDate && endDate) {
      q = query(q,
        where('startDate', '>=', Timestamp.fromDate(startDate)),
        where('startDate', '<=', Timestamp.fromDate(endDate))
      );
    }
    
    q = query(q, orderBy('startDate', 'asc'));
    
    return onSnapshot(q, snapshot => {
      const events: CalendarEvent[] = [];
      
      snapshot.forEach(doc => {
        const data = doc.data() as CalendarEventFirestore;
        events.push({
          ...data,
          id: doc.id,
          startDate: data.startDate.toDate(),
          endDate: data.endDate.toDate(),
          createdAt: data.createdAt.toDate(),
          updatedAt: data.updatedAt.toDate(),
          recurring: data.recurring ? {
            ...data.recurring,
            endDate: data.recurring.endDate?.toDate()
          } : undefined
        });
      });
      
      callback(events);
    });
  }

  // Actualizar evento
  static async updateEvent(
    eventId: string,
    updates: Partial<Omit<CalendarEvent, 'id' | 'createdAt'>>
  ): Promise<void> {
    try {
      const updateData: any = {
        ...updates,
        updatedAt: Timestamp.now()
      };
      
      if (updates.startDate) {
        updateData.startDate = Timestamp.fromDate(updates.startDate);
      }
      if (updates.endDate) {
        updateData.endDate = Timestamp.fromDate(updates.endDate);
      }
      
      await updateDoc(doc(db, 'calendar_events', eventId), updateData);
      
    } catch (error) {
      logError('Error al actualizar evento', error as Error, { eventId });
      throw error;
    }
  }

  // Eliminar evento
  static async deleteEvent(eventId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'calendar_events', eventId));
      
    } catch (error) {
      logError('Error al eliminar evento', error as Error, { eventId });
      throw error;
    }
  }
}

// ===== COMENTARIOS DE EVENTOS =====

export class EventCommentService {
  
  // Añadir comentario
  static async addComment(
    eventId: string,
    userId: string,
    userName: string,
    message: string,
    userAvatar?: string
  ): Promise<string> {
    try {
      const commentData = {
        eventId,
        userId,
        userName,
        userAvatar,
        message,
        createdAt: Timestamp.now()
      };
      
      const docRef = await addDoc(collection(db, 'event_comments'), commentData);
      return docRef.id;
      
    } catch (error) {
      logError('Error al añadir comentario', error as Error, { eventId, userId });
      throw error;
    }
  }

  // Obtener comentarios de evento
  static subscribeToEventComments(
    eventId: string,
    callback: (comments: EventComment[]) => void
  ): () => void {
    const q = query(
      collection(db, 'event_comments'),
      where('eventId', '==', eventId),
      orderBy('createdAt', 'asc')
    );
    
    return onSnapshot(q, snapshot => {
      const comments: EventComment[] = [];
      
      snapshot.forEach(doc => {
        const data = doc.data();
        comments.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt.toDate(),
          updatedAt: data.updatedAt?.toDate()
        } as EventComment);
      });
      
      callback(comments);
    });
  }
}

// ===== ESTADÍSTICAS =====

export class CalendarStatsService {
  
  static async getStats(userId: string): Promise<CalendarStats> {
    try {
      // Obtener calendarios del usuario
      const calendars = await CollaborativeCalendarService.getUserCalendars(userId);
      const calendarIds = calendars.map(c => c.id);
      
      if (calendarIds.length === 0) {
        return {
          totalEvents: 0,
          upcomingEvents: 0,
          totalCalendars: 0,
          sharedCalendars: 0,
          eventsThisMonth: 0,
          eventsThisWeek: 0,
          mostActiveCalendar: '',
          collaborators: 0
        };
      }
      
      // Obtener eventos
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay());
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      
      const allEvents = await CalendarEventService.getCalendarEvents(calendarIds);
      const upcomingEvents = allEvents.filter(e => e.startDate >= now);
      const eventsThisMonth = allEvents.filter(e => 
        e.startDate >= startOfMonth && e.startDate <= endOfMonth
      );
      const eventsThisWeek = allEvents.filter(e => 
        e.startDate >= startOfWeek && e.startDate <= endOfWeek
      );
      
      // Calendario más activo
      const calendarEventCounts = new Map<string, number>();
      allEvents.forEach(event => {
        const count = calendarEventCounts.get(event.calendarId) || 0;
        calendarEventCounts.set(event.calendarId, count + 1);
      });
      
      let mostActiveCalendar = '';
      let maxEvents = 0;
      calendarEventCounts.forEach((count, calendarId) => {
        if (count > maxEvents) {
          maxEvents = count;
          mostActiveCalendar = calendarId;
        }
      });
      
      // Contar colaboradores únicos
      const uniqueCollaborators = new Set<string>();
      calendars.forEach(calendar => {
        calendar.members.forEach(member => {
          if (member.id !== userId) {
            uniqueCollaborators.add(member.id);
          }
        });
      });
      
      return {
        totalEvents: allEvents.length,
        upcomingEvents: upcomingEvents.length,
        totalCalendars: calendars.length,
        sharedCalendars: calendars.filter(c => c.members.length > 1).length,
        eventsThisMonth: eventsThisMonth.length,
        eventsThisWeek: eventsThisWeek.length,
        mostActiveCalendar,
        collaborators: uniqueCollaborators.size
      };
      
    } catch (error) {
      logError('Error al obtener estadísticas', error as Error, { userId });
      return {
        totalEvents: 0,
        upcomingEvents: 0,
        totalCalendars: 0,
        sharedCalendars: 0,
        eventsThisMonth: 0,
        eventsThisWeek: 0,
        mostActiveCalendar: '',
        collaborators: 0
      };
    }
  }
}
