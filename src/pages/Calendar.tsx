import React, { useMemo, useState } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
  MoreVertical,
  Plus,
  Search,
  Star,
  Users
} from 'lucide-react';

type Professional = {
  id: string;
  name: string;
  specialty: string;
  avatar: string;
  color: string;
  totalEvents: number;
  rating: number;
  isLead?: boolean;
};

type CalendarEvent = {
  id: string;
  title: string;
  date: string; // yyyy-mm-dd
  startTime: string;
  endTime?: string;
  location: string;
  professionalId: string;
  status: 'confirmado' | 'pendiente' | 'importante';
  category: 'boda' | 'reunión' | 'seguimiento' | 'bloqueado';
  notes?: string;
};

const professionalsSeed: Professional[] = [
  {
    id: 'diana-lopez',
    name: 'Diana López',
    specialty: 'Planner Principal',
    avatar: 'https://i.pravatar.cc/150?img=47',
    color: 'from-emerald-500 to-teal-500',
    totalEvents: 18,
    rating: 4.9,
    isLead: true
  },
  {
    id: 'adriana',
    name: 'Adriana',
    specialty: 'Coordinadora',
    avatar: 'https://i.pravatar.cc/150?img=12',
    color: 'from-sky-500 to-blue-500',
    totalEvents: 14,
    rating: 4.7
  },
  {
    id: 'juanita-cardona',
    name: 'Juanita Cardona',
    specialty: 'Logística',
    avatar: 'https://i.pravatar.cc/150?img=56',
    color: 'from-purple-500 to-fuchsia-500',
    totalEvents: 11,
    rating: 4.8
  },
  {
    id: 'ynes-ruiz',
    name: 'Ynes Ruiz',
    specialty: 'Coordinación invitados',
    avatar: 'https://i.pravatar.cc/150?img=5',
    color: 'from-amber-500 to-orange-500',
    totalEvents: 9,
    rating: 4.6
  },
  {
    id: 'karen',
    name: 'Karen',
    specialty: 'Protocolo',
    avatar: 'https://i.pravatar.cc/150?img=32',
    color: 'from-rose-500 to-pink-500',
    totalEvents: 7,
    rating: 4.5
  },
  {
    id: 'lina-marcela',
    name: 'Lina Marcela',
    specialty: 'Comunicación',
    avatar: 'https://i.pravatar.cc/150?img=66',
    color: 'from-cyan-500 to-indigo-500',
    totalEvents: 6,
    rating: 4.4
  }
];

const eventsSeed: CalendarEvent[] = [
  {
    id: 'evt-1',
    title: 'Reunión inicial con familia Ortega',
    date: '2025-09-02',
    startTime: '09:30',
    endTime: '10:30',
    location: 'Oficina principal',
    professionalId: 'diana-lopez',
    status: 'confirmado',
    category: 'reunión'
  },
  {
    id: 'evt-2',
    title: 'Visita técnica Hacienda Aurora',
    date: '2025-09-05',
    startTime: '15:00',
    endTime: '17:00',
    location: 'Hacienda Aurora',
    professionalId: 'adriana',
    status: 'pendiente',
    category: 'seguimiento'
  },
  {
    id: 'evt-3',
    title: 'Ensayo ceremonia López-Ramírez',
    date: '2025-09-07',
    startTime: '11:00',
    endTime: '13:00',
    location: 'Iglesia Santa Clara',
    professionalId: 'juanita-cardona',
    status: 'confirmado',
    category: 'boda'
  },
  {
    id: 'evt-4',
    title: 'Fiesta López-Ramírez',
    date: '2025-09-28',
    startTime: '18:00',
    endTime: '23:00',
    location: 'Centro de eventos Altavista',
    professionalId: 'diana-lopez',
    status: 'importante',
    category: 'boda',
    notes: 'Evento clave del mes'
  },
  {
    id: 'evt-5',
    title: 'Día de la unidad alemana',
    date: '2025-10-03',
    startTime: '00:00',
    location: 'Calendario global',
    professionalId: 'karen',
    status: 'importante',
    category: 'bloqueado'
  },
  {
    id: 'evt-6',
    title: 'Seguimiento proveedores',
    date: '2025-09-16',
    startTime: '08:00',
    endTime: '09:00',
    location: 'Videollamada',
    professionalId: 'ynes-ruiz',
    status: 'pendiente',
    category: 'seguimiento'
  },
  {
    id: 'evt-7',
    title: 'Reunión catering',
    date: '2025-09-18',
    startTime: '16:00',
    endTime: '17:30',
    location: 'Cocina Creativa',
    professionalId: 'karen',
    status: 'confirmado',
    category: 'reunión'
  }
];

