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

    const { template, instance } = templateData as any;
    const templateInstanceData = (instance && instance.data) || {};

    // Datos base de la tarjeta (sólo contenido genérico)
    const cardDataMapping: any = {
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
    };

    // Mezclar datos de instancia SIN pisar lo que ya tiene valor en la instancia
    // Prioridad: instancia > datos de tarjeta > defaults vacíos
    // 1) Baseline: defaults de la plantilla (como en el creador)
    const defaults: any = {};
    const isGeneric = (v: any) => {
      if (v === undefined || v === null) return true;
      if (typeof v !== 'string') return false;
      const s = v.trim();
      if (!s) return true;
      const lower = s.toLowerCase();
      return (
        lower === 'valor por defecto' ||
        lower === 'default value' ||
        lower === 'default' ||
        lower === 'valor predeterminado'
      );
    };
    const isLayoutSensitive = (id: string) => /(padding|width|height|radius|shadow|border|line|margin|gap|inset|offset)/i.test(id);

    if (template?.jsonConfig && Array.isArray(template.jsonConfig)) {
      template.jsonConfig.forEach((field: any) => {
        const v = field?.defaultValue;
        // No aplicar como baseline valores de layout; el componente define su layout por defecto
        if (!isGeneric(v) && !isLayoutSensitive(field.id)) defaults[field.id] = v;
      });
    }

    // 2) Mezclar datos de instancia limpiando genéricos
    const merged: any = { ...defaults };

    Object.keys(templateInstanceData).forEach((key: string) => {
      const val = templateInstanceData[key];
      // No usar valores de instancia para layout si están presentes (dejan el layout al componente)
      if (!isGeneric(val) && !isLayoutSensitive(key)) {
        merged[key] = val;
      }
    });

    // 3) Finalmente, añadir datos de la tarjeta (texto/fotos) sin tocar estilos
    return { ...merged, ...cardDataMapping };
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
          autoHeight={true}
          className="w-full"
        />
      </div>
      
      {/* No badge en el preview para no estorbar la visual */}
    </div>
  );
};

export default TemplatePreview;