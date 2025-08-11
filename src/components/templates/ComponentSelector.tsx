import React from 'react';
import { Palette, Info } from 'lucide-react';
import { templateRegistry } from '@/services/templateRegistry.tsx';
import type { AppearIn } from '@/types/templatePack';

interface ComponentSelectorProps {
  selectedComponentId: string;
  onComponentChange: (componentId: string) => void;
  appearIn: AppearIn;
  onAppearInChange: (appearIn: AppearIn) => void;
  className?: string;
}

const appearInOptions: { value: AppearIn; label: string; description: string }[] = [
  {
    value: 'templates',
    label: 'Templates Only',
    description: 'Only appears in the templates section'
  },
  {
    value: 'design-presets',
    label: 'Design Presets Only', 
    description: 'Only appears in the design presets section'
  },
  {
    value: 'both',
    label: 'Both Sections',
    description: 'Appears in both templates and design presets'
  }
];

export const ComponentSelector: React.FC<ComponentSelectorProps> = ({
  selectedComponentId,
  onComponentChange,
  appearIn,
  onAppearInChange,
  className = ''
}) => {
  const registeredComponents = templateRegistry.getAll();
  const selectedComponent = templateRegistry.get(selectedComponentId);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Component Selection */}
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Palette className="w-5 h-5" />
            Template Component
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Choose which React component will render this template
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3">
          {Object.values(registeredComponents).map(component => (
            <div
              key={component.id}
              className={`
                relative p-4 rounded-lg border-2 cursor-pointer transition-all
                ${selectedComponentId === component.id
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                }
              `}
              onClick={() => onComponentChange(component.id)}
            >
              <div className="flex items-start gap-3">
                <div className={`
                  w-10 h-10 rounded-lg flex items-center justify-center text-lg
                  ${selectedComponentId === component.id
                    ? 'bg-blue-100 dark:bg-blue-800'
                    : 'bg-gray-100 dark:bg-gray-800'
                  }
                `}>
                  <Palette className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      {component.name}
                    </h4>
                    {selectedComponentId === component.id && (
                      <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-200 rounded">
                        Selected
                      </span>
                    )}
                  </div>
                  
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {component.description || 'No description available'}
                  </p>
                  
                  {component.editableFields && component.editableFields.length > 0 && (
                    <div className="mt-2">
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {component.editableFields.length} predefined field{component.editableFields.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Radio button indicator */}
              <div className={`
                absolute top-4 right-4 w-5 h-5 rounded-full border-2 
                ${selectedComponentId === component.id
                  ? 'border-blue-500 bg-blue-500'
                  : 'border-gray-300 dark:border-gray-600'
                }
              `}>
                {selectedComponentId === component.id && (
                  <div className="w-2 h-2 bg-white rounded-full m-0.5" />
                )}
              </div>
            </div>
          ))}
        </div>

        {selectedComponent && (
          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
              <div>
                <h5 className="font-medium text-gray-900 dark:text-white text-sm">
                  About {selectedComponent.name}
                </h5>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {selectedComponent.description || 'This component will be used to render the template.'}
                </p>
                
                {selectedComponent.defaultProps && Object.keys(selectedComponent.defaultProps).length > 0 && (
                  <div className="mt-2">
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      Default props: {Object.keys(selectedComponent.defaultProps).join(', ')}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Appear In Selection */}
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Visibility
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Choose where this template should appear for users
          </p>
        </div>

        <div className="space-y-3">
          {appearInOptions.map(option => (
            <div
              key={option.value}
              className={`
                relative p-4 rounded-lg border-2 cursor-pointer transition-all
                ${appearIn === option.value
                  ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                }
              `}
              onClick={() => onAppearInChange(option.value)}
            >
              <div className="flex items-start gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      {option.label}
                    </h4>
                    {appearIn === option.value && (
                      <span className="px-2 py-1 text-xs bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-200 rounded">
                        Active
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {option.description}
                  </p>
                </div>
              </div>
              
              {/* Radio button indicator */}
              <div className={`
                absolute top-4 right-4 w-5 h-5 rounded-full border-2 
                ${appearIn === option.value
                  ? 'border-green-500 bg-green-500'
                  : 'border-gray-300 dark:border-gray-600'
                }
              `}>
                {appearIn === option.value && (
                  <div className="w-2 h-2 bg-white rounded-full m-0.5" />
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