const weekDays = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

const formatDateKey = (date: Date) => date.toISOString().slice(0, 10);

const buildMonthMatrix = (anchor: Date) => {
  const startOfMonth = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
  const endOfMonth = new Date(anchor.getFullYear(), anchor.getMonth() + 1, 0);
  const firstDayIndex = (startOfMonth.getDay() + 6) % 7; // lunes = 0

  const gridStart = new Date(startOfMonth);
  gridStart.setDate(startOfMonth.getDate() - firstDayIndex);

  const totalCells = 42; // 6 semanas
  const cells: Array<{
    date: Date;
    key: string;
    isCurrentMonth: boolean;
    isToday: boolean;
  }> = [];

  const todayKey = formatDateKey(new Date());

  for (let i = 0; i < totalCells; i++) {
    const cellDate = new Date(gridStart);
    cellDate.setDate(gridStart.getDate() + i);
    const key = formatDateKey(cellDate);

    cells.push({
      date: cellDate,
      key,
      isCurrentMonth: cellDate.getMonth() === anchor.getMonth(),
      isToday: key === todayKey
    });
  }

  return cells;
};

const monthLabel = new Intl.DateTimeFormat('es-ES', {
  month: 'long',
  year: 'numeric'
});

const dayLabel = new Intl.DateTimeFormat('es-ES', {
  day: 'numeric',
  month: 'long'
});

const weekdayLongLabel = new Intl.DateTimeFormat('es-ES', {
  weekday: 'long'
});

const badgeColors: Record<CalendarEvent['status'], string> = {
  confirmado: 'bg-emerald-100 text-emerald-700 border border-emerald-200',
  pendiente: 'bg-amber-100 text-amber-700 border border-amber-200',
  importante: 'bg-rose-100 text-rose-700 border border-rose-200'
};

const statusLabel: Record<CalendarEvent['status'], string> = {
  confirmado: 'Confirmado',
  pendiente: 'Pendiente',
  importante: 'Evento clave'
};

