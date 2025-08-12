import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  Timestamp,
  orderBy 
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { AdvancedBookingData, AdvancedBookingsService } from './advancedBookings';
import { secureLogger } from '@/utils/secureLogger';

export interface ValidationResult {
  isValid: boolean;
  conflicts: BookingConflict[];
  warnings: BookingWarning[];
  suggestions: BookingSuggestion[];
}

export interface BookingConflict {
  type: 'time_overlap' | 'capacity_exceeded' | 'availability_mismatch' | 'duplicate_booking';
  severity: 'critical' | 'warning' | 'info';
  message: string;
  conflictingBooking?: AdvancedBookingData;
  suggestedAlternatives?: string[];
}

export interface BookingWarning {
  type: 'close_to_deadline' | 'busy_period' | 'first_time_client' | 'note_required';
  message: string;
  recommendation?: string;
}

export interface BookingSuggestion {
  type: 'alternative_time' | 'different_service' | 'combine_services' | 'reschedule';
  message: string;
  actionData?: any;
}

export interface RealTimeValidationConfig {
  cardId: string;
  enableRealTimeChecks: boolean;
  validationRules: {
    allowOverlapping: boolean;
    requireBufferTime: boolean;
    bufferTimeMinutes: number;
    maxBookingsPerDay: number;
    maxBookingsPerSlot: number;
    preventLastMinuteBookings: boolean;
    lastMinuteThresholdHours: number;
  };
  notifications: {
    onConflict: boolean;
    onWarning: boolean;
    onSuggestion: boolean;
  };
}

export class BookingValidationService {
  private static activeListeners = new Map<string, () => void>();
  private static validationConfigs = new Map<string, RealTimeValidationConfig>();

