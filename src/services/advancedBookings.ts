import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  Timestamp,
  writeBatch,
  onSnapshot,
  setDoc
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { secureLogger } from '@/utils/secureLogger';

export interface AvailabilitySlot {
  id?: string;
  cardId: string;
  dayOfWeek: number; // 0 = domingo, 6 = sábado
  startTime: string; // "09:00"
  endTime: string; // "17:00"
  slotDuration: number; // minutos: 15, 30, 60
  bufferTime: number; // minutos entre citas
  maxConcurrent: number; // máximo de citas simultáneas
  isActive: boolean;
  exceptions?: string[]; // fechas específicas donde no aplica
}

export interface TimeSlot {
  time: string;
  available: boolean;
  conflictReason?: string;
  remainingCapacity: number;
}

export interface BookingConflict {
  type: 'time_overlap' | 'capacity_full' | 'outside_hours' | 'exception_date';
  message: string;
  conflictingBookings?: any[];
}

export interface AdvancedBookingData {
  id?: string;
  cardId: string;
  serviceId: string;
  serviceName: string;
  date: string;
  startTime: string;
  endTime: string;
  duration: number;
  clientName: string;
  clientEmail: string;
  clientPhone?: string;
  notes?: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'no_show';
  price: number;
  reminderSent?: boolean;
  confirmationSent?: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export class AdvancedBookingsService {
  private static availabilityCache = new Map<string, AvailabilitySlot[]>();
  private static bookingsCache = new Map<string, AdvancedBookingData[]>();

  /**
   * Configura la disponibilidad para una tarjeta
   */
  static async setAvailability(cardId: string, availability: Omit<AvailabilitySlot, 'cardId'>[]): Promise<{ success: boolean; error?: string }> {
    try {
      const batch = writeBatch(db);
      
      // Eliminar disponibilidad anterior
      const oldAvailability = await getDocs(
        query(collection(db, 'availability'), where('cardId', '==', cardId))
      );
      
      oldAvailability.docs.forEach(doc => {
        batch.delete(doc.ref);
      });

      // Agregar nueva disponibilidad
      availability.forEach(slot => {
        const newSlotRef = doc(collection(db, 'availability'));
        batch.set(newSlotRef, {
          ...slot,
          cardId,
          id: newSlotRef.id
        });
      });

      await batch.commit();
      
      // Limpiar cache
      this.availabilityCache.delete(cardId);
      
      return { success: true };
    } catch (error) {
      secureLogger.error('Error configurando disponibilidad', error);
      return { success: false, error: 'Error al configurar disponibilidad' };
    }
  }

  /**
   * Obtiene la disponibilidad configurada para una tarjeta
   */
  static async getAvailability(cardId: string): Promise<AvailabilitySlot[]> {
    try {
      // Verificar cache
      if (this.availabilityCache.has(cardId)) {
        return this.availabilityCache.get(cardId)!;
      }

      const q = query(
        collection(db, 'availability'),
        where('cardId', '==', cardId),
        where('isActive', '==', true)
      );

      const snapshot = await getDocs(q);
      const availability: AvailabilitySlot[] = [];
      
      snapshot.forEach(doc => {
        availability.push({ id: doc.id, ...doc.data() } as AvailabilitySlot);
      });

      // Guardar en cache
      this.availabilityCache.set(cardId, availability);
      
      return availability;
    } catch (error) {
      secureLogger.error('Error obteniendo disponibilidad', error);
      return [];
    }
  }

  /**
   * Genera slots de tiempo disponibles para una fecha específica
   */
  static async getAvailableTimeSlots(cardId: string, date: string): Promise<TimeSlot[]> {
    try {
      const availability = await this.getAvailability(cardId);
      const dateObj = new Date(date);
      const dayOfWeek = dateObj.getDay();
      
      // Encontrar configuración para el día de la semana
      const dayConfig = availability.find(slot => slot.dayOfWeek === dayOfWeek);
      
      if (!dayConfig) {
        return []; // No hay disponibilidad para este día
      }

      // Verificar excepciones
      if (dayConfig.exceptions?.includes(date)) {
        return []; // Día marcado como excepción
      }

      // Generar slots de tiempo
      const slots: TimeSlot[] = [];
      const startTime = this.timeToMinutes(dayConfig.startTime);
      const endTime = this.timeToMinutes(dayConfig.endTime);
      const slotDuration = dayConfig.slotDuration;
      const bufferTime = dayConfig.bufferTime;

      for (let minutes = startTime; minutes < endTime; minutes += slotDuration + bufferTime) {
        const timeStr = this.minutesToTime(minutes);
        const endTimeSlot = minutes + slotDuration;
        
        if (endTimeSlot <= endTime) {
          // Verificar disponibilidad para este slot
          const conflict = await this.checkSlotAvailability(
            cardId, 
            date, 
            timeStr, 
            slotDuration,
            dayConfig.maxConcurrent
          );

          slots.push({
            time: timeStr,
            available: !conflict,
            conflictReason: conflict?.message,
            remainingCapacity: conflict ? 0 : dayConfig.maxConcurrent
          });
        }
      }

      return slots;
    } catch (error) {
      secureLogger.error('Error generando slots de tiempo', error);
      return [];
    }
  }

  /**
   * Verifica si un slot específico está disponible
   */
  private static async checkSlotAvailability(
    cardId: string, 
    date: string, 
    time: string, 
    duration: number,
    maxConcurrent: number
  ): Promise<BookingConflict | null> {
    try {
      const startTime = this.timeToMinutes(time);
      const endTime = startTime + duration;

      // Obtener reservas existentes para la fecha
      const q = query(
        collection(db, 'advancedBookings'),
        where('cardId', '==', cardId),
        where('date', '==', date),
        where('status', 'in', ['pending', 'confirmed'])
      );

      const snapshot = await getDocs(q);
      const existingBookings: AdvancedBookingData[] = [];
      
      snapshot.forEach(doc => {
        existingBookings.push({ id: doc.id, ...doc.data() } as AdvancedBookingData);
      });

      // Verificar solapamientos
      const overlappingBookings = existingBookings.filter(booking => {
        const bookingStart = this.timeToMinutes(booking.startTime);
        const bookingEnd = this.timeToMinutes(booking.endTime);
        
        return (
          (startTime >= bookingStart && startTime < bookingEnd) ||
          (endTime > bookingStart && endTime <= bookingEnd) ||
          (startTime <= bookingStart && endTime >= bookingEnd)
        );
      });

      // Verificar capacidad
      if (overlappingBookings.length >= maxConcurrent) {
        return {
          type: 'capacity_full',
          message: 'No hay capacidad disponible en este horario',
          conflictingBookings: overlappingBookings
        };
      }

      return null; // Slot disponible
    } catch (error) {
      secureLogger.error('Error verificando disponibilidad de slot', error);
      return {
        type: 'time_overlap',
        message: 'Error verificando disponibilidad'
      };
    }
  }

  /**
   * Crea una nueva reserva avanzada
   */
  static async createAdvancedBooking(bookingData: Omit<AdvancedBookingData, 'id' | 'createdAt' | 'updatedAt' | 'status'>): Promise<{ success: boolean; id?: string; error?: string }> {
    try {
      // Verificar disponibilidad antes de crear
      const conflict = await this.checkSlotAvailability(
        bookingData.cardId,
        bookingData.date,
        bookingData.startTime,
        bookingData.duration,
        1 // Por ahora asumimos capacidad 1, se puede mejorar
      );

      if (conflict) {
        return {
          success: false,
          error: conflict.message
        };
      }

      const booking: AdvancedBookingData = {
        ...bookingData,
        status: 'pending',
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      };

      const docRef = await addDoc(collection(db, 'advancedBookings'), booking);
      
      // Limpiar cache de reservas
      this.bookingsCache.delete(bookingData.cardId);
      
      return { success: true, id: docRef.id };
    } catch (error) {
      secureLogger.error('Error creando reserva avanzada', error);
      return { success: false, error: 'Error al crear la reserva' };
    }
  }

  /**
   * Obtiene reservas para una tarjeta con filtros avanzados
   */
  static async getBookingsForCard(
    cardId: string, 
    filters?: {
      dateFrom?: string;
      dateTo?: string;
      status?: string[];
      includeCompleted?: boolean;
    }
  ): Promise<AdvancedBookingData[]> {
    try {
      let q = query(
        collection(db, 'advancedBookings'),
        where('cardId', '==', cardId),
        orderBy('date', 'asc')
      );

      const snapshot = await getDocs(q);
      let bookings: AdvancedBookingData[] = [];
      
      snapshot.forEach(doc => {
        bookings.push({ id: doc.id, ...doc.data() } as AdvancedBookingData);
      });

      // Aplicar filtros
      if (filters) {
        if (filters.dateFrom) {
          bookings = bookings.filter(b => b.date >= filters.dateFrom!);
        }
        
        if (filters.dateTo) {
          bookings = bookings.filter(b => b.date <= filters.dateTo!);
        }
        
        if (filters.status && filters.status.length > 0) {
          bookings = bookings.filter(b => filters.status!.includes(b.status));
        }
        
        if (!filters.includeCompleted) {
          bookings = bookings.filter(b => !['completed', 'cancelled'].includes(b.status));
        }
      }

      return bookings;
    } catch (error) {
      secureLogger.error('Error obteniendo reservas para tarjeta', error);
      return [];
    }
  }

  /**
   * Actualiza el estado de una reserva
   */
  static async updateBookingStatus(bookingId: string, status: AdvancedBookingData['status']): Promise<{ success: boolean; error?: string }> {
    try {
      const bookingRef = doc(db, 'advancedBookings', bookingId);
      await updateDoc(bookingRef, {
        status,
        updatedAt: Timestamp.now()
      });

      return { success: true };
    } catch (error) {
      secureLogger.error('Error actualizando estado de reserva', error);
      return { success: false, error: 'Error al actualizar estado' };
    }
  }

  /**
   * Convierte tiempo en formato HH:MM a minutos
   */
  private static timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }

