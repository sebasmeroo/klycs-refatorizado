import { Timestamp } from 'firebase/firestore';

// ===== TIPOS PRINCIPALES =====

export type PaymentFrequency = 'daily' | 'weekly' | 'biweekly' | 'monthly';
export type PaymentMethod = 'cash' | 'transfer' | 'bizum' | 'other';

export interface CalendarUser {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  color: string; // Color asignado para este usuario
  role: 'owner' | 'admin' | 'editor' | 'viewer';
  joinedAt: Date;
  isActive: boolean;
}

export interface SharedCalendar {
  id: string;
  name: string;
  description?: string;
  color: string;
  ownerId: string;
  members: CalendarUser[];
  settings: CalendarSettings;
  createdAt: Date;
  updatedAt: Date;
  isPublic?: boolean;
  linkedEmail?: string; // Email del profesional vinculado a este calendario
  inviteCode?: string;
  inviteExpiresAt?: Date;
  hourlyRate?: number;
  hourlyRateCurrency?: string;
  payoutDetails?: {
    iban?: string;
    bank?: string;
    notes?: string;
    paypalEmail?: string;
    paymentType?: PaymentFrequency;
    paymentDay?: number;
    paymentMethod?: PaymentMethod;
    customHourlyRate?: number;
  };
  payoutRecords?: Record<string, {
    status: 'pending' | 'paid';
    lastPaymentDate?: string;
    lastPaymentBy?: string;
    note?: string;
    paymentMethod?: PaymentMethod;
    amountPaid?: number;
  }>;
}

export interface CustomEventField {
  id: string;
  label: string;
  type: 'text' | 'textarea' | 'url' | 'email' | 'phone' | 'number' | 'select' | 'date';
  placeholder?: string;
  required: boolean;
  options?: string[]; // Para type='select'
  order: number;
  isVisible: boolean;
  icon?: string; // Nombre del icono Lucide
}

export interface CalendarSettings {
  allowMemberInvites: boolean;
  allowEventEditing: boolean;
  allowEventDeleting: boolean;
  requireApproval: boolean;
  defaultEventDuration: number; // en minutos
  workingHours: {
    enabled: boolean;
    start: string; // "09:00"
    end: string;   // "18:00"
    weekdays: number[]; // [1,2,3,4,5] = lun-vie
  };
  notifications: {
    newEvents: boolean;
    eventChanges: boolean;
    reminders: boolean;
    comments: boolean;
  };
  timezone: string;
  customFields?: CustomEventField[]; // Campos personalizados del formulario
  analytics?: {
    enabled: boolean; // Si se calculan horas trabajadas
    trackWorkingHours: boolean; // Si se rastrea el tiempo
    monthlyReports: boolean; // Si se generan reportes mensuales
  };
}

// Analytics de horas trabajadas
export interface WorkHoursStats {
  professionalId: string;
  professionalName: string;
  totalHours: number;
  totalAmount: number;
  currency: string;
  hourlyRate: number;
  monthlyBreakdown: {
    month: string; // "2025-10"
    hours: number;
    events: number;
    amount: number;
  }[];
  yearlyTotal: number;
  averagePerMonth: number;
}

export interface CalendarEvent {
  id: string;
  calendarId: string;
  title: string;
  description?: string;
  startDate: Date;
  endDate?: Date; // Ahora es opcional para eventos de hora única
  isAllDay: boolean;
  location?: string;
  color?: string; // Si no se especifica, usa el del calendario
  
  // Duración y horas trabajadas
  hasEndTime?: boolean; // Si tiene hora de fin o es solo hora de inicio
  duration?: number; // Duración en minutos (calculada)
  
  // Colaboración
  createdBy: string; // userId
  attendees: string[]; // userIds
  comments: EventComment[];
  attachments: EventAttachment[];
  
  // Recurrencia
  recurring?: RecurrencePattern;
  isRecurringInstance?: boolean; // Si es una instancia generada de un evento recurrente
  parentEventId?: string; // ID del evento recurrente padre
  
  // Estado
  status: 'confirmed' | 'tentative' | 'cancelled';
  visibility: 'public' | 'private';

  // Estado del servicio (para seguimiento de trabajo realizado)
  serviceStatus?: 'pending' | 'completed' | 'not_done' | 'in_progress';
  completedAt?: Date; // Fecha cuando se marcó como completado
  completedBy?: string; // userId de quien marcó como completado

  // Cliente externo (opcional) - para tracking de facturación
  externalClientId?: string; // ID del cliente externo
  linkedToClient?: boolean; // Si está vinculado a un cliente externo
  
  // Recordatorios
  reminders: EventReminder[];
  
  // Campos personalizados
  customFieldsData?: Record<string, any>; // Valores de campos personalizados

  // Estado individual de instancias recurrentes
  recurringInstancesStatus?: Record<string, RecurringInstanceStatus>;
  
  // Metadatos
  createdAt: Date;
  updatedAt: Date;
}

