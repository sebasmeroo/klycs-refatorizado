import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card } from '@/types';
import { useAutoSave } from '@/hooks/useAutoSave';
import { SaveIndicator } from '@/components/ui/SaveIndicator';
import type { LucideIcon } from 'lucide-react';
import {
  Eye,
  User,
  Link,
  Share,
  Briefcase,
  Calendar,
  Image,
  Settings,
  ArrowLeft,
  ChevronRight,
  ChevronDown,
  Lock
} from 'lucide-react';

// Componentes de cada sección
import { ProfileEditor } from './sections/ProfileEditor';
import { LinksEditor } from './sections/LinksEditor';
import { SocialLinksEditor } from './sections/SocialLinksEditor';
import { ServicesEditor } from './sections/ServicesEditor';
import { BookingEditor } from './sections/BookingEditor';
import { PortfolioEditor } from './sections/PortfolioEditor';
import { SettingsEditor } from './sections/SettingsEditor';
import { CalendarEditor } from './sections/CalendarEditor';
import { SectionOrderEditor } from './sections/SectionOrderEditor';
import { AdvancedSettingsEditor } from './sections/AdvancedSettingsEditor';

// Preview components
import { MobilePreview } from './preview/MobilePreview';
import { useSubscriptionStatus } from '@/hooks/useSubscriptionStatus';
import { toast } from '@/utils/toast';
import { Button } from '@/components/ui/Button';


interface NewCardEditorProps {
  card: Card;
  onSave: (updatedCard: Card) => void;
  onClose: () => void;
}

type EditorSection = 
  | 'profile' 
  | 'links' 
  | 'social' 
  | 'services' 
  | 'booking' 
  | 'portfolio'
  | 'calendar'
  | 'section-order'
  | 'advanced-settings';

type SidebarSection = {
  id: EditorSection;
  label: string;
  icon: LucideIcon;
  description: string;
  color: string;
  requiresPaid?: boolean;
};

const sidebarSections: SidebarSection[] = [
  {
    id: 'profile' as EditorSection,
    label: 'Perfil',
    icon: User,
    description: 'Información personal y bio',
    color: 'from-blue-500 to-blue-600'
  },
  {
    id: 'links' as EditorSection,
    label: 'Enlaces',
    icon: Link,
    description: 'Enlaces principales',
    color: 'from-green-500 to-green-600'
  },
  {
    id: 'social' as EditorSection,
    label: 'Redes Sociales',
    icon: Share,
    description: 'Perfiles de redes sociales',
    color: 'from-pink-500 to-pink-600'
  },
  {
    id: 'services' as EditorSection,
    label: 'Servicios',
    icon: Briefcase,
    description: 'Servicios profesionales',
    color: 'from-purple-500 to-purple-600',
    requiresPaid: true
  },
  {
    id: 'portfolio' as EditorSection,
    label: 'Portfolio',
    icon: Image,
    description: 'Imágenes y videos',
    color: 'from-cyan-500 to-cyan-600'
  },
  {
    id: 'booking' as EditorSection,
    label: 'Reservas',
    icon: Calendar,
    description: 'Sistema de citas',
    color: 'from-orange-500 to-orange-600',
    requiresPaid: true
  },
  {
    id: 'calendar' as EditorSection,
    label: 'Calendario',
    icon: Calendar,
    description: 'Profesionales y reservas',
    color: 'from-blue-500 to-blue-600',
    requiresPaid: true
  },
  {
    id: 'section-order' as EditorSection,
    label: 'Orden de Secciones',
    icon: Settings,
    description: 'Reordenar secciones',
    color: 'from-purple-500 to-purple-600',
    requiresPaid: true
  },
  {
    id: 'advanced-settings' as EditorSection,
    label: 'Configuración Avanzada',
    icon: Settings,
    description: 'SEO, Analytics, Sharing',
    color: 'from-indigo-500 to-indigo-600'
  }
];

const paidOnlySectionIds = new Set<EditorSection>(
  sidebarSections
    .filter(section => section.requiresPaid)
    .map(section => section.id)
);

const lockedMessages: Partial<Record<EditorSection, { title: string; description: string }>> = {
  services: {
    title: 'Servicios profesionales',
    description: 'Crea y promociona tu catálogo de servicios a partir de los planes PRO y BUSINESS.'
  },
  booking: {
    title: 'Reservas y sistema de citas',
    description: 'Activa agendas inteligentes y cobros automatizados actualizando tu plan.'
  },
  calendar: {
    title: 'Calendario colaborativo',
    description: 'Gestiona calendarios y profesionales en tiempo real con los planes PRO y BUSINESS.'
  },
  'section-order': {
    title: 'Orden de secciones',
    description: 'Reordena la estructura de tu tarjeta al desbloquear las funciones avanzadas.'
  }
};

