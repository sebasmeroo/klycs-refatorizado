import React from 'react';
import { Card } from '@/types';

interface PublicSectionRendererProps {
  card: Card;
  sectionType: 'profile' | 'links' | 'social' | 'services' | 'portfolio' | 'booking' | 'elements' | 'design';
  defaultContent: React.ReactNode;
  className?: string;
  targetItemId?: string;
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
  // Sistema simplificado: solo renderizar el contenido por defecto
  // No más sistema de plantillas
  return (
    <div className={`section-renderer ${className}`}>
      <div className="default-section">
        {defaultContent}
      </div>
    </div>
  );
};

export default PublicSectionRenderer;
