import React, { useState, useEffect, useCallback } from 'react';
import { Card } from '@/types';
import DirectTemplateRenderer from '@/components/templates/DirectTemplateRenderer';

interface PublicTemplatePreviewProps {
  card: Card;
  section?: 'profile' | 'links' | 'social' | 'services' | 'portfolio' | 'booking' | 'elements' | 'design';
  targetItemId?: string;
  // Datos pre-cargados para renderizado inmediato
  preloadedData?: {
    template: any;
    instance: any;
  };
}

export const PublicTemplatePreview: React.FC<PublicTemplatePreviewProps> = ({ 
  card, 
  section, 
  targetItemId, 
  preloadedData 
}) => {
  const [error, setError] = useState<string | null>(null);

  // Callbacks estables
  const handleError = useCallback((error: string) => {
    setError(error);
  }, []);

  const handleSuccess = useCallback(() => {
    setError(null);
  }, []);

  // Si no hay datos pre-cargados, no renderizar nada
  if (!preloadedData) {
    return null;
  }

  const { template, instance } = preloadedData;

  // Integrar datos de la tarjeta con los datos de la plantilla
  const getMergedData = () => {
    const templateInstanceData = instance?.data || {};

    // Preparar datos específicos cuando la plantilla es para un enlace concreto
    const currentLink = section === 'links' && targetItemId
      ? (card.links || []).find((l: any) => l.id === targetItemId)
      : undefined;

    // Datos base de la tarjeta
    const cardDataMapping: any = {
      // Profile data
      name: card.profile?.name || '',
      title: card.title || '',
      bio: card.profile?.bio || '',
      tagline: card.profile?.tagline || '',
      phone: card.profile?.phone || '',
      website: card.profile?.website || '',
      profileImage: card.profile?.avatar || '',
      email: '',
      phone: '',
      
      // Links data
      links: card.links || [],
      currentLink: currentLink || null,
      linkTitle: currentLink?.title || '',
      linkUrl: currentLink?.url || '',
      linkDescription: currentLink?.description || '',
      linkIcon: currentLink?.icon || '',
      linkIconType: currentLink?.iconType || 'emoji',
      
      // Social links data
      socialLinks: card.socialLinks || [],
      
      // Services data
      services: card.services || [],
      
      // Portfolio data
      portfolio: card.portfolio || {
        items: [],
        style: {
          layout: 'grid',
          columns: 2,
          spacing: 'normal',
          aspectRatio: 'auto',
          showTitles: false,
          showDescriptions: false,
          borderRadius: '12px',
          shadow: 'md'
        },
        isVisible: false,
        showTitle: false,
        title: 'Portfolio',
        order: 4
      },
      // Booking data
      bookingEnabled: !!card.booking?.enabled,
      availableSlots: card.booking?.calendar?.timeSlots || [],
    };

    // Mezclar datos: instancia tiene prioridad sobre datos de tarjeta
    const mergedData = {
      ...cardDataMapping,
      ...templateInstanceData
    };

    return mergedData;
  };

  const mergedData = getMergedData();

  // Renderizar directamente con React - SIN iframe
  return (
    <div className="public-template-preview-wrapper">
      {error && (
        <div className="mb-2 p-2 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
          {error}
        </div>
      )}
      
      <DirectTemplateRenderer
        jsxCode={template.reactCode}
        data={mergedData}
        onError={handleError}
        onSuccess={handleSuccess}
        className="w-full"
      />
    </div>
  );
};

export default PublicTemplatePreview;
