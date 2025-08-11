import React, { useState, useEffect, useCallback } from 'react';
import { Card } from '@/types';
import { userTemplatesService } from '@/services/userTemplates';
import ReactPreviewSandbox from '@/components/templates/ReactPreviewSandbox';

interface TemplatePreviewProps {
  card: Card;
  section?: 'profile' | 'links' | 'social' | 'services' | 'booking' | 'portfolio' | 'elements' | 'design';
}

export const TemplatePreview: React.FC<TemplatePreviewProps> = ({ card, section }) => {
  const [templateData, setTemplateData] = useState<{
    template: any;
    instance: any;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Stable callbacks to prevent TemplateSandbox re-renders
  const handleError = useCallback((error: string) => {
    setError(error);
  }, []);

  const handleSuccess = useCallback(() => {
    setError(null);
  }, []);

  useEffect(() => {
    loadActiveTemplate();
  }, [card.id]);

  const loadActiveTemplate = async () => {
    if (!card.id) {
      setLoading(false);
      return;
    }

    try {
      const activeTemplate = await userTemplatesService.getActiveTemplateForCard(card.id);
      
      if (activeTemplate && (!section || activeTemplate.template.targetSection === section)) {
        setTemplateData(activeTemplate);
      } else {
        setTemplateData(null);
      }
    } catch (err) {
      console.error('Error loading active template:', err);
      setError('Error cargando plantilla');
    } finally {
      setLoading(false);
    }
  };

  // Integrar datos de la tarjeta con los datos de la plantilla
  const getMergedData = () => {
    if (!templateData) return {};

    const { template, instance } = templateData;
    const templateInstanceData = instance.data || {};
    
    // Mapear datos de la tarjeta a los campos de la plantilla
    const cardDataMapping = {
      // Profile data
      name: card.name || '',
      title: card.title || '',
      bio: card.bio || '',
      profileImage: card.profilePicture || '',
      email: card.email || '',
      phone: card.phone || '',
      
      // Links data
      links: card.links || [],
      
      // Social links data
      socialLinks: card.socialLinks || [],
      
      // Services data
      services: card.services || [],
      
      // Portfolio data
      portfolio: card.portfolio?.items || [],
      
      // Booking data
      bookingEnabled: card.bookingEnabled || false,
      availableSlots: card.availableSlots || [],
      
      // Custom data from template
      ...templateInstanceData
    };

    return cardDataMapping;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-32 text-red-600">
        <p className="text-sm">{error}</p>
      </div>
    );
  }

  if (!templateData) {
    return null; // No hay plantilla activa, usar preview por defecto
  }

  const { template } = templateData;
  const mergedData = getMergedData();

  return (
    <div className="template-preview-wrapper relative">
      {/* Siempre renderizar con React (mismo runtime que en admin) */}
      <div style={{ minHeight: 520 }} className="w-full">
        <ReactPreviewSandbox
          code={template.reactCode}
          css={template.cssCode}
          data={mergedData}
          onError={handleError}
          className="w-full"
        />
      </div>
      
      {/* Indicator de plantilla activa */}
      <div className="absolute top-2 right-2 z-10">
        <div className="flex items-center gap-1 bg-blue-600 text-white text-xs px-2 py-1 rounded-full shadow-md">
          <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
          <span>{template.name}</span>
        </div>
      </div>

      {/* No badge de fuente; usamos siempre JSX sandbox */}
    </div>
  );
};

export default TemplatePreview;