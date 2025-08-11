import React, { useState, useEffect } from 'react';
import { Settings, ChevronDown, ChevronRight } from 'lucide-react';
import { TemplateFieldsEditor } from './TemplateFieldsEditor';
import { LockedSectionsEditor } from './LockedSectionsEditor';
import { CssGlobalEditor } from './CssGlobalEditor';
import { ComponentSelector } from './ComponentSelector';
import type { TemplatePack, EditableFieldRule, TemplatePackSections, AppearIn } from '@/types/templatePack';
import { templateRegistry } from '@/services/templateRegistry.tsx';

interface TemplateConfigPanelProps {
  templatePack: TemplatePack;
  onChange: (updates: Partial<TemplatePack>) => void;
  className?: string;
}

interface Section {
  id: string;
  title: string;
  description: string;
  defaultOpen?: boolean;
}

const sections: Section[] = [
  {
    id: 'component',
    title: 'Component & Visibility',
    description: 'Choose the React component and where the template appears',
    defaultOpen: true
  },
  {
    id: 'fields',
    title: 'Editable Fields',
    description: 'Define which fields users can edit',
    defaultOpen: false
  },
  {
    id: 'locked',
    title: 'Locked Sections',
    description: 'Choose which sections are locked from editing',
    defaultOpen: false
  },
  {
    id: 'css',
    title: 'Global CSS',
    description: 'Custom CSS styles for the template',
    defaultOpen: false
  }
];

export const TemplateConfigPanel: React.FC<TemplateConfigPanelProps> = ({
  templatePack,
  onChange,
  className = ''
}) => {
  const [openSections, setOpenSections] = useState<Record<string, boolean>>(
    sections.reduce((acc, section) => ({
      ...acc,
      [section.id]: section.defaultOpen || false
    }), {})
  );

  const toggleSection = (sectionId: string) => {
    setOpenSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };

  // Auto-populate fields from selected component
  useEffect(() => {
    const component = templateRegistry.get(templatePack.component.id);
    if (component?.editableFields && templatePack.editable.fields.length === 0) {
      onChange({
        editable: {
          ...templatePack.editable,
          fields: component.editableFields
        }
      });
    }
  }, [templatePack.component.id]);

  const handleComponentChange = (componentId: string) => {
    const component = templateRegistry.get(componentId);
    const updates: Partial<TemplatePack> = {
      component: {
        ...templatePack.component,
        id: componentId,
        props: {
          ...templatePack.component.props,
          ...component?.defaultProps
        }
      }
    };

    // Optionally merge in the component's predefined editable fields
    if (component?.editableFields) {
      updates.editable = {
        ...templatePack.editable,
        fields: [
          ...templatePack.editable.fields,
          ...component.editableFields.filter(newField => 
            !templatePack.editable.fields.some(existingField => 
              existingField.path === newField.path
            )
          )
        ]
      };
    }

    onChange(updates);
  };

  const handleFieldsChange = (fields: EditableFieldRule[]) => {
    onChange({
      editable: {
        ...templatePack.editable,
        fields
      }
    });
  };

  const handleLockedSectionsChange = (lockedSections: Array<keyof TemplatePackSections>) => {
    onChange({
      editable: {
        ...templatePack.editable,
        lockedSections
      }
    });
  };

  const handleCssChange = (css: string) => {
    onChange({
      cssGlobal: css,
      sections: {
        ...templatePack.sections,
        design: {
          ...templatePack.sections.design,
          globalStyles: css
        }
      }
    });
  };

  const handleAppearInChange = (appearIn: AppearIn) => {
    onChange({ appearIn });
  };

  const renderSectionContent = (sectionId: string) => {
    switch (sectionId) {
      case 'component':
        return (
          <ComponentSelector
            selectedComponentId={templatePack.component.id}
            onComponentChange={handleComponentChange}
            appearIn={templatePack.appearIn}
            onAppearInChange={handleAppearInChange}
          />
        );

      case 'fields':
        return (
          <TemplateFieldsEditor
            fields={templatePack.editable.fields}
            onChange={handleFieldsChange}
            templateData={templatePack}
          />
        );

      case 'locked':
        return (
          <LockedSectionsEditor
            lockedSections={templatePack.editable.lockedSections}
            onChange={handleLockedSectionsChange}
          />
        );

      case 'css':
        return (
          <CssGlobalEditor
            value={templatePack.cssGlobal || templatePack.sections.design.globalStyles || ''}
            onChange={handleCssChange}
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
        <div className="flex items-center gap-3">
          <Settings className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Template Configuration
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Configure how this template works and what users can customize
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {sections.map(section => (
          <div
            key={section.id}
            className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden"
          >
            {/* Section Header */}
            <button
              onClick={() => toggleSection(section.id)}
              className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                {openSections[section.id] ? (
                  <ChevronDown className="w-5 h-5 text-gray-400" />
                ) : (
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                )}
                <div className="text-left">
                  <h3 className="font-medium text-gray-900 dark:text-white">
                    {section.title}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {section.description}
                  </p>
                </div>
              </div>
              
              {/* Status indicators */}
              {section.id === 'fields' && (
                <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded">
                  {templatePack.editable.fields.length} field{templatePack.editable.fields.length !== 1 ? 's' : ''}
                </span>
              )}
              {section.id === 'locked' && (
                <span className="px-2 py-1 text-xs bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 rounded">
                  {templatePack.editable.lockedSections.length} locked
                </span>
              )}
              {section.id === 'css' && templatePack.cssGlobal && (
                <span className="px-2 py-1 text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 rounded">
                  Custom CSS
                </span>
              )}
            </button>

            {/* Section Content */}
            {openSections[section.id] && (
              <div className="px-6 pb-6">
                <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                  {renderSectionContent(section.id)}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
          Configuration Summary
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800 dark:text-blue-200">
          <div>
            <p><strong>Component:</strong> {templateRegistry.get(templatePack.component.id)?.name || templatePack.component.id}</p>
            <p><strong>Visibility:</strong> {templatePack.appearIn}</p>
          </div>
          <div>
            <p><strong>Editable Fields:</strong> {templatePack.editable.fields.length}</p>
            <p><strong>Locked Sections:</strong> {templatePack.editable.lockedSections.length}/8</p>
          </div>
        </div>
      </div>
    </div>
  );
};