  /**
   * Configura validación en tiempo real para una tarjeta
   */
  static setupRealTimeValidation(config: RealTimeValidationConfig): () => void {
    const { cardId } = config;
    
    // Guardar configuración
    this.validationConfigs.set(cardId, config);
    
    // Limpiar listener anterior si existe
    if (this.activeListeners.has(cardId)) {
      this.activeListeners.get(cardId)!();
    }

    if (!config.enableRealTimeChecks) {
      return () => {};
    }

    // Crear listener para cambios en reservas
    const q = query(
      collection(db, 'advancedBookings'),
      where('cardId', '==', cardId),
      where('status', 'in', ['pending', 'confirmed']),
      orderBy('date', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added' || change.type === 'modified') {
          const booking = { id: change.doc.id, ...change.doc.data() } as AdvancedBookingData;
          this.validateBookingRealTime(booking, config);
        }
      });
    });

    this.activeListeners.set(cardId, unsubscribe);
    return unsubscribe;
  }

  /**
   * Valida una reserva antes de confirmarla
   */
  static async validateBooking(
    bookingData: Omit<AdvancedBookingData, 'id' | 'createdAt' | 'updatedAt' | 'status'>,
    config?: RealTimeValidationConfig
  ): Promise<ValidationResult> {
    try {
      const validationConfig = config || this.validationConfigs.get(bookingData.cardId);
      
      if (!validationConfig) {
        return {
          isValid: true,
          conflicts: [],
          warnings: [],
          suggestions: []
        };
      }

      const conflicts = await this.checkConflicts(bookingData, validationConfig);
      const warnings = await this.checkWarnings(bookingData, validationConfig);
      const suggestions = await this.generateSuggestions(bookingData, validationConfig);

      const isValid = conflicts.filter(c => c.severity === 'critical').length === 0;

      return {
        isValid,
        conflicts,
        warnings,
        suggestions
      };
    } catch (error) {
      secureLogger.error('Error validando reserva', error);
      return {
        isValid: false,
        conflicts: [{
          type: 'availability_mismatch',
          severity: 'critical',
          message: 'Error al validar la reserva. Inténtalo de nuevo.'
        }],
        warnings: [],
        suggestions: []
      };
    }
  }

  /**
   * Validación en tiempo real cuando se detectan cambios
   */
  private static async validateBookingRealTime(
    booking: AdvancedBookingData,
    config: RealTimeValidationConfig
  ): Promise<void> {
    try {
      const validation = await this.validateBooking(booking, config);
      
      if (!validation.isValid && config.notifications.onConflict) {
        await this.notifyConflict(booking, validation.conflicts);
      }
      
      if (validation.warnings.length > 0 && config.notifications.onWarning) {
        await this.notifyWarnings(booking, validation.warnings);
      }
      
      if (validation.suggestions.length > 0 && config.notifications.onSuggestion) {
        await this.notifySuggestions(booking, validation.suggestions);
      }
    } catch (error) {
      secureLogger.error('Error en validación en tiempo real', error);
    }
  }

  /**
   * Verifica conflictos en la reserva
   */
  private static async checkConflicts(
    bookingData: Omit<AdvancedBookingData, 'id' | 'createdAt' | 'updatedAt' | 'status'>,
    config: RealTimeValidationConfig
  ): Promise<BookingConflict[]> {
    const conflicts: BookingConflict[] = [];

    // Obtener reservas existentes para la fecha
    const existingBookings = await AdvancedBookingsService.getBookingsForCard(
      bookingData.cardId,
      {
        dateFrom: bookingData.date,
        dateTo: bookingData.date,
        status: ['pending', 'confirmed']
      }
    );

    // Verificar solapamientos de tiempo
    const timeConflicts = this.checkTimeOverlaps(bookingData, existingBookings, config);
    conflicts.push(...timeConflicts);

    // Verificar capacidad máxima
    const capacityConflicts = this.checkCapacityLimits(bookingData, existingBookings, config);
    conflicts.push(...capacityConflicts);

    // Verificar duplicados
    const duplicateConflicts = this.checkDuplicateBookings(bookingData, existingBookings);
    conflicts.push(...duplicateConflicts);

    // Verificar disponibilidad configurada
    const availabilityConflicts = await this.checkAvailabilityMatch(bookingData, config);
    conflicts.push(...availabilityConflicts);

    return conflicts;
  }

  /**
   * Verifica solapamientos de tiempo
   */
  private static checkTimeOverlaps(
    bookingData: Omit<AdvancedBookingData, 'id' | 'createdAt' | 'updatedAt' | 'status'>,
    existingBookings: AdvancedBookingData[],
    config: RealTimeValidationConfig
  ): BookingConflict[] {
    const conflicts: BookingConflict[] = [];
    
    if (config.validationRules.allowOverlapping) {
      return conflicts;
    }

    const newStart = this.timeToMinutes(bookingData.startTime);
    const newEnd = this.timeToMinutes(bookingData.endTime);
    const bufferTime = config.validationRules.requireBufferTime ? 
      config.validationRules.bufferTimeMinutes : 0;

    existingBookings.forEach(existing => {
      const existingStart = this.timeToMinutes(existing.startTime);
      const existingEnd = this.timeToMinutes(existing.endTime);

      // Verificar solapamiento considerando buffer
      const hasOverlap = (
        (newStart >= existingStart - bufferTime && newStart < existingEnd + bufferTime) ||
        (newEnd > existingStart - bufferTime && newEnd <= existingEnd + bufferTime) ||
        (newStart <= existingStart && newEnd >= existingEnd)
      );

      if (hasOverlap) {
        conflicts.push({
          type: 'time_overlap',
          severity: 'critical',
          message: `Conflicto de horario con otra reserva de ${existing.clientName}`,
          conflictingBooking: existing,
          suggestedAlternatives: this.generateTimeAlternatives(bookingData, existingBookings)
        });
      }
    });

    return conflicts;
  }

  /**
   * Verifica límites de capacidad
   */
  private static checkCapacityLimits(
    bookingData: Omit<AdvancedBookingData, 'id' | 'createdAt' | 'updatedAt' | 'status'>,
    existingBookings: AdvancedBookingData[],
    config: RealTimeValidationConfig
  ): BookingConflict[] {
    const conflicts: BookingConflict[] = [];

    // Verificar límite diario
    if (existingBookings.length >= config.validationRules.maxBookingsPerDay) {
      conflicts.push({
        type: 'capacity_exceeded',
        severity: 'critical',
        message: `Se ha alcanzado el límite máximo de ${config.validationRules.maxBookingsPerDay} reservas por día`
      });
    }

    // Verificar límite por slot
    const newStart = this.timeToMinutes(bookingData.startTime);
    const newEnd = this.timeToMinutes(bookingData.endTime);
    
    const overlappingBookings = existingBookings.filter(booking => {
      const bookingStart = this.timeToMinutes(booking.startTime);
      const bookingEnd = this.timeToMinutes(booking.endTime);
      
      return (
        (newStart >= bookingStart && newStart < bookingEnd) ||
        (newEnd > bookingStart && newEnd <= bookingEnd) ||
        (newStart <= bookingStart && newEnd >= bookingEnd)
      );
    });

    if (overlappingBookings.length >= config.validationRules.maxBookingsPerSlot) {
      conflicts.push({
        type: 'capacity_exceeded',
        severity: 'critical',
        message: `Capacidad máxima alcanzada para este horario (${config.validationRules.maxBookingsPerSlot} reservas simultáneas)`
      });
    }

    return conflicts;
  }

  /**
   * Verifica reservas duplicadas
   */
  private static checkDuplicateBookings(
    bookingData: Omit<AdvancedBookingData, 'id' | 'createdAt' | 'updatedAt' | 'status'>,
    existingBookings: AdvancedBookingData[]
  ): BookingConflict[] {
    const conflicts: BookingConflict[] = [];

    const duplicate = existingBookings.find(booking => 
      booking.clientEmail === bookingData.clientEmail &&
      booking.date === bookingData.date &&
      booking.startTime === bookingData.startTime
    );

    if (duplicate) {
      conflicts.push({
        type: 'duplicate_booking',
        severity: 'critical',
        message: 'Ya existe una reserva para este cliente en la misma fecha y hora',
        conflictingBooking: duplicate
      });
    }

    return conflicts;
  }

  /**
   * Verifica coincidencia con disponibilidad configurada
   */
  private static async checkAvailabilityMatch(
    bookingData: Omit<AdvancedBookingData, 'id' | 'createdAt' | 'updatedAt' | 'status'>,
    config: RealTimeValidationConfig
  ): Promise<BookingConflict[]> {
    const conflicts: BookingConflict[] = [];

    try {
      const timeSlots = await AdvancedBookingsService.getAvailableTimeSlots(
        bookingData.cardId,
        bookingData.date
      );

      const requestedSlot = timeSlots.find(slot => slot.time === bookingData.startTime);

      if (!requestedSlot || !requestedSlot.available) {
        conflicts.push({
          type: 'availability_mismatch',
          severity: 'critical',
          message: 'El horario solicitado no está disponible según la configuración'
        });
      }
    } catch (error) {
      secureLogger.error('Error verificando disponibilidad', error);
    }

    return conflicts;
  }

  /**
   * Genera advertencias para la reserva
   */
  private static async checkWarnings(
    bookingData: Omit<AdvancedBookingData, 'id' | 'createdAt' | 'updatedAt' | 'status'>,
    config: RealTimeValidationConfig
  ): Promise<BookingWarning[]> {
    const warnings: BookingWarning[] = [];

    // Verificar reserva de último minuto
    if (config.validationRules.preventLastMinuteBookings) {
      const bookingDate = new Date(`${bookingData.date}T${bookingData.startTime}`);
      const now = new Date();
      const hoursDifference = (bookingDate.getTime() - now.getTime()) / (1000 * 60 * 60);

      if (hoursDifference < config.validationRules.lastMinuteThresholdHours) {
        warnings.push({
          type: 'close_to_deadline',
          message: `Reserva muy próxima (menos de ${config.validationRules.lastMinuteThresholdHours} horas)`,
          recommendation: 'Confirma la disponibilidad manualmente'
        });
      }
    }

    // Verificar período ocupado
    const existingBookings = await AdvancedBookingsService.getBookingsForCard(
      bookingData.cardId,
      {
        dateFrom: bookingData.date,
        dateTo: bookingData.date,
        status: ['pending', 'confirmed']
      }
    );

    if (existingBookings.length >= config.validationRules.maxBookingsPerDay * 0.8) {
      warnings.push({
        type: 'busy_period',
        message: 'Día con alta demanda de reservas',
        recommendation: 'Considera sugerir días alternativos al cliente'
      });
    }

    // Verificar cliente nuevo
    const clientBookings = await AdvancedBookingsService.getBookingsForCard(
      bookingData.cardId,
      { includeCompleted: true }
    );

    const isFirstTimeClient = !clientBookings.some(booking => 
      booking.clientEmail === bookingData.clientEmail
    );

    if (isFirstTimeClient) {
      warnings.push({
        type: 'first_time_client',
        message: 'Cliente nuevo - primera reserva',
        recommendation: 'Envía información adicional sobre el servicio'
      });
    }

    return warnings;
  }

  /**
   * Genera sugerencias para mejorar la reserva
   */
  private static async generateSuggestions(
    bookingData: Omit<AdvancedBookingData, 'id' | 'createdAt' | 'updatedAt' | 'status'>,
    config: RealTimeValidationConfig
  ): Promise<BookingSuggestion[]> {
    const suggestions: BookingSuggestion[] = [];

    // Sugerir horarios alternativos
    const timeSlots = await AdvancedBookingsService.getAvailableTimeSlots(
      bookingData.cardId,
      bookingData.date
    );

    const availableSlots = timeSlots.filter(slot => slot.available);
    
    if (availableSlots.length > 1) {
      suggestions.push({
        type: 'alternative_time',
        message: `Hay ${availableSlots.length - 1} horarios alternativos disponibles`,
        actionData: { alternativeSlots: availableSlots.slice(0, 3) }
      });
    }

    return suggestions;
  }

  /**
   * Utilidades para notificaciones
   */
  private static async notifyConflict(booking: AdvancedBookingData, conflicts: BookingConflict[]): Promise<void> {
    secureLogger.info('Conflicto detectado en reserva', { bookingId: booking.id, conflicts });
    // Aquí se implementaría el sistema de notificaciones
  }

  private static async notifyWarnings(booking: AdvancedBookingData, warnings: BookingWarning[]): Promise<void> {
    secureLogger.info('Advertencias en reserva', { bookingId: booking.id, warnings });
  }

  private static async notifySuggestions(booking: AdvancedBookingData, suggestions: BookingSuggestion[]): Promise<void> {
    secureLogger.info('Sugerencias para reserva', { bookingId: booking.id, suggestions });
  }

  /**
   * Genera alternativas de horario
   */
  private static generateTimeAlternatives(
    bookingData: Omit<AdvancedBookingData, 'id' | 'createdAt' | 'updatedAt' | 'status'>,
    existingBookings: AdvancedBookingData[]
  ): string[] {
    const alternatives: string[] = [];
    const duration = bookingData.duration;
    
    // Buscar huecos disponibles
    for (let hour = 9; hour <= 17; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const timeStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        const startMinutes = this.timeToMinutes(timeStr);
        const endMinutes = startMinutes + duration;
        
        const hasConflict = existingBookings.some(booking => {
          const bookingStart = this.timeToMinutes(booking.startTime);
          const bookingEnd = this.timeToMinutes(booking.endTime);
          
          return (
            (startMinutes >= bookingStart && startMinutes < bookingEnd) ||
            (endMinutes > bookingStart && endMinutes <= bookingEnd) ||
            (startMinutes <= bookingStart && endMinutes >= bookingEnd)
          );
        });
        
        if (!hasConflict && alternatives.length < 3) {
          alternatives.push(timeStr);
        }
      }
    }
    
    return alternatives;
  }

  /**
   * Convierte tiempo HH:MM a minutos
   */
  private static timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }

  /**
   * Limpia listeners activos
   */
  static cleanup(cardId?: string): void {
    if (cardId) {
      const unsubscribe = this.activeListeners.get(cardId);
      if (unsubscribe) {
        unsubscribe();
        this.activeListeners.delete(cardId);
        this.validationConfigs.delete(cardId);
      }
    } else {
      // Limpiar todos los listeners
      this.activeListeners.forEach(unsubscribe => unsubscribe());
      this.activeListeners.clear();
      this.validationConfigs.clear();
    }
  }

  /**
   * Obtiene configuración por defecto
   */
  static getDefaultValidationConfig(cardId: string): RealTimeValidationConfig {
    return {
      cardId,
      enableRealTimeChecks: true,
      validationRules: {
        allowOverlapping: false,
        requireBufferTime: true,
        bufferTimeMinutes: 15,
        maxBookingsPerDay: 20,
        maxBookingsPerSlot: 1,
        preventLastMinuteBookings: true,
        lastMinuteThresholdHours: 2
      },
      notifications: {
        onConflict: true,
        onWarning: true,
        onSuggestion: false
      }
    };
  }
}