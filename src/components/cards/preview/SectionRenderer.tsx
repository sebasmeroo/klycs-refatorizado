import React, { useState, useEffect } from 'react';
import { Card, CardElement } from '@/types';
import { userTemplatesService } from '@/services/userTemplates';
import TemplatePreview from './TemplatePreview';

interface SectionRendererProps {
  card: Card;
  sectionType: 'profile' | 'links' | 'social' | 'services' | 'booking' | 'portfolio' | 'elements' | 'design';
  defaultContent: React.ReactNode;
  className?: string;
}

export const SectionRenderer: React.FC<SectionRendererProps> = ({
  card,
  sectionType,
  defaultContent,
  className = ''
}) => {
  const [hasTemplate, setHasTemplate] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkForTemplate();
  }, [card.id, sectionType]);

  const checkForTemplate = async () => {
    if (!card.id) {
      setLoading(false);
      return;
    }

    try {
      const activeTemplate = await userTemplatesService.getActiveTemplateForCard(card.id);
      setHasTemplate(activeTemplate?.template?.targetSection === sectionType);
    } catch (error) {
      console.error('Error checking for template:', error);
      setHasTemplate(false);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={`animate-pulse bg-gray-200 dark:bg-gray-700 rounded-lg h-20 ${className}`}>
        <div className="flex items-center justify-center h-full">
          <div className="w-4 h-4 bg-gray-300 dark:bg-gray-600 rounded-full animate-bounce"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={`section-renderer ${className}`}>
      {hasTemplate ? (
        <div className="template-section relative">
          <TemplatePreview card={card} section={sectionType} />
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