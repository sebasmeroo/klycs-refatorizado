import React, { useState, useRef, useCallback } from 'react';
import {
  Calendar,
  ExternalLink,
  Image as ImageIcon,
  Palette,
  Plus,
  X,
  Check,
  Instagram,
  Twitter,
  Linkedin,
  Mail,
  Phone,
  Globe,
  ChevronRight,
  ChevronLeft,
  Clock,
  User,
  GripVertical,
  Move,
} from 'lucide-react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, isSameMonth } from 'date-fns';
import { es } from 'date-fns/locale';

interface Link {
  id: string;
  title: string;
  url: string;
  icon: string;
  description?: string;
}

interface Service {
  id: string;
  title: string;
  duration: string;
  price: string;
  description?: string;
}

interface PortfolioItem {
  id: string;
  title: string;
  image: string;
  description?: string;
}

type SectionType = 'portfolio' | 'calendar' | 'links' | 'services';

interface PreviewData {
  name: string;
  tagline: string;
  bio: string;
  phone: string;
  website: string;
  backgroundColor: string;
  links: Link[];
  services: Service[];
  portfolio: PortfolioItem[];
  sectionOrder: SectionType[];
  selectedDate: Date | null;
  selectedTime: string | null;
}

const defaultData: PreviewData = {
  name: 'María García',
  tagline: 'Diseñadora UX/UI',
  bio: 'Especializada en productos digitales y experiencias de usuario',
  phone: '+34 612 345 678',
  website: 'maria-design.com',
  backgroundColor: '#667eea',
  links: [
    { id: '1', title: 'Instagram', url: 'instagram.com/maria', icon: 'instagram', description: 'Sígueme en Instagram' },
    { id: '2', title: 'LinkedIn', url: 'linkedin.com/in/maria', icon: 'linkedin', description: 'Perfil profesional' },
    { id: '3', title: 'Portfolio Web', url: 'maria-design.com', icon: 'link', description: 'Ver mi trabajo completo' },
  ],
  services: [
    { id: '1', title: 'Consultoría UX', duration: '60', price: '€120', description: 'Análisis y recomendaciones personalizadas' },
    { id: '2', title: 'Diseño de interfaz', duration: '90', price: '€180', description: 'Diseño completo de UI para tu producto' },
    { id: '3', title: 'Auditoría de producto', duration: '45', price: '€95', description: 'Revisión y optimización UX' },
  ],
  portfolio: [
    { id: '1', title: 'App bancaria', image: 'https://images.unsplash.com/photo-1551650975-87deedd944c3?w=600&h=800&fit=crop', description: 'Rediseño completo de app móvil' },
    { id: '2', title: 'E-commerce', image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&h=800&fit=crop', description: 'Plataforma de venta online' },
    { id: '3', title: 'Dashboard analytics', image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&h=800&fit=crop', description: 'Panel de análisis de datos' },
  ],
  sectionOrder: ['portfolio', 'calendar', 'links', 'services'],
  selectedDate: null,
  selectedTime: null,
};

const presetColors = [
  { name: 'Púrpura', color: '#667eea' },
  { name: 'Rosa', color: '#f56565' },
  { name: 'Verde', color: '#48bb78' },
  { name: 'Azul', color: '#4299e1' },
  { name: 'Naranja', color: '#ed8936' },
  { name: 'Índigo', color: '#5a67d8' },
];

const iconMap: Record<string, React.ReactNode> = {
  instagram: <Instagram className="w-5 h-5" />,
  twitter: <Twitter className="w-5 h-5" />,
  linkedin: <Linkedin className="w-5 h-5" />,
  mail: <Mail className="w-5 h-5" />,
  phone: <Phone className="w-5 h-5" />,
  link: <ExternalLink className="w-5 h-5" />,
};

const times = [
  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '12:00', '12:30', '14:00', '14:30', '15:00', '15:30',
  '16:00', '16:30', '17:00', '17:30', '18:00'
];

export const InteractiveCardPreview: React.FC = () => {
  const [data, setData] = useState<PreviewData>(defaultData);
  const [activeTab, setActiveTab] = useState<'colors' | 'links' | 'services' | 'portfolio' | 'order'>('order');
  const [activePortfolioIndex, setActivePortfolioIndex] = useState(0);
  const [calendarMonth, setCalendarMonth] = useState(() => startOfMonth(new Date()));
  const [calendarView, setCalendarView] = useState<'date' | 'time' | 'confirm'>('date');
  const sliderRef = useRef<HTMLDivElement>(null);

  const handleColorChange = (color: string) => {
    setData({ ...data, backgroundColor: color });
  };

  const handleUpdateLink = (id: string, field: 'title' | 'url' | 'description', value: string) => {
    setData({
      ...data,
      links: data.links.map((link) => (link.id === id ? { ...link, [field]: value } : link)),
    });
  };

  const handleAddLink = () => {
    const newLink: Link = {
      id: Date.now().toString(),
      title: 'Nuevo enlace',
      url: 'ejemplo.com',
      icon: 'link',
      description: 'Descripción',
    };
    setData({ ...data, links: [...data.links, newLink] });
  };

  const handleRemoveLink = (id: string) => {
    setData({ ...data, links: data.links.filter((link) => link.id !== id) });
  };

  const handleUpdateService = (id: string, field: 'title' | 'duration' | 'price' | 'description', value: string) => {
    setData({
      ...data,
      services: data.services.map((service) => (service.id === id ? { ...service, [field]: value } : service)),
    });
  };

  const scrollToIndex = useCallback((index: number) => {
    const container = sliderRef.current;
    if (!container) return;
    const clampedIndex = ((index % data.portfolio.length) + data.portfolio.length) % data.portfolio.length;
    const targetOffset = clampedIndex * container.clientWidth;
    container.scrollTo({ left: targetOffset, behavior: 'smooth' });
    setActivePortfolioIndex(clampedIndex);
  }, [data.portfolio.length]);

  const handleScroll = useCallback(() => {
    const container = sliderRef.current;
    if (!container) return;
    const newIndex = Math.round(container.scrollLeft / container.clientWidth);
    setActivePortfolioIndex(newIndex);
  }, []);

  const moveSectionUp = (index: number) => {
    if (index === 0) return;
    const newOrder = [...data.sectionOrder];
    [newOrder[index], newOrder[index - 1]] = [newOrder[index - 1], newOrder[index]];
    setData({ ...data, sectionOrder: newOrder });
  };

  const moveSectionDown = (index: number) => {
    if (index === data.sectionOrder.length - 1) return;
    const newOrder = [...data.sectionOrder];
    [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
    setData({ ...data, sectionOrder: newOrder });
  };

  const calendarDays = React.useMemo(() => {
    const monthStart = startOfMonth(calendarMonth);
    const monthEnd = endOfMonth(calendarMonth);
    const gridStart = startOfWeek(monthStart, { weekStartsOn: 0 });
    const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
    return eachDayOfInterval({ start: gridStart, end: gridEnd });
  }, [calendarMonth]);

  const handleDateSelect = (date: Date) => {
    setData({ ...data, selectedDate: date });
    setCalendarView('time');
  };

  const handleTimeSelect = (time: string) => {
    setData({ ...data, selectedTime: time });
    setCalendarView('confirm');
  };

  const handleBackCalendar = () => {
    if (calendarView === 'confirm') {
      setCalendarView('time');
    } else if (calendarView === 'time') {
      setCalendarView('date');
      setData({ ...data, selectedDate: null });
    }
  };

  const handleResetBooking = () => {
    setCalendarView('date');
    setData({ ...data, selectedDate: null, selectedTime: null });
  };

  const sectionLabels: Record<SectionType, string> = {
    portfolio: 'Portfolio',
    calendar: 'Calendario',
    links: 'Enlaces',
    services: 'Servicios',
  };

  // Renderizar secciones según el orden
  const renderSection = (sectionType: SectionType) => {
    switch (sectionType) {
      case 'portfolio':
        return (
          <div key="portfolio" className="mb-6 space-y-3">
            <h3 className="text-lg font-semibold text-white px-1">Portfolio</h3>
            <div className="relative w-full">
              <div className="relative rounded-[32px] border border-white/15 bg-black/40 backdrop-blur-2xl shadow-[0_25px_45px_rgba(0,0,0,0.45)] overflow-hidden">
                <div
                  ref={sliderRef}
                  className="flex h-full w-full overflow-x-auto snap-x snap-mandatory scrollbar-hide"
                  onScroll={handleScroll}
                >
                  {data.portfolio.map((item) => (
                    <div key={item.id} className="flex-shrink-0 w-full snap-center">
                      <div
                        className="relative h-full w-full overflow-hidden rounded-[26px] border border-white/20 bg-black/40 backdrop-blur-xl"
                        style={{ aspectRatio: '9 / 16' }}
                      >
                        <div className="absolute inset-0">
                          <img
                            src={item.image}
                            alt={item.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="absolute inset-0 rounded-2xl border border-white/10" />
                        <div className="absolute top-3 left-3 inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-black/60 text-white backdrop-blur-sm">
                          <ImageIcon className="w-3 h-3 mr-1" /> Imagen
                        </div>
                        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 via-black/40 to-transparent text-white">
                          <p className="text-sm font-semibold">{item.title}</p>
                          {item.description && (
                            <p className="text-xs text-white/80">{item.description}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                {data.portfolio.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={() => scrollToIndex(activePortfolioIndex - 1)}
                      className="absolute left-4 top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur transition hover:bg-black/80"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => scrollToIndex(activePortfolioIndex + 1)}
                      className="absolute right-4 top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur transition hover:bg-black/80"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                    <div className="absolute bottom-5 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2">
                      {data.portfolio.map((item, index) => (
                        <span
                          key={item.id}
                          className={`h-1.5 rounded-full transition-all ${
                            index === activePortfolioIndex ? 'w-6 bg-white' : 'w-2 bg-white/40'
                          }`}
                        />
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        );

      case 'calendar':
        return (
          <div key="calendar" className="mb-6 space-y-3">
            <h3 className="text-lg font-semibold text-white px-1">Reserva tu cita</h3>
            <div className="relative rounded-[32px] border border-white/15 bg-white/10 backdrop-blur-xl p-4 shadow-lg">
              {calendarView === 'date' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-4">
                    <button
                      onClick={() => setCalendarMonth(subMonths(calendarMonth, 1))}
                      className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <h4 className="text-sm font-semibold text-white capitalize">
                      {format(calendarMonth, 'MMMM yyyy', { locale: es })}
                    </h4>
                    <button
                      onClick={() => setCalendarMonth(addMonths(calendarMonth, 1))}
                      className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="grid grid-cols-7 gap-1">
                    {['D', 'L', 'M', 'X', 'J', 'V', 'S'].map((day) => (
                      <div key={day} className="text-center text-xs font-semibold text-white/50 py-2">
                        {day}
                      </div>
                    ))}
                    {calendarDays.map((day) => {
                      const isCurrentMonth = isSameMonth(day, calendarMonth);
                      const isPast = day < new Date();
                      const isSelected = data.selectedDate && isSameDay(day, data.selectedDate);
                      return (
                        <button
                          key={day.toString()}
                          onClick={() => !isPast && isCurrentMonth && handleDateSelect(day)}
                          disabled={isPast || !isCurrentMonth}
                          className={`aspect-square rounded-lg text-xs font-medium transition ${
                            isSelected
                              ? 'bg-white text-slate-900'
                              : isCurrentMonth && !isPast
                              ? 'bg-white/10 text-white hover:bg-white/20'
                              : 'text-white/30 cursor-not-allowed'
                          }`}
                        >
                          {format(day, 'd')}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {calendarView === 'time' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-4">
                    <button
                      onClick={handleBackCalendar}
                      className="text-sm text-white/70 hover:text-white flex items-center gap-1"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Volver
                    </button>
                    <h4 className="text-sm font-semibold text-white">
                      {data.selectedDate && format(data.selectedDate, 'EEE d MMM', { locale: es })}
                    </h4>
                  </div>
                  <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto">
                    {times.map((time) => (
                      <button
                        key={time}
                        onClick={() => handleTimeSelect(time)}
                        className="rounded-lg bg-white/10 py-2 text-xs font-medium text-white hover:bg-white/20 transition"
                      >
                        {time}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {calendarView === 'confirm' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-4">
                    <button
                      onClick={handleBackCalendar}
                      className="text-sm text-white/70 hover:text-white flex items-center gap-1"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Volver
                    </button>
                    <button
                      onClick={handleResetBooking}
                      className="text-xs text-white/50 hover:text-white"
                    >
                      Reiniciar
                    </button>
                  </div>
                  <div className="bg-white/10 rounded-2xl p-4 space-y-3">
                    <div className="flex items-center gap-3 text-white">
                      <Calendar className="h-5 w-5" />
                      <div>
                        <p className="text-xs text-white/60">Fecha</p>
                        <p className="text-sm font-semibold">
                          {data.selectedDate && format(data.selectedDate, 'EEEE, d MMMM yyyy', { locale: es })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-white">
                      <Clock className="h-5 w-5" />
                      <div>
                        <p className="text-xs text-white/60">Hora</p>
                        <p className="text-sm font-semibold">{data.selectedTime}</p>
                      </div>
                    </div>
                  </div>
                  <button className="w-full rounded-2xl bg-white py-3 text-sm font-semibold text-slate-900 hover:bg-white/90 transition flex items-center justify-center gap-2">
                    <Check className="h-4 w-4" />
                    Confirmar reserva
                  </button>
                </div>
              )}
            </div>
          </div>
        );

      case 'links':
        return (
          <div key="links" className="mb-4 space-y-2">
            {data.links.map((link) => (
              <a
                key={link.id}
                href={`https://${link.url}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-white px-3.5 py-2.5 text-slate-900 shadow-[0_18px_35px_-22px_rgba(15,23,42,0.25)] transition-all hover:shadow-[0_18px_45px_-20px_rgba(15,23,42,0.3)]"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-900 text-white">
                    {iconMap[link.icon] || <ExternalLink className="h-4 w-4" />}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-slate-900">{link.title}</span>
                    {link.description && (
                      <span className="text-[11px] text-slate-500">{link.description}</span>
                    )}
                  </div>
                </div>
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100">
                  <ChevronRight className="h-4 w-4 text-slate-400" />
                </div>
              </a>
            ))}
          </div>
        );

      case 'services':
        return (
          <div key="services" className="mb-6 space-y-3">
            <h3 className="text-lg font-semibold text-white px-1">Servicios con reserva</h3>
            {data.services.map((service) => (
              <div
                key={service.id}
                className="rounded-xl border border-white/20 bg-white/10 p-4 text-white shadow-lg backdrop-blur-sm"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h4 className="text-sm font-medium">{service.title}</h4>
                    {service.description && (
                      <p className="text-xs text-white/70 mt-1">{service.description}</p>
                    )}
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs text-white/60">
                        <Clock className="inline h-3 w-3 mr-1" />
                        {service.duration} min
                      </span>
                      <span className="text-sm font-semibold">{service.price}</span>
                    </div>
                  </div>
                  <button className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-slate-900 hover:bg-white/90 transition-colors">
                    Reservar
                  </button>
                </div>
              </div>
            ))}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
      {/* PREVIEW DEL MÓVIL */}
      <div className="order-2 lg:order-1">
        <div className="sticky top-8">
          <div className="mx-auto w-full max-w-[375px]">
            {/* Marco del móvil */}
            <div className="relative rounded-[48px] border-[14px] border-neutral-900 bg-neutral-900 p-3 shadow-2xl">
              {/* Notch */}
              <div className="absolute left-1/2 top-0 z-10 h-7 w-32 -translate-x-1/2 rounded-b-3xl bg-neutral-900"></div>
              
              {/* Contenido de la tarjeta */}
              <div
                className="relative h-[667px] overflow-y-auto rounded-[32px] p-4 scrollbar-thin"
                style={{
                  background: `linear-gradient(135deg, ${data.backgroundColor} 0%, ${data.backgroundColor}dd 100%)`,
                }}
              >
                {/* PERFIL */}
                <div className="mb-4 space-y-2">
                  <div className="w-full overflow-hidden rounded-3xl border border-slate-200 bg-white p-4 shadow-[0_22px_40px_-25px_rgba(15,23,42,0.28)]">
                    <div className="relative">
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-1">
                          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Hola</p>
                          <h1
                            className="text-2xl font-semibold text-slate-900"
                            contentEditable
                            suppressContentEditableWarning
                            onBlur={(e) => setData({ ...data, name: e.currentTarget.textContent || data.name })}
                          >
                            {data.name}
                          </h1>
                          <p
                            className="text-sm text-slate-500"
                            contentEditable
                            suppressContentEditableWarning
                            onBlur={(e) => setData({ ...data, tagline: e.currentTarget.textContent || data.tagline })}
                          >
                            {data.tagline}
                          </p>
                          <p
                            className="text-sm leading-relaxed text-slate-500"
                            contentEditable
                            suppressContentEditableWarning
                            onBlur={(e) => setData({ ...data, bio: e.currentTarget.textContent || data.bio })}
                          >
                            {data.bio}
                          </p>
                        </div>
                        <div className="relative h-16 w-16 overflow-hidden rounded-2xl border border-slate-100 shadow-inner bg-gradient-to-br from-blue-400 to-purple-500"></div>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-medium text-slate-500">
                          {data.phone}
                        </span>
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-medium text-slate-500">
                          {data.website}
                        </span>
                      </div>
                      <div className="mt-3 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.25em] text-slate-400">
                        <Calendar className="h-4 w-4 text-slate-400" />
                        <span>{format(new Date(), 'EEE d MMM', { locale: es })}</span>
                      </div>
                    </div>
                  </div>

                  {/* Phone & Website Links */}
                  <div className="w-full space-y-2">
                    <a
                      href={`tel:${data.phone}`}
                      className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-3.5 py-2.5 text-slate-900 shadow-[0_18px_35px_-22px_rgba(15,23,42,0.25)] transition-all hover:shadow-[0_18px_45px_-20px_rgba(15,23,42,0.28)]"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-900 text-white">
                          <Phone className="h-4 w-4" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Teléfono</span>
                          <span className="text-sm font-medium text-slate-900">{data.phone}</span>
                        </div>
                      </div>
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100">
                        <ChevronRight className="h-4 w-4 text-slate-400" />
                      </div>
                    </a>

                    <a
                      href={`https://${data.website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-3.5 py-2.5 text-slate-900 shadow-[0_18px_35px_-22px_rgba(15,23,42,0.25)] transition-all hover:shadow-[0_18px_45px_-20px_rgba(15,23,42,0.28)]"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-900 text-white">
                          <Globe className="h-4 w-4" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Sitio web</span>
                          <span className="text-sm font-medium text-slate-900">{data.website}</span>
                        </div>
                      </div>
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100">
                        <ChevronRight className="h-4 w-4 text-slate-400" />
                      </div>
                    </a>
                  </div>
                </div>

                {/* SECCIONES DINÁMICAS SEGÚN ORDEN */}
                {data.sectionOrder.map((sectionType) => renderSection(sectionType))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* PANEL DE CONTROLES */}
      <div className="order-1 lg:order-2 space-y-6">
        <div>
          <h3 className="text-2xl font-semibold mb-2 text-neutral-900 dark:text-white">Personaliza tu tarjeta</h3>
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            Experimenta con colores, enlaces, orden de secciones y contenido. Los cambios son solo una demostración.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-neutral-200 dark:border-neutral-800 overflow-x-auto">
          {[
            { id: 'order', label: 'Orden', icon: Move },
            { id: 'colors', label: 'Colores', icon: Palette },
            { id: 'links', label: 'Enlaces', icon: ExternalLink },
            { id: 'services', label: 'Servicios', icon: Calendar },
            { id: 'portfolio', label: 'Portfolio', icon: ImageIcon },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200'
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="space-y-6">
          {activeTab === 'order' && (
            <div className="space-y-4">
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                Organiza el orden de las secciones de tu tarjeta. Usa los botones para mover cada sección hacia arriba o abajo.
              </p>
              {data.sectionOrder.map((sectionType, index) => (
                <div
                  key={sectionType}
                  className="flex items-center justify-between rounded-xl border border-neutral-200 dark:border-neutral-800 p-4 bg-white dark:bg-neutral-900"
                >
                  <div className="flex items-center gap-3">
                    <GripVertical className="h-5 w-5 text-neutral-400" />
                    <span className="text-sm font-medium text-neutral-900 dark:text-white">
                      {sectionLabels[sectionType]}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => moveSectionUp(index)}
                      disabled={index === 0}
                      className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 disabled:opacity-30 disabled:cursor-not-allowed transition"
                    >
                      <ChevronLeft className="h-4 w-4 rotate-90" />
                    </button>
                    <button
                      onClick={() => moveSectionDown(index)}
                      disabled={index === data.sectionOrder.length - 1}
                      className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 disabled:opacity-30 disabled:cursor-not-allowed transition"
                    >
                      <ChevronRight className="h-4 w-4 rotate-90" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'colors' && (
            <div className="space-y-6">
              <div>
                <h4 className="text-sm font-semibold mb-3 text-neutral-900 dark:text-white">Presets de color</h4>
                <div className="grid grid-cols-3 gap-3">
                  {presetColors.map((preset) => (
                    <button
                      key={preset.name}
                      onClick={() => handleColorChange(preset.color)}
                      className="relative rounded-xl p-4 text-left transition-all hover:scale-105 border border-neutral-200 dark:border-neutral-700"
                      style={{ backgroundColor: preset.color }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="h-6 w-6 rounded-full bg-white/30" />
                        {data.backgroundColor === preset.color && (
                          <Check className="h-4 w-4 text-white" />
                        )}
                      </div>
                      <p className="text-xs font-medium text-white">{preset.name}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold mb-3 text-neutral-900 dark:text-white">Color personalizado</h4>
                <input
                  type="color"
                  value={data.backgroundColor}
                  onChange={(e) => handleColorChange(e.target.value)}
                  className="w-full h-16 rounded-lg cursor-pointer border border-neutral-200 dark:border-neutral-700"
                />
              </div>
            </div>
          )}

          {activeTab === 'links' && (
            <div className="space-y-4">
              {data.links.map((link) => (
                <div
                  key={link.id}
                  className="rounded-xl border border-neutral-200 dark:border-neutral-800 p-4 space-y-3 bg-white dark:bg-neutral-900"
                >
                  <div className="flex items-center justify-between">
                    <input
                      type="text"
                      value={link.title}
                      onChange={(e) => handleUpdateLink(link.id, 'title', e.target.value)}
                      className="text-sm font-medium bg-transparent border-none outline-none flex-1 text-neutral-900 dark:text-white"
                      placeholder="Título"
                    />
                    <button
                      onClick={() => handleRemoveLink(link.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <input
                    type="text"
                    value={link.url}
                    onChange={(e) => handleUpdateLink(link.id, 'url', e.target.value)}
                    className="w-full text-xs text-neutral-600 dark:text-neutral-400 bg-transparent border-none outline-none"
                    placeholder="URL"
                  />
                  <input
                    type="text"
                    value={link.description || ''}
                    onChange={(e) => handleUpdateLink(link.id, 'description', e.target.value)}
                    className="w-full text-xs text-neutral-500 dark:text-neutral-500 bg-transparent border-none outline-none"
                    placeholder="Descripción (opcional)"
                  />
                </div>
              ))}
              <button
                onClick={handleAddLink}
                className="w-full rounded-xl border-2 border-dashed border-neutral-300 dark:border-neutral-700 p-4 text-sm font-medium text-neutral-600 dark:text-neutral-400 hover:border-blue-500 hover:text-blue-500 transition-colors flex items-center justify-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Añadir enlace
              </button>
            </div>
          )}

          {activeTab === 'services' && (
            <div className="space-y-4">
              {data.services.map((service) => (
                <div
                  key={service.id}
                  className="rounded-xl border border-neutral-200 dark:border-neutral-800 p-4 space-y-3 bg-white dark:bg-neutral-900"
                >
                  <input
                    type="text"
                    value={service.title}
                    onChange={(e) => handleUpdateService(service.id, 'title', e.target.value)}
                    className="w-full text-sm font-medium bg-transparent border-none outline-none text-neutral-900 dark:text-white"
                    placeholder="Nombre del servicio"
                  />
                  <input
                    type="text"
                    value={service.description || ''}
                    onChange={(e) => handleUpdateService(service.id, 'description', e.target.value)}
                    className="w-full text-xs text-neutral-600 dark:text-neutral-400 bg-transparent border-none outline-none"
                    placeholder="Descripción del servicio"
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="text"
                      value={service.duration}
                      onChange={(e) => handleUpdateService(service.id, 'duration', e.target.value)}
                      className="text-xs text-neutral-600 dark:text-neutral-400 bg-transparent border border-neutral-200 dark:border-neutral-700 rounded-lg px-3 py-2 outline-none"
                      placeholder="Duración (min)"
                    />
                    <input
                      type="text"
                      value={service.price}
                      onChange={(e) => handleUpdateService(service.id, 'price', e.target.value)}
                      className="text-xs text-neutral-600 dark:text-neutral-400 bg-transparent border border-neutral-200 dark:border-neutral-700 rounded-lg px-3 py-2 outline-none"
                      placeholder="Precio"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'portfolio' && (
            <div className="space-y-4">
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                El portfolio muestra tus mejores proyectos en formato carousel. Usa las flechas en el preview para navegar entre imágenes.
              </p>
              <div className="grid grid-cols-2 gap-4">
                {data.portfolio.map((item, index) => (
                  <div key={item.id} className="relative aspect-[9/16] rounded-xl overflow-hidden group border border-neutral-200 dark:border-neutral-700">
                    <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-3">
                      <p className="text-white text-xs font-medium text-center">{item.title}</p>
                      <p className="text-white/70 text-[10px] text-center mt-1">{item.description}</p>
                      <span className="mt-2 text-white/50 text-xs">#{index + 1}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-4">
          <p className="text-sm text-blue-800 dark:text-blue-300 font-medium mb-1">
            💡 Esto es una demostración interactiva
          </p>
          <p className="text-xs text-blue-700 dark:text-blue-400">
            Los cambios que hagas aquí son solo para que veas las posibilidades. No se guardan en ninguna base de datos.
            Para crear tu propia tarjeta real, regístrate gratis.
          </p>
        </div>
      </div>
    </div>
  );
};
