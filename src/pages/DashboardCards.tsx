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
    } catch (error) {
      console.error('Error loading cards:', error);
      toast.error('Error al cargar las tarjetas');
    } finally {
      setLoading(false);
    }
  };

  const handleCardCreated = (newCard: Card) => {
    setCards(prev => [newCard, ...prev]);
    setViewMode('list');
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
            Mis Tarjetas
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Gestiona tus tarjetas digitales y compártelas con el mundo
          </p>
        </div>
        
        <Button onClick={() => setViewMode('create')}>
          <Plus className="w-4 h-4 mr-2" />
          Nueva Tarjeta
        </Button>
      </div>

      {/* Search and Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
        <div className="lg:col-span-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Buscar tarjetas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {cards.length}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Tarjetas Totales
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {cards.filter(c => c.isPublic).length}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Públicas
          </div>
        </div>
      </div>

      {/* Cards Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      ) : filteredCards.length === 0 ? (
        <div className="text-center py-12">
          {cards.length === 0 ? (
            <>
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <Plus className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">
                No tienes tarjetas aún
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Crea tu primera tarjeta digital para comenzar a compartir tus enlaces
              </p>
              <Button onClick={() => setViewMode('create')}>
                <Plus className="w-4 h-4 mr-2" />
                Crear Primera Tarjeta
              </Button>
            </>
          ) : (
            <>
              <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">
                No se encontraron tarjetas
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Intenta con una búsqueda diferente
              </p>
            </>
          )}
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