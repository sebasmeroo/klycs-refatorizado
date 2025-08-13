import React, { useState, useEffect, useCallback } from 'react';
import { Loader2, AlertCircle, Eye, EyeOff } from 'lucide-react';
import TemplateSandbox from './TemplateSandbox';
import DirectTemplateRenderer from '@/components/templates/DirectTemplateRenderer';

interface TemplateField {
  id: string;
  label: string;
  type: 'text' | 'image' | 'color' | 'textarea' | 'select' | 'number';
  defaultValue: string;
  options?: string[];
  editable: boolean;
}

interface Template {
  id: string;
  name: string;
  description: string;
  category: string;
  reactCode: string;
  cssCode: string;
  jsonConfig: TemplateField[];
  isPublic: boolean;
}

interface TemplateRendererProps {
  template: Template;
  editable?: boolean;
  initialData?: any;
  onDataChange?: (data: any) => void;
  previewMode?: boolean;
  className?: string;
}

export const TemplateRenderer: React.FC<TemplateRendererProps> = ({
  template,
  editable = false,
  initialData,
  onDataChange,
  previewMode = false,
  className = ''
}) => {
  const [templateData, setTemplateData] = useState<any>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showEditor, setShowEditor] = useState(editable && !previewMode);

  // Stable callbacks to prevent TemplateSandbox re-renders
  const handleError = useCallback((error: string) => {
    setError(error);
  }, []);

  const handleSuccess = useCallback(() => {
    setError(null);
  }, []);

  // Inicializar datos del template (evitar bucles por identidad de objeto)
  useEffect(() => {
    const source = initialData || {};
    const initData: any = {};

    if (template?.jsonConfig && Array.isArray(template.jsonConfig)) {
      template.jsonConfig.forEach(field => {
        if (Object.prototype.hasOwnProperty.call(source, field.id)) {
          initData[field.id] = source[field.id];
        } else {
          initData[field.id] = field.defaultValue || '';
        }
      });
    }

    // Solo actualizar si cambia realmente
    const nextStr = JSON.stringify(initData);
    const prevStr = JSON.stringify(templateData);
    if (nextStr !== prevStr) {
      setTemplateData(initData);
    }
    setIsLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [template, JSON.stringify(initialData || {})]);

  // Notificar cambios de datos al componente padre
  useEffect(() => {
    onDataChange?.(templateData);
  }, [templateData, onDataChange]);

  const updateFieldValue = (fieldId: string, value: any) => {
    setTemplateData(prev => ({
      ...prev,
      [fieldId]: value
    }));
  };

  const renderFieldEditor = (field: TemplateField) => {
    const value = templateData[field.id] || field.defaultValue;

    switch (field.type) {
      case 'text':
        return (
          <input
            type="text"
            value={value}
            onChange={(e) => updateFieldValue(field.id, e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder={field.defaultValue}
          />
        );

      case 'textarea':
        return (
          <textarea
            value={value}
            onChange={(e) => updateFieldValue(field.id, e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            rows={3}
            placeholder={field.defaultValue}
          />
        );

      case 'color':
        return (
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={value}
              onChange={(e) => updateFieldValue(field.id, e.target.value)}
              className="w-12 h-10 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer"
            />
            <input
              type="text"
              value={value}
              onChange={(e) => updateFieldValue(field.id, e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="#000000"
            />
          </div>
        );

      case 'image':
        return (
          <div className="space-y-2">
            <input
              type="url"
              value={value}
              onChange={(e) => updateFieldValue(field.id, e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="https://ejemplo.com/imagen.jpg"
            />
            {value && (
              <div className="w-full h-20 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
                <img
                  src={value}
                  alt="Preview"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              </div>
            )}
          </div>
        );

      case 'number':
        return (
          <input
            type="number"
            value={value}
            onChange={(e) => updateFieldValue(field.id, parseFloat(e.target.value) || 0)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder={field.defaultValue}
          />
        );

      case 'select':
        return (
          <select
            value={value}
            onChange={(e) => updateFieldValue(field.id, e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {field.options?.map(option => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        );

      default:
        return (
          <div className="text-sm text-gray-500 italic">
            Tipo de campo no soportado: {field.type}
          </div>
        );
    }
  };

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center p-8 ${className}`}>
        <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600 dark:text-gray-400">Cargando plantilla...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`p-4 ${className}`}>
        <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
          <div>
            <h3 className="font-semibold text-red-800 dark:text-red-200">
              Error al cargar plantilla
            </h3>
            <p className="text-sm text-red-700 dark:text-red-300 mt-1">
              {error}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`template-renderer ${className}`}>
      {editable && (
        <div className="flex items-center justify-between mb-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-gray-800 dark:text-gray-200">
              {template.name}
            </h3>
            <span className="px-2 py-1 text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 rounded-full">
              Editable
            </span>
          </div>
          
          <button
            onClick={() => setShowEditor(!showEditor)}
            className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
          >
            {showEditor ? (
              <>
                <EyeOff className="w-4 h-4" />
                Ocultar Editor
              </>
            ) : (
              <>
                <Eye className="w-4 h-4" />
                Mostrar Editor
              </>
            )}
          </button>
        </div>
      )}

      <div className={`grid gap-6 ${editable && showEditor ? 'lg:grid-cols-2' : 'grid-cols-1'}`}>
        {/* Editor de Campos */}
        {editable && showEditor && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
              <h4 className="font-semibold text-gray-800 dark:text-gray-200">
                Personalizar Contenido
              </h4>
            </div>

            <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
              {template.jsonConfig
                .filter(field => field.editable)
                .map(field => (
                <div key={field.id} className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    {field.label}
                  </label>
                  {renderFieldEditor(field)}
                </div>
              ))}
            </div>

            {template.jsonConfig.filter(field => field.editable).length === 0 && (
              <div className="text-center p-4 text-gray-500 dark:text-gray-400">
                <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No hay campos editables en esta plantilla</p>
              </div>
            )}
          </div>
        )}

        {/* Preview de la Plantilla */}
        <div className={`${editable && showEditor ? '' : 'col-span-full'}`}>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-2 h-2 bg-green-600 rounded-full"></div>
            <h4 className="font-semibold text-gray-800 dark:text-gray-200">
              Vista Previa
            </h4>
          </div>

          <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden bg-white dark:bg-gray-800">
            {/* Renderizar con DirectTemplateRenderer (sin iframes) */}
            <DirectTemplateRenderer
              jsxCode={template.reactCode}
              data={templateData}
              className="w-full h-full direct-template-renderer"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default TemplateRenderer;