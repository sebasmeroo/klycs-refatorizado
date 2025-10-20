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
  QueryConstraint,
  deleteField
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
  CalendarStats,
  RecurringInstanceStatus,
  PaymentFrequency,
  PaymentMethod
} from '@/types/calendar';
import { logger } from '@/utils/logger';
import { subscriptionsService } from '@/services/subscriptions';
import { generateRecurringInstances } from '@/utils/recurrence';
import { ExternalClientsService } from '@/services/externalClientsService';
import { ProfessionalAvailabilityService } from '@/services/professionalAvailability';

const normalizeRecurringStatuses = (
  raw?: CalendarEventFirestore['recurringInstancesStatus']
): Record<string, RecurringInstanceStatus> | undefined => {
  if (!raw) return undefined;

  const result: Record<string, RecurringInstanceStatus> = {};

  Object.entries(raw).forEach(([key, value]) => {
    if (!value) return;

    const status: RecurringInstanceStatus = {
      status: value.status,
      updatedAt: value.updatedAt?.toDate() ?? new Date(),
      updatedBy: value.updatedBy || undefined,
      completedBy: value.completedBy || undefined,
      completedAt: value.completedAt ? value.completedAt.toDate() || undefined : undefined
    };

    result[key] = status;
  });

  return Object.keys(result).length > 0 ? result : undefined;
};

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

      logger.info('Calendario colaborativo creado', { calendarId: docRef.id, ownerId });
      return docRef.id;

    } catch (error) {
      logger.error('Error al crear calendario', error as Error, { ownerId, name });
      throw error;
    }
  }

  // Crear calendario profesional con datos completos
  static async createProfessionalCalendar(
    calendarData: Omit<SharedCalendar, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<string> {
    try {
      logger.log('🚀 Iniciando creación de calendario profesional:', calendarData);
      
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
        hourlyRate: typeof calendarData.hourlyRate === 'number' ? calendarData.hourlyRate : 0,
        hourlyRateCurrency: calendarData.hourlyRateCurrency ?? 'EUR',
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        isPublic: calendarData.isPublic || false
      };

      logger.log('📊 Datos convertidos para Firestore:', firestoreData);

      const docRef = await addDoc(collection(db, 'shared_calendars'), firestoreData);

      logger.log('✅ Calendario creado exitosamente con ID:', docRef.id);
      logger.info('Calendario profesional creado', {
        calendarId: docRef.id,
        ownerId: calendarData.ownerId,
        linkedEmail: calendarData.linkedEmail,
        name: calendarData.name
      });

      return docRef.id;

    } catch (error) {
      logger.error('❌ Error al crear calendario profesional:', error as Error);
      logger.error('Error al crear calendario profesional', error as Error, { 
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
      logger.log(`🔍 Buscando eventos para calendario: ${calendarId}`);

      const q = query(
        collection(db, 'calendar_events'),
        where('calendarId', '==', calendarId),
        orderBy('startDate', 'asc')
      );

      const snapshot = await getDocs(q);
      logger.log(`📊 Eventos encontrados en Firestore: ${snapshot.size}`);

      const events: CalendarEvent[] = [];
      const recurringEvents: CalendarEvent[] = [];

      snapshot.forEach(doc => {
        const data = doc.data() as CalendarEventFirestore;

        // Convertir Timestamp a Date sin recalcular la zona horaria manualmente
        const startDateSource = data.startDate.toDate();
        const startDate = new Date(startDateSource.getTime());

        let endDate: Date | undefined;
        if (data.endDate) {
          const endDateSource = data.endDate.toDate();
          endDate = new Date(endDateSource.getTime());
        }

        const recurringStatuses = normalizeRecurringStatuses(data.recurringInstancesStatus);

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
          } : undefined,
          recurringInstancesStatus: recurringStatuses
        };

        if (recurringStatuses) {
          const baseKey = `${event.id}_${event.startDate.getTime()}`;
          const legacyKey = event.startDate.getTime().toString();
          const baseStatus = recurringStatuses[baseKey] ?? recurringStatuses[legacyKey];
          if (baseStatus) {
            event.serviceStatus = baseStatus.status;
            event.completedAt = baseStatus.completedAt ?? event.completedAt;
            event.completedBy = baseStatus.completedBy ?? event.completedBy;
          }
        }

        // Separar eventos recurrentes de eventos normales
        if (event.recurring && !event.isRecurringInstance) {
          recurringEvents.push(event);
        } else {
          events.push(event);
        }
      });

      // ✅ Generar instancias virtuales para eventos recurrentes
      // ⚡ OPTIMIZADO: Solo generar 3 meses en lugar de 1 año (75% menos instancias)
      const today = new Date();
      const futureLimit = new Date(today);
      futureLimit.setMonth(futureLimit.getMonth() + 3); // Próximos 3 meses

      recurringEvents.forEach(parentEvent => {
        const instances = generateRecurringInstances(parentEvent, today, futureLimit);
        events.push(...instances);
      });

      logger.log(`✅ ${events.length} eventos totales (${snapshot.size} en Firestore, ${events.length - snapshot.size} instancias virtuales)`);
      return events.sort((a, b) => a.startDate.getTime() - b.startDate.getTime());

    } catch (error) {
      logger.error('❌ Error al obtener eventos del calendario:', error as Error);
      logger.error('Error al obtener eventos del calendario', error as Error, { calendarId });
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
      logger.error('Error obteniendo calendario por ID', error as Error, { calendarId });
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
      
      logger.info('Configuración del calendario actualizada', { calendarId });
    } catch (error) {
      logger.error('Error al actualizar configuración del calendario', error as Error, { calendarId });
      throw error;
    }
  }

  static async updatePayoutDetails(
    calendarId: string,
    payoutDetails: {
      iban?: string;
      bank?: string;
      notes?: string;
      paypalEmail?: string;
      paymentType?: PaymentFrequency;
      paymentDay?: number;
      paymentMethod?: PaymentMethod;
      customHourlyRate?: number;
    }
  ): Promise<void> {
    try {
      // ✅ Filtrar campos undefined para evitar errores de Firestore
      const cleanedDetails: Record<string, any> = {};

      Object.entries(payoutDetails).forEach(([key, value]) => {
        if (value !== undefined) {
          cleanedDetails[key] = value;
        }
      });

      await updateDoc(doc(db, 'shared_calendars', calendarId), {
        payoutDetails: cleanedDetails,
        updatedAt: Timestamp.now()
      });
      logger.info('Detalles de pago del profesional actualizados', { calendarId });
    } catch (error) {
      logger.error('Error al actualizar detalles de pago', error as Error, { calendarId });
      throw error;
    }
  }

  static async updatePayoutRecord(
    calendarId: string,
    periodKey: string,
    record: {
      status: 'pending' | 'paid';
      lastPaymentDate?: string;
      lastPaymentBy?: string;
      note?: string;
      paymentMethod?: PaymentMethod;
      amountPaid?: number;
    }
  ): Promise<void> {
    try {
      // ✅ Filtrar campos undefined para evitar errores de Firestore
      const cleanedRecord: Record<string, any> = {
        status: record.status // status es requerido
      };

      Object.entries(record).forEach(([key, value]) => {
        if (key !== 'status' && value !== undefined) {
          cleanedRecord[key] = value;
        }
      });

      const updatePayload: Record<string, unknown> = {
        updatedAt: Timestamp.now()
      };
      updatePayload[`payoutRecords.${periodKey}`] = cleanedRecord;
      await updateDoc(doc(db, 'shared_calendars', calendarId), updatePayload);
      logger.info('Registro de pago actualizado', { calendarId, periodKey });
    } catch (error) {
      logger.error('Error al actualizar registro de pago', error as Error, { calendarId, periodKey });
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
      logger.error('Error al obtener calendarios del usuario', error as Error, { userId });
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
      logger.error('Error al generar código de invitación', error as Error, { calendarId });
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
      logger.error('Error al unirse al calendario', error as Error, { inviteCode, userId: user.id });
      throw error;
    }
  }

  // ===== BÚSQUEDA POR EMAIL VINCULADO =====
  
  static async findCalendarsByLinkedEmail(linkedEmail: string): Promise<SharedCalendar[]> {
    try {
      logger.log('🔍 INICIANDO BÚSQUEDA por linkedEmail:', linkedEmail);
      
      // ✅ VERIFICAR AUTENTICACIÓN
      const user = auth.currentUser;
      logger.log('👤 Usuario autenticado:', user ? 'SÍ' : 'NO');
      if (user) {
        logger.log('🆔 UID:', user.uid);
        logger.log('📧 Email:', user.email);
        logger.log('🎫 Usuario verificado:', !!user);
      }
      
      logger.log('🏗️ Construyendo query para shared_calendars...');
      const q = query(
        collection(db, 'shared_calendars'),
        where('linkedEmail', '==', linkedEmail)
      );
      logger.log('✅ Query construida exitosamente');
      
      logger.log('🚀 Ejecutando getDocs...');
      const snapshot = await getDocs(q);
      logger.log('📊 Respuesta recibida. Documentos encontrados:', snapshot.size);
      
      const calendars: SharedCalendar[] = [];
      
      snapshot.forEach(doc => {
        logger.log('📄 Procesando documento:', doc.id);
        const data = doc.data() as SharedCalendarFirestore;
        logger.log('📋 Datos del documento:', {
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
        
        logger.log('📅 Calendario procesado:', { 
          id: calendar.id, 
          name: calendar.name, 
          linkedEmail: calendar.linkedEmail,
          ownerId: calendar.ownerId
        });
        
        calendars.push(calendar);
      });
      
      logger.log('✅ BÚSQUEDA COMPLETADA. Total calendarios devueltos para', linkedEmail, ':', calendars.length);
      return calendars;
      
    } catch (error) {
      console.error('❌ ERROR DETALLADO buscando calendarios por linkedEmail:', error);
      console.error('🔥 Error name:', (error as any)?.name);
      console.error('🔥 Error message:', (error as any)?.message);
      console.error('🔥 Error code:', (error as any)?.code);
      console.error('🔥 Error stack:', (error as any)?.stack);
      
      // ✅ FALLBACK: Si falla la búsqueda específica, intentar buscar todos los calendarios
      logger.log('🔄 INTENTANDO FALLBACK: Buscar todos los calendarios...');
      try {
        const allQuery = query(collection(db, 'shared_calendars'));
        const allSnapshot = await getDocs(allQuery);
        logger.log('📊 Total calendarios en la base de datos:', allSnapshot.size);
        
        const matchingCalendars: SharedCalendar[] = [];
        allSnapshot.forEach(doc => {
          const data = doc.data() as SharedCalendarFirestore;
          if (data.linkedEmail === linkedEmail) {
            logger.log('✅ ENCONTRADO MATCH en fallback:', {
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
        
        logger.log('🎯 FALLBACK COMPLETADO. Calendarios encontrados:', matchingCalendars.length);
        return matchingCalendars;
        
      } catch (fallbackError) {
        console.error('💥 FALLBACK TAMBIÉN FALLÓ:', fallbackError);
        logger.error('Error al buscar calendarios por linkedEmail', error as Error, { linkedEmail });
        return [];
      }
    }
  }

  // ===== OBTENER PROFESIONALES =====
  
  static async getProfessionals(userId: string): Promise<import('@/types').TeamProfessional[]> {
    try {
      logger.log('👥 Obteniendo profesionales para usuario:', userId);
      
      // Obtener los calendarios del usuario
      const calendars = await this.getUserCalendars(userId);
      logger.log('📅 Calendarios encontrados:', calendars.length);
      
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
          logger.log('✅ Profesional agregado:', { 
            name: professional.name, 
            email: professional.email,
            calendarId: calendar.id 
          });
        }
      }
      
      logger.log('✅ Total profesionales encontrados:', professionals.length);
      return professionals;
      
    } catch (error) {
      console.error('❌ Error obteniendo profesionales:', error);
      logger.error('Error al obtener profesionales', error as Error, { userId });
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
      logger.log('✏️ Actualizando profesional:', { calendarId, professionalId, updates });
      
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

      logger.log('✅ Profesional actualizado exitosamente');
      logger.info('Profesional actualizado', { calendarId, professionalId });
      
    } catch (error) {
      console.error('❌ Error actualizando profesional:', error);
      logger.error('Error al actualizar profesional', error as Error, { calendarId, professionalId });
      throw error;
    }
  }

  // ===== ELIMINAR CALENDARIO =====
  
  static async deleteCalendar(calendarId: string): Promise<void> {
    try {
      logger.log('🗑️ Eliminando calendario:', calendarId);
      
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
      
      logger.log('✅ Calendario eliminado exitosamente:', calendarId);
      logger.info('Calendario eliminado', { calendarId, eventsDeleted: eventsSnapshot.size });
      
    } catch (error) {
      console.error('❌ Error eliminando calendario:', error);
      logger.error('Error al eliminar calendario', error as Error, { calendarId });
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
      logger.log('📅 Datos del evento recibidos:', JSON.stringify(eventData, null, 2));

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
      logger.error('Error al crear evento', error as Error, { calendarId });
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
    let computedEndDate = eventData.endDate ? new Date(eventData.endDate) : undefined;
    let hasEndTime = typeof eventData.hasEndTime === 'boolean'
      ? eventData.hasEndTime
      : !!computedEndDate;
    let duration = 0;
    
    if (computedEndDate && !eventData.isAllDay) {
      duration = Math.max(
        0,
        Math.round((computedEndDate.getTime() - eventData.startDate.getTime()) / (1000 * 60))
      );
    } else if (!computedEndDate && typeof eventData.duration === 'number' && eventData.duration > 0) {
      duration = eventData.duration;
      computedEndDate = new Date(eventData.startDate.getTime() + duration * 60 * 1000);
      hasEndTime = true;
    }

    if (!computedEndDate && hasEndTime && !eventData.isAllDay) {
      computedEndDate = new Date(eventData.startDate.getTime() + 5 * 60 * 1000);
    }

    await this.ensureAvailabilityIsNotBlocked(calendarId, {
      startDate: eventData.startDate,
      endDate: computedEndDate,
      isAllDay: eventData.isAllDay,
      hasEndTime,
      duration
    });
    
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

    // ✅ Cliente externo (opcional)
    if (eventData.externalClientId) {
      cleanEventData.externalClientId = eventData.externalClientId;
      cleanEventData.linkedToClient = true;
    }

    if (eventData.recurringInstancesStatus && Object.keys(eventData.recurringInstancesStatus).length > 0) {
      const serializedStatuses: Record<string, any> = {};
      Object.entries(eventData.recurringInstancesStatus).forEach(([key, value]) => {
        if (!value) return;
        serializedStatuses[key] = {
          status: value.status,
          updatedAt: Timestamp.fromDate(value.updatedAt),
          updatedBy: value.updatedBy,
          completedAt: value.completedAt ? Timestamp.fromDate(value.completedAt) : null,
          completedBy: value.completedBy ?? null
        };
      });

      if (Object.keys(serializedStatuses).length > 0) {
        cleanEventData.recurringInstancesStatus = serializedStatuses;
      }
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
      logger.log(`⏱️ Duración del evento: ${duration} minutos (${(duration / 60).toFixed(2)} horas)`);
    } else {
      logger.log('⏱️ Evento de hora única (sin duración)');
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
    logger.info('Evento creado', { eventId: docRef.id, calendarId, duration });
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
      count: recurring.count ?? 'sin límite',
      interval: recurring.interval,
      startDate: eventData.startDate
    });

    // ✅ SOLO crear el evento padre con la configuración de recurrencia
    // Las instancias se generarán dinámicamente en el cliente
    const parentEventId = await this.createSingleEvent(calendarId, eventData);

    console.log(`✅ Evento recurrente creado: ${parentEventId}`);
    if (typeof recurring.count === 'number') {
      logger.log(`📅 Se generarán ${recurring.count} instancias virtuales en el calendario`);
    } else {
      logger.log('📅 Recurrencia sin límite establecido (se generan instancias según el rango visible en el cliente)');
    }

    logger.info('Evento recurrente creado', {
      parentEventId,
      weekdays: recurring.weekdays,
      interval: recurring.interval,
      count: recurring.count ?? null,
      calendarId
    });

    return parentEventId;
  }

  // Eliminar evento individual
  static async deleteEvent(eventId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'calendar_events', eventId));
      logger.info('Evento eliminado', { eventId });
    } catch (error) {
      logger.error('Error al eliminar evento', error as Error, { eventId });
      throw error;
    }
  }

  // ✅ ACTUALIZADO: Eliminar serie completa de eventos recurrentes (ahora solo elimina el padre)
  static async deleteRecurringSeries(parentEventId: string): Promise<void> {
    try {
      logger.log('🗑️ Eliminando serie completa de eventos recurrentes (solo padre):', parentEventId);

      // ✅ Como ahora solo guardamos el evento padre, solo eliminamos ese documento
      await deleteDoc(doc(db, 'calendar_events', parentEventId));

      logger.log(`✅ Serie completa eliminada (1 documento)`);
      logger.info('Serie de eventos eliminada', { parentEventId });

    } catch (error) {
      logger.error('Error al eliminar serie de eventos', error as Error, { parentEventId });
      throw error;
    }
  }

  // ✅ NUEVO: Eliminar solo UNA instancia de un evento recurrente (crear excepción)
  static async deleteRecurringInstance(
    parentEventId: string,
    instanceDate: Date
  ): Promise<void> {
    try {
      logger.log('🗑️ Eliminando instancia específica del evento recurrente:', {
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
        logger.log('ℹ️ La instancia ya está marcada como excepción, no se duplica');
        return;
      }

      existingExceptions.push(exceptionTimestamp);

      // Actualizar evento padre con la nueva excepción
      await updateDoc(doc(db, 'calendar_events', parentEventId), {
        'recurring.exceptions': existingExceptions,
        updatedAt: Timestamp.now()
      });

      logger.log(`✅ Instancia del ${instanceDate.toLocaleDateString()} marcada como excepción`);
      logger.info('Instancia de evento recurrente eliminada', {
        parentEventId,
        exceptionDate: instanceDate.toISOString()
      });

    } catch (error) {
      logger.error('Error al eliminar instancia recurrente', error as Error, { parentEventId, instanceDate });
      throw error;
    }
  }

  // ✅ ACTUALIZADO: Terminar recurrencia en una fecha específica (mantener historial)
  static async deleteRecurringSeriesFromDate(
    parentEventId: string,
    fromDate: Date
  ): Promise<void> {
    try {
      logger.log('🗑️ Terminando serie recurrente desde fecha:', {
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
        logger.log('✅ Evento padre eliminado (estaba después de la fecha de corte)');
      } else {
        // No permitir que la fecha de fin quede antes del inicio del evento
        if (normalizedFromDate <= parentStartDate) {
          await deleteDoc(doc(db, 'calendar_events', parentEventId));
          logger.log('✅ Serie eliminada: la fecha de corte es igual o anterior al inicio');
        } else {
          // Actualizar el evento padre para que termine antes de fromDate
          await updateDoc(doc(db, 'calendar_events', parentEventId), {
            'recurring.endDate': Timestamp.fromDate(normalizedFromDate),
            updatedAt: Timestamp.now()
          });
          logger.log(`✅ Serie recurrente actualizada para terminar el ${normalizedFromDate.toLocaleDateString()}`);
        }
      }

      logger.info('Serie de eventos modificada desde fecha', {
        parentEventId,
        fromDate: fromDate.toISOString()
      });

    } catch (error) {
      logger.error('Error al modificar serie desde fecha', error as Error, { parentEventId, fromDate });
      throw error;
    }
  }

  private static async ensureAvailabilityIsNotBlocked(
    calendarId: string,
    params: {
      startDate: Date;
      endDate?: Date;
      isAllDay?: boolean;
      hasEndTime?: boolean;
      duration?: number;
    }
  ): Promise<void> {
    try {
      if (!calendarId || !params.startDate) {
        return;
      }

      let eventRangeStart = new Date(params.startDate);
      let eventRangeEnd: Date;

      if (params.isAllDay) {
        const dayStart = new Date(eventRangeStart);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(dayStart);
        dayEnd.setHours(23, 59, 59, 999);
        eventRangeStart = dayStart;
        eventRangeEnd = dayEnd;
      } else if (params.endDate) {
        eventRangeEnd = new Date(params.endDate);
      } else if (params.duration && params.duration > 0) {
        eventRangeEnd = new Date(eventRangeStart.getTime() + params.duration * 60 * 1000);
      } else {
        eventRangeEnd = new Date(eventRangeStart.getTime() + 5 * 60 * 1000);
      }

      const blockingAvailabilities = await ProfessionalAvailabilityService.getApprovedAvailabilitiesForRange(
        calendarId,
        eventRangeStart,
        eventRangeEnd
      );

      const conflicts = blockingAvailabilities.filter((availability) => {
        const availabilityStart = this.combineDateAndTime(availability.date, availability.startTime);
        const availabilityEndRaw = this.combineDateAndTime(availability.date, availability.endTime);
        const availabilityEnd = availabilityEndRaw <= availabilityStart
          ? new Date(availabilityStart.getTime() + 5 * 60 * 1000)
          : availabilityEndRaw;

        return eventRangeStart < availabilityEnd && eventRangeEnd > availabilityStart;
      });

      if (conflicts.length > 0) {
        const first = conflicts[0];
        const dateLabel = first.date.toLocaleDateString('es-ES');
        const timeLabel = `${first.startTime} - ${first.endTime}`;
        throw new Error(`El horario ${timeLabel} del ${dateLabel} está bloqueado por un permiso o nota aprobada.`);
      }
    } catch (error) {
      throw error;
    }
  }

  private static combineDateAndTime(date: Date, time?: string): Date {
    const result = new Date(date);
    if (!time) {
      result.setHours(0, 0, 0, 0);
      return result;
    }

    const [hoursStr, minutesStr] = time.split(':');
    const hours = Number.parseInt(hoursStr ?? '0', 10);
    const minutes = Number.parseInt(minutesStr ?? '0', 10);

    result.setHours(
      Number.isFinite(hours) ? hours : 0,
      Number.isFinite(minutes) ? minutes : 0,
      0,
      0
    );

    return result;
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

        const startDateLocal = data.startDate.toDate();

        // Clonar la instancia para prevenir efectos secundarios al mutar fechas
        let endDateLocal: Date | undefined;
        if (data.endDate) {
          endDateLocal = data.endDate.toDate();
        }

        const recurringStatuses = normalizeRecurringStatuses(data.recurringInstancesStatus);

        events.push({
          ...data,
          id: doc.id,
          startDate: new Date(startDateLocal.getTime()),
          endDate: endDateLocal ? new Date(endDateLocal.getTime()) : undefined,
          createdAt: data.createdAt.toDate(),
          updatedAt: data.updatedAt.toDate(),
          completedAt: data.completedAt?.toDate(),
          recurring: data.recurring
            ? {
                ...data.recurring,
                endDate: data.recurring.endDate?.toDate()
              }
            : undefined,
          recurringInstancesStatus: recurringStatuses
        });
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

      logger.log(
        `✅ Total eventos expandidos: ${sortedEvents.length} (${recurringParents.length} padres recurrentes generaron ${sortedEvents.length - snapshot.size} instancias)`
      );

      return { events: sortedEvents, fetchedCount: snapshot.size };
      
    } catch (error) {
      console.error('❌ ERROR DETALLADO cargando eventos:', error);
      console.error('🔥 Error name:', (error as any)?.name);
      console.error('🔥 Error message:', (error as any)?.message);
      console.error('🔥 Error code:', (error as any)?.code);
      console.error('🔥 Error stack:', (error as any)?.stack);
      
      logger.error('Error al obtener eventos', error as Error, { calendarIds });
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
        const recurringStatuses = normalizeRecurringStatuses(data.recurringInstancesStatus);

        const event: CalendarEvent = {
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
          } : undefined,
          recurringInstancesStatus: recurringStatuses
        };

        if (recurringStatuses) {
          const baseKey = event.startDate.toISOString();
          const baseStatus = recurringStatuses[baseKey];
          if (baseStatus) {
            event.serviceStatus = baseStatus.status;
            event.completedAt = baseStatus.completedAt ?? event.completedAt;
            event.completedBy = baseStatus.completedBy ?? event.completedBy;
          }
        }

        events.push(event);
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
      const docRef = doc(db, 'calendar_events', eventId);
      const snapshot = await getDoc(docRef);

      if (!snapshot.exists()) {
        throw new Error('Evento no encontrado');
      }

      const currentData = snapshot.data() as CalendarEventFirestore;
      const currentStart = currentData.startDate.toDate();
      const currentEnd = currentData.endDate?.toDate();
      const currentIsAllDay = currentData.isAllDay;
      const currentHasEndTime = currentData.hasEndTime;
      const currentDuration = currentData.duration;

      const nextStart = updates.startDate ?? currentStart;
      const nextEnd = updates.endDate ?? currentEnd;
      const nextIsAllDay = typeof updates.isAllDay === 'boolean' ? updates.isAllDay : currentIsAllDay;
      const nextHasEndTime = typeof updates.hasEndTime === 'boolean' ? updates.hasEndTime : currentHasEndTime;
      const nextDuration = typeof updates.duration === 'number' ? updates.duration : currentDuration;

      const startChanged = nextStart.getTime() !== currentStart.getTime();
      const endChanged = (nextEnd?.getTime() ?? null) !== (currentEnd?.getTime() ?? null);
      const isAllDayChanged = nextIsAllDay !== currentIsAllDay;
      const hasEndTimeChanged = nextHasEndTime !== currentHasEndTime;
      const durationChanged = (nextDuration ?? null) !== (currentDuration ?? null);

      if (startChanged || endChanged || isAllDayChanged || hasEndTimeChanged || durationChanged) {
        await this.ensureAvailabilityIsNotBlocked(currentData.calendarId, {
          startDate: nextStart,
          endDate: nextEnd ?? undefined,
          isAllDay: nextIsAllDay,
          hasEndTime: nextHasEndTime,
          duration: nextDuration ?? undefined
        });
      }

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

      await updateDoc(docRef, updateData);

    } catch (error) {
      logger.error('Error al actualizar evento', error as Error, { eventId });
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
      const docRef = doc(db, 'calendar_events', eventId);
      const snapshot = await getDoc(docRef);

      if (!snapshot.exists()) {
        throw new Error('Evento no encontrado');
      }

      const data = snapshot.data() as CalendarEventFirestore;
      const now = Timestamp.now();

      const updateData: any = {
        serviceStatus: status,
        updatedAt: now
      };

      if (status === 'completed') {
        updateData.completedAt = now;
        updateData.completedBy = userId;
      } else {
        updateData.completedAt = null;
        updateData.completedBy = null;
      }

      if (data.recurring && !data.isRecurringInstance) {
        const parentStart = data.startDate.toDate();
        const parentStartKey = parentStart.getTime();
        const parentStatusKey = `${eventId}_${parentStartKey}`;
        const legacyParentKey = parentStartKey.toString();

        const oldParentKey = `${eventId}_${parentStart.toISOString()}`;
        const oldLegacyParentKey = parentStart.toISOString();

        updateData[`recurringInstancesStatus.${parentStatusKey}`] = deleteField();
        updateData[`recurringInstancesStatus.${legacyParentKey}`] = deleteField();
        updateData[`recurringInstancesStatus.${oldParentKey}`] = deleteField();
        updateData[`recurringInstancesStatus.${oldLegacyParentKey}`] = deleteField();
      }

      await updateDoc(docRef, updateData);
      logger.info('Estado del servicio actualizado', { eventId, status, userId });

      // ✅ NUEVO: Sincronizar con cliente externo si está vinculado
      if (status === 'completed' && data.externalClientId && data.duration) {
        try {
          // Obtener datos del cliente externo para su tarifa horaria
          const clientDoc = await getDoc(doc(db, 'external_clients', data.externalClientId));
          if (clientDoc.exists()) {
            const clientData = clientDoc.data();
            const clientHourlyRate = typeof clientData.hourlyRate === 'number' ? clientData.hourlyRate : 0;
            const hours = data.duration / 60; // Convertir minutos a horas

            // Obtener nombre del calendario/profesional
            const calendarDoc = await getDoc(doc(db, 'shared_calendars', data.calendarId));
            const professionalName = calendarDoc.exists() ? calendarDoc.data().name : 'Profesional';

            // Registrar servicio para el cliente externo usando LA TARIFA DEL CLIENTE
            await ExternalClientsService.recordService(data.externalClientId, {
              eventId,
              professionalId: data.calendarId,
              professionalName,
              professionalRate: clientHourlyRate, // ✅ Usar tarifa del cliente
              date: data.startDate.toDate(),
              title: data.title,
              hours
            });

            logger.log('✅ Servicio sincronizado con cliente externo', {
              eventId,
              clientId: data.externalClientId,
              hours,
              clientRate: clientHourlyRate,
              amount: hours * clientHourlyRate
            });
          }
        } catch (error) {
          // No lanzar error, solo log (no debe bloquear la completación del servicio)
          logger.error('Error al sincronizar con cliente externo', error as Error, { eventId });
        }
      }
    } catch (error) {
      logger.error('Error al actualizar estado del servicio', error as Error, { eventId, status });
      throw error;
    }
  }

  static async updateRecurringInstanceStatus(
    parentEventId: string,
    instanceDate: Date,
    userId: string,
    status: 'completed' | 'not_done' | 'in_progress' | 'pending'
  ): Promise<void> {
    try {
      const instanceTimestamp = instanceDate.getTime();
      const instanceKey = `${parentEventId}_${instanceTimestamp}`;
      const legacyKey = instanceTimestamp.toString();
      const docRef = doc(db, 'calendar_events', parentEventId);
      const now = Timestamp.now();

      const oldKey = `${parentEventId}_${instanceDate.toISOString()}`;
      const oldLegacyKey = instanceDate.toISOString();

      if (status === 'pending') {
        await updateDoc(docRef, {
          [`recurringInstancesStatus.${instanceKey}`]: deleteField(),
          [`recurringInstancesStatus.${legacyKey}`]: deleteField(),
          [`recurringInstancesStatus.${oldKey}`]: deleteField(),
          [`recurringInstancesStatus.${oldLegacyKey}`]: deleteField(),
          updatedAt: now
        });
        logger.info('Estado de instancia recurrente restablecido', { parentEventId, instanceKey, status, userId });
        return;
      }

      const statusData: any = {
        status,
        updatedAt: now,
        updatedBy: userId
      };

      if (status === 'completed') {
        statusData.completedAt = now;
        statusData.completedBy = userId;
      } else {
        statusData.completedAt = null;
        statusData.completedBy = null;
      }

      await updateDoc(docRef, {
        [`recurringInstancesStatus.${instanceKey}`]: statusData,
        [`recurringInstancesStatus.${legacyKey}`]: statusData,
        [`recurringInstancesStatus.${oldKey}`]: deleteField(),
        [`recurringInstancesStatus.${oldLegacyKey}`]: deleteField(),
        updatedAt: now
      });

      logger.info('Estado de instancia recurrente actualizado', { parentEventId, instanceKey, status, userId });
    } catch (error) {
      logger.error('Error al actualizar instancia recurrente', error as Error, {
        parentEventId,
        instanceDate: instanceDate.toISOString(),
        status
      });
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
      logger.error('Error al obtener eventos por estado', error as Error, { calendarId, status });
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
      logger.error('Error al añadir comentario', error as Error, { eventId, userId });
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
      logger.error('Error al obtener estadísticas', error as Error, { userId });
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
