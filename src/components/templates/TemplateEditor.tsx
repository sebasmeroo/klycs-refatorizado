import React, { useState, useEffect } from 'react';
import { 
  Save, 
  RefreshCw, 
  Eye, 
  EyeOff,
  Settings, 
  Palette, 
  Image, 
  Type,
  Sliders,
  Download,
  Share2,
  Copy,
  Check,
  AlertTriangle,
  Info
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { normalizeColorForPicker } from '@/utils/colors';
import { Input } from '@/components/ui/Input';
import TemplateRenderer from './TemplateRenderer';

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

interface TemplateEditorProps {
  template: Template;
  onSave?: (data: any) => Promise<void>;
  onShare?: (data: any) => void;
  onExport?: (data: any) => void;
  className?: string;
  readOnly?: boolean;
  showPreview?: boolean;
}

export const TemplateEditor: React.FC<TemplateEditorProps> = ({
  template,
  onSave,
  onShare,
  onExport,
  className = '',
  readOnly = false,
  showPreview = true
}) => {
  const [templateData, setTemplateData] = useState<any>({});
  const [isPreviewOpen, setIsPreviewOpen] = useState(showPreview);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [copied, setCopied] = useState(false);
  const [activeSection, setActiveSection] = useState<'content' | 'design' | 'advanced'>('content');

  // Inicializar datos del template
  useEffect(() => {
    const initData: any = {};
    template.jsonConfig.forEach(field => {
      initData[field.id] = field.defaultValue;
    });
    setTemplateData(initData);
  }, [template]);

  // Auto-guardar cada 30 segundos si hay cambios
  useEffect(() => {
    if (readOnly || !onSave) return;

    const autoSaveInterval = setInterval(() => {
      handleSave(true);
    }, 30000);

    return () => clearInterval(autoSaveInterval);
  }, [templateData, readOnly, onSave]);

  const updateField = (fieldId: string, value: any) => {
    setTemplateData(prev => ({
      ...prev,
      [fieldId]: value
    }));
    setSaveStatus('idle');
  };

  const handleSave = async (isAutoSave = false) => {
    if (!onSave || readOnly) return;

    setIsSaving(true);
    setSaveStatus('saving');
    
    try {
      await onSave(templateData);
      setSaveStatus('saved');
      
      if (!isAutoSave) {
        setTimeout(() => setSaveStatus('idle'), 2000);
      }
    } catch (error) {
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCopyData = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(templateData, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Error copiando datos:', error);
    }
  };

  const getSaveButtonText = () => {
    switch (saveStatus) {
      case 'saving': return 'Guardando...';
      case 'saved': return 'Guardado';
      case 'error': return 'Error al guardar';
      default: return 'Guardar Cambios';
    }
  };

  const getSaveButtonIcon = () => {
    switch (saveStatus) {
      case 'saving': return <RefreshCw className="w-4 h-4 animate-spin" />;
      case 'saved': return <Check className="w-4 h-4" />;
      case 'error': return <AlertTriangle className="w-4 h-4" />;
      default: return <Save className="w-4 h-4" />;
    }
  };

  // Agrupar campos por tipo para mejor organización
  const groupedFields = {
    content: template.jsonConfig.filter(field => 
      ['text', 'textarea', 'select'].includes(field.type) && field.editable
    ),
    design: template.jsonConfig.filter(field => 
      ['color', 'image', 'number'].includes(field.type) && field.editable
    ),
    advanced: template.jsonConfig.filter(field => !field.editable)
  };

  const renderField = (field: TemplateField) => {
    const value = templateData[field.id] || field.defaultValue;

    switch (field.type) {
      case 'text':
        return (
          <Input
            value={value}
            onChange={(e) => updateField(field.id, e.target.value)}
            placeholder={field.defaultValue}
            disabled={readOnly}
            className="text-sm"
          />
        );

      case 'textarea':
        return (
          <textarea
            value={value}
            onChange={(e) => updateField(field.id, e.target.value)}
            placeholder={field.defaultValue}
            disabled={readOnly}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            rows={3}
          />
        );

      case 'color':
        return (
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={normalizeColorForPicker(value, '#000000')}
              onChange={(e) => updateField(field.id, e.target.value)}
              disabled={readOnly}
              className="w-12 h-10 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer disabled:cursor-not-allowed"
            />
            <Input
              value={value}
              onChange={(e) => updateField(field.id, e.target.value)}
              placeholder="#000000"
              disabled={readOnly}
              className="flex-1 text-sm"
            />
          </div>
        );

      case 'image':
        return (
          <div className="space-y-2">
            <Input
              type="url"
              value={value}
              onChange={(e) => updateField(field.id, e.target.value)}
              placeholder="https://ejemplo.com/imagen.jpg"
              disabled={readOnly}
              className="text-sm"
            />
            {value && (
              <div className="w-full h-20 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
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
          <Input
            type="number"
            value={value}
            onChange={(e) => updateField(field.id, parseFloat(e.target.value) || 0)}
            placeholder={field.defaultValue}
            disabled={readOnly}
            className="text-sm"
          />
        );

      case 'select':
        return (
          <select
            value={value}
            onChange={(e) => updateField(field.id, e.target.value)}
            disabled={readOnly}
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

  const renderFieldSection = (sectionKey: keyof typeof groupedFields, fields: TemplateField[]) => {
    if (fields.length === 0) return null;

    const sectionIcons = {
      content: <Type className="w-4 h-4" />,
      design: <Palette className="w-4 h-4" />,
      advanced: <Settings className="w-4 h-4" />
    };

    const sectionTitles = {
      content: 'Contenido',
      design: 'Diseño',
      advanced: 'Avanzado'
    };

    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-gray-200 dark:border-gray-700">
          {sectionIcons[sectionKey]}
          <h4 className="font-semibold text-gray-800 dark:text-gray-200">
            {sectionTitles[sectionKey]}
          </h4>
          <span className="text-xs text-gray-500 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
            {fields.length}
          </span>
        </div>

        <div className="space-y-4">
          {fields.map(field => (
            <div key={field.id} className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                {field.label}
                {!field.editable && (
                  <span className="ml-2 text-xs text-gray-500">(Solo lectura)</span>
                )}
              </label>
              {renderField(field)}
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className={`template-editor ${className}`}>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
        {/* Panel de Edición */}
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                {template.name}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {template.description}
              </p>
            </div>
            
            {!readOnly && (
              <div className="flex items-center gap-2">
                <Button
                  onClick={handleCopyData}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 text-green-600" />
                      Copiado
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      Copiar Datos
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>

          {/* Navegación por Secciones */}
          <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
            {Object.keys(groupedFields).map((sectionKey) => {
              const fields = groupedFields[sectionKey as keyof typeof groupedFields];
              if (fields.length === 0) return null;
              
              const icons = {
                content: <Type className="w-4 h-4" />,
                design: <Palette className="w-4 h-4" />,
                advanced: <Settings className="w-4 h-4" />
              };

              const labels = {
                content: 'Contenido',
                design: 'Diseño', 
                advanced: 'Avanzado'
              };

              return (
                <button
                  key={sectionKey}
                  onClick={() => setActiveSection(sectionKey as any)}
                  className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-all ${
                    activeSection === sectionKey
                      ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                  }`}
                >
                  {icons[sectionKey as keyof typeof icons]}
                  <span>{labels[sectionKey as keyof typeof labels]}</span>
                  <span className="text-xs bg-gray-200 dark:bg-gray-600 px-1.5 py-0.5 rounded">
                    {fields.length}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Campos de Edición */}
          <div className="flex-1 overflow-y-auto space-y-6 max-h-96">
            {activeSection === 'content' && renderFieldSection('content', groupedFields.content)}
            {activeSection === 'design' && renderFieldSection('design', groupedFields.design)}
            {activeSection === 'advanced' && renderFieldSection('advanced', groupedFields.advanced)}
          </div>

          {/* Acciones */}
          {!readOnly && (
            <div className="flex items-center gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button
                onClick={() => handleSave(false)}
                disabled={isSaving}
                className={`flex items-center gap-2 ${
                  saveStatus === 'saved' 
                    ? 'bg-green-600 hover:bg-green-700' 
                    : saveStatus === 'error'
                      ? 'bg-red-600 hover:bg-red-700'
                      : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {getSaveButtonIcon()}
                {getSaveButtonText()}
              </Button>

              {onShare && (
                <Button
                  onClick={() => onShare(templateData)}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <Share2 className="w-4 h-4" />
                  Compartir
                </Button>
              )}

              {onExport && (
                <Button
                  onClick={() => onExport(templateData)}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Exportar
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Panel de Preview */}
        <div className="flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Eye className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              <h4 className="font-semibold text-gray-800 dark:text-gray-200">
                Vista Previa
              </h4>
            </div>
            
            <button
              onClick={() => setIsPreviewOpen(!isPreviewOpen)}
              className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
            >
              {isPreviewOpen ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {isPreviewOpen && (
            <div className="flex-1 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden bg-gray-50 dark:bg-gray-800">
              <TemplateRenderer
                template={template}
                editable={false}
                previewMode={true}
                initialData={templateData}
                className="h-full"
              />
            </div>
          )}
        </div>
      </div>

      {/* Auto-save indicator */}
      {saveStatus === 'saved' && (
        <div className="fixed bottom-4 right-4 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2">
          <Check className="w-4 h-4" />
          <span className="text-sm font-medium">Cambios guardados automáticamente</span>
        </div>
      )}
    </div>
  );
};

export default TemplateEditor;