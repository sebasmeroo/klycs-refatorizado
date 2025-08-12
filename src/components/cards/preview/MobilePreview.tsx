import React, { useMemo } from 'react';
import { Card, CardElement } from '@/types';
import { CustomHtmlSandbox } from './CustomHtmlSandbox';
import { getDefaultProfileDesign } from '@/data/profileDesignPresets';
import { templateRegistry } from '@/services/templateRegistry.tsx';
import SectionRenderer from './SectionRenderer';
import { 
  ExternalLink, 
  Instagram, 
  Twitter, 
  Linkedin, 
  Facebook, 
  Youtube,
  Calendar,
  Play
} from 'lucide-react';

interface MobilePreviewProps {
  card: Card;
  customCSS?: string;
}

export const MobilePreview: React.FC<MobilePreviewProps> = ({ card, customCSS }) => {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [frameSize, setFrameSize] = React.useState<{ width: number; height: number }>({ width: 280, height: 600 });

  React.useEffect(() => {
    const updateSize = () => {
      const el = containerRef.current;
      if (!el) return;
      const availableHeight = el.clientHeight || 600;
      // Ocupamos el 95% del alto disponible; razón de aspecto ~0.467 (280/600)
      const height = Math.max(600, Math.min(availableHeight * 0.95, 980));
      const width = height * (280 / 600);
      setFrameSize({ width, height });
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // Si la card trae un componente registrado, lo renderizamos directamente
  // @ts-expect-error campo extendido a nivel de app
  const componentEntry = card?.templateComponent as { id: string; props?: any } | undefined;
  
  // Renderizar usando el registro de plantillas
  const renderTemplateComponent = () => {
    if (componentEntry?.id && templateRegistry.has(componentEntry.id)) {
      return templateRegistry.render(componentEntry.id, card, componentEntry.props);
    }
    return null;
  };

  const templateComponent = renderTemplateComponent();

  // Ordenar elementos por su posición
  const sortedElements = useMemo(() => {
    const elements = [
      { type: 'profile', order: 0, component: 'ProfileSection' },
      { type: 'bio', order: 1, component: 'BioSection' },
      { type: 'links', order: 2, component: 'LinksSection' },
      { type: 'social', order: 3, component: 'SocialSection' },
      { type: 'services', order: 4, component: 'ServicesSection' },
      { type: 'portfolio', order: card.portfolio?.order || 5, component: 'PortfolioSection' },
      { type: 'booking', order: 6, component: 'BookingSection' },
      ...card.elements.filter(el => el.isVisible).map(el => ({ 
        type: el.type, 
        order: el.order, 
        component: 'CustomElement',
        element: el
      }))
    ];
    
    return elements.sort((a, b) => a.order - b.order);
  }, [card]);

  const getSocialIcon = (platform: string) => {
    switch (platform) {
      case 'instagram': return <Instagram className="w-5 h-5" />;
      case 'twitter': return <Twitter className="w-5 h-5" />;
      case 'linkedin': return <Linkedin className="w-5 h-5" />;
      case 'facebook': return <Facebook className="w-5 h-5" />;
      case 'youtube': return <Youtube className="w-5 h-5" />;
      default: return <ExternalLink className="w-5 h-5" />;
    }
  };

  const ProfileSection = () => {
    // Usar diseño avanzado si existe, si no usar valores por defecto
    const design = card.profile.design ?? getDefaultProfileDesign();
    
    // Generar elementos según el orden configurado
    const sortedElements = (design.layout?.order ?? [])
      .filter(element => element.enabled)
      .sort((a, b) => a.order - b.order);

    const containerStyle = {
      textAlign: design.layout.alignment.horizontal,
      justifyContent: design.layout.alignment.horizontal === 'center' ? 'center' : 
                     design.layout.alignment.horizontal === 'right' ? 'flex-end' : 'flex-start',
      alignItems: design.layout.alignment.vertical === 'center' ? 'center' :
                  design.layout.alignment.vertical === 'bottom' ? 'flex-end' : 'flex-start',
      padding: `${design.spacing.containerPadding.top}px ${design.spacing.containerPadding.right}px ${design.spacing.containerPadding.bottom}px ${design.spacing.containerPadding.left}px`,
      gap: `${design.spacing.elementSpacing}px`
    };

    const avatarStyle = {
      width: `${design.elements.avatar.size}px`,
      height: `${design.elements.avatar.size}px`,
      borderRadius: `${design.elements.avatar.borderRadius}px`,
      border: design.elements.avatar.border.width > 0 
        ? `${design.elements.avatar.border.width}px ${design.elements.avatar.border.style} ${design.elements.avatar.border.color}`
        : 'none',
      boxShadow: design.elements.avatar.shadow.enabled
        ? `${design.elements.avatar.shadow.x}px ${design.elements.avatar.shadow.y}px ${design.elements.avatar.shadow.blur}px ${design.elements.avatar.shadow.spread}px ${design.elements.avatar.shadow.color}${Math.round(design.elements.avatar.shadow.opacity * 255).toString(16).padStart(2, '0')}`
        : 'none',
      transform: `translate(${design.elements.avatar.position.x}px, ${design.elements.avatar.position.y}px)`
    };

    const nameStyle = {
      fontFamily: design.elements.name.fontFamily,
      fontSize: `${design.elements.name.fontSize}px`,
      fontWeight: design.elements.name.fontWeight,
      lineHeight: design.elements.name.lineHeight,
      letterSpacing: `${design.elements.name.letterSpacing}px`,
      textAlign: design.elements.name.textAlign,
      color: design.elements.name.color,
      textShadow: design.elements.name.textShadow?.enabled 
        ? `${design.elements.name.textShadow.x}px ${design.elements.name.textShadow.y}px ${design.elements.name.textShadow.blur}px ${design.elements.name.textShadow.color}${Math.round((design.elements.name.textShadow.opacity || 1) * 255).toString(16).padStart(2, '0')}`
        : 'none',
      padding: `${design.elements.name.padding.top}px ${design.elements.name.padding.right}px ${design.elements.name.padding.bottom}px ${design.elements.name.padding.left}px`,
      margin: `${design.elements.name.margin.top}px ${design.elements.name.margin.right}px ${design.elements.name.margin.bottom}px ${design.elements.name.margin.left}px`
    };

    const bioStyle = {
      fontFamily: design.elements.bio.fontFamily,
      fontSize: `${design.elements.bio.fontSize}px`,
      fontWeight: design.elements.bio.fontWeight,
      lineHeight: design.elements.bio.lineHeight,
      letterSpacing: `${design.elements.bio.letterSpacing}px`,
      textAlign: design.elements.bio.textAlign,
      color: design.elements.bio.color,
      textShadow: design.elements.bio.textShadow?.enabled 
        ? `${design.elements.bio.textShadow.x}px ${design.elements.bio.textShadow.y}px ${design.elements.bio.textShadow.blur}px ${design.elements.bio.textShadow.color}${Math.round((design.elements.bio.textShadow.opacity || 1) * 255).toString(16).padStart(2, '0')}`
        : 'none',
      padding: `${design.elements.bio.padding.top}px ${design.elements.bio.padding.right}px ${design.elements.bio.padding.bottom}px ${design.elements.bio.padding.left}px`,
      margin: `${design.elements.bio.margin.top}px ${design.elements.bio.margin.right}px ${design.elements.bio.margin.bottom}px ${design.elements.bio.margin.left}px`
    };

    // Si el usuario eligió hoja en blanco, renderizar su sandbox directamente
    if (card.profile.useCustomCode) {
      const c = card.profile.customCode || {};
      return (
        <div className="mb-6">
          <CustomHtmlSandbox html={c.html} css={c.css} js={c.js} height={c.height || 320} />
        </div>
      );
    }

    const isPoster = design.container.variant === 'poster';
    const isTicket = design.container.variant === 'ticket';
    return (
      <div className="mb-6">
        <div
          className={`w-full ${isPoster ? 'rounded-[24px] p-6 bg-[#d6e3e2]' : ''} ${isTicket ? 'rounded-[28px] p-4 bg-[#0a0a0a]' : ''}`}
          style={isPoster ? ({
            background: card.profile.design?.content?.poster?.bgColor || '#d6e3e2',
            border: `2px solid ${card.profile.design?.content?.poster?.frameBorderColor || '#0b0f12'}`,
            boxShadow: `inset 0 0 0 2px ${card.profile.design?.content?.poster?.frameBorderColor || '#0b0f12'}, 0 4px 0 ${card.profile.design?.content?.poster?.frameBorderColor || '#0b0f12'}`,
          } as React.CSSProperties) : isTicket ? ({
            background: card.profile.design?.content?.ticket?.frameBgColor || '#0a0a0a',
            border: '1px solid #1a1a1a',
            boxShadow: '0 8px 30px rgba(0,0,0,0.45) inset, 0 12px 24px rgba(0,0,0,0.35)',
          } as React.CSSProperties) : undefined}
        >
          {isPoster ? (
            <div className="flex flex-col items-center">
              {/* Ilustración superior (vector simple monocromo) */}
              <svg
                width="150"
                height="90"
                viewBox="0 0 150 90"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="mt-2 mb-4"
              >
                <g stroke="#0b0f12" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  {/* Silla izquierda */}
                  <path d="M20 65 L40 30 L50 30 L30 65 Z"/>
                  <path d="M18 65 L52 65"/>
                  {/* Persona izquierda */}
                  <circle cx="42" cy="22" r="10"/>
                  {/* Silla derecha */}
                  <path d="M100 65 L120 30 L130 30 L110 65 Z"/>
                  <path d="M98 65 L132 65"/>
                  {/* Persona derecha */}
                  <circle cx="122" cy="22" r="10"/>
                </g>
              </svg>

              {/* Título */}
              <h2 className="text-center font-extrabold uppercase leading-tight"
                  style={{ fontSize: 16, letterSpacing: 0, lineHeight: 1.15 }}>
                {card.profile.design?.content?.poster?.titleTop || 'STILL WASTING TIME'}
                <br />
                {card.profile.design?.content?.poster?.titleBottom || 'LOOKING FOR TICKETS?'}
              </h2>

              {/* Subtítulo */}
              <p className="text-center text-[11px] leading-snug max-w-[240px] mt-2" style={{ color: '#0b0f12cc' }}>
                {card.profile.design?.content?.poster?.subtitle || 'Simply relax and download our app, we\'ll take care of the rest.'}
              </p>

              {/* CTA */}
              <div className="mt-6">
                <button
                  className="px-6 py-3 rounded-full text-[12px] font-semibold border-2"
                  style={{
                    background: card.profile.design?.content?.poster?.ctaBgColor || '#eef4ea',
                    color: card.profile.design?.content?.poster?.ctaTextColor || '#0b0f12',
                    borderColor: card.profile.design?.content?.poster?.frameBorderColor || '#0b0f12',
                  }}
                >
                  {card.profile.design?.content?.poster?.ctaText || 'GET THE APP FOR FREE'}
                </button>
              </div>
            </div>
          ) : isTicket ? (
            <div className="relative">
              {/* Tarjeta naranja con QR */}
              <div className="mx-auto w-full rounded-[20px] p-4 shadow-[0_10px_20px_rgba(0,0,0,0.25)]" style={{ background: card.profile.design?.content?.ticket?.primaryColor || '#ff3b00', color: card.profile.design?.content?.ticket?.textColor || '#0a0a0a' }}>
                <div className="flex items-center justify-between text-[10px] font-semibold opacity-90">
                  <span>{card.profile.design?.content?.ticket?.dateText || 'MONDAY, JULY 23'}</span>
                  <span>{card.profile.design?.content?.ticket?.timeText || '9:00 - 10:00'}</span>
                </div>
                <div className="mt-1 text-[18px] font-extrabold tracking-tight">
                  {card.profile.design?.content?.ticket?.eventTitle || 'ART OF VICTORY'}
                </div>

                {/* QR simulado */}
                <div className="mt-4 w-full aspect-square grid grid-cols-6 gap-[3px] bg-[#0a0a0a] p-[6px] rounded-[8px]">
                  {Array.from({ length: 36 }).map((_, i) => (
                    <div key={i} className={`${(i + Math.floor(i/6)) % 2 === 0 ? 'bg-[#ff3b00]' : 'bg-[#0a0a0a]'} rounded-[1px]`}></div>
                  ))}
                </div>

                <div className="mt-4 text-[10px]">
                  <div className="font-semibold">{card.profile.design?.content?.ticket?.attendeeName || 'Anna Jordan'}</div>
                  <div className="opacity-80">{card.profile.design?.content?.ticket?.attendeeEmail || 'anna.jordan@email.com'}</div>
                </div>
              </div>

              {/* Dock inferior con 2 botones */}
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-[16px] backdrop-blur-md border border-white/10 p-3 text-center text-[11px] text-white/90 shadow-[0_8px_20px_rgba(0,0,0,0.25)]" style={{ background: card.profile.design?.content?.ticket?.dockBgColor || 'rgba(255,255,255,0.08)' }}>
                  {card.profile.design?.content?.ticket?.ctaPrimary || 'Your Tickets'}
                </div>
                <div className="rounded-[16px] backdrop-blur-md border border-white/10 p-3 text-center text-[11px] text-white/90 shadow-[0_8px_20px_rgba(0,0,0,0.25)]" style={{ background: card.profile.design?.content?.ticket?.dockBgColor || 'rgba(255,255,255,0.08)' }}>
                  {card.profile.design?.content?.ticket?.ctaSecondary || 'Get Directions'}
                </div>
              </div>
            </div>
          ) : (
            <div
              className={`${design.layout.direction === 'column' ? 'flex flex-col' : 'flex flex-row'}`}
              style={{
                ...containerStyle,
                background: design.container.backgroundColor,
                borderRadius: `${design.container.borderRadius}px`,
                border:
                  design.container.border.width > 0
                    ? `${design.container.border.width}px ${design.container.border.style} ${design.container.border.color}`
                    : 'none',
              } as React.CSSProperties}
            >
              {sortedElements.map((element) => {
                switch (element.id) {
                  case 'avatar':
                    return (
                      <div key="avatar" className="relative inline-block">
                        {card.profile.avatar ? (
                          <img
                            src={card.profile.avatar}
                            alt={card.profile.name}
                            className="object-cover"
                            style={avatarStyle}
                          />
                        ) : (
                          <div
                            className="flex items-center justify-center bg-gradient-to-br from-blue-400 to-purple-500"
                            style={avatarStyle}
                          >
                            <span className="text-white font-bold" style={{ fontSize: `${design.elements.avatar.size * 0.4}px` }}>
                              {card.profile.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  case 'name':
                    return (
                      <h1 key="name" style={nameStyle as React.CSSProperties}>
                        {card.profile.name}
                      </h1>
                    );
                  case 'bio':
                    return card.profile.bio ? (
                      <p key="bio" style={bioStyle as React.CSSProperties}>
                        {card.profile.bio}
                      </p>
                    ) : null;
                  default:
                    return null;
                }
              })}
            </div>
          )}
          {isPoster && (
            <div className="mt-4 flex justify-center">
              <button className="px-5 py-3 rounded-full bg-[#0b0f12] text-[#e8efe8] text-sm font-semibold">
                GET THE APP FOR FREE
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  const LinksSection = () => (
    <div className="space-y-3 mb-6">
      {card.links
        .filter(link => link.isVisible)
        .sort((a, b) => a.order - b.order)
        .map((link) => (
          <button
            key={link.id}
            className="w-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-4 text-white hover:bg-white/20 transition-all duration-200 shadow-lg"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                {link.icon && (
                  <div className="w-6 h-6 mr-3 flex items-center justify-center">
                    {link.iconType === 'emoji' ? (
                      <span className="text-lg">{link.icon}</span>
                    ) : (
                      <ExternalLink className="w-5 h-5" />
                    )}
                  </div>
                )}
                <div className="text-left">
                  <div className="font-medium text-sm">{link.title}</div>
                  {link.description && (
                    <div className="text-xs text-white/70">{link.description}</div>
                  )}
                </div>
              </div>
              <ExternalLink className="w-4 h-4 opacity-70" />
            </div>
          </button>
        ))}
    </div>
  );

  const SocialSection = () => {
    const visibleSocials = card.socialLinks?.filter(social => social.isVisible) || [];
    
    if (visibleSocials.length === 0) return null;

    return (
      <div className="mb-6">
        <h3 className="text-white font-semibold mb-3 text-center">Sígueme</h3>
        <div className="flex justify-center space-x-4">
          {visibleSocials
            .sort((a, b) => a.order - b.order)
            .slice(0, 6) // Máximo 6 iconos por fila
            .map((social) => (
              <button
                key={social.id}
                className="w-12 h-12 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-all duration-200 shadow-lg"
              >
                {getSocialIcon(social.platform)}
              </button>
            ))}
        </div>
      </div>
    );
  };

  const ServicesSection = () => {
    const visibleServices = card.services?.filter(service => service.isVisible) || [];
    
    if (visibleServices.length === 0) return null;

    return (
      <div className="mb-6">
        <h3 className="text-white font-semibold mb-4 text-center">Servicios</h3>
        <div className="space-y-3">
          {visibleServices
            .sort((a, b) => a.order - b.order)
            .map((service) => (
              <div
                key={service.id}
                className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-4 shadow-lg"
              >
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-medium text-white text-sm">{service.name}</h4>
                  <div className="text-right">
                    <div className="text-white font-bold text-sm">
                      {service.price} {service.currency}
                    </div>
                    {service.duration && (
                      <div className="text-white/70 text-xs">
                        {service.duration}min
                      </div>
                    )}
                  </div>
                </div>
                <p className="text-white/80 text-xs mb-3">{service.description}</p>
                {service.booking?.enabled && (
                  <button className="w-full bg-white/20 text-white text-xs font-medium py-2 px-4 rounded-lg hover:bg-white/30 transition-colors flex items-center justify-center">
                    <Calendar className="w-4 h-4 mr-2" />
                    Reservar
                  </button>
                )}
              </div>
            ))}
        </div>
      </div>
    );
  };

  const PortfolioSection = () => {
    if (!card.portfolio?.isVisible || !card.portfolio.items.length) return null;

    const visibleItems = card.portfolio.items
      .filter(item => item.isVisible)
      .sort((a, b) => a.order - b.order);

    return (
      <div className="mb-6">
        {card.portfolio.showTitle && card.portfolio.title && (
          <h3 className="text-white font-semibold mb-4 text-center">
            {card.portfolio.title}
          </h3>
        )}
        <div className={`grid gap-2 ${
          card.portfolio.style.columns === 1 ? 'grid-cols-1' :
          card.portfolio.style.columns === 2 ? 'grid-cols-2' :
          'grid-cols-3'
        }`}>
          {visibleItems.slice(0, 6).map((item) => (
            <div
              key={item.id}
              className="relative bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg overflow-hidden aspect-square shadow-lg"
            >
              {item.type === 'image' ? (
                <img
                  src={item.url}
                  alt={item.title || ''}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-black/20 flex items-center justify-center">
                  {item.thumbnail ? (
                    <img
                      src={item.thumbnail}
                      alt={item.title || ''}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Play className="w-8 h-8 text-white/70" />
                  )}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Play className="w-6 h-6 text-white bg-black/50 rounded-full p-1" />
                  </div>
                </div>
              )}
              
              {/* Overlay con título */}
              {item.title && (
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                  <p className="text-white text-xs font-medium truncate">
                    {item.title}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const BookingSection = () => {
    if (!card.booking?.enabled) return null;

    return (
      <div className="mb-6">
        <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-4 text-center shadow-lg">
          <h3 className="text-white font-semibold mb-2">{card.booking.title}</h3>
          {card.booking.description && (
            <p className="text-white/80 text-sm mb-4">{card.booking.description}</p>
          )}
          <button className="w-full bg-white text-gray-900 font-medium py-3 px-4 rounded-lg hover:bg-gray-100 transition-colors flex items-center justify-center shadow-md">
            <Calendar className="w-4 h-4 mr-2" />
            Reservar Cita
          </button>
        </div>
      </div>
    );
  };

  const CustomElement = ({ element }: { element: any }) => {
    switch (element.type) {
      case 'text':
        return (
          <div className="mb-4">
            <div 
              className="text-white/90 text-sm leading-relaxed text-center"
              dangerouslySetInnerHTML={{ __html: element.content.text || '' }}
            />
          </div>
        );
      case 'divider':
        return (
          <div className="mb-6 flex justify-center">
            <div className="w-16 h-px bg-white/30"></div>
          </div>
        );
      case 'spacer':
        return <div className={`mb-${element.content.size || 4}`}></div>;
      case 'custom-code': {
        const { html = '', css = '', js = '', height = 320 } = element.content || {};
        return (
          <div className="mb-6">
            <CustomHtmlSandbox html={html} css={css} js={js} height={height} />
          </div>
        );
      }
      default:
        return null;
    }
  };

  return (
    <div className="relative h-full w-full" ref={containerRef}>
      {/* iPhone Frame */}
      <div className="mx-auto" style={{ width: `${frameSize.width}px`, height: `${frameSize.height}px` }}>
        {/* iPhone Outer Frame */}
        <div className="w-full h-full bg-black rounded-[3rem] p-2 shadow-2xl">
          {/* Screen */}
          <div className="w-full h-full bg-white rounded-[2.5rem] overflow-hidden relative">
            {/* Status Bar */}
            <div className="absolute top-0 left-0 right-0 z-20">
              <div className="h-6 bg-black rounded-t-[2.5rem] flex items-center justify-center">
                <div className="w-20 h-1 bg-gray-800 rounded-full"></div>
              </div>
              <div className="h-6 bg-gradient-to-r from-gray-900 to-black text-white text-xs flex items-center justify-between px-6">
                <span>9:41</span>
                <div className="flex items-center space-x-1">
                  <div className="w-4 h-2 border border-white rounded-sm">
                    <div className="w-3 h-1 bg-white rounded-sm"></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Card Background */}
            <div
              className="absolute inset-0 pt-12"
              style={
                card.profile.backgroundType === 'gradient' 
                  ? {
                      backgroundImage: card.profile.backgroundGradient || 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                    }
                  : card.profile.backgroundType === 'image' && card.profile.backgroundImage
                    ? {
                        backgroundImage: `url(${card.profile.backgroundImage})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        backgroundRepeat: 'no-repeat'
                      }
                    : {
                        backgroundColor: card.profile.backgroundColor || '#667eea'
                      }
              }
            >
              {/* Content Overlay */}
              <div className="absolute inset-0 bg-black/20"></div>
              
              {/* CSS personalizado */}
              {customCSS && (
                <style dangerouslySetInnerHTML={{ __html: customCSS }} />
              )}
              
              {/* Scrollable Content with adjustable side padding (0–10px) controlled from ProfileEditor */}
              <div className="relative z-10 h-full overflow-y-auto py-6"
                   style={{ paddingLeft: `${Math.max(0, Math.min(10, Number((card as any)?.settings?.branding?.customFooter ?? 10)))}px`,
                            paddingRight: `${Math.max(0, Math.min(10, Number((card as any)?.settings?.branding?.customFooter ?? 10)))}px` }}>
                {templateComponent ? (
                  templateComponent
                ) : (
                  sortedElements.map((element, index) => {
                    // Verificar si esta sección tiene una plantilla aplicada
                    const sectionType = element.type as 'profile' | 'links' | 'social' | 'services' | 'booking' | 'portfolio' | 'elements' | 'design';
                    
                    // Crear el contenido por defecto
                    const defaultContent = (() => {
                      switch (element.component) {
                        case 'ProfileSection':
                          return <ProfileSection />;
                        case 'LinksSection':
                          return <LinksSection />;
                        case 'SocialSection':
                          return <SocialSection />;
                        case 'ServicesSection':
                          return <ServicesSection />;
                        case 'PortfolioSection':
                          return <PortfolioSection />;
                        case 'BookingSection':
                          return <BookingSection />;
                        case 'CustomElement': {
                          const el = (element as any).element as CardElement | undefined;
                          return el ? <CustomElement element={el} /> : null;
                        }
                        default:
                          return null;
                      }
                    })();

                    return (
                      <SectionRenderer
                        key={`${element.type}-${index}`}
                        card={card}
                        sectionType={sectionType}
                        defaultContent={defaultContent}
                        className="mb-6"
                      />
                    );
                  })
                )}
                
                {/* Footer Spacer */}
                <div className="h-8"></div>
              </div>
            </div>

            {/* Home Indicator */}
            <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 w-32 h-1 bg-black rounded-full"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MobilePreview;