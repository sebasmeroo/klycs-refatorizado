import React, { useState, useEffect } from 'react';
import { Card, CardElement } from '@/types';
import { userTemplatesService } from '@/services/userTemplates';
import TemplatePreview from './TemplatePreview';

interface SectionRendererProps {
  card: Card;
  sectionType: 'profile' | 'links' | 'social' | 'services' | 'booking' | 'portfolio' | 'elements' | 'design';
  defaultContent: React.ReactNode;
  className?: string;
  // Nuevo: ID de item específico (por ejemplo, un enlace) para plantillas dirigidas
  targetItemId?: string;
}

export const SectionRenderer: React.FC<SectionRendererProps> = ({
  card,
  sectionType,
  defaultContent,
  className = '',
  targetItemId
}) => {
  const [templateData, setTemplateData] = useState<{
    template: any;
    instance: any;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Suscribirse y pre-cargar datos de plantilla para evitar doble carga
    setLoading(true);
    const unsubscribe = userTemplatesService.subscribeActiveTemplateForCard(
      card.id,
      sectionType,
      (data) => {
        setTemplateData(data);
        setLoading(false);
        
        // Debug para verificar que se detectan cambios de plantilla
        if (process.env.NODE_ENV === 'development' && targetItemId) {
          console.log(`🔍 SectionRenderer - ${sectionType}/${targetItemId}: ${data ? 'HAS TEMPLATE' : 'NO TEMPLATE'}`, {
            hasTemplate: !!data,
            templateName: data?.template?.name,
            targetItemId: data?.instance?.targetItemId
          });
        }
      },
      { targetItemId }
    );
    return () => unsubscribe();
  }, [card.id, sectionType, targetItemId]);

  // Mientras está cargando, no mostrar nada para evitar doble renderizado
  if (loading) {
    return null;
  }

  return (
    <div className={`section-renderer ${className}`}>
      {templateData ? (
        <div className="template-section relative">
          <TemplatePreview 
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
};

export default SectionRenderer;