/**
 * Email service for sending booking confirmations and notifications
 */
import { info, warn, error as logError } from '@/utils/logger';

export interface EmailData {
  to: string;
  cc?: string;
  subject: string;
  template: 'booking_confirmation' | 'booking_reminder' | 'card_shared';
  data: Record<string, any>;
}

export interface BookingEmailData {
  clientEmail: string;
  cardOwnerEmail: string;
  serviceName: string;
  date: string;
  time: string;
  clientName: string;
  duration: number;
  notes?: string;
}

class EmailService {
  private isProduction = process.env.NODE_ENV === 'production';
  
  /**
   * Send booking confirmation email
   */
  async sendBookingConfirmation(bookingData: BookingEmailData): Promise<{ success: boolean; error?: string }> {
    try {
      info('Sending booking confirmation email', { 
        component: 'EmailService',
        to: bookingData.clientEmail,
        cc: bookingData.cardOwnerEmail,
        service: bookingData.serviceName
      });

      // In development, just log the email
      if (!this.isProduction) {
        console.group('📧 BOOKING CONFIRMATION EMAIL');
        console.log('To:', bookingData.clientEmail);
        console.log('CC:', bookingData.cardOwnerEmail);
        console.log('Subject:', `Confirmación de reserva - ${bookingData.serviceName}`);
        console.log('Template Data:', {
          clientName: bookingData.clientName,
          serviceName: bookingData.serviceName,
          date: bookingData.date,
          time: bookingData.time,
          duration: `${bookingData.duration} minutos`,
          notes: bookingData.notes || 'Sin notas adicionales'
        });
        console.groupEnd();
        
        return { success: true };
      }

      // In production, use email service (example with fetch to API)
      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          template: 'booking_confirmation',
          data: {
            to: bookingData.clientEmail,
            cc: bookingData.cardOwnerEmail,
            subject: `Confirmación de reserva - ${bookingData.serviceName}`,
            templateData: {
              clientName: bookingData.clientName,
              serviceName: bookingData.serviceName,
              date: bookingData.date,
              time: bookingData.time,
              duration: bookingData.duration,
              notes: bookingData.notes
            }
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Email API error: ${response.status}`);
      }

      info('Booking confirmation email sent successfully', { 
        component: 'EmailService',
        to: bookingData.clientEmail
      });

      return { success: true };

    } catch (err) {
      logError('Failed to send booking confirmation email', err as Error, {
        component: 'EmailService',
        to: bookingData.clientEmail
      });
      
      return { 
        success: false, 
        error: 'Error al enviar el email de confirmación' 
      };
    }
  }

  /**
   * Send booking reminder email
   */
  async sendBookingReminder(bookingData: BookingEmailData): Promise<{ success: boolean; error?: string }> {
    try {
      info('Sending booking reminder email', { 
        component: 'EmailService',
        to: bookingData.clientEmail,
        service: bookingData.serviceName
      });

      if (!this.isProduction) {
        console.group('📧 BOOKING REMINDER EMAIL');
        console.log('To:', bookingData.clientEmail);
        console.log('Subject:', `Recordatorio de cita - ${bookingData.serviceName}`);
        console.log('Reminder for:', `${bookingData.date} a las ${bookingData.time}`);
        console.groupEnd();
        
        return { success: true };
      }

      // Production implementation would go here
      return { success: true };

    } catch (err) {
      logError('Failed to send booking reminder email', err as Error, {
        component: 'EmailService',
        to: bookingData.clientEmail
      });
      
      return { 
        success: false, 
        error: 'Error al enviar el recordatorio' 
      };
    }
  }

  /**
   * Send card sharing notification
   */
  async sendCardSharedNotification(
    cardOwnerEmail: string, 
    cardTitle: string, 
    sharedWith: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      info('Sending card shared notification', { 
        component: 'EmailService',
        to: cardOwnerEmail,
        cardTitle,
        sharedWith
      });

      if (!this.isProduction) {
        console.group('📧 CARD SHARED NOTIFICATION');
        console.log('To:', cardOwnerEmail);
        console.log('Card:', cardTitle);
        console.log('Shared with:', sharedWith);
        console.groupEnd();
        
        return { success: true };
      }

      // Production implementation would go here
      return { success: true };

    } catch (err) {
      logError('Failed to send card shared notification', err as Error, {
        component: 'EmailService',
        to: cardOwnerEmail
      });
      
      return { 
        success: false, 
        error: 'Error al enviar la notificación' 
      };
    }
  }

  /**
   * Validate email address
   */
  isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Prepare email template data
   */
  prepareTemplateData(template: string, data: Record<string, any>): Record<string, any> {
    const baseData = {
      timestamp: new Date().toISOString(),
      appName: 'Klycs',
      supportEmail: 'support@klycs.com'
    };

    return { ...baseData, ...data };
  }
}

export const emailService = new EmailService();
export default emailService;