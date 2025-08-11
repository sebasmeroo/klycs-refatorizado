import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  query, 
  where, 
  getDocs,
  orderBy,
  limit,
  Timestamp
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { logger } from '@/utils/logger';

export interface NotificationTemplate {
  id: string;
  type: 'email' | 'sms' | 'push' | 'in_app';
  category: 'booking' | 'payment' | 'system' | 'marketing';
  name: string;
  subject?: string;
  body: string;
  variables: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface NotificationRule {
  id: string;
  userId: string;
  triggerEvent: 'booking_created' | 'booking_confirmed' | 'booking_cancelled' | 'payment_received' | 'payment_failed' | 'card_viewed' | 'reminder_24h' | 'reminder_1h';
  templateId: string;
  channels: ('email' | 'sms' | 'push' | 'in_app')[];
  delay: number; // en minutos
  conditions?: {
    field: string;
    operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than';
    value: any;
  }[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface NotificationQueue {
  id: string;
  userId: string;
  recipientEmail?: string;
  recipientPhone?: string;
  templateId: string;
  type: 'email' | 'sms' | 'push' | 'in_app';
  subject?: string;
  body: string;
  variables: Record<string, any>;
  scheduledFor: Date;
  status: 'pending' | 'sent' | 'failed' | 'cancelled';
  attempts: number;
  lastAttempt?: Date;
  error?: string;
  metadata: {
    triggerEvent: string;
    relatedId?: string;
    priority: 'low' | 'normal' | 'high';
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface UserNotificationPreferences {
  id: string;
  userId: string;
  preferences: {
    email: {
      bookings: boolean;
      payments: boolean;
      marketing: boolean;
      system: boolean;
    };
    sms: {
      bookings: boolean;
      payments: boolean;
      reminders: boolean;
    };
    push: {
      bookings: boolean;
      payments: boolean;
      system: boolean;
    };
    in_app: {
      all: boolean;
    };
  };
  createdAt: Date;
  updatedAt: Date;
}

class NotificationsService {
  private readonly EMAIL_API_URL = 'https://api.sendgrid.com/v3/mail/send';
  private readonly SMS_API_URL = 'https://api.twilio.com/2010-04-01/Accounts';
  private readonly sendgridApiKey = process.env.VITE_SENDGRID_API_KEY;
  private readonly twilioAccountSid = process.env.VITE_TWILIO_ACCOUNT_SID;
  private readonly twilioAuthToken = process.env.VITE_TWILIO_AUTH_TOKEN;
  private readonly twilioPhoneNumber = process.env.VITE_TWILIO_PHONE_NUMBER;

  /**
   * Inicializar plantillas predeterminadas
   */
  async initializeDefaultTemplates(): Promise<{ success: boolean; error?: string }> {
    try {
      const defaultTemplates: Omit<NotificationTemplate, 'id' | 'createdAt' | 'updatedAt'>[] = [
        {
          type: 'email',
          category: 'booking',
          name: 'Nueva Reserva - Cliente',
          subject: 'Confirmación de reserva - {{serviceName}}',
          body: `
            <h2>¡Gracias por tu reserva!</h2>
            <p>Hola {{customerName}},</p>
            <p>Tu reserva ha sido confirmada para el siguiente servicio:</p>
            <div style="background: #f5f5f5; padding: 20px; margin: 20px 0; border-radius: 8px;">
              <h3>{{serviceName}}</h3>
              <p><strong>Fecha:</strong> {{bookingDate}}</p>
              <p><strong>Hora:</strong> {{bookingTime}}</p>
              <p><strong>Duración:</strong> {{duration}}</p>
              <p><strong>Precio:</strong> {{price}}</p>
            </div>
            <p>Si necesitas hacer cambios o tienes alguna pregunta, no dudes en contactarnos.</p>
            <p>¡Esperamos verte pronto!</p>
            <p>Saludos,<br>{{businessName}}</p>
          `,
          variables: ['customerName', 'serviceName', 'bookingDate', 'bookingTime', 'duration', 'price', 'businessName'],
          isActive: true
        },
        {
          type: 'email',
          category: 'booking',
          name: 'Nueva Reserva - Negocio',
          subject: 'Nueva reserva recibida - {{serviceName}}',
          body: `
            <h2>Nueva reserva recibida</h2>
            <p>Has recibido una nueva reserva:</p>
            <div style="background: #f5f5f5; padding: 20px; margin: 20px 0; border-radius: 8px;">
              <h3>{{serviceName}}</h3>
              <p><strong>Cliente:</strong> {{customerName}}</p>
              <p><strong>Email:</strong> {{customerEmail}}</p>
              <p><strong>Teléfono:</strong> {{customerPhone}}</p>
              <p><strong>Fecha:</strong> {{bookingDate}}</p>
              <p><strong>Hora:</strong> {{bookingTime}}</p>
              <p><strong>Precio:</strong> {{price}}</p>
            </div>
            <p>Puedes gestionar esta reserva desde tu dashboard de Klycs.</p>
          `,
          variables: ['serviceName', 'customerName', 'customerEmail', 'customerPhone', 'bookingDate', 'bookingTime', 'price'],
          isActive: true
        },
        {
          type: 'sms',
          category: 'booking',
          name: 'Recordatorio 24h',
          subject: '',
          body: 'Hola {{customerName}}! Te recordamos tu cita mañana {{bookingDate}} a las {{bookingTime}} para {{serviceName}}. {{businessName}}',
          variables: ['customerName', 'bookingDate', 'bookingTime', 'serviceName', 'businessName'],
          isActive: true
        },
        {
          type: 'email',
          category: 'payment',
          name: 'Pago Recibido',
          subject: 'Pago recibido - {{serviceName}}',
          body: `
            <h2>Pago confirmado</h2>
            <p>Hola {{customerName}},</p>
            <p>Hemos recibido tu pago correctamente:</p>
            <div style="background: #e8f5e8; padding: 20px; margin: 20px 0; border-radius: 8px; border: 1px solid #4caf50;">
              <h3>✅ Pago procesado</h3>
              <p><strong>Servicio:</strong> {{serviceName}}</p>
              <p><strong>Monto:</strong> {{amount}}</p>
              <p><strong>Fecha de pago:</strong> {{paymentDate}}</p>
              <p><strong>ID de transacción:</strong> {{transactionId}}</p>
            </div>
            <p>Tu reserva está confirmada. Te esperamos el {{bookingDate}} a las {{bookingTime}}.</p>
            <p>Gracias por confiar en nosotros!</p>
            <p>{{businessName}}</p>
          `,
          variables: ['customerName', 'serviceName', 'amount', 'paymentDate', 'transactionId', 'bookingDate', 'bookingTime', 'businessName'],
          isActive: true
        },
        {
          type: 'push',
          category: 'system',
          name: 'Nueva Vista de Tarjeta',
          subject: 'Alguien vio tu tarjeta',
          body: 'Tu tarjeta "{{cardName}}" ha sido vista {{viewCount}} veces hoy',
          variables: ['cardName', 'viewCount'],
          isActive: true
        }
      ];

      for (const templateData of defaultTemplates) {
        const docRef = doc(collection(db, 'notification_templates'));
        await setDoc(docRef, {
          ...templateData,
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }

      logger.info('Default notification templates initialized');
      return { success: true };

    } catch (error) {
      logger.error('Error initializing notification templates', { 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to initialize templates'
      };
    }
  }

  /**
   * Enviar notificación
   */
  async sendNotification(
    triggerEvent: NotificationRule['triggerEvent'],
    userId: string,
    variables: Record<string, any>,
    recipientEmail?: string,
    recipientPhone?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Buscar reglas activas para este evento
      const rulesQuery = query(
        collection(db, 'notification_rules'),
        where('userId', '==', userId),
        where('triggerEvent', '==', triggerEvent),
        where('isActive', '==', true)
      );

      const rulesSnapshot = await getDocs(rulesQuery);
      
      if (rulesSnapshot.empty) {
        logger.info('No notification rules found for event', { triggerEvent, userId });
        return { success: true };
      }

      // Obtener preferencias del usuario
      const preferences = await this.getUserPreferences(userId);

      for (const ruleDoc of rulesSnapshot.docs) {
        const rule = { id: ruleDoc.id, ...ruleDoc.data() } as NotificationRule;

        // Verificar condiciones si las hay
        if (rule.conditions && !this.evaluateConditions(rule.conditions, variables)) {
          continue;
        }

        // Obtener plantilla
        const templateDoc = await getDoc(doc(db, 'notification_templates', rule.templateId));
        if (!templateDoc.exists()) {
          continue;
        }

        const template = { id: templateDoc.id, ...templateDoc.data() } as NotificationTemplate;

        // Procesar cada canal
        for (const channel of rule.channels) {
          // Verificar preferencias del usuario
          if (!this.checkUserPreference(preferences, template.category, channel)) {
            continue;
          }

          // Calcular tiempo de envío
          const scheduledFor = new Date(Date.now() + rule.delay * 60 * 1000);

          // Renderizar contenido
          const renderedSubject = this.renderTemplate(template.subject || '', variables);
          const renderedBody = this.renderTemplate(template.body, variables);

          // Agregar a cola de notificaciones
          await this.queueNotification({
            userId,
            recipientEmail: channel === 'email' ? recipientEmail : undefined,
            recipientPhone: channel === 'sms' ? recipientPhone : undefined,
            templateId: template.id,
            type: channel,
            subject: renderedSubject,
            body: renderedBody,
            variables,
            scheduledFor,
            metadata: {
              triggerEvent,
              relatedId: variables.id || variables.bookingId || variables.cardId,
              priority: this.getPriority(triggerEvent)
            }
          });
        }
      }

      return { success: true };

    } catch (error) {
      logger.error('Error sending notification', { 
        triggerEvent, 
        userId,
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send notification'
      };
    }
  }

  /**
   * Agregar notificación a la cola
   */
  private async queueNotification(data: Omit<NotificationQueue, 'id' | 'status' | 'attempts' | 'createdAt' | 'updatedAt'>): Promise<void> {
    const queueData: Omit<NotificationQueue, 'id'> = {
      ...data,
      status: 'pending',
      attempts: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const docRef = doc(collection(db, 'notification_queue'));
    await setDoc(docRef, queueData);

    logger.info('Notification queued', { 
      type: data.type, 
      scheduledFor: data.scheduledFor 
    });
  }

  /**
   * Procesar cola de notificaciones
   */
  async processNotificationQueue(): Promise<{ success: boolean; processed: number; error?: string }> {
    try {
      const now = new Date();
      
      // Obtener notificaciones pendientes que deben enviarse
      const queueQuery = query(
        collection(db, 'notification_queue'),
        where('status', '==', 'pending'),
        where('scheduledFor', '<=', now),
        orderBy('scheduledFor'),
        limit(50) // Procesar máximo 50 por lote
      );

      const snapshot = await getDocs(queueQuery);
      let processed = 0;

      for (const notificationDoc of snapshot.docs) {
        const notification = { id: notificationDoc.id, ...notificationDoc.data() } as NotificationQueue;

        try {
          let result: { success: boolean; error?: string };

          switch (notification.type) {
            case 'email':
              result = await this.sendEmail(notification);
              break;
            case 'sms':
              result = await this.sendSMS(notification);
              break;
            case 'push':
              result = await this.sendPushNotification(notification);
              break;
            case 'in_app':
              result = await this.sendInAppNotification(notification);
              break;
            default:
              result = { success: false, error: 'Unsupported notification type' };
          }

          if (result.success) {
            await updateDoc(doc(db, 'notification_queue', notification.id), {
              status: 'sent',
              lastAttempt: new Date(),
              attempts: notification.attempts + 1,
              updatedAt: new Date()
            });
          } else {
            const maxAttempts = 3;
            const newAttempts = notification.attempts + 1;

            if (newAttempts >= maxAttempts) {
              await updateDoc(doc(db, 'notification_queue', notification.id), {
                status: 'failed',
                lastAttempt: new Date(),
                attempts: newAttempts,
                error: result.error,
                updatedAt: new Date()
              });
            } else {
              // Programar reintento en 15 minutos
              const nextAttempt = new Date(Date.now() + 15 * 60 * 1000);
              await updateDoc(doc(db, 'notification_queue', notification.id), {
                scheduledFor: nextAttempt,
                lastAttempt: new Date(),
                attempts: newAttempts,
                error: result.error,
                updatedAt: new Date()
              });
            }
          }

          processed++;

        } catch (error) {
          logger.error('Error processing notification', { 
            notificationId: notification.id,
            error: error instanceof Error ? error.message : 'Unknown error' 
          });
        }
      }

      return { success: true, processed };

    } catch (error) {
      logger.error('Error processing notification queue', { 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      
      return {
        success: false,
        processed: 0,
        error: error instanceof Error ? error.message : 'Failed to process queue'
      };
    }
  }

  /**
   * Enviar email
   */
  private async sendEmail(notification: NotificationQueue): Promise<{ success: boolean; error?: string }> {
    try {
      if (!this.sendgridApiKey || !notification.recipientEmail) {
        throw new Error('SendGrid API key or recipient email not configured');
      }

      const emailData = {
        personalizations: [{
          to: [{ email: notification.recipientEmail }],
          subject: notification.subject
        }],
        from: { 
          email: 'notifications@klycs.com',
          name: 'Klycs'
        },
        content: [{
          type: 'text/html',
          value: notification.body
        }]
      };

      const response = await fetch(this.EMAIL_API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.sendgridApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(emailData)
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`SendGrid error: ${error}`);
      }

      logger.info('Email sent successfully', { 
        recipient: notification.recipientEmail,
        subject: notification.subject 
      });

      return { success: true };

    } catch (error) {
      logger.error('Error sending email', { 
        notificationId: notification.id,
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send email'
      };
    }
  }

  /**
   * Enviar SMS
   */
  private async sendSMS(notification: NotificationQueue): Promise<{ success: boolean; error?: string }> {
    try {
      if (!this.twilioAccountSid || !this.twilioAuthToken || !this.twilioPhoneNumber || !notification.recipientPhone) {
        throw new Error('Twilio credentials or recipient phone not configured');
      }

      const smsData = new URLSearchParams({
        To: notification.recipientPhone,
        From: this.twilioPhoneNumber,
        Body: notification.body
      });

      const authString = Buffer.from(`${this.twilioAccountSid}:${this.twilioAuthToken}`).toString('base64');

      const response = await fetch(`${this.SMS_API_URL}/${this.twilioAccountSid}/Messages.json`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${authString}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: smsData
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Twilio error: ${error.message}`);
      }

      logger.info('SMS sent successfully', { 
        recipient: notification.recipientPhone 
      });

      return { success: true };

    } catch (error) {
      logger.error('Error sending SMS', { 
        notificationId: notification.id,
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send SMS'
      };
    }
  }

  /**
   * Enviar notificación push
   */
  private async sendPushNotification(notification: NotificationQueue): Promise<{ success: boolean; error?: string }> {
    try {
      // Implementar con Firebase Cloud Messaging o similar
      // Por ahora, simular envío exitoso
      
      logger.info('Push notification sent', { 
        userId: notification.userId 
      });

      return { success: true };

    } catch (error) {
      logger.error('Error sending push notification', { 
        notificationId: notification.id,
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send push notification'
      };
    }
  }

  /**
   * Enviar notificación in-app
   */
  private async sendInAppNotification(notification: NotificationQueue): Promise<{ success: boolean; error?: string }> {
    try {
      // Guardar notificación in-app en Firestore
      const inAppData = {
        userId: notification.userId,
        title: notification.subject || 'Notificación',
        message: notification.body,
        type: notification.metadata.triggerEvent,
        relatedId: notification.metadata.relatedId,
        isRead: false,
        createdAt: new Date()
      };

      const docRef = doc(collection(db, 'in_app_notifications'));
      await setDoc(docRef, inAppData);

      logger.info('In-app notification created', { 
        userId: notification.userId 
      });

      return { success: true };

    } catch (error) {
      logger.error('Error sending in-app notification', { 
        notificationId: notification.id,
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send in-app notification'
      };
    }
  }

  /**
   * Renderizar plantilla con variables
   */
  private renderTemplate(template: string, variables: Record<string, any>): string {
    let rendered = template;
    
    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`{{${key}}}`, 'g');
      rendered = rendered.replace(regex, String(value || ''));
    }
    
    return rendered;
  }

  /**
   * Evaluar condiciones
   */
  private evaluateConditions(conditions: NotificationRule['conditions'], variables: Record<string, any>): boolean {
    if (!conditions) return true;

    return conditions.every(condition => {
      const value = variables[condition.field];
      
      switch (condition.operator) {
        case 'equals':
          return value === condition.value;
        case 'not_equals':
          return value !== condition.value;
        case 'contains':
          return String(value).includes(condition.value);
        case 'greater_than':
          return Number(value) > Number(condition.value);
        case 'less_than':
          return Number(value) < Number(condition.value);
        default:
          return true;
      }
    });
  }

  /**
   * Obtener preferencias del usuario
   */
  private async getUserPreferences(userId: string): Promise<UserNotificationPreferences | null> {
    try {
      const q = query(
        collection(db, 'user_notification_preferences'),
        where('userId', '==', userId)
      );

      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        return null;
      }

      return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as UserNotificationPreferences;

    } catch (error) {
      logger.error('Error getting user preferences', { 
        userId,
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      return null;
    }
  }

  /**
   * Verificar preferencia del usuario
   */
  private checkUserPreference(
    preferences: UserNotificationPreferences | null,
    category: NotificationTemplate['category'],
    channel: 'email' | 'sms' | 'push' | 'in_app'
  ): boolean {
    if (!preferences) {
      // Si no hay preferencias, permitir todas las notificaciones excepto marketing
      return category !== 'marketing';
    }

    const userPrefs = preferences.preferences[channel];
    
    switch (channel) {
      case 'email':
        return userPrefs[category as keyof typeof userPrefs] ?? (category !== 'marketing');
      case 'sms':
        return userPrefs[category === 'booking' ? 'bookings' : category === 'payment' ? 'payments' : 'reminders'] ?? false;
      case 'push':
        return userPrefs[category as keyof typeof userPrefs] ?? true;
      case 'in_app':
        return userPrefs.all ?? true;
      default:
        return false;
    }
  }

  /**
   * Obtener prioridad del evento
   */
  private getPriority(triggerEvent: NotificationRule['triggerEvent']): 'low' | 'normal' | 'high' {
    switch (triggerEvent) {
      case 'payment_failed':
      case 'booking_cancelled':
        return 'high';
      case 'booking_created':
      case 'booking_confirmed':
      case 'payment_received':
        return 'normal';
      default:
        return 'low';
    }
  }

  /**
   * Crear regla de notificación
   */
  async createNotificationRule(
    userId: string,
    ruleData: Omit<NotificationRule, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
  ): Promise<{ success: boolean; data?: NotificationRule; error?: string }> {
    try {
      const rule: Omit<NotificationRule, 'id'> = {
        ...ruleData,
        userId,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const docRef = doc(collection(db, 'notification_rules'));
      await setDoc(docRef, rule);

      logger.info('Notification rule created', { 
        userId, 
        triggerEvent: ruleData.triggerEvent 
      });

      return {
        success: true,
        data: { id: docRef.id, ...rule }
      };

    } catch (error) {
      logger.error('Error creating notification rule', { 
        userId,
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create rule'
      };
    }
  }

  /**
   * Actualizar preferencias de notificación
   */
  async updateUserPreferences(
    userId: string,
    preferences: UserNotificationPreferences['preferences']
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const q = query(
        collection(db, 'user_notification_preferences'),
        where('userId', '==', userId)
      );

      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        // Crear nuevas preferencias
        const docRef = doc(collection(db, 'user_notification_preferences'));
        await setDoc(docRef, {
          userId,
          preferences,
          createdAt: new Date(),
          updatedAt: new Date()
        });
      } else {
        // Actualizar existentes
        const docRef = snapshot.docs[0].ref;
        await updateDoc(docRef, {
          preferences,
          updatedAt: new Date()
        });
      }

      logger.info('User notification preferences updated', { userId });

      return { success: true };

    } catch (error) {
      logger.error('Error updating user preferences', { 
        userId,
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update preferences'
      };
    }
  }
}

export const notificationsService = new NotificationsService();