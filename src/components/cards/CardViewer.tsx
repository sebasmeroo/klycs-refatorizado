import React, { useEffect, useState } from 'react';
import { 
  ExternalLink, 
  Share2, 
  Heart, 
  Eye,
  Copy,
  Twitter,
  Facebook,
  Linkedin
} from 'lucide-react';
import { Card as CardType, CardLink } from '@/types';
import { CardsService } from '@/services/cards';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { toast } from '@/utils/toast';

interface CardViewerProps {
  slug?: string;
  card?: CardType;
  isPreview?: boolean;
}

interface LinkButtonProps {
  link: CardLink;
  theme: CardType['theme'];
  onClick: () => void;
}

const LinkButton: React.FC<LinkButtonProps> = ({ link, theme, onClick }) => {
  const getIconComponent = (iconName: string) => {
    // Mapa simple de iconos - en una implementación real usarías una librería completa
    const icons: Record<string, React.ReactNode> = {
      'Instagram': '📷',
      'Twitter': '🐦',
      'Linkedin': '💼',
      'Globe': '🌐',
      'Mail': '📧',
      'Phone': '📞',
      'Github': '💻',
      'Youtube': '📺',
      'Facebook': '📘',
      'TikTok': '🎵',
      'Spotify': '🎧',
      'default': '🔗'
    };
    
    return icons[iconName] || icons.default;
  };

  const getStyleForVariant = () => {
    const baseClasses = "w-full flex items-center justify-center gap-3 py-4 px-6 rounded-lg font-medium transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]";
    
    switch (link.style.variant) {
      case 'solid':
        return `${baseClasses} text-white shadow-md hover:shadow-lg`;
      case 'outline':
        return `${baseClasses} border-2 bg-transparent hover:bg-opacity-10`;
      case 'ghost':
        return `${baseClasses} bg-transparent hover:bg-opacity-10`;
      case 'gradient':
        return `${baseClasses} text-white shadow-md hover:shadow-lg bg-gradient-to-r`;
      case 'glassmorphism':
        return `${baseClasses} backdrop-blur-md bg-opacity-20 border border-white border-opacity-20 text-white shadow-lg`;
      default:
        return `${baseClasses} text-white shadow-md hover:shadow-lg`;
    }
  };

  const getStyleObject = () => {
    const style: React.CSSProperties = {};
    
    if (link.style.backgroundColor && link.style.variant !== 'gradient') {
      style.backgroundColor = link.style.backgroundColor;
    }
    if (link.style.textColor) {
      style.color = link.style.textColor;
    }
    if (link.style.borderColor && (link.style.variant === 'outline' || link.style.variant === 'ghost')) {
      style.borderColor = link.style.borderColor;
    }
    if (link.style.borderRadius) {
      style.borderRadius = link.style.borderRadius;
    }
    if (link.style.variant === 'gradient' && link.style.backgroundColor) {
      style.background = link.style.backgroundColor;
    }
    
    return style;
  };

  return (
    <button
      onClick={onClick}
      className={getStyleForVariant()}
      style={getStyleObject()}
    >
      <span className="text-xl">{getIconComponent(link.icon || 'default')}</span>
      <div className="flex-1 text-center">
        <div className="font-semibold">{link.title}</div>
        {link.description && (
          <div className="text-sm opacity-80 mt-1">{link.description}</div>
        )}
      </div>
      <ExternalLink className="w-4 h-4 opacity-70" />
    </button>
  );
};

