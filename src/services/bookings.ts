import { collection, addDoc, getDocs, getDoc, doc, updateDoc, deleteDoc, query, where, orderBy, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { info, error as logError } from '@/utils/logger';
import { AppErrorHandler, NetworkError, ValidationError } from '@/utils/errorHandler';

export interface BookingData {
  id?: string;
  userId: string;
  serviceId: string;
  cardId: string;
  cardTitle: string;
  cardOwnerEmail: string;
  serviceName: string;
  date: string;
  time: string;
  clientName: string;
  clientEmail: string;
  clientPhone?: string;
  notes?: string;
  duration: number;
  price: number;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  createdAt: Timestamp;
  updatedAt?: Timestamp;
}

export interface BookingStats {
  total: number;
  pending: number;
  confirmed: number;
  cancelled: number;
  completed: number;
  totalRevenue: number;
}

export class BookingsService {
  /**
   * Creates a new booking
   */
  static async createBooking(bookingData: Omit<BookingData, 'createdAt' | 'status' | 'updatedAt'>): Promise<{ success: boolean; error?: string; id?: string }> {
    return AppErrorHandler.withErrorHandling(async () => {
      AppErrorHandler.validateRequired(bookingData.clientName, 'Nombre del cliente');
      AppErrorHandler.validateEmail(bookingData.clientEmail);
      AppErrorHandler.validateRequired(bookingData.date, 'Fecha');
      AppErrorHandler.validateRequired(bookingData.time, 'Hora');

      const booking: BookingData = {
        ...bookingData,
        status: 'pending',
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      };

      const docRef = await addDoc(collection(db, 'bookings'), booking);
      
      info('Booking created successfully', { component: 'BookingsService', bookingId: docRef.id, cardId: bookingData.cardId });
      return { success: true, id: docRef.id };
    }, { component: 'BookingsService', action: 'createBooking' }) ?? { success: false, error: 'Error al crear la reserva' };
  }

  /**
   * Gets bookings for a specific user (card owner)
   */
  static async getUserBookings(userId: string, filters?: {
    status?: string;
    dateFrom?: string;
    dateTo?: string;
    searchTerm?: string;
  }): Promise<{ success: boolean; data?: BookingData[]; error?: string }> {
    try {
      let q = query(
        collection(db, 'bookings'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      let bookings: BookingData[] = [];
      
      querySnapshot.forEach((doc) => {
        bookings.push({ id: doc.id, ...doc.data() } as BookingData);
      });

      // Apply filters
      if (filters) {
        if (filters.status && filters.status !== 'all') {
          bookings = bookings.filter(booking => booking.status === filters.status);
        }

        if (filters.dateFrom) {
          bookings = bookings.filter(booking => booking.date >= filters.dateFrom!);
        }

        if (filters.dateTo) {
          bookings = bookings.filter(booking => booking.date <= filters.dateTo!);
        }

        if (filters.searchTerm) {
          const searchLower = filters.searchTerm.toLowerCase();
          bookings = bookings.filter(booking => 
            booking.clientName.toLowerCase().includes(searchLower) ||
            booking.clientEmail.toLowerCase().includes(searchLower) ||
            booking.serviceName.toLowerCase().includes(searchLower)
          );
        }
      }
      
      return { success: true, data: bookings };
    } catch (err) {
      logError('Failed to get user bookings', err as Error, { component: 'BookingsService', userId });
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Error al obtener las reservas' 
      };
    }
  }

  /**
   * Updates booking status
   */
  static async updateBookingStatus(bookingId: string, status: BookingData['status']): Promise<{ success: boolean; error?: string }> {
    try {
      const bookingRef = doc(db, 'bookings', bookingId);
      await updateDoc(bookingRef, {
        status,
        updatedAt: Timestamp.now()
      });
      
      info('Booking status updated successfully', { component: 'BookingsService', bookingId, status });
      return { success: true };
    } catch (err) {
      logError('Failed to update booking status', err as Error, { component: 'BookingsService', bookingId, status });
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Error al actualizar el estado' 
      };
    }
  }

  /**
   * Gets booking statistics
   */
  static async getBookingStats(userId: string): Promise<{ success: boolean; data?: BookingStats; error?: string }> {
    try {
      const result = await this.getUserBookings(userId);
      
      if (!result.success || !result.data) {
        return {
          success: false,
          error: 'Error al obtener estadísticas'
        };
      }

      const bookings = result.data;
      
      const stats: BookingStats = {
        total: bookings.length,
        pending: bookings.filter(b => b.status === 'pending').length,
        confirmed: bookings.filter(b => b.status === 'confirmed').length,
        cancelled: bookings.filter(b => b.status === 'cancelled').length,
        completed: bookings.filter(b => b.status === 'completed').length,
        totalRevenue: bookings
          .filter(b => b.status === 'confirmed' || b.status === 'completed')
          .reduce((total, booking) => total + booking.price, 0)
      };

      return { success: true, data: stats };
    } catch (err) {
      logError('Failed to get booking stats', err as Error, { component: 'BookingsService', userId });
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Error al obtener estadísticas' 
      };
    }
  }

  /**
   * Deletes a booking
   */
  static async deleteBooking(bookingId: string): Promise<{ success: boolean; error?: string }> {
    try {
      await deleteDoc(doc(db, 'bookings', bookingId));
      
      info('Booking deleted successfully', { component: 'BookingsService', bookingId });
      return { success: true };
    } catch (err) {
      logError('Failed to delete booking', err as Error, { component: 'BookingsService', bookingId });
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Error al eliminar la reserva' 
      };
    }
  }

  /**
   * Gets bookings for a specific card
   */
  static async getBookingsForCard(cardId: string): Promise<{ success: boolean; data?: BookingData[]; error?: string }> {
    try {
      const q = query(
        collection(db, 'bookings'),
        where('cardId', '==', cardId),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const bookings: BookingData[] = [];
      
      querySnapshot.forEach((doc) => {
        bookings.push({ ...doc.data() } as BookingData);
      });
      
      return { success: true, data: bookings };
    } catch (err) {
      logError('Failed to get card bookings', err as Error, { component: 'BookingsService', cardId });
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Error al obtener las reservas' 
      };
    }
  }

  /**
   * Gets bookings for a specific client email
   */
  static async getBookingsForClient(clientEmail: string): Promise<{ success: boolean; data?: BookingData[]; error?: string }> {
    try {
      const q = query(
        collection(db, 'bookings'),
        where('clientEmail', '==', clientEmail),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const bookings: BookingData[] = [];
      
      querySnapshot.forEach((doc) => {
        bookings.push({ ...doc.data() } as BookingData);
      });
      
      return { success: true, data: bookings };
    } catch (err) {
      logError('Failed to get client bookings', err as Error, { component: 'BookingsService', clientEmail });
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Error al obtener las reservas' 
      };
    }
  }

  /**
   * Sends booking confirmation email using email service
   */
  static async sendBookingConfirmation(booking: BookingData): Promise<{ success: boolean; error?: string }> {
    try {
      // Import email service
      const { emailService } = await import('./emailService');
      
      // Send confirmation email
      const result = await emailService.sendBookingConfirmation({
        clientEmail: booking.clientEmail,
        cardOwnerEmail: booking.cardOwnerEmail,
        serviceName: booking.serviceName,
        date: booking.date,
        time: booking.time,
        clientName: booking.clientName,
        duration: booking.duration,
        notes: booking.notes
      });

      info('Booking confirmation email sent', { 
        component: 'BookingsService', 
        success: result.success,
        clientEmail: booking.clientEmail
      });

      return result;
    } catch (err) {
      logError('Failed to send booking confirmation', err as Error, {
        component: 'BookingsService',
        clientEmail: booking.clientEmail,
        serviceName: booking.serviceName
      });
      
      return { 
        success: false, 
        error: 'Error al enviar el email de confirmación' 
      };
    }
  }

  /**
   * Checks for booking conflicts
   */
  static async checkBookingConflicts(cardId: string, date: string, time: string, duration: number): Promise<{ hasConflict: boolean; conflictingBookings?: BookingData[] }> {
    try {
      const q = query(
        collection(db, 'bookings'),
        where('cardId', '==', cardId),
        where('date', '==', date),
        where('status', 'in', ['pending', 'confirmed'])
      );
      
      const querySnapshot = await getDocs(q);
      const existingBookings: BookingData[] = [];
      
      querySnapshot.forEach((doc) => {
        existingBookings.push({ ...doc.data() } as BookingData);
      });

      // Check for time conflicts
      const requestedStartTime = this.timeToMinutes(time);
      const requestedEndTime = requestedStartTime + duration;

      const conflictingBookings = existingBookings.filter(booking => {
        const bookingStartTime = this.timeToMinutes(booking.time);
        const bookingEndTime = bookingStartTime + booking.duration;
        
        return (
          (requestedStartTime >= bookingStartTime && requestedStartTime < bookingEndTime) ||
          (requestedEndTime > bookingStartTime && requestedEndTime <= bookingEndTime) ||
          (requestedStartTime <= bookingStartTime && requestedEndTime >= bookingEndTime)
        );
      });

      return {
        hasConflict: conflictingBookings.length > 0,
        conflictingBookings
      };
    } catch (err) {
      logError('Failed to check booking conflicts', err as Error, { component: 'BookingsService', cardId, date, time, duration });
      return { hasConflict: false };
    }
  }

  /**
   * Converts time string (HH:MM) to minutes since midnight
   */
  private static timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }

  /**
   * Gets available time slots for a specific date
   */
  static async getAvailableTimeSlots(cardId: string, date: string): Promise<{ success: boolean; data?: string[]; error?: string }> {
    try {
      // Default business hours: 9:00 AM - 6:00 PM
      const allSlots: string[] = [];
      for (let hour = 9; hour <= 17; hour++) {
        for (let minutes of [0, 30]) {
          if (hour === 17 && minutes === 30) break;
          const time = `${hour.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
          allSlots.push(time);
        }
      }

      // Get existing bookings for the date
      const q = query(
        collection(db, 'bookings'),
        where('cardId', '==', cardId),
        where('date', '==', date),
        where('status', 'in', ['pending', 'confirmed'])
      );
      
      const querySnapshot = await getDocs(q);
      const bookedSlots = new Set<string>();
      
      querySnapshot.forEach((doc) => {
        const booking = doc.data() as BookingData;
        const startTime = this.timeToMinutes(booking.time);
        const endTime = startTime + booking.duration;
        
        // Mark all 30-minute slots within the booking duration as unavailable
        allSlots.forEach(slot => {
          const slotTime = this.timeToMinutes(slot);
          if (slotTime >= startTime && slotTime < endTime) {
            bookedSlots.add(slot);
          }
        });
      });

      const availableSlots = allSlots.filter(slot => !bookedSlots.has(slot));
      
      return { success: true, data: availableSlots };
    } catch (err) {
      logError('Failed to get available time slots', err as Error, { component: 'BookingsService', cardId, date });
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Error al obtener horarios disponibles' 
      };
    }
  }
}