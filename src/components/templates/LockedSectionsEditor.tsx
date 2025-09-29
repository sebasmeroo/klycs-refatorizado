import React from 'react';
import { Lock, Unlock } from 'lucide-react';
import type { TemplatePackSections } from '@/types/templatePack';

interface LockedSectionsEditorProps {
  lockedSections: Array<keyof TemplatePackSections>;
  onChange: (lockedSections: Array<keyof TemplatePackSections>) => void;
  className?: string;
}

const sectionInfo: Record<keyof TemplatePackSections, { label: string; description: string; icon: string }> = {
  profile: {
    label: 'Perfil',
    description: 'Información personal, avatar y biografía',
    icon: '👤'
  },
  links: {
    label: 'Enlaces',
    description: 'Enlaces personalizados y botones',
    icon: '🔗'
  },
  social: {
    label: 'Redes Sociales',
    description: 'Perfiles de redes sociales',
    icon: '📱'
  },
  services: {
    label: 'Servicios',
    description: 'Servicios ofrecidos y precios',
    icon: '💼'
  },
  booking: {
    label: 'Reservas',
    description: 'Sistema de citas y reservas',
    icon: '📅'
  },
  elements: {
    label: 'Elementos',
    description: 'Elementos personalizados y código',
    icon: '🧩'
  },
  design: {
    label: 'Diseño',
    description: 'Configuración de tema y estilos',
    icon: '🎨'
  }
};

export const LockedSectionsEditor: React.FC<LockedSectionsEditorProps> = ({
  lockedSections,
  onChange,
  className = ''
}) => {
  const toggleSection = (section: keyof TemplatePackSections) => {
    if (lockedSections.includes(section)) {
      onChange(lockedSections.filter(s => s !== section));
    } else {
      onChange([...lockedSections, section]);
    }
  };

  const toggleAll = () => {
    const allSections = Object.keys(sectionInfo) as Array<keyof TemplatePackSections>;
    if (lockedSections.length === allSections.length) {
      onChange([]);
    } else {
      onChange(allSections);
    }
  };

  const allSections = Object.keys(sectionInfo) as Array<keyof TemplatePackSections>;
  const isAllLocked = lockedSections.length === allSections.length;

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Locked Sections
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Locked sections cannot be edited by end users
          </p>
        </div>
        <button
          onClick={toggleAll}
          className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
        >
          {isAllLocked ? (
            <>
              <Unlock className="w-4 h-4" />
              Unlock All
            </>
          ) : (
            <>
              <Lock className="w-4 h-4" />
              Lock All
            </>
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {allSections.map(section => {
          const info = sectionInfo[section];
          const isLocked = lockedSections.includes(section);

          return (
            <div
              key={section}
              className={`
                relative p-4 rounded-lg border-2 transition-all cursor-pointer
                ${isLocked 
                  ? 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20' 
                  : 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20'
                }
                hover:shadow-md
              `}
              onClick={() => toggleSection(section)}
            >
              <div className="flex items-start gap-3">
                <div className="text-2xl">{info.icon}</div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      {info.label}
                    </h4>
                    {isLocked ? (
                      <Lock className="w-4 h-4 text-red-600 dark:text-red-400" />
                    ) : (
                      <Unlock className="w-4 h-4 text-green-600 dark:text-green-400" />
                    )}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {info.description}
                  </p>
                  <div className="mt-2">
                    <span className={`
                      inline-flex items-center px-2 py-1 text-xs font-medium rounded-full
                      ${isLocked 
                        ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' 
                        : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                      }
                    `}>
                      {isLocked ? 'Locked' : 'Editable'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Overlay hover */}
              <div className="absolute inset-0 bg-black/5 opacity-0 hover:opacity-100 transition-opacity rounded-lg pointer-events-none" />
            </div>
          );
        })}
      </div>

      {/* Summary */}
      <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600 dark:text-gray-400">
            Locked: {lockedSections.length} / {allSections.length}
          </span>
          <span className="text-gray-600 dark:text-gray-400">
            Editable: {allSections.length - lockedSections.length} / {allSections.length}
          </span>
        </div>
        
        <div className="mt-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div 
            className="bg-red-500 h-2 rounded-full transition-all duration-300"
            style={{ 
              width: `${(lockedSections.length / allSections.length) * 100}%` 
            }}
          />
        </div>
        
        {lockedSections.length > 0 && (
          <div className="mt-3">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
              Locked sections:
            </p>
            <div className="flex flex-wrap gap-1">
              {lockedSections.map(section => (
                <span
                  key={section}
                  className="inline-flex items-center px-2 py-1 text-xs bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 rounded"
                >
                  {sectionInfo[section].label}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
