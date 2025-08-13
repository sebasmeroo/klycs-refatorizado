import React, { useState, useEffect, useCallback } from 'react';
import { Card } from '@/types';
import { userTemplatesService } from '@/services/userTemplates';
import DirectTemplateRenderer from '@/components/templates/DirectTemplateRenderer';

interface TemplatePreviewProps {
  card: Card;
  section?: 'profile' | 'links' | 'social' | 'services' | 'booking' | 'portfolio' | 'elements' | 'design';
  // Nuevo: permitir vista previa dirigida a un item específico (p.ej. un link)
  targetItemId?: string;
  // Nuevo: datos pre-cargados para evitar loading
  preloadedData?: {
    template: any;
    instance: any;
  };
}

export const TemplatePreview: React.FC<TemplatePreviewProps> = ({ card, section, targetItemId, preloadedData }) => {
  const [templateData, setTemplateData] = useState<{
    template: any;
    instance: any;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [liveDataOverride, setLiveDataOverride] = useState<Record<string, any> | null>(null);

  // Stable callbacks to prevent TemplateSandbox re-renders
  const handleError = useCallback((error: string) => {
    setError(error);
  }, []);

  const handleSuccess = useCallback(() => {
    setError(null);
  }, []);

  useEffect(() => {
    // Si tenemos datos pre-cargados, usarlos inmediatamente
    if (preloadedData) {
      setTemplateData(preloadedData);
      setLoading(false);
      return;
    }

    // Fallback: cargar de manera tradicional
    const unsubscribe = userTemplatesService.subscribeActiveTemplateForCard(
      card.id,
      section,
      (data) => {
        setTemplateData(data);
        setLoading(false);
      },
      { targetItemId }
    );
    return () => unsubscribe();
  }, [card.id, section, targetItemId, preloadedData]);

  // Escuchar cambios en vivo del editor (sin guardar) para refrescar el preview al instante
  useEffect(() => {
    const handler = (e: Event) => {
      const evt = e as CustomEvent;
      const detail = evt.detail as { cardId: string; section?: TemplatePreviewProps['section']; targetItemId?: string; data: any };
      if (!detail) return;
      if (detail.cardId !== card.id) return;
      if (section && detail.section !== section) return;
      if (targetItemId && detail.targetItemId !== targetItemId) return;
      setLiveDataOverride(detail.data);
    };
    window.addEventListener('template-instance-live-edit', handler as any);
    return () => window.removeEventListener('template-instance-live-edit', handler as any);
  }, [card.id, section, targetItemId]);

  // Integrar datos de la tarjeta con los datos de la plantilla
  const getMergedData = () => {
    if (!templateData) return {};

    const { template, instance } = templateData as any;
    const templateInstanceData = liveDataOverride ?? ((instance && instance.data) || {});

    // Preparar datos específicos cuando la plantilla es para un enlace concreto
    const currentLink = section === 'links' && targetItemId
      ? (card.links || []).find((l: any) => l.id === targetItemId)
      : undefined;

    // Datos base de la tarjeta (sólo contenido genérico)
    const cardDataMapping: any = {
      // Profile data
      name: card.profile?.name || '',
      title: card.title || '',
      bio: card.profile?.bio || '',
      profileImage: card.profile?.avatar || '',
      email: '',
      phone: '',
      
      // Links data
      links: card.links || [],
      // Datos del enlace actual (para plantillas por enlace)
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
      portfolio: card.portfolio?.items || [],
      
      // Booking data
      bookingEnabled: !!card.booking?.enabled,
      availableSlots: card.booking?.calendar?.timeSlots || [],
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
    const isLayoutSensitive = (id: string) => {
      const raw = String(id || '');
      const normalized = raw.toLowerCase().replace(/[_\s-]+/g, '');
      // Permitir explícitamente radios controlables por plantilla
      const allowRadius =
        normalized.endsWith('cardradius') ||
        normalized.endsWith('borderradius') ||
        normalized.endsWith('containerradius');
      if (allowRadius) return false;
      // Evitar que valores de layout del JSON rompan el diseño por defecto
      return /(padding|width|height|radius|shadow|border(?!radius)|line|margin|gap|inset|offset)/i.test(raw);
    };

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
    //    Prioridad correcta: datos de tarjeta (base) < defaults/instancia (plantilla)
    const finalData = { ...cardDataMapping, ...merged };
    
    // Asegurar que los datos del enlace específico siempre estén disponibles
    if (section === 'links' && targetItemId && currentLink) {
      finalData.title = finalData.title || currentLink.title || 'Enlace sin título';
      finalData.url = finalData.url || currentLink.url || '#';
      finalData.description = finalData.description || currentLink.description || '';
      finalData.icon = finalData.icon || currentLink.icon || '🔗';
    }
    
    return finalData;
  };

  // Mientras está cargando, no mostrar nada para evitar doble renderizado
  if (loading) {
    return null;
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

  // Debug para verificar qué datos se están pasando a la plantilla
  if (process.env.NODE_ENV === 'development' && targetItemId) {
    console.log(`🎨 TemplatePreview - ${section}/${targetItemId}:`, {
      templateName: template.name,
      mergedData: mergedData,
      linkTitle: mergedData.linkTitle,
      linkUrl: mergedData.linkUrl,
      targetItemId
    });
  }

  return (
    <div className="template-preview-wrapper relative">
      {/* Renderizar directamente con React - SIN iframe */}
      <div style={{ minHeight: section === 'links' && targetItemId ? undefined : 520 }} className="w-full overflow-hidden">
        <DirectTemplateRenderer
          jsxCode={template.reactCode}
          data={mergedData}
          onError={handleError}
          onSuccess={handleSuccess}
          className="w-full"
        />
      </div>
      
      {/* No badge en el preview para no estorbar la visual */}
    </div>
  );
};

export default TemplatePreview;