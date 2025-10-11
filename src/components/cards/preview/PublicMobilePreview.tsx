import React from 'react';
import { Card } from '@/types';
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
  ChevronRight,
  Calendar as CalendarIcon
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

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
  const showWatermark = card.settings?.branding?.showWatermark !== false;
  
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
        <div className="mb-6 space-y-3">
          <div className="w-full overflow-hidden rounded-3xl border border-slate-200 bg-white p-4 shadow-[0_22px_40px_-25px_rgba(15,23,42,0.28)]">
            <div className="relative">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1 text-left">
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
                  className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-3.5 py-2.5 text-slate-900 shadow-[0_18px_35px_-22px_rgba(15,23,42,0.25)] transition-all hover:shadow-[0_18px_45px_-20px_rgba(15,23,42,0.3)]"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-900 text-white">
                      <Phone className="h-4 w-4" />
                    </div>
                    <div className="flex flex-col text-left">
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
                  className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-3.5 py-2.5 text-slate-900 shadow-[0_18px_35px_-22px_rgba(15,23,42,0.25)] transition-all hover:shadow-[0_18px_45px_-20px_rgba(15,23,42,0.3)]"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-900 text-white">
                      <Globe className="h-4 w-4" />
                    </div>
                    <div className="flex flex-col text-left">
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
                      <div className="flex flex-col text-left">
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
    <PublicSectionRenderer
      card={card}
      sectionType="social"
      defaultContent={
        card.socialLinks && card.socialLinks.length > 0 ? (
          <div className="mb-6 flex justify-center space-x-3">
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
    <PublicSectionRenderer
      card={card}
      sectionType="services"
      defaultContent={
        card.services && card.services.length > 0 ? (
          <div className="mb-6 space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">Servicios</h3>
            {card.services
              .filter(service => service.isVisible)
              .sort((a, b) => a.order - b.order)
              .map((service) => (
                <div
                  key={service.id}
                  className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-3.5 py-3 text-slate-900 shadow-[0_18px_35px_-22px_rgba(15,23,42,0.25)]"
                >
                  <div className="flex flex-col gap-0.5 text-left">
                    <span className="text-sm font-semibold text-slate-900">{service.name}</span>
                    {service.description && (
                      <span className="text-[11px] text-slate-500">{service.description}</span>
                    )}
                    {service.duration && (
                      <span className="text-[10px] uppercase tracking-wide text-slate-400">{service.duration} min</span>
                    )}
                  </div>
                  <span className="rounded-full bg-slate-900 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-white">
                    {service.price > 0 ? `${service.price}${service.currency}` : 'Gratis'}
                  </span>
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

    if (!card.calendar?.enabled || !card.calendar?.isVisible) {
      return null;
    }

    const canBook = Boolean(card.calendar?.allowDirectBooking);

    const renderContent = () => (
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
    <div
      className={`relative mx-auto w-full max-w-sm overflow-hidden rounded-[30px] border border-slate-200 bg-white p-4 shadow-[0_24px_48px_-26px_rgba(15,23,42,0.35)] ${className}`.trim()}
      style={getBackgroundStyle()}
    >
      <div className="space-y-5">
        {ProfileSection()}
        {LinksSection()}
        {SocialSection()}
        {ServicesSection()}
        {PortfolioSection()}
        {CalendarSection()}
        {showBookingFlow && <BookingFlow card={card} onClose={() => setShowBookingFlow(false)} />}
      </div>
      {showWatermark && (
        <div className="mt-6 text-center text-[11px] font-medium uppercase tracking-[0.25em] text-white/70 drop-shadow-sm">
          Powered by Klycs
        </div>
      )}
      {customCSS && <style dangerouslySetInnerHTML={{ __html: customCSS }} />}
    </div>
  );
};

export default PublicMobilePreview;
