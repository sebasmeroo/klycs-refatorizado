import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@/types';
import SectionRenderer from './SectionRenderer';
import {
  ExternalLink,
  Instagram,
  Twitter,
  Linkedin,
  Facebook,
  Youtube,
  Phone,
  Globe,
  Image as ImageIcon,
  Video as VideoIcon,
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Clock,
  User,
  Loader,
  Check
} from 'lucide-react';
import { CollaborativeCalendarService, CalendarEventService } from '@/services/collaborativeCalendar';
import { toast } from '@/utils/toast';
import {
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameDay,
  isSameMonth,
  format
} from 'date-fns';
import { es } from 'date-fns/locale';

interface MobilePreviewProps {
  card: Card;
  customCSS?: string;
}

const BASE_WIDTH = 390;
const BASE_HEIGHT = 844;
const MIN_SCALE = 0.38;

export const MobilePreview: React.FC<MobilePreviewProps> = ({ card, customCSS }) => {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [frameSize, setFrameSize] = React.useState<{ width: number; height: number }>(() => {
    const initialScale = 0.44;
    return { width: BASE_WIDTH * initialScale, height: BASE_HEIGHT * initialScale };
  });
  React.useEffect(() => {
    const updateSize = () => {
      const el = containerRef.current;
      if (!el) return;
      const availableHeight = el.clientHeight || BASE_HEIGHT;
      const scale = Math.min(1, Math.max(MIN_SCALE, availableHeight / BASE_HEIGHT));
      const height = BASE_HEIGHT * scale;
      const width = BASE_WIDTH * scale;
      setFrameSize({ width, height });
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  const getSocialIcon = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'instagram': return <Instagram className="w-5 h-5" />;
      case 'twitter': return <Twitter className="w-5 h-5" />;
      case 'linkedin': return <Linkedin className="w-5 h-5" />;
      case 'facebook': return <Facebook className="w-5 h-5" />;
      case 'youtube': return <Youtube className="w-5 h-5" />;
      default: return <ExternalLink className="w-5 h-5" />;
    }
  };

  const getBackgroundStyle = () => {
    if (card.profile.backgroundType === 'color') {
      return { backgroundColor: card.profile.backgroundColor || '#667eea' };
    } else if (card.profile.backgroundType === 'gradient') {
      return { background: card.profile.backgroundGradient || 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' };
    } else if (card.profile.backgroundType === 'image' && card.profile.backgroundImage) {
      return { 
        backgroundImage: `url(${card.profile.backgroundImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      };
    }
    return { backgroundColor: '#667eea' };
  };

  const formatWebsiteUrl = (url: string) => {
    if (!url) return '#';
    const trimmed = url.trim();
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      return trimmed;
    }
    return `https://${trimmed}`;
  };

  const ProfileSection = () => (
    <SectionRenderer
      card={card}
      sectionType="profile"
      defaultContent={
        <div className="mb-4 space-y-2">
          <div className="w-full overflow-hidden rounded-3xl border border-slate-200 bg-white p-4 shadow-[0_22px_40px_-25px_rgba(15,23,42,0.28)]">
            <div className="relative">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Hola</p>
                  <h1 className="text-2xl font-semibold text-slate-900">
                    {card.profile.name || 'Nombre'}
                  </h1>
                  {card.profile.tagline && (
                    <p className="text-sm text-slate-500">
                      {card.profile.tagline}
                    </p>
                  )}
                  {card.profile.bio && (
                    <p className="text-sm leading-relaxed text-slate-500">
                      {card.profile.bio}
                    </p>
                  )}
                </div>
                {card.profile.avatar && (
                  <div className="relative h-16 w-16 overflow-hidden rounded-2xl border border-slate-100 shadow-inner">
                    <img
                      src={card.profile.avatar}
                      alt={card.profile.name}
                      className="h-full w-full object-cover"
                    />
                  </div>
                )}
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {card.profile.phone && (
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-medium text-slate-500">
                    {card.profile.phone}
                  </span>
                )}
                {card.profile.website && (
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-medium text-slate-500">
                    {card.profile.website}
                  </span>
                )}
              </div>
              <div className="mt-3 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.25em] text-slate-400">
                <CalendarIcon className="h-4 w-4 text-slate-400" />
                <span>{format(new Date(), 'EEE d MMM', { locale: es })}</span>
              </div>
            </div>
          </div>

          {(card.profile.phone || card.profile.website) && (
            <div className="w-full space-y-2">
              {card.profile.phone && (
                <a
                  href={`tel:${card.profile.phone}`}
                  className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-3.5 py-2.5 text-slate-900 shadow-[0_18px_35px_-22px_rgba(15,23,42,0.25)] transition-all hover:shadow-[0_18px_45px_-20px_rgba(15,23,42,0.28)]"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-900 text-white">
                      <Phone className="h-4 w-4" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Teléfono</span>
                      <span className="text-sm font-medium text-slate-900">{card.profile.phone}</span>
                    </div>
                  </div>
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100">
                    <ChevronRight className="h-4 w-4 text-slate-400" />
                  </div>
                </a>
              )}

              {card.profile.website && (
                <a
                  href={formatWebsiteUrl(card.profile.website)}
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
                      <span className="text-sm font-medium text-slate-900">{card.profile.website}</span>
                    </div>
                  </div>
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100">
                    <ChevronRight className="h-4 w-4 text-slate-400" />
                  </div>
                </a>
              )}
            </div>
          )}
        </div>
      }
    />
  );

  const LinksSection = () => (
    <SectionRenderer
      card={card}
      sectionType="links"
      defaultContent={
        <div className="mb-4 space-y-2">
          {card.links
            .filter(link => link.isVisible)
            .sort((a, b) => a.order - b.order)
            .map((link) => (
              <SectionRenderer
                key={link.id}
                card={card}
                sectionType="links"
                targetItemId={link.id}
                defaultContent={
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-white px-3.5 py-2.5 text-slate-900 shadow-[0_18px_35px_-22px_rgba(15,23,42,0.25)] transition-all hover:shadow-[0_18px_45px_-20px_rgba(15,23,42,0.3)]"
                    style={{
                      backgroundColor: link.style?.backgroundColor || undefined,
                      color: link.style?.textColor || undefined
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-900 text-white">
                        {link.iconType === 'emoji' ? (
                          <span className="text-lg" role="img" aria-hidden="true">{link.icon}</span>
                        ) : link.iconType === 'image' && link.iconUrl ? (
                          <img src={link.iconUrl} alt={link.title} className="h-5 w-5 object-contain" />
                        ) : (
                          <ExternalLink className="h-4 w-4" />
                        )}
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
                }
              />
            ))}
        </div>
      }
    />
  );

  const SocialSection = () => (
    <SectionRenderer
      card={card}
      sectionType="social"
      defaultContent={
        card.socialLinks && card.socialLinks.length > 0 ? (
          <div className="mb-4 flex justify-center space-x-3">
            {card.socialLinks
              .filter(social => social.isVisible)
              .map((social) => (
                <a
                  key={social.id}
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-[0_16px_28px_-22px_rgba(15,23,42,0.35)] transition-all hover:text-slate-900"
                >
                  {getSocialIcon(social.platform)}
                </a>
              ))}
          </div>
        ) : null
      }
    />
  );

  const ServicesSection = () => (
    <SectionRenderer
      card={card}
      sectionType="services"
      defaultContent={
        card.services && card.services.length > 0 ? (
          <div className="space-y-4 mb-6">
            <h3 className="text-lg font-semibold text-white mb-3">Servicios</h3>
            {card.services
              .filter(service => service.isVisible)
              .sort((a, b) => a.order - b.order)
              .map((service) => (
                <div
                  key={service.id}
                  className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-4 text-white shadow-lg"
                >
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium text-sm">{service.name}</h4>
                    <span className="text-sm font-semibold">
                      {service.price > 0 ? `${service.price}${service.currency}` : 'Gratis'}
                    </span>
                  </div>
                  {service.description && (
                    <p className="text-xs text-white/70">{service.description}</p>
                  )}
                  {service.duration && (
                    <p className="text-xs text-white/60 mt-1">{service.duration} min</p>
                  )}
                </div>
              ))}
          </div>
        ) : null
      }
    />
  );

  const PortfolioSection = () => {
    const items = card.portfolio?.items?.filter(item => item.isVisible) || [];
    if (!card.portfolio?.isVisible || items.length === 0) {
      return null;
    }

    const layout = card.portfolio.style?.layout || 'carousel';
    const columns = card.portfolio.style?.columns || 1;
    const sliderRef = React.useRef<HTMLDivElement>(null);
    const [activeIndex, setActiveIndex] = React.useState(0);
    const activeIndexRef = React.useRef(0);

    const resolvedAspectRatio = (() => {
      switch (card.portfolio.style?.aspectRatio) {
        case 'square':
          return '1 / 1';
        case '16:9':
          return '16 / 9';
        case '4:3':
          return '4 / 3';
        default:
          return layout === 'carousel' || layout === 'framedCarousel' ? '9 / 16' : undefined;
      }
    })();

    const renderMediaContent = (item: typeof items[number]) => (
      <>
        <div className="absolute inset-0">
          {item.type === 'image' ? (
            <img
              src={item.url}
              alt={item.title || 'Portfolio item'}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          ) : (
            <video
              src={item.url}
              className="w-full h-full object-cover"
              autoPlay
              loop
              muted
              playsInline
              preload="auto"
              style={{ pointerEvents: 'none' }}
            />
          )}
        </div>
        <div className="absolute inset-0 rounded-2xl border border-white/10" style={{ pointerEvents: 'none' }} />
        <div className="absolute top-3 left-3 inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-black/60 text-white backdrop-blur-sm">
          {item.type === 'image' ? <ImageIcon className="w-3 h-3 mr-1" /> : <VideoIcon className="w-3 h-3 mr-1" />}{' '}
          {item.type === 'image' ? 'Imagen' : 'Video'}
        </div>
        {card.portfolio.style?.showTitles && (item.title || item.description) && (
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 via-black/40 to-transparent text-white">
            {item.title && <p className="text-sm font-semibold">{item.title}</p>}
            {card.portfolio.style?.showDescriptions && item.description && (
              <p className="text-xs text-white/80">{item.description}</p>
            )}
          </div>
        )}
      </>
    );

    const sortItems = React.useMemo(() => items.slice().sort((a, b) => a.order - b.order), [items]);

    const scrollToIndex = React.useCallback(
      (index: number, behavior: ScrollBehavior = 'smooth') => {
        const container = sliderRef.current;
        if (!container || sortItems.length === 0) return;
        const clampedIndex = ((index % sortItems.length) + sortItems.length) % sortItems.length;
        const targetOffset = clampedIndex * container.clientWidth;
        container.scrollTo({ left: targetOffset, behavior });
        setActiveIndex(clampedIndex);
        activeIndexRef.current = clampedIndex;
      },
      [sortItems.length]
    );

    const handleScroll = React.useCallback(() => {
      const container = sliderRef.current;
      if (!container || sortItems.length === 0) return;
      const newIndex = Math.round(container.scrollLeft / container.clientWidth);
      setActiveIndex(newIndex);
      activeIndexRef.current = newIndex;
    }, [sortItems.length]);

    if (layout === 'framedCarousel') {
      const heroImage = sortItems.find(item => item.type === 'image')?.url || sortItems[0]?.thumbnail || sortItems[0]?.url;
      const hasMultiple = sortItems.length > 1;

      React.useEffect(() => {
        if (hasMultiple) {
          const interval = window.setInterval(() => {
            const nextIndex = (activeIndexRef.current + 1) % sortItems.length;
            scrollToIndex(nextIndex);
          }, 5000);

          return () => window.clearInterval(interval);
        }

        scrollToIndex(0, 'auto');
        return () => undefined;
      }, [hasMultiple, scrollToIndex, sortItems.length]);

      return (
        <SectionRenderer
          card={card}
          sectionType="portfolio"
          defaultContent={
            <div className="mb-6 space-y-3">
              {card.portfolio.showTitle && card.portfolio.title && (
                <h3 className="text-lg font-semibold text-white px-1">{card.portfolio.title}</h3>
              )}
              <div className="relative w-full">
                <div className="relative w-full">
                  {heroImage && (
                    <div className="absolute inset-0 -z-10 overflow-hidden rounded-[36px]">
                      <img
                        src={heroImage}
                        alt="Fondo del portfolio"
                        className="w-full h-full object-cover opacity-60 blur-2xl scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/80 to-black/90" />
                    </div>
                  )}
                  <div className="relative rounded-[32px] border border-white/15 bg-black/40 backdrop-blur-2xl shadow-[0_25px_45px_rgba(0,0,0,0.45)] overflow-hidden">
                    <div
                      ref={sliderRef}
                      className="flex h-full w-full overflow-x-auto snap-x snap-mandatory scrollbar-hide"
                      onScroll={handleScroll}
                    >
                      {sortItems.map(item => (
                        <div key={item.id} className="flex-shrink-0 w-full snap-center">
                          <div
                            className="relative h-full w-full overflow-hidden rounded-[26px] border border-white/20 bg-black/40 backdrop-blur-xl"
                            style={{ aspectRatio: resolvedAspectRatio || '9 / 16' }}
                          >
                            {renderMediaContent(item)}
                          </div>
                        </div>
                      ))}
                    </div>
                    {hasMultiple && (
                      <>
                        <button
                          type="button"
                          onClick={() => scrollToIndex(activeIndex - 1)}
                          className="absolute left-4 top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur transition hover:bg-black/80"
                          aria-label="Elemento anterior"
                        >
                          <ChevronLeft className="h-5 w-5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => scrollToIndex(activeIndex + 1)}
                          className="absolute right-4 top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur transition hover:bg-black/80"
                          aria-label="Elemento siguiente"
                        >
                          <ChevronRight className="h-5 w-5" />
                        </button>
                        <div className="absolute bottom-5 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2">
                          {sortItems.map((item, index) => (
                            <span
                              key={item.id}
                              className={`h-1.5 rounded-full transition-all ${
                                index === activeIndex ? 'w-6 bg-white' : 'w-2 bg-white/40'
                              }`}
                            />
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          }
        />
      );
    }
    
    // Determinar clases de grid según el layout
    const getLayoutClasses = () => {
      switch (layout) {
        case 'grid':
          return `grid grid-cols-${columns} gap-3`;
        case 'masonry':
          return 'columns-2 gap-3 space-y-3';
        case 'list':
          return 'flex flex-col gap-3';
        case 'framedCarousel':
          return 'relative flex justify-center';
        case 'carousel':
        default:
          return 'flex overflow-x-auto snap-x snap-mandatory gap-3 pb-2 scrollbar-hide';
      }
    };

    const getItemClasses = () => {
      if (layout === 'carousel') {
        return 'flex-shrink-0 w-[85%] snap-center';
      }
      if (layout === 'masonry') {
        return 'break-inside-avoid mb-3';
      }
      return '';
    };

    return (
      <SectionRenderer
        card={card}
        sectionType="portfolio"
        defaultContent={
          <div className="mb-6 space-y-3">
            {card.portfolio.showTitle && card.portfolio.title && (
              <h3 className="text-lg font-semibold text-white px-1">{card.portfolio.title}</h3>
            )}
            <div className={getLayoutClasses()}>
              {items
                .sort((a, b) => a.order - b.order)
                .map(item => (
                  <div
                    key={item.id}
                    className={`relative overflow-hidden rounded-2xl border border-white/15 bg-black/30 backdrop-blur-md ${getItemClasses()}`}
                    style={{ aspectRatio: resolvedAspectRatio }}
                  >
                    {renderMediaContent(item)}
                  </div>
                ))}
            </div>
          </div>
        }
      />
    );
  };

  type InlineFlowStep = 'professionals' | 'services' | 'date' | 'time' | 'details' | 'review';

  interface InlineBookingData {
    professionalId?: string;
    professionalName?: string;
    serviceId?: string;
    serviceName?: string;
    date?: Date;
    time?: string;
    clientName?: string;
    clientEmail?: string;
    clientPhone?: string;
    notes?: string;
  }

  const CalendarSection = () => {
    const [professionals, setProfessionals] = React.useState<TeamProfessional[]>([]);
    const [loadingProfessionals, setLoadingProfessionals] = React.useState(true);
    const [flowState, setFlowState] = React.useState<'idle' | 'active' | 'completed'>('idle');
    const [currentStep, setCurrentStep] = React.useState<InlineFlowStep>('date');
    const [bookingData, setBookingData] = React.useState<InlineBookingData>({});
    const [submitting, setSubmitting] = React.useState(false);
    const [iconVariant, setIconVariant] = React.useState<'calendar' | 'arrow'>('calendar');
    const [calendarMonth, setCalendarMonth] = React.useState(() => startOfMonth(new Date()));

    const services = React.useMemo(
      () => card.services?.filter(service => service.isActive) ?? [],
      [card.services]
    );

    React.useEffect(() => {
      if (flowState !== 'idle') {
        setIconVariant('arrow');
        return;
      }

      const interval = setInterval(() => {
        setIconVariant(prev => (prev === 'calendar' ? 'arrow' : 'calendar'));
      }, 2500);

      return () => clearInterval(interval);
    }, [flowState]);

    const stepSequence = React.useMemo<InlineFlowStep[]>(() => {
      const steps: InlineFlowStep[] = [];
      if (card.calendar?.showProfessionals && professionals.length > 0) {
        steps.push('professionals');
      }
      if (services.length > 0) {
        steps.push('services');
      }
      steps.push('date', 'time', 'details', 'review');
      return steps;
    }, [card.calendar?.showProfessionals, professionals.length, services.length]);

    React.useEffect(() => {
      const loadProfessionals = async () => {
        if (!card.calendar?.linkedCalendarId || !card.userId) {
          setLoadingProfessionals(false);
          return;
        }

        try {
          setLoadingProfessionals(true);
          const profs = await CollaborativeCalendarService.getProfessionals(card.userId);
          setProfessionals(profs.filter(p => p.isActive));
        } catch (error) {
          console.error('Error loading professionals:', error);
          setProfessionals([]);
        } finally {
          setLoadingProfessionals(false);
        }
      };

      loadProfessionals();
    }, [card.calendar?.linkedCalendarId, card.userId]);

    React.useEffect(() => {
      if (flowState === 'active' && stepSequence.length > 0) {
        setCurrentStep(stepSequence[0]);
      }
    }, [flowState, stepSequence]);

    const currentIndex = stepSequence.indexOf(currentStep);
    const isFirstStep = currentIndex <= 0;
    const isLastStep = currentIndex === stepSequence.length - 1;

    if (!card.calendar?.enabled || !card.calendar?.isVisible) {
      return null;
    }

    const handleProfessionalSelect = (professional: TeamProfessional) => {
      setBookingData(prev => ({
        ...prev,
        professionalId: professional.id,
        professionalName: professional.name
      }));
      const nextStep = stepSequence[currentIndex + 1];
      if (nextStep) {
        setCurrentStep(nextStep);
      }
    };

    const handleSkipProfessional = () => {
      setBookingData(prev => ({
        ...prev,
        professionalId: undefined,
        professionalName: 'Sin asignar'
      }));
      const nextStep = stepSequence[currentIndex + 1];
      if (nextStep) {
        setCurrentStep(nextStep);
      }
    };

    const handleServiceSelect = (serviceId: string, serviceName: string) => {
      setBookingData(prev => ({
        ...prev,
        serviceId,
        serviceName
      }));
      const nextStep = stepSequence[currentIndex + 1];
      if (nextStep) {
        setCurrentStep(nextStep);
      }
    };

    const handleDateSelect = (date: Date) => {
      setBookingData(prev => ({ ...prev, date }));
      const nextStep = stepSequence[currentIndex + 1];
      if (nextStep) {
        setCurrentStep(nextStep);
      }
    };

    const handleTimeSelect = (time: string) => {
      setBookingData(prev => ({ ...prev, time }));
      const nextStep = stepSequence[currentIndex + 1];
      if (nextStep) {
        setCurrentStep(nextStep);
      }
    };

    const handleBack = () => {
      if (isFirstStep) {
        setFlowState('idle');
        setBookingData({});
        return;
      }
      const prevStep = stepSequence[currentIndex - 1];
      if (prevStep) {
        setCurrentStep(prevStep);
      }
    };

    const handleSubmit = async () => {
      if (!bookingData.clientName || !bookingData.clientEmail) {
        toast.error('Por favor completa tu nombre y correo');
        return;
      }

      if (!bookingData.date || !bookingData.time) {
        toast.error('Selecciona fecha y hora');
        return;
      }

      const calendarId = card.calendar?.linkedCalendarId;
      if (!calendarId) {
        toast.error('No hay calendario vinculado');
        return;
      }

      try {
        setSubmitting(true);

        const startDateTime = new Date(bookingData.date);
        const [hours, minutes] = bookingData.time.split(':');
        startDateTime.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);

        const endDateTime = new Date(startDateTime);
        endDateTime.setHours(startDateTime.getHours() + 1);

        const eventData = {
          calendarId,
          title: `${bookingData.serviceName || 'Reserva'} - ${bookingData.clientName}`,
          description: `Cliente: ${bookingData.clientName}\nEmail: ${bookingData.clientEmail}\nTeléfono: ${bookingData.clientPhone || 'No proporcionado'}\n\nNotas: ${bookingData.notes || 'Sin notas'}`,
          startDate: startDateTime,
          endDate: endDateTime,
          isAllDay: false,
          createdBy: 'cliente',
          attendees: [{
            userId: 'cliente',
            name: bookingData.clientName,
            email: bookingData.clientEmail,
            status: 'pending',
            isOrganizer: false
          }],
          status: 'pending' as const,
          visibility: 'public' as const,
          color: '#3B82F6'
        };

        await CalendarEventService.createEvent(calendarId, eventData);

        toast.success('¡Reserva enviada!');
        setFlowState('completed');
      } catch (error) {
        console.error('Error creating booking:', error);
        toast.error('No se pudo crear la reserva');
      } finally {
        setSubmitting(false);
      }
    };

    React.useEffect(() => {
      if (bookingData.date) {
        setCalendarMonth(startOfMonth(bookingData.date));
      }
    }, [bookingData.date]);

    const times = React.useMemo(
      () => [
        '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
        '12:00', '12:30', '14:00', '14:30', '15:00', '15:30',
        '16:00', '16:30', '17:00', '17:30', '18:00'
      ],
      []
    );

    const calendarDays = React.useMemo(() => {
      const monthStart = startOfMonth(calendarMonth);
      const monthEnd = endOfMonth(calendarMonth);
      const gridStart = startOfWeek(monthStart, { weekStartsOn: 0 });
      const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
      return eachDayOfInterval({ start: gridStart, end: gridEnd });
    }, [calendarMonth]);

    const canBook = Boolean(card.calendar?.allowDirectBooking);

    const STEP_TITLES: Record<InlineFlowStep, { title: string; subtitle: string }> = {
      professionals: { title: 'Selecciona un profesional', subtitle: 'Elige quién atenderá la cita' },
      services: { title: 'Selecciona un servicio', subtitle: 'Define qué necesitas' },
      date: { title: 'Selecciona una fecha', subtitle: 'Escoge el día de tu preferencia' },
      time: { title: 'Selecciona una hora', subtitle: 'Disponible según el horario del equipo' },
      details: { title: 'Tus datos', subtitle: 'Necesitamos algunos detalles para contactarte' },
      review: { title: 'Confirma tu reserva', subtitle: 'Revisa la información antes de enviar' }
    };

    const renderProfessionalsStep = () => (
      <div className="space-y-3">
        {loadingProfessionals ? (
          <div className="flex justify-center py-6">
            <Loader className="w-6 h-6 text-gray-400 animate-spin" />
          </div>
        ) : professionals.length > 0 ? (
          <div className="space-y-1.5">
            {professionals.map(professional => {
              const isSelected = bookingData.professionalId === professional.id;
              return (
                <button
                  key={professional.id}
                  onClick={() => handleProfessionalSelect(professional)}
                  className={`w-full rounded-2xl border px-3 py-2 text-left transition-all ${
                    isSelected
                      ? 'border-black bg-black text-white'
                      : 'border-gray-200 bg-white hover:border-black/40 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      {professional.avatar ? (
                        <img
                          src={professional.avatar}
                          alt={professional.name}
                          className="h-10 w-10 rounded-full object-cover"
                        />
                      ) : (
                        <div
                          className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold text-white"
                          style={{ backgroundColor: professional.color || '#1f2937' }}
                        >
                          {professional.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold">{professional.name}</p>
                        <p className={`truncate text-xs ${isSelected ? 'text-white/80' : 'text-gray-500'}`}>
                          {professional.role || 'Profesional'}
                        </p>
                      </div>
                    </div>
                    <ChevronRight
                      className={`h-4 w-4 flex-shrink-0 transition ${
                        isSelected ? 'text-white/80' : 'text-gray-300'
                      }`}
                    />
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-gray-500">No hay profesionales disponibles.</p>
        )}

        {professionals.length > 0 && (
          <button
            onClick={handleSkipProfessional}
            className="w-full rounded-xl border border-gray-200 py-2.5 text-sm font-medium text-gray-500 hover:border-gray-300"
          >
            Continuar sin seleccionar
          </button>
        )}
      </div>
    );

    const renderServicesStep = () => (
      <div className="space-y-2.5">
        {services.map(service => (
          <button
            key={service.id}
            onClick={() => handleServiceSelect(service.id, service.name)}
            className="w-full rounded-2xl border border-gray-200 bg-white px-3.5 py-3 text-left transition-all hover:border-black/40 hover:bg-gray-50"
          >
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-gray-900">{service.name}</p>
                {service.description && (
                  <p className="mt-1 text-xs text-gray-500">{service.description}</p>
                )}
                <div className="mt-1.5 flex items-center gap-3 text-xs text-gray-500">
                  <span>⏱ {service.duration} min</span>
                  {service.price && <span>💰 ${service.price}</span>}
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-gray-300" />
            </div>
          </button>
        ))}
      </div>
    );

    const renderDateStep = () => (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setCalendarMonth(prev => subMonths(prev, 1))}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 text-gray-500 hover:border-black/40"
            aria-label="Mes anterior"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <p className="text-sm font-semibold text-gray-900">
            {format(calendarMonth, 'MMMM yyyy', { locale: es })}
          </p>
          <button
            onClick={() => setCalendarMonth(prev => addMonths(prev, 1))}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 text-gray-500 hover:border-black/40"
            aria-label="Mes siguiente"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-2 text-center text-[11px] font-medium uppercase tracking-wide text-gray-400">
          {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map(label => (
            <span key={label}>{label}</span>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-2">
          {calendarDays.map(day => {
            const isSelected = bookingData.date ? isSameDay(day, bookingData.date) : false;
            const isCurrentMonth = isSameMonth(day, calendarMonth);
            return (
              <button
                key={day.toISOString()}
                onClick={() => handleDateSelect(new Date(day))}
                className={`aspect-square rounded-2xl border text-center text-sm transition-all ${
                  isSelected
                    ? 'border-black bg-black text-white'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-black/40'
                } ${
                  isCurrentMonth ? '' : 'text-gray-400'
                }`}
              >
                <span className="mt-1 inline-block text-base font-semibold">
                  {day.getDate()}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    );

    const renderTimeStep = () => (
      <div className="grid grid-cols-3 gap-1.5">
        {times.map(time => {
          const isSelected = bookingData.time === time;
          return (
            <button
              key={time}
              onClick={() => handleTimeSelect(time)}
              className={`rounded-2xl border py-2.5 text-sm font-medium transition-all ${
                isSelected
                  ? 'border-black bg-black text-white'
                  : 'border-gray-200 bg-white text-gray-700 hover:border-black/40'
              }`}
            >
              {time}
            </button>
          );
        })}
      </div>
    );

    const renderDetailsStep = () => {
      const nextStep = stepSequence[currentIndex + 1];
      return (
        <div className="space-y-3">
        <input
          type="text"
          placeholder="Nombre completo *"
          value={bookingData.clientName || ''}
          onChange={(event) => setBookingData(prev => ({ ...prev, clientName: event.target.value }))}
          className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm focus:border-black focus:outline-none"
        />
        <input
          type="email"
          placeholder="Email *"
          value={bookingData.clientEmail || ''}
          onChange={(event) => setBookingData(prev => ({ ...prev, clientEmail: event.target.value }))}
          className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm focus:border-black focus:outline-none"
        />
        <input
          type="tel"
          placeholder="Teléfono"
          value={bookingData.clientPhone || ''}
          onChange={(event) => setBookingData(prev => ({ ...prev, clientPhone: event.target.value }))}
          className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm focus:border-black focus:outline-none"
        />
        <textarea
          placeholder="Notas adicionales"
          value={bookingData.notes || ''}
          onChange={(event) => setBookingData(prev => ({ ...prev, notes: event.target.value }))}
          rows={3}
          className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm focus:border-black focus:outline-none"
        />
        {nextStep && (
          <button
            onClick={() => setCurrentStep(nextStep)}
            className="mt-2 w-full rounded-2xl bg-black py-2.5 text-sm font-semibold text-white hover:bg-black/90"
            disabled={!bookingData.clientName || !bookingData.clientEmail}
          >
            Continuar
          </button>
        )}
        </div>
      );
    };

    const renderReviewStep = () => (
      <div className="space-y-4">
        <div className="space-y-3 rounded-2xl border border-gray-200 bg-white px-4 py-4 text-sm text-gray-700">
          {bookingData.professionalName && (
            <p className="flex items-center gap-2">
              <User className="h-4 w-4 text-gray-400" />
              {bookingData.professionalName}
            </p>
          )}
          {bookingData.serviceName && (
            <p className="flex items-center gap-2">
              <Check className="h-4 w-4 text-gray-400" />
              {bookingData.serviceName}
            </p>
          )}
          {bookingData.date && (
            <p className="flex items-center gap-2">
              <CalendarIcon className="h-4 w-4 text-gray-400" />
              {bookingData.date.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
          )}
          {bookingData.time && (
            <p className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-gray-400" />
              {bookingData.time}
            </p>
          )}
        </div>

        <button
          onClick={handleSubmit}
          className="w-full rounded-2xl bg-black py-2.5 text-sm font-semibold text-white hover:bg-black/90 disabled:cursor-not-allowed disabled:bg-gray-300"
          disabled={submitting}
        >
          {submitting ? 'Enviando...' : 'Confirmar reserva'}
        </button>
      </div>
    );

    const renderStepContent = () => {
      switch (currentStep) {
        case 'professionals':
          return renderProfessionalsStep();
        case 'services':
          return renderServicesStep();
        case 'date':
          return renderDateStep();
        case 'time':
          return renderTimeStep();
        case 'details':
          return renderDetailsStep();
        case 'review':
          return renderReviewStep();
        default:
          return null;
      }
    };

    const stepProgress = React.useMemo(() => {
      if (stepSequence.length <= 1) return 1;
      return (currentIndex + 1) / stepSequence.length;
    }, [currentIndex, stepSequence.length]);

    const renderStepper = () => (
      <div className="relative h-2 w-full overflow-hidden rounded-full border border-black/10 bg-black/5">
        <motion.div
          className="absolute inset-y-0 left-0 rounded-full bg-black"
          initial={{ width: 0 }}
          animate={{ width: `${stepProgress * 100}%` }}
          transition={{ type: 'spring', stiffness: 200, damping: 30 }}
        />
      </div>
    );

    const startFlow = () => {
      setFlowState('active');
      setBookingData({});
      setCalendarMonth(startOfMonth(new Date()));
    };

    const resetFlow = () => {
      setFlowState('idle');
      setBookingData({});
      setCalendarMonth(startOfMonth(new Date()));
    };


    return (
      <div className="mb-6">
        {canBook && (
          <div className="space-y-3">
            <AnimatePresence initial={false}>
              {flowState === 'idle' && (
                <motion.button
                  key="reserve-button"
                  onClick={startFlow}
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                  className="flex w-full items-center justify-between rounded-full bg-black px-4 py-3 shadow-lg transition-all hover:bg-black/90"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10">
                      <CalendarIcon className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex flex-col items-start">
                      <span className="text-xs font-medium uppercase tracking-wide text-white/60">{format(new Date(), 'EEE d MMM', { locale: es })}</span>
                      <span className="text-lg font-semibold text-white">Reservar ahora</span>
                    </div>
                  </div>
                  <AnimatePresence initial={false} mode="wait">
                    <motion.span
                      key={iconVariant}
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 6 }}
                      transition={{ duration: 0.25 }}
                      className="flex h-10 w-10 items-center justify-center rounded-full bg-white"
                    >
                      {iconVariant === 'calendar' ? (
                        <CalendarIcon className="h-5 w-5 text-black" />
                      ) : (
                        <ChevronRight className="h-5 w-5 text-black" />
                      )}
                    </motion.span>
                  </AnimatePresence>
                </motion.button>
              )}
            </AnimatePresence>

            <AnimatePresence initial={false}>
              {flowState !== 'idle' && (
                <motion.div
                  key="booking-flow"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25, ease: 'easeInOut' }}
                  className="overflow-hidden"
                >
                  <div className="rounded-2xl border border-gray-200 bg-white p-3 shadow-sm">
                    {flowState === 'active' ? (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <button
                            onClick={handleBack}
                            className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-600 transition hover:border-black/40"
                            aria-label={isFirstStep ? 'Cerrar' : 'Volver'}
                          >
                            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M15 18l-6-6 6-6" />
                            </svg>
                          </button>
                          <div className="flex-1 px-3">{renderStepper()}</div>
                          <div className="w-8" />
                        </div>
                        <div className="space-y-1.5">
                          <div className="flex items-baseline justify-between">
                            <div>
                              <p className="text-sm font-semibold text-gray-900">{STEP_TITLES[currentStep].title}</p>
                              <p className="text-xs text-gray-500">{STEP_TITLES[currentStep].subtitle}</p>
                            </div>
                          </div>
                          <div className="pt-1.5">{renderStepContent()}</div>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3 text-center">
                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-green-600">
                          <Check className="h-6 w-6" />
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm font-semibold text-gray-900">Reserva enviada</p>
                          <p className="text-xs text-gray-500">
                            Hemos recibido tu solicitud. Te contactaremos pronto para confirmar la cita.
                          </p>
                        </div>
                        <button
                          onClick={resetFlow}
                          className="w-full rounded-2xl border border-gray-200 bg-white py-2.5 text-sm font-semibold text-gray-700 hover:border-black/40"
                        >
                          Crear otra reserva
                        </button>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
    );
  };

  const BookingSection = () => (
    <SectionRenderer
      card={card}
      sectionType="booking"
      defaultContent={
        card.booking && card.booking.enabled ? (
          <div className="mb-6">
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-4 text-white shadow-lg text-center">
              <h4 className="font-medium text-sm mb-2">{card.booking.title || 'Reservar Cita'}</h4>
              {card.booking.description && (
                <p className="text-xs text-white/70 mb-3">{card.booking.description}</p>
              )}
              <button className="bg-white text-black px-4 py-2 rounded-lg text-sm font-medium hover:bg-white/90 transition-colors">
                Reservar Ahora
              </button>
            </div>
          </div>
        ) : null
      }
    />
  );

  // Mapeo de secciones
  const sectionComponents: Record<string, () => JSX.Element | null> = {
    profile: ProfileSection,
    social: SocialSection,
    links: LinksSection,
    services: ServicesSection,
    portfolio: PortfolioSection,
    calendar: CalendarSection,
    booking: BookingSection,
  };

  // Renderizar secciones en el orden definido
  const renderSections = () => {
    // Obtener orden de secciones o usar orden por defecto
    const sectionsOrder = card.settings?.sectionsOrder || [
      { id: 'profile', type: 'profile', label: 'Perfil', isVisible: true, order: 0 },
      { id: 'social', type: 'social', label: 'Redes Sociales', isVisible: true, order: 1 },
      { id: 'links', type: 'links', label: 'Enlaces', isVisible: true, order: 2 },
      { id: 'services', type: 'services', label: 'Servicios', isVisible: true, order: 3 },
      { id: 'portfolio', type: 'portfolio', label: 'Portfolio', isVisible: true, order: 4 },
      { id: 'calendar', type: 'calendar', label: 'Calendario', isVisible: true, order: 5 },
      { id: 'booking', type: 'booking', label: 'Reservas', isVisible: true, order: 6 },
    ];

    // Ordenar y filtrar secciones visibles
    return sectionsOrder
      .sort((a, b) => a.order - b.order)
      .filter(section => section.isVisible)
      .map(section => {
        const SectionComponent = sectionComponents[section.type];
        return SectionComponent ? <SectionComponent key={section.id} /> : null;
      });
  };

  return (
    <>
      <div ref={containerRef} className="h-full flex items-center justify-center overflow-auto bg-[#1f1f1f]">
        <div
        className="relative bg-gradient-to-br from-gray-200 via-gray-300 to-gray-500 rounded-[36px] p-2 shadow-[0_20px_45px_rgba(0,0,0,0.45)]"
        style={{ width: frameSize.width, height: frameSize.height }}
      >
        {/* Phone Frame */}
        <div className="relative w-full h-full bg-orange-500 rounded-[30px] overflow-hidden border border-orange-100/40">
          {/* Content */}
          <div
            className="relative z-10 h-full overflow-y-auto py-6"
            style={{ 
              paddingLeft: '10px', 
              paddingRight: '10px',
              ...getBackgroundStyle()
            }}
          >
            {/* Renderizar secciones dinámicamente */}
            {renderSections()}
            
            {/* Spacer */}
            <div className="h-8"></div>
          </div>
        </div>

        {/* Custom CSS */}
        {customCSS && (
          <style dangerouslySetInnerHTML={{ __html: customCSS }} />
        )}
      </div>
    </div>
    </>
  );
};

export default MobilePreview;