export const NewCardEditor: React.FC<NewCardEditorProps> = ({
  card,
  onSave,
  onClose
}) => {
  const { user, firebaseUser } = useAuth();
  const [currentCard, setCurrentCard] = useState<Card>(card);
  const [activeSection, setActiveSection] = useState<EditorSection>('profile');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [sidebarQuery, setSidebarQuery] = useState('');
  const [activeSubsection, setActiveSubsection] = useState<string | null>(null);
  const [openSubmenus, setOpenSubmenus] = useState<Partial<Record<EditorSection, boolean>>>({});
  const { planName } = useSubscriptionStatus();
  const normalizedPlan = useMemo(() => (planName || 'FREE').toLowerCase(), [planName]);
  const isFreePlan = normalizedPlan.includes('free') || normalizedPlan.includes('básico');
  const isSectionLocked = useCallback((sectionId: EditorSection) => {
    return isFreePlan && paidOnlySectionIds.has(sectionId);
  }, [isFreePlan]);
  const handleUpgradePrompt = useCallback(() => {
    toast.info('Disponible en planes PRO y BUSINESS. Actualiza tu plan para desbloquear esta sección.');
  }, []);

  // ✅ Auto-save profesional con debounce de 2 segundos (patrón Notion)
  const { save: autoSave, isSaving, lastSaved, forceSave } = useAutoSave(currentCard, {
    onSaveSuccess: () => {
      onSave(currentCard);
    }
  });

  // ✅ Actualizar tarjeta + trigger auto-save
  const handleCardUpdate = useCallback((updates: Partial<Card>) => {
    setCurrentCard(prev => {
      const updated = { ...prev, ...updates };
      // Auto-guardar con debounce (ahorra 90% de escrituras)
      autoSave(updates);
      return updated;
    });
  }, [autoSave]);

  // ✅ Forzar guardado al cerrar el editor
  useEffect(() => {
    return () => {
      forceSave();
    };
  }, [forceSave]);


  const renderActiveSection = () => {
    const commonProps = {
      card: currentCard,
      onUpdate: handleCardUpdate
    };
    const linksLimit = isFreePlan ? 5 : undefined;
    const socialLimit = isFreePlan ? 3 : undefined;

    if (isSectionLocked(activeSection)) {
      return renderLockedSection(activeSection);
    }

    switch (activeSection) {
      case 'profile':
        return <ProfileEditor {...commonProps} />;
      case 'links':
        return (
          <LinksEditor
            {...commonProps}
            maxLinks={linksLimit}
            onLimitReached={handleUpgradePrompt}
          />
        );
      case 'social':
        return (
          <SocialLinksEditor
            {...commonProps}
            maxSocialLinks={socialLimit}
            onLimitReached={handleUpgradePrompt}
          />
        );
      case 'services':
        return <ServicesEditor {...commonProps} />;
      case 'portfolio':
        return <PortfolioEditor {...commonProps} />;
      case 'booking':
        return <BookingEditor {...commonProps} />;
      case 'calendar':
        return <CalendarEditor {...commonProps} />;
      case 'section-order':
        return <SectionOrderEditor {...commonProps} />;
      case 'advanced-settings':
        return <AdvancedSettingsEditor {...commonProps} />;
      default:
        return <ProfileEditor {...commonProps} />;
    }
  };

  const renderLockedSection = (sectionId: EditorSection) => {
    const sectionMeta = sidebarSections.find(section => section.id === sectionId);
    const copy = lockedMessages[sectionId];

    return (
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-8 text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
          <Lock className="h-8 w-8 text-blue-600 dark:text-blue-300" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          {copy?.title || sectionMeta?.label || 'Función premium'}
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-300 max-w-xl mx-auto">
          {copy?.description || 'Actualiza tu plan a PRO o BUSINESS para desbloquear esta funcionalidad.'}
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Button onClick={() => window.open('/dashboard/settings', '_blank')} size="sm">
            Ver planes
          </Button>
          <Button onClick={() => window.open('/pricing', '_blank')} variant="outline" size="sm">
            Comparar planes
          </Button>
        </div>
      </div>
    );
  };

  const currentSection = sidebarSections.find(s => s.id === activeSection);
  const sectionSubmenus: Partial<Record<EditorSection, { id: string; label: string }[]>> = {
    profile: [
      { id: 'profile-info', label: 'Información del Perfil' },
      { id: 'basic-info', label: 'Información Básica' },
      { id: 'profile-background', label: 'Fondo de Perfil' },
    ],
    links: [{ id: 'links-main', label: 'Enlaces principales' }],
    social: [{ id: 'social-main', label: 'Redes sociales' }],
    services: [{ id: 'services-main', label: 'Servicios profesionales' }],
    booking: [{ id: 'booking-main', label: 'Sistema de citas' }],
  };

  const filteredSidebarSections = sidebarSections.filter(s =>
    s.label.toLowerCase().includes(sidebarQuery.toLowerCase()) ||
    s.description.toLowerCase().includes(sidebarQuery.toLowerCase())
  );

  const getSectionBadge = (id: EditorSection): number | undefined => {
    try {
      switch (id) {
        case 'links':
          return currentCard.links?.length || 0;
        case 'social':
          return currentCard.socialLinks?.length || 0;
        case 'services':
          return currentCard.services?.length || 0;
        case 'portfolio':
          return currentCard.portfolio?.items?.length || 0;
        case 'booking':
          return currentCard.booking?.enabled ? 1 : 0;
        default:
          return undefined;
      }
    } catch {
      return undefined;
    }
  };

  return (
    <div className="flex h-screen min-h-0 bg-[#0b0b0f] overflow-hidden">
      {/* Sidebar */}
      <div className={`bg-[#0f1116] text-white border-r border-black/30 flex h-full flex-col transition-all duration-300 ${
        sidebarCollapsed ? 'w-16' : 'w-64'
      }`}>
        {/* Header */}
        <div className="flex-shrink-0 p-3 border-b border-white/10 bg-[#0b0d12]/80 backdrop-blur">
          <div className="flex items-center justify-between mb-2">
            <button
              onClick={onClose}
              className="flex items-center text-white/60 hover:text-white transition-colors"
              title="Volver al dashboard"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              {!sidebarCollapsed && 'Volver'}
            </button>
            
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="p-1 text-white/40 hover:text-white/80 transition-colors"
            >
              <ChevronRight className={`w-4 h-4 transition-transform ${sidebarCollapsed ? '' : 'rotate-180'}`} />
            </button>
          </div>
          
          {!sidebarCollapsed && (
            <>
              <h1 className="text-lg font-semibold text-white truncate">
                {currentCard.title}
              </h1>
              <p className="text-sm text-white/50 truncate">
                /{currentCard.slug}
              </p>
              <div className="mt-2">
                <input
                  type="text"
                  placeholder="Buscar sección..."
                  value={sidebarQuery}
                  onChange={(e)=>setSidebarQuery(e.target.value)}
                  className="w-full rounded-md bg-white/5 border border-white/10 px-2.5 py-1.5 text-sm placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                />
              </div>
            </>
          )}
        </div>

        {/* Navigation */}
        <div className="flex-1 min-h-0 overflow-y-auto py-4">
          <nav className={`space-y-1 ${sidebarCollapsed ? 'px-1' : 'px-2.5'}`}>
            {filteredSidebarSections.map((section) => {
              const Icon = section.icon;
              const isActive = activeSection === section.id;
              const badge = getSectionBadge(section.id);
              const isLocked = isSectionLocked(section.id);
              
              const submenuItems = sectionSubmenus[section.id] || [];
              const hasSubmenu = submenuItems.length > 0;
              const isOpenSub = !!openSubmenus[section.id];
              return (
                <div key={section.id}>
                  <button
                    onClick={() => {
                      if (isLocked) {
                        handleUpgradePrompt();
                        return;
                      }
                      if (activeSection !== section.id) {
                        setActiveSection(section.id);
                        if (hasSubmenu) setOpenSubmenus((s)=>({ ...s, [section.id]: true }));
                      } else if (hasSubmenu) {
                        setOpenSubmenus((s)=>({ ...s, [section.id]: !isOpenSub }));
                      }
                    }}
                    className={`w-full flex items-center px-2.5 py-2 rounded-md text-left transition-all duration-200 relative overflow-hidden group ${
                      isActive
                        ? 'bg-white/5 text-white shadow-[inset_0_0_0_1px_rgba(59,130,246,0.35)]'
                        : 'text-white/70 hover:bg-white/5'
                    } ${isLocked ? 'cursor-not-allowed opacity-60 hover:bg-transparent' : ''}`}
                    title={sidebarCollapsed ? section.label : undefined}
                  >
                    <div className={`w-7 h-7 rounded-md flex items-center justify-center mr-2 bg-gradient-to-br ${section.color} ${isActive ? 'shadow-lg' : 'opacity-80'}`}>
                      <Icon className="w-3.5 h-3.5 text-white"/>
                    </div>
                    {!sidebarCollapsed && (
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate text-[13px]">{section.label}</div>
                        <div className="text-[11px] text-white/50 truncate">
                          {section.description}
                        </div>
                      </div>
                    )}
                    {!sidebarCollapsed && (
                      <div className="ml-2 flex items-center gap-2">
                        {typeof badge === 'number' && (
                          <span className={`text-[10px] px-1 py-0.5 rounded ${isActive ? 'bg-blue-500/20 text-blue-300' : 'bg-white/10 text-white/70'}`}>{badge}</span>
                        )}
                        {isLocked && <Lock className="w-3.5 h-3.5 text-white/50" />}
                        {hasSubmenu && (
                          <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isOpenSub ? 'rotate-180 text-blue-400' : 'text-white/50'}`} />
                        )}
                      </div>
                    )}
                    {isActive && (<span className="absolute left-0 top-0 bottom-0 w-[3px] bg-blue-500"/>) }
                  </button>

                  {/* Submenu debajo de la sección activa */}
                  {!sidebarCollapsed && isActive && hasSubmenu && isOpenSub && (
                    <div className="mt-1 ml-9 space-y-1">
                      {submenuItems.map((sub) => (
                        <button
                          key={sub.id}
                          onClick={() => {
                            setActiveSubsection(sub.id);
                            // Abre la sección correspondiente en el editor
                            // @ts-ignore
                            window.dispatchEvent(new CustomEvent('open-section', { detail: sub.id }));
                          }}
                          className={`w-full text-left text-[11px] px-2 py-1 rounded-md transition-colors ${
                            activeSubsection === sub.id ? 'bg-white/10 text-white' : 'text-white/60 hover:text-white hover:bg-white/5'
                          }`}
                        >
                          {sub.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>
        </div>

        {/* Footer - Auto-save Indicator */}
        <div className="flex-shrink-0 p-4 border-t border-white/10 bg-[#0b0d12]/80 backdrop-blur">
          {!sidebarCollapsed && (
            <div className="flex items-center justify-center">
              <SaveIndicator
                isSaving={isSaving}
                lastSaved={lastSaved}
              />
            </div>
          )}

          {sidebarCollapsed && (
            <div className="flex items-center justify-center" title={isSaving ? 'Guardando...' : lastSaved ? `Guardado ${lastSaved.toLocaleTimeString()}` : 'Auto-guardado activo'}>
              <div className={`w-2 h-2 rounded-full ${isSaving ? 'bg-yellow-400 animate-pulse' : 'bg-green-400'}`} />
            </div>
          )}

          {!sidebarCollapsed && (
            <p className="text-xs text-white/40 mt-2 text-center">
              Los cambios se guardan automáticamente
            </p>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 min-w-0 min-h-0">
        {/* Editor Content */}
        <div className="flex flex-1 min-w-0 min-h-0 flex-col overflow-hidden">
          {/* Content Header */}
          <div className="flex-shrink-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {currentSection?.label}
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {currentSection?.description}
                </p>
              </div>

              
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => window.open(`/c/${currentCard.slug}`, '_blank')}
                  className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  <Eye className="w-4 h-4 mr-2" />
                  Vista previa
                </button>
              </div>
            </div>
          </div>

          {/* Editor Content Area */}
          <div className="flex-1 min-h-0 overflow-y-auto p-6">
            <div className="max-w-4xl mx-auto">
              {renderActiveSection()}
              <div className="mt-8 xl:hidden">
                <div className="bg-[#0b0b0f] rounded-3xl p-4 shadow-2xl border border-black/20">
                  <MobilePreview card={currentCard} customCSS={currentCard?.theme?.customCSS} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Preview Column */}
        <aside className="hidden xl:flex h-full w-[420px] bg-[#0b0b0f] border-l border-black/20">
          <div className="sticky top-0 box-border flex h-full w-full flex-col items-center justify-start px-5 py-6">
            <MobilePreview card={currentCard} customCSS={currentCard?.theme?.customCSS} />
          </div>
        </aside>
      </div>
    </div>
  );
};

export default NewCardEditor;