  /**
   * Convierte minutos a formato HH:MM
   */
  private static minutesToTime(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  }

  /**
   * Obtiene métricas y analytics de reservas
   */
  static async getBookingAnalytics(cardId: string, dateFrom: string, dateTo: string): Promise<{
    totalBookings: number;
    confirmedBookings: number;
    revenue: number;
    noShowRate: number;
    popularTimeSlots: { time: string; count: number }[];
    busyDays: { date: string; count: number }[];
  }> {
    try {
      const bookings = await this.getBookingsForCard(cardId, {
        dateFrom,
        dateTo,
        includeCompleted: true
      });

      const analytics = {
        totalBookings: bookings.length,
        confirmedBookings: bookings.filter(b => ['confirmed', 'completed'].includes(b.status)).length,
        revenue: bookings
          .filter(b => ['confirmed', 'completed'].includes(b.status))
          .reduce((total, b) => total + b.price, 0),
        noShowRate: bookings.filter(b => b.status === 'no_show').length / bookings.length * 100,
        popularTimeSlots: this.calculatePopularTimeSlots(bookings),
        busyDays: this.calculateBusyDays(bookings)
      };

      return analytics;
    } catch (error) {
      secureLogger.error('Error obteniendo analytics de reservas', error);
      return {
        totalBookings: 0,
        confirmedBookings: 0,
        revenue: 0,
        noShowRate: 0,
        popularTimeSlots: [],
        busyDays: []
      };
    }
  }

