import React, { useState, useCallback, useEffect } from 'react';
import { Card, CardSection } from '@/types';
import { GripVertical, Eye, EyeOff, User, Share2, Link as LinkIcon, Briefcase, Image, Calendar, CalendarCheck, Puzzle, Save } from 'lucide-react';
import { toast } from '@/utils/toast';
import { CardsService } from '@/services/cards';
import { useAuth } from '@/hooks/useAuth';

interface SectionOrderEditorProps {
  card: Card;
  onUpdate: (updates: Partial<Card>) => void;
}

const SECTION_ICONS: Record<string, React.ReactNode> = {
  profile: <User className="w-4 h-4" />,
  social: <Share2 className="w-4 h-4" />,
  links: <LinkIcon className="w-4 h-4" />,
  services: <Briefcase className="w-4 h-4" />,
  portfolio: <Image className="w-4 h-4" />,
  calendar: <Calendar className="w-4 h-4" />,
  booking: <CalendarCheck className="w-4 h-4" />,
  elements: <Puzzle className="w-4 h-4" />,
};

export const SectionOrderEditor: React.FC<SectionOrderEditorProps> = ({ card, onUpdate }) => {
  const { user, firebaseUser } = useAuth();
  const [draggedItemId, setDraggedItemId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveTimeout, setSaveTimeout] = useState<NodeJS.Timeout | null>(null);

  // Auto-guardar después de cambios
  const autoSave = useCallback(async (updatedCard: Partial<Card>) => {
    if (saveTimeout) {
      clearTimeout(saveTimeout);
    }

    const timeout = setTimeout(async () => {
      if (!firebaseUser) return;
      
      const userId = user?.id || firebaseUser.uid;
      
      try {
        setIsSaving(true);
        await CardsService.updateCard(card.id, userId, { ...card, ...updatedCard });
        console.log('✅ Orden de secciones guardado automáticamente');
      } catch (error) {
        console.error('❌ Error al guardar orden:', error);
        toast.error('Error al guardar el orden');
      } finally {
        setIsSaving(false);
      }
    }, 1000); // Esperar 1 segundo después del último cambio

    setSaveTimeout(timeout);
  }, [card, user, firebaseUser, saveTimeout]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeout) {
        clearTimeout(saveTimeout);
      }
    };
  }, [saveTimeout]);

  // Obtener o crear el orden de secciones
  const sections: CardSection[] = card.settings?.sectionsOrder || [
    { id: 'profile', type: 'profile', label: 'Perfil', isVisible: true, order: 0 },
    { id: 'social', type: 'social', label: 'Redes Sociales', isVisible: card.socialLinks && card.socialLinks.length > 0, order: 1 },
    { id: 'links', type: 'links', label: 'Enlaces', isVisible: card.links && card.links.length > 0, order: 2 },
    { id: 'services', type: 'services', label: 'Servicios', isVisible: card.services && card.services.length > 0, order: 3 },
    { id: 'portfolio', type: 'portfolio', label: 'Portfolio', isVisible: card.portfolio?.isVisible || false, order: 4 },
    { id: 'calendar', type: 'calendar', label: 'Calendario', isVisible: card.calendar?.isVisible || false, order: 5 },
    { id: 'booking', type: 'booking', label: 'Reservas', isVisible: card.booking?.enabled || false, order: 6 },
    { id: 'elements', type: 'elements', label: 'Elementos', isVisible: card.elements && card.elements.length > 0, order: 7 },
  ].sort((a, b) => a.order - b.order);

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, sectionId: string) => {
    setDraggedItemId(sectionId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>, targetId: string) => {
    e.preventDefault();
    if (!draggedItemId || draggedItemId === targetId) return;

    const draggedIndex = sections.findIndex(s => s.id === draggedItemId);
    const targetIndex = sections.findIndex(s => s.id === targetId);

    const newSections = [...sections];
    const [draggedSection] = newSections.splice(draggedIndex, 1);
    newSections.splice(targetIndex, 0, draggedSection);

    // Actualizar órdenes
    const updatedSections = newSections.map((section, index) => ({
      ...section,
      order: index
    }));

    const updates = {
      settings: {
        ...card.settings,
        sectionsOrder: updatedSections
      }
    };

    onUpdate(updates);
    autoSave(updates);
  };

  const handleDragEnd = () => {
    setDraggedItemId(null);
  };

  const toggleVisibility = (sectionId: string) => {
    const updatedSections = sections.map(section =>
      section.id === sectionId
        ? { ...section, isVisible: !section.isVisible }
        : section
    );

    const updates = {
      settings: {
        ...card.settings,
        sectionsOrder: updatedSections
      }
    };

    onUpdate(updates);
    autoSave(updates);

    toast.success(`Sección ${updatedSections.find(s => s.id === sectionId)?.isVisible ? 'mostrada' : 'ocultada'}`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
            <GripVertical className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Orden de Secciones
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Arrastra para reordenar las secciones de tu tarjeta
            </p>
          </div>
        </div>
        
        {/* Estado de guardado */}
        {isSaving && (
          <div className="flex items-center space-x-2 text-sm text-purple-600 dark:text-purple-400">
            <Save className="w-4 h-4 animate-pulse" />
            <span>Guardando...</span>
          </div>
        )}
      </div>

      {/* Sections List */}
      <div className="space-y-2">
        {sections.map((section) => (
          <div
            key={section.id}
            draggable
            onDragStart={(e) => handleDragStart(e, section.id)}
            onDragOver={(e) => handleDragOver(e, section.id)}
            onDragEnd={handleDragEnd}
            className={`group flex items-center gap-3 p-4 bg-white dark:bg-gray-800 border-2 rounded-xl transition-all hover:border-purple-500 dark:hover:border-purple-500 cursor-move ${
              draggedItemId === section.id
                ? 'border-purple-500 shadow-lg scale-105'
                : 'border-gray-200 dark:border-gray-700'
            } ${!section.isVisible ? 'opacity-50' : ''}`}
          >
            {/* Drag Handle */}
            <div className="text-gray-400 group-hover:text-purple-500">
              <GripVertical className="w-5 h-5" />
            </div>

            {/* Icon */}
            <div className="flex items-center justify-center w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-lg text-gray-600 dark:text-gray-300">
              {SECTION_ICONS[section.type]}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                {section.label}
              </h4>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Posición {section.order + 1}
              </p>
            </div>

            {/* Toggle Visibility */}
            <button
              onClick={() => toggleVisibility(section.id)}
              className={`p-2 rounded-lg transition-colors ${
                section.isVisible
                  ? 'bg-green-100 text-green-600 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400'
                  : 'bg-gray-100 text-gray-400 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-500'
              }`}
              title={section.isVisible ? 'Ocultar sección' : 'Mostrar sección'}
            >
              {section.isVisible ? (
                <Eye className="w-4 h-4" />
              ) : (
                <EyeOff className="w-4 h-4" />
              )}
            </button>
          </div>
        ))}
      </div>

      {/* Info */}
      <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
        <div className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5">
          ℹ️
        </div>
        <div className="text-sm text-blue-900 dark:text-blue-200">
          <p className="font-medium mb-1">¿Cómo funciona?</p>
          <ul className="list-disc list-inside space-y-1 text-blue-700 dark:text-blue-300 text-xs">
            <li>Arrastra las secciones para cambiar su orden</li>
            <li>Haz clic en el ojo para mostrar/ocultar cada sección</li>
            <li>El orden se aplica automáticamente en tu tarjeta pública</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default SectionOrderEditor;
