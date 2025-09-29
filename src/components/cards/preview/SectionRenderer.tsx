import React from 'react';
import { Card } from '@/types';

interface SectionRendererProps {
  card: Card;
  sectionType: 'profile' | 'links' | 'social' | 'services' | 'portfolio' | 'booking' | 'elements' | 'design';
  defaultContent: React.ReactNode;
  className?: string;
  targetItemId?: string;
}

export const SectionRenderer: React.FC<SectionRendererProps> = ({
  card,
  sectionType,
  defaultContent,
  className = '',
  targetItemId
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

export default SectionRenderer;
