import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { CardsService } from '@/services/cards';
import { NewCardEditor } from '@/components/cards/NewCardEditor';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Card } from '@/types';
import { toast } from '@/utils/toast';

export const CardEditorPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user, firebaseUser, loading: authLoading } = useAuth();
  const [card, setCard] = useState<Card | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!firebaseUser) {
      navigate('/login');
      return;
    }
    if (!slug) {
      navigate('/dashboard/tarjetas');
      return;
    }
    
    loadCard();
  }, [slug, firebaseUser, authLoading, navigate]);

  const loadCard = async () => {
    if (!firebaseUser || !slug) return;

    const userId = user?.id || firebaseUser.uid;
    
    try {
      setLoading(true);
      setError(null);
      
      // Buscar la tarjeta por slug
      const userCards = await CardsService.getUserCards(userId);
      const foundCard = userCards.find(c => c.slug === slug);
      
      if (!foundCard) {
        setError('Tarjeta no encontrada');
        return;
      }

      // Verificar que el usuario sea el propietario
      if (foundCard.userId !== userId) {
        setError('No tienes permisos para editar esta tarjeta');
        return;
      }

      setCard(foundCard);
    } catch (err) {
      console.error('Error loading card:', err);
      setError('Error al cargar la tarjeta');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = (updatedCard: Card) => {
    setCard(updatedCard);
    toast.success('Tarjeta guardada exitosamente');
  };

  const handleClose = () => {
    navigate('/dashboard/tarjetas');
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600 dark:text-gray-400">
            Cargando editor de tarjeta...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Error
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {error}
          </p>
          <button
            onClick={() => navigate('/dashboard/tarjetas')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Volver a Tarjetas
          </button>
        </div>
      </div>
    );
  }

  if (!card) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600 dark:text-gray-400">
            Cargando tarjeta...
          </p>
        </div>
      </div>
    );
  }

  return (
    <NewCardEditor
      card={card}
      onSave={handleSave}
      onClose={handleClose}
    />
  );
};

export default CardEditorPage;