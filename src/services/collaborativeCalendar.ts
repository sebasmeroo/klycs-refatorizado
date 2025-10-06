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
  arrayRemove,
  QueryConstraint
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
import { subscriptionsService } from '@/services/subscriptions';
import { generateRecurringInstances } from '@/utils/recurrence';

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

  // Obtener eventos de UN calendario específico (para vista de profesional)
  static async getCalendarEvents(calendarId: string): Promise<CalendarEvent[]> {
    try {
      console.log(`🔍 Buscando eventos para calendario: ${calendarId}`);

      const q = query(
        collection(db, 'calendar_events'),
        where('calendarId', '==', calendarId),
        orderBy('startDate', 'asc')
      );

      const snapshot = await getDocs(q);
      console.log(`📊 Eventos encontrados en Firestore: ${snapshot.size}`);

      const events: CalendarEvent[] = [];
      const recurringEvents: CalendarEvent[] = [];

      snapshot.forEach(doc => {
        const data = doc.data() as CalendarEventFirestore;

        // Convertir Timestamp a Date manteniendo zona horaria local
        const startDateUTC = data.startDate.toDate();
        const startDate = new Date(
          startDateUTC.getUTCFullYear(),
          startDateUTC.getUTCMonth(),
          startDateUTC.getUTCDate(),
          startDateUTC.getUTCHours(),
          startDateUTC.getUTCMinutes(),
          0,
          0
        );

        let endDate: Date | undefined;
        if (data.endDate) {
          const endDateUTC = data.endDate.toDate();
          endDate = new Date(
            endDateUTC.getUTCFullYear(),
            endDateUTC.getUTCMonth(),
            endDateUTC.getUTCDate(),
            endDateUTC.getUTCHours(),
            endDateUTC.getUTCMinutes(),
            0,
            0
          );
        }

        const event: CalendarEvent = {
          ...data,
          id: doc.id,
          startDate,
          endDate,
          createdAt: data.createdAt.toDate(),
          updatedAt: data.updatedAt ? data.updatedAt.toDate() : data.createdAt.toDate(),
          completedAt: data.completedAt ? data.completedAt.toDate() : undefined,
          recurring: data.recurring ? {
            ...data.recurring,
            endDate: data.recurring.endDate?.toDate()
          } : undefined
        };

        // Separar eventos recurrentes de eventos normales
        if (event.recurring && !event.isRecurringInstance) {
          recurringEvents.push(event);
        } else {
          events.push(event);
        }
      });

      // ✅ Generar instancias virtuales para eventos recurrentes
      const today = new Date();
      const futureLimit = new Date(today);
      futureLimit.setFullYear(futureLimit.getFullYear() + 1); // Próximo año

      recurringEvents.forEach(parentEvent => {
        const instances = generateRecurringInstances(parentEvent, today, futureLimit);
        events.push(...instances);
      });

      console.log(`✅ ${events.length} eventos totales (${snapshot.size} en Firestore, ${events.length - snapshot.size} instancias virtuales)`);
      return events.sort((a, b) => a.startDate.getTime() - b.startDate.getTime());

    } catch (error) {
      console.error('❌ Error al obtener eventos del calendario:', error);
      logError('Error al obtener eventos del calendario', error as Error, { calendarId });
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

  // Actualizar configuración del calendario
  static async updateCalendarSettings(
    calendarId: string,
    settings: Partial<import('@/types/calendar').CalendarSettings>
  ): Promise<void> {
    try {
      await updateDoc(doc(db, 'shared_calendars', calendarId), {
        settings,
        updatedAt: Timestamp.now()
      });
      
      info('Configuración del calendario actualizada', { calendarId });
    } catch (error) {
      logError('Error al actualizar configuración del calendario', error as Error, { calendarId });
      throw error;
    }
  }

  // Obtener calendarios del usuario
  static async getUserCalendars(userId: string): Promise<SharedCalendar[]> {
    try {
      const ownerQuery = query(
        collection(db, 'shared_calendars'),
        where('ownerId', '==', userId)
      );
      
      const ownerSnapshot = await getDocs(ownerQuery);
      const calendars: SharedCalendar[] = [];
      
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
        calendars.push(calendar);
      });
      
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

  // ===== OBTENER PROFESIONALES =====
  
  static async getProfessionals(userId: string): Promise<import('@/types').TeamProfessional[]> {
    try {
      console.log('👥 Obteniendo profesionales para usuario:', userId);
      
      // Obtener los calendarios del usuario
      const calendars = await this.getUserCalendars(userId);
      console.log('📅 Calendarios encontrados:', calendars.length);
      
      const professionals: import('@/types').TeamProfessional[] = [];
      
      // Convertir cada calendario profesional en un profesional
      for (const calendar of calendars) {
        // Si el calendario tiene linkedEmail, es un calendario profesional
        if (calendar.linkedEmail) {
          // Extraer el nombre del profesional del nombre del calendario
          // "Calendario de Juan" -> "Juan"
          let professionalName = calendar.name;
          if (professionalName.startsWith('Calendario de ')) {
            professionalName = professionalName.replace('Calendario de ', '');
          }
          
          // Buscar si hay un miembro con ese email
          const member = calendar.members.find(m => m.email === calendar.linkedEmail);
          
          const professional: import('@/types').TeamProfessional = {
            id: calendar.id, // Usar ID del calendario como ID del profesional
            name: professionalName,
            email: calendar.linkedEmail,
            avatar: member?.avatar, // Avatar del miembro si existe
            role: 'Profesional',
            color: calendar.color,
            linkedCalendarId: calendar.id,
            permissions: {
              canViewBookings: true,
              canEditBookings: true,
              canDeleteBookings: false,
              canManageServices: true,
              canAccessAnalytics: true
            },
            isActive: true, // Los calendarios activos = profesionales activos
            createdAt: calendar.createdAt,
            updatedAt: calendar.updatedAt
          };
          
          professionals.push(professional);
          console.log('✅ Profesional agregado:', { 
            name: professional.name, 
            email: professional.email,
            calendarId: calendar.id 
          });
        }
      }
      
      console.log('✅ Total profesionales encontrados:', professionals.length);
      return professionals;
      
    } catch (error) {
      console.error('❌ Error obteniendo profesionales:', error);
      logError('Error al obtener profesionales', error as Error, { userId });
      return [];
    }
  }

  // ===== ACTUALIZAR PROFESIONAL =====
  
  static async updateProfessional(
    calendarId: string,
    professionalId: string,
    updates: { avatar?: string; name?: string; role?: string; color?: string }
  ): Promise<void> {
    try {
      console.log('✏️ Actualizando profesional:', { calendarId, professionalId, updates });
      
      const calendarDoc = await getDoc(doc(db, 'shared_calendars', calendarId));
      if (!calendarDoc.exists()) {
        throw new Error('Calendario no encontrado');
      }

      const calendar = calendarDoc.data() as SharedCalendarFirestore;
      
      // Buscar el miembro con el linkedEmail del calendario
      const linkedEmail = calendar.linkedEmail;
      const updatedMembers = calendar.members.map(member => {
        if (member.email === linkedEmail || member.id === professionalId) {
          return {
            ...member,
            ...(updates.avatar && { avatar: updates.avatar }),
            ...(updates.name && { name: updates.name }),
            ...(updates.color && { color: updates.color })
          };
        }
        return member;
      });

      await updateDoc(doc(db, 'shared_calendars', calendarId), {
        members: updatedMembers,
        updatedAt: Timestamp.now()
      });

      console.log('✅ Profesional actualizado exitosamente');
      info('Profesional actualizado', { calendarId, professionalId });
      
    } catch (error) {
      console.error('❌ Error actualizando profesional:', error);
      logError('Error al actualizar profesional', error as Error, { calendarId, professionalId });
      throw error;
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
  
  // Crear evento (con soporte para recurrencia y campos personalizados)
  static async createEvent(
    calendarId: string,
    eventData: Omit<CalendarEvent, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<string> {
    try {
      console.log('📅 Datos del evento recibidos:', JSON.stringify(eventData, null, 2));

      // ✅ VALIDACIÓN DE LÍMITES - Obtener el owner del calendario para validar
      const calendarDoc = await getDoc(doc(db, 'shared_calendars', calendarId));
      if (calendarDoc.exists()) {
        const calendarData = calendarDoc.data() as SharedCalendarFirestore;
        const ownerId = calendarData.ownerId;

        // Verificar límites de reservas/bookings
        const limitsCheck = await subscriptionsService.checkPlanLimits(ownerId, 'bookings');

        if (limitsCheck.success && limitsCheck.data) {
          const { canProceed, limit, current, plan } = limitsCheck.data;

          if (!canProceed) {
            const planName = plan.name?.toLowerCase() || 'free';

            if (planName === 'free' || planName === 'básico') {
              throw new Error('Plan FREE: No puedes crear reservas. Actualiza a PRO para reservas ilimitadas.');
            }
            // PRO y BUSINESS tienen reservas ilimitadas, nunca llegarán aquí
          }
        }
      }

      // Verificar si es recurrente y crear múltiples eventos
      if (eventData.recurring && eventData.recurring.type !== 'none' && eventData.recurring.weekdays && eventData.recurring.weekdays.length > 0) {
        return await this.createRecurringEvents(calendarId, eventData);
      }

      // Crear evento único
      return await this.createSingleEvent(calendarId, eventData);

    } catch (error) {
      console.error('❌ Error detallado al crear evento:', error);
      logError('Error al crear evento', error as Error, { calendarId });
      throw error;
    }
  }

  // Crear un solo evento
  private static async createSingleEvent(
    calendarId: string,
    eventData: Omit<CalendarEvent, 'id' | 'createdAt' | 'updatedAt'>,
    parentEventId?: string
  ): Promise<string> {
    // Calcular duración en minutos si hay endDate
    let duration = 0;
    let hasEndTime = !!eventData.endDate;
    
    if (eventData.endDate && !eventData.isAllDay) {
      duration = Math.round((eventData.endDate.getTime() - eventData.startDate.getTime()) / (1000 * 60));
    }
    
    // ✅ Guardar la fecha exactamente como está, sin conversiones de zona horaria
    // No usar Date.UTC porque ya tenemos la hora local correcta
    console.log('📅 Guardando evento:', {
      fechaOriginal: eventData.startDate,
      fechaOriginal_ISO: eventData.startDate.toISOString(),
      fechaLocal: eventData.startDate.toLocaleString('es-ES')
    });
    
    // ✅ LIMPIAR VALORES UNDEFINED antes de enviar a Firebase
    const cleanEventData: any = {
      calendarId: eventData.calendarId,
      title: eventData.title,
      startDate: Timestamp.fromDate(eventData.startDate),
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
      updatedAt: Timestamp.now(),
      hasEndTime, // Indicar si tiene hora de fin
      duration // Duración en minutos
    };
    
    // Solo agregar endDate si existe
    if (eventData.endDate) {
      cleanEventData.endDate = Timestamp.fromDate(eventData.endDate);
    }
    
    // Solo agregar campos opcionales si tienen valor
    if (eventData.description && eventData.description.trim()) {
      cleanEventData.description = eventData.description.trim();
    }
    
    if (eventData.location && eventData.location.trim()) {
      cleanEventData.location = eventData.location.trim();
    }
    
    // Campos personalizados
    if (eventData.customFieldsData && Object.keys(eventData.customFieldsData).length > 0) {
      cleanEventData.customFieldsData = eventData.customFieldsData;
    }

    // Marcar si es una instancia de evento recurrente
    if (parentEventId) {
      cleanEventData.isRecurringInstance = true;
      cleanEventData.parentEventId = parentEventId;
    }
    
    if (eventData.recurring) {
      cleanEventData.recurring = {
        ...eventData.recurring,
        endDate: eventData.recurring.endDate ? Timestamp.fromDate(eventData.recurring.endDate) : null
      };
    }
    
    console.log('🧹 Datos limpios para Firebase:', JSON.stringify(cleanEventData, null, 2));
    if (duration > 0) {
      console.log(`⏱️ Duración del evento: ${duration} minutos (${(duration / 60).toFixed(2)} horas)`);
    } else {
      console.log('⏱️ Evento de hora única (sin duración)');
    }
    
    const docRef = await addDoc(collection(db, 'calendar_events'), cleanEventData);

    // ✅ Registrar uso de reserva después de crear
    const calendarDoc = await getDoc(doc(db, 'shared_calendars', calendarId));
    if (calendarDoc.exists()) {
      const calendarData = calendarDoc.data() as SharedCalendarFirestore;
      await subscriptionsService.recordUsage(calendarData.ownerId, 'bookings', 1, {
        eventId: docRef.id,
        eventTitle: eventData.title,
        calendarId
      });
    }

    console.log('✅ Evento creado exitosamente con ID:', docRef.id);
    info('Evento creado', { eventId: docRef.id, calendarId, duration });
    return docRef.id;
  }

  // ✅ NUEVO: Crear eventos recurrentes (SOLO EVENTO PADRE - instancias se generan en el cliente)
  private static async createRecurringEvents(
    calendarId: string,
    eventData: Omit<CalendarEvent, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<string> {
    const { recurring } = eventData;
    if (!recurring || !recurring.weekdays || recurring.weekdays.length === 0) {
      throw new Error('Configuración de recurrencia inválida');
    }

    console.log('🔄 Creando evento recurrente (SOLO PADRE):', {
      weekdays: recurring.weekdays,
      count: recurring.count,
      interval: recurring.interval,
      startDate: eventData.startDate
    });

    // ✅ SOLO crear el evento padre con la configuración de recurrencia
    // Las instancias se generarán dinámicamente en el cliente
    const parentEventId = await this.createSingleEvent(calendarId, eventData);

    console.log(`✅ Evento recurrente creado: ${parentEventId}`);
    console.log(`📅 Se generarán ${recurring.count} instancias virtuales en el calendario`);

    info('Evento recurrente creado', {
      parentEventId,
      weekdays: recurring.weekdays,
      count: recurring.count,
      calendarId
    });

    return parentEventId;
  }

  // Eliminar evento individual
  static async deleteEvent(eventId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'calendar_events', eventId));
      info('Evento eliminado', { eventId });
    } catch (error) {
      logError('Error al eliminar evento', error as Error, { eventId });
      throw error;
    }
  }

  // ✅ ACTUALIZADO: Eliminar serie completa de eventos recurrentes (ahora solo elimina el padre)
  static async deleteRecurringSeries(parentEventId: string): Promise<void> {
    try {
      console.log('🗑️ Eliminando serie completa de eventos recurrentes (solo padre):', parentEventId);

      // ✅ Como ahora solo guardamos el evento padre, solo eliminamos ese documento
      await deleteDoc(doc(db, 'calendar_events', parentEventId));

      console.log(`✅ Serie completa eliminada (1 documento)`);
      info('Serie de eventos eliminada', { parentEventId });

    } catch (error) {
      logError('Error al eliminar serie de eventos', error as Error, { parentEventId });
      throw error;
    }
  }

  // ✅ NUEVO: Eliminar solo UNA instancia de un evento recurrente (crear excepción)
  static async deleteRecurringInstance(
    parentEventId: string,
    instanceDate: Date
  ): Promise<void> {
    try {
      console.log('🗑️ Eliminando instancia específica del evento recurrente:', {
        parentEventId,
        instanceDate: instanceDate.toISOString()
      });

      // ✅ Obtener el evento padre
      const parentDoc = await getDoc(doc(db, 'calendar_events', parentEventId));

      if (!parentDoc.exists()) {
        throw new Error('Evento padre no encontrado');
      }

      const parentData = parentDoc.data();

      // Crear array de excepciones si no existe
      const existingExceptions = parentData.recurring?.exceptions || [];

      // Agregar la fecha como excepción (solo fecha, sin hora)
      const exceptionDate = new Date(instanceDate);
      exceptionDate.setHours(0, 0, 0, 0);

      const exceptionTimestamp = Timestamp.fromDate(exceptionDate);

      // Evitar duplicados comparando por día
      const hasException = existingExceptions.some((ex: any) => {
        const exDate = ex instanceof Timestamp ? ex.toDate() : new Date(ex);
        exDate.setHours(0, 0, 0, 0);
        return exDate.getTime() === exceptionDate.getTime();
      });

      if (hasException) {
        console.log('ℹ️ La instancia ya está marcada como excepción, no se duplica');
        return;
      }

      existingExceptions.push(exceptionTimestamp);

      // Actualizar evento padre con la nueva excepción
      await updateDoc(doc(db, 'calendar_events', parentEventId), {
        'recurring.exceptions': existingExceptions,
        updatedAt: Timestamp.now()
      });

      console.log(`✅ Instancia del ${instanceDate.toLocaleDateString()} marcada como excepción`);
      info('Instancia de evento recurrente eliminada', {
        parentEventId,
        exceptionDate: instanceDate.toISOString()
      });

    } catch (error) {
      logError('Error al eliminar instancia recurrente', error as Error, { parentEventId, instanceDate });
      throw error;
    }
  }

  // ✅ ACTUALIZADO: Terminar recurrencia en una fecha específica (mantener historial)
  static async deleteRecurringSeriesFromDate(
    parentEventId: string,
    fromDate: Date
  ): Promise<void> {
    try {
      console.log('🗑️ Terminando serie recurrente desde fecha:', {
        parentEventId,
        fromDate: fromDate.toISOString()
      });

      // ✅ Ahora solo actualizamos el evento padre para que termine en esa fecha
      // Las instancias virtuales se generarán automáticamente hasta esa fecha
      const parentDoc = await getDoc(doc(db, 'calendar_events', parentEventId));

      if (!parentDoc.exists()) {
        throw new Error('Evento padre no encontrado');
      }

      const parentData = parentDoc.data();
      const parentStartDate = parentData.startDate.toDate();

      const normalizedFromDate = new Date(fromDate);
      normalizedFromDate.setHours(0, 0, 0, 0);

      if (parentStartDate >= normalizedFromDate) {
        // Si el evento padre es posterior a la fecha, eliminarlo completamente
        await deleteDoc(doc(db, 'calendar_events', parentEventId));
        console.log('✅ Evento padre eliminado (estaba después de la fecha de corte)');
      } else {
        // No permitir que la fecha de fin quede antes del inicio del evento
        if (normalizedFromDate <= parentStartDate) {
          await deleteDoc(doc(db, 'calendar_events', parentEventId));
          console.log('✅ Serie eliminada: la fecha de corte es igual o anterior al inicio');
        } else {
          // Actualizar el evento padre para que termine antes de fromDate
          await updateDoc(doc(db, 'calendar_events', parentEventId), {
            'recurring.endDate': Timestamp.fromDate(normalizedFromDate),
            updatedAt: Timestamp.now()
          });
          console.log(`✅ Serie recurrente actualizada para terminar el ${normalizedFromDate.toLocaleDateString()}`);
        }
      }

      info('Serie de eventos modificada desde fecha', {
        parentEventId,
        fromDate: fromDate.toISOString()
      });

    } catch (error) {
      logError('Error al modificar serie desde fecha', error as Error, { parentEventId, fromDate });
      throw error;
    }
  }

  // Obtener eventos de calendarios
  static async getCalendarEvents(
    calendarIds: string[],
    startDate?: Date,
    endDate?: Date,
    options?: { limit?: number }
  ): Promise<{ events: CalendarEvent[]; fetchedCount: number }> {
    try {
      if (!calendarIds || calendarIds.length === 0) {
        return { events: [], fetchedCount: 0 };
      }

      const normalizedIds = Array.from(new Set(calendarIds.filter(Boolean)));
      if (normalizedIds.length === 0) {
        return { events: [], fetchedCount: 0 };
      }

      const constraints: QueryConstraint[] = [];
      const [firstId] = normalizedIds;

      if (normalizedIds.length === 1) {
        constraints.push(where('calendarId', '==', firstId));
      } else {
        constraints.push(where('calendarId', 'in', normalizedIds.slice(0, 10)));
      }

      if (startDate) {
        constraints.push(where('startDate', '>=', Timestamp.fromDate(startDate)));
      }

      if (endDate) {
        constraints.push(where('startDate', '<=', Timestamp.fromDate(endDate)));
      }

      constraints.push(orderBy('startDate', 'asc'));

      if (options?.limit) {
        constraints.push(limit(options.limit));
      }

      const q = query(collection(db, 'calendar_events'), ...constraints);
      const snapshot = await getDocs(q);

      const events: CalendarEvent[] = [];

      snapshot.forEach(doc => {
        const data = doc.data() as CalendarEventFirestore;

        const startDateUTC = data.startDate.toDate();
        const startDateLocal = new Date(
          startDateUTC.getUTCFullYear(),
          startDateUTC.getUTCMonth(),
          startDateUTC.getUTCDate(),
          startDateUTC.getUTCHours(),
          startDateUTC.getUTCMinutes(),
          0,
          0
        );

        let endDateLocal: Date | undefined;
        if (data.endDate) {
          const endDateUTC = data.endDate.toDate();
          endDateLocal = new Date(
            endDateUTC.getUTCFullYear(),
            endDateUTC.getUTCMonth(),
            endDateUTC.getUTCDate(),
            endDateUTC.getUTCHours(),
            endDateUTC.getUTCMinutes(),
            0,
            0
          );
        }

        const event: CalendarEvent = {
          ...data,
          id: doc.id,
          startDate: startDateLocal,
          endDate: endDateLocal,
          createdAt: data.createdAt.toDate(),
          updatedAt: data.updatedAt.toDate(),
          completedAt: data.completedAt?.toDate(),
          recurring: data.recurring
            ? {
                ...data.recurring,
                endDate: data.recurring.endDate?.toDate()
              }
            : undefined
        };

        events.push(event);
      });

      const expansionStartSource = startDate ? new Date(startDate) : new Date();
      expansionStartSource.setHours(0, 0, 0, 0);

      const expansionEndSource = endDate
        ? new Date(endDate)
        : (() => {
            const fallback = new Date();
            fallback.setMonth(fallback.getMonth() + 12);
            fallback.setHours(23, 59, 59, 999);
            return fallback;
          })();

      const recurringParents = events.filter(e => e.recurring && !e.isRecurringInstance);

      recurringParents.forEach(parentEvent => {
        const instances = generateRecurringInstances(
          parentEvent,
          new Date(expansionStartSource),
          new Date(expansionEndSource)
        );
        events.push(...instances);
      });

      const sortedEvents = events.sort((a, b) => a.startDate.getTime() - b.startDate.getTime());

      console.log(
        `✅ Total eventos expandidos: ${sortedEvents.length} (${recurringParents.length} padres recurrentes generaron ${sortedEvents.length - snapshot.size} instancias)`
      );

      return { events: sortedEvents, fetchedCount: snapshot.size };
      
    } catch (error) {
      console.error('❌ ERROR DETALLADO cargando eventos:', error);
      console.error('🔥 Error name:', (error as any)?.name);
      console.error('🔥 Error message:', (error as any)?.message);
      console.error('🔥 Error code:', (error as any)?.code);
      console.error('🔥 Error stack:', (error as any)?.stack);
      
      logError('Error al obtener eventos', error as Error, { calendarIds });
      return { events: [], fetchedCount: 0 };
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
          endDate: data.endDate ? data.endDate.toDate() : undefined,
          createdAt: data.createdAt.toDate(),
          updatedAt: data.updatedAt ? data.updatedAt.toDate() : data.createdAt.toDate(),
          completedAt: data.completedAt?.toDate(),
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
      if (updates.completedAt) {
        updateData.completedAt = Timestamp.fromDate(updates.completedAt);
      }

      await updateDoc(doc(db, 'calendar_events', eventId), updateData);

    } catch (error) {
      logError('Error al actualizar evento', error as Error, { eventId });
      throw error;
    }
  }

  // Marcar servicio como completado
  static async markServiceComplete(
    eventId: string,
    userId: string,
    status: 'completed' | 'not_done' | 'in_progress' | 'pending'
  ): Promise<void> {
    try {
      const updateData: any = {
        serviceStatus: status,
        updatedAt: Timestamp.now()
      };

      if (status === 'completed') {
        updateData.completedAt = Timestamp.now();
        updateData.completedBy = userId;
      } else {
        // Si se cambia a otro estado, limpiar los campos de completado
        updateData.completedAt = null;
        updateData.completedBy = null;
      }

      await updateDoc(doc(db, 'calendar_events', eventId), updateData);
      info('Estado del servicio actualizado', { eventId, status, userId });
    } catch (error) {
      logError('Error al actualizar estado del servicio', error as Error, { eventId, status });
      throw error;
    }
  }

  // Obtener eventos por estado de servicio
  static async getEventsByServiceStatus(
    calendarId: string,
    status: 'completed' | 'not_done' | 'in_progress' | 'pending',
    startDate?: Date,
    endDate?: Date
  ): Promise<CalendarEvent[]> {
    try {
      let q = query(
        collection(db, 'calendar_events'),
        where('calendarId', '==', calendarId),
        where('serviceStatus', '==', status)
      );

      if (startDate && endDate) {
        q = query(q,
          where('startDate', '>=', Timestamp.fromDate(startDate)),
          where('startDate', '<=', Timestamp.fromDate(endDate))
        );
      }

      q = query(q, orderBy('startDate', 'desc'));
      const snapshot = await getDocs(q);

      const events: CalendarEvent[] = [];
      snapshot.forEach(doc => {
        const data = doc.data() as CalendarEventFirestore;
        events.push({
          ...data,
          id: doc.id,
          startDate: data.startDate.toDate(),
          endDate: data.endDate ? data.endDate.toDate() : undefined,
          createdAt: data.createdAt.toDate(),
          updatedAt: data.updatedAt ? data.updatedAt.toDate() : data.createdAt.toDate(),
          completedAt: data.completedAt?.toDate(),
          recurring: data.recurring ? {
            ...data.recurring,
            endDate: data.recurring.endDate?.toDate()
          } : undefined
        });
      });

      return events;
    } catch (error) {
      logError('Error al obtener eventos por estado', error as Error, { calendarId, status });
      return [];
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
      
      const { events: allEvents } = await CalendarEventService.getCalendarEvents(calendarIds);
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
