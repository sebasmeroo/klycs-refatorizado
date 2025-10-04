import React, { useState, useEffect } from 'react';
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
  Shield
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import {
  SharedCalendar,
  CalendarEvent,
  EventComment,
  CalendarStats,
  CalendarState,
  CalendarView
} from '@/types/calendar';
import {
  CollaborativeCalendarService,
  CalendarEventService,
  EventCommentService,
  CalendarStatsService
} from '@/services/collaborativeCalendar';
import { CreateCalendarModal } from '@/components/calendar/CreateCalendarModal';
import { createDemoCalendarData, getDemoStats } from '@/utils/calendarDemoData';
import { useUserCalendars, useMultipleCalendarEvents } from '@/hooks/useCalendar';
import { useEventComments, useAddEventComment } from '@/hooks/useEventComments';

// ===== TIPOS AUXILIARES =====

interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  events: CalendarEvent[];
  dayNumber: number;
}

// ===== COMPONENTE PRINCIPAL =====

export const Bookings: React.FC = () => {
  const { user } = useAuth();

  // ===== ESTADO =====
  const [calendarState, setCalendarState] = useState<CalendarState>({
    currentDate: new Date(),
    view: 'month',
    selectedCalendars: [],
    isCreatingEvent: false,
    isEditingEvent: false
  });

  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

  // UI State
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showCreateCalendar, setShowCreateCalendar] = useState(false);
  const [showCreateEvent, setShowCreateEvent] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [newComment, setNewComment] = useState('');

  // ✅ React Query - Carga calendarios con cache de 5 minutos
  const { data: calendarsData, isLoading: calendarsLoading } = useUserCalendars(user?.uid);
  const calendars = calendarsData || [];

  // ✅ React Query - Carga eventos con cache de 5 minutos
  const calendarIds = calendarState.selectedCalendars.length > 0
    ? calendarState.selectedCalendars
    : calendars.map(c => c.id);

  const { data: eventsData } = useMultipleCalendarEvents(
    calendarIds,
    calendarState.currentDate
  );
  const events = eventsData || [];

  // ✅ React Query - Comentarios del evento seleccionado
  const { data: eventCommentsData = [] } = useEventComments(selectedEvent?.id);
  const eventComments = eventCommentsData;
  const addEventCommentMutation = useAddEventComment();

  // Stats (usar demo por ahora hasta crear hook)
  const [stats, setStats] = useState<CalendarStats | null>(null);

  // ===== EFECTOS =====

  // Inicializar stats y selección de calendarios
  useEffect(() => {
    if (!user?.id) return;

    // Stats demo
    setStats(getDemoStats());

    // Seleccionar todos los calendarios cuando carguen
    if (calendars.length > 0 && calendarState.selectedCalendars.length === 0) {
      setCalendarState(prev => ({
        ...prev,
        selectedCalendars: calendars.map(c => c.id)
      }));
    }
  }, [user?.id, calendars, calendarState.selectedCalendars.length]);

  // ===== FUNCIONES AUXILIARES =====
  
  const generateCalendarDays = (): CalendarDay[] => {
    const currentDate = calendarState.currentDate;
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
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
  
  const toggleCalendarVisibility = (calendarId: string) => {
    setCalendarState(prev => ({
      ...prev,
      selectedCalendars: prev.selectedCalendars.includes(calendarId)
        ? prev.selectedCalendars.filter(id => id !== calendarId)
        : [...prev.selectedCalendars, calendarId]
    }));
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
  
  const addComment = async () => {
    if (!selectedEvent || !newComment.trim() || !user?.id) return;

    // ✅ Firebase real con React Query
    try {
      await addEventCommentMutation.mutateAsync({
        eventId: selectedEvent.id,
        userId: user.id,
        userName: user.name || 'Usuario',
        content: newComment.trim()
      });
      setNewComment('');
    } catch (error) {
      console.error('Error al añadir comentario:', error);
    }
  };

  // ===== COMPONENTES =====
  
  const CalendarSidebar = () => (
    <div className={`bg-white border-r border-gray-200 transition-all duration-300 ${
      sidebarOpen ? 'w-72' : 'w-0'
    } overflow-hidden`}>
      <div className="p-4 space-y-4">
        {/* Header del sidebar */}
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Lista de calendarios</h2>
          <button
            onClick={() => setShowCreateCalendar(true)}
            className="p-1.5 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
        
        {/* Lista de calendarios */}
        <div className="space-y-2">
          {calendars.map(calendar => (
            <div key={calendar.id} className="group">
              <div className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50">
                <div className="flex items-center space-x-2 flex-1">
                  <button
                    onClick={() => toggleCalendarVisibility(calendar.id)}
                    className="relative"
                  >
                    {calendarState.selectedCalendars.includes(calendar.id) ? (
                      <Eye className="w-4 h-4 text-gray-600" />
                    ) : (
                      <EyeOff className="w-4 h-4 text-gray-400" />
                    )}
                  </button>
                  
                  <div 
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: calendar.color }}
                  />
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-1">
                      <span className="text-sm font-medium text-gray-900 truncate">
                        {calendar.name}
                      </span>
                      {calendar.ownerId === user?.id && (
                        <Crown className="w-3 h-3 text-yellow-500" />
                      )}
                    </div>
                    <p className="text-xs text-gray-500">
                      {calendar.members.length} miembro{calendar.members.length > 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
                
                <button 
                  onClick={() => {/* Abrir menú del calendario */}}
                  className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-gray-600 rounded transition-all"
                >
                  <MoreVertical className="w-4 h-4" />
                </button>
              </div>
              
              {/* Miembros del calendario */}
              {calendarState.selectedCalendars.includes(calendar.id) && (
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
          ))}
        </div>
        
        {/* Botón crear nuevo calendario */}
        <button
          onClick={() => setShowCreateCalendar(true)}
          className="w-full p-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-green-400 hover:text-green-600 transition-colors flex items-center justify-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span className="text-sm font-medium">Crear nuevo calendario</span>
        </button>
      </div>
    </div>
  );

  const CalendarGrid = () => {
    const days = generateCalendarDays();
    const weekDays = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Header con días de la semana */}
        <div className="grid grid-cols-7 border-b border-gray-200">
          {weekDays.map(day => (
            <div key={day} className="p-3 text-center">
              <span className="text-sm font-medium text-gray-600">{day}</span>
            </div>
          ))}
        </div>

        {/* Grid de días */}
        <div className="grid grid-cols-7">
          {days.map((day, index) => (
            <div
              key={index}
              className={`relative min-h-[100px] p-2 border-r border-b border-gray-100 hover:bg-gray-50 cursor-pointer ${
                !day.isCurrentMonth ? 'bg-gray-50/50' : ''
              } ${day.isToday ? 'bg-blue-50' : ''}`}
              onClick={() => setShowCreateEvent(true)}
            >
              {/* Número del día */}
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
                {day.isToday && (
                  <div className="w-2 h-2 bg-blue-500 rounded-full" />
                )}
              </div>
              
              {/* Eventos del día */}
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
  };

  // Modal de evento con chat
  const EventModal = () => {
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
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar de calendarios */}
      <CalendarSidebar />
      
      {/* Contenido principal */}
      <div className="flex-1 flex flex-col overflow-hidden">
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
                
                <h1 className="text-xl font-bold text-gray-900 min-w-[200px] text-center">
                  {formatMonthYear(calendarState.currentDate)}
                </h1>
                
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
                onClick={() => setShowCreateEvent(true)}
                className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>Evento</span>
              </button>
          </div>
        </div>
      </div>

        {/* Área del calendario */}
        <div className="flex-1 p-6 overflow-auto">
          {calendarState.view === 'month' ? (
            <CalendarGrid />
          ) : (
            <div className="bg-white rounded-xl p-8 text-center">
              <p className="text-gray-500">Vista semanal en desarrollo...</p>
                  </div>
          )}
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

      {/* Modal de evento con chat */}
      {selectedEvent && <EventModal />}
      
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
      <button
        onClick={() => setShowCreateEvent(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-green-500 hover:bg-green-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all flex items-center justify-center z-40"
      >
        <Plus className="w-6 h-6" />
      </button>
    </div>
  );
};