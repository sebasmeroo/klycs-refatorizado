import React, { useState, useEffect } from 'react';
import { Card } from '@/types';
import { userTemplatesService } from '@/services/userTemplates';
import PublicTemplatePreview from './PublicTemplatePreview';

interface PublicSectionRendererProps {
  card: Card;
  sectionType: 'profile' | 'links' | 'social' | 'services' | 'booking' | 'portfolio' | 'elements' | 'design';
  defaultContent: React.ReactNode;
  className?: string;
  targetItemId?: string;
  // Nueva prop para pre-cargar plantillas
  templatesData?: {
    [key: string]: {
      template: any;
      instance: any;
    } | null;
  };
}

export const PublicSectionRenderer: React.FC<PublicSectionRendererProps> = ({
  card,
  sectionType,
  defaultContent,
  className = '',
  targetItemId,
  templatesData
}) => {
  const [hasTemplate, setHasTemplate] = useState(false);
  const [templateData, setTemplateData] = useState<any>(null);

  useEffect(() => {
    // Si tenemos datos pre-cargados, usarlos inmediatamente
    if (templatesData) {
      const key = targetItemId ? `${sectionType}-${targetItemId}` : sectionType;
      const data = templatesData[key];
      setHasTemplate(!!data);
      setTemplateData(data);
      return;
    }

    // Fallback: cargar de manera tradicional (con loading)
    const unsubscribe = userTemplatesService.subscribeActiveTemplateForCard(
      card.id,
      sectionType,
      (data) => {
        setHasTemplate(!!data);
        setTemplateData(data);
      },
      { targetItemId }
    );
    return () => unsubscribe();
  }, [card.id, sectionType, targetItemId, templatesData]);

  // Si tenemos datos pre-cargados, renderizar inmediatamente sin loading
  if (templatesData) {
    return (
      <div className={`section-renderer ${className}`}>
        {hasTemplate && templateData ? (
          <div className="template-section">
            <PublicTemplatePreview 
              card={card} 
              section={sectionType} 
              targetItemId={targetItemId}
              preloadedData={templateData}
            />
          </div>
        ) : (
          <div className="default-section">
            {defaultContent}
          </div>
        )}
      </div>
    );
  }

  // Fallback: comportamiento tradicional con loading
  return (
    <div className={`animate-pulse bg-gray-200 dark:bg-gray-700 rounded-lg h-20 ${className}`}>
      <div className="flex items-center justify-center h-full">
        <div className="w-4 h-4 bg-gray-300 dark:bg-gray-600 rounded-full animate-bounce"></div>
      </div>
    </div>
  );
};

export default PublicSectionRenderer;