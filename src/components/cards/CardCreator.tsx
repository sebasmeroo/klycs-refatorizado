import React, { useState } from 'react';
import { Plus, ArrowRight, Sparkles, Crown } from 'lucide-react';
import { cardTemplates, createCardFromTemplate } from '@/data/cardTemplates';
import { CardsService } from '@/services/cards';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardTemplate } from '@/types';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { toast } from '@/utils/toast';
import { subscriptionsService } from '@/services/subscriptions';
import { useUserCards } from '@/hooks/useCards';

interface CardCreatorProps {
  onCardCreated?: (card: Card) => void;
  onCancel?: () => void;
}

export const CardCreator: React.FC<CardCreatorProps> = ({ onCardCreated, onCancel }) => {
  const { user, firebaseUser } = useAuth();
  const userId = user?.id || firebaseUser?.uid;
  const { data: existingCards = [] } = useUserCards(userId);

  const [step, setStep] = useState<'template' | 'customize'>('template');
  const [selectedTemplate, setSelectedTemplate] = useState<CardTemplate | null>(null);
  const [cardTitle, setCardTitle] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const handleTemplateSelect = (template: CardTemplate) => {
    setSelectedTemplate(template);
    setCardTitle(template.name);
    setStep('customize');
  };

  const handleCreateCard = async () => {
    if (!firebaseUser || !selectedTemplate) return;

    if (!cardTitle.trim()) {
      toast.error('Por favor ingresa un título para tu tarjeta');
      return;
    }

    const userId = user?.id || firebaseUser.uid;

    // ✅ VALIDACIÓN DE LÍMITES - Verificar si puede crear tarjeta
    const limitsCheck = await subscriptionsService.checkPlanLimits(userId, 'cards_created');

    if (limitsCheck.success && limitsCheck.data) {
      const { canProceed, limit, current, plan } = limitsCheck.data;

      // Si ya tiene 1+ tarjetas y su plan no permite más
      if (!canProceed) {
        const planName = plan.name?.toLowerCase() || 'free';

        if (planName === 'free' || planName === 'básico') {
          toast.error('Plan FREE: Solo puedes crear 1 tarjeta. Actualiza a PRO para administrar tu tarjeta.');
          setShowUpgradeModal(true);
          return;
        } else if (planName === 'pro' || planName === 'profesional' || planName === 'pro anual') {
          toast.error('Plan PRO: Solo puedes crear 1 tarjeta. Actualiza a BUSINESS para tarjetas ilimitadas.');
          setShowUpgradeModal(true);
          return;
        }
      }
    }

    setIsCreating(true);
    try {
      const cardData = createCardFromTemplate(selectedTemplate, userId, cardTitle);
      const cardId = await CardsService.createCard(userId, cardData);

      // ✅ Registrar uso después de crear
      await subscriptionsService.recordUsage(userId, 'cards_created', 1, {
        cardId,
        cardTitle
      });

      const newCard: Card = {
        id: cardId,
        ...cardData,
        viewCount: 0,
        clickCount: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      toast.success('¡Tarjeta creada exitosamente!');
      onCardCreated?.(newCard);
    } catch (error) {
      console.error('Error creating card:', error);
      toast.error('Error al crear la tarjeta');
    } finally {
      setIsCreating(false);
    }
  };

  const handleCreateFromScratch = () => {
    setSelectedTemplate(null);
    setCardTitle('Mi Tarjeta');
    setStep('customize');
  };

  if (step === 'customize') {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-lg">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Personalizar Tarjeta
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              {selectedTemplate 
                ? `Personalizando: ${selectedTemplate.name}`
                : 'Creando tarjeta desde cero'
              }
            </p>
          </div>

          {selectedTemplate && (
            <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white">
                    {selectedTemplate.name}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {selectedTemplate.description}
                  </p>
                </div>
                <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 px-2 py-1 rounded-full capitalize">
                  {selectedTemplate.category}
                </span>
              </div>
            </div>
          )}

          <div className="space-y-6">
            <div>
              <label htmlFor="cardTitle" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Título de la tarjeta
              </label>
              <Input
                id="cardTitle"
                type="text"
                value={cardTitle}
                onChange={(e) => setCardTitle(e.target.value)}
                placeholder="Ej: Mi Tarjeta Personal"
                className="w-full"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Este será el nombre de tu tarjeta y aparecerá en el título de la página
              </p>
            </div>

            <div className="border-t dark:border-gray-700 pt-6">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Después de crear tu tarjeta podrás:
              </p>
              <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
                <li className="flex items-center">
                  <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mr-3"></div>
                  Personalizar tu perfil y bio
                </li>
                <li className="flex items-center">
                  <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mr-3"></div>
                  Agregar, editar y organizar enlaces
                </li>
                <li className="flex items-center">
                  <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mr-3"></div>
                  Cambiar temas y colores
                </li>
                <li className="flex items-center">
                  <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mr-3"></div>
                  Compartir con un enlace único
                </li>
              </ul>
            </div>
          </div>

          <div className="flex gap-3 mt-8">
            <Button
              variant="outline"
              onClick={() => step === 'customize' ? setStep('template') : onCancel?.()}
              disabled={isCreating}
              className="flex-1"
            >
              Volver
            </Button>
            <Button
              onClick={handleCreateCard}
              disabled={isCreating || !cardTitle.trim()}
              className="flex-1"
            >
              {isCreating ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Creando...
                </>
              ) : (
                <>
                  Crear Tarjeta
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
          Crear Nueva Tarjeta
        </h2>
        <p className="text-lg text-gray-600 dark:text-gray-400">
          Elige un template para comenzar o crea desde cero
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {cardTemplates.map((template) => (
          <div
            key={template.id}
            className="group bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md hover:shadow-lg transition-all cursor-pointer border-2 border-transparent hover:border-blue-200 dark:hover:border-blue-700"
            onClick={() => handleTemplateSelect(template)}
          >
            <div className="aspect-video bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 rounded-lg mb-4 flex items-center justify-center text-gray-400 dark:text-gray-500">
              <Sparkles className="w-8 h-8" />
            </div>
            
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-gray-900 dark:text-white">
                {template.name}
              </h3>
              <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 px-2 py-1 rounded-full capitalize">
                {template.category}
              </span>
            </div>
            
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              {template.description}
            </p>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                <span>{template.defaultLinks.length} enlaces</span>
                <span className="mx-2">•</span>
                <span>{template.defaultElements.length} elementos</span>
              </div>
              
              <Button
                size="sm"
                variant="outline"
                className="opacity-0 group-hover:opacity-100 transition-opacity"
              >
                Usar Template
              </Button>
            </div>
          </div>
        ))}
      </div>

      <div className="text-center">
        <Button
          variant="outline"
          onClick={handleCreateFromScratch}
          className="inline-flex items-center"
        >
          <Plus className="w-4 h-4 mr-2" />
          Crear desde Cero
        </Button>
        
        {onCancel && (
          <Button
            variant="ghost"
            onClick={onCancel}
            className="ml-3"
          >
            Cancelar
          </Button>
        )}
      </div>

      {/* Modal de Upgrade */}
      {showUpgradeModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 max-w-md w-full shadow-2xl">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Crown className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Actualiza tu Plan
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Has alcanzado el límite de tarjetas de tu plan actual
              </p>
            </div>

            <div className="space-y-4 mb-6">
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Plan PRO - €9.99/mes</h4>
                <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                  <li>✓ 1 tarjeta con gestión completa</li>
                  <li>✓ 1 calendario colaborativo</li>
                  <li>✓ Hasta 15 profesionales por calendario</li>
                  <li>✓ Reservas ilimitadas</li>
                </ul>
              </div>

              <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Plan BUSINESS - €40/mes</h4>
                <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                  <li>✓ Hasta 10 tarjetas digitales</li>
                  <li>✓ Calendarios ilimitados</li>
                  <li>✓ Hasta 15 profesionales por calendario</li>
                  <li>✓ Analytics avanzado</li>
                </ul>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowUpgradeModal(false)}
                className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                Cerrar
              </button>
              <button
                onClick={() => window.location.href = '/dashboard/settings'}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all"
              >
                Ver Planes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CardCreator;
