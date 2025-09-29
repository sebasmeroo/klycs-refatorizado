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
  Video as VideoIcon
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
                    style={{ aspectRatio: card.portfolio.style.aspectRatio === 'square' ? '1 / 1' : card.portfolio.style.aspectRatio === '16:9' ? '16 / 9' : card.portfolio.style.aspectRatio === '4:3' ? '4 / 3' : undefined }}
                  >
                    {item.type === 'image' ? (
                      <img src={item.url} alt={item.title || 'Portfolio item'} className="w-full h-full object-cover" />
                    ) : (
                      <video src={item.url} className="w-full h-full object-cover" controls playsInline />
                    )}
                    <div className="absolute top-3 left-3 inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-black/60 text-white backdrop-blur-sm">
                      {item.type === 'image' ? <ImageIcon className="w-3 h-3 mr-1" /> : <VideoIcon className="w-3 h-3 mr-1" />} {item.type === 'image' ? 'Imagen' : 'Video'}
                    </div>
                    {(item.title || item.description) && (
                      <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 via-black/40 to-transparent text-white">
                        {item.title && <p className="text-sm font-semibold">{item.title}</p>}
                        {item.description && <p className="text-xs text-white/80">{item.description}</p>}
                      </div>
                    )}
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

    return (
      <div className="mb-6">
        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-5 shadow-lg">
          {/* Header */}
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-white mb-1">{card.calendar.title}</h3>
            {card.calendar.description && (
              <p className="text-sm text-white/70">{card.calendar.description}</p>
            )}
          </div>

          {/* Profesionales Grid - Estilo iOS */}
          {card.calendar.showProfessionals && (
            <div className="space-y-3">
              <p className="text-xs font-medium text-white/50 uppercase tracking-wider">Profesionales</p>
              {loading ? (
                <div className="flex justify-center py-4">
                  <div className="animate-spin w-6 h-6 border-2 border-white/30 border-t-white rounded-full"></div>
                </div>
              ) : professionals.length > 0 ? (
                <div className="grid grid-cols-2 gap-3">
                  {professionals.map((prof) => (
                    <div
                      key={prof.id}
                      className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/20 hover:bg-white/15 transition-all"
                    >
                      <div className="flex flex-col items-center text-center">
                        {prof.avatar ? (
                          <img
                            src={prof.avatar}
                            alt={prof.name}
                            className="w-12 h-12 rounded-full mb-2 object-cover border-2 shadow-lg"
                            style={{ borderColor: prof.color }}
                          />
                        ) : (
                          <div
                            className="w-12 h-12 rounded-full mb-2 flex items-center justify-center text-white font-semibold shadow-lg"
                            style={{ backgroundColor: prof.color }}
                          >
                            {prof.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <p className="text-sm font-medium text-white truncate w-full px-1">{prof.name}</p>
                        <p className="text-xs text-white/60 truncate w-full px-1">{prof.role}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-white/50 text-sm">
                  No hay profesionales disponibles
                </div>
              )}
            </div>
          )}

          {/* Botón de Reservar */}
          {card.calendar.allowDirectBooking && (
            <div className="mt-4 pt-4 border-t border-white/10">
              <button
                onClick={() => setShowBookingFlow(true)}
                className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-3 rounded-xl text-sm font-medium hover:shadow-lg transition-all"
              >
                📅 Reservar Cita
              </button>
            </div>
          )}
        </div>
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
