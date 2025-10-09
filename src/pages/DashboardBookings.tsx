import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  Calendar as CalendarIcon,
  Plus,
  ChevronLeft,
  ChevronRight,
  Settings,
  Users,
  MessageCircle,
  Share2,
  Filter,
  Search,
  MoreVertical,
  Clock,
  MapPin,
  UserPlus,
  X,
  Check,
  Send,
  Paperclip,
  Eye,
  EyeOff,
  Palette,
  Bell,
  BellOff,
  Copy,
  ExternalLink,
  Crown,
  Shield,
  CheckCircle,
  XCircle,
  Edit3,
  Trash2,
  Repeat,
  Upload,
  Camera,
  User,
  CheckCircle2,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import {
  SharedCalendar,
  CalendarEvent,
  EventComment,
  CalendarStats,
  CalendarState,
  CalendarView,
  CalendarUser
} from '@/types/calendar';
import {
  CollaborativeCalendarService,
  CalendarEventService,
  EventCommentService,
  CalendarStatsService
} from '@/services/collaborativeCalendar';
import { CustomFieldsEditor } from '@/components/calendar/CustomFieldsEditor';
import { RecurrenceSelector } from '@/components/calendar/RecurrenceSelector';
import { createDemoCalendarData, getDemoStats } from '@/utils/calendarDemoData';
import { authService } from '@/services/auth';
import { ProfessionalService } from '@/services/professionalService';
import { RecurrencePattern, CustomEventField } from '@/types/calendar';
import { doc, updateDoc, Timestamp, serverTimestamp } from 'firebase/firestore';
import { db, storage } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { ImageCompressionService } from '@/services/imageCompression';
import { useUserCalendars, useMultipleCalendarEvents, useCreateEvent, useUpdateEvent, useDeleteEvent } from '@/hooks/useCalendar';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/store/authStore';

const GENERAL_CALENDAR_ID = 'general-calendar';
const PROFESSIONAL_COLOR_PALETTE = [
  '#2563EB',
  '#10B981',
  '#F59E0B',
  '#EF4444',
  '#8B5CF6',
  '#0EA5E9',
  '#14B8A6',
  '#EC4899',
  '#F97316',
  '#6366F1'
];

const sortEventsByStartDate = (events: CalendarEvent[]): CalendarEvent[] =>
  [...events].sort((a, b) => a.startDate.getTime() - b.startDate.getTime());

const LocationMapPreview: React.FC<{ query?: string; className?: string }> = ({ query, className }) => {
  if (!query || !query.trim()) {
    return null;
  }

  const mapSrc = `https://www.google.com/maps?q=${encodeURIComponent(query)}&output=embed`;

  return (
    <div className={className}>
      <div className="text-xs text-gray-500 mb-2 flex items-center gap-1">
        <MapPin className="w-3 h-3" />
        Vista previa de la ubicación
      </div>
      <div className="rounded-xl overflow-hidden border border-gray-200 shadow-sm">
        <iframe
          title={`Mapa de ${query}`}
          src={mapSrc}
          loading="lazy"
          allowFullScreen
          className="w-full h-48"
          referrerPolicy="no-referrer-when-downgrade"
        />
      </div>
    </div>
  );
};

const slugify = (value: string) =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email) && email.includes('.') && email.length > 5;
};

// ===== TIPOS AUXILIARES =====

interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  events: CalendarEvent[];
  dayNumber: number;
}

// ===== COMPONENTE PRINCIPAL =====

