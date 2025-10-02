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
  X,
  Link as LinkIcon,
  ExternalLink
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { CollaborativeCalendarService, CalendarEventService } from '@/services/collaborativeCalendar';
import { SharedCalendar, CalendarEvent } from '@/types/calendar';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, startOfWeek, endOfWeek } from 'date-fns';
import { es } from 'date-fns/locale';
import { useCalendar, useCalendarEvents } from '@/hooks/useCalendar';

export const ProfessionalCalendar: React.FC = () => {
  const { calendarId } = useParams<{ calendarId: string }>();
  const [searchParams] = useSearchParams();
  const professionalEmail = searchParams.get('email');

  // ===== REACT QUERY HOOKS =====
  const { data: calendar, isLoading: calendarLoading, error: calendarError } = useCalendar(calendarId);
  const { data: eventsData, isLoading: eventsLoading } = useCalendarEvents(calendarId);

  // ===== ESTADO =====
  const events = eventsData || [];
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const loading = calendarLoading || eventsLoading;
  const [error, setError] = useState('');

  // ===== EFECTOS =====

  // ✅ Validación de permisos (React Query maneja la carga)
  useEffect(() => {
    if (!calendar) return;

    if (calendar.linkedEmail !== professionalEmail) {
      setError('No tienes permiso para acceder a este calendario');
      return;
    }

    console.log('✅ Calendario cargado:', calendar.name);
    setError(''); // Limpiar errores si tiene acceso
  }, [calendar, professionalEmail]);

  useEffect(() => {
    if (calendarError) {
      setError('Calendario no encontrado');
    }
  }, [calendarError]);

  // ===== FUNCIONES =====

  // ❌ ELIMINADAS: loadCalendarData() y loadEvents()
  // ✅ React Query maneja automáticamente la carga y cache

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => 
      direction === 'next' ? addMonths(prev, 1) : subMonths(prev, 1)
    );
  };

  const getDayEvents = (date: Date) => {
    return events.filter(event => isSameDay(event.startDate, date));
  };

  const generateCalendarDays = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);

    // Alinear la grilla para que siempre empiece en domingo y termine en sábado
    const gridStart = startOfWeek(monthStart, { weekStartsOn: 0 });
    const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });

    return eachDayOfInterval({ start: gridStart, end: gridEnd });
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
              
              {/* Avatar del profesional */}
              {calendar && (() => {
                // 🔧 FIX: Si hay solo 1 member, devolverlo directamente
                // Si hay más, buscar por linkedEmail
                const member = calendar.members.length === 1
                  ? calendar.members[0]
                  : calendar.members.find(m => m.email === calendar.linkedEmail);
                
                return member?.avatar ? (
                  <img 
                    src={member.avatar} 
                    alt="Avatar"
                    className="w-12 h-12 rounded-full object-cover border-2 shadow-md"
                    style={{ borderColor: calendar.color }}
                  />
                ) : (
                  <div 
                    className="w-12 h-12 rounded-full flex items-center justify-center border-2"
                    style={{ 
                      backgroundColor: calendar?.color + '20',
                      borderColor: calendar?.color
                    }}
                  >
                    <User className="w-6 h-6" style={{ color: calendar?.color }} />
                  </div>
                );
              })()}
              
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
                              {format(event.startDate, 'HH:mm')}
                              {event.endDate && event.hasEndTime && ` - ${format(event.endDate, 'HH:mm')}`}
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

      {/* Modal de evento - Información Completa */}
      {selectedEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-start">
              <div className="flex-1">
                <h3 className="text-xl font-bold text-gray-900 mb-1">
                  {selectedEvent.title}
                </h3>
                {selectedEvent.isRecurringInstance && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                    Evento Recurrente
                  </span>
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedEvent(null)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Información Básica */}
              <div className="space-y-3">
                <h4 className="font-semibold text-gray-900 text-sm uppercase tracking-wide">
                  Información de la Cita
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Fecha y Hora */}
                  <div className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                    <Clock className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs font-medium text-gray-500 mb-1">Fecha y Hora</p>
                      <p className="text-sm font-medium text-gray-900">
                        {format(selectedEvent.startDate, 'dd MMMM yyyy', { locale: es })}
                      </p>
                      <p className="text-sm text-gray-600">
                        {format(selectedEvent.startDate, 'HH:mm')} 
                        {selectedEvent.endDate && selectedEvent.hasEndTime && 
                          ` - ${format(selectedEvent.endDate, 'HH:mm')}`
                        }
                      </p>
                      {selectedEvent.duration && selectedEvent.duration > 0 && (
                        <p className="text-xs text-gray-500 mt-1">
                          Duración: {selectedEvent.duration} minutos ({(selectedEvent.duration / 60).toFixed(1)}h)
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Ubicación */}
                  {selectedEvent.location && (
                    <div className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                      <MapPin className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-xs font-medium text-gray-500 mb-1">Ubicación</p>
                        <p className="text-sm text-gray-900">{selectedEvent.location}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Descripción */}
                {selectedEvent.description && (
                  <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg">
                    <h5 className="font-medium text-gray-900 mb-2 text-sm">Descripción</h5>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{selectedEvent.description}</p>
                  </div>
                )}
              </div>

              {/* Campos Personalizados */}
              {selectedEvent.customFieldsData && Object.keys(selectedEvent.customFieldsData).length > 0 && (
                <div className="space-y-3 border-t border-gray-200 pt-6">
                  <h4 className="font-semibold text-gray-900 text-sm uppercase tracking-wide">
                    Información Adicional del Cliente
                  </h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {calendar?.settings?.customFields?.map((field) => {
                      const value = selectedEvent.customFieldsData?.[field.id];
                      if (!value || !field.isVisible) return null;

                      // Determinar si el campo es un enlace
                      const isUrlField = field.type === 'url';
                      const isValidUrl = isUrlField && typeof value === 'string' && 
                        (value.startsWith('http://') || value.startsWith('https://') || value.startsWith('www.'));

                      return (
                        <div 
                          key={field.id} 
                          className="p-3 bg-gray-50 rounded-lg border border-gray-200"
                        >
                          <div className="flex items-start space-x-2">
                            {field.icon && (
                              <div className="mt-0.5 text-gray-500">
                                {isUrlField ? (
                                  <LinkIcon className="h-4 w-4" />
                                ) : (
                                  <User className="h-4 w-4" />
                                )}
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium text-gray-500 mb-1">
                                {field.label}
                              </p>
                              {isValidUrl ? (
                                <a
                                  href={value.startsWith('www.') ? `https://${value}` : value}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-sm text-blue-600 hover:text-blue-800 hover:underline break-all inline-flex items-center gap-1"
                                >
                                  {value}
                                  <ExternalLink className="h-3 w-3 flex-shrink-0" />
                                </a>
                              ) : (
                                <p className="text-sm text-gray-900 break-words">
                                  {typeof value === 'object' ? JSON.stringify(value) : value}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Mostrar todos los campos personalizados aunque no estén en la configuración */}
                  {Object.entries(selectedEvent.customFieldsData).map(([key, value]) => {
                    const fieldExists = calendar?.settings?.customFields?.some(f => f.id === key);
                    if (fieldExists || !value) return null;

                    return (
                      <div 
                        key={key} 
                        className="p-3 bg-yellow-50 rounded-lg border border-yellow-200"
                      >
                        <div className="flex items-start space-x-2">
                          <User className="h-4 w-4 text-yellow-600 mt-0.5" />
                          <div className="flex-1">
                            <p className="text-xs font-medium text-yellow-700 mb-1">
                              {key}
                            </p>
                            <p className="text-sm text-gray-900">
                              {typeof value === 'object' ? JSON.stringify(value) : value}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Estado y Visibilidad */}
              <div className="grid grid-cols-2 gap-4 border-t border-gray-200 pt-6">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs font-medium text-gray-500 mb-1">Estado</p>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    selectedEvent.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                    selectedEvent.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {selectedEvent.status === 'confirmed' ? 'Confirmado' :
                     selectedEvent.status === 'pending' ? 'Pendiente' : 'Cancelado'}
                  </span>
                </div>

                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs font-medium text-gray-500 mb-1">Visibilidad</p>
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                    {selectedEvent.visibility === 'public' ? 'Público' : 'Privado'}
                  </span>
                </div>
              </div>

              {/* Debug Info (solo en desarrollo) */}
              {process.env.NODE_ENV === 'development' && (
                <details className="border-t border-gray-200 pt-4">
                  <summary className="text-xs font-medium text-gray-500 cursor-pointer hover:text-gray-700">
                    Debug Info (Solo Desarrollo)
                  </summary>
                  <pre className="mt-2 text-xs bg-gray-900 text-green-400 p-3 rounded overflow-auto max-h-40">
                    {JSON.stringify(selectedEvent, null, 2)}
                  </pre>
                </details>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