export interface RecurringInstanceStatus {
  status: 'completed' | 'not_done' | 'in_progress' | 'pending';
  updatedAt: Date;
  updatedBy?: string;
  completedAt?: Date;
  completedBy?: string;
}

export interface EventComment {
  id: string;
  eventId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  message: string;
  createdAt: Date;
  updatedAt?: Date;
  isEdited?: boolean;
}

export interface EventAttachment {
  id: string;
  name: string;
  type: 'image' | 'document' | 'link' | 'other';
  url: string;
  size?: number;
  uploadedBy: string;
  uploadedAt: Date;
}

export interface RecurrencePattern {
  type: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom' | 'none';
  interval: number; // cada X días/semanas/meses/años
  weekdays?: number[]; // para recurrencia semanal [0=Dom, 1=Lun, 2=Mar, 3=Mié, 4=Jue, 5=Vie, 6=Sáb]
  monthDay?: number; // día del mes para recurrencia mensual
  endDate?: Date; // fecha de fin de la recurrencia
  count?: number; // número de repeticiones (máximo 52 semanas)
  exceptions?: Date[] | Timestamp[]; // ✅ NUEVO: fechas específicas donde NO debe aparecer el evento
}

export interface EventReminder {
  id: string;
  type: 'popup' | 'email' | 'sms';
  minutes: number; // minutos antes del evento
  isEnabled: boolean;
}

// ===== VISTAS Y ESTADO =====

export type CalendarView = 'month' | 'week' | 'day' | 'agenda';

export interface CalendarState {
  currentDate: Date;
  view: CalendarView;
  selectedCalendars: string[]; // IDs de calendarios visibles
  selectedEvent?: CalendarEvent;
  isCreatingEvent: boolean;
  isEditingEvent: boolean;
  draggedEvent?: CalendarEvent;
}

// ===== INVITACIONES =====

export interface CalendarInvitation {
  id: string;
  calendarId: string;
  calendarName: string;
  senderEmail: string;
  senderName: string;
  recipientEmail: string;
  role: 'admin' | 'editor' | 'viewer';
  status: 'pending' | 'accepted' | 'declined';
  inviteCode: string;
  expiresAt: Date;
  createdAt: Date;
}

// ===== NOTIFICACIONES =====

export interface CalendarNotification {
  id: string;
  userId: string;
  type: 'event_created' | 'event_updated' | 'event_deleted' | 'event_reminder' | 'comment_added' | 'calendar_shared';
  title: string;
  message: string;
  eventId?: string;
  calendarId?: string;
  isRead: boolean;
  createdAt: Date;
  actionUrl?: string;
}

// ===== CONFIGURACIÓN DEL USUARIO =====

export interface UserCalendarSettings {
  userId: string;
  defaultView: CalendarView;
  weekStartsOn: number; // 0=domingo, 1=lunes
  timeFormat: '12h' | '24h';
  timezone: string;
  language: 'es' | 'en';
  notifications: {
    email: boolean;
    browser: boolean;
    mobile: boolean;
  };
  theme: 'light' | 'dark' | 'auto';
  updatedAt: Date;
}

// ===== ESTADÍSTICAS =====

export interface CalendarStats {
  totalEvents: number;
  upcomingEvents: number;
  totalCalendars: number;
  sharedCalendars: number;
  eventsThisMonth: number;
  eventsThisWeek: number;
  mostActiveCalendar: string;
  collaborators: number;
}

// ===== DATOS PARA FIRESTORE =====

// Versión serializable para Firestore (con Timestamp en lugar de Date)
export interface CalendarEventFirestore extends Omit<CalendarEvent, 'startDate' | 'endDate' | 'createdAt' | 'updatedAt' | 'completedAt'> {
  startDate: Timestamp;
  endDate: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  completedAt?: Timestamp;
  externalClientId?: string; // Cliente externo vinculado
  linkedToClient?: boolean;
  recurring?: Omit<RecurrencePattern, 'endDate'> & { endDate?: Timestamp };
  recurringInstancesStatus?: Record<string, {
    status: 'completed' | 'not_done' | 'in_progress' | 'pending';
    updatedAt: Timestamp;
    updatedBy?: string;
    completedAt?: Timestamp | null;
    completedBy?: string | null;
  }>;
}

export interface SharedCalendarFirestore extends Omit<SharedCalendar, 'createdAt' | 'updatedAt' | 'inviteExpiresAt' | 'members'> {
  createdAt: Timestamp;
  updatedAt: Timestamp;
  inviteExpiresAt?: Timestamp;
  linkedEmail?: string; // Email del profesional vinculado
  members: Array<Omit<CalendarUser, 'joinedAt'> & { joinedAt: Timestamp }>;
}

// ===== UTILIDADES =====

export interface CalendarHelpers {
  isEventInRange: (event: CalendarEvent, start: Date, end: Date) => boolean;
  getEventsForDay: (events: CalendarEvent[], date: Date) => CalendarEvent[];
  getCalendarColor: (calendarId: string, calendars: SharedCalendar[]) => string;
  canUserEdit: (userId: string, calendar: SharedCalendar) => boolean;
  generateInviteCode: () => string;
}
