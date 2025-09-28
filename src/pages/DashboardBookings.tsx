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
  Edit3
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
import { CreateCalendarModal } from '@/components/calendar/CreateCalendarModal';
import { createDemoCalendarData, getDemoStats } from '@/utils/calendarDemoData';
import { authService } from '@/services/auth';
import { ProfessionalService } from '@/services/professionalService';

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
  const [showCreateCalendar, setShowCreateCalendar] = useState(false);
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
    location: ''
  });

  // Estados para editar nombre del equipo
  const [isEditingTeamName, setIsEditingTeamName] = useState(false);
  const [editingTeamName, setEditingTeamName] = useState('');
  const [isUpdatingTeamName, setIsUpdatingTeamName] = useState(false);

  // Estados para menú contextual de profesionales
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [editingProfessional, setEditingProfessional] = useState<any | null>(null);
  const [showEditProfessionalModal, setShowEditProfessionalModal] = useState(false);

  // ===== EFECTOS =====

  useEffect(() => {
    if (!user?.uid) return;
    
    // ✅ CARGAR DATOS REALES DE FIREBASE
    const loadRealData = async () => {
      try {
        console.log('🔄 Cargando calendarios reales desde Firebase...');
        
        // Cargar calendarios del usuario desde Firebase
        const userCalendars = await CollaborativeCalendarService.getUserCalendars(user.uid);
        console.log('📅 Calendarios encontrados:', userCalendars.length);
        
        setCalendars(userCalendars);
        
        // ✅ CARGAR EVENTOS DESDE FIREBASE
        if (userCalendars.length > 0) {
          console.log('📅 Cargando eventos desde Firebase...');
          const calendarIds = userCalendars.map(cal => cal.id);
          try {
            const firebaseEvents = await CalendarEventService.getCalendarEvents(calendarIds);
            console.log('🎉 Eventos cargados desde Firebase:', firebaseEvents.length);
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
        
        // Configurar índice de color para próximos profesionales
        setNextColorIndex(userCalendars.length);
        
        console.log('✅ Datos reales cargados exitosamente');

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
            console.log('🧹 Detectados calendarios duplicados, limpiando automáticamente...');
            setTimeout(async () => {
              try {
                const result = await ProfessionalService.cleanDuplicateCalendars(user.uid);
                console.log(`✅ Limpieza automática completada: ${result.cleaned} eliminados`);
                
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

  // ===== DEBUGGING RENDERS =====
  console.log('🔄 DashboardBookings RENDER - Timestamp:', Date.now());
  console.log('📊 Estado actual:', {
    showAddProfessional,
    rightSidebarOpen,
    newProfessionalName: newProfessionalName?.substring(0, 10) + '...',
    newProfessionalEmail: newProfessionalEmail?.substring(0, 10) + '...',
    eventTitle: newEventForm.title?.substring(0, 10) + '...',
    calendarsLength: calendars.length,
    eventsLength: events.length,
    selectedProfessionalId: selectedProfessional?.id || 'none'
  });

  // ===== HANDLERS MEMOIZADOS (para evitar re-renders que causen pérdida de focus) =====
  
  const handleProfessionalNameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('✏️ PROFESIONAL NAME CHANGE:', e.target.value);
    console.log('🎯 Focus element:', document.activeElement?.tagName, (document.activeElement as HTMLInputElement)?.type);
    setNewProfessionalName(e.target.value);
  }, []);

  const handleProfessionalEmailChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('✏️ PROFESIONAL EMAIL CHANGE:', e.target.value);
    console.log('🎯 Focus element:', document.activeElement?.tagName, (document.activeElement as HTMLInputElement)?.type);
    setNewProfessionalEmail(e.target.value);
  }, []);

  const handleEventTitleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('✏️ EVENT TITLE CHANGE:', e.target.value);
    console.log('🎯 Focus element:', document.activeElement?.tagName, (document.activeElement as HTMLInputElement)?.type);
    setNewEventForm(prev => ({ ...prev, title: e.target.value }));
  }, []);

  const handleEventDescriptionChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    console.log('✏️ EVENT DESCRIPTION CHANGE:', e.target.value?.substring(0, 20));
    console.log('🎯 Focus element:', document.activeElement?.tagName, (document.activeElement as HTMLInputElement)?.type);
    setNewEventForm(prev => ({ ...prev, description: e.target.value }));
  }, []);

  const handleEventLocationChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('✏️ EVENT LOCATION CHANGE:', e.target.value);
    console.log('🎯 Focus element:', document.activeElement?.tagName, (document.activeElement as HTMLInputElement)?.type);
    setNewEventForm(prev => ({ ...prev, location: e.target.value }));
  }, []);

  const handleEventStartTimeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('✏️ EVENT START TIME CHANGE:', e.target.value);
    console.log('🎯 Focus element:', document.activeElement?.tagName, (document.activeElement as HTMLInputElement)?.type);
    setNewEventForm(prev => ({ ...prev, startTime: e.target.value }));
  }, []);

  const handleEventEndTimeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('✏️ EVENT END TIME CHANGE:', e.target.value);
    console.log('🎯 Focus element:', document.activeElement?.tagName, (document.activeElement as HTMLInputElement)?.type);
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
    
    console.log('🎯 Iniciando handleAddProfessional');

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
      console.log('✅ Usuario puede agregar profesionales a su equipo');

    console.log('✅ Validaciones pasadas, procediendo...');
    setIsCreatingProfessional(true);

    try {
      console.log('🔍 Verificando si existe usuario con email:', newProfessionalEmail);
      
      // Verificar si ya existe un usuario con ese email
      const existingUser = await authService.getUserByEmail(newProfessionalEmail);
      if (existingUser) {
        console.error('❌ Usuario ya existe:', existingUser);
        alert('Ya existe un usuario con ese email');
        setIsCreatingProfessional(false);
        return;
      }

      console.log('✅ Email disponible, agregando profesional...');

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
      
      console.log('🎉 Profesional agregado con ID:', professionalId);

      // Recargar calendarios desde Firebase
      console.log('🔄 Recargando calendarios desde Firebase...');
      const allCalendars = await CollaborativeCalendarService.getUserCalendars(user.uid!);
      console.log('📅 Calendarios obtenidos:', allCalendars.length);
      
      setCalendars(allCalendars);
      
      // Limpiar formulario
      cancelAddProfessional();
      
      // Incrementar el índice de color
      setNextColorIndex(prev => prev + 1);

      console.log('✅ ¡Proceso completado exitosamente!');
      alert(`✅ Calendario para "${newProfessionalName}" creado correctamente.\n\n📧 El profesional debe registrarse con el email: ${newProfessionalEmail}`);

    } catch (error) {
      console.error('💥 ERROR COMPLETO:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      console.error('📝 Mensaje del error:', errorMessage);
      
      alert(`❌ Error al crear el profesional: ${errorMessage}`);
    } finally {
      console.log('🏁 Finalizando proceso...');
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
    setSelectedProfessional(professional || selectedProfessional);
    setRightSidebarOpen(true);

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
      location: ''
    });
  }, [selectedProfessional]);

  const closeCreateEventPanel = useCallback(() => {
    setRightSidebarOpen(false);
    setSelectedDate(null);
    setNewEventForm({
      title: '',
      description: '',
      startTime: '09:00',
      endTime: '10:00',
      location: ''
    });
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
      console.log('📅 Creando evento en Firebase...');
      
      const startDateTime = new Date(selectedDate);
      const [startHour, startMinute] = newEventForm.startTime.split(':').map(Number);
      startDateTime.setHours(startHour, startMinute, 0, 0);
      
      const endDateTime = new Date(selectedDate);
      const [endHour, endMinute] = newEventForm.endTime.split(':').map(Number);
      endDateTime.setHours(endHour, endMinute, 0, 0);
      
      // ✅ GUARDAR EN FIREBASE usando CalendarEventService (sin undefined)
      const eventDataToSend: any = {
        calendarId: selectedProfessional.id,
        title: newEventForm.title.trim(),
        startDate: startDateTime,
        endDate: endDateTime,
        isAllDay: false,
        color: selectedProfessional.color,
        createdBy: user.uid,
        attendees: [user.uid],
        comments: [],
        attachments: [],
        status: 'confirmed',
        visibility: 'public',
        reminders: []
      };

      // Solo agregar campos opcionales si tienen valor
      const description = newEventForm.description?.trim();
      if (description) {
        eventDataToSend.description = description;
      }

      const location = newEventForm.location?.trim();
      if (location) {
        eventDataToSend.location = location;
      }

      console.log('📤 Enviando evento a Firebase:', eventDataToSend);

      const eventId = await CalendarEventService.createEvent(selectedProfessional.id, eventDataToSend);
      
      console.log('✅ Evento creado en Firebase con ID:', eventId);
      
      // ✅ RECARGAR EVENTOS DESDE FIREBASE para mostrar el nuevo evento
      console.log('🔄 Recargando eventos desde Firebase...');
      try {
        const calendarIds = calendars.map(cal => cal.id);
        const updatedEvents = await CalendarEventService.getCalendarEvents(calendarIds);
        console.log('🎉 Eventos recargados:', updatedEvents.length);
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
          location: eventDataToSend.location || undefined,
          color: selectedProfessional.color,
          createdBy: user.uid,
          attendees: [user.uid],
          comments: [],
          attachments: [],
          status: 'confirmed',
          visibility: 'public',
          reminders: [],
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

  // ===== GESTIÓN DE NOMBRE DE EQUIPO =====
  
  const startEditingTeamName = () => {
    setEditingTeamName(user?.teamName || `Equipo de ${user?.displayName || 'Usuario'}`);
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

  const handleEditProfessional = (calendar: SharedCalendar) => {
    const professional = getProfessionalFromCalendar(calendar);
    if (professional) {
      setEditingProfessional({ ...professional, calendarId: calendar.id });
      setShowEditProfessionalModal(true);
    }
    setOpenMenuId(null);
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
    console.log('📊 SIDEBAR: Renderizando CalendarSidebar');
    
    const sortedCalendars = [...calendars].sort((a, b) =>
      a.name.localeCompare(b.name, 'es', { sensitivity: 'base' })
    );

    const generalSelected = calendarState.selectedCalendars.includes(GENERAL_CALENDAR_ID);
    const visibleCalendarIds = getVisibleCalendarIds();

  return (
      <div className={`bg-white border-r border-gray-200 transition-all duration-300 ${
        sidebarOpen ? 'w-80' : 'w-0'
      } overflow-hidden`}>
        <div className="p-4 space-y-6">
          {/* Calendario general */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-gray-900 flex items-center space-x-2">
                <CalendarIcon className="w-5 h-5 text-green-600" />
                <span>Calendario general</span>
              </h2>
               <button
                 onClick={() => selectCalendar(GENERAL_CALENDAR_ID)}
                 className={`p-1.5 rounded-lg transition-colors ${
                   generalSelected 
                     ? 'bg-green-100 text-green-600' 
                     : 'text-gray-600 hover:text-green-600 hover:bg-green-50'
                 }`}
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
                    <div className="absolute right-0 top-8 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10 min-w-[160px]">
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

          {/* Acceso a opciones avanzadas */}
                <button 
            onClick={() => setShowCreateCalendar(true)}
            className="w-full p-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-green-400 hover:text-green-600 transition-colors flex items-center justify-center space-x-2"
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
    toggleMenu
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
                                  setSelectedEvent(event);
                                }}
                                className="w-full text-left bg-blue-500/90 hover:bg-blue-600 text-white rounded-lg px-2 py-1 transition-colors shadow-sm"
                                style={{ backgroundColor: getCalendarColor(event.calendarId) }}
                              >
                                <div className="text-xs font-semibold truncate">{event.title}</div>
                                <div className="text-[10px] text-white/80">
                                  {event.startDate.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                                  {' - '}
                                  {event.endDate.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
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
                {day.events.slice(0, 3).map(event => (
                  <div
                    key={event.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedEvent(event);
                    }}
                    className="px-2 py-1 rounded text-xs font-medium text-white truncate cursor-pointer hover:opacity-80 transition-opacity"
                    style={{ backgroundColor: getCalendarColor(event.calendarId) }}
                  >
                    {event.title}
                  </div>
                ))}
                {day.events.length > 3 && (
                  <div className="text-xs text-gray-500 px-2">
                    +{day.events.length - 3} más
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
    getCalendarColor,
    setSelectedEvent,
    calendars,
    calendarState.selectedCalendars
  ]);

  // Modal de evento con chat  
  const eventModal = useMemo(() => {
    if (!selectedEvent) return null;
    
    const calendar = calendars.find(c => c.id === selectedEvent.calendarId);
    
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
  }, [selectedEvent, calendars, eventComments, newComment]);

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
                        
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Hora inicio
              </label>
              <input
                key="event-start-time-stable-input" 
                type="time"
                value={newEventForm.startTime}
                onChange={handleEventStartTimeChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
                          </div>
            
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
    handleCreateEvent,
    closeCreateEventPanel,
    handleEventTitleChange,
    handleEventStartTimeChange,
    handleEventEndTimeChange,
    handleEventDescriptionChange,
    handleEventLocationChange
  ]);

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar de calendarios */}
      {calendarSidebar}
      
      {/* Contenido principal */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header del equipo (editable) */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-200 px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Users className="w-5 h-5 text-blue-600" />
              
              {isEditingTeamName ? (
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={editingTeamName}
                    onChange={(e) => setEditingTeamName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') saveTeamName();
                      if (e.key === 'Escape') cancelEditingTeamName();
                    }}
                    className="px-3 py-1 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-blue-900 font-medium"
                    placeholder="Nombre del equipo"
                    disabled={isUpdatingTeamName}
                    autoFocus
                  />
            <button 
                    onClick={saveTeamName}
                    disabled={isUpdatingTeamName || !editingTeamName.trim()}
                    className="p-1 text-blue-600 hover:text-blue-800 disabled:opacity-50"
                  >
                    <CheckCircle className="w-4 h-4" />
                  </button>
                  <button
                    onClick={cancelEditingTeamName}
                    disabled={isUpdatingTeamName}
                    className="p-1 text-gray-500 hover:text-gray-700 disabled:opacity-50"
                  >
                    <XCircle className="w-4 h-4" />
                  </button>
              </div>
            ) : (
                <div className="flex items-center space-x-2">
                  <h2 className="text-lg font-semibold text-blue-900">
                    {user?.teamName || `Equipo de ${user?.displayName || 'Usuario'}`}
                  </h2>
                  <button
                    onClick={startEditingTeamName}
                    className="p-1 text-blue-600 hover:text-blue-800 transition-colors"
                    title="Editar nombre del equipo"
                  >
                    <Edit3 className="w-4 h-4" />
            </button>
          </div>
        )}
                        </div>
                        
            <div className="text-sm text-blue-700">
              {calendars.length} calendario{calendars.length !== 1 ? 's' : ''}
            </div>
          </div>
                </div>
                        
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
      
      {/* Modal crear calendario */}
      <CreateCalendarModal 
        isOpen={showCreateCalendar}
        onClose={() => setShowCreateCalendar(false)}
        onCalendarCreated={() => {
          // Recargar calendario se hará automáticamente por el subscription
          setShowCreateCalendar(false);
        }}
      />
      
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Editar información del profesional
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre
                </label>
                <input
                  type="text"
                  defaultValue={editingProfessional.name}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  defaultValue={editingProfessional.email}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
                  disabled
                />
                <p className="text-xs text-gray-500 mt-1">
                  El email no se puede modificar
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Especialidad/Rol
                </label>
                <input
                  type="text"
                  defaultValue={editingProfessional.role}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Color del calendario
                </label>
                <div className="flex space-x-2 mt-2">
                  {PROFESSIONAL_COLOR_PALETTE.slice(0, 8).map(color => (
                          <button 
                      key={color}
                      className={`w-8 h-8 rounded-full border-2 ${
                        editingProfessional.color === color ? 'border-gray-400' : 'border-gray-200'
                      }`}
                      style={{ backgroundColor: color }}
                      onClick={() => setEditingProfessional((prev: any) => ({ ...prev, color }))}
                    />
                  ))}
                </div>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowEditProfessionalModal(false);
                  setEditingProfessional(null);
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Cancelar
                          </button>
                      <button 
                onClick={() => {
                  alert('🚧 Función de editar profesional en desarrollo\n\n✅ La interfaz ya está lista, solo falta conectar con Firebase');
                  setShowEditProfessionalModal(false);
                  setEditingProfessional(null);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Guardar cambios
                      </button>
                    </div>
                  </div>
                </div>
            )}
    </div>
  );
};

export default DashboardBookings;
