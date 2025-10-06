import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import {
  Calendar as CalendarIcon,
  ArrowLeft,
  Clock,
  MapPin,
  Mail,
  Home,
  Link as LinkIcon,
  ExternalLink,
  CheckCircle2,
  XCircle,
  ChevronLeft,
  ChevronRight,
  Loader2,
  User
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { CalendarEventService } from '@/services/collaborativeCalendar';
import { CalendarEvent } from '@/types/calendar';
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  startOfWeek,
  endOfWeek
} from 'date-fns';
import { es } from 'date-fns/locale';
import { useCalendar, useCalendarEvents } from '@/hooks/useCalendar';

const weekdayLabels = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

const LocationMapPreview: React.FC<{ query?: string; className?: string }> = ({ query, className }) => {
  if (!query || !query.trim()) {
    return null;
  }

  const mapSrc = `https://www.google.com/maps?q=${encodeURIComponent(query)}&output=embed`;

  return (
    <div className={className}>
      <div className="text-xs text-slate-500 mb-2 flex items-center gap-1">
        <MapPin className="w-3 h-3" />
        Vista previa de la ubicación
      </div>
      <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-sm">
        <iframe
          title={`Mapa de ${query}`}
          src={mapSrc}
          loading="lazy"
          allowFullScreen
          className="w-full h-40 md:h-48"
          referrerPolicy="no-referrer-when-downgrade"
        />
      </div>
    </div>
  );
};

