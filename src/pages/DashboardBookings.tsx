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
  User
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
import { doc, updateDoc, Timestamp } from 'firebase/firestore';
import { db, storage } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { ImageCompressionService } from '@/services/imageCompression';

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
  
  // ===== ESTADO =====
  const [calendarState, setCalendarState] = useState<CalendarState>({
    currentDate: new Date(),
    view: 'month',
    selectedCalendars: [GENERAL_CALENDAR_ID],
    isCreatingEvent: false,
    isEditingEvent: false
  });
  
  const [calendars, setCalendars] = useState<SharedCalendar[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [stats, setStats] = useState<CalendarStats | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [eventComments, setEventComments] = useState<EventComment[]>([]);
  const [calendarUsers, setCalendarUsers] = useState<CalendarUser[]>([]);
  const [showAddProfessional, setShowAddProfessional] = useState(false);
  const [newProfessionalName, setNewProfessionalName] = useState('');
  const [newProfessionalEmail, setNewProfessionalEmail] = useState('');
  const [newProfessionalColor, setNewProfessionalColor] = useState(PROFESSIONAL_COLOR_PALETTE[0]);
  const [nextColorIndex, setNextColorIndex] = useState(0);
  const [isCreatingProfessional, setIsCreatingProfessional] = useState(false);
  const professionalNameInputRef = useRef<HTMLInputElement | null>(null);
  const professionalEmailInputRef = useRef<HTMLInputElement | null>(null);
  const eventTitleInputRef = useRef<HTMLInputElement | null>(null);
  
  // UI State
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showFormEditor, setShowFormEditor] = useState(false);
  const [showCreateEvent, setShowCreateEvent] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [newComment, setNewComment] = useState('');
  
  // Estados para crear eventos
  const [selectedProfessional, setSelectedProfessional] = useState<SharedCalendar | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [rightSidebarOpen, setRightSidebarOpen] = useState(false);
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
  const [showCalendarSettings, setShowCalendarSettings] = useState(false);
  const [globalCustomFields, setGlobalCustomFields] = useState<CustomEventField[]>([]);
  
  // Estados para editar eventos
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [showEditEventPanel, setShowEditEventPanel] = useState(false);
  const [editEventForm, setEditEventForm] = useState({
    title: '',
    description: '',
    startTime: '09:00',
    endTime: '10:00',
    location: '',
    hasEndTime: true
  });
  
  // Estados para ver todos los eventos de un día
  const [dayEventsView, setDayEventsView] = useState<{date: Date; events: CalendarEvent[]} | null>(null);
  const [showDayEventsPanel, setShowDayEventsPanel] = useState(false);

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
    color: ''
  });
  const [professionalAvatar, setProfessionalAvatar] = useState<string | null>(null);
  const [professionalAvatarFile, setProfessionalAvatarFile] = useState<File | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // ===== EFECTOS =====

  useEffect(() => {
    if (!user?.uid) return;
    
    // ✅ CARGAR DATOS REALES DE FIREBASE
    const loadRealData = async () => {
      try {
        const userCalendars = await CollaborativeCalendarService.getUserCalendars(user.uid);
        
        setCalendars(userCalendars);
        
        if (userCalendars.length > 0 && userCalendars[0].settings?.customFields) {
          setGlobalCustomFields(userCalendars[0].settings.customFields);
        }
        
        if (userCalendars.length > 0) {
          const calendarIds = userCalendars.map(cal => cal.id);
          try {
            const firebaseEvents = await CalendarEventService.getCalendarEvents(calendarIds);
            setEvents(firebaseEvents);
          } catch (error) {
            console.error('❌ Error cargando eventos:', error);
            setEvents([]);
          }
        } else {
          setEvents([]);
        }
        
        // Estadísticas básicas
        setStats({
          totalEvents: 0,
          totalCalendars: userCalendars.length,
          sharedCalendars: userCalendars.length,
          collaborators: 1,
          upcomingEvents: 0,
          eventsThisMonth: 0,
          eventsThisWeek: 0,
          mostActiveCalendar: 'Calendario General'
        });
        
        // Por defecto, mostrar vista general
        setCalendarState(prev => ({
          ...prev,
          selectedCalendars: [GENERAL_CALENDAR_ID]
        }));
        
        setNextColorIndex(userCalendars.length);

        // ✅ AUTO-LIMPIAR DUPLICADOS SI EXISTEN
        if (userCalendars.length > 1) {
          const emailCounts: { [email: string]: number } = {};
          userCalendars.forEach(cal => {
            if (cal.linkedEmail) {
              emailCounts[cal.linkedEmail] = (emailCounts[cal.linkedEmail] || 0) + 1;
            }
          });
          
          const hasDuplicates = Object.values(emailCounts).some(count => count > 1);
          if (hasDuplicates) {
            setTimeout(async () => {
              try {
                const result = await ProfessionalService.cleanDuplicateCalendars(user.uid);
                
                // Recargar después de limpiar
                if (result.cleaned > 0) {
                  const cleanedCalendars = await CollaborativeCalendarService.getUserCalendars(user.uid);
                  setCalendars(cleanedCalendars);
                  alert(`🧹 Se eliminaron ${result.cleaned} calendarios duplicados automáticamente`);
                }
              } catch (error) {
                console.error('❌ Error en limpieza automática:', error);
              }
            }, 2000); // Delay para permitir que la UI se cargue
          }
        }
        
      } catch (error) {
        console.error('❌ Error cargando datos reales:', error);
        
        // Fallback: mostrar interfaz vacía
        setCalendars([]);
        setEvents([]);
        setStats({
          totalEvents: 0,
          totalCalendars: 0,
          sharedCalendars: 0,
          collaborators: 1,
          upcomingEvents: 0,
          eventsThisMonth: 0,
          eventsThisWeek: 0,
          mostActiveCalendar: ''
        });
      }
    };
    
    loadRealData();
  }, [user?.uid]);

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
    setShowAddProfessional(true);
  };

  const cancelAddProfessional = () => {
    setShowAddProfessional(false);
    setNewProfessionalName('');
    setNewProfessionalEmail('');
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
        }
      });
      

      // Recargar calendarios desde Firebase
      const allCalendars = await CollaborativeCalendarService.getUserCalendars(user.uid!);
      
      setCalendars(allCalendars);
      
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
      startTime,
      endTime,
      location: event.location || '',
      hasEndTime
    });
    
    // Cargar campos personalizados si existen
    if (event.customFieldsData) {
      setCustomFieldsData(event.customFieldsData);
    } else {
      setCustomFieldsData({});
    }
    
    // Cerrar modal de evento si estaba abierto
    setSelectedEvent(null);
  }, []);
  
  // Handler para cerrar panel de edición
  const closeEditEventPanel = useCallback(() => {
    setShowEditEventPanel(false);
    setEditingEvent(null);
    setEditEventForm({
      title: '',
      description: '',
      startTime: '09:00',
      endTime: '10:00',
      location: '',
      hasEndTime: true
    });
    setCustomFieldsData({});
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
  
  const handleCreateEvent = useCallback(async () => {
    if (!selectedDate || !selectedProfessional || !newEventForm.title.trim()) {
      alert('Por favor completa todos los campos requeridos');
      return;
    }

    if (!user?.uid) {
      alert('Error: Usuario no autenticado');
      return;
    }
    
    try {
      
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
      if (recurrence && recurrence.type !== 'none') {
        eventDataToSend.recurring = recurrence;
      }

      // Agregar campos personalizados si existen
      if (Object.keys(customFieldsData).length > 0) {
        eventDataToSend.customFieldsData = { ...customFieldsData };
      }


      const eventId = await CalendarEventService.createEvent(selectedProfessional.id, eventDataToSend);
      
      
      // ✅ RECARGAR EVENTOS DESDE FIREBASE para mostrar el nuevo evento
      try {
        const calendarIds = calendars.map(cal => cal.id);
        const updatedEvents = await CalendarEventService.getCalendarEvents(calendarIds);
        setEvents(updatedEvents);
      } catch (error) {
        console.error('❌ Error recargando eventos:', error);
        
        // Fallback: crear evento local si falla la recarga
        const newEvent: CalendarEvent = {
          id: eventId,
          calendarId: selectedProfessional.id,
          title: newEventForm.title.trim(),
          description: eventDataToSend.description || undefined,
          startDate: startDateTime,
          endDate: endDateTime,
          isAllDay: false,
          hasEndTime: newEventForm.hasEndTime,
          duration: eventDurationMinutes,
          location: eventDataToSend.location || undefined,
          color: selectedProfessional.color,
          createdBy: user.uid,
          attendees: [user.uid],
          comments: [],
          attachments: [],
          status: 'confirmed',
          visibility: 'public',
          reminders: [],
          customFieldsData: Object.keys(customFieldsData).length > 0 ? { ...customFieldsData } : undefined,
          createdAt: new Date(),
          updatedAt: new Date()
        };

        setEvents(prev => [...prev, newEvent]);
      }
      
      closeCreateEventPanel();
      alert(`✅ Evento "${newEventForm.title}" guardado correctamente en Firebase`);
      
    } catch (error) {
      console.error('❌ Error creando evento:', error);
      alert(`❌ Error al crear evento: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  }, [selectedDate, selectedProfessional, newEventForm, user?.uid, calendars, closeCreateEventPanel]);
  
  // Handler para actualizar evento
  const handleUpdateEvent = useCallback(async () => {
    if (!editingEvent || !editEventForm.title.trim()) {
      alert('Por favor completa todos los campos requeridos');
      return;
    }

    try {
      
      const startDateTime = new Date(editingEvent.startDate);
      const [startHour, startMinute] = editEventForm.startTime.split(':').map(Number);
      startDateTime.setHours(startHour, startMinute, 0, 0);
      
      const updates: any = {
        title: editEventForm.title.trim(),
        startDate: startDateTime,
        hasEndTime: editEventForm.hasEndTime,
        updatedAt: new Date()
      };
      
      // Solo agregar endDate si se especificó hora de fin
      let endDateTime: Date | undefined;
      let eventDurationMinutes: number | undefined;

      if (editEventForm.hasEndTime) {
        endDateTime = new Date(editingEvent.startDate);
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


      await CalendarEventService.updateEvent(editingEvent.id, updates);
      
      
      // Recargar eventos desde Firebase
      const calendarIds = calendars.map(cal => cal.id);
      const updatedEvents = await CalendarEventService.getCalendarEvents(calendarIds);
      setEvents(updatedEvents);
      
      closeEditEventPanel();
      alert(`✅ Evento "${editEventForm.title}" actualizado correctamente`);
      
    } catch (error) {
      console.error('❌ Error actualizando evento:', error);
      alert(`❌ Error al actualizar evento: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  }, [editingEvent, editEventForm, customFieldsData, calendars, closeEditEventPanel]);
  
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
      setEditingProfessional({ ...professional, calendarId: calendar.id });
      setEditProfessionalForm({
        name: professional.name || calendar.name,
        role: professional.role || '',
        color: calendar.color
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
      await updateDoc(calendarRef, {
        name: `Calendario de ${editProfessionalForm.name.trim()}`,
        color: editProfessionalForm.color,
        members: updatedMembers,
        updatedAt: Timestamp.now()
      });


      // RECARGAR CALENDARIOS DESDE FIREBASE para asegurar sincronización
      if (user?.uid) {
        const updatedCalendars = await CollaborativeCalendarService.getUserCalendars(user.uid);
        setCalendars(updatedCalendars);

        // También recargar eventos para actualizar las referencias
        const calendarIds = updatedCalendars.map(cal => cal.id);
        const updatedEvents = await CalendarEventService.getCalendarEvents(calendarIds);
        setEvents(updatedEvents);
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
      
      // Recargar calendarios
      const userCalendars = await CollaborativeCalendarService.getUserCalendars(user.uid);
      setCalendars(userCalendars);
      
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
                      openEditEventPanel(event);
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
            {selectedEvent.recurring && !selectedEvent.isRecurringInstance ? (
              // Es el evento padre - opción de eliminar toda la serie
              <button
                onClick={async () => {
                  if (confirm('¿Eliminar TODA la serie de eventos recurrentes?\n\nEsto eliminará todas las ocurrencias futuras.')) {
                    try {
                      await CalendarEventService.deleteRecurringSeries(selectedEvent.id);
                      setSelectedEvent(null);
                      // Recargar eventos
                      const calendarIds = calendars.map(cal => cal.id);
                      const updatedEvents = await CalendarEventService.getCalendarEvents(calendarIds);
                      setEvents(updatedEvents);
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
            ) : selectedEvent.isRecurringInstance ? (
              // Es una instancia - tres opciones: solo esta, desde aquí, o toda la serie
              <div className="space-y-2">
                <button
                  onClick={async () => {
                    if (confirm('¿Eliminar solo este evento?\n\nLos demás eventos de la serie se mantendrán.')) {
                      try {
                        await CalendarEventService.deleteEvent(selectedEvent.id);
                        setSelectedEvent(null);
                        // Recargar eventos
                        const calendarIds = calendars.map(cal => cal.id);
                        const updatedEvents = await CalendarEventService.getCalendarEvents(calendarIds);
                        setEvents(updatedEvents);
                      } catch (error) {
                        console.error('Error eliminando evento:', error);
                        alert('Error al eliminar el evento');
                      }
                    }
                  }}
                  className="w-full px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors flex items-center justify-center space-x-2"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Eliminar solo este evento</span>
                </button>
                <button
                  onClick={async () => {
                    const eventDate = selectedEvent.startDate.toLocaleDateString('es-ES');
                    if (confirm(`¿Eliminar desde este evento hacia adelante?\n\nSe eliminarán desde ${eventDate} en adelante.\nEl historial anterior se mantendrá.`)) {
                      try {
                        await CalendarEventService.deleteRecurringSeriesFromDate(
                          selectedEvent.parentEventId!,
                          selectedEvent.startDate
                        );
                        setSelectedEvent(null);
                        // Recargar eventos
                        const calendarIds = calendars.map(cal => cal.id);
                        const updatedEvents = await CalendarEventService.getCalendarEvents(calendarIds);
                        setEvents(updatedEvents);
                      } catch (error) {
                        console.error('Error eliminando serie desde fecha:', error);
                        alert('Error al eliminar los eventos desde esta fecha');
                      }
                    }
                  }}
                  className="w-full px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg transition-colors flex items-center justify-center space-x-2"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Eliminar desde aquí →</span>
                </button>
                <button
                  onClick={async () => {
                    if (confirm('¿Eliminar TODA la serie de eventos?\n\nEsto eliminará TODAS las ocurrencias, incluyendo el historial.')) {
                      try {
                        await CalendarEventService.deleteRecurringSeries(selectedEvent.parentEventId!);
                        setSelectedEvent(null);
                        // Recargar eventos
                        const calendarIds = calendars.map(cal => cal.id);
                        const updatedEvents = await CalendarEventService.getCalendarEvents(calendarIds);
                        setEvents(updatedEvents);
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
              </div>
            ) : (
              // Evento normal - solo eliminar este
              <button
                onClick={async () => {
                  if (confirm('¿Eliminar este evento?')) {
                    try {
                      await CalendarEventService.deleteEvent(selectedEvent.id);
                      setSelectedEvent(null);
                      // Recargar eventos
                      const calendarIds = calendars.map(cal => cal.id);
                      const updatedEvents = await CalendarEventService.getCalendarEvents(calendarIds);
                      setEvents(updatedEvents);
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
              disabled={!newEventForm.title.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Crear Evento</span>
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
                    setCalendars(prev => prev.map(calendar => ({
                      ...calendar,
                      settings: {
                        ...calendar.settings,
                        customFields: sanitizedFields
                      },
                      updatedAt: new Date()
                    })));

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
              </div>

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
                      closeDayEventsPanel();
                      openEditEventPanel(event);
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
                    
                    <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
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

    </div>
  );
};

export default DashboardBookings;