  private static calculatePopularTimeSlots(bookings: AdvancedBookingData[]): { time: string; count: number }[] {
    const timeSlotCounts = new Map<string, number>();
    
    bookings.forEach(booking => {
      const hour = booking.startTime.split(':')[0] + ':00';
      timeSlotCounts.set(hour, (timeSlotCounts.get(hour) || 0) + 1);
    });

    return Array.from(timeSlotCounts.entries())
      .map(([time, count]) => ({ time, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }

  private static calculateBusyDays(bookings: AdvancedBookingData[]): { date: string; count: number }[] {
    const dayCounts = new Map<string, number>();
    
    bookings.forEach(booking => {
      dayCounts.set(booking.date, (dayCounts.get(booking.date) || 0) + 1);
    });

    return Array.from(dayCounts.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }

  /**
   * Configura disponibilidad por defecto para una nueva tarjeta
   */
  static async setupDefaultAvailability(cardId: string): Promise<{ success: boolean; error?: string }> {
    const defaultAvailability: Omit<AvailabilitySlot, 'cardId'>[] = [
      // Lunes a Viernes
      ...Array.from({ length: 5 }, (_, i) => ({
        dayOfWeek: i + 1, // 1 = lunes
        startTime: '09:00',
        endTime: '17:00',
        slotDuration: 30,
        bufferTime: 15,
        maxConcurrent: 1,
        isActive: true,
        exceptions: []
      }))
    ];

    return await this.setAvailability(cardId, defaultAvailability);
  }
}