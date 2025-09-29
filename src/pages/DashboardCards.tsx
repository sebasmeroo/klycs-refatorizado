import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, 
  Edit3, 
  Eye, 
  Share2, 
  Trash2, 
  Copy,
  ExternalLink,
  BarChart3,
  Settings,
  Search
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { CardsService } from '@/services/cards';
import { Card } from '@/types';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { CardCreator } from '@/components/cards/CardCreator';
import { toast } from '@/utils/toast';

type ViewMode = 'list' | 'create';

export const DashboardCards: React.FC = () => {
  const { user, firebaseUser } = useAuth();
  const navigate = useNavigate();
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (firebaseUser) {
      loadCards();
    }
  }, [firebaseUser]);

  const loadCards = async () => {
    if (!firebaseUser) return;
    
    const userId = user?.id || firebaseUser.uid;
    
    try {
      setLoading(true);
      const userCards = await CardsService.getUserCards(userId);
      setCards(userCards);

      // Si ya tiene una tarjeta, redirigir automáticamente al editor
      if (userCards.length > 0) {
        navigate(`/tarjeta/edit/${userCards[0].slug}`, { replace: true });
      }
    } catch (error) {
      console.error('Error loading cards:', error);
      toast.error('Error al cargar las tarjetas');
    } finally {
      setLoading(false);
    }
  };

  const handleCardCreated = (newCard: Card) => {
    // Redirigir automáticamente al editor de la nueva tarjeta
    navigate(`/tarjeta/edit/${newCard.slug}`, { replace: true });
  };


  const handleEditCard = (card: Card) => {
    navigate(`/tarjeta/edit/${card.slug}`);
  };

  const handleDeleteCard = async (card: Card) => {
    if (!firebaseUser) return;
    
    const userId = user?.id || firebaseUser.uid;
    
    if (!confirm(`¿Estás seguro de que quieres eliminar "${card.title}"?`)) {
      return;
    }
    
    try {
      await CardsService.deleteCard(card.id, userId);
      setCards(prev => prev.filter(c => c.id !== card.id));
      toast.success('Tarjeta eliminada exitosamente');
    } catch (error) {
      console.error('Error deleting card:', error);
      toast.error('Error al eliminar la tarjeta');
    }
  };

  const handleCopyLink = async (card: Card) => {
    const url = `${window.location.origin}/c/${card.slug}`;
    
    try {
      await navigator.clipboard.writeText(url);
      toast.success('Enlace copiado al portapapeles');
    } catch (error) {
      console.error('Error copying link:', error);
      toast.error('No se pudo copiar el enlace');
    }
  };

  const handleTogglePublic = async (card: Card) => {
    if (!firebaseUser) return;
    
    const userId = user?.id || firebaseUser.uid;
    
    try {
      const updated = { ...card, isPublic: !card.isPublic };
      await CardsService.updateCard(card.id, userId, { isPublic: updated.isPublic });
      setCards(prev => prev.map(c => c.id === card.id ? updated : c));
      toast.success(updated.isPublic ? 'Tarjeta publicada' : 'Tarjeta despublicada');
    } catch (error) {
      console.error('Error toggling card visibility:', error);
      toast.error('Error al cambiar la visibilidad de la tarjeta');
    }
  };

  const filteredCards = cards.filter(card =>
    card.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    card.profile.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Si ya tiene una tarjeta, no mostrar nada (se redirigirá automáticamente)
  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner />
      </div>
    );
  }

  if (viewMode === 'create') {
    return (
      <div className="p-6">
        <CardCreator
          onCardCreated={handleCardCreated}
          onCancel={() => setViewMode('list')}
        />
      </div>
    );
  }


  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Mi Tarjeta Digital
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Crea y personaliza tu tarjeta digital profesional
          </p>
        </div>
        
        {cards.length === 0 && (
          <Button onClick={() => setViewMode('create')}>
            <Plus className="w-4 h-4 mr-2" />
            Crear Tarjeta
          </Button>
        )}
      </div>

      {/* Stats - Solo si hay tarjeta */}
      {cards.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 text-center">
            <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
              {cards[0].viewCount || 0}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Visitas Totales
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 text-center">
            <div className="text-3xl font-bold text-green-600 dark:text-green-400">
              {cards[0].clickCount || 0}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Clics en Enlaces
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 text-center">
            <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
              {cards[0].isPublic ? 'Pública' : 'Privada'}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Estado de la Tarjeta
            </div>
          </div>
        </div>
      )}

      {/* Cards Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      ) : cards.length === 0 ? (
        <div className="text-center py-16 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800/50 dark:to-gray-900/50 rounded-2xl border-2 border-dashed border-gray-300 dark:border-gray-700">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
            <Plus className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
            ¡Bienvenido a Klycs!
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto">
            Crea tu tarjeta digital profesional y comparte todos tus enlaces, servicios y portfolio en un solo lugar.
          </p>
          <Button
            onClick={() => setViewMode('create')}
            className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 shadow-lg hover:shadow-xl transition-shadow px-8 py-3 text-lg"
          >
            <Plus className="w-5 h-5 mr-2" />
            Crear Mi Tarjeta
          </Button>
          
          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto text-left">
            <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">✨ Diseño Profesional</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Personaliza tu tarjeta con temas y estilos modernos</p>
            </div>
            <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">📊 Analytics Integrado</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Rastrea visitas y clics en tiempo real</p>
            </div>
            <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">📅 Reservas Online</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Recibe citas directamente desde tu tarjeta</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCards.map((card) => (
            <div
              key={card.id}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-lg transition-shadow border border-gray-200 dark:border-gray-700"
            >
              {/* Card Preview */}
              <div 
                className="h-32 rounded-t-xl relative overflow-hidden"
                style={{
                  background: card.profile.backgroundType === 'gradient' 
                    ? card.profile.backgroundGradient 
                    : card.profile.backgroundColor || card.theme.colors.background
                }}
              >
                <div className="absolute inset-0 bg-black bg-opacity-20" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center text-white">
                    <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-2">
                      {card.profile.avatar ? (
                        <img 
                          src={card.profile.avatar} 
                          alt={card.profile.name}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <span className="text-lg font-bold">
                          {card.profile.name.charAt(0).toUpperCase() || 'U'}
                        </span>
                      )}
                    </div>
                    <div className="text-sm font-medium truncate px-4">
                      {card.profile.name}
                    </div>
                  </div>
                </div>
                
                {/* Status Badge */}
                <div className="absolute top-3 right-3">
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    card.isPublic 
                      ? 'bg-green-500 text-white' 
                      : 'bg-gray-500 text-white'
                  }`}>
                    {card.isPublic ? 'Pública' : 'Privada'}
                  </span>
                </div>
              </div>
              
              {/* Card Info */}
              <div className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                      {card.title}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                      /{card.slug}
                    </p>
                  </div>
                </div>
                
                {/* Stats */}
                <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 mb-4">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center">
                      <Eye className="w-4 h-4 mr-1" />
                      {card.viewCount}
                    </div>
                    <div className="flex items-center">
                      <ExternalLink className="w-4 h-4 mr-1" />
                      {card.clickCount}
                    </div>
                    <div className="flex items-center">
                      <span>{card.links.filter(l => l.isVisible).length} enlaces</span>
                    </div>
                  </div>
                </div>
                
                {/* Actions */}
                <div className="flex items-center justify-between">
                  <div className="flex space-x-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleEditCard(card)}
                      title="Editar"
                    >
                      <Edit3 className="w-4 h-4" />
                    </Button>
                    
                    {card.isPublic && (
                      <>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => window.open(`/c/${card.slug}`, '_blank')}
                          title="Ver tarjeta"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleCopyLink(card)}
                          title="Copiar enlace"
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                      </>
                    )}
                  </div>
                  
                  <div className="flex space-x-1">
                    <Button
                      size="sm"
                      variant={card.isPublic ? "outline" : "default"}
                      onClick={() => handleTogglePublic(card)}
                      className="text-xs"
                    >
                      {card.isPublic ? 'Despublicar' : 'Publicar'}
                    </Button>
                    
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDeleteCard(card)}
                      className="text-red-600 hover:text-red-700"
                      title="Eliminar"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DashboardCards;