export const CardViewer: React.FC<CardViewerProps> = ({ slug, card: propCard, isPreview = false }) => {
  const [card, setCard] = useState<CardType | null>(propCard || null);
  const [loading, setLoading] = useState(!propCard && !!slug);
  const [error, setError] = useState<string | null>(null);
  const [viewRecorded, setViewRecorded] = useState(false);

  useEffect(() => {
    if (slug && !propCard) {
      loadCard();
    }
  }, [slug]);

  useEffect(() => {
    if (card && !isPreview && !viewRecorded) {
      recordView();
      setViewRecorded(true);
    }
  }, [card, isPreview, viewRecorded]);

  const loadCard = async () => {
    if (!slug) return;
    
    try {
      setLoading(true);
      const cardData = await CardsService.getCardBySlug(slug);
      
      if (!cardData) {
        setError('Tarjeta no encontrada');
        return;
      }
      
      setCard(cardData);
    } catch (err) {
      console.error('Error loading card:', err);
      setError('Error al cargar la tarjeta');
    } finally {
      setLoading(false);
    }
  };

  const recordView = async () => {
    if (!card) return;
    
    try {
      await CardsService.incrementViewCount(card.id);
    } catch (err) {
      console.error('Error recording view:', err);
    }
  };

  const handleLinkClick = async (link: CardLink) => {
    if (!card) return;
    
    // Registrar el click (sin esperar para no bloquear la navegación)
    if (!isPreview) {
      CardsService.incrementLinkClick(card.id, link.id).catch(console.error);
    }
    
    // Abrir el enlace
    window.open(link.url, '_blank', 'noopener,noreferrer');
  };

  const handleShare = async () => {
    if (!card) return;
    
    const url = `${window.location.origin}/c/${card.slug}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: card.title,
          text: card.description || `Mira la tarjeta de ${card.profile.name}`,
          url
        });
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          console.error('Error sharing:', err);
        }
      }
    } else {
      try {
        await navigator.clipboard.writeText(url);
        toast.success('Enlace copiado al portapapeles');
      } catch (err) {
        console.error('Error copying to clipboard:', err);
        toast.error('No se pudo copiar el enlace');
      }
    }
  };

  const getBackgroundStyle = () => {
    if (!card) return {};
    
    const { profile, theme } = card;
    
    switch (profile.backgroundType) {
      case 'color':
        return { backgroundColor: profile.backgroundColor || theme.colors.background };
      case 'gradient':
        return { background: profile.backgroundGradient || theme.colors.background };
      case 'image':
        return {
          backgroundImage: profile.backgroundImage ? `url(${profile.backgroundImage})` : undefined,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        };
      default:
        return { backgroundColor: theme.colors.background };
    }
  };

  const getTextStyle = (type: 'primary' | 'secondary' | 'muted' = 'primary') => {
    if (!card) return {};
    return { color: card.theme.colors.text[type] };
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="text-6xl mb-4">😔</div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            {error}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            La tarjeta que buscas no existe o no está disponible públicamente.
          </p>
          <Button 
            onClick={() => window.location.href = '/'}
            variant="outline"
          >
            Ir al inicio
          </Button>
        </div>
      </div>
    );
  }

  if (!card) {
    return null;
  }

  const visibleLinks = card.links
    .filter(link => link.isVisible)
    .sort((a, b) => a.order - b.order);

  return (
    <div 
      className="min-h-screen py-8 px-4"
      style={getBackgroundStyle()}
    >
      <div className="max-w-md mx-auto">
        {/* Header con botón de compartir */}
        {!isPreview && (
          <div className="flex justify-end mb-4">
            <Button
              onClick={handleShare}
              size="sm"
              variant="outline"
              className="backdrop-blur-sm bg-white/10 border-white/20 text-white hover:bg-white/20"
            >
              <Share2 className="w-4 h-4 mr-2" />
              Compartir
            </Button>
          </div>
        )}

        {/* Perfil */}
        <div className="text-center mb-8">
          {/* Avatar */}
          {card.profile.avatar ? (
            <img
              src={card.profile.avatar}
              alt={card.profile.name}
              className="w-24 h-24 rounded-full mx-auto mb-4 border-4 border-white shadow-lg object-cover"
            />
          ) : (
            <div className="w-24 h-24 rounded-full mx-auto mb-4 border-4 border-white shadow-lg flex items-center justify-center text-3xl font-bold"
                 style={{ backgroundColor: card.theme.colors.surface, ...getTextStyle() }}>
              {card.profile.name.charAt(0).toUpperCase() || 'U'}
            </div>
          )}
          
          {/* Nombre */}
          <h1 
            className="text-3xl font-bold mb-2"
            style={{ 
              ...getTextStyle(),
              fontFamily: card.theme.fonts.primary
            }}
          >
            {card.profile.name}
          </h1>
          
          {/* Bio */}
          {card.profile.bio && (
            <p 
              className="text-lg leading-relaxed max-w-sm mx-auto"
              style={{ 
                ...getTextStyle('secondary'),
                fontFamily: card.theme.fonts.secondary
              }}
            >
              {card.profile.bio}
            </p>
          )}
        </div>

        {/* Enlaces */}
        <div className="space-y-4 mb-8">
          {visibleLinks.map((link) => (
            <LinkButton
              key={link.id}
              link={link}
              theme={card.theme}
              onClick={() => handleLinkClick(link)}
            />
          ))}
        </div>

        {/* Elementos personalizados */}
        {card.elements.filter(el => el.isVisible).length > 0 && (
          <div className="space-y-4 mb-8">
            {card.elements
              .filter(el => el.isVisible)
              .sort((a, b) => a.order - b.order)
              .map((element) => (
                <div key={element.id} className="text-center">
                  {element.type === 'text' && (
                    <p 
                      style={{ 
                        ...getTextStyle('secondary'),
                        fontSize: element.content.fontSize || '16px',
                        textAlign: element.content.textAlign || 'center'
                      }}
                    >
                      {element.content.text}
                    </p>
                  )}
                  {element.type === 'divider' && (
                    <hr 
                      className="my-4 border-0 h-px"
                      style={{ 
                        background: card.theme.colors.text.muted,
                        opacity: 0.3
                      }} 
                    />
                  )}
                </div>
              ))}
          </div>
        )}

        {/* Stats (solo si no es preview) */}
        {!isPreview && (
          <div className="flex items-center justify-center space-x-6 text-sm opacity-70">
            <div className="flex items-center space-x-1" style={getTextStyle('muted')}>
              <Eye className="w-4 h-4" />
              <span>{card.viewCount.toLocaleString()}</span>
            </div>
            <div className="flex items-center space-x-1" style={getTextStyle('muted')}>
              <ExternalLink className="w-4 h-4" />
              <span>{card.clickCount.toLocaleString()}</span>
            </div>
          </div>
        )}

        {/* Footer */}
        {card.settings.branding.showWatermark && !isPreview && (
          <div className="text-center mt-8 pt-4 border-t border-white/20">
            <p className="text-sm opacity-50" style={getTextStyle('muted')}>
              {card.settings.branding.customFooter || 'Creado con ❤️'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CardViewer;