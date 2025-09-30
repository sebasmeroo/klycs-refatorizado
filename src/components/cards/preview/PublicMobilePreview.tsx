import React from 'react';
import { Card, CardCalendar } from '@/types';
import PublicSectionRenderer from './PublicSectionRenderer';
import { BookingFlow } from './BookingFlow';
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
  ChevronRight
} from 'lucide-react';

interface PublicMobilePreviewProps {
  card: Card;
  customCSS?: string;
  className?: string;
}

export const PublicMobilePreview: React.FC<PublicMobilePreviewProps> = ({ 
  card, 
  customCSS,
  className = ''
}) => {
  const [showBookingFlow, setShowBookingFlow] = React.useState(false);
  
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
    <PublicSectionRenderer
      card={card}
      sectionType="profile"
      defaultContent={
        <div className="text-center mb-6">
          {/* Avatar */}
          {card.profile.avatar && (
            <div className="w-24 h-24 mx-auto mb-4">
              <img
                src={card.profile.avatar}
                alt={card.profile.name}
                className="w-full h-full object-cover rounded-full border-4 border-white/20 shadow-lg"
              />
            </div>
          )}
          
          {/* Name */}
          {card.profile.name && (
            <h1 className="text-2xl font-bold text-white mb-1">
              {card.profile.name}
            </h1>
          )}
          
          {card.profile.tagline && (
            <p className="text-white/80 text-sm italic mb-3">
              {card.profile.tagline}
            </p>
          )}

          {/* Bio */}
          {card.profile.bio && (
            <p className="text-white/90 text-sm leading-relaxed">
              {card.profile.bio}
            </p>
          )}

          {(card.profile.phone || card.profile.website) && (
            <div className="mt-4 flex flex-col items-center space-y-2">
              {card.profile.phone && (
                <a
                  href={`tel:${card.profile.phone}`}
                  className="inline-flex items-center gap-2 text-white/90 text-sm bg-white/10 backdrop-blur-sm border border-white/20 px-4 py-2 rounded-full hover:bg-white/20 transition-colors"
                >
                  <Phone className="w-4 h-4" />
                  <span>{card.profile.phone}</span>
                </a>
              )}
              {card.profile.website && (
                <a
                  href={formatWebsiteUrl(card.profile.website)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-white/90 text-sm bg-white/10 backdrop-blur-sm border border-white/20 px-4 py-2 rounded-full hover:bg-white/20 transition-colors"
                >
                  <Globe className="w-4 h-4" />
                  <span className="truncate max-w-[200px]">{card.profile.website}</span>
                </a>
              )}
            </div>
          )}
        </div>
      }
    />
  );

  const LinksSection = () => (
    <PublicSectionRenderer
      card={card}
      sectionType="links"
      defaultContent={
        <div className="space-y-3 mb-6">
          {card.links
            .filter(link => link.isVisible)
            .sort((a, b) => a.order - b.order)
            .map((link) => (
              <PublicSectionRenderer
                key={link.id}
                card={card}
                sectionType="links"
                targetItemId={link.id}
                defaultContent={
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-4 text-white hover:bg-white/20 transition-all duration-200 shadow-lg"
                    style={{
                      backgroundColor: link.style?.backgroundColor || undefined,
                      color: link.style?.textColor || undefined
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="w-6 h-6 mr-3 flex items-center justify-center">
                          {link.iconType === 'emoji' ? (
                            <span className="text-lg">{link.icon}</span>
                          ) : (
                            <ExternalLink className="w-5 h-5" />
                          )}
                        </div>
                        <div className="text-left">
                          <div className="font-medium text-sm">{link.title}</div>
                          {link.description && (
                            <div className="text-xs text-white/70">{link.description}</div>
                          )}
                        </div>
                      </div>
                      <ExternalLink className="w-4 h-4 opacity-70" />
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
    <PublicSectionRenderer
      card={card}
      sectionType="social"
      defaultContent={
        card.socialLinks && card.socialLinks.length > 0 ? (
          <div className="flex justify-center space-x-4 mb-6">
            {card.socialLinks
              .filter(social => social.isVisible)
              .map((social) => (
                <a
                  key={social.id}
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-12 h-12 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-all duration-200 shadow-lg"
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
    <PublicSectionRenderer
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
            <img src={item.url} alt={item.title || 'Portfolio item'} className="w-full h-full object-cover" />
          ) : (
            <video src={item.url} className="w-full h-full object-cover" controls playsInline />
          )}
        </div>
        <div className="absolute inset-0 rounded-2xl border border-white/10" style={{ pointerEvents: 'none' }} />
        <div className="absolute top-3 left-3 inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-black/60 text-white backdrop-blur-sm">
          {item.type === 'image' ? <ImageIcon className="w-3 h-3 mr-1" /> : <VideoIcon className="w-3 h-3 mr-1" />} {item.type === 'image' ? 'Imagen' : 'Video'}
        </div>
        {(item.title || item.description) && (
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 via-black/40 to-transparent text-white">
            {item.title && <p className="text-sm font-semibold">{item.title}</p>}
            {item.description && <p className="text-xs text-white/80">{item.description}</p>}
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
        <PublicSectionRenderer
          card={card}
          sectionType="portfolio"
          defaultContent={
            <div className="mb-6 space-y-3">
              {card.portfolio.title && (
                <h3 className="text-lg font-semibold text-white px-1">{card.portfolio.title}</h3>
              )}
              <div className="relative flex justify-center px-3">
                <div className="relative w-full max-w-sm">
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

    return (
      <PublicSectionRenderer
        card={card}
        sectionType="portfolio"
        defaultContent={
          <div className="mb-6 space-y-3">
            {card.portfolio.title && (
              <h3 className="text-lg font-semibold text-white px-1">{card.portfolio.title}</h3>
            )}
            <div className="grid grid-cols-1 gap-3">
              {items
                .sort((a, b) => a.order - b.order)
                .map(item => (
                  <div
                    key={item.id}
                    className="relative overflow-hidden rounded-2xl border border-white/15 bg-black/30 backdrop-blur-md"
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

  const CalendarSection = () => {
    const [professionals, setProfessionals] = React.useState<any[]>([]);
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
      const loadProfessionals = async () => {
        if (!card.calendar?.linkedCalendarId || !card.userId) {
          setLoading(false);
          return;
        }

        try {
          const { CollaborativeCalendarService } = await import('@/services/collaborativeCalendar');
          const profs = await CollaborativeCalendarService.getProfessionals(card.userId);
          setProfessionals(profs.filter(p => p.isActive));
        } catch (error) {
          console.error('Error loading professionals:', error);
          setProfessionals([]);
        } finally {
          setLoading(false);
        }
      };

      loadProfessionals();
    }, [card.calendar?.linkedCalendarId, card.userId]);

    if (!card.calendar?.enabled || !card.calendar?.isVisible) {
      return null;
    }

    const designVariant: NonNullable<CardCalendar['designVariant']> = (card.calendar?.designVariant as any) || 'minimal';
    const canBook = Boolean(card.calendar?.allowDirectBooking);
    const services = card.services?.filter(service => service.isActive) ?? [];
    const primaryService = services[0];
    const heroTitle = primaryService?.name || card.calendar?.title || 'Reserva tu Cita';
    const heroSubtitle = primaryService?.description || card.calendar?.description || 'Descubre disponibilidad en pocos pasos.';
    const heroMeta = [
      {
        label: 'Duración',
        value: primaryService?.duration ? `${primaryService.duration} min` : '60 min'
      },
      {
        label: 'Profesionales',
        value: `${professionals.length || 1}`
      },
      {
        label: 'Disponibilidad',
        value: card.calendar?.bookingConfig.showAvailability ? 'Abierta' : 'A confirmar'
      }
    ];
    const featuredProfessionals = professionals.slice(0, 3);

    const renderProfessionalsRail = (items: any[], compact = false) => {
      if (loading) {
        return (
          <div className="flex justify-center py-4">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-transparent"></div>
          </div>
        );
      }

      if (items.length === 0) {
        return (
          <p className="text-sm text-gray-500">No hay profesionales disponibles</p>
        );
      }

      return compact ? (
        <div className="grid gap-1.5">
          {items.map((prof) => (
            <div key={prof.id} className="flex items-center gap-2 rounded-2xl border border-gray-100 bg-gray-50 px-3 py-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-900/80 text-white text-xs">
                {prof.name.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-gray-900">{prof.name}</p>
                <p className="truncate text-[11px] text-gray-500">{prof.role || 'Profesional'}</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex gap-3">
          {items.map((prof) => (
            <div key={prof.id} className="flex items-center gap-2 rounded-2xl bg-white/20 px-3 py-2 text-xs text-white backdrop-blur">
              {prof.avatar ? (
                <img src={prof.avatar} alt={prof.name} className="h-8 w-8 rounded-full object-cover" />
              ) : (
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-black/30 text-white">
                  {prof.name.charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <p className="font-semibold leading-tight">{prof.name}</p>
                <p className="text-[11px] text-white/70">{prof.role || 'Profesional'}</p>
              </div>
            </div>
          ))}
        </div>
      );
    };

    const renderContent = () => {
      if (designVariant === 'glass') {
        return (
          <div className="space-y-3">
            <div className="relative overflow-hidden rounded-3xl border border-white/20 bg-gradient-to-br from-[#6C4BFF] via-[#8B5CF6] to-[#EC4899] p-5 text-white shadow-2xl">
              <div className="absolute inset-0 bg-white/10 backdrop-blur-md" />
              <div className="relative space-y-3">
                <div className="flex items-start justify-between">
                  <div className="pr-8">
                    <p className="text-xs uppercase tracking-[0.2em] text-white/70">Ruta destacada</p>
                    <h3 className="mt-1 text-2xl font-semibold leading-tight">{heroTitle}</h3>
                    <p className="mt-1 text-sm text-white/80">{heroSubtitle}</p>
                  </div>
                  {canBook && (
                    <button
                      onClick={() => setShowBookingFlow(true)}
                      className="flex h-9 w-9 items-center justify-center rounded-full bg-white/25 text-white backdrop-blur transition hover:bg-white/35"
                    >
                      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M5 12h14" />
                        <path d="m12 5 7 7-7 7" />
                      </svg>
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-4 text-xs font-medium text-white/85">
                  {heroMeta.map(meta => (
                    <div key={meta.label} className="flex flex-col">
                      <span className="uppercase tracking-wide text-white/60">{meta.label}</span>
                      <span>{meta.value}</span>
                    </div>
                  ))}
                </div>
                {card.calendar?.showProfessionals && featuredProfessionals.length > 0 && (
                  renderProfessionalsRail(featuredProfessionals)
                )}
              </div>
            </div>
          </div>
        );
      }

      if (designVariant === 'spotlight') {
        const primaryProfessional = featuredProfessionals[0];
        return (
          <div className="space-y-2">
            {primaryProfessional && (
              <div className="flex items-center gap-3 rounded-3xl border border-gray-200 bg-white p-3 shadow-sm">
                {primaryProfessional.avatar ? (
                  <img src={primaryProfessional.avatar} alt={primaryProfessional.name} className="h-12 w-12 rounded-full object-cover" />
                ) : (
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-900 text-sm font-semibold text-white">
                    {primaryProfessional.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-gray-900">{primaryProfessional.name}</p>
                  <p className="truncate text-xs text-gray-500">{primaryProfessional.role || 'Profesional destacado'}</p>
                </div>
                {canBook && (
                  <button
                    onClick={() => setShowBookingFlow(true)}
                    className="rounded-full bg-black px-3 py-1.5 text-xs font-semibold text-white hover:bg-black/90"
                  >
                    Reservar
                  </button>
                )}
              </div>
            )}

            {card.calendar?.showProfessionals && featuredProfessionals.slice(1).length > 0 && (
              renderProfessionalsRail(featuredProfessionals.slice(1), true)
            )}
          </div>
        );
      }

      return (
        <div className="space-y-3">
          {canBook && (
            <button
              onClick={() => setShowBookingFlow(true)}
              className="flex items-center justify-between rounded-2xl border border-gray-200 bg-white px-3 py-2 shadow-sm transition hover:border-black/40"
            >
              <span className="text-sm font-semibold text-gray-900">Reservar cita</span>
              <CalendarIcon className="h-5 w-5 text-gray-400" />
            </button>
          )}
        </div>
      );
    };

    return (
      <div className="mb-6 space-y-3">
        {renderContent()}
      </div>
    );
  };

  const BookingSection = () => (
    <PublicSectionRenderer
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
      <div className={`w-full max-w-sm mx-auto ${className}`}>
        <div
          className="relative bg-black rounded-[24px] overflow-hidden min-h-[600px]"
          style={getBackgroundStyle()}
        >
          <div className="relative z-10 h-full overflow-y-auto py-6 px-4">
            {/* Renderizar secciones dinámicamente */}
            {renderSections()}
            
            {/* Spacer */}
            <div className="h-8"></div>
          </div>

          {/* Custom CSS */}
          {customCSS && (
            <style dangerouslySetInnerHTML={{ __html: customCSS }} />
          )}
        </div>
      </div>

      {/* Booking Flow Modal */}
      {showBookingFlow && (
        <BookingFlow
          card={card}
          onClose={() => setShowBookingFlow(false)}
        />
      )}
    </>
  );
};

export default PublicMobilePreview;
