import React, { useState } from 'react';
import { IOSSection, IOSNumberField, IOSSelect, IOSegmented } from '@/components/ui/IOSControls';
import { Card } from '@/types';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { 
  User, 
  Camera, 
  Upload, 
  Palette, 
  Image as ImageIcon,
  Zap,
  Eye,
  EyeOff,
  Wand2
} from 'lucide-react';
import ColorPickerPopover from '@/components/ui/ColorPicker';
import { getDefaultProfileDesign, getPresetById, profileDesignPresets, getPresetsByCategory, getPresetCategories } from '@/data/profileDesignPresets';
import { getAvailableThemes, applyProfileThemeToCard } from '@/data/themes/registry';
import { CardElement } from '@/types';
import DynamicTemplateEditor from './DynamicTemplateEditor';
import TemplatesGallery from './TemplatesGallery';
// Editor avanzado eliminado

interface ProfileEditorProps {
  card: Card;
  onUpdate: (updates: Partial<Card>) => void;
}

export const ProfileEditor: React.FC<ProfileEditorProps> = ({ card, onUpdate }) => {
  const [previewAvatar, setPreviewAvatar] = useState(card.profile.avatar || '');
  const [showBio, setShowBio] = useState(!!card.profile.bio);
  const [showCareerDesc, setShowCareerDesc] = useState(card.profile.design?.showCareerDescription ?? false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [advancedMode, setAdvancedMode] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showTemplateGallery, setShowTemplateGallery] = useState(false);
  const colorButtonRef = React.useRef<HTMLButtonElement>(null);
  const design = card.profile.design ?? getDefaultProfileDesign();
  const themes = getAvailableThemes();
  const categories = ['all', ...getPresetCategories()];

  // Escuchar evento para abrir galería de plantillas
  React.useEffect(() => {
    const handleOpenTemplateGallery = (event: CustomEvent) => {
      const { section } = event.detail;
      if (section === 'profile') {
        setShowTemplateGallery(true);
      }
    };

    window.addEventListener('open-template-gallery', handleOpenTemplateGallery as EventListener);
    return () => window.removeEventListener('open-template-gallery', handleOpenTemplateGallery as EventListener);
  }, []);

  const handleProfileUpdate = (updates: Partial<Card['profile']>) => {
    onUpdate({
      profile: { ...card.profile, ...updates }
    });
  };

  const addBlankSheet = () => {
    const newEl: CardElement = {
      id: `custom-${Date.now()}`,
      type: 'custom-code',
      content: {
        html: '<div style="padding:16px;border-radius:12px;background:#ffffff0d;color:#fff;text-align:center;">Tu HTML aquí</div>',
        css: 'button{border-radius:12px;padding:10px 14px;background:#111;color:#fff;border:2px solid #111;font-weight:700}',
        js: "console.log('Hola desde hoja en blanco')",
        height: 320,
      },
      isVisible: true,
      order: (card.elements?.reduce((m, e) => Math.max(m, e.order), 0) ?? 0) + 1,
      style: {},
    };
    onUpdate({ elements: [...card.elements, newEl] });
  };

  const handleAvatarUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // En una implementación real, aquí subirías la imagen
      const reader = new FileReader();
      reader.onload = (e) => {
        const url = e.target?.result as string;
        setPreviewAvatar(url);
        handleProfileUpdate({ avatar: url });
      };
      reader.readAsDataURL(file);
    }
  };

  const backgroundPresets = [
    { type: 'gradient', value: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', name: 'Púrpura' },
    { type: 'gradient', value: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', name: 'Rosa' },
    { type: 'gradient', value: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', name: 'Azul' },
    { type: 'gradient', value: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)', name: 'Verde' },
    { type: 'gradient', value: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)', name: 'Naranja' },
    { type: 'gradient', value: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)', name: 'Pastel' },
    { type: 'color', value: '#1f2937', name: 'Gris Oscuro' },
    { type: 'color', value: '#111827', name: 'Negro' },
    { type: 'color', value: '#3b82f6', name: 'Azul Sólido' },
    { type: 'color', value: '#ef4444', name: 'Rojo Sólido' }
  ];

  // ==== Helpers de edición de diseño de Perfil (contenedor resaltado en la vista previa) ====
  const updateProfileDesign = (partial: Partial<Card['profile']['design']>) => {
    onUpdate({
      profile: {
        ...card.profile,
        design: {
          ...design,
          ...partial,
        },
      },
    });
  };

  const updateDesignElements = (partial: Partial<Card['profile']['design']['elements']>) => {
    updateProfileDesign({
      elements: {
        ...design.elements,
        ...partial,
      },
    });
  };

  // Helpers seguros para actualizar poster/ticket sin romper tipos estrictos
  const defaultPoster = {
    titleTop: design.content?.poster?.titleTop || '',
    titleBottom: design.content?.poster?.titleBottom || '',
    subtitle: design.content?.poster?.subtitle || '',
    ctaText: design.content?.poster?.ctaText || '',
    bgColor: design.content?.poster?.bgColor || '#d6e3e2',
    frameBorderColor: design.content?.poster?.frameBorderColor || '#0b0f12',
    ctaBgColor: design.content?.poster?.ctaBgColor || '#eef4ea',
    ctaTextColor: design.content?.poster?.ctaTextColor || '#0b0f12',
  };
  const mergePoster = (patch: Partial<typeof defaultPoster>) => {
    const next = { ...defaultPoster, ...patch };
    updateProfileDesign({ content: { ...design.content, poster: next } as any });
  };
  const defaultTicket = {
    eventTitle: design.content?.ticket?.eventTitle || '',
    dateText: design.content?.ticket?.dateText || '',
    timeText: design.content?.ticket?.timeText || '',
    attendeeName: design.content?.ticket?.attendeeName || '',
    attendeeEmail: design.content?.ticket?.attendeeEmail || '',
    ctaPrimary: design.content?.ticket?.ctaPrimary || '',
    ctaSecondary: design.content?.ticket?.ctaSecondary || '',
    primaryColor: design.content?.ticket?.primaryColor || '#ff3b00',
    frameBgColor: design.content?.ticket?.frameBgColor || '#0a0a0a',
    textColor: design.content?.ticket?.textColor || '#0a0a0a',
    dockBgColor: design.content?.ticket?.dockBgColor || 'rgba(255,255,255,0.08)',
  };
  const mergeTicket = (patch: Partial<typeof defaultTicket>) => {
    const next = { ...defaultTicket, ...patch };
    updateProfileDesign({ content: { ...design.content, ticket: next } as any });
  };

  const applyTemplate = (templateId: string) => {
    const preset = getPresetById(templateId);
    if (preset) {
      handleProfileUpdate({
        design: preset.design
      });
      setShowTemplateGallery(false);
    }
  };

  const getCurrentPreset = () => {
    // Intentar encontrar el preset actual basado en la configuración de diseño
    const currentDesignJSON = JSON.stringify(design);
    return profileDesignPresets.find(preset => 
      JSON.stringify(preset.design) === currentDesignJSON
    );
  };

  const filteredPresets = selectedCategory === 'all' 
    ? profileDesignPresets 
    : getPresetsByCategory(selectedCategory);

  // Eliminamos selector de preset por lista; ahora el "Preset de diseño" es el selector de variante (ticket, poster, normal)

  // Modo avanzado deshabilitado/eliminado

  // Abrir secciones desde el submenu del sidebar si se indica vía evento global
  React.useEffect(() => {
    const handler = (e: CustomEvent) => {
      const id = (e as any).detail as string;
      const map: Record<string, string> = {
        'profile-info': 'profile-info',
        'basic-info': 'basic-info',
        'design-templates': 'design-templates',
        'profile-background': 'profile-background',
      };
      const key = map[id];
      if (!key) return;
      // Dispara un evento global para que el IOSSection con ese sectionKey se abra
      // @ts-ignore
      window.dispatchEvent(new CustomEvent('open-section', { detail: key }));
    };
    // @ts-ignore
    window.addEventListener('open-profile-subsection', handler as any);
    return () => {
      // @ts-ignore
      window.removeEventListener('open-profile-subsection', handler as any);
    };
  }, []);

  return (
    <div className="space-y-8">
      {/* Botón de editor avanzado eliminado */}

      <IOSSection title="Información del Perfil" icon={<User size={14} />} variant="dark" sectionKey="profile-info">

        <div className="flex items-start space-x-6">
          {/* Current Avatar */}
          <div className="flex flex-col items-center">
            <div className="relative">
              {previewAvatar ? (
                <img
                  src={previewAvatar}
                  alt="Avatar"
                  className="w-24 h-24 rounded-full object-cover border-4 border-gray-100 dark:border-gray-700"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center border-4 border-gray-100 dark:border-gray-700">
                  <span className="text-white text-2xl font-bold">
                    {card.profile.name?.charAt(0)?.toUpperCase() || 'U'}
                  </span>
                </div>
              )}
              
              {/* Upload Button Overlay */}
              <label className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 hover:opacity-100 transition-opacity cursor-pointer">
                <Camera className="w-6 h-6 text-white" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="hidden"
                />
              </label>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
              Haz clic para cambiar
            </p>
          </div>

          {/* Upload Options */}
          <div className="flex-1 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Foto de Perfil
              </label>
              <div className="flex space-x-3">
                <div className="flex-1">
                  <label className="w-full cursor-pointer">
                    <Button variant="outline" className="w-full">
                      <Upload className="w-4 h-4 mr-2" />
                      Subir Imagen
                    </Button>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarUpload}
                      className="hidden"
                    />
                  </label>
                </div>
                
                <Button
                  variant="outline"
                  onClick={() => {
                    setPreviewAvatar('');
                    handleProfileUpdate({ avatar: undefined });
                  }}
                  disabled={!previewAvatar}
                >
                  Quitar
                </Button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                URL de Imagen (opcional)
              </label>
              <Input
                type="url"
                value={previewAvatar}
                onChange={(e) => {
                  setPreviewAvatar(e.target.value);
                  handleProfileUpdate({ avatar: e.target.value });
                }}
                placeholder="https://ejemplo.com/mi-foto.jpg"
                className="text-sm"
              />
            </div>
          </div>
        </div>
      </IOSSection>

      <IOSSection title="Información Básica" icon={<User size={14} />} variant="dark" sectionKey="basic-info">
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Nombre Completo *
            </label>
            <Input
              type="text"
              value={card.profile.name || ''}
              onChange={(e) => handleProfileUpdate({ name: e.target.value })}
              placeholder="Tu nombre completo"
              required
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Biografía
              </label>
              <button
                onClick={() => {
                  setShowBio(!showBio);
                  if (!showBio) handleProfileUpdate({ bio: '' });
                }}
                className="flex items-center text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
              >
                {showBio ? <EyeOff className="w-4 h-4 mr-1" /> : <Eye className="w-4 h-4 mr-1" />}
                {showBio ? 'Ocultar' : 'Mostrar'}
              </button>
            </div>
            
            {showBio && (
              <div className="space-y-2">
                <textarea
                  value={card.profile.bio || ''}
                  onChange={(e) => handleProfileUpdate({ bio: e.target.value })}
                  placeholder="Cuéntanos sobre ti en pocas palabras..."
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400 transition-colors resize-none"
                  rows={3}
                  maxLength={150}
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 text-right">
                  {(card.profile.bio || '').length}/150 caracteres
                </p>
              </div>
            )}
          </div>

          {/* Toggle para Descripción de Carrera */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Descripción de Carrera
              </label>
              <button
                onClick={() => {
                  const newValue = !showCareerDesc;
                  setShowCareerDesc(newValue);
                  handleProfileUpdate({ 
                    design: { 
                      ...design, 
                      showCareerDescription: newValue 
                    } 
                  });
                }}
                className="flex items-center text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
              >
                {showCareerDesc ? <EyeOff className="w-4 h-4 mr-1" /> : <Eye className="w-4 h-4 mr-1" />}
                {showCareerDesc ? 'Ocultar' : 'Mostrar'}
              </button>
            </div>
            
            {showCareerDesc && (
              <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  <strong>Nota:</strong> La descripción de carrera "&gt; Full Stack Developer especializado en [tecnologías] &gt; Construyendo el futuro con código" se mostrará automáticamente en tu tarjeta cuando no tengas plantillas personalizadas aplicadas.
                </p>
              </div>
            )}
          </div>
        </div>
      </IOSSection>

      {/* Ajuste de espacio lateral del preview (contenedor del dispositivo) */}
      <IOSSection title="Espacio lateral del preview" icon={<Palette size={14} />} variant="dark" sectionKey="preview-padding">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Espacio a los lados (0–10 px)</label>
            <input
              type="range"
              min={0}
              max={10}
              step={1}
              value={Number(((card as any)?.settings?.branding?.customFooter ?? (card as any)?.templateData?.data?.__outerPadding ?? 10))}
              onChange={(e)=> onUpdate({ settings: { ...card.settings, branding: { ...card.settings.branding, customFooter: String(Math.max(0, Math.min(10, Number(e.target.value)||0))) } } })}
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Valor</label>
            <Input
              type="number"
              min={0}
              max={10}
              value={Number(((card as any)?.settings?.branding?.customFooter ?? (card as any)?.templateData?.data?.__outerPadding ?? 10))}
              onChange={(e)=> onUpdate({ settings: { ...card.settings, branding: { ...card.settings.branding, customFooter: String(Math.max(0, Math.min(10, Number(e.target.value)||0))) } } })}
            />
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-2">Este ajuste solo afecta al contenedor del preview en el editor. No modifica tu componente ni el diseño publicado.</p>
      </IOSSection>

      {/* Galería de Plantillas de Diseño */}
       <IOSSection title="Plantillas de Diseño" icon={<Wand2 size={14} />} variant="dark" sectionKey="design-templates">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <IOSegmented
              label="Modo"
              value={card.profile.useCustomCode ? 'custom' : 'template'}
              onChange={(value)=>{
                if (value === 'custom') {
                  onUpdate({ profile: { ...card.profile, useCustomCode: true, customCode: card.profile.customCode ?? { html: '', css: '', js: '', height: 320 } } });
                } else {
                  onUpdate({ profile: { ...card.profile, useCustomCode: false } });
                }
              }}
              options={[
                { value: 'template', label: 'Plantillas' },
                { value: 'custom', label: 'Código personalizado' },
              ]}
            />
            
            {!card.profile.useCustomCode && (
              <Button
                variant="outline"
                onClick={() => setShowTemplateGallery(!showTemplateGallery)}
                className="ml-4"
              >
                {showTemplateGallery ? 'Ocultar Galería' : 'Ver Plantillas'}
              </Button>
            )}
          </div>

          {card.profile.useCustomCode && (
            <div className="space-y-3 border-t pt-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">HTML</label>
                <textarea className="w-full h-28 rounded-md border p-2 text-sm" value={card.profile.customCode?.html || ''} onChange={(e)=> onUpdate({ profile: { ...card.profile, customCode: { ...(card.profile.customCode||{}), html: e.target.value } } }) } />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">CSS</label>
                <textarea className="w-full h-24 rounded-md border p-2 text-sm" value={card.profile.customCode?.css || ''} onChange={(e)=> onUpdate({ profile: { ...card.profile, customCode: { ...(card.profile.customCode||{}), css: e.target.value } } }) } />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">JavaScript</label>
                <textarea className="w-full h-24 rounded-md border p-2 text-sm" value={card.profile.customCode?.js || ''} onChange={(e)=> onUpdate({ profile: { ...card.profile, customCode: { ...(card.profile.customCode||{}), js: e.target.value } } }) } />
              </div>
              <IOSNumberField label="Altura (px)" value={card.profile.customCode?.height || 320} onChange={(n)=> onUpdate({ profile: { ...card.profile, customCode: { ...(card.profile.customCode||{}), height: n } } }) } min={160} max={1200} step={20} />
              <p className="text-xs text-gray-500 dark:text-gray-400">El código se renderiza en un iframe sandbox (allow-scripts, allow-forms) con CSP. Es responsabilidad del usuario.</p>
            </div>
          )}

          {!card.profile.useCustomCode && getCurrentPreset() && (
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-100 dark:bg-blue-800 rounded-lg flex items-center justify-center">
                  <Wand2 size={16} className="text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="font-medium text-blue-900 dark:text-blue-100">{getCurrentPreset()?.name}</p>
                  <p className="text-sm text-blue-600 dark:text-blue-300">{getCurrentPreset()?.description}</p>
                </div>
              </div>
            </div>
          )}

          {!card.profile.useCustomCode && showTemplateGallery && (
            <div className="border-t pt-4">
              {/* Filtros por categoría */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Categoría
                </label>
                <div className="flex flex-wrap gap-2">
                  {categories.map(category => (
                    <button
                      key={category}
                      onClick={() => setSelectedCategory(category)}
                      className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                        selectedCategory === category
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                      }`}
                    >
                      {category === 'all' ? 'Todas' : category.charAt(0).toUpperCase() + category.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Galería de plantillas */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {filteredPresets.map(preset => (
                  <div
                    key={preset.id}
                    className={`group cursor-pointer p-3 rounded-lg border-2 transition-all hover:border-blue-500 hover:shadow-md ${
                      getCurrentPreset()?.id === preset.id
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
                    }`}
                    onClick={() => applyTemplate(preset.id)}
                  >
                    {/* Miniatura de la plantilla */}
                    <div className="aspect-video mb-2 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 rounded-md flex items-center justify-center relative overflow-hidden">
                      <div className="w-full h-full flex items-center justify-center">
                        <div 
                          className="text-xs font-mono text-gray-500 dark:text-gray-400 transform scale-50 origin-center"
                          style={{
                            fontFamily: preset.design.elements.name.fontFamily,
                            color: preset.design.elements.name.color,
                            backgroundColor: preset.design.container.backgroundColor,
                            borderRadius: `${preset.design.container.borderRadius}px`,
                            border: `${preset.design.container.border.width}px ${preset.design.container.border.style} ${preset.design.container.border.color}`,
                            padding: '8px'
                          }}
                        >
                          {preset.name}
                        </div>
                      </div>
                    </div>
                    
                    <h3 className="font-medium text-gray-900 dark:text-gray-100 text-sm truncate">
                      {preset.name}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                      {preset.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

          {!card.profile.useCustomCode && (
           <>
           <div className="space-y-6 border-t pt-6 mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <IOSSelect
                  label="Variante de contenido"
                  value={design.container.variant || 'default'}
                  onChange={(value) => updateProfileDesign({ container: { ...design.container, variant: value as any } })}
                >
                  <option value="default">Básico</option>
                  <option value="poster">Poster</option>
                  <option value="ticket">Ticket</option>
                </IOSSelect>

                <IOSSelect
                  label="Dirección del layout"
                  value={design.layout.direction}
                  onChange={(value) => updateProfileDesign({ layout: { ...design.layout, direction: value as any } })}
                >
                  <option value="column">Vertical</option>
                  <option value="row">Horizontal</option>
                </IOSSelect>

                <IOSSelect
                  label="Alineación Horizontal"
                  value={design.layout.alignment.horizontal}
                  onChange={(value) => updateProfileDesign({ layout: { ...design.layout, alignment: { ...design.layout.alignment, horizontal: value as any } } })}
                >
                  <option value="left">Izquierda</option>
                  <option value="center">Centro</option>
                  <option value="right">Derecha</option>
                </IOSSelect>
              </div>
              
                {/* Contenido editable por variante */}
                {design.container.variant === 'poster' && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Fondo del marco</label>
                    <Input type="text" value={defaultPoster.bgColor} onChange={(e)=>mergePoster({ bgColor: e.target.value })} placeholder="#d6e3e2" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Color del borde</label>
                    <Input type="text" value={defaultPoster.frameBorderColor} onChange={(e)=>mergePoster({ frameBorderColor: e.target.value })} placeholder="#0b0f12" />
                      </div>
                    </div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Título (línea 1)</label>
                <Input type="text" value={defaultPoster.titleTop} onChange={(e)=>mergePoster({ titleTop: e.target.value })} placeholder="STILL WASTING TIME" />
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Título (línea 2)</label>
                <Input type="text" value={defaultPoster.titleBottom} onChange={(e)=>mergePoster({ titleBottom: e.target.value })} placeholder="LOOKING FOR TICKETS?" />
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Subtítulo</label>
                <Input type="text" value={defaultPoster.subtitle} onChange={(e)=>mergePoster({ subtitle: e.target.value })} placeholder="Simply relax and download our app..." />
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Texto del CTA</label>
                <Input type="text" value={defaultPoster.ctaText} onChange={(e)=>mergePoster({ ctaText: e.target.value })} placeholder="GET THE APP FOR FREE" />
                  </div>
                )}

                {design.container.variant === 'ticket' && (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Color primario (tarjeta)</label>
                    <Input type="text" value={defaultTicket.primaryColor} onChange={(e)=>mergeTicket({ primaryColor: e.target.value })} placeholder="#ff3b00" />
                    </div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Título del evento</label>
                 <Input type="text" value={defaultTicket.eventTitle} onChange={(e)=>mergeTicket({ eventTitle: e.target.value })} placeholder="ART OF VICTORY" />
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Fecha</label>
                     <Input type="text" value={defaultTicket.dateText} onChange={(e)=>mergeTicket({ dateText: e.target.value })} placeholder="MONDAY, JULY 23" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Hora</label>
                     <Input type="text" value={defaultTicket.timeText} onChange={(e)=>mergeTicket({ timeText: e.target.value })} placeholder="9:00 - 10:00" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nombre</label>
                     <Input type="text" value={defaultTicket.attendeeName} onChange={(e)=>mergeTicket({ attendeeName: e.target.value })} placeholder="Anna Jordan" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
                     <Input type="email" value={defaultTicket.attendeeEmail} onChange={(e)=>mergeTicket({ attendeeEmail: e.target.value })} placeholder="anna.jordan@email.com" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">CTA primario</label>
                     <Input type="text" value={defaultTicket.ctaPrimary} onChange={(e)=>mergeTicket({ ctaPrimary: e.target.value })} placeholder="Your Tickets" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">CTA secundario</label>
                     <Input type="text" value={defaultTicket.ctaSecondary} onChange={(e)=>mergeTicket({ ctaSecondary: e.target.value })} placeholder="Get Directions" />
                      </div>
                    </div>
                  </div>
                )}
              </div>
           </div>

            {/* Configuración de estilo del contenedor */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t pt-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Color de fondo del preset</label>
                  <div className="flex gap-3 items-center">
                    <Input
                      type="text"
                      value={design.container.backgroundColor}
                      onChange={(e) => updateProfileDesign({ container: { ...design.container, backgroundColor: e.target.value } })}
                      placeholder="rgba(0,0,0,0.35)"
                      className="flex-1"
                    />
                    <button
                      ref={colorButtonRef}
                      type="button"
                      onClick={() => setPickerOpen(true)}
                      className="w-10 h-10 rounded-md border border-black/20"
                      style={{ background: design.container.backgroundColor }}
                      aria-label="Elegir color"
                    />
                  </div>
                  <ColorPickerPopover
                    color={design.container.backgroundColor}
                    onChange={(hex) => updateProfileDesign({ container: { ...design.container, backgroundColor: hex } })}
                    anchorEl={colorButtonRef.current}
                    isOpen={pickerOpen}
                    onClose={() => setPickerOpen(false)}
                  />
                </div>
                <IOSNumberField
                  label="Radio del Contenedor"
                  value={design.container.borderRadius}
                  onChange={(n) => updateProfileDesign({ container: { ...design.container, borderRadius: n } })}
                  min={0}
                  max={40}
                  step={1}
                  unit="px"
                />
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Color del borde del preset</label>
                  <div className="flex gap-3 items-center">
                    <Input
                      type="text"
                      value={design.container.border.color}
                      onChange={(e) => updateProfileDesign({ container: { ...design.container, border: { ...design.container.border, color: e.target.value } } })}
                      placeholder="rgba(255,255,255,0.15)"
                      className="flex-1"
                    />
                    <button
                      type="button"
                      onClick={() => setPickerOpen(true)}
                      className="w-10 h-10 rounded-md border border-black/20"
                      style={{ background: design.container.border.color }}
                      aria-label="Elegir color borde"
                    />
                  </div>
                </div>
                <IOSNumberField
                  label="Borde (ancho)"
                  value={design.container.border.width}
                  onChange={(n) => updateProfileDesign({ container: { ...design.container, border: { ...design.container.border, width: n } } })}
                  min={0}
                  max={6}
                  step={1}
                  unit="px"
                />
              </div>

              <div className="space-y-4">
                <IOSNumberField
                  label="Tamaño Avatar"
                  value={design.elements.avatar.size}
                  onChange={(n) => updateDesignElements({ avatar: { ...design.elements.avatar, size: n } })}
                  min={48}
                  max={240}
                  step={2}
                  unit="px"
                />
                <IOSNumberField
                  label="Radio Avatar"
                  value={design.elements.avatar.borderRadius}
                  onChange={(n) => updateDesignElements({ avatar: { ...design.elements.avatar, borderRadius: n } })}
                  min={0}
                  max={200}
                  step={2}
                  unit="px"
                />
                <IOSNumberField
                  label="Tamaño Nombre"
                  value={design.elements.name.fontSize}
                  onChange={(n) => updateDesignElements({ name: { ...design.elements.name, fontSize: n } })}
                  min={12}
                  max={64}
                  step={1}
                  unit="px"
                />
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Color del Nombre</label>
                  <Input
                    type="text"
                    value={design.elements.name.color}
                    onChange={(e) => updateDesignElements({ name: { ...design.elements.name, color: e.target.value } })}
                    placeholder="#ffffff"
                  />
                </div>
                <IOSNumberField
                  label="Tamaño Bio"
                  value={design.elements.bio.fontSize}
                  onChange={(n) => updateDesignElements({ bio: { ...design.elements.bio, fontSize: n } })}
                  min={10}
                  max={36}
                  step={1}
                  unit="px"
                />
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Color de la Bio</label>
                  <Input
                    type="text"
                    value={design.elements.bio.color}
                    onChange={(e) => updateDesignElements({ bio: { ...design.elements.bio, color: e.target.value } })}
                    placeholder="rgba(255,255,255,0.85)"
                  />
                </div>
              </div>
            </div>
          </>
        )}
      </IOSSection>

      {/* Editor visual experimental eliminado */}

      <IOSSection title="Fondo de Perfil" icon={<Palette size={14} />} variant="dark" sectionKey="profile-background">

        {/* Background Type Selector */}
        <div className="flex space-x-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1 mb-6">
          <button
            onClick={() => handleProfileUpdate({ backgroundType: 'gradient' })}
            className={`flex-1 flex items-center justify-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              card.profile.backgroundType === 'gradient'
                ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            <Zap className="w-4 h-4 mr-2" />
            Degradado
          </button>
          <button
            onClick={() => handleProfileUpdate({ backgroundType: 'color' })}
            className={`flex-1 flex items-center justify-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              card.profile.backgroundType === 'color'
                ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            <Palette className="w-4 h-4 mr-2" />
            Color Sólido
          </button>
          <button
            onClick={() => handleProfileUpdate({ backgroundType: 'image' })}
            className={`flex-1 flex items-center justify-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              card.profile.backgroundType === 'image'
                ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            <ImageIcon className="w-4 h-4 mr-2" />
            Imagen
          </button>
        </div>

        {/* Background Presets */}
        {(card.profile.backgroundType === 'gradient' || card.profile.backgroundType === 'color') && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Fondos Prediseñados
            </label>
            <div className="grid grid-cols-5 gap-3 mb-4">
              {backgroundPresets
                .filter(preset => 
                  card.profile.backgroundType === 'gradient' ? preset.type === 'gradient' : preset.type === 'color'
                )
                .map((preset, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      if (preset.type === 'gradient') {
                        handleProfileUpdate({ backgroundGradient: preset.value });
                      } else {
                        handleProfileUpdate({ backgroundColor: preset.value });
                      }
                    }}
                    className="w-full aspect-square rounded-lg border-2 border-gray-200 dark:border-gray-600 hover:border-blue-400 transition-colors relative overflow-hidden"
                    style={{ background: preset.value }}
                    title={preset.name}
                  >
                    <div className="absolute inset-0 bg-black/0 hover:bg-black/10 transition-colors"></div>
                  </button>
                ))}
            </div>
          </div>
        )}

        {/* Custom Background Input - advanced picker */}
        {card.profile.backgroundType === 'color' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Color Personalizado
            </label>
            <div className="flex items-center gap-3">
              <button
                ref={colorButtonRef}
                onClick={() => setPickerOpen(true)}
                className="w-10 h-10 rounded-lg border border-black/30"
                style={{ background: card.profile.backgroundColor || '#667eea' }}
                aria-label="Elegir color"
                type="button"
              />
              <Input
                type="text"
                value={card.profile.backgroundColor || ''}
                onChange={(e) => handleProfileUpdate({ backgroundColor: e.target.value })}
                placeholder="#667eea"
                className="flex-1"
              />
            </div>
            <ColorPickerPopover
              color={card.profile.backgroundColor || '#667eea'}
              onChange={(hex) => handleProfileUpdate({ backgroundColor: hex })}
              anchorEl={colorButtonRef.current}
              isOpen={pickerOpen}
              onClose={() => setPickerOpen(false)}
            />
          </div>
        )}

        {card.profile.backgroundType === 'gradient' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Degradado Personalizado (CSS)
            </label>
            <Input
              type="text"
              value={card.profile.backgroundGradient || ''}
              onChange={(e) => handleProfileUpdate({ backgroundGradient: e.target.value })}
              placeholder="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Usa formato CSS linear-gradient o radial-gradient
            </p>
          </div>
        )}

        {card.profile.backgroundType === 'image' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              URL de Imagen de Fondo
            </label>
            <Input
              type="url"
              value={card.profile.backgroundImage || ''}
              onChange={(e) => handleProfileUpdate({ backgroundImage: e.target.value })}
              placeholder="https://ejemplo.com/fondo.jpg"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Recomendamos imágenes de al menos 800x600px
            </p>
          </div>
        )}
      </IOSSection>

      {/* Editor de Plantillas Aplicadas */}
      <DynamicTemplateEditor
        card={card}
        section="profile"
        onUpdate={onUpdate}
      />

      {/* Galería de Plantillas */}
      {showTemplateGallery && (
        <TemplatesGallery
          section="profile"
          cardId={card.id}
          userId={card.userId}
          onTemplateApplied={(_template, _data) => {
            setShowTemplateGallery(false);
            // Forzar actualización del preview - usar una propiedad válida
            onUpdate({
              updatedAt: new Date() // Trigger re-render usando una propiedad existente
            });
          }}
          onClose={() => setShowTemplateGallery(false)}
        />
      )}
    </div>
  );
};

export default ProfileEditor;