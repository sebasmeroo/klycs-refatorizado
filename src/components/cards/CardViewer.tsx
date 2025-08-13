import React, { useEffect, useState } from 'react';
import { Card as CardType } from '@/types';
import { CardsService } from '@/services/cards';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import PublicMobilePreview from '@/components/cards/preview/PublicMobilePreview';

interface CardViewerProps {
  slug?: string;
  card?: CardType;
  isPreview?: boolean;
}

export const CardViewer: React.FC<CardViewerProps> = ({ slug, card: propCard, isPreview = false }) => {
  const [card, setCard] = useState<CardType | null>(propCard || null);
  const [loading, setLoading] = useState(!propCard && !!slug);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (slug && !propCard) {
      loadCard();
    }
  }, [slug]);

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
        <div className="text-center">
          <div className="text-6xl mb-4">😔</div>
          <h1 className="text-2xl font-bold mb-2">
            {error}
          </h1>
          <p className="text-gray-600 mb-6">
            La tarjeta que buscas no existe o no está disponible públicamente.
          </p>
        </div>
      </div>
    );
  }

  if (!card) {
    return null;
  }

  // Obtener estilo de fondo para expandir por toda la pantalla
  const getFullScreenBackgroundStyle = () => {
    if (!card) return {};
    
    const { profile } = card;
    
    switch (profile.backgroundType) {
      case 'color':
        return { backgroundColor: profile.backgroundColor || '#667eea' };
      case 'gradient':
        return { backgroundImage: profile.backgroundGradient || 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' };
      case 'image':
        return {
          backgroundImage: profile.backgroundImage ? `url(${profile.backgroundImage})` : undefined,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        };
      default:
        return { backgroundColor: '#667eea' };
    }
  };

  return (
    <div 
      className="min-h-screen w-full flex items-center justify-center"
      style={getFullScreenBackgroundStyle()}
    >
      {/* Sin overlay para respetar el color/gradient puro elegido por el usuario */}
      
      {/* Contenedor móvil centrado - usando el mismo preview del editor */}
      <div className="w-full max-w-sm mx-auto relative z-10 py-8 px-4" style={{ maxWidth: '375px', minHeight: '667px' }}>
        <PublicMobilePreview 
          card={card}
          className="h-full relative"
        />
      </div>
    </div>
  );
};

export default CardViewer;