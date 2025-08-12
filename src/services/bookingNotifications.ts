import { 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs,
  Timestamp,
  updateDoc,
  doc
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { AdvancedBookingData } from './advancedBookings';
import { secureLogger } from '@/utils/secureLogger';

export interface NotificationTemplate {
  id?: string;
  cardId: string;
  type: 'booking_confirmation' | 'booking_reminder' | 'booking_update' | 'booking_cancellation';
  channel: 'email' | 'sms' | 'push';
  subject?: string;
  content: string;
  variables: string[]; // Variables disponibles como {clientName}, {date}, etc.
  isActive: boolean;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface NotificationLog {
  id?: string;
  bookingId: string;
  cardId: string;
  recipient: string;
  channel: 'email' | 'sms' | 'push';
  type: string;
  status: 'pending' | 'sent' | 'failed' | 'delivered' | 'read';
  content: string;
  sentAt?: Timestamp;
  deliveredAt?: Timestamp;
  error?: string;
  retryCount: number;
  createdAt: Timestamp;
}

export interface NotificationConfig {
  cardId: string;
  notifications: {
    confirmation: {
      enabled: boolean;
      delay: number; // minutos después de crear la reserva
      channels: ('email' | 'sms')[];
    };
    reminder: {
      enabled: boolean;
      times: number[]; // horas antes de la cita: [24, 2]
      channels: ('email' | 'sms')[];
    };
    updates: {
      enabled: boolean;
      channels: ('email' | 'sms')[];
    };
    cancellation: {
      enabled: boolean;
      channels: ('email' | 'sms')[];
    };
  };
  settings: {
    senderName: string;
    senderEmail: string;
    senderPhone?: string;
    timezone: string;
    language: 'es' | 'en';
  };
}

export class BookingNotificationService {
  private static templates = new Map<string, NotificationTemplate[]>();
  private static configs = new Map<string, NotificationConfig>();

  /**
   * Configura las notificaciones para una tarjeta
   */
  static async setNotificationConfig(config: NotificationConfig): Promise<{ success: boolean; error?: string }> {
    try {
      this.configs.set(config.cardId, config);
      return { success: true };
    } catch (error) {
      secureLogger.error('Error configurando notificaciones', error);
      return { success: false, error: 'Error al configurar notificaciones' };
    }
  }

  /**
   * Obtiene la configuración de notificaciones
   */
  static getNotificationConfig(cardId: string): NotificationConfig {
    return this.configs.get(cardId) || this.getDefaultConfig(cardId);
  }

  /**
   * Envía notificación de confirmación de reserva
   */
  static async sendBookingConfirmation(booking: AdvancedBookingData): Promise<{ success: boolean; error?: string }> {
    try {
      const config = this.getNotificationConfig(booking.cardId);
      
      if (!config.notifications.confirmation.enabled) {
        return { success: true };
      }

      const template = await this.getTemplate(booking.cardId, 'booking_confirmation', 'email');
      
      if (!template) {
        return { success: false, error: 'Plantilla de confirmación no encontrada' };
      }

      // Enviar email si está habilitado
      if (config.notifications.confirmation.channels.includes('email')) {
        await this.sendEmailNotification(booking, template, config);
      }

      // Enviar SMS si está habilitado
      if (config.notifications.confirmation.channels.includes('sms') && booking.clientPhone) {
        const smsTemplate = await this.getTemplate(booking.cardId, 'booking_confirmation', 'sms');
        if (smsTemplate) {
          await this.sendSMSNotification(booking, smsTemplate, config);
        }
      }

      return { success: true };
    } catch (error) {
      secureLogger.error('Error enviando confirmación de reserva', error);
      return { success: false, error: 'Error al enviar confirmación' };
    }
  }

  /**
   * Programa recordatorios automáticos
   */
  static async scheduleReminders(booking: AdvancedBookingData): Promise<{ success: boolean; error?: string }> {
    try {
      const config = this.getNotificationConfig(booking.cardId);
      
      if (!config.notifications.reminder.enabled) {
        return { success: true };
      }

      const bookingDate = new Date(`${booking.date}T${booking.startTime}`);
      
      for (const hoursBeforeArray of config.notifications.reminder.times) {
        const reminderTime = new Date(bookingDate);
        reminderTime.setHours(reminderTime.getHours() - hoursBeforeArray);
        
        // Solo programar recordatorios futuros
        if (reminderTime > new Date()) {
          await this.scheduleNotification(booking, 'booking_reminder', reminderTime, config);
        }
      }

      return { success: true };
    } catch (error) {
      secureLogger.error('Error programando recordatorios', error);
      return { success: false, error: 'Error al programar recordatorios' };
    }
  }

  /**
   * Envía notificación de actualización de reserva
   */
  static async sendBookingUpdate(booking: AdvancedBookingData, changes: string[]): Promise<{ success: boolean; error?: string }> {
    try {
      const config = this.getNotificationConfig(booking.cardId);
      
      if (!config.notifications.updates.enabled) {
        return { success: true };
      }

      const template = await this.getTemplate(booking.cardId, 'booking_update', 'email');
      
      if (!template) {
        return { success: false, error: 'Plantilla de actualización no encontrada' };
      }

      // Agregar información de cambios al template
      const enhancedTemplate = {
        ...template,
        content: template.content.replace('{changes}', changes.join(', '))
      };

      // Enviar según canales configurados
      for (const channel of config.notifications.updates.channels) {
        if (channel === 'email') {
          await this.sendEmailNotification(booking, enhancedTemplate, config);
        } else if (channel === 'sms' && booking.clientPhone) {
          const smsTemplate = await this.getTemplate(booking.cardId, 'booking_update', 'sms');
          if (smsTemplate) {
            await this.sendSMSNotification(booking, smsTemplate, config);
          }
        }
      }

      return { success: true };
    } catch (error) {
      secureLogger.error('Error enviando actualización de reserva', error);
      return { success: false, error: 'Error al enviar actualización' };
    }
  }

  /**
   * Envía notificación de cancelación
   */
  static async sendCancellationNotification(booking: AdvancedBookingData, reason?: string): Promise<{ success: boolean; error?: string }> {
    try {
      const config = this.getNotificationConfig(booking.cardId);
      
      if (!config.notifications.cancellation.enabled) {
        return { success: true };
      }

      const template = await this.getTemplate(booking.cardId, 'booking_cancellation', 'email');
      
      if (!template) {
        return { success: false, error: 'Plantilla de cancelación no encontrada' };
      }

      // Agregar razón de cancelación si se proporciona
      const enhancedTemplate = {
        ...template,
        content: template.content.replace('{reason}', reason || 'No especificada')
      };

      // Enviar según canales configurados
      for (const channel of config.notifications.cancellation.channels) {
        if (channel === 'email') {
          await this.sendEmailNotification(booking, enhancedTemplate, config);
        } else if (channel === 'sms' && booking.clientPhone) {
          const smsTemplate = await this.getTemplate(booking.cardId, 'booking_cancellation', 'sms');
          if (smsTemplate) {
            await this.sendSMSNotification(booking, smsTemplate, config);
          }
        }
      }

      return { success: true };
    } catch (error) {
      secureLogger.error('Error enviando notificación de cancelación', error);
      return { success: false, error: 'Error al enviar cancelación' };
    }
  }

  /**
   * Envía notificación por email
   */
  private static async sendEmailNotification(
    booking: AdvancedBookingData,
    template: NotificationTemplate,
    config: NotificationConfig
  ): Promise<void> {
    try {
      const processedContent = this.processTemplate(template.content, booking, config);
      const processedSubject = this.processTemplate(template.subject || '', booking, config);

      // Simular envío de email (aquí se integraría con servicio real como SendGrid, etc.)
      const notificationLog: Omit<NotificationLog, 'id'> = {
        bookingId: booking.id!,
        cardId: booking.cardId,
        recipient: booking.clientEmail,
        channel: 'email',
        type: template.type,
        status: 'pending',
        content: processedContent,
        retryCount: 0,
        createdAt: Timestamp.now()
      };

      // Guardar log de notificación
      const docRef = await addDoc(collection(db, 'notificationLogs'), notificationLog);
      
      // Simular envío exitoso
      await updateDoc(doc(db, 'notificationLogs', docRef.id), {
        status: 'sent',
        sentAt: Timestamp.now()
      });

      secureLogger.info('Email enviado exitosamente', { 
        bookingId: booking.id, 
        recipient: booking.clientEmail 
      });
    } catch (error) {
      secureLogger.error('Error enviando email', error);
      throw error;
    }
  }

  /**
   * Envía notificación por SMS
   */
  private static async sendSMSNotification(
    booking: AdvancedBookingData,
    template: NotificationTemplate,
    config: NotificationConfig
  ): Promise<void> {
    try {
      const processedContent = this.processTemplate(template.content, booking, config);

      // Simular envío de SMS (aquí se integraría con servicio real como Twilio, etc.)
      const notificationLog: Omit<NotificationLog, 'id'> = {
        bookingId: booking.id!,
        cardId: booking.cardId,
        recipient: booking.clientPhone || '',
        channel: 'sms',
        type: template.type,
        status: 'pending',
        content: processedContent,
        retryCount: 0,
        createdAt: Timestamp.now()
      };

      // Guardar log de notificación
      const docRef = await addDoc(collection(db, 'notificationLogs'), notificationLog);
      
      // Simular envío exitoso
      await updateDoc(doc(db, 'notificationLogs', docRef.id), {
        status: 'sent',
        sentAt: Timestamp.now()
      });

      secureLogger.info('SMS enviado exitosamente', { 
        bookingId: booking.id, 
        recipient: booking.clientPhone 
      });
    } catch (error) {
      secureLogger.error('Error enviando SMS', error);
      throw error;
    }
  }

  /**
   * Procesa variables en el template
   */
  private static processTemplate(content: string, booking: AdvancedBookingData, config: NotificationConfig): string {
    const variables = {
      '{clientName}': booking.clientName,
      '{serviceName}': booking.serviceName,
      '{date}': new Date(booking.date).toLocaleDateString('es-ES', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }),
      '{time}': booking.startTime,
      '{duration}': `${booking.duration} minutos`,
      '{price}': `€${booking.price}`,
      '{senderName}': config.settings.senderName,
      '{notes}': booking.notes || 'Sin notas adicionales'
    };

    let processedContent = content;
    Object.entries(variables).forEach(([variable, value]) => {
      processedContent = processedContent.replace(new RegExp(variable.replace(/[{}]/g, '\\$&'), 'g'), value);
    });

    return processedContent;
  }

  /**
   * Obtiene template para un tipo específico
   */
  private static async getTemplate(cardId: string, type: string, channel: string): Promise<NotificationTemplate | null> {
    try {
      // Verificar cache primero
      const cached = this.templates.get(cardId);
      if (cached) {
        const template = cached.find(t => t.type === type && t.channel === channel && t.isActive);
        if (template) return template;
      }

      // Buscar en base de datos
      const q = query(
        collection(db, 'notificationTemplates'),
        where('cardId', '==', cardId),
        where('type', '==', type),
        where('channel', '==', channel),
        where('isActive', '==', true)
      );

      const snapshot = await getDocs(q);
      
      if (!snapshot.empty) {
        const template = { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as NotificationTemplate;
        
        // Actualizar cache
        const cardTemplates = this.templates.get(cardId) || [];
        cardTemplates.push(template);
        this.templates.set(cardId, cardTemplates);
        
        return template;
      }

      // Si no existe, crear template por defecto
      return await this.createDefaultTemplate(cardId, type, channel);
    } catch (error) {
      secureLogger.error('Error obteniendo template', error);
      return null;
    }
  }

  /**
   * Crea template por defecto
   */
  private static async createDefaultTemplate(cardId: string, type: string, channel: string): Promise<NotificationTemplate> {
    const defaultTemplates = this.getDefaultTemplates();
    const template = defaultTemplates[type]?.[channel];
    
    if (!template) {
      throw new Error(`Template no encontrado para ${type}/${channel}`);
    }

    const newTemplate: NotificationTemplate = {
      cardId,
      type: type as any,
      channel: channel as any,
      subject: template.subject,
      content: template.content,
      variables: template.variables,
      isActive: true,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    };

    const docRef = await addDoc(collection(db, 'notificationTemplates'), newTemplate);
    
    return {
      ...newTemplate,
      id: docRef.id
    };
  }

  /**
   * Programa notificación para envío futuro
   */
  private static async scheduleNotification(
    booking: AdvancedBookingData,
    type: string,
    scheduledTime: Date,
    config: NotificationConfig
  ): Promise<void> {
    try {
      // Aquí se implementaría la lógica de programación
      // Por ejemplo, usando Firebase Functions con cron jobs o similar
      secureLogger.info('Notificación programada', {
        bookingId: booking.id,
        type,
        scheduledTime: scheduledTime.toISOString()
      });
    } catch (error) {
      secureLogger.error('Error programando notificación', error);
    }
  }

  /**
   * Obtiene configuración por defecto
   */
  static getDefaultConfig(cardId: string): NotificationConfig {
    return {
      cardId,
      notifications: {
        confirmation: {
          enabled: true,
          delay: 5,
          channels: ['email']
        },
        reminder: {
          enabled: true,
          times: [24, 2],
          channels: ['email']
        },
        updates: {
          enabled: true,
          channels: ['email']
        },
        cancellation: {
          enabled: true,
          channels: ['email']
        }
      },
      settings: {
        senderName: 'KLYCS Reservas',
        senderEmail: 'noreply@klycs.com',
        timezone: 'Europe/Madrid',
        language: 'es'
      }
    };
  }

  /**
   * Templates por defecto del sistema
   */
  private static getDefaultTemplates(): any {
    return {
      booking_confirmation: {
        email: {
          subject: 'Confirmación de tu reserva - {serviceName}',
          content: `Hola {clientName},

Tu reserva ha sido confirmada exitosamente:

🗓️ Servicio: {serviceName}
📅 Fecha: {date}
⏰ Hora: {time}
⏱️ Duración: {duration}
💰 Precio: {price}

Notas: {notes}

¡Te esperamos!

Saludos,
{senderName}`,
          variables: ['{clientName}', '{serviceName}', '{date}', '{time}', '{duration}', '{price}', '{notes}', '{senderName}']
        },
        sms: {
          content: 'Hola {clientName}! Tu reserva para {serviceName} el {date} a las {time} ha sido confirmada. ¡Te esperamos! - {senderName}',
          variables: ['{clientName}', '{serviceName}', '{date}', '{time}', '{senderName}']
        }
      },
      booking_reminder: {
        email: {
          subject: 'Recordatorio de tu reserva - {serviceName}',
          content: `Hola {clientName},

Te recordamos que tienes una reserva programada:

🗓️ Servicio: {serviceName}
📅 Fecha: {date}
⏰ Hora: {time}
⏱️ Duración: {duration}

Por favor, llega 5 minutos antes de la hora programada.

Si necesitas realizar algún cambio, contáctanos lo antes posible.

Saludos,
{senderName}`,
          variables: ['{clientName}', '{serviceName}', '{date}', '{time}', '{duration}', '{senderName}']
        },
        sms: {
          content: 'Recordatorio: Tu cita para {serviceName} es {date} a las {time}. ¡Te esperamos! - {senderName}',
          variables: ['{clientName}', '{serviceName}', '{date}', '{time}', '{senderName}']
        }
      },
      booking_update: {
        email: {
          subject: 'Actualización de tu reserva - {serviceName}',
          content: `Hola {clientName},

Ha habido cambios en tu reserva:

Cambios realizados: {changes}

Datos actualizados:
🗓️ Servicio: {serviceName}
📅 Fecha: {date}
⏰ Hora: {time}
⏱️ Duración: {duration}

Si tienes alguna pregunta, no dudes en contactarnos.

Saludos,
{senderName}`,
          variables: ['{clientName}', '{serviceName}', '{date}', '{time}', '{duration}', '{changes}', '{senderName}']
        }
      },
      booking_cancellation: {
        email: {
          subject: 'Cancelación de tu reserva - {serviceName}',
          content: `Hola {clientName},

Lamentamos informarte que tu reserva ha sido cancelada:

🗓️ Servicio: {serviceName}
📅 Fecha: {date}
⏰ Hora: {time}

Motivo: {reason}

Si deseas reprogramar, estaremos encantados de ayudarte.

Saludos,
{senderName}`,
          variables: ['{clientName}', '{serviceName}', '{date}', '{time}', '{reason}', '{senderName}']
        }
      }
    };
  }

  /**
   * Obtiene estadísticas de notificaciones
   */
  static async getNotificationStats(cardId: string, dateFrom: string, dateTo: string): Promise<{
    totalSent: number;
    emailsSent: number;
    smsSent: number;
    deliveryRate: number;
    errorRate: number;
    byType: { [key: string]: number };
  }> {
    try {
      const q = query(
        collection(db, 'notificationLogs'),
        where('cardId', '==', cardId)
      );

      const snapshot = await getDocs(q);
      const logs: NotificationLog[] = [];
      
      snapshot.forEach(doc => {
        logs.push({ id: doc.id, ...doc.data() } as NotificationLog);
      });

      // Filtrar por fechas
      const filteredLogs = logs.filter(log => {
        const logDate = log.createdAt.toDate().toISOString().split('T')[0];
        return logDate >= dateFrom && logDate <= dateTo;
      });

      const stats = {
        totalSent: filteredLogs.filter(log => log.status === 'sent').length,
        emailsSent: filteredLogs.filter(log => log.channel === 'email' && log.status === 'sent').length,
        smsSent: filteredLogs.filter(log => log.channel === 'sms' && log.status === 'sent').length,
        deliveryRate: 0,
        errorRate: 0,
        byType: {} as { [key: string]: number }
      };

      const totalAttempts = filteredLogs.length;
      const totalDelivered = filteredLogs.filter(log => log.status === 'delivered').length;
      const totalErrors = filteredLogs.filter(log => log.status === 'failed').length;

      stats.deliveryRate = totalAttempts > 0 ? (totalDelivered / totalAttempts) * 100 : 0;
      stats.errorRate = totalAttempts > 0 ? (totalErrors / totalAttempts) * 100 : 0;

      // Estadísticas por tipo
      filteredLogs.forEach(log => {
        stats.byType[log.type] = (stats.byType[log.type] || 0) + 1;
      });

      return stats;
    } catch (error) {
      secureLogger.error('Error obteniendo estadísticas de notificaciones', error);
      return {
        totalSent: 0,
        emailsSent: 0,
        smsSent: 0,
        deliveryRate: 0,
        errorRate: 0,
        byType: {}
      };
    }
  }
}