const DashboardBookings: React.FC = () => {
  const { user } = useAuth();
  const setAuthUser = useAuthStore(state => state.setUser);
  const queryClient = useQueryClient();

  const addEventToCaches = useCallback((event: CalendarEvent) => {
    if (event.recurring && event.recurring.type !== 'none') {
      return;
    }

    queryClient.setQueryData<CalendarEvent[]>(['calendarEvents', event.calendarId], (old) => {
      const base = Array.isArray(old) ? old : [];
      const filtered = base.filter(existing => existing.id !== event.id);
      filtered.push(event);
      return sortEventsByStartDate(filtered);
    });

    queryClient.setQueriesData<CalendarEvent[]>({ queryKey: ['multipleCalendarEvents'] }, (old) => {
      if (!Array.isArray(old)) return old;
      const filtered = old.filter(existing => existing.id !== event.id);
      filtered.push(event);
      return sortEventsByStartDate(filtered);
    });
  }, [queryClient]);

  const removeEventFromCaches = useCallback((eventId: string, calendarId?: string) => {
    if (calendarId) {
      queryClient.setQueryData<CalendarEvent[]>(['calendarEvents', calendarId], (old) => {
        if (!Array.isArray(old)) return old;
        return old.filter(evt => evt.id !== eventId && evt.parentEventId !== eventId);
      });
    }

    queryClient.setQueriesData<CalendarEvent[]>({ queryKey: ['multipleCalendarEvents'] }, (old) => {
      if (!Array.isArray(old)) return old;
      return old.filter(evt => evt.id !== eventId && evt.parentEventId !== eventId);
    });
  }, [queryClient]);

  const updateEventInCaches = useCallback((updatedEvent: CalendarEvent, previousCalendarId: string) => {
    removeEventFromCaches(updatedEvent.id, previousCalendarId);
    addEventToCaches(updatedEvent);
  }, [addEventToCaches, removeEventFromCaches]);

  const [calendarState, setCalendarState] = useState<CalendarState>({
    currentDate: new Date(),
    view: 'month',
    selectedCalendars: [GENERAL_CALENDAR_ID],
    isCreatingEvent: false,
    isEditingEvent: false
  });

  // ===== REACT QUERY HOOKS =====
  const { data: calendarsData, isLoading: calendarsLoading } = useUserCalendars(user?.uid);
  const calendarIds = useMemo(() => {
    const ids = calendarsData?.map(cal => cal.id) ?? [];
    if (calendarState.selectedCalendars.length === 0 || calendarState.selectedCalendars.includes(GENERAL_CALENDAR_ID)) {
      return ids;
    }
    return calendarState.selectedCalendars;
  }, [calendarsData, calendarState.selectedCalendars]);

  const visibleRange = useMemo(() => {
    const current = calendarState.currentDate;
    const rangeStart = new Date(current.getFullYear(), current.getMonth(), 1);
    rangeStart.setMonth(rangeStart.getMonth() - 1);
    rangeStart.setDate(1);
    rangeStart.setHours(0, 0, 0, 0);

    const rangeEnd = new Date(current.getFullYear(), current.getMonth(), 1);
    rangeEnd.setMonth(rangeEnd.getMonth() + 2);
    rangeEnd.setDate(0);
    rangeEnd.setHours(23, 59, 59, 999);

    return {
      startDate: rangeStart,
      endDate: rangeEnd
    };
  }, [calendarState.currentDate]);

  const { data: eventsData, isLoading: eventsLoading } = useMultipleCalendarEvents(
    calendarIds.length > 0 ? calendarIds : undefined,
    visibleRange
  );
  const createEventMutation = useCreateEvent();
  const updateEventMutation = useUpdateEvent();
  const deleteEventMutation = useDeleteEvent();

  // ===== ESTADO =====
  const calendars = calendarsData || [];
    const events = eventsData || [];
    const [stats, setStats] = useState<CalendarStats | null>(null);
    const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [eventComments, setEventComments] = useState<EventComment[]>([]);
  const [calendarUsers, setCalendarUsers] = useState<CalendarUser[]>([]);
  const [showAddProfessional, setShowAddProfessional] = useState(false);
  const [newProfessionalName, setNewProfessionalName] = useState('');
  const [newProfessionalEmail, setNewProfessionalEmail] = useState('');
  const [newProfessionalColor, setNewProfessionalColor] = useState(PROFESSIONAL_COLOR_PALETTE[0]);
  const [newProfessionalHourlyRate, setNewProfessionalHourlyRate] = useState('');
  const [newProfessionalCurrency, setNewProfessionalCurrency] = useState('EUR');
  const [nextColorIndex, setNextColorIndex] = useState(0);
  const [isCreatingProfessional, setIsCreatingProfessional] = useState(false);
  const professionalNameInputRef = useRef<HTMLInputElement | null>(null);
  const professionalEmailInputRef = useRef<HTMLInputElement | null>(null);
  const eventTitleInputRef = useRef<HTMLInputElement | null>(null);
  
  // UI State
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showFormEditor, setShowFormEditor] = useState(false);
  const [showCreateEvent, setShowCreateEvent] = useState(false);
  const [hoveredEvent, setHoveredEvent] = useState<{ event: CalendarEvent; position: { x: number; y: number } } | null>(null);
  const tooltipTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [newComment, setNewComment] = useState('');
  
  // Estados para crear eventos
  const [selectedProfessional, setSelectedProfessional] = useState<SharedCalendar | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [rightSidebarOpen, setRightSidebarOpen] = useState(false);
  const [creatingEvent, setCreatingEvent] = useState(false);
  const [newEventForm, setNewEventForm] = useState({
    title: '',
    description: '',
    startTime: '09:00',
    endTime: '10:00',
    location: '',
    hasEndTime: true // Toggle para hora única vs rango
  });
  const [recurrence, setRecurrence] = useState<RecurrencePattern | null>(null);
  const [customFieldsData, setCustomFieldsData] = useState<Record<string, any>>({});
  const [showEditRecurrence, setShowEditRecurrence] = useState(false);
  const [editRecurrence, setEditRecurrence] = useState<RecurrencePattern | null>(null);

  const sanitizeRecurrence = useCallback((pattern: RecurrencePattern | null | undefined): RecurrencePattern | null => {
    if (!pattern || pattern.type === 'none') {
      return null;
    }

    const sanitized: RecurrencePattern = {
      type: pattern.type,
      interval: pattern.interval ?? 1
    };

    if (pattern.weekdays && pattern.weekdays.length > 0) {
      sanitized.weekdays = [...pattern.weekdays].sort((a, b) => a - b);
    } else {
      sanitized.weekdays = [];
    }

    if (typeof pattern.monthDay === 'number') {
      sanitized.monthDay = pattern.monthDay;
    }

    if (pattern.endDate instanceof Date) {
      sanitized.endDate = new Date(pattern.endDate.getTime());
    }

    if (pattern.exceptions && pattern.exceptions.length > 0) {
      const mappedExceptions = pattern.exceptions
        .map(exception => {
          if (!exception) return null;
          if (exception instanceof Date) {
            return new Date(exception.getTime());
          }
          if (typeof (exception as any).toDate === 'function') {
            const converted = (exception as any).toDate();
            return converted instanceof Date ? converted : null;
          }
          return null;
        })
        .filter((value): value is Date => value instanceof Date);

      if (mappedExceptions.length > 0) {
        sanitized.exceptions = mappedExceptions;
      }
    }

    return sanitized;
  }, []);
  const [showCalendarSettings, setShowCalendarSettings] = useState(false);
  const [globalCustomFields, setGlobalCustomFields] = useState<CustomEventField[]>([]);
  
  // Estados para editar eventos
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [showEditEventPanel, setShowEditEventPanel] = useState(false);
  const [editEventForm, setEditEventForm] = useState({
    title: '',
    description: '',
    date: '',
    startTime: '09:00',
    endTime: '10:00',
    location: '',
    hasEndTime: true,
    calendarId: ''
  });
  
  // Estados para ver todos los eventos de un día
  const [dayEventsView, setDayEventsView] = useState<{date: Date; events: CalendarEvent[]} | null>(null);
  const [showDayEventsPanel, setShowDayEventsPanel] = useState(false);
  const [updatingServiceStatus, setUpdatingServiceStatus] = useState<string | null>(null);

  // Estados para modal de información del evento
  const [showEventInfoModal, setShowEventInfoModal] = useState(false);
  const [selectedEventInfo, setSelectedEventInfo] = useState<CalendarEvent | null>(null);
  const [showDeleteOptions, setShowDeleteOptions] = useState(false);
  const [showDuplicateOptions, setShowDuplicateOptions] = useState(false);
  const [duplicateForm, setDuplicateForm] = useState({
    date: ''
  });
  const [duplicatingEvent, setDuplicatingEvent] = useState(false);

  useEffect(() => {
    if (!showEventInfoModal) {
      setShowDeleteOptions(false);
      setShowDuplicateOptions(false);
    }
  }, [showEventInfoModal]);

  // Estados para editar nombre del equipo
  const [isEditingTeamName, setIsEditingTeamName] = useState(false);
  const [editingTeamName, setEditingTeamName] = useState('');
  const [isUpdatingTeamName, setIsUpdatingTeamName] = useState(false);

  // Estados para menú contextual de profesionales
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [editingProfessional, setEditingProfessional] = useState<any | null>(null);
  const [showEditProfessionalModal, setShowEditProfessionalModal] = useState(false);
  const [editProfessionalForm, setEditProfessionalForm] = useState({
    name: '',
    role: '',
    color: '',
    hourlyRate: '',
    hourlyRateCurrency: 'EUR'
  });
  const [professionalAvatar, setProfessionalAvatar] = useState<string | null>(null);
  const [professionalAvatarFile, setProfessionalAvatarFile] = useState<File | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // ===== EFECTOS =====

  // ✅ Procesar datos cuando cambien (React Query maneja la carga y cache)
  useEffect(() => {
    if (!calendars || calendars.length === 0) return;

    // Configurar custom fields desde el primer calendario (solo si cambió)
    if (calendars[0]?.settings?.customFields) {
      setGlobalCustomFields(calendars[0].settings.customFields);
    }

    setNextColorIndex(calendars.length);
  }, [calendars]); // ✅ Solo cuando calendars cambia

  // ✅ Calcular estadísticas (solo cuando events cambia)
  useEffect(() => {
    setStats({
      totalEvents: events.length,
      totalCalendars: calendars.length,
      sharedCalendars: calendars.length,
      collaborators: 1,
      upcomingEvents: 0,
      eventsThisMonth: 0,
      eventsThisWeek: 0,
      mostActiveCalendar: 'Calendario General'
    });
  }, [events.length, calendars.length]);

  // ✅ Inicializar vista solo una vez
  useEffect(() => {
    if (calendars.length > 0) {
      setCalendarState(prev => ({
        ...prev,
        selectedCalendars: prev.selectedCalendars.length === 0
          ? [GENERAL_CALENDAR_ID]
          : prev.selectedCalendars
      }));
    }
  }, [calendars.length]); // ✅ Solo cuando cambia la cantidad de calendars

  // Cerrar menú contextual cuando se hace clic fuera
  useEffect(() => {
    const handleClickOutside = () => {
      setOpenMenuId(null);
    };

    if (openMenuId) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [openMenuId]);

  useEffect(() => {
    if (calendarState.selectedCalendars.length === 0) return;
    
    // MODO DEMO: Los eventos ya están cargados
    // TODO: Cargar eventos reales de Firebase
  }, [calendarState.selectedCalendars, calendarState.currentDate]);

  useEffect(() => {
    if (!selectedEvent) {
      setEventComments([]);
      return;
    }
    
    // MODO DEMO: Cargar comentarios de ejemplo
    const demoData = createDemoCalendarData(
      user?.uid || '', 
      user?.displayName || 'Usuario', 
      user?.email || 'usuario@example.com'
    );
    
    const eventComments = demoData.comments.filter(comment => 
      comment.eventId === selectedEvent.id
    );
    setEventComments(eventComments);
  }, [selectedEvent?.id, user]);


  // ===== HANDLERS MEMOIZADOS (para evitar re-renders que causen pérdida de focus) =====
  
  const handleProfessionalNameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setNewProfessionalName(e.target.value);
  }, []);

  const handleProfessionalEmailChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setNewProfessionalEmail(e.target.value);
  }, []);

  const handleEventTitleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setNewEventForm(prev => ({ ...prev, title: e.target.value }));
  }, []);

  const handleEventDescriptionChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNewEventForm(prev => ({ ...prev, description: e.target.value }));
  }, []);

  const handleEventLocationChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setNewEventForm(prev => ({ ...prev, location: e.target.value }));
  }, []);

  const handleEventStartTimeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setNewEventForm(prev => ({ ...prev, startTime: e.target.value }));
  }, []);

  const handleEventEndTimeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setNewEventForm(prev => ({ ...prev, endTime: e.target.value }));
  }, []);

  // ===== FUNCIONES AUXILIARES =====
  
  const generateCalendarDays = (): CalendarDay[] => {
    const currentDate = calendarState.currentDate;
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const visibleCalendarIds = getVisibleCalendarIds();
    
    // Primer día del mes
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    // Calcular días a mostrar (empezar el lunes)
    const firstWeekday = firstDay.getDay();
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - (firstWeekday === 0 ? 6 : firstWeekday - 1));
    
    const days: CalendarDay[] = [];
    const today = new Date();
    
    for (let i = 0; i < 42; i++) { // 6 semanas x 7 días
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      
      const dayEvents = events.filter(event => {
        if (!visibleCalendarIds.includes(event.calendarId)) {
          return false;
        }
        const eventDate = new Date(event.startDate);
        return eventDate.toDateString() === date.toDateString();
      });
      
      days.push({
        date: new Date(date),
        isCurrentMonth: date.getMonth() === month,
        isToday: date.toDateString() === today.toDateString(),
        events: dayEvents,
        dayNumber: date.getDate()
      });
    }
    
    return days;
  };
  
  const navigateMonth = (direction: 'prev' | 'next') => {
    setCalendarState(prev => {
      const newDate = new Date(prev.currentDate);
      if (direction === 'prev') {
        newDate.setMonth(newDate.getMonth() - 1);
    } else {
        newDate.setMonth(newDate.getMonth() + 1);
      }
      return { ...prev, currentDate: newDate };
    });
  };
  
  const selectCalendar = (calendarId: string) => {
    if (calendarId === GENERAL_CALENDAR_ID) {
      // Seleccionar calendario general - mostrar todos los profesionales
      setCalendarState(prev => ({
        ...prev,
        selectedCalendars: [GENERAL_CALENDAR_ID]
      }));
      setSelectedProfessional(null);
    } else {
      // Seleccionar profesional individual
      const professional = calendars.find(c => c.id === calendarId);
      if (professional) {
        setCalendarState(prev => ({
          ...prev,
          selectedCalendars: [calendarId]
        }));
        setSelectedProfessional(professional);
      }
    }
    
    // Cerrar panel derecho si está abierto
    setRightSidebarOpen(false);
  };
  
  const getVisibleCalendarIds = () => {
    if (calendarState.selectedCalendars.includes(GENERAL_CALENDAR_ID)) {
      return calendars.map(c => c.id);
    }
    return calendarState.selectedCalendars;
  };

  const getCalendarColor = (calendarId: string): string => {
    const calendar = calendars.find(c => c.id === calendarId);
    return calendar?.color || '#3B82F6';
  };
  
  const formatMonthYear = (date: Date): string => {
    return date.toLocaleDateString('es-ES', { 
      month: 'long', 
      year: 'numeric' 
    }).replace(/^\w/, c => c.toUpperCase());
  };
  
  const startAddProfessional = () => {
    setNewProfessionalName('');
    setNewProfessionalColor(
      PROFESSIONAL_COLOR_PALETTE[nextColorIndex % PROFESSIONAL_COLOR_PALETTE.length]
    );
    setNewProfessionalHourlyRate('');
    setNewProfessionalCurrency('EUR');
    setShowAddProfessional(true);
  };

  const cancelAddProfessional = () => {
    setShowAddProfessional(false);
    setNewProfessionalName('');
    setNewProfessionalEmail('');
    setNewProfessionalHourlyRate('');
    setNewProfessionalCurrency('EUR');
    setIsCreatingProfessional(false);
  };

  const handleAddProfessional = async (event?: React.FormEvent) => {
    if (event) {
      event.preventDefault();
    }
    

    // Validaciones
    if (!newProfessionalName.trim()) {
      console.error('❌ Nombre vacío');
      alert('Por favor ingresa un nombre para el profesional');
      return;
    }

    if (!newProfessionalEmail.trim()) {
      console.error('❌ Email vacío');
      alert('Por favor ingresa un email para el profesional');
      return;
    }

    if (!isValidEmail(newProfessionalEmail)) {
      console.error('❌ Email inválido:', newProfessionalEmail);
      alert(`❌ Email inválido: "${newProfessionalEmail}"\n\n✅ Ejemplo válido: profesional@clinica.com\n\n• Debe contener @ y un dominio completo (.com, .es, etc.)`);
      return;
    }

    let hourlyRateValue = 0;
    if (newProfessionalHourlyRate.trim() !== '') {
      const parsedRate = parseFloat(newProfessionalHourlyRate);
      if (Number.isNaN(parsedRate) || parsedRate < 0) {
        alert('❌ La tarifa por hora debe ser un número válido y mayor o igual a 0');
        return;
      }
      hourlyRateValue = Math.round(parsedRate * 100) / 100;
    }

    const hourlyRateCurrency = newProfessionalCurrency?.trim().toUpperCase() || 'EUR';

      // ✅ SIMPLIFICADO: Cualquier usuario puede agregar profesionales a su equipo

    setIsCreatingProfessional(true);

    try {
      
      // Verificar si ya existe un usuario con ese email
      const existingUser = await authService.getUserByEmail(newProfessionalEmail);
      if (existingUser) {
        console.error('❌ Usuario ya existe:', existingUser);
        alert('Ya existe un usuario con ese email');
        setIsCreatingProfessional(false);
        return;
      }


      // Verificar que el usuario esté disponible
      if (!user?.uid) {
        console.error('❌ Usuario no disponible');
        alert('Error: Usuario no disponible. Por favor recarga la página.');
        return;
      }

      // ¡NUEVA MAGIA SIMPLIFICADA! Agregar profesional directamente al usuario
      const professionalId = await ProfessionalService.addProfessionalToUser(user.uid, {
        name: newProfessionalName.trim(),
        email: newProfessionalEmail.trim(),
        role: 'Profesional', // Valor por defecto, se puede mejorar después
        color: newProfessionalColor,
        permissions: {
          canCreateEvents: true,
          canEditEvents: true,
          canDeleteEvents: false,
          canViewAllEvents: true
        },
        hourlyRate: hourlyRateValue,
        hourlyRateCurrency
      });
      

      // ✅ Invalidar cache de React Query para recargar
      queryClient.invalidateQueries({ queryKey: ['calendars', user.uid] });

      // Limpiar formulario
      cancelAddProfessional();
      
      // Incrementar el índice de color
      setNextColorIndex(prev => prev + 1);

      alert(`✅ Calendario para "${newProfessionalName}" creado correctamente.\n\n📧 El profesional debe registrarse con el email: ${newProfessionalEmail}`);

    } catch (error) {
      console.error('💥 ERROR COMPLETO:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      console.error('📝 Mensaje del error:', errorMessage);
      
      alert(`❌ Error al crear el profesional: ${errorMessage}`);
    } finally {
      setIsCreatingProfessional(false);
    }
  };

  const addComment = async () => {
    if (!selectedEvent || !newComment.trim() || !user?.uid) return;
    
    // MODO DEMO: Simular añadir comentario
    const newCommentObj = {
      id: `comment-${Date.now()}`,
      eventId: selectedEvent.id,
      userId: user.uid,
      userName: user.displayName || 'Usuario',
      message: newComment.trim(),
      createdAt: new Date()
    };
    
    setEventComments(prev => [...prev, newCommentObj]);
    setNewComment('');
  };

  // ===== FUNCIONES PARA EVENTOS =====
  
  const openCreateEventPanel = useCallback((date: Date, professional?: SharedCalendar) => {
    const normalizedDate = new Date(date);
    setSelectedDate(normalizedDate);
    const prof = professional || selectedProfessional;
    setSelectedProfessional(prof);
    setRightSidebarOpen(true);

    // ✅ CARGAR CAMPOS PERSONALIZADOS DEL CALENDARIO
    if (prof?.settings?.customFields) {
      setGlobalCustomFields(prof.settings.customFields);
    } else {
      setGlobalCustomFields([]);
    }

    const hasCustomHour = normalizedDate.getHours() !== 0 || normalizedDate.getMinutes() !== 0;
    const defaultStartHour = hasCustomHour ? normalizedDate.getHours() : 9;
    const defaultStartMinute = hasCustomHour ? normalizedDate.getMinutes() : 0;
    const defaultEndHour = Math.min(defaultStartHour + 1, 23);

    const formatTime = (hour: number, minute: number) =>
      `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;

    setNewEventForm({
      title: '',
      description: '',
      startTime: formatTime(defaultStartHour, defaultStartMinute),
      endTime: formatTime(defaultEndHour, defaultStartMinute),
      location: '',
      hasEndTime: true
    });
    
    // Limpiar datos de campos personalizados
    setCustomFieldsData({});
  }, [selectedProfessional]);

  const closeCreateEventPanel = useCallback(() => {
    setRightSidebarOpen(false);
    setSelectedDate(null);
    setNewEventForm({
      title: '',
      description: '',
      startTime: '09:00',
      endTime: '10:00',
      location: '',
      hasEndTime: true
    });
    setRecurrence(null);
    setCustomFieldsData({});
  }, []);
  
  // Handler para abrir panel de edición de evento
  const openEditEventPanel = useCallback((event: CalendarEvent) => {
    setEditingEvent(event);
    setShowEditEventPanel(true);
    
    // Cargar datos del evento en el formulario
    const startHours = event.startDate.getHours();
    const startMinutes = event.startDate.getMinutes();
    const startTime = `${startHours.toString().padStart(2, '0')}:${startMinutes.toString().padStart(2, '0')}`;
    
    let endTime = '10:00';
    let hasEndTime = false;
    
    if (event.endDate && event.hasEndTime) {
      const endHours = event.endDate.getHours();
      const endMinutes = event.endDate.getMinutes();
      endTime = `${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`;
      hasEndTime = true;
    }
    
    setEditEventForm({
      title: event.title,
      description: event.description || '',
      date: event.startDate.toISOString().slice(0, 10),
      startTime,
      endTime,
      location: event.location || '',
      hasEndTime,
      calendarId: event.calendarId
    });
    
    // Cargar campos personalizados si existen
    if (event.customFieldsData) {
      setCustomFieldsData(event.customFieldsData);
    } else {
      setCustomFieldsData({});
    }

    if (event.recurring && !event.isRecurringInstance && event.recurring.type !== 'none') {
      const normalized = sanitizeRecurrence(event.recurring);
      setEditRecurrence(normalized);
      setShowEditRecurrence(!!normalized);
    } else {
      setEditRecurrence(null);
      setShowEditRecurrence(false);
    }

    // Cerrar modal de evento si estaba abierto
    setSelectedEvent(null);
  }, [sanitizeRecurrence]);
  
  // Handler para cerrar panel de edición
  const closeEditEventPanel = useCallback(() => {
    setShowEditEventPanel(false);
    setEditingEvent(null);
    setEditEventForm({
      title: '',
      description: '',
      date: '',
      startTime: '09:00',
      endTime: '10:00',
      location: '',
      hasEndTime: true,
      calendarId: ''
    });
    setCustomFieldsData({});
    setEditRecurrence(null);
    setShowEditRecurrence(false);
  }, []);
  
  // Handler para abrir panel de eventos del día
  const openDayEventsPanel = useCallback((date: Date, events: CalendarEvent[]) => {
    setDayEventsView({ date, events });
    setShowDayEventsPanel(true);
  }, []);
  
  // Handler para cerrar panel de eventos del día
  const closeDayEventsPanel = useCallback(() => {
    setShowDayEventsPanel(false);
    setDayEventsView(null);
  }, []);

  const handleEditRecurrenceToggle = useCallback(() => {
    if (!editingEvent || editingEvent.isRecurringInstance) {
      return;
    }

    if (showEditRecurrence) {
      setShowEditRecurrence(false);
      return;
    }

    const eventWeekday = editingEvent.startDate.getDay();

    const existing = sanitizeRecurrence(editRecurrence);
    if (existing) {
      setEditRecurrence({ ...existing });
    } else {
      setEditRecurrence({
        type: 'weekly',
        interval: 1,
        weekdays: [eventWeekday]
      });
    }

    setShowEditRecurrence(true);
  }, [editRecurrence, editingEvent, showEditRecurrence, sanitizeRecurrence]);

  // Handler para marcar servicio como completado/no realizado
  const handleMarkServiceStatus = useCallback(async (
    targetEvent: CalendarEvent,
    status: 'completed' | 'not_done' | 'in_progress' | 'pending'
  ) => {
    if (!user?.uid) return;

    const loadingId = targetEvent.id;

    try {
      setUpdatingServiceStatus(loadingId);

      const isVirtualRecurringInstance = Boolean(
        targetEvent.parentEventId &&
        targetEvent.id.startsWith(`${targetEvent.parentEventId}_`)
      );

      if (isVirtualRecurringInstance) {
        await CalendarEventService.updateRecurringInstanceStatus(
          targetEvent.parentEventId!,
          targetEvent.startDate,
          user.uid,
          status
        );
      } else {
        await CalendarEventService.markServiceComplete(targetEvent.id, user.uid, status);
      }

      const now = status === 'completed' ? new Date() : undefined;

      if (dayEventsView) {
        const updatedEvents = dayEventsView.events.map(evt =>
          evt.id === targetEvent.id
            ? {
                ...evt,
                serviceStatus: status,
                completedAt: now,
                completedBy: status === 'completed' ? user.uid : undefined
              }
            : evt
        );
        setDayEventsView({ ...dayEventsView, events: updatedEvents });
      }

      if (selectedEventInfo && selectedEventInfo.id === targetEvent.id) {
        setSelectedEventInfo({
          ...selectedEventInfo,
          serviceStatus: status,
          completedAt: now,
          completedBy: status === 'completed' ? user.uid : undefined
        });
      } else if (selectedEventInfo && isVirtualRecurringInstance && selectedEventInfo.id === targetEvent.parentEventId) {
        setSelectedEventInfo({
          ...selectedEventInfo,
          serviceStatus: status,
          completedAt: now,
          completedBy: status === 'completed' ? user.uid : undefined
        });
      }

      if (editingEvent && editingEvent.id === targetEvent.id) {
        setEditingEvent({
          ...editingEvent,
          serviceStatus: status,
          completedAt: now,
          completedBy: status === 'completed' ? user.uid : undefined
        });
      } else if (editingEvent && isVirtualRecurringInstance && editingEvent.id === targetEvent.parentEventId) {
        setEditingEvent({
          ...editingEvent,
          serviceStatus: status,
          completedAt: now,
          completedBy: status === 'completed' ? user.uid : undefined
        });
      }

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['multipleCalendarEvents'] }),
        queryClient.invalidateQueries({ queryKey: ['calendarEvents', targetEvent.calendarId] })
      ]);

      console.log(`✅ Servicio marcado como: ${status}`);
    } catch (error) {
      console.error('Error al marcar servicio:', error);
      alert('Error al actualizar el estado del servicio');
    } finally {
      setUpdatingServiceStatus(null);
    }
  }, [user?.uid, dayEventsView, selectedEventInfo, editingEvent, queryClient]);

  const handleDuplicateEvent = useCallback(async () => {
    if (!selectedEventInfo) return;
    if (!duplicateForm.date) {
      alert('Selecciona la fecha destino para duplicar la reserva');
      return;
    }

    try {
      setDuplicatingEvent(true);

      const startDate = new Date(duplicateForm.date);
      startDate.setHours(
        selectedEventInfo.startDate.getHours(),
        selectedEventInfo.startDate.getMinutes(),
        0,
        0
      );

      let endDate: Date | undefined;
      let durationMinutes: number | undefined;

      if (selectedEventInfo.hasEndTime && selectedEventInfo.endDate) {
        durationMinutes = Math.max(0, Math.round((selectedEventInfo.endDate.getTime() - selectedEventInfo.startDate.getTime()) / 60000));
        if (durationMinutes > 0) {
          endDate = new Date(startDate.getTime() + durationMinutes * 60000);
        }
      } else if (selectedEventInfo.duration && selectedEventInfo.duration > 0) {
        durationMinutes = selectedEventInfo.duration;
        endDate = new Date(startDate.getTime() + durationMinutes * 60000);
      }

      const eventData: any = {
        calendarId: selectedEventInfo.calendarId,
        title: selectedEventInfo.title,
        startDate,
        isAllDay: selectedEventInfo.isAllDay,
        hasEndTime: selectedEventInfo.hasEndTime,
        color: selectedEventInfo.color,
        createdBy: user?.uid ?? selectedEventInfo.createdBy,
        attendees: Array.isArray(selectedEventInfo.attendees) ? [...selectedEventInfo.attendees] : [],
        comments: [],
        attachments: Array.isArray(selectedEventInfo.attachments) ? [...selectedEventInfo.attachments] : [],
        status: selectedEventInfo.status ?? 'confirmed',
        visibility: selectedEventInfo.visibility ?? 'public',
        reminders: Array.isArray(selectedEventInfo.reminders) ? [...selectedEventInfo.reminders] : [],
        customFieldsData: selectedEventInfo.customFieldsData ? { ...selectedEventInfo.customFieldsData } : undefined
      };

      if (endDate) {
        eventData.endDate = endDate;
        if (durationMinutes && durationMinutes > 0) {
          eventData.duration = durationMinutes;
        }
      }

      if (selectedEventInfo.description) {
        eventData.description = selectedEventInfo.description;
      }

      if (selectedEventInfo.location) {
        eventData.location = selectedEventInfo.location;
      }

      if (selectedEventInfo.recurring && selectedEventInfo.recurring.type !== 'none') {
        // No duplicamos la recurrencia completa; solo un evento único
      }

      const newEventId = await CalendarEventService.createEvent(selectedEventInfo.calendarId, eventData);

      const now = new Date();
      const duplicatedEvent: CalendarEvent = {
        ...selectedEventInfo,
        id: newEventId,
        startDate,
        endDate,
        duration: durationMinutes ?? selectedEventInfo.duration,
        createdBy: user?.uid ?? selectedEventInfo.createdBy,
        attendees: Array.isArray(selectedEventInfo.attendees) ? [...selectedEventInfo.attendees] : [],
        attachments: Array.isArray(selectedEventInfo.attachments) ? [...selectedEventInfo.attachments] : [],
        comments: [],
        recurring: undefined,
        parentEventId: undefined,
        isRecurringInstance: false,
        serviceStatus: 'pending',
        completedAt: undefined,
        completedBy: undefined,
        recurringInstancesStatus: undefined,
        createdAt: now,
        updatedAt: now
      };

      addEventToCaches(duplicatedEvent);

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['multipleCalendarEvents'] }),
        queryClient.invalidateQueries({ queryKey: ['calendarEvents', selectedEventInfo.calendarId] })
      ]);

      setShowDuplicateOptions(false);
      alert(`✅ Reserva duplicada para ${startDate.toLocaleDateString('es-ES')} a las ${startDate.toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit'
      })}`);
    } catch (error) {
      console.error('Error duplicando evento:', error);
      alert(`❌ Error al duplicar: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    } finally {
      setDuplicatingEvent(false);
    }
  }, [
    selectedEventInfo,
    duplicateForm,
    user?.uid,
    addEventToCaches,
    queryClient
  ]);

  const handleCreateEvent = useCallback(async () => {
    if (!selectedDate || !selectedProfessional || !newEventForm.title.trim()) {
      alert('Por favor completa todos los campos requeridos');
      return;
    }

    if (creatingEvent) {
      return;
    }

    if (!user?.uid) {
      alert('Error: Usuario no autenticado');
      return;
    }

    if (recurrence && recurrence.type !== 'none' && (!recurrence.weekdays || recurrence.weekdays.length === 0)) {
      alert('Selecciona al menos un día para la recurrencia antes de crear el evento.');
      return;
    }

    try {
      setCreatingEvent(true);
      
      const startDateTime = new Date(selectedDate);
      const [startHour, startMinute] = newEventForm.startTime.split(':').map(Number);
      startDateTime.setHours(startHour, startMinute, 0, 0);
      
      // ✅ GUARDAR EN FIREBASE usando CalendarEventService (sin undefined)
      const eventDataToSend: any = {
        calendarId: selectedProfessional.id,
        title: newEventForm.title.trim(),
        startDate: startDateTime,
        isAllDay: false,
        hasEndTime: newEventForm.hasEndTime,
        color: selectedProfessional.color,
        createdBy: user.uid,
        attendees: [user.uid],
        comments: [],
        attachments: [],
        status: 'confirmed',
        visibility: 'public',
        reminders: []
      };
      
      // Solo agregar endDate si se especificó hora de fin
      let endDateTime: Date | undefined;
      let eventDurationMinutes: number | undefined;

      if (newEventForm.hasEndTime) {
        endDateTime = new Date(selectedDate);
        const [endHour, endMinute] = newEventForm.endTime.split(':').map(Number);
        endDateTime.setHours(endHour, endMinute, 0, 0);
        eventDataToSend.endDate = endDateTime;
        eventDurationMinutes = Math.max(0, Math.round((endDateTime.getTime() - startDateTime.getTime()) / 60000));
        if (eventDurationMinutes > 0) {
          eventDataToSend.duration = eventDurationMinutes;
        }
      }

      // Solo agregar campos opcionales si tienen valor
      const description = newEventForm.description?.trim();
      if (description) {
        eventDataToSend.description = description;
      }

      const location = newEventForm.location?.trim();
      if (location) {
        eventDataToSend.location = location;
      }

      // Agregar recurrencia si está activada
      const sanitizedCreateRecurrence = sanitizeRecurrence(recurrence);
      if (sanitizedCreateRecurrence) {
        eventDataToSend.recurring = sanitizedCreateRecurrence;
      }

      // Agregar campos personalizados si existen
      if (Object.keys(customFieldsData).length > 0) {
        eventDataToSend.customFieldsData = { ...customFieldsData };
      }


      const eventId = await CalendarEventService.createEvent(selectedProfessional.id, eventDataToSend);

      const now = new Date();
      const createdEvent: CalendarEvent = {
        id: eventId,
        calendarId: selectedProfessional.id,
        title: eventDataToSend.title,
        description,
        startDate: startDateTime,
        endDate: endDateTime,
        isAllDay: eventDataToSend.isAllDay,
        location,
        color: selectedProfessional.color,
        hasEndTime: newEventForm.hasEndTime,
        duration: eventDurationMinutes,
        createdBy: user.uid,
        attendees: eventDataToSend.attendees,
        comments: [],
        attachments: [],
        recurring: sanitizedCreateRecurrence ?? undefined,
        isRecurringInstance: false,
        status: eventDataToSend.status,
        visibility: eventDataToSend.visibility,
        reminders: [],
        customFieldsData: Object.keys(customFieldsData).length > 0 ? { ...customFieldsData } : undefined,
        createdAt: now,
        updatedAt: now
      };

      addEventToCaches(createdEvent);

      if (recurrence && recurrence.type !== 'none') {
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ['multipleCalendarEvents'] }),
          queryClient.invalidateQueries({ queryKey: ['calendarEvents', selectedProfessional.id] })
        ]);
      }

      closeCreateEventPanel();
      alert(`✅ Evento "${newEventForm.title}" creado correctamente${recurrence ? ' (recurrente)' : ''}`);
      
    } catch (error) {
      console.error('❌ Error creando evento:', error);
      alert(`❌ Error al crear evento: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    } finally {
      setCreatingEvent(false);
    }
  }, [
    selectedDate,
    selectedProfessional,
    newEventForm,
    recurrence,
    customFieldsData,
    user?.uid,
    closeCreateEventPanel,
    addEventToCaches,
    queryClient,
    sanitizeRecurrence
  ]);
  
  // Handler para actualizar evento
  const handleUpdateEvent = useCallback(async () => {
    if (!editingEvent || !editEventForm.title.trim()) {
      alert('Por favor completa todos los campos requeridos');
      return;
    }

    if (!editEventForm.date) {
      alert('Selecciona la fecha del evento');
      return;
    }

    try {

      const baseDate = new Date(editEventForm.date);
      const startDateTime = new Date(baseDate);
      const [startHour, startMinute] = editEventForm.startTime.split(':').map(Number);
      startDateTime.setHours(startHour, startMinute, 0, 0);
      
      const previousRecurring = editingEvent.recurring && editingEvent.recurring.type !== 'none'
        ? editingEvent.recurring
        : null;

      const previousSanitizedRecurring = sanitizeRecurrence(previousRecurring);

      let shouldUpdateRecurring = false;
      let draftRecurring: RecurrencePattern | null = previousRecurring;

      if (showEditRecurrence) {
        shouldUpdateRecurring = true;
        draftRecurring = editRecurrence && editRecurrence.type !== 'none' ? editRecurrence : null;
      } else if (previousRecurring && editRecurrence === null) {
        // El usuario desactivó la recurrencia con el selector y luego ocultó el panel
        shouldUpdateRecurring = true;
        draftRecurring = null;
      }

      const sanitizedFinalRecurring = sanitizeRecurrence(draftRecurring);

      if (shouldUpdateRecurring && sanitizedFinalRecurring && sanitizedFinalRecurring.weekdays.length === 0) {
        alert('Selecciona al menos un día para la recurrencia antes de guardar.');
        return;
      }

      const recurrenceChanged = shouldUpdateRecurring
        ? JSON.stringify(previousSanitizedRecurring ?? null) !== JSON.stringify(sanitizedFinalRecurring ?? null)
        : false;

      const updates: any = {
        title: editEventForm.title.trim(),
        startDate: startDateTime,
        hasEndTime: editEventForm.hasEndTime,
        updatedAt: new Date()
      };

      const targetCalendarId = editEventForm.calendarId || editingEvent.calendarId;
      updates.calendarId = targetCalendarId;

      // Solo agregar endDate si se especificó hora de fin
      let endDateTime: Date | undefined;
      let eventDurationMinutes: number | undefined;

      if (editEventForm.hasEndTime) {
        endDateTime = new Date(baseDate);
        const [endHour, endMinute] = editEventForm.endTime.split(':').map(Number);
        endDateTime.setHours(endHour, endMinute, 0, 0);
        updates.endDate = endDateTime;
        eventDurationMinutes = Math.max(0, Math.round((endDateTime.getTime() - startDateTime.getTime()) / 60000));
        if (eventDurationMinutes > 0) {
          updates.duration = eventDurationMinutes;
        }
      } else {
        // Si se quitó la hora de fin, limpiar campos relacionados
        updates.endDate = null;
        updates.duration = 0;
      }

      // Campos opcionales
      const description = editEventForm.description?.trim();
      if (description) {
        updates.description = description;
      } else {
        updates.description = '';
      }

      const location = editEventForm.location?.trim();
      if (location) {
        updates.location = location;
      } else {
        updates.location = '';
      }

      // Actualizar campos personalizados
      if (Object.keys(customFieldsData).length > 0) {
        updates.customFieldsData = { ...customFieldsData };
      }

      if (shouldUpdateRecurring) {
        updates.recurring = sanitizedFinalRecurring ? { ...sanitizedFinalRecurring } : null;
        updates.isRecurringInstance = false;
        updates.parentEventId = null;
      }


      await CalendarEventService.updateEvent(editingEvent.id, updates);


      const now = new Date();

      const updatedEvent: CalendarEvent = {
        ...editingEvent,
        ...updates,
        startDate: startDateTime,
        endDate: updates.endDate ?? undefined,
        duration: eventDurationMinutes ?? editingEvent.duration,
        calendarId: targetCalendarId,
        updatedAt: now,
        description: updates.description ?? '',
        location: updates.location ?? '',
        customFieldsData: updates.customFieldsData ?? editingEvent.customFieldsData
      };

      if (shouldUpdateRecurring) {
        updatedEvent.recurring = sanitizedFinalRecurring ?? undefined;
        updatedEvent.isRecurringInstance = false;
        updatedEvent.parentEventId = undefined;
      }

      updateEventInCaches(updatedEvent, editingEvent.calendarId);

      if (recurrenceChanged) {
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ['multipleCalendarEvents'] }),
          queryClient.invalidateQueries({ queryKey: ['calendarEvents', targetCalendarId] })
        ]);
      }

      closeEditEventPanel();
      alert(`✅ Evento "${editEventForm.title}" actualizado correctamente`);

    } catch (error) {
      console.error('❌ Error actualizando evento:', error);
      alert(`❌ Error al actualizar evento: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  }, [
    editingEvent,
    editEventForm,
    customFieldsData,
    closeEditEventPanel,
    updateEventInCaches,
    showEditRecurrence,
    editRecurrence,
    queryClient,
    sanitizeRecurrence
  ]);
  
  const getCurrentProfessionalInfo = () => {
    if (calendarState.selectedCalendars.includes(GENERAL_CALENDAR_ID)) {
      return {
        name: 'Calendario General',
        description: 'Vista de todos los profesionales',
        isGeneral: true
      };
    } else if (selectedProfessional) {
      return {
        name: selectedProfessional.name,
        description: `Calendario personal de ${selectedProfessional.name}`,
        isGeneral: false
      };
    }
    return null;
  };

  const teamDisplayName = user?.teamName || `Equipo de ${user?.displayName || 'Usuario'}`;
  const professionalCount = calendars.length;
  const totalCalendars = professionalCount + 1;
  const calendarCountLabel = `${totalCalendars} calendario${totalCalendars === 1 ? '' : 's'}`;
  const professionalCountLabel = `${professionalCount} profesional${professionalCount === 1 ? '' : 'es'}`;

  // ===== GESTIÓN DE NOMBRE DE EQUIPO =====
  
  const startEditingTeamName = () => {
    setEditingTeamName(teamDisplayName);
    setIsEditingTeamName(true);
  };

  const cancelEditingTeamName = () => {
    setIsEditingTeamName(false);
    setEditingTeamName('');
  };

  const saveTeamName = async () => {
    if (!user?.uid || !editingTeamName.trim()) return;
    
    setIsUpdatingTeamName(true);
    
    try {
      await ProfessionalService.updateTeamName(user.uid, editingTeamName.trim());
      
      setIsEditingTeamName(false);
      alert('✅ Nombre del equipo actualizado');
      
    } catch (error) {
      console.error('Error actualizando nombre del equipo:', error);
      alert(`❌ Error al actualizar: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    } finally {
      setIsUpdatingTeamName(false);
    }
  };

  // ===== GESTIÓN DE PROFESIONALES =====

  const getProfessionalFromCalendar = (calendar: SharedCalendar) => {
    if (!user?.professionals || !calendar.linkedEmail) return null;
    return user.professionals.find(p => p.email === calendar.linkedEmail);
  };

  // Helper para obtener el avatar del profesional desde el calendario
  const getProfessionalAvatar = (calendarId: string): string | null => {
    const calendar = calendars.find(c => c.id === calendarId);
    if (!calendar) return null;
    
    // 🔧 FIX: Si hay solo 1 member, devolverlo directamente
    // Si hay más, buscar por linkedEmail
    const member = calendar.members.length === 1
      ? calendar.members[0]
      : calendar.members.find(m => m.email === calendar.linkedEmail);
    
    return member?.avatar || null;
  };

  // Helper para obtener el nombre del profesional
  const getProfessionalName = (calendarId: string): string => {
    const calendar = calendars.find(c => c.id === calendarId);
    if (!calendar) return 'Profesional';
    
    // 🔧 FIX: Si hay solo 1 member, devolverlo directamente
    // Si hay más, buscar por linkedEmail
    const member = calendar.members.length === 1
      ? calendar.members[0]
      : calendar.members.find(m => m.email === calendar.linkedEmail);
    
    return member?.name || calendar.name.replace('Calendario de ', '');
  };

  const handleEditProfessional = (calendar: SharedCalendar) => {
    const professional = getProfessionalFromCalendar(calendar);
    if (professional) {
      const hourlyRateValue = professional.hourlyRate ?? calendar.hourlyRate ?? 0;
      const hourlyRateCurrency = professional.hourlyRateCurrency ?? calendar.hourlyRateCurrency ?? 'EUR';

      setEditingProfessional({
        ...professional,
        calendarId: calendar.id,
        ownerId: calendar.ownerId,
        hourlyRate: hourlyRateValue,
        hourlyRateCurrency
      });
      setEditProfessionalForm({
        name: professional.name || calendar.name,
        role: professional.role || '',
        color: calendar.color,
        hourlyRate: hourlyRateValue > 0 ? hourlyRateValue.toString() : '',
        hourlyRateCurrency
      });
      
      // Buscar el avatar en los members del calendario
      const member = calendar.members.find(m => m.email === calendar.linkedEmail);
      setProfessionalAvatar(member?.avatar || null);

      setShowEditProfessionalModal(true);
    }
    setOpenMenuId(null);
  };

  // Handler para cambiar avatar
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tipo de archivo
    if (!file.type.startsWith('image/')) {
      alert('❌ Por favor selecciona una imagen válida');
      return;
    }

    // Validar tamaño (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('❌ La imagen no debe superar 5MB');
      return;
    }

    setProfessionalAvatarFile(file);
    
    // Crear preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setProfessionalAvatar(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Handler para actualizar información del profesional
  const handleUpdateProfessional = async () => {
    if (!editingProfessional || !user?.uid) {
      alert('❌ Error: Información del profesional no disponible');
      return;
    }

    if (!editProfessionalForm.name.trim()) {
      alert('❌ El nombre es obligatorio');
      return;
    }

    try {
      setUploadingAvatar(true);

      // Obtener el avatar actual del profesional desde el calendario
      const currentCalendar = calendars.find(c => c.id === editingProfessional.calendarId);
      const currentMember = currentCalendar?.members.find(m => 
        m.email === currentCalendar.linkedEmail || 
        (currentCalendar.members.length === 1)
      );
      
      let avatarUrl = currentMember?.avatar || null;

      // Si hay un nuevo archivo de avatar, subirlo
      if (professionalAvatarFile) {
        const startTime = Date.now();

        // Comprimir imagen usando el perfil medium (640x640)
        const compressed = await ImageCompressionService.compressImage(
          professionalAvatarFile,
          ImageCompressionService.PROFILES.medium
        );

        // Subir a Firebase Storage
        const fileName = `avatar_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.webp`;
        const storagePath = `calendars/${editingProfessional.calendarId}/professionals/${fileName}`;
        const storageRef = ref(storage, storagePath);

        await uploadBytes(storageRef, compressed.file);
        avatarUrl = await getDownloadURL(storageRef);
      }

      // Actualizar en Firestore
      const calendarRef = doc(db, 'shared_calendars', editingProfessional.calendarId);
      
      // Obtener el calendario actual
      const calendar = calendars.find(c => c.id === editingProfessional.calendarId);
      if (!calendar) {
        throw new Error('Calendario no encontrado');
      }

      const isCalendarOwner = calendar.ownerId === user?.uid;
      let hourlyRateCurrency = editingProfessional.hourlyRateCurrency ?? calendar.hourlyRateCurrency ?? 'EUR';
      let hourlyRateValue = editingProfessional.hourlyRate ?? calendar.hourlyRate ?? 0;

      if (isCalendarOwner) {
        const parsedRate = parseFloat(editProfessionalForm.hourlyRate || '0');
        if (Number.isNaN(parsedRate) || parsedRate < 0) {
          alert('❌ La tarifa por hora debe ser un número válido.');
          setUploadingAvatar(false);
          return;
        }
        hourlyRateValue = parsedRate;

        if (editProfessionalForm.hourlyRateCurrency) {
          const normalizedCurrency = editProfessionalForm.hourlyRateCurrency.trim().toUpperCase();
          if (normalizedCurrency) {
            hourlyRateCurrency = normalizedCurrency;
          }
        }
      }


      // 🔧 FIX DEFINITIVO: Si hay solo 1 member, actualizarlo directamente
      // Si hay más, buscar por email coincidente
      const updatedMembers: CalendarUser[] = calendar.members.length === 1
        ? [{
            ...calendar.members[0],
            name: editProfessionalForm.name.trim(),
            avatar: avatarUrl,  // ✅ Siempre usar el nuevo avatar si existe
            color: editProfessionalForm.color,
            role: editProfessionalForm.role
          } as CalendarUser]
        : calendar.members.map(member => {
            // Buscar coincidencia con linkedEmail o con el email del profesional
            const shouldUpdate = member.email === calendar.linkedEmail || 
                                 member.email === editingProfessional.email;
            
            if (shouldUpdate) {
              return {
                ...member,
                name: editProfessionalForm.name.trim(),
                avatar: avatarUrl,  // ✅ Siempre usar el nuevo avatar si existe
                color: editProfessionalForm.color,
                role: editProfessionalForm.role
              } as CalendarUser;
            }
            return member;
          });
      
      // Actualizar en Firestore
      const calendarUpdate: Record<string, any> = {
        name: `Calendario de ${editProfessionalForm.name.trim()}`,
        color: editProfessionalForm.color,
        members: updatedMembers,
        updatedAt: Timestamp.now()
      };

      if (isCalendarOwner) {
        calendarUpdate.hourlyRate = hourlyRateValue;
        calendarUpdate.hourlyRateCurrency = hourlyRateCurrency;
      }

      await updateDoc(calendarRef, calendarUpdate);

      if (user?.uid && user.professionals) {
        const updatedProfessionalsList = user.professionals.map(pro => {
          if (pro.id !== editingProfessional.id) {
            return pro;
          }

          return {
            ...pro,
            name: editProfessionalForm.name.trim(),
            role: editProfessionalForm.role,
            color: editProfessionalForm.color,
            hourlyRate: isCalendarOwner ? hourlyRateValue : pro.hourlyRate,
            hourlyRateCurrency: isCalendarOwner ? hourlyRateCurrency : pro.hourlyRateCurrency
          };
        });

        await updateDoc(doc(db, 'users', user.uid), {
          professionals: updatedProfessionalsList,
          updatedAt: serverTimestamp()
        });

        setAuthUser({ ...user, professionals: updatedProfessionalsList });
      }


      // ✅ Invalidar cache de React Query para recargar
      if (user?.uid) {
        queryClient.invalidateQueries({ queryKey: ['calendars', user.uid] });
        // Los datos se recargarán automáticamente por React Query
      }

      // Cerrar modal
      setShowEditProfessionalModal(false);
      setEditingProfessional(null);
      setProfessionalAvatar(null);
      setProfessionalAvatarFile(null);
      
      alert(`✅ Información de ${editProfessionalForm.name} actualizada correctamente\n\n🔄 La página se actualizará para mostrar los cambios.`);

    } catch (error) {
      console.error('❌ Error actualizando profesional:', error);
      alert(`❌ Error al actualizar: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleRemoveProfessional = async (calendar: SharedCalendar) => {
    const professional = getProfessionalFromCalendar(calendar);
    if (!professional || !user?.uid) return;

    const confirmDelete = confirm(`¿Estás seguro de que quieres eliminar a ${professional.name}?\n\nEsto eliminará también su calendario y todos sus eventos.`);
    if (!confirmDelete) {
      setOpenMenuId(null);
      return;
    }

    try {
      await ProfessionalService.removeProfessionalFromUser(user.uid, professional.id);

      // ✅ Invalidar cache de React Query para recargar
      queryClient.invalidateQueries({ queryKey: ['calendars', user.uid] });

      alert(`✅ Profesional ${professional.name} eliminado correctamente`);
      
    } catch (error) {
      console.error('Error eliminando profesional:', error);
      alert(`❌ Error al eliminar: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    } finally {
      setOpenMenuId(null);
    }
  };

  const toggleMenu = (calendarId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    setOpenMenuId(openMenuId === calendarId ? null : calendarId);
  };

  // ===== COMPONENTES =====
  
  const calendarSidebar = useMemo(() => {

    const sortedCalendars = [...calendars].sort((a, b) =>
      a.name.localeCompare(b.name, 'es', { sensitivity: 'base' })
    );

    const generalSelected = calendarState.selectedCalendars.includes(GENERAL_CALENDAR_ID);
    const visibleCalendarIds = getVisibleCalendarIds();
  return (
      <div className={`bg-white border-r border-gray-200 transition-all duration-300 ${
        sidebarOpen ? 'w-80' : 'w-0'
      } overflow-hidden flex flex-col`}>
        <div className="flex-1 overflow-y-auto p-4 space-y-6 min-h-0">
          {/* Calendario general */}
          <section className="space-y-3">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <CalendarIcon className="w-5 h-5 text-green-600" />
                  {isEditingTeamName ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={editingTeamName}
                        onChange={(e) => setEditingTeamName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') saveTeamName();
                          if (e.key === 'Escape') cancelEditingTeamName();
                        }}
                        className="px-2 py-1 text-sm border border-green-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white text-green-900"
                        placeholder="Nombre del equipo"
                        disabled={isUpdatingTeamName}
                        autoFocus
                      />
                      <button
                        onClick={saveTeamName}
                        disabled={isUpdatingTeamName || !editingTeamName.trim()}
                        className="p-1 text-green-600 hover:text-green-700 disabled:opacity-50"
                        title="Guardar nombre del equipo"
                      >
                        <CheckCircle className="w-4 h-4" />
                      </button>
                      <button
                        onClick={cancelEditingTeamName}
                        disabled={isUpdatingTeamName}
                        className="p-1 text-gray-500 hover:text-gray-700 disabled:opacity-50"
                        title="Cancelar edición"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-gray-900">
                        {teamDisplayName}
                      </span>
                      <button
                        onClick={startEditingTeamName}
                        className="p-1 text-green-600 hover:text-green-700 transition-colors"
                        title="Editar nombre del equipo"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
                <p className="text-xs text-gray-500">
                  Total: {calendarCountLabel} · {professionalCountLabel}
                </p>
              </div>

              <button
                onClick={() => selectCalendar(GENERAL_CALENDAR_ID)}
                className={`p-1.5 rounded-lg transition-colors ${
                  generalSelected
                    ? 'bg-green-100 text-green-600'
                    : 'text-gray-600 hover:text-green-600 hover:bg-green-50'
                }`}
                title={generalSelected ? 'Ocultar calendario general' : 'Mostrar calendario general'}
              >
                {generalSelected ? (
                  <Eye className="w-5 h-5" />
                ) : (
                  <EyeOff className="w-5 h-5" />
                )}
              </button>
            </div>

            <div 
              className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                generalSelected 
                  ? 'border-green-300 bg-green-50' 
                  : 'border-gray-200 bg-gray-50 hover:bg-gray-100'
              }`}
              onClick={() => selectCalendar(GENERAL_CALENDAR_ID)}
            >
            <div className="flex items-center space-x-3">
                <div className="w-3 h-3 rounded-full bg-gradient-to-r from-green-500 to-teal-500 flex-shrink-0" />
                <div className="flex-1">
                  <p className={`text-sm font-medium ${
                    generalSelected ? 'text-green-900' : 'text-gray-900'
                  }`}>
                    Ver todos los profesionales
                  </p>
                  <p className={`text-xs ${
                    generalSelected ? 'text-green-600' : 'text-gray-500'
                  }`}>
                    Incluye todos los eventos en un solo calendario
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Profesionales */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
                Profesionales
              </h3>
            <div className="flex items-center space-x-2">
                  <button
                  onClick={() => (showAddProfessional ? cancelAddProfessional() : startAddProfessional())}
                  className="p-1.5 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                >
                  {showAddProfessional ? <X className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
                  </button>
            </div>
          </div>

            {showAddProfessional && (
              <form onSubmit={handleAddProfessional} className="space-y-3 p-3 border border-dashed border-green-300 rounded-lg bg-green-50/60">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Nombre del profesional *
                  </label>
                  <input
                    key="professional-name-stable-input" 
                    ref={professionalNameInputRef}
                    value={newProfessionalName}
                    onChange={handleProfessionalNameChange}
                    placeholder="Ej. Dra. Andrea Torres"
                    className="w-full px-3 py-2 border border-green-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                    disabled={isCreatingProfessional}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Email del profesional *
                  </label>
                  <input
                    key="professional-email-stable-input" 
                    ref={professionalEmailInputRef}
                    type="email"
                    value={newProfessionalEmail}
                    onChange={handleProfessionalEmailChange}
                    placeholder="profesional@ejemplo.com"
                    className="w-full px-3 py-2 border border-green-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                    disabled={isCreatingProfessional}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    El profesional podrá acceder con este email
                  </p>
              </div>
                <div>
                  <p className="text-xs font-medium text-gray-700 mb-2">Color del calendario</p>
                  <div className="flex flex-wrap gap-2">
                    {PROFESSIONAL_COLOR_PALETTE.map(color => (
                  <button
                        key={color}
                        type="button"
                        onClick={() => setNewProfessionalColor(color)}
                        className={`w-6 h-6 rounded-full border-2 ${
                          newProfessionalColor === color ? 'border-gray-900' : 'border-transparent'
                        }`}
                        style={{ backgroundColor: color }}
                        aria-label={`Seleccionar color ${color}`}
                      />
                ))}
              </div>
            </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Tarifa por hora (opcional)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={newProfessionalHourlyRate}
                      onChange={(e) => setNewProfessionalHourlyRate(e.target.value)}
                      placeholder="0.00"
                      className="w-full px-3 py-2 border border-green-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                      disabled={isCreatingProfessional}
                    />
                    <select
                      value={newProfessionalCurrency}
                      onChange={(e) => setNewProfessionalCurrency(e.target.value.toUpperCase())}
                      className="px-2 py-2 border border-green-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                      disabled={isCreatingProfessional}
                    >
                      {['EUR', 'USD', 'MXN', 'COP'].map(currency => (
                        <option key={currency} value={currency}>{currency}</option>
                      ))}
                    </select>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Se usará para calcular pagos en el dashboard de horas trabajadas
                  </p>
                </div>
                <div className="flex items-center justify-end space-x-2">
              <button 
                      type="button"
                      onClick={cancelAddProfessional}
                      className="px-3 py-2 text-xs font-medium text-gray-600 hover:text-gray-800"
              >
                    Cancelar
                  </button>
              <button 
                    type="submit"
                    className="px-3 py-2 bg-green-600 text-white text-xs font-medium rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                    disabled={!newProfessionalName.trim() || !newProfessionalEmail.trim() || isCreatingProfessional}
              >
                    {isCreatingProfessional ? 'Creando...' : 'Guardar profesional'}
              </button>
              </div>
              </form>
            )}

            <div className="space-y-2">
              {sortedCalendars.length === 0 ? (
                <div className="p-3 text-sm text-gray-500 border border-dashed border-gray-300 rounded-lg text-center">
                  Aún no hay profesionales. Agrega el primero para comenzar.
            </div>
              ) : (
                sortedCalendars.map(calendar => (
                  <div key={calendar.id} className="group">
                    <div 
                      className={`flex items-center space-x-3 p-2 rounded-lg cursor-pointer transition-colors ${
                        calendarState.selectedCalendars.includes(calendar.id)
                          ? 'bg-blue-50 border border-blue-200'
                          : 'hover:bg-gray-50'
                      }`}
                      onClick={() => selectCalendar(calendar.id)}
                    >
                       <div className="flex items-center space-x-2 flex-1">
              <button 
                           onClick={(e) => {
                             e.stopPropagation();
                             selectCalendar(calendar.id);
                           }}
                           className={`p-1 rounded transition-colors ${
                             calendarState.selectedCalendars.includes(calendar.id)
                               ? 'bg-blue-100 text-blue-700'
                               : 'text-gray-400 hover:text-gray-600'
                           }`}
                         >
                           {calendarState.selectedCalendars.includes(calendar.id) ? (
                             <Eye className="w-4 h-4" />
                           ) : (
                             <EyeOff className="w-4 h-4" />
                )}
              </button>

                        <div
                          className="w-3 h-3 rounded-full flex-shrink-0"
                          style={{ backgroundColor: calendar.color }}
                        />

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-1">
                            <span className={`text-sm font-medium truncate ${
                              calendarState.selectedCalendars.includes(calendar.id)
                                ? 'text-blue-900'
                                : 'text-gray-900'
                            }`}>
                              {calendar.name}
                            </span>
                            {calendar.ownerId === user?.uid && (
                              <Crown className="w-3 h-3 text-yellow-500" />
                            )}
                </div>
                          <p className={`text-xs ${
                            calendarState.selectedCalendars.includes(calendar.id)
                              ? 'text-blue-600'
                              : 'text-gray-500'
                          }`}>
                            {calendar.linkedEmail || `${calendar.members.length} miembro${calendar.members.length > 1 ? 's' : ''}`}
                          </p>
                </div>
                      </div>
          
                <div className="relative">
              <button 
                    onClick={(e) => toggleMenu(calendar.id, e)}
                    className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-gray-600 rounded transition-all"
              >
                    <MoreVertical className="w-4 h-4" />
              </button>

                  {/* Menú contextual */}
                  {openMenuId === calendar.id && (
                    <div className="absolute right-0 top-8 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10 min-w-[200px]">
              <button 
                        onClick={() => handleEditProfessional(calendar)}
                        className="w-full px-4 py-2 text-sm text-left text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
              >
                        <Edit3 className="w-4 h-4" />
                        <span>Editar información</span>
              </button>
                      <div className="border-t border-gray-100 my-1" />
              <button 
                        onClick={() => handleRemoveProfessional(calendar)}
                        className="w-full px-4 py-2 text-sm text-left text-red-600 hover:bg-red-50 flex items-center space-x-2"
              >
                        <X className="w-4 h-4" />
                        <span>Eliminar profesional</span>
              </button>
                    </div>
                  )}
            </div>
          </div>

                    {visibleCalendarIds.includes(calendar.id) && (
                      <div className="ml-9 mt-1 flex items-center space-x-1">
                        {calendar.members.slice(0, 3).map(member => (
                          <div
                            key={member.id}
                            className="w-5 h-5 rounded-full bg-gradient-to-br from-blue-400 to-blue-500 flex items-center justify-center text-white text-xs font-medium"
                            title={member.name}
                          >
                            {member.name.charAt(0).toUpperCase()}
                </div>
                        ))}
                        {calendar.members.length > 3 && (
                          <span className="text-xs text-gray-500">
                            +{calendar.members.length - 3}
                          </span>
          )}
                </div>
                    )}
              </div>
                ))
              )}
              </div>
          </section>

          {/* Acceso a configuración del formulario */}
                <button 
            onClick={() => setShowFormEditor(true)}
            className="w-full p-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-purple-400 hover:text-purple-600 transition-colors flex items-center justify-center space-x-2"
          >
            <Settings className="w-4 h-4" />
            <span className="text-sm font-medium">Configuración avanzada</span>
                </button>
              </div>
            </div>
    );
  }, [
    calendars,
    calendarState.selectedCalendars,
    sidebarOpen,
    showAddProfessional,
    newProfessionalName,
    newProfessionalEmail,
    isCreatingProfessional,
    openMenuId,
    handleAddProfessional,
    handleProfessionalNameChange,
    handleProfessionalEmailChange,
    selectCalendar,
    toggleMenu,
    isEditingTeamName,
    editingTeamName,
    isUpdatingTeamName,
    startEditingTeamName,
    saveTeamName,
    cancelEditingTeamName,
    user?.teamName,
    user?.displayName
  ]);
  
  const WEEK_START_HOUR = 7;
  const WEEK_END_HOUR = 21;

  const calendarGrid = useMemo(() => {
    const visibleCalendarIds = new Set(getVisibleCalendarIds());

    if (calendarState.view === 'week') {
      const weekStart = new Date(calendarState.currentDate);
      const currentDay = weekStart.getDay();
      const diffToMonday = currentDay === 0 ? -6 : 1 - currentDay;
      weekStart.setDate(weekStart.getDate() + diffToMonday);
      weekStart.setHours(0, 0, 0, 0);

      const weekDays = Array.from({ length: 7 }, (_, index) => {
        const day = new Date(weekStart);
        day.setDate(weekStart.getDate() + index);
        return day;
      });

      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 7);

      const eventsForWeek = events.filter(event => {
        return visibleCalendarIds.has(event.calendarId) &&
          event.startDate >= weekStart &&
          event.startDate < weekEnd;
      });

      const slotMap = new Map<string, CalendarEvent[]>();
      eventsForWeek.forEach(event => {
        const dayIndex = weekDays.findIndex(day => day.toDateString() === event.startDate.toDateString());
        if (dayIndex === -1) return;
        const hourKey = event.startDate.getHours();
        const key = `${dayIndex}-${hourKey}`;
        if (!slotMap.has(key)) {
          slotMap.set(key, []);
        }
        slotMap.get(key)!.push(event);
      });

      const hours = Array.from({ length: WEEK_END_HOUR - WEEK_START_HOUR + 1 }, (_, index) => WEEK_START_HOUR + index);

      const formatHour = (hour: number) => `${hour.toString().padStart(2, '0')}:00`;

      return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-auto">
          <div className="min-w-[960px]">
            <div className="grid grid-cols-[80px_repeat(7,1fr)] border-b border-gray-200 bg-gray-50">
              <div className="border-r border-gray-200" />
              {weekDays.map(day => (
                <div key={day.toISOString()} className="px-4 py-3 text-center border-l border-gray-200">
                  <div className="text-sm font-semibold text-gray-900 uppercase">
                    {day.toLocaleDateString('es-ES', { weekday: 'short' })}
                  </div>
                  <div className="text-xs text-gray-500">
                    {day.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-[80px_repeat(7,1fr)]">
              {hours.map(hour => (
                <React.Fragment key={`hour-${hour}`}>
                  <div className="border-t border-gray-200 px-2 py-4 text-xs font-medium text-gray-500 bg-gray-50 flex items-start justify-end">
                    {formatHour(hour)}
                  </div>
                  {weekDays.map((day, dayIndex) => {
                    const key = `${dayIndex}-${hour}`;
                    const slotEvents = slotMap.get(key) || [];
                    return (
                      <div
                        key={key}
                        className="border-t border-l border-gray-100 min-h-[80px] px-2 py-1 relative hover:bg-blue-50 transition-colors"
                        onClick={() => {
                          if (selectedProfessional) {
                            const cellDate = new Date(day);
                            cellDate.setHours(hour, 0, 0, 0);
                            openCreateEventPanel(cellDate, selectedProfessional);
                          }
                        }}
                      >
                        {slotEvents.length === 0 ? (
                          <span className="sr-only">Espacio horario vacío</span>
                        ) : (
                          <div className="space-y-2">
                            {slotEvents.map(event => (
                              <button
                                key={event.id}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openEditEventPanel(event);
                                }}
                                onMouseEnter={(e) => {
                                  console.log('Week view - Mouse enter event:', event.title);
                                  if (tooltipTimeoutRef.current) {
                                    clearTimeout(tooltipTimeoutRef.current);
                                  }
                                  const rect = e.currentTarget.getBoundingClientRect();
                                  tooltipTimeoutRef.current = setTimeout(() => {
                                    console.log('Week view - Showing tooltip for:', event.title, rect);
                                    setHoveredEvent({
                                      event,
                                      position: { x: rect.right + 10, y: rect.top }
                                    });
                                  }, 100);
                                }}
                                onMouseLeave={() => {
                                  if (tooltipTimeoutRef.current) {
                                    clearTimeout(tooltipTimeoutRef.current);
                                  }
                                  setHoveredEvent(null);
                                }}
                                className="w-full text-left bg-blue-500/90 hover:bg-blue-600 text-white rounded-lg px-2 py-1 transition-colors shadow-sm"
                                style={{ backgroundColor: getCalendarColor(event.calendarId) }}
                              >
                                <div className="text-xs font-semibold truncate">{event.title}</div>
                                <div className="text-[10px] text-white/80">
                                  {event.startDate.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                                  {event.endDate && event.hasEndTime ? (
                                    <>
                                      {' - '}
                                      {event.endDate.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                                    </>
                                  ) : null}
                                </div>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>
      );
    }

    const days = generateCalendarDays();
    const weekDays = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="grid grid-cols-7 border-b border-gray-200">
          {weekDays.map(day => (
            <div key={day} className="p-3 text-center">
              <span className="text-sm font-medium text-gray-600">{day}</span>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {days.map((day, index) => (
            <div
              key={index}
              className={`relative min-h-[100px] p-2 border-r border-b border-gray-100 hover:bg-gray-50 cursor-pointer ${
                !day.isCurrentMonth ? 'bg-gray-50/50' : ''
              } ${day.isToday ? 'bg-blue-50' : ''}`}
              onClick={() => {
                if (day.isCurrentMonth && selectedProfessional) {
                  openCreateEventPanel(day.date, selectedProfessional);
                }
              }}
            >
              <div className="flex items-center justify-between mb-1">
                <span className={`text-sm font-medium ${
                  day.isCurrentMonth
                    ? day.isToday
                      ? 'text-blue-600'
                      : 'text-gray-900'
                    : 'text-gray-400'
                }`}>
                  {day.dayNumber}
                </span>
                {day.isToday && <div className="w-2 h-2 bg-blue-500 rounded-full" />}
              </div>
              <div className="space-y-1">
                {day.events.slice(0, 2).map(event => (
                  <div
                    key={event.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedEventInfo(event);
                      setShowEventInfoModal(true);
                      setShowDeleteOptions(false);
                      setShowDuplicateOptions(false);
                      setDuplicateForm({
                        date: event.startDate.toISOString().slice(0, 10)
                      });
                    }}
                    onMouseEnter={(e) => {
                      console.log('Month view - Mouse enter event:', event.title);
                      if (tooltipTimeoutRef.current) {
                        clearTimeout(tooltipTimeoutRef.current);
                      }
                      const rect = e.currentTarget.getBoundingClientRect();
                      tooltipTimeoutRef.current = setTimeout(() => {
                        console.log('Month view - Showing tooltip for:', event.title, rect);
                        setHoveredEvent({
                          event,
                          position: { x: rect.right + 10, y: rect.top }
                        });
                      }, 100);
                    }}
                    onMouseLeave={() => {
                      console.log('Month view - Mouse leave');
                      if (tooltipTimeoutRef.current) {
                        clearTimeout(tooltipTimeoutRef.current);
                      }
                      setHoveredEvent(null);
                    }}
                    className="px-2 py-1 rounded text-xs font-medium text-white truncate cursor-pointer hover:opacity-80 transition-opacity"
                    style={{ backgroundColor: getCalendarColor(event.calendarId) }}
                  >
                    {event.title}
                  </div>
                ))}
                {day.events.length > 2 && (
                  <div 
                    onClick={(e) => {
                      e.stopPropagation();
                      openDayEventsPanel(day.date, day.events);
                    }}
                    className="text-xs text-blue-600 hover:text-blue-800 font-medium px-2 cursor-pointer hover:underline"
                  >
                    +{day.events.length - 2} más
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }, [
    calendarState.view,
    calendarState.currentDate,
    selectedProfessional,
    events,
    openCreateEventPanel,
    openEditEventPanel,
    openDayEventsPanel,
    getCalendarColor,
    setSelectedEvent,
    calendars,
    calendarState.selectedCalendars
  ]);

  // Modal de evento con chat  
  const eventModal = useMemo(() => {
    if (!selectedEvent) return null;
    
    const calendar = calendars.find(c => c.id === selectedEvent.calendarId);
    const customFieldDefinitions = new Map(globalCustomFields.map(field => [field.id, field]));
    const customFieldEntries = Object.entries(selectedEvent.customFieldsData || {}).filter(([, value]) => {
      if (value === null || value === undefined) return false;
      if (typeof value === 'string') return value.trim().length > 0;
      if (Array.isArray(value)) return value.length > 0;
      if (typeof value === 'object') return Object.keys(value).length > 0;
      return true;
    });

    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedEvent(null)}
        >
          <motion.div
            initial={{ scale: 0.95, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[80vh] overflow-hidden"
          >
            {/* Header */}
            <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div 
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: calendar?.color }}
                  />
                  <h2 className="text-lg font-semibold text-gray-900">
                    {selectedEvent.title}
                  </h2>
              </div>
                <button 
                  onClick={() => setSelectedEvent(null)}
                  className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-600" />
                </button>
              </div>
            </div>
              
            {/* Información del evento */}
            <div className="p-4 border-b border-gray-200 space-y-3">
              <div className="flex items-center space-x-3 text-sm text-gray-600">
                <Clock className="w-4 h-4" />
                <span>
                  {selectedEvent.startDate.toLocaleDateString('es-ES')} - 
                  {selectedEvent.startDate.toLocaleTimeString('es-ES', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </span>
          </div>
          
              {selectedEvent.location && (
                <div className="flex items-center space-x-3 text-sm text-gray-600">
                  <MapPin className="w-4 h-4" />
                  <span>{selectedEvent.location}</span>
              </div>
              )}
              
              <div className="flex items-center space-x-3 text-sm text-gray-600">
                <Users className="w-4 h-4" />
                <span>{calendar?.name}</span>
              </div>
              
              {selectedEvent.description && (
                <p className="text-sm text-gray-700 mt-3">
                  {selectedEvent.description}
                </p>
              )}

              {customFieldEntries.length > 0 && (
                <div className="pt-3 border-t border-gray-200 space-y-2">
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Información adicional
                  </h3>
                  <div className="space-y-2">
                    {customFieldEntries.map(([fieldId, value]) => {
                      const definition = customFieldDefinitions.get(fieldId);
                      const label = definition?.label || fieldId;
                      const type = definition?.type;
                      let displayValue: React.ReactNode;

                      if (type === 'url' && typeof value === 'string') {
                        displayValue = (
                          <a
                            href={value.startsWith('http') ? value : `https://${value}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center text-sm text-blue-600 hover:text-blue-700"
                          >
                            {value}
                            <ExternalLink className="w-3 h-3 ml-1" />
                          </a>
                        );
                      } else if (Array.isArray(value)) {
                        displayValue = (
                          <span className="text-sm text-gray-700">
                            {value.join(', ')}
                          </span>
                        );
                      } else if (typeof value === 'object') {
                        displayValue = (
                          <span className="text-sm text-gray-700">
                            {JSON.stringify(value)}
                          </span>
                        );
                      } else {
                        displayValue = (
                          <span className="text-sm text-gray-700 break-words">
                            {value as string}
                          </span>
                        );
                      }

                      return (
                        <div
                          key={fieldId}
                          className="bg-gray-50 border border-gray-200 rounded-lg p-2"
                        >
                          <p className="text-xs font-medium text-gray-500 mb-1">
                            {label}
                          </p>
                          {displayValue}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Indicador de evento recurrente */}
              {(selectedEvent.recurring || selectedEvent.isRecurringInstance) && (
                <div className="flex items-center space-x-2 p-2 bg-purple-50 border border-purple-200 rounded-lg">
                  <Repeat className="w-4 h-4 text-purple-600" />
                  <span className="text-xs font-medium text-purple-700">
                    {selectedEvent.recurring ? 'Evento recurrente (padre)' : 'Parte de serie recurrente'}
                  </span>
                </div>
              )}
          </div>

          {/* Acciones de eliminación */}
          <div className="px-4 pb-4 space-y-2 border-b border-gray-200">
            {/* 🐛 DEBUG INFO */}
            {console.log('🔍 Event Debug:', {
              id: selectedEvent.id,
              isRecurringInstance: selectedEvent.isRecurringInstance,
              parentEventId: selectedEvent.parentEventId,
              hasRecurring: !!selectedEvent.recurring,
              recurringType: selectedEvent.recurring?.type
            })}

            {selectedEvent.recurring && !selectedEvent.isRecurringInstance ? (
              // ✅ Es el evento padre - opción de eliminar toda la serie
              <>
              <p className="text-xs text-purple-600 mb-2">💡 Evento padre de serie recurrente</p>
              <button
                onClick={async () => {
                  if (confirm('¿Eliminar TODA la serie de eventos recurrentes?\n\nEsto eliminará todas las instancias virtuales. Solo se elimina 1 documento de Firestore.')) {
                    try {
                      await CalendarEventService.deleteRecurringSeries(selectedEvent.id);
                      setSelectedEvent(null);
                      removeEventFromCaches(selectedEvent.id, selectedEvent.calendarId);
                      alert('✅ Serie de eventos eliminada correctamente');
                    } catch (error) {
                      console.error('Error eliminando serie:', error);
                      alert('Error al eliminar la serie de eventos');
                    }
                  }
                }}
                className="w-full px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors flex items-center justify-center space-x-2"
              >
                <Trash2 className="w-4 h-4" />
                <span>Eliminar serie completa</span>
              </button>
              </>
            ) : selectedEvent.isRecurringInstance && selectedEvent.parentEventId ? (
              // ✅ Es una instancia virtual - opciones mejoradas
              <div className="space-y-2">
                <button
                  onClick={async () => {
                    if (confirm('¿Eliminar solo esta instancia del evento?\n\nLos demás eventos de la serie se mantendrán.')) {
                      try {
                        await CalendarEventService.deleteRecurringInstance(
                          selectedEvent.parentEventId!,
                          selectedEvent.startDate
                        );
                        setSelectedEvent(null);
                        removeEventFromCaches(selectedEvent.id, selectedEvent.calendarId);
                        alert('✅ Evento eliminado correctamente');
                      } catch (error) {
                        console.error('Error eliminando evento:', error);
                        alert('Error al eliminar el evento');
                      }
                    }
                  }}
                  className="w-full px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors flex items-center justify-center space-x-2"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Eliminar solo esta instancia</span>
                </button>
                <button
                  onClick={async () => {
                    if (confirm('¿Eliminar desde esta fecha en adelante?\n\nSe eliminarán todas las instancias futuras.')) {
                      try {
                        await CalendarEventService.deleteRecurringSeriesFromDate(
                          selectedEvent.parentEventId!,
                          selectedEvent.startDate
                        );
                        setSelectedEvent(null);
                        // ✅ Invalidar cache
                        await Promise.all([
                          queryClient.invalidateQueries({ queryKey: ['multipleCalendarEvents'] }),
                          queryClient.invalidateQueries({ queryKey: ['calendarEvents'] })
                        ]);
                        alert('✅ Eventos futuros eliminados correctamente');
                      } catch (error) {
                        console.error('Error eliminando eventos futuros:', error);
                        alert('Error al eliminar eventos futuros');
                      }
                    }
                  }}
                  className="w-full px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg transition-colors flex items-center justify-center space-x-2"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Eliminar desde hoy en adelante</span>
                </button>
                <button
                  onClick={async () => {
                    if (confirm('¿Eliminar TODA la serie de eventos?\n\nEsto eliminará el evento padre y todas las instancias.')) {
                      try {
                        await CalendarEventService.deleteRecurringSeries(selectedEvent.parentEventId!);
                        setSelectedEvent(null);
                        removeEventFromCaches(selectedEvent.parentEventId!, selectedEvent.calendarId);
                        alert('✅ Serie completa eliminada correctamente');
                      } catch (error) {
                        console.error('Error eliminando serie:', error);
                        alert('Error al eliminar la serie de eventos');
                      }
                    }
                  }}
                  className="w-full px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors flex items-center justify-center space-x-2"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Eliminar TODA la serie</span>
                </button>
              </div>
            ) : (
              // Evento normal - solo eliminar este
              <button
                onClick={async () => {
                  if (confirm('¿Eliminar este evento?')) {
                    try {
                      await CalendarEventService.deleteEvent(selectedEvent.id);
                      setSelectedEvent(null);
                      removeEventFromCaches(selectedEvent.id, selectedEvent.calendarId);
                    } catch (error) {
                      console.error('Error eliminando evento:', error);
                      alert('Error al eliminar el evento');
                    }
                  }
                }}
                className="w-full px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors flex items-center justify-center space-x-2"
              >
                <Trash2 className="w-4 h-4" />
                <span>Eliminar evento</span>
              </button>
            )}
          </div>
          
            {/* Comentarios */}
            <div className="flex-1 overflow-hidden flex flex-col">
              <div className="p-4 border-b border-gray-200">
                <h3 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Comentarios ({eventComments.length})
                </h3>
                
                {/* Lista de comentarios */}
                <div className="space-y-3 max-h-40 overflow-y-auto">
                  {eventComments.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-4">
                      No hay comentarios aún
                    </p>
                  ) : (
                    eventComments.map(comment => (
                      <div key={comment.id} className="flex items-start space-x-2">
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-400 to-blue-500 flex items-center justify-center text-white text-xs font-medium">
                          {comment.userName.charAt(0).toUpperCase()}
              </div>
                        <div className="flex-1 min-w-0">
                          <div className="bg-gray-100 rounded-lg p-2">
                            <p className="text-xs font-medium text-gray-900">
                              {comment.userName}
                            </p>
                            <p className="text-sm text-gray-700">
                              {comment.message}
                            </p>
              </div>
                          <p className="text-xs text-gray-500 mt-1">
                            {comment.createdAt.toLocaleTimeString('es-ES', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
            </div>
            </div>
                    ))
                  )}
          </div>
        </div>

              {/* Input para nuevo comentario */}
            <div className="p-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    placeholder="Escribe un comentario..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addComment()}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                  />
                <button 
                    onClick={addComment}
                    disabled={!newComment.trim()}
                    className="p-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    );
  }, [selectedEvent, calendars, eventComments, newComment, globalCustomFields]);

  // Panel lateral derecho para crear eventos  
  const createEventSidebar = useMemo(() => {
    const professionalInfo = getCurrentProfessionalInfo();
    
    if (!rightSidebarOpen || !selectedDate || !selectedProfessional) return null;
    
    return (
      <div className="w-80 bg-white border-l border-gray-200 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Nuevo Evento</h3>
                <button 
              onClick={closeCreateEventPanel}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
              <X className="w-5 h-5 text-gray-600" />
                </button>
              </div>
              
          <div className="mt-3 p-3 bg-blue-50 rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <div 
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: selectedProfessional.color }}
              />
              <span className="text-sm font-medium text-blue-900">
                {selectedProfessional.name}
              </span>
                  </div>
            <p className="text-sm text-blue-700">
              📅 {selectedDate.toLocaleDateString('es-ES', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric'
              })}
            </p>
          </div>
              </div>
              
        {/* Formulario */}
        <div className="flex-1 p-4 space-y-4 overflow-y-auto">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Título del evento *
            </label>
            <input
              key="event-title-stable-input" 
              ref={eventTitleInputRef}
              type="text"
              value={newEventForm.title}
              onChange={handleEventTitleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Ej: Consulta con María García"
            />
                        </div>
                        
          {/* Toggle para tipo de duración */}
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-2">
              <Clock className="w-5 h-5 text-gray-600" />
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {newEventForm.hasEndTime ? 'Rango de horas' : 'Hora única'}
                </p>
                <p className="text-xs text-gray-500">
                  {newEventForm.hasEndTime 
                    ? 'Se calculará duración para analytics' 
                    : 'Evento sin duración específica'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setNewEventForm(prev => ({ 
                ...prev, 
                hasEndTime: !prev.hasEndTime 
              }))}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                newEventForm.hasEndTime ? 'bg-blue-600' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  newEventForm.hasEndTime ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          <div className={`grid ${newEventForm.hasEndTime ? 'grid-cols-2' : 'grid-cols-1'} gap-3`}>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Hora {newEventForm.hasEndTime ? 'inicio' : ''}
              </label>
              <input
                key="event-start-time-stable-input" 
                type="time"
                value={newEventForm.startTime}
                onChange={handleEventStartTimeChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            {newEventForm.hasEndTime && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Hora fin
                </label>
                <input
                  key="event-end-time-stable-input" 
                  type="time"
                  value={newEventForm.endTime}
                  onChange={handleEventEndTimeChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Descripción
            </label>
            <textarea
              key="event-description-stable-input" 
              value={newEventForm.description}
              onChange={handleEventDescriptionChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              placeholder="Detalles adicionales del evento..."
            />
              </div>
                        
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ubicación
                </label>
                <input
                  key="event-location-stable-input" 
                  type="text"
                  value={newEventForm.location}
                  onChange={handleEventLocationChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ej: Consultorio 2, Online, etc."
                />
                <LocationMapPreview query={newEventForm.location} className="mt-3" />
              </div>

          {/* Divider */}
          <div className="border-t border-gray-200 my-4"></div>

          {/* Recurrencia */}
          <RecurrenceSelector
            value={recurrence}
            onChange={setRecurrence}
          />

          {/* Campos Personalizados Dinámicos */}
          {globalCustomFields && 
           globalCustomFields.filter(f => f.isVisible).length > 0 && (
            <>
              <div className="border-t border-gray-200 my-4"></div>
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-gray-900">Información Adicional</h4>
                {globalCustomFields
                  .filter(f => f.isVisible)
                  .sort((a, b) => a.order - b.order)
                  .map(field => (
                    <div key={field.id}>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {field.label} {field.required && <span className="text-red-500">*</span>}
                      </label>
                      
                      {field.type === 'text' && (
                        <input
                          type="text"
                          placeholder={field.placeholder}
                          required={field.required}
                          value={customFieldsData[field.id] || ''}
                          onChange={(e) => setCustomFieldsData(prev => ({ ...prev, [field.id]: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      )}
                      
                      {field.type === 'textarea' && (
                        <textarea
                          placeholder={field.placeholder}
                          required={field.required}
                          value={customFieldsData[field.id] || ''}
                          onChange={(e) => setCustomFieldsData(prev => ({ ...prev, [field.id]: e.target.value }))}
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                        />
                      )}
                      
                      {field.type === 'url' && (
                        <input
                          type="url"
                          placeholder={field.placeholder}
                          required={field.required}
                          value={customFieldsData[field.id] || ''}
                          onChange={(e) => setCustomFieldsData(prev => ({ ...prev, [field.id]: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      )}
                      
                      {field.type === 'email' && (
                        <input
                          type="email"
                          placeholder={field.placeholder}
                          required={field.required}
                          value={customFieldsData[field.id] || ''}
                          onChange={(e) => setCustomFieldsData(prev => ({ ...prev, [field.id]: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      )}
                      
                      {field.type === 'phone' && (
                        <input
                          type="tel"
                          placeholder={field.placeholder}
                          required={field.required}
                          value={customFieldsData[field.id] || ''}
                          onChange={(e) => setCustomFieldsData(prev => ({ ...prev, [field.id]: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      )}
                      
                      {field.type === 'number' && (
                        <input
                          type="number"
                          placeholder={field.placeholder}
                          required={field.required}
                          value={customFieldsData[field.id] || ''}
                          onChange={(e) => setCustomFieldsData(prev => ({ ...prev, [field.id]: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      )}
                      
                      {field.type === 'select' && (
                        <select
                          required={field.required}
                          value={customFieldsData[field.id] || ''}
                          onChange={(e) => setCustomFieldsData(prev => ({ ...prev, [field.id]: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">Seleccionar...</option>
                          {field.options?.map(opt => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                      )}
                      
                      {field.type === 'date' && (
                        <input
                          type="date"
                          required={field.required}
                          value={customFieldsData[field.id] || ''}
                          onChange={(e) => setCustomFieldsData(prev => ({ ...prev, [field.id]: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      )}
                    </div>
                  ))}
              </div>
            </>
          )}
        </div>
        
        {/* Footer con botones */}
        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center justify-end space-x-3">
            <button 
              onClick={closeCreateEventPanel}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleCreateEvent}
              disabled={!newEventForm.title.trim() || creatingEvent}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {creatingEvent ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
              <span>{creatingEvent ? 'Creando...' : 'Crear Evento'}</span>
            </button>
          </div>
            </div>
          </div>
    );
  }, [
    rightSidebarOpen,
    selectedDate,
    selectedProfessional,
    newEventForm,
    recurrence,
    customFieldsData,
    globalCustomFields,
    handleCreateEvent,
    closeCreateEventPanel,
    handleEventTitleChange,
    handleEventStartTimeChange,
    handleEventEndTimeChange,
    handleEventDescriptionChange,
    handleEventLocationChange
  ]);

  return (
    <div className="h-screen bg-gray-50 flex overflow-hidden">
      {/* Sidebar de calendarios */}
      {calendarSidebar}
      
      {/* Contenido principal */}
      <div className="flex-1 flex flex-col overflow-hidden min-h-0">
        {/* Header estilo TimeTree */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
                  <button 
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                <Settings className="w-5 h-5 text-gray-600" />
                  </button>
              
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => navigateMonth('prev')}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <ChevronLeft className="w-5 h-5 text-gray-600" />
                </button>
                
                <div className="text-center">
                  <h1 className="text-xl font-bold text-gray-900">
                    {formatMonthYear(calendarState.currentDate)}
                  </h1>
                  {getCurrentProfessionalInfo() && (
                    <p className="text-sm text-gray-600 mt-1">
                      {getCurrentProfessionalInfo()?.name}
                    </p>
                )}
              </div>
                
                <button
                  onClick={() => navigateMonth('next')}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <ChevronRight className="w-5 h-5 text-gray-600" />
                </button>
                      </div>
                      </div>
                      
            {/* Controles superiores */}
            <div className="flex items-center space-x-3">
              {/* Toggle mensual/semanal */}
              <div className="bg-gray-100 rounded-lg p-1 flex">
                          <button 
                  onClick={() => setCalendarState(prev => ({ ...prev, view: 'month' }))}
                  className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                    calendarState.view === 'month'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Mensual
                          </button>
                          <button 
                  onClick={() => setCalendarState(prev => ({ ...prev, view: 'week' }))}
                  className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                    calendarState.view === 'week'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Semanal
                          </button>
                        </div>
                        
                      <button 
                onClick={() => {
                  if (selectedProfessional) {
                    // Si hay un profesional seleccionado, crear evento para hoy
                    openCreateEventPanel(new Date(), selectedProfessional);
                  } else {
                    // Si es vista general, mostrar mensaje
                    alert('Selecciona un profesional para crear eventos');
                  }
                }}
                className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={!selectedProfessional}
              >
                <Plus className="w-4 h-4" />
                <span>Evento</span>
                      </button>
                          </div>
                          </div>
                          </div>
                        
        {/* Área del calendario */}
        <div className="flex-1 p-6 overflow-auto">
          {calendarGrid}
        </div>
                        
        {/* Estadísticas rápidas */}
        {stats && (
          <div className="bg-white border-t border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center space-x-6">
                    <div className="flex items-center space-x-2">
                  <CalendarIcon className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-600">{stats.totalEvents} eventos</span>
                          </div>
                <div className="flex items-center space-x-2">
                  <Users className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-600">{stats.collaborators} colaboradores</span>
                          </div>
                <div className="flex items-center space-x-2">
                  <Share2 className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-600">{stats.sharedCalendars} calendarios compartidos</span>
                          </div>
                        </div>
                        
              <div className="text-gray-500">
                {stats.upcomingEvents} eventos próximos
                          </div>
                      </div>
          </div>
        )}
                    </div>
                    
      {/* Panel lateral derecho para crear eventos */}
      {createEventSidebar}
      
      {/* Modal de evento con chat */}
      {eventModal}
      
      {/* Modal Editor de Formularios */}
      {showFormEditor && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
                    <Settings className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">
                      Configuración Avanzada
                    </h2>
                    <p className="text-sm text-gray-600 mt-1">
                      Personaliza el formulario de eventos para todos los profesionales
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowFormEditor(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-600" />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-6">
              <CustomFieldsEditor
                fields={globalCustomFields}
                onUpdate={async (fields) => {
                  if (!user?.uid) return;
                  
                  try {
                    const sanitizedFields = fields.map(field => ({ ...field }));

                    await updateDoc(doc(db, 'users', user.uid), {
                      eventFormCustomFields: sanitizedFields
                    });

                    await Promise.all(
                      calendars.map(calendar =>
                        updateDoc(doc(db, 'shared_calendars', calendar.id), {
                          'settings.customFields': sanitizedFields,
                          updatedAt: Timestamp.now()
                        })
                      )
                    );
                    
                    setGlobalCustomFields(sanitizedFields);
                    queryClient.setQueryData<SharedCalendar[]>(['calendars', user.uid], (prev) => {
                      if (!Array.isArray(prev)) return prev;
                      return prev.map(calendar => ({
                        ...calendar,
                        settings: {
                          ...calendar.settings,
                          customFields: sanitizedFields
                        },
                        updatedAt: new Date()
                      }));
                    });

                  } catch (error) {
                    console.error('❌ Error al guardar campos:', error);
                    alert('Error al guardar los campos personalizados');
                  }
                }}
              />
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-gray-200">
              <button
                onClick={() => setShowFormEditor(false)}
                className="w-full px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors font-medium"
              >
                Cerrar
              </button>
            </div>
          </motion.div>
        </div>
      )}
      
      {/* FAB para crear evento */}
      {selectedProfessional && (
                          <button 
          onClick={() => openCreateEventPanel(new Date(), selectedProfessional)}
          className="fixed bottom-6 right-6 w-14 h-14 bg-green-500 hover:bg-green-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all flex items-center justify-center z-40"
                          >
          <Plus className="w-6 h-6" />
                          </button>
      )}

      {/* Tooltip para eventos en hover */}
      {hoveredEvent && (() => {
        console.log('Rendering tooltip for:', hoveredEvent.event.title, 'at position:', hoveredEvent.position);
        const event = hoveredEvent.event;
        const calendarColor = getCalendarColor(event.calendarId);
        const professionalName = getProfessionalName(event.calendarId);
        
        // Ajustar posición si está cerca del borde derecho de la pantalla
        let tooltipX = hoveredEvent.position.x;
        let tooltipY = hoveredEvent.position.y;
        
        if (tooltipX + 288 > window.innerWidth) { // 288px = width del tooltip (w-72)
          tooltipX = hoveredEvent.position.x - 288 - 20; // Mostrar a la izquierda
        }
        
        if (tooltipY + 400 > window.innerHeight) {
          tooltipY = window.innerHeight - 400;
        }
        
        return (
          <div
            className="fixed z-[60] pointer-events-none"
            style={{
              left: `${tooltipX}px`,
              top: `${tooltipY}px`,
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.2 }}
              className="bg-white rounded-lg shadow-2xl border-2 border-gray-200 p-4 w-72"
            >
              {/* Header con el color del calendario */}
              <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-200">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: calendarColor }}
                />
                <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Detalles de la Reserva</p>
              </div>

            {/* Contenido del evento */}
            <div className="space-y-3">
              {event.title && (
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1">Servicio:</p>
                  <p className="text-sm font-semibold text-gray-900">{event.title}</p>
                </div>
              )}

              {professionalName && (
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1">Profesional:</p>
                  <p className="text-sm text-gray-900">{professionalName}</p>
                </div>
              )}

              <div>
                <p className="text-xs font-medium text-gray-500 mb-1">Fecha y Hora:</p>
                <p className="text-sm text-gray-900">
                  {event.startDate.toLocaleDateString('es-ES', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  })}
                </p>
                <p className="text-sm text-gray-900">
                  {event.startDate.toLocaleTimeString('es-ES', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                  {event.endDate && event.hasEndTime && (
                    <>
                      {' - '}
                      {event.endDate.toLocaleTimeString('es-ES', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </>
                  )}
                </p>
              </div>

              {event.location && (
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1">Ubicación:</p>
                  <p className="text-sm text-gray-900">{event.location}</p>
                </div>
              )}

              {event.status && (
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1">Estado:</p>
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                      event.status === 'confirmed'
                        ? 'bg-green-100 text-green-800'
                        : event.status === 'tentative'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {event.status === 'confirmed' && <CheckCircle className="w-3 h-3" />}
                    {event.status === 'confirmed' ? 'Confirmado' : event.status === 'tentative' ? 'Tentativo' : 'Cancelado'}
                  </span>
                </div>
              )}

              {event.description && (
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1">Descripción:</p>
                  <p className="text-xs text-gray-700">{event.description}</p>
                </div>
              )}
              
              {event.customFieldsData && Object.keys(event.customFieldsData).length > 0 && (
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1">Información adicional:</p>
                  <div className="space-y-1">
                    {Object.entries(event.customFieldsData).map(([key, value]) => {
                      if (!value || (typeof value === 'string' && !value.trim())) return null;
                      return (
                        <div key={key} className="text-xs">
                          <span className="font-medium text-gray-600">{key}:</span>{' '}
                          <span className="text-gray-800">{String(value)}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
        );
      })()}

      {/* Modal para editar profesional */}
      {showEditProfessionalModal && editingProfessional && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
              <Edit3 className="w-5 h-5 text-blue-600" />
              Editar información del profesional
            </h3>
            
            <div className="space-y-5">
              {/* Avatar Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Foto de perfil
                </label>
                <div className="flex items-center gap-4">
                  <div className="relative group">
                    <div className="w-24 h-24 rounded-full overflow-hidden bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center border-2 border-gray-200">
                      {professionalAvatar ? (
                        <img 
                          src={professionalAvatar} 
                          alt="Avatar" 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User className="w-12 h-12 text-gray-400" />
                      )}
                    </div>
                    
                    {/* Hover overlay */}
                    <label className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                      <Camera className="w-6 h-6 text-white" />
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarChange}
                        className="hidden"
                      />
                    </label>
                  </div>
                  
                  <div className="flex-1">
                    <label className="cursor-pointer">
                      <div className="flex items-center gap-2 px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors">
                        <Upload className="w-4 h-4 text-gray-600" />
                        <span className="text-sm text-gray-600">
                          {professionalAvatarFile ? professionalAvatarFile.name : 'Subir nueva foto'}
                        </span>
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarChange}
                        className="hidden"
                      />
                    </label>
                    <p className="text-xs text-gray-500 mt-2">
                      JPG, PNG o WEBP. Máx 5MB. Se comprimirá automáticamente.
                    </p>
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-200 my-4"></div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre completo *
                </label>
                <input
                  type="text"
                  value={editProfessionalForm.name}
                  onChange={(e) => setEditProfessionalForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ej: Dr. Juan Pérez"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={editingProfessional.email}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                  disabled
                />
                <p className="text-xs text-gray-500 mt-1">
                  ℹ️ El email no se puede modificar
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Especialidad / Rol
                </label>
                <input
                  type="text"
                  value={editProfessionalForm.role}
                  onChange={(e) => setEditProfessionalForm(prev => ({ ...prev, role: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ej: Médico General, Dentista, Coach, etc."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Color del calendario
                </label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {PROFESSIONAL_COLOR_PALETTE.map(color => (
                    <button 
                      key={color}
                      className={`w-10 h-10 rounded-lg border-2 transition-all ${
                        editProfessionalForm.color === color 
                          ? 'border-gray-900 scale-110 shadow-md' 
                          : 'border-gray-200 hover:scale-105'
                      }`}
                      style={{ backgroundColor: color }}
                      onClick={() => setEditProfessionalForm(prev => ({ ...prev, color }))}
                    />
                  ))}
                </div>
              </div>

              {editingProfessional?.ownerId === user?.uid && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tarifa por hora
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={editProfessionalForm.hourlyRate}
                      onChange={(e) => setEditProfessionalForm(prev => ({ ...prev, hourlyRate: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Ej: 40"
                    />
                    <select
                      value={editProfessionalForm.hourlyRateCurrency}
                      onChange={(e) => setEditProfessionalForm(prev => ({ ...prev, hourlyRateCurrency: e.target.value.toUpperCase() }))}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {['EUR', 'USD', 'MXN', 'COP'].map(currency => (
                        <option key={currency} value={currency}>{currency}</option>
                      ))}
                    </select>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Se utilizará para calcular el pago total en base a las horas completadas cada mes.
                  </p>
                </div>
              )}
            </div>
            
            <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-200">
              <button
                onClick={() => {
                  setShowEditProfessionalModal(false);
                  setEditingProfessional(null);
                  setProfessionalAvatar(null);
                  setProfessionalAvatarFile(null);
                }}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                disabled={uploadingAvatar}
              >
                Cancelar
              </button>
              <button 
                onClick={handleUpdateProfessional}
                disabled={uploadingAvatar}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploadingAvatar ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Guardando...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    Guardar cambios
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Panel lateral derecho para EDITAR evento */}
      <AnimatePresence>
        {showEditEventPanel && editingEvent && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-white shadow-2xl z-50 flex flex-col border-l border-gray-200"
          >
            {/* Header */}
            <div className="p-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  {/* Avatar del profesional */}
                  {getProfessionalAvatar(editingEvent.calendarId) ? (
                    <img 
                      src={getProfessionalAvatar(editingEvent.calendarId)!} 
                      alt={getProfessionalName(editingEvent.calendarId)}
                      className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-md"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                      <User className="w-6 h-6 text-white" />
                    </div>
                  )}
                  
                  <div>
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <Edit3 className="w-4 h-4" />
                      Editar Evento
                    </h3>
                    <p className="text-xs text-blue-100">
                      {getProfessionalName(editingEvent.calendarId)}
                    </p>
                  </div>
                </div>
                <button 
                  onClick={closeEditEventPanel}
                  className="p-1 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-sm text-blue-100 ml-13">
                📅 {editingEvent.startDate.toLocaleDateString('es-ES', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric'
                })}
              </p>
            </div>
            
            {/* Formulario */}
            <div className="flex-1 p-4 space-y-4 overflow-y-auto">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Título del evento *
                </label>
                <input
                  type="text"
                  value={editEventForm.title}
                  onChange={(e) => setEditEventForm(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ej: Consulta con María García"
                />
              </div>
              
              {/* Toggle para tipo de duración */}
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-2">
                  <Clock className="w-5 h-5 text-gray-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {editEventForm.hasEndTime ? 'Rango de horas' : 'Hora única'}
                    </p>
                    <p className="text-xs text-gray-500">
                      {editEventForm.hasEndTime 
                        ? 'Se calculará duración para analytics' 
                        : 'Evento sin duración específica'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setEditEventForm(prev => ({ 
                    ...prev, 
                    hasEndTime: !prev.hasEndTime 
                  }))}
                  className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                    editEventForm.hasEndTime ? 'bg-blue-600' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      editEventForm.hasEndTime ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              <div className={`grid ${editEventForm.hasEndTime ? 'grid-cols-2' : 'grid-cols-1'} gap-3`}>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Hora {editEventForm.hasEndTime ? 'inicio' : ''}
                  </label>
                  <input
                    type="time"
                    value={editEventForm.startTime}
                    onChange={(e) => setEditEventForm(prev => ({ ...prev, startTime: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                {editEventForm.hasEndTime && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Hora fin
                    </label>
                    <input
                      type="time"
                      value={editEventForm.endTime}
                      onChange={(e) => setEditEventForm(prev => ({ ...prev, endTime: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descripción
                </label>
                <textarea
                  value={editEventForm.description}
                  onChange={(e) => setEditEventForm(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  placeholder="Detalles adicionales del evento..."
                />
              </div>

              <div className="grid grid-cols-1 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fecha
                  </label>
                  <input
                    type="date"
                    value={editEventForm.date}
                    onChange={(e) => setEditEventForm(prev => ({ ...prev, date: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Profesional / Calendario
                  </label>
                  <select
                    value={editEventForm.calendarId}
                    onChange={(e) => setEditEventForm(prev => ({ ...prev, calendarId: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="" disabled>Selecciona un calendario</option>
                    {[{ id: GENERAL_CALENDAR_ID, name: 'Calendario General' }, ...calendars].map(calendar => (
                      <option key={calendar.id} value={calendar.id}>
                        {calendar.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ubicación
                </label>
                <input
                  type="text"
                  value={editEventForm.location}
                  onChange={(e) => setEditEventForm(prev => ({ ...prev, location: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ej: Consultorio 2, Online, etc."
                />
                <LocationMapPreview query={editEventForm.location} className="mt-3" />
              </div>

              {editingEvent && !editingEvent.isRecurringInstance && (
                <>
                  <div className="border-t border-gray-200 my-4"></div>
                  <div className="space-y-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                          <Repeat className="w-4 h-4 text-purple-600" />
                          Reserva recurrente
                        </p>
                        <p className="text-xs text-gray-500">
                          Convierte esta reserva en un patrón semanal o mensual sin salir del panel.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={handleEditRecurrenceToggle}
                        className="px-3 py-1.5 text-sm font-medium rounded-lg border border-purple-200 text-purple-600 hover:bg-purple-50 transition-colors"
                      >
                        {showEditRecurrence ? 'Ocultar' : editingEvent.recurring ? 'Editar recurrencia' : 'Convertir en recurrente'}
                      </button>
                    </div>

                    {showEditRecurrence && (
                      <div className="pt-1">
                        <RecurrenceSelector
                          value={editRecurrence}
                          onChange={setEditRecurrence}
                        />
                        {(!editRecurrence || editRecurrence.type === 'none') && (
                          <p className="text-xs text-gray-500 mt-3">
                            Activa el interruptor superior y elige los días para crear la recurrencia.
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* Campos Personalizados */}
              {globalCustomFields && 
               globalCustomFields.filter(f => f.isVisible).length > 0 && (
                <>
                  <div className="border-t border-gray-200 my-4"></div>
                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold text-gray-900">Información Adicional</h4>
                    {globalCustomFields
                      .filter(f => f.isVisible)
                      .sort((a, b) => a.order - b.order)
                      .map(field => (
                        <div key={field.id}>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            {field.label} {field.required && <span className="text-red-500">*</span>}
                          </label>
                          
                          {field.type === 'text' && (
                            <input
                              type="text"
                              placeholder={field.placeholder}
                              required={field.required}
                              value={customFieldsData[field.id] || ''}
                              onChange={(e) => setCustomFieldsData(prev => ({ ...prev, [field.id]: e.target.value }))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          )}
                          
                          {field.type === 'textarea' && (
                            <textarea
                              placeholder={field.placeholder}
                              required={field.required}
                              value={customFieldsData[field.id] || ''}
                              onChange={(e) => setCustomFieldsData(prev => ({ ...prev, [field.id]: e.target.value }))}
                              rows={3}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                            />
                          )}
                          
                          {field.type === 'url' && (
                            <input
                              type="url"
                              placeholder={field.placeholder}
                              required={field.required}
                              value={customFieldsData[field.id] || ''}
                              onChange={(e) => setCustomFieldsData(prev => ({ ...prev, [field.id]: e.target.value }))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          )}
                          
                          {field.type === 'email' && (
                            <input
                              type="email"
                              placeholder={field.placeholder}
                              required={field.required}
                              value={customFieldsData[field.id] || ''}
                              onChange={(e) => setCustomFieldsData(prev => ({ ...prev, [field.id]: e.target.value }))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          )}
                          
                          {field.type === 'phone' && (
                            <input
                              type="tel"
                              placeholder={field.placeholder}
                              required={field.required}
                              value={customFieldsData[field.id] || ''}
                              onChange={(e) => setCustomFieldsData(prev => ({ ...prev, [field.id]: e.target.value }))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          )}
                          
                          {field.type === 'number' && (
                            <input
                              type="number"
                              placeholder={field.placeholder}
                              required={field.required}
                              value={customFieldsData[field.id] || ''}
                              onChange={(e) => setCustomFieldsData(prev => ({ ...prev, [field.id]: e.target.value }))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          )}
                          
                          {field.type === 'select' && (
                            <select
                              required={field.required}
                              value={customFieldsData[field.id] || ''}
                              onChange={(e) => setCustomFieldsData(prev => ({ ...prev, [field.id]: e.target.value }))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                              <option value="">Seleccionar...</option>
                              {field.options?.map(opt => (
                                <option key={opt} value={opt}>{opt}</option>
                              ))}
                            </select>
                          )}
                          
                          {field.type === 'date' && (
                            <input
                              type="date"
                              required={field.required}
                              value={customFieldsData[field.id] || ''}
                              onChange={(e) => setCustomFieldsData(prev => ({ ...prev, [field.id]: e.target.value }))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          )}
                        </div>
                      ))}
                  </div>
                </>
              )}
            </div>
            
            {/* Footer con botones */}
            <div className="p-4 border-t border-gray-200">
              <div className="flex items-center justify-end space-x-3">
                <button 
                  onClick={closeEditEventPanel}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleUpdateEvent}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  Guardar Cambios
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Panel lateral derecho para VER TODOS LOS EVENTOS DEL DÍA */}
      <AnimatePresence>
        {showDayEventsPanel && dayEventsView && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-white shadow-2xl z-50 flex flex-col border-l border-gray-200"
          >
            {/* Header */}
            <div className="p-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <CalendarIcon className="w-5 h-5" />
                  Eventos del Día
                </h3>
                <button 
                  onClick={closeDayEventsPanel}
                  className="p-1 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-sm text-purple-100">
                📅 {dayEventsView.date.toLocaleDateString('es-ES', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric'
                })}
              </p>
              <p className="text-xs text-purple-200 mt-1">
                {dayEventsView.events.length} evento{dayEventsView.events.length !== 1 ? 's' : ''} programado{dayEventsView.events.length !== 1 ? 's' : ''}
              </p>
            </div>
            
            {/* Lista de eventos */}
            <div className="flex-1 p-4 space-y-3 overflow-y-auto">
              {dayEventsView.events
                .sort((a, b) => a.startDate.getTime() - b.startDate.getTime())
                .map(event => (
                  <div
                    key={event.id}
                    onClick={() => {
                      setSelectedEventInfo(event);
                      setShowEventInfoModal(true);
                      setShowDeleteOptions(false);
                      setShowDuplicateOptions(false);
                      setDuplicateForm({
                        date: event.startDate.toISOString().slice(0, 10)
                      });
                    }}
                    onMouseEnter={(e) => {
                      console.log('Day list - Mouse enter event:', event.title);
                      if (tooltipTimeoutRef.current) {
                        clearTimeout(tooltipTimeoutRef.current);
                      }
                      const rect = e.currentTarget.getBoundingClientRect();
                      tooltipTimeoutRef.current = setTimeout(() => {
                        console.log('Day list - Showing tooltip for:', event.title, rect);
                        setHoveredEvent({
                          event,
                          position: { x: rect.right + 10, y: rect.top }
                        });
                      }, 100);
                    }}
                    onMouseLeave={() => {
                      console.log('Day list - Mouse leave');
                      if (tooltipTimeoutRef.current) {
                        clearTimeout(tooltipTimeoutRef.current);
                      }
                      setHoveredEvent(null);
                    }}
                    className="p-4 rounded-lg border-2 border-gray-200 hover:border-blue-400 cursor-pointer transition-all hover:shadow-md group"
                  >
                    <div className="flex items-start gap-3 mb-2">
                      {/* Avatar del profesional */}
                      {getProfessionalAvatar(event.calendarId) ? (
                        <img 
                          src={getProfessionalAvatar(event.calendarId)!} 
                          alt={getProfessionalName(event.calendarId)}
                          className="w-10 h-10 rounded-full object-cover border-2 flex-shrink-0"
                          style={{ borderColor: getCalendarColor(event.calendarId) }}
                        />
                      ) : (
                        <div 
                          className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 border-2"
                          style={{ 
                            backgroundColor: getCalendarColor(event.calendarId) + '20',
                            borderColor: getCalendarColor(event.calendarId)
                          }}
                        >
                          <User className="w-5 h-5" style={{ color: getCalendarColor(event.calendarId) }} />
                        </div>
                      )}
                      
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                          {event.title}
                        </h4>
                        <p className="text-xs text-gray-500">
                          {getProfessionalName(event.calendarId)}
                        </p>
                      </div>
                    </div>
                    
                    <div className="space-y-1">
                      <div className="flex items-center text-sm text-gray-600">
                        <Clock className="w-4 h-4 mr-2 flex-shrink-0" />
                        <span>
                          {event.startDate.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                          {event.endDate && event.hasEndTime && (
                            <>
                              {' - '}
                              {event.endDate.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                            </>
                          )}
                        </span>
                      </div>
                      
                      {event.location && (
                        <div className="flex items-center text-sm text-gray-600">
                          <MapPin className="w-4 h-4 mr-2 flex-shrink-0" />
                          <span className="truncate">{event.location}</span>
                        </div>
                      )}
                      
                      {event.description && (
                        <p className="text-xs text-gray-500 mt-2 line-clamp-2">
                          {event.description}
                        </p>
                      )}
                      
                      {event.isRecurringInstance && (
                        <div className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700 mt-2">
                          <Repeat className="w-3 h-3 mr-1" />
                          Recurrente
                        </div>
                      )}
                    </div>

                    {/* Estado del Servicio */}
                    <div className="mt-3 pt-3 border-t border-gray-100 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-gray-500">Estado del Servicio:</span>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                          event.serviceStatus === 'completed' ? 'bg-green-100 text-green-700' :
                          event.serviceStatus === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                          event.serviceStatus === 'not_done' ? 'bg-red-100 text-red-700' :
                          'bg-yellow-100 text-yellow-700'
                        }`}>
                          {event.serviceStatus === 'completed' ? '✓ Completado' :
                           event.serviceStatus === 'in_progress' ? '⏳ En Progreso' :
                           event.serviceStatus === 'not_done' ? '✗ No Realizado' :
                           '⏱ Pendiente'}
                        </span>
                      </div>

                      {/* Botones de acción rápida */}
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMarkServiceStatus(event, 'completed');
                          }}
                          disabled={updatingServiceStatus === event.id || event.serviceStatus === 'completed'}
                          className="flex items-center justify-center gap-1 px-2 py-1.5 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded text-xs font-medium transition-colors"
                        >
                          {updatingServiceStatus === event.id ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <CheckCircle2 className="w-3 h-3" />
                          )}
                          Completar
                        </button>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMarkServiceStatus(event, 'not_done');
                          }}
                          disabled={updatingServiceStatus === event.id || event.serviceStatus === 'not_done'}
                          className="flex items-center justify-center gap-1 px-2 py-1.5 bg-red-600 hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded text-xs font-medium transition-colors"
                        >
                          {updatingServiceStatus === event.id ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <XCircle className="w-3 h-3" />
                          )}
                          No Hecho
                        </button>
                      </div>
                    </div>

                    <div className="mt-2 pt-2 border-t border-gray-100 flex items-center justify-between">
                      <span className="text-xs text-gray-500">
                        Haz clic para editar
                      </span>
                      <Edit3 className="w-4 h-4 text-gray-400 group-hover:text-blue-500 transition-colors" />
                    </div>
                  </div>
                ))}
            </div>
            
            {/* Footer */}
            <div className="p-4 border-t border-gray-200 bg-gray-50">
              <button 
                onClick={closeDayEventsPanel}
                className="w-full px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Cerrar
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal de información del evento */}
      <AnimatePresence>
        {showEventInfoModal && selectedEventInfo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => {
              setShowEventInfoModal(false);
              setShowDeleteOptions(false);
            }}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header del modal */}
              <div className="relative p-6 bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold mb-1">{selectedEventInfo.title}</h2>
                    <p className="text-blue-100 text-sm">
                      {getProfessionalName(selectedEventInfo.calendarId)}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Botón editar */}
                    <button
                      onClick={() => {
                        setShowEventInfoModal(false);
                        openEditEventPanel(selectedEventInfo);
                        setShowDeleteOptions(false);
                        setShowDuplicateOptions(false);
                      }}
                      className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                      title="Editar evento"
                    >
                      <Edit3 className="w-5 h-5" />
                    </button>

                    {/* Botón duplicar */}
                    <button
                      onClick={() => {
                        if (selectedEventInfo) {
                      setDuplicateForm({
                        date: selectedEventInfo.startDate.toISOString().slice(0, 10)
                      });
                        }
                        setShowDuplicateOptions(prev => !prev);
                        setShowDeleteOptions(false);
                      }}
                      className={`p-2 rounded-lg transition-colors ${showDuplicateOptions ? 'bg-white/25' : 'hover:bg-white/20'}`}
                      title="Duplicar"
                    >
                      <Copy className="w-5 h-5" />
                    </button>

                    {/* Botón eliminar */}
                    <button
                      onClick={() => setShowDeleteOptions(prev => !prev)}
                      className={`p-2 rounded-lg transition-colors ${showDeleteOptions ? 'bg-white/25' : 'hover:bg-white/20'}`}
                      title="Eliminar"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>

                    {/* Botón cerrar */}
                    <button
                      onClick={() => {
                        setShowEventInfoModal(false);
                        setShowDeleteOptions(false);
                        setShowDuplicateOptions(false);
                      }}
                      className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {showDuplicateOptions && (
                  <div className="px-6 mb-4">
                    <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-blue-700 flex items-center gap-2">
                          <Repeat className="w-4 h-4" />
                          Duplicar reserva
                        </span>
                        <button
                          onClick={() => setShowDuplicateOptions(false)}
                          className="p-1 text-blue-600 hover:text-blue-800"
                          title="Cerrar panel de duplicación"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-blue-800 mb-1">Fecha destino</label>
                        <input
                          type="date"
                          value={duplicateForm.date}
                          onChange={(e) => setDuplicateForm({ date: e.target.value })}
                          className="w-full px-3 py-2 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                        />
                      </div>

                      <p className="text-xs text-blue-700">
                        Copiamos título, horario, duración, descripción, ubicación, asistentes y campos personalizados. Puedes editar el duplicado después de crearlo.
                      </p>

                      <div className="flex justify-end">
                        <button
                          onClick={handleDuplicateEvent}
                          disabled={duplicatingEvent}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
                        >
                          {duplicatingEvent ? <Loader2 className="w-4 h-4 animate-spin" /> : <Copy className="w-4 h-4" />}
                          {duplicatingEvent ? 'Duplicando...' : 'Duplicar reserva'}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Estado del servicio */}
                <div className="flex items-center gap-2">
                  {selectedEventInfo.serviceStatus === 'completed' && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-500/20 border border-green-300 rounded-full text-xs font-medium">
                      <CheckCircle2 className="w-3 h-3" />
                      Completado
                    </span>
                  )}
                  {selectedEventInfo.serviceStatus === 'not_done' && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-red-500/20 border border-red-300 rounded-full text-xs font-medium">
                      <XCircle className="w-3 h-3" />
                      No Realizado
                    </span>
                  )}
                  {selectedEventInfo.serviceStatus === 'in_progress' && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-yellow-500/20 border border-yellow-300 rounded-full text-xs font-medium">
                      <Clock className="w-3 h-3" />
                      En Progreso
                    </span>
                  )}
                  {(!selectedEventInfo.serviceStatus || selectedEventInfo.serviceStatus === 'pending') && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-gray-500/20 border border-gray-300 rounded-full text-xs font-medium">
                      <Clock className="w-3 h-3" />
                      Pendiente
                    </span>
                  )}
              </div>
            </div>

            {showDeleteOptions && (
              <div className="px-6 mt-4">
                <div className="rounded-xl border border-red-200 bg-red-50 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-red-700 flex items-center gap-2">
                      <Trash2 className="w-4 h-4" />
                      Gestionar eliminación
                    </span>
                    <button
                      onClick={() => setShowDeleteOptions(false)}
                      className="p-1 text-red-600 hover:text-red-800"
                      title="Cerrar"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {selectedEventInfo.parentEventId ? (
                    <div className="grid gap-2">
                      <button
                        onClick={async () => {
                          if (confirm('¿Eliminar solo esta instancia?\n\nLos demás eventos de la serie se mantendrán.')) {
                            try {
                              await CalendarEventService.deleteRecurringInstance(
                                selectedEventInfo.parentEventId!,
                                selectedEventInfo.startDate
                              );
                              setShowDeleteOptions(false);
                              setShowEventInfoModal(false);
                              await Promise.all([
                                queryClient.invalidateQueries({ queryKey: ['multipleCalendarEvents'] }),
                                queryClient.invalidateQueries({ queryKey: ['calendarEvents'] })
                              ]);
                              alert('✅ Instancia eliminada correctamente');
                            } catch (error) {
                              console.error('Error eliminando instancia:', error);
                              alert('Error al eliminar la instancia');
                            }
                          }
                        }}
                        className="px-3 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm rounded-lg transition-colors flex items-center justify-center gap-2"
                      >
                        <Trash2 className="w-4 h-4" />
                        Eliminar solo esta instancia
                      </button>

                      <button
                        onClick={async () => {
                          if (confirm('¿Eliminar desde esta fecha en adelante?\n\nSe eliminarán todas las instancias futuras.')) {
                            try {
                              await CalendarEventService.deleteRecurringSeriesFromDate(
                                selectedEventInfo.parentEventId!,
                                selectedEventInfo.startDate
                              );
                              setShowDeleteOptions(false);
                              setShowEventInfoModal(false);
                              await Promise.all([
                                queryClient.invalidateQueries({ queryKey: ['multipleCalendarEvents'] }),
                                queryClient.invalidateQueries({ queryKey: ['calendarEvents'] })
                              ]);
                              alert('✅ Eventos futuros eliminados correctamente');
                            } catch (error) {
                              console.error('Error eliminando eventos futuros:', error);
                              alert('Error al eliminar eventos futuros');
                            }
                          }
                        }}
                        className="px-3 py-2 bg-yellow-500 hover:bg-yellow-600 text-white text-sm rounded-lg transition-colors flex items-center justify-center gap-2"
                      >
                        <Trash2 className="w-4 h-4" />
                        Eliminar desde hoy →
                      </button>

                      <button
                        onClick={async () => {
                          if (confirm('¿Eliminar TODA la serie de eventos?\n\nEsto eliminará el evento padre y todas las instancias.')) {
                            try {
                              await CalendarEventService.deleteRecurringSeries(selectedEventInfo.parentEventId!);
                              setShowDeleteOptions(false);
                              setShowEventInfoModal(false);
                              await Promise.all([
                                queryClient.invalidateQueries({ queryKey: ['multipleCalendarEvents'] }),
                                queryClient.invalidateQueries({ queryKey: ['calendarEvents'] })
                              ]);
                              alert('✅ Serie completa eliminada correctamente');
                            } catch (error) {
                              console.error('Error eliminando serie:', error);
                              alert('Error al eliminar la serie');
                            }
                          }
                        }}
                        className="px-3 py-2 bg-red-500 hover:bg-red-600 text-white text-sm rounded-lg transition-colors flex items-center justify-center gap-2"
                      >
                        <Trash2 className="w-4 h-4" />
                        Eliminar toda la serie
                      </button>
                    </div>
                  ) : selectedEventInfo.recurring ? (
                    <button
                      onClick={async () => {
                        if (confirm('¿Eliminar TODA la serie de eventos recurrentes?\n\nEsto eliminará todas las instancias virtuales.')) {
                          try {
                            await CalendarEventService.deleteRecurringSeries(selectedEventInfo.id);
                            setShowDeleteOptions(false);
                            setShowEventInfoModal(false);
                            await Promise.all([
                              queryClient.invalidateQueries({ queryKey: ['multipleCalendarEvents'] }),
                              queryClient.invalidateQueries({ queryKey: ['calendarEvents'] })
                            ]);
                            alert('✅ Serie eliminada correctamente');
                          } catch (error) {
                            console.error('Error eliminando serie:', error);
                            alert('Error al eliminar la serie');
                          }
                        }
                      }}
                      className="w-full px-3 py-2 bg-red-500 hover:bg-red-600 text-white text-sm rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      Eliminar serie completa
                    </button>
                  ) : (
                    <button
                      onClick={async () => {
                        if (confirm('¿Eliminar este evento?')) {
                          try {
                            await CalendarEventService.deleteEvent(selectedEventInfo.id);
                            setShowDeleteOptions(false);
                            setShowEventInfoModal(false);
                            queryClient.invalidateQueries({ queryKey: ['multipleCalendarEvents'] });
                            alert('✅ Evento eliminado correctamente');
                          } catch (error) {
                            console.error('Error eliminando evento:', error);
                            alert('Error al eliminar el evento');
                          }
                        }
                      }}
                      className="w-full px-3 py-2 bg-red-500 hover:bg-red-600 text-white text-sm rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      Eliminar evento
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Cuerpo del modal */}
            <div className="p-6 space-y-4 overflow-y-auto max-h-[calc(90vh-300px)]">
                {/* Información de fecha y hora */}
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center flex-shrink-0">
                      <CalendarIcon className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-700">Fecha y hora</p>
                      <p className="text-gray-900 font-semibold">
                        {selectedEventInfo.startDate.toLocaleDateString('es-ES', {
                          weekday: 'long',
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric'
                        })}
                      </p>
                      <p className="text-sm text-gray-600">
                        {selectedEventInfo.startDate.toLocaleTimeString('es-ES', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                        {selectedEventInfo.endDate && (
                          <> - {selectedEventInfo.endDate.toLocaleTimeString('es-ES', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}</>
                        )}
                        {selectedEventInfo.duration && selectedEventInfo.duration > 0 && (
                          <span className="ml-2 text-xs text-gray-500">
                            ({Math.floor(selectedEventInfo.duration / 60)}h {selectedEventInfo.duration % 60}min)
                          </span>
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Ubicación */}
                  {selectedEventInfo.location && (
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center flex-shrink-0">
                        <MapPin className="w-5 h-5 text-green-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-700">Ubicación</p>
                        <p className="text-gray-900">{selectedEventInfo.location}</p>
                        <LocationMapPreview query={selectedEventInfo.location} className="mt-3" />
                      </div>
                    </div>
                  )}

                  {/* Descripción */}
                  {selectedEventInfo.description && (
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center flex-shrink-0">
                        <MessageCircle className="w-5 h-5 text-purple-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-700">Descripción</p>
                        <p className="text-gray-900 whitespace-pre-wrap">{selectedEventInfo.description}</p>
                      </div>
                    </div>
                  )}

                  {/* Profesional asignado */}
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center flex-shrink-0">
                      <User className="w-5 h-5 text-orange-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-700">Profesional</p>
                      <div className="flex items-center gap-2 mt-1">
                        {getProfessionalAvatar(selectedEventInfo.calendarId) ? (
                          <img
                            src={getProfessionalAvatar(selectedEventInfo.calendarId)!}
                            alt={getProfessionalName(selectedEventInfo.calendarId)}
                            className="w-8 h-8 rounded-full object-cover border-2"
                            style={{ borderColor: getCalendarColor(selectedEventInfo.calendarId) }}
                          />
                        ) : (
                          <div
                            className="w-8 h-8 rounded-full flex items-center justify-center"
                            style={{
                              backgroundColor: getCalendarColor(selectedEventInfo.calendarId) + '20',
                              borderColor: getCalendarColor(selectedEventInfo.calendarId),
                              borderWidth: '2px'
                            }}
                          >
                            <User className="w-4 h-4" style={{ color: getCalendarColor(selectedEventInfo.calendarId) }} />
                          </div>
                        )}
                        <span className="text-gray-900 font-medium">
                          {getProfessionalName(selectedEventInfo.calendarId)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Campos personalizados (custom fields) */}
                  {selectedEventInfo.customFieldsData && Object.keys(selectedEventInfo.customFieldsData).length > 0 && (
                    <>
                      <div className="pt-4 border-t border-gray-200">
                        <h4 className="text-sm font-semibold text-gray-900 mb-3">Información Adicional</h4>
                        <div className="space-y-3">
                          {Object.entries(selectedEventInfo.customFieldsData).map(([fieldId, value]) => {
                            // Buscar el campo en globalCustomFields para obtener su label
                            const field = globalCustomFields.find(f => f.id === fieldId);
                            if (!field || !value) return null;

                            return (
                              <div key={fieldId} className="flex items-start gap-3">
                                <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/20 flex items-center justify-center flex-shrink-0">
                                  <Settings className="w-5 h-5 text-indigo-600" />
                                </div>
                                <div className="flex-1">
                                  <p className="text-sm font-medium text-gray-700">{field.label}</p>
                                  <p className="text-gray-900 break-words">
                                    {field.type === 'url' ? (
                                      <a
                                        href={value as string}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-blue-600 hover:underline flex items-center gap-1"
                                      >
                                        {value as string}
                                        <ExternalLink className="w-3 h-3" />
                                      </a>
                                    ) : field.type === 'tel' ? (
                                      <a
                                        href={`tel:${value}`}
                                        className="text-blue-600 hover:underline"
                                      >
                                        {value as string}
                                      </a>
                                    ) : field.type === 'email' ? (
                                      <a
                                        href={`mailto:${value}`}
                                        className="text-blue-600 hover:underline"
                                      >
                                        {value as string}
                                      </a>
                                    ) : (
                                      String(value)
                                    )}
                                  </p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Footer con acciones */}
              <div className="p-6 bg-gray-50 border-t border-gray-200 space-y-4">
                <div className="flex flex-col sm:flex-row gap-3">
                  {/* Botón marcar como completado */}
                  <button
                    onClick={async () => {
                      await handleMarkServiceStatus(selectedEventInfo, 'completed');
                    }}
                    disabled={updatingServiceStatus === selectedEventInfo.id || selectedEventInfo.serviceStatus === 'completed'}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {updatingServiceStatus === selectedEventInfo.id ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <CheckCircle2 className="w-5 h-5" />
                    )}
                    {selectedEventInfo.serviceStatus === 'completed' ? 'Completado' : 'Marcar Completado'}
                  </button>

                  {/* Botón marcar como no realizado */}
                  <button
                    onClick={async () => {
                      await handleMarkServiceStatus(selectedEventInfo, 'not_done');
                    }}
                    disabled={updatingServiceStatus === selectedEventInfo.id || selectedEventInfo.serviceStatus === 'not_done'}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {updatingServiceStatus === selectedEventInfo.id ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <XCircle className="w-5 h-5" />
                    )}
                    {selectedEventInfo.serviceStatus === 'not_done' ? 'No Realizado' : 'Marcar No Realizado'}
                  </button>
                </div>

                {/* Info de completado */}
                {selectedEventInfo.completedAt && selectedEventInfo.serviceStatus === 'completed' && (
                  <p className="text-xs text-gray-500 text-center mt-3">
                    Completado el {selectedEventInfo.completedAt.toLocaleDateString('es-ES')} a las{' '}
                    {selectedEventInfo.completedAt.toLocaleTimeString('es-ES', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default DashboardBookings;