const CalendarPage: React.FC = () => {
  const [professionals] = useState(professionalsSeed);
  const [activeProfessionals, setActiveProfessionals] = useState<string[]>(
    professionalsSeed.map((pro) => pro.id)
  );
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(() => new Date());
  const [viewMode, setViewMode] = useState<'mensual' | 'semanal'>('mensual');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredEvents = useMemo(() => {
    const selected = new Set(activeProfessionals);
    return eventsSeed.filter((event) => {
      const matchesProfessional = selected.size === 0 || selected.has(event.professionalId);
      const matchesSearch = searchTerm
        ? event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          event.location.toLowerCase().includes(searchTerm.toLowerCase())
        : true;
      const sameMonth = new Date(event.date).getMonth() === currentDate.getMonth() &&
        new Date(event.date).getFullYear() === currentDate.getFullYear();

      return matchesProfessional && matchesSearch && sameMonth;
    });
  }, [activeProfessionals, searchTerm, currentDate]);

  const eventsByDate = useMemo(() => {
    return filteredEvents.reduce<Record<string, CalendarEvent[]>>((acc, event) => {
      if (!acc[event.date]) {
        acc[event.date] = [];
      }
      acc[event.date].push(event);
      return acc;
    }, {});
  }, [filteredEvents]);

  const matrix = useMemo(() => buildMonthMatrix(currentDate), [currentDate]);

  const selectedDateKey = formatDateKey(selectedDate);
  const eventsForSelectedDay = eventsSeed.filter((event) => event.date === selectedDateKey);

  const handleToggleProfessional = (id: string) => {
    setActiveProfessionals((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectDay = (date: Date) => {
    setSelectedDate(date);
  };

  const goToPreviousMonth = () => {
    setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const goToToday = () => {
    const today = new Date();
    setCurrentDate(new Date(today.getFullYear(), today.getMonth(), 1));
    setSelectedDate(today);
  };

  const activeCount = activeProfessionals.length;

  return (
    <div className="min-h-screen bg-slate-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-10">
        <div className="flex flex-col lg:flex-row gap-8">
          <aside className="lg:w-72 space-y-6">
            <div className="bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <p className="text-sm uppercase tracking-wider text-emerald-200">Equipo</p>
                  <h2 className="text-xl font-semibold text-white">Profesionales</h2>
                </div>
                <button
                  onClick={goToToday}
                  className="text-xs font-semibold text-emerald-200 hover:text-emerald-100 transition"
                >
                  Hoy
                </button>
              </div>

              <div className="space-y-4">
                {professionals.map((professional) => {
                  const isActive = activeProfessionals.includes(professional.id);
                  return (
                    <button
                      key={professional.id}
                      onClick={() => handleToggleProfessional(professional.id)}
                      className={`w-full flex items-center gap-4 rounded-2xl border transition-all p-3 text-left ${
                        isActive
                          ? 'bg-white/10 border-white/20 shadow-lg shadow-emerald-500/10'
                          : 'bg-white/0 border-white/10 hover:bg-white/5'
                      }`}
                    >
                      <div
                        className={`h-12 w-12 rounded-2xl bg-gradient-to-br ${professional.color} flex items-center justify-center text-white font-semibold`}
                      >
                        {professional.name.charAt(0)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-white">{professional.name}</p>
                          {professional.isLead && (
                            <span className="text-[10px] uppercase tracking-wider text-emerald-200 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">Lead</span>
                          )}
                        </div>
                        <p className="text-xs text-white/60">{professional.specialty}</p>
                        <div className="mt-2 flex items-center gap-3 text-[11px] text-white/70">
                          <span className="flex items-center gap-1">
                            <Users className="h-3.5 w-3.5" />
                            {professional.totalEvents} eventos
                          </span>
                          <span className="flex items-center gap-1">
                            <Star className="h-3.5 w-3.5 text-yellow-400" />
                            {professional.rating.toFixed(1)}
                          </span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              <button className="mt-6 w-full flex items-center justify-center gap-2 rounded-2xl bg-emerald-500 text-white py-3 font-semibold hover:bg-emerald-400 transition">
                <Plus className="h-4 w-4" />
                Agregar profesional
              </button>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur">
              <h3 className="text-sm font-semibold text-white mb-4">Resumen rápido</h3>
              <ul className="space-y-3 text-sm text-white/70">
                <li className="flex justify-between"><span>Profesionales activos</span><span className="font-semibold text-white">{activeCount}</span></li>
                <li className="flex justify-between"><span>Eventos en el mes</span><span className="font-semibold text-white">{filteredEvents.length}</span></li>
                <li className="flex justify-between"><span>Eventos clave</span><span className="font-semibold text-rose-200">{filteredEvents.filter((event) => event.status === 'importante').length}</span></li>
              </ul>
            </div>
          </aside>

          <section className="flex-1 space-y-6">
            <div className="bg-white/5 border border-white/10 rounded-3xl p-6 md:p-8 backdrop-blur">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                <div>
                  <p className="text-sm uppercase tracking-widest text-white/60">Calendario</p>
                  <h1 className="text-3xl md:text-4xl font-bold text-white">Agenda de eventos</h1>
                  <p className="text-white/60 mt-2">Gestiona la planificación mensual de tu equipo y mantente al tanto de cada detalle.</p>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 h-4 w-4" />
                    <input
                      value={searchTerm}
                      onChange={(event) => setSearchTerm(event.target.value)}
                      className="bg-white/5 border border-white/10 rounded-2xl pl-10 pr-4 py-2 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-emerald-400/60"
                      placeholder="Buscar eventos o lugares"
                    />
                  </div>

                  <div className="bg-white/5 border border-white/10 rounded-2xl flex p-1">
                    <button
                      onClick={() => setViewMode('mensual')}
                      className={`px-4 py-2 rounded-2xl text-sm font-semibold transition ${
                        viewMode === 'mensual'
                          ? 'bg-white text-slate-900 shadow'
                          : 'text-white/70 hover:text-white'
                      }`}
                    >
                      Mensual
                    </button>
                    <button
                      onClick={() => setViewMode('semanal')}
                      className={`px-4 py-2 rounded-2xl text-sm font-semibold transition ${
                        viewMode === 'semanal'
                          ? 'bg-white text-slate-900 shadow'
                          : 'text-white/70 hover:text-white'
                      }`}
                    >
                      Semanal
                    </button>
                  </div>
                </div>
              </div>

              <div className="mt-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex items-center gap-4">
                  <button
                    onClick={goToPreviousMonth}
                    className="h-10 w-10 flex items-center justify-center rounded-xl bg-white/5 border border-white/10 text-white hover:bg-white/10 transition"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <div>
                    <p className="text-lg font-semibold text-white capitalize">
                      {monthLabel.format(currentDate)}
                    </p>
                    <p className="text-xs text-white/60">
                      {activeCount > 0 ? `${activeCount} profesionales visibles` : 'Sin filtros activos'}
                    </p>
                  </div>
                  <button
                    onClick={goToNextMonth}
                    className="h-10 w-10 flex items-center justify-center rounded-xl bg-white/5 border border-white/10 text-white hover:bg-white/10 transition"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </div>

                <div className="flex items-center gap-2 text-xs text-white/60">
                  <span className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" /> Confirmado
                  </span>
                  <span className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-amber-400" /> Pendiente
                  </span>
                  <span className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-rose-400" /> Evento clave
                  </span>
                </div>
              </div>

              {viewMode === 'mensual' && (
                <div className="mt-8">
                  <div className="grid grid-cols-7 gap-3 text-xs uppercase tracking-widest text-white/40">
                    {weekDays.map((day) => (
                      <div key={day} className="text-center">
                        {day}
                      </div>
                    ))}
                  </div>

                  <div className="mt-2 grid grid-cols-7 gap-3">
                    {matrix.map((cell) => {
                      const eventsForDay = eventsByDate[cell.key] || [];
                      const isSelected = cell.key === selectedDateKey;

                      return (
                        <button
                          key={cell.key}
                          onClick={() => handleSelectDay(cell.date)}
                          className={`group h-32 rounded-2xl border p-3 flex flex-col items-start gap-2 transition-all ${
                            isSelected
                              ? 'border-emerald-400/80 bg-emerald-400/10 shadow-lg shadow-emerald-500/10'
                              : cell.isCurrentMonth
                                ? 'border-white/10 bg-white/5 hover:border-white/30'
                                : 'border-white/5 bg-white/0 text-white/30 hover:border-white/20'
                          }`}
                        >
                          <div className="flex items-center gap-2 w-full">
                            <span className={`text-sm font-semibold ${cell.isCurrentMonth ? 'text-white' : 'text-white/40'}`}>
                              {cell.date.getDate()}
                            </span>
                            {cell.isToday && (
                              <span className="text-[10px] uppercase tracking-wider bg-emerald-500/10 border border-emerald-500/20 text-emerald-200 px-2 py-0.5 rounded-full">
                                Hoy
                              </span>
                            )}
                          </div>

                          <div className="flex flex-col gap-1 w-full">
                            {eventsForDay.slice(0, 3).map((event) => (
                              <span
                                key={event.id}
                                className={`w-full text-left text-xs font-medium rounded-xl px-2 py-1 truncate ${badgeColors[event.status]}`}
                              >
                                {event.title}
                              </span>
                            ))}
                            {eventsForDay.length > 3 && (
                              <span className="text-[10px] text-white/60">+{eventsForDay.length - 3} eventos</span>
                            )}
                            {eventsForDay.length === 0 && (
                              <span className="text-[11px] text-white/30 italic">Sin eventos</span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {viewMode === 'semanal' && (
                <div className="mt-8">
                  <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-sm text-white/70">
                    <p className="font-semibold text-white mb-3">Vista semanal en construcción</p>
                    <p>
                      Estamos preparando una vista detallada por franja horaria. Por ahora, utiliza la vista mensual para gestionar tu agenda.
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              <div className="xl:col-span-2 bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase text-white/60 tracking-widest">Día seleccionado</p>
                    <h2 className="text-2xl font-semibold text-white">{dayLabel.format(selectedDate)}</h2>
                    <p className="text-sm text-white/60 capitalize">{weekdayLongLabel.format(selectedDate)}</p>
                  </div>
                  <span className="text-sm text-white/60">{eventsForSelectedDay.length} eventos</span>
                </div>

                <div className="mt-6 space-y-4">
                  {eventsForSelectedDay.length === 0 && (
                    <div className="rounded-2xl border border-dashed border-white/20 bg-white/5 p-6 text-center text-white/50">
                      No hay actividades programadas para este día todavía.
                    </div>
                  )}

                  {eventsForSelectedDay.map((event) => {
                    const professional = professionals.find((pro) => pro.id === event.professionalId);

                    return (
                      <div
                        key={event.id}
                        className="rounded-2xl border border-white/10 bg-white/5 p-5 flex flex-col gap-4 text-sm text-white/80"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-base font-semibold text-white">{event.title}</p>
                            <p className="text-xs uppercase tracking-widest text-white/50">{statusLabel[event.status]}</p>
                          </div>
                          <button className="h-9 w-9 flex items-center justify-center rounded-xl bg-white/5 border border-white/10 text-white/60 hover:text-white">
                            <MoreVertical className="h-4 w-4" />
                          </button>
                        </div>

                        <div className="flex flex-wrap gap-4 text-xs text-white/60">
                          <span className="flex items-center gap-2">
                            <Clock className="h-3.5 w-3.5" />
                            {event.startTime}
                            {event.endTime && (
                              <>
                                <span>—</span>
                                {event.endTime}
                              </>
                            )}
                          </span>
                          <span className="flex items-center gap-2">
                            <MapPin className="h-3.5 w-3.5" />
                            {event.location}
                          </span>
                          {professional && (
                            <span className="flex items-center gap-2">
                              <Users className="h-3.5 w-3.5" />
                              {professional.name}
                            </span>
                          )}
                        </div>

                        {event.notes && (
                          <p className="text-sm text-white/70 border border-white/5 bg-white/5 rounded-xl p-3">
                            {event.notes}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur space-y-6 text-sm">
                <div>
                  <p className="text-xs uppercase tracking-widest text-emerald-200 mb-2">Acciones rápidas</p>
                  <div className="space-y-3">
                    <button className="w-full flex items-center justify-between rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-white/80 hover:bg-white/10 transition">
                      Crear evento
                      <Plus className="h-4 w-4" />
                    </button>
                    <button className="w-full flex items-center justify-between rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-white/80 hover:bg-white/10 transition">
                      Asignar profesional
                      <Users className="h-4 w-4" />
                    </button>
                    <button className="w-full flex items-center justify-between rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-white/80 hover:bg-white/10 transition">
                      Ver disponibilidad
                      <CalendarIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="border-t border-white/10 pt-4">
                  <p className="text-xs uppercase tracking-widest text-white/50 mb-3">Eventos destacados</p>
                  <div className="space-y-3 text-white/70">
                    {eventsSeed
                      .filter((event) => event.status === 'importante')
                      .slice(0, 3)
                      .map((event) => (
                        <div key={event.id} className="rounded-2xl bg-white/5 border border-white/10 px-4 py-3">
                          <p className="text-sm font-semibold text-white">{event.title}</p>
                          <p className="text-xs text-white/50 capitalize">{dayLabel.format(new Date(event.date))}</p>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default CalendarPage;