export const ProfessionalCalendar: React.FC = () => {
  const { calendarId } = useParams<{ calendarId: string }>();
  const [searchParams] = useSearchParams();
  const professionalEmail = searchParams.get('email');

  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [error, setError] = useState('');

  const { data: calendar, isLoading: calendarLoading, error: calendarError } = useCalendar(calendarId);

  const visibleRange = useMemo(() => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);

    const start = startOfWeek(monthStart, { weekStartsOn: 0 });
    start.setHours(0, 0, 0, 0);

    const end = endOfWeek(monthEnd, { weekStartsOn: 0 });
    end.setHours(23, 59, 59, 999);

    return { startDate: start, endDate: end };
  }, [currentDate]);

  const { data: eventsData, isLoading: eventsLoading } = useCalendarEvents(calendarId, visibleRange);
  const events = eventsData || [];
  const loading = calendarLoading || eventsLoading;

  useEffect(() => {
    if (!calendar) return;

    if (calendar.linkedEmail && calendar.linkedEmail !== professionalEmail) {
      setError('No tienes permiso para acceder a este calendario');
      return;
    }

    setError('');
  }, [calendar, professionalEmail]);

  useEffect(() => {
    if (calendarError) {
      setError('Calendario no encontrado');
    }
  }, [calendarError]);

  const professionalMember = useMemo(() => {
    if (!calendar) return null;
    if (calendar.members.length === 1) return calendar.members[0];
    return calendar.members.find(member => member.email === calendar.linkedEmail) ?? calendar.members[0];
  }, [calendar]);

  const accentColor = calendar?.color ?? '#2563EB';

  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);

    const gridStart = startOfWeek(monthStart, { weekStartsOn: 0 });
    const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });

    return eachDayOfInterval({ start: gridStart, end: gridEnd });
  }, [currentDate]);

  const eventsByDate = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    events.forEach(event => {
      const key = format(event.startDate, 'yyyy-MM-dd');
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(event);
    });
    map.forEach(list => list.sort((a, b) => a.startDate.getTime() - b.startDate.getTime()));
    return map;
  }, [events]);

  const selectedDayKey = format(selectedDate, 'yyyy-MM-dd');
  const selectedDayEvents = eventsByDate.get(selectedDayKey) ?? [];

  const upcomingEvents = useMemo(() => {
    const now = new Date();
    return events
      .filter(event => event.startDate >= now)
      .sort((a, b) => a.startDate.getTime() - b.startDate.getTime());
  }, [events]);

  const nextEvent = upcomingEvents[0] ?? null;

  const nextDayKey = nextEvent ? format(nextEvent.startDate, 'yyyy-MM-dd') : null;
  const nextDayEvents = nextDayKey ? (eventsByDate.get(nextDayKey) ?? []) : [];
  const completedEvents = useMemo(() => events.filter(event => event.serviceStatus === 'completed'), [events]);

  const totalHoursWorked = useMemo(() => {
    if (completedEvents.length === 0) return 0;
    const minutes = completedEvents.reduce((sum, event) => sum + (event.duration || 0), 0);
    return minutes / 60;
  }, [completedEvents]);

  const currentMonthStart = useMemo(() => startOfMonth(currentDate), [currentDate]);
  const currentMonthEnd = useMemo(() => endOfMonth(currentDate), [currentDate]);

  const completedThisMonth = useMemo(() =>
    completedEvents.filter(
      event => event.startDate >= currentMonthStart && event.startDate <= currentMonthEnd
    ),
    [completedEvents, currentMonthStart, currentMonthEnd]
  );

  const contactEmail = professionalEmail || professionalMember?.email || calendar?.linkedEmail;
  const timezoneLabel = calendar?.settings?.timezone;
  const workingHours = calendar?.settings?.workingHours;
  const workingHoursLabel = workingHours?.enabled
    ? `${workingHours.start} – ${workingHours.end}`
    : 'Sin horario establecido';

  const workingWeekdaysLabel = workingHours?.enabled
    ? workingHours.weekdays.length === 7
      ? 'Todos los días'
      : workingHours.weekdays
          .map(day => weekdayLabels[day])
          .join(', ')
    : '—';

  const handleNavigateMonth = useCallback((direction: 'prev' | 'next') => {
    setCurrentDate(prev => (direction === 'next' ? addMonths(prev, 1) : subMonths(prev, 1)));
  }, []);

  const handleNavigateToday = useCallback(() => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDate(today);
  }, []);

  const handleSelectDate = useCallback((date: Date) => {
    setSelectedDate(date);
  }, []);


  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <div className="space-y-4 text-center">
          <div className="w-14 h-14 rounded-full border-4 border-white/30 border-t-white animate-spin mx-auto" />
          <p className="text-sm tracking-wide uppercase text-white/60">Preparando tu agenda…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center px-6">
        <Card className="max-w-md w-full p-8 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto">
            <CalendarIcon className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-semibold text-slate-900">No se pudo cargar el calendario</h2>
          <p className="text-slate-600">{error}</p>
          <Link to="/">
            <Button className="mt-2">
              <Home className="mr-2 h-4 w-4" />
              Volver al inicio
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  const monthLabel = format(currentDate, 'MMMM yyyy', { locale: es });
  const selectedDayLabel = format(selectedDate, "EEEE d 'de' MMMM", { locale: es });
  const nextEventLabel = nextEvent
    ? `${format(nextEvent.startDate, 'EEEE d MMMM', { locale: es })} · ${format(nextEvent.startDate, 'HH:mm')}h`
    : 'Sin próximas citas';

  return (
    <div className="min-h-screen bg-slate-100">
      <section className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-700 text-white">
        <div className="max-w-6xl mx-auto px-4 md:px-6 lg:px-8 py-10 space-y-10">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex items-start gap-4">
                {professionalMember?.avatar ? (
                  <img
                    src={professionalMember.avatar}
                    alt={professionalMember.name}
                    className="w-14 h-14 rounded-full border-2 border-white/40 shadow-lg object-cover"
                  />
                ) : (
                  <div
                    className="w-14 h-14 rounded-full border-2 border-white/40 shadow-lg flex items-center justify-center text-xl font-semibold"
                    style={{ backgroundColor: accentColor + '33', color: '#fff' }}
                  >
                    {(professionalMember?.name || calendar?.name || 'P')[0]}
                  </div>
                )}
                <div>
                  <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
                    {professionalMember?.name || calendar?.name}
                  </h1>
                  <div className="flex flex-wrap items-center gap-3 text-sm text-white/80 mt-2">
                    {contactEmail && (
                      <span className="inline-flex items-center gap-1">
                        <Mail className="w-4 h-4" />
                        {contactEmail}
                      </span>
                    )}
                    {timezoneLabel && (
                      <span className="inline-flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {timezoneLabel}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-3"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <motion.div
              whileTap={{ scale: 0.97 }}
              whileHover={{ scale: 1.01 }}
              animate={nextDayEvents.length > 0 ? { scale: 1.02 } : { scale: 1 }}
              transition={
                nextDayEvents.length > 0
                  ? {
                      type: 'tween',
                      duration: 1.4,
                      repeat: Infinity,
                      repeatType: 'mirror',
                      ease: 'easeInOut'
                    }
                  : undefined
              }
              className="bg-white border border-white/40 rounded-2xl p-4 shadow-sm text-slate-900 md:col-span-2 cursor-pointer focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-indigo-500 outline-none"
              tabIndex={0}
              onClick={() => {
                if (nextDayEvents.length > 0) {
                  const event = nextDayEvents[0];
                  setSelectedDate(event.startDate);
                  setSelectedEvent(event);
                }
              }}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  if (nextDayEvents.length > 0) {
                    const next = nextDayEvents[0];
                    setSelectedDate(next.startDate);
                    setSelectedEvent(next);
                  }
                }
              }}
            >
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wide">Próximas citas</p>
                  <h3 className="text-lg font-semibold leading-snug text-slate-900">
                    {nextEvent ? format(nextEvent.startDate, "EEEE d 'de' MMMM", { locale: es }) : 'Agenda libre'}
                  </h3>
                  <p className="text-sm text-slate-500 mt-1">{nextEventLabel}</p>
                </div>
                <span className="text-xs text-slate-400">{nextDayEvents.length} este día</span>
              </div>
              {nextDayEvents.length > 0 && (
                <div className="mt-4 space-y-3 text-sm">
                  {nextDayEvents.map(event => (
                    <button
                      key={event.id}
                      onClick={() => setSelectedEvent(event)}
                      className="w-full text-left bg-slate-50 hover:bg-slate-100 transition border border-slate-200 rounded-xl px-4 py-3"
                    >
                      <p className="font-semibold text-slate-900 line-clamp-1">{event.title}</p>
                      <p className="text-xs text-slate-500 mt-1 flex items-center gap-2">
                        <span>{format(event.startDate, 'HH:mm')}h</span>
                        {event.endDate && (
                          <>
                            <span>–</span>
                            <span>{format(event.endDate, 'HH:mm')}h</span>
                          </>
                        )}
                      </p>
                      {event.location && (
                        <p className="text-xs text-slate-500 mt-1 line-clamp-1">
                          <MapPin className="w-3 h-3 inline mr-1 text-slate-400" /> {event.location}
                        </p>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </section>

      <main className="max-w-6xl mx-auto px-4 md:px-6 lg:px-8 -mt-10 pb-12 space-y-8">
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 mt-8">
          <div className="xl:col-span-2 bg-white border border-slate-200 rounded-3xl shadow-xl overflow-hidden">
            <div className="p-5 md:p-7 space-y-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-widest text-slate-400">Calendario mensual</p>
                  <h2 className="text-2xl font-semibold capitalize text-slate-900 mt-1">
                    {monthLabel}
                  </h2>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => handleNavigateMonth('prev')}>
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleNavigateToday}>
                    Hoy
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleNavigateMonth('next')}>
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="hidden md:grid grid-cols-7 gap-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wide">
                {weekdayLabels.map(label => (
                  <span key={label} className="text-center">{label}</span>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-1 text-sm">
                {calendarDays.map(date => {
                  const key = format(date, 'yyyy-MM-dd');
                  const dayEvents = eventsByDate.get(key) ?? [];
                  const isToday = isSameDay(date, new Date());
                  const isSelected = isSameDay(date, selectedDate);
                  const isCurrent = isSameMonth(date, currentDate);

                  const hasEvents = dayEvents.length > 0;

                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => handleSelectDate(date)}
                      className={`relative flex flex-col items-center justify-center rounded-xl border text-sm transition ${
                        isSelected ? 'border-indigo-500 bg-indigo-50 text-indigo-600 shadow-sm' : 'border-slate-200 bg-white text-slate-700'
                      } ${!isCurrent ? 'opacity-60' : ''}`}
                      style={{ minHeight: '48px' }}
                    >
                      <span
                        className={`flex h-7 w-7 items-center justify-center rounded-full text-sm font-semibold ${
                          isToday ? 'bg-indigo-500 text-white' : 'group-hover:bg-white/70'
                        }`}
                      >
                        {format(date, 'd')}
                      </span>
                      {hasEvents && (
                        <span className="mt-1 inline-flex h-1 w-1 rounded-full bg-rose-500" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="space-y-5">
            <div className="bg-white border border-slate-200 rounded-3xl shadow-xl overflow-hidden">
              <div className="p-5 border-b border-slate-200">
                <p className="text-xs uppercase tracking-widest text-slate-400">Agenda diaria</p>
                <h3 className="text-lg font-semibold text-slate-900 mt-1">{selectedDayLabel}</h3>
                <p className="text-sm text-slate-500">{selectedDayEvents.length} eventos programados</p>
              </div>
              <div className="divide-y divide-slate-200">
                {selectedDayEvents.length === 0 && (
                  <div className="p-6 text-sm text-slate-500">No hay reservas en este día.</div>
                )}
                {selectedDayEvents.map(event => (
                  <button
                    key={event.id}
                    onClick={() => setSelectedEvent(event)}
                    className="w-full text-left px-6 py-4 hover:bg-slate-50 transition"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">
                          {event.title}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">
                          {format(event.startDate, 'HH:mm')}h
                          {event.endDate && event.hasEndTime && ` · ${format(event.endDate, 'HH:mm')}h`}
                        </p>
                        {event.location && (
                          <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                            <MapPin className="w-3 h-3" /> {event.location}
                          </p>
                        )}
                      </div>
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded-full text-[10px] font-semibold ${
                          event.serviceStatus === 'completed'
                            ? 'bg-green-100 text-green-700'
                            : event.serviceStatus === 'in_progress'
                            ? 'bg-blue-100 text-blue-700'
                            : event.serviceStatus === 'not_done'
                            ? 'bg-rose-100 text-rose-600'
                            : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {event.serviceStatus === 'completed'
                          ? 'Completado'
                          : event.serviceStatus === 'in_progress'
                          ? 'En progreso'
                          : event.serviceStatus === 'not_done'
                          ? 'No realizado'
                          : 'Pendiente'}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
            <details className="bg-white border border-slate-200 rounded-3xl shadow-xl overflow-hidden [&_summary]:list-none">
              <summary className="flex items-center justify-between p-5 cursor-pointer select-none">
                <div>
                  <p className="text-xs uppercase tracking-widest text-slate-400">Detalles profesionales</p>
                  <h3 className="text-lg font-semibold text-slate-900 mt-1">Información del calendario</h3>
                </div>
                <span className="text-sm text-indigo-500">Ver más</span>
              </summary>
              <div className="px-5 pb-5 space-y-4 text-sm text-slate-600">
                {calendar?.description && (
                  <p className="flex items-start gap-2">
                    <span className="mt-1 h-2 w-2 rounded-full" style={{ backgroundColor: accentColor }} />
                    {calendar.description}
                  </p>
                )}
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase mb-1">Zona horaria</p>
                  <p>{timezoneLabel || 'No especificada'}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase mb-1">Horario laboral</p>
                  <p>{workingHoursLabel}</p>
                  <p className="text-xs text-slate-500">{workingWeekdaysLabel}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase mb-1">Miembros</p>
                  <div className="flex flex-wrap gap-2">
                    {calendar?.members.map(member => (
                      <span
                        key={member.id}
                        className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-xs"
                      >
                        <span
                          className="inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold"
                          style={{ backgroundColor: member.color + '22', color: member.color }}
                        >
                          {member.name[0]}
                        </span>
                        {member.name}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </details>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-3xl shadow-xl overflow-hidden">
          <div className="p-5 md:p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-widest text-slate-400 mb-1">Horas registradas</p>
              <h3 className="text-2xl font-semibold text-slate-900">{totalHoursWorked.toFixed(1)} h</h3>
              <p className="text-sm text-slate-500 mt-1">
                Basado en servicios marcados como completados en todo el historial
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500">
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-600">
                <CheckCircle2 className="w-4 h-4" /> {completedEvents.length} servicios completados
              </span>
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 text-indigo-600">
                {completedThisMonth.length} este mes
              </span>
            </div>
          </div>
        </div>
        <div className="text-center text-sm text-slate-400">
          <Link to="/logout" className="inline-flex items-center gap-2 px-4 py-2 text-slate-500 hover:text-slate-700 transition">
            Cerrar sesión
          </Link>
        </div>
      </main>

      <AnimatePresence>
        {selectedEvent && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm px-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 40, opacity: 0 }}
              transition={{ type: 'spring', damping: 30, stiffness: 260 }}
              className="w-full max-w-3xl bg-white rounded-3xl shadow-2xl overflow-hidden"
            >
              <div
                className="px-6 py-5"
                style={{
                  background: `linear-gradient(135deg, ${accentColor}, ${accentColor}cc)`
                }}
              >
                <div className="flex items-start justify-between gap-4 text-white">
                  <div>
                    <p className="text-xs uppercase tracking-widest text-white/70">Detalle de la cita</p>
                    <h3 className="text-xl font-semibold leading-snug mt-1">{selectedEvent.title}</h3>
                    <p className="text-sm text-white/80 mt-1">
                      {format(selectedEvent.startDate, "EEEE d 'de' MMMM", { locale: es })} · {format(selectedEvent.startDate, 'HH:mm')}h
                      {selectedEvent.endDate && selectedEvent.hasEndTime && ` – ${format(selectedEvent.endDate, 'HH:mm')}h`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {selectedEvent.serviceStatus === 'completed' && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-green-500/20 text-green-50">
                        <CheckCircle2 className="w-3 h-3" /> Completado
                      </span>
                    )}
                    <button
                      onClick={() => setSelectedEvent(null)}
                      className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition"
                    >
                      <XCircle className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="p-6 md:p-7 space-y-6 max-h-[65vh] md:max-h-[70vh] overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {selectedEvent.location && (
                    <div className="rounded-2xl border border-slate-200 p-4 bg-slate-50">
                      <p className="text-xs font-medium text-slate-500 uppercase mb-2">Ubicación</p>
                      <p className="text-sm text-slate-900 mb-3 flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-indigo-500" />
                        {selectedEvent.location}
                      </p>
                      <LocationMapPreview query={selectedEvent.location} />
                    </div>
                  )}
                  <div className="rounded-2xl border border-slate-200 p-4 bg-slate-50">
                    <p className="text-xs font-medium text-slate-500 uppercase mb-2">Horario</p>
                    <p className="text-sm text-slate-900">
                      {format(selectedEvent.startDate, "EEEE d 'de' MMMM", { locale: es })}
                    </p>
                    <p className="text-sm text-slate-600 mt-1">
                      {format(selectedEvent.startDate, 'HH:mm')}h
                      {selectedEvent.endDate && selectedEvent.hasEndTime && ` – ${format(selectedEvent.endDate, 'HH:mm')}h`}
                    </p>
                    {selectedEvent.duration && selectedEvent.duration > 0 && (
                      <p className="text-xs text-slate-500 mt-2">Duración: {(selectedEvent.duration / 60).toFixed(1)} horas</p>
                    )}
                  </div>
                </div>

                {selectedEvent.description && (
                  <div className="rounded-2xl border border-slate-200 p-4 bg-white">
                    <p className="text-xs font-medium text-slate-500 uppercase mb-2">Notas</p>
                    <p className="text-sm text-slate-700 whitespace-pre-wrap">{selectedEvent.description}</p>
                  </div>
                )}

                {selectedEvent.customFieldsData && Object.keys(selectedEvent.customFieldsData).length > 0 && (
                  <div className="rounded-2xl border border-slate-200 p-4 bg-white space-y-3">
                    <p className="text-xs font-medium text-slate-500 uppercase">Información extra</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {calendar?.settings?.customFields?.map(field => {
                        const value = selectedEvent.customFieldsData?.[field.id];
                        if (!value || !field.isVisible) return null;

                        const isLinkField = field.type === 'url' && typeof value === 'string';
                        const href = isLinkField && value.startsWith('http') ? value : isLinkField ? `https://${value}` : undefined;

                        return (
                          <div key={field.id} className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2">
                            <p className="text-xs font-semibold text-slate-500 uppercase mb-1">{field.label}</p>
                            {href ? (
                              <a href={href} target="_blank" rel="noopener noreferrer" className="text-sm text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
                                {value}
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            ) : (
                              <p className="text-sm text-slate-700 break-words">{value as string}</p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="rounded-2xl border border-slate-200 p-4 bg-white space-y-4">
                  <p className="text-xs font-semibold text-slate-500 uppercase">Estado del servicio</p>
                  <div className="flex flex-wrap gap-2">
                    <span
                      className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${
                        selectedEvent.serviceStatus === 'completed'
                          ? 'bg-green-100 text-emerald-700'
                          : 'bg-amber-100 text-amber-700'
                      }`}
                    >
                      {selectedEvent.serviceStatus === 'completed' ? 'Completado' : 'Pendiente'}
                    </span>
                    <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-500">
                      {selectedEvent.visibility === 'public' ? 'Público' : 'Privado'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    El estado lo administra el equipo de la clínica desde el panel principal.
                  </p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
