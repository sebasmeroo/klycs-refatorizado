import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { 
  Calendar as CalendarIcon, 
  ArrowLeft, 
  Clock, 
  MapPin,
  User,
  Mail,
  Phone,
  Home,
  Plus,
  ChevronLeft,
  ChevronRight,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { CollaborativeCalendarService, CalendarEventService } from '@/services/collaborativeCalendar';
import { SharedCalendar, CalendarEvent } from '@/types/calendar';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths } from 'date-fns';
import { es } from 'date-fns/locale';

export const ProfessionalCalendar: React.FC = () => {
  const { calendarId } = useParams<{ calendarId: string }>();
  const [searchParams] = useSearchParams();
  const professionalEmail = searchParams.get('email');

  // ===== ESTADO =====
  const [calendar, setCalendar] = useState<SharedCalendar | null>(null);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // ===== EFECTOS =====
  useEffect(() => {
    if (!calendarId) return;
    
    loadCalendarData();
  }, [calendarId]);

  useEffect(() => {
    if (!calendar) return;
    loadEvents();
  }, [calendar, currentDate]);

  // ===== FUNCIONES =====
  const loadCalendarData = async () => {
    try {
      setLoading(true);
      console.log('🔄 Cargando datos del calendario:', calendarId);
      
      const calendarData = await CollaborativeCalendarService.getCalendarById(calendarId!);
      
      if (!calendarData) {
        setError('Calendario no encontrado');
        return;
      }

      if (calendarData.linkedEmail !== professionalEmail) {
        setError('No tienes permiso para acceder a este calendario');
        return;
      }

      setCalendar(calendarData);
      console.log('✅ Calendario cargado:', calendarData.name);
      
    } catch (err) {
      console.error('❌ Error cargando calendario:', err);
      setError('Error al cargar el calendario');
    } finally {
      setLoading(false);
    }
  };

  const loadEvents = async () => {
    try {
      console.log('📅 PROFESSIONAL CALENDAR: Cargando eventos...');
      console.log('📋 PROFESSIONAL CALENDAR: ID del calendario:', calendar!.id);
      console.log('📧 PROFESSIONAL CALENDAR: Email profesional:', professionalEmail);
      console.log('📅 PROFESSIONAL CALENDAR: Fecha actual:', currentDate);
      
      const startDate = startOfMonth(currentDate);
      const endDate = endOfMonth(currentDate);
      
      console.log('📅 PROFESSIONAL CALENDAR: Rango de fechas:', {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      });
      
      console.log('🚀 PROFESSIONAL CALENDAR: Llamando a CalendarEventService.getCalendarEvents...');
      const calendarEvents = await CalendarEventService.getCalendarEvents(
        [calendar!.id],
        startDate,
        endDate
      );
      
      console.log('✅ PROFESSIONAL CALENDAR: Eventos recibidos:', calendarEvents.length);
      console.log('📄 PROFESSIONAL CALENDAR: Detalles de eventos:', calendarEvents.map(event => ({
        id: event.id,
        title: event.title,
        startDate: event.startDate,
        calendarId: event.calendarId
      })));
      
      setEvents(calendarEvents);
      console.log('✅ PROFESSIONAL CALENDAR: Estado de eventos actualizado');
      
    } catch (err) {
      console.error('❌ PROFESSIONAL CALENDAR: Error cargando eventos:', err);
      console.error('🔥 PROFESSIONAL CALENDAR: Error completo:', {
        name: (err as any)?.name,
        message: (err as any)?.message,
        code: (err as any)?.code,
        stack: (err as any)?.stack
      });
    }
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => 
      direction === 'next' ? addMonths(prev, 1) : subMonths(prev, 1)
    );
  };

  const getDayEvents = (date: Date) => {
    return events.filter(event => isSameDay(event.startDate, date));
  };

  const generateCalendarDays = () => {
    const start = startOfMonth(currentDate);
    const end = endOfMonth(currentDate);
    return eachDayOfInterval({ start, end });
  };

  // ===== RENDER =====
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin h-12 w-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
          <p className="text-gray-600">Cargando calendario...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center space-y-4 max-w-md mx-auto p-8">
          <div className="h-16 w-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
            <CalendarIcon className="h-8 w-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Error de Acceso</h2>
          <p className="text-gray-600">{error}</p>
          <Link to="/">
            <Button className="mt-4">
              <Home className="mr-2 h-4 w-4" />
              Volver al inicio
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ===== HEADER ===== */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <Link to="/">
                <Button variant="outline" size="sm">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Inicio
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {calendar?.name}
                </h1>
                <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                  <div className="flex items-center space-x-1">
                    <Mail className="h-4 w-4" />
                    <span>{professionalEmail}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* ===== CALENDARIO ===== */}
          <div className="lg:col-span-3">
            <Card className="p-6">
              {/* Header del calendario */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold capitalize">
                  {format(currentDate, 'MMMM yyyy', { locale: es })}
                </h2>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigateMonth('prev')}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentDate(new Date())}
                  >
                    Hoy
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigateMonth('next')}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Grid del calendario */}
              <div className="grid grid-cols-7 gap-px bg-gray-200 rounded-lg overflow-hidden">
                {/* Días de la semana */}
                {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map(day => (
                  <div
                    key={day}
                    className="bg-gray-50 px-3 py-2 text-center text-sm font-medium text-gray-900"
                  >
                    {day}
                  </div>
                ))}

                {/* Días del mes */}
                {generateCalendarDays().map((date, index) => {
                  const dayEvents = getDayEvents(date);
                  const isToday = isSameDay(date, new Date());
                  const isSelected = selectedDate && isSameDay(date, selectedDate);

                  return (
                    <div
                      key={index}
                      className={`
                        bg-white min-h-[100px] p-2 cursor-pointer hover:bg-gray-50 transition-colors
                        ${isToday ? 'bg-blue-50 border-2 border-blue-200' : ''}
                        ${isSelected ? 'bg-blue-100' : ''}
                      `}
                      onClick={() => setSelectedDate(date)}
                    >
                      <div className={`
                        text-sm font-medium mb-1
                        ${isToday ? 'text-blue-600' : ''}
                        ${!isSameMonth(date, currentDate) ? 'text-gray-400' : ''}
                      `}>
                        {format(date, 'd')}
                      </div>
                      
                      {/* Eventos del día */}
                      <div className="space-y-1">
                        {dayEvents.slice(0, 2).map(event => (
                          <div
                            key={event.id}
                            className="text-xs p-1 rounded truncate cursor-pointer hover:opacity-80"
                            style={{ backgroundColor: event.color + '20', color: event.color }}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedEvent(event);
                            }}
                          >
                            {event.title}
                          </div>
                        ))}
                        {dayEvents.length > 2 && (
                          <div className="text-xs text-gray-500">
                            +{dayEvents.length - 2} más
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>

          {/* ===== SIDEBAR ===== */}
          <div className="space-y-6">
            {/* Información del calendario */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Tu Calendario</h3>
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <div 
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: calendar?.color }}
                  ></div>
                  <span className="text-sm">{calendar?.name}</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <CalendarIcon className="h-4 w-4" />
                  <span>{events.length} eventos este mes</span>
                </div>
              </div>
            </Card>

            {/* Eventos del día seleccionado */}
            {selectedDate && (
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">
                  {format(selectedDate, 'dd MMMM yyyy', { locale: es })}
                </h3>
                <div className="space-y-3">
                  {getDayEvents(selectedDate).length === 0 ? (
                    <p className="text-sm text-gray-500">No hay eventos para este día</p>
                  ) : (
                    getDayEvents(selectedDate).map(event => (
                      <div
                        key={event.id}
                        className="p-3 rounded-lg border border-gray-200 hover:border-gray-300 cursor-pointer transition-colors"
                        onClick={() => setSelectedEvent(event)}
                      >
                        <h4 className="font-medium text-gray-900">{event.title}</h4>
                        <div className="flex items-center space-x-4 mt-2 text-xs text-gray-600">
                          <div className="flex items-center space-x-1">
                            <Clock className="h-3 w-3" />
                            <span>
                              {format(event.startDate, 'HH:mm')} - {format(event.endDate, 'HH:mm')}
                            </span>
                          </div>
                          {event.location && (
                            <div className="flex items-center space-x-1">
                              <MapPin className="h-3 w-3" />
                              <span>{event.location}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Modal de evento */}
      {selectedEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  {selectedEvent.title}
                </h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedEvent(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <Clock className="h-4 w-4" />
                  <span>
                    {format(selectedEvent.startDate, 'dd MMMM yyyy HH:mm', { locale: es })} - {format(selectedEvent.endDate, 'HH:mm')}
                  </span>
                </div>
                
                {selectedEvent.location && (
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <MapPin className="h-4 w-4" />
                    <span>{selectedEvent.location}</span>
                  </div>
                )}
                
                {selectedEvent.description && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Descripción</h4>
                    <p className="text-sm text-gray-600">{selectedEvent.description}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
