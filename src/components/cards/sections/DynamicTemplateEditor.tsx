import React, { useState, useEffect } from 'react';
import { 
  Wand2, 
  Eye, 
  EyeOff, 
  Settings, 
  Save, 
  RotateCcw,
  AlertCircle,
  CheckCircle,
  Loader2,
  Edit3,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { normalizeColorForPicker } from '@/utils/colors';
import { Card } from '@/types';
import { userTemplatesService, UserTemplate, UserTemplateInstance } from '@/services/userTemplates';
import TemplateRenderer from '@/components/templates/TemplateRenderer';

interface DynamicTemplateEditorProps {
  card: Card;
  section: 'profile' | 'links' | 'social' | 'services' | 'booking' | 'portfolio' | 'elements' | 'design';
  onUpdate: (updates: Partial<Card>) => void;
}

export const DynamicTemplateEditor: React.FC<DynamicTemplateEditorProps> = ({
  card,
  section,
  onUpdate
}) => {
  const [activeTemplate, setActiveTemplate] = useState<{
    template: UserTemplate;
    instance: UserTemplateInstance;
  } | null>(null);
  const [templateData, setTemplateData] = useState<any>({});
  const [isEditing, setIsEditing] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadActiveTemplate();
  }, [card.id, section]);

  const loadActiveTemplate = async () => {
    if (!card.id) {
      setLoading(false);
      return;
    }

    try {
      const result = await userTemplatesService.getActiveTemplateForCard(card.id);
      
      if (result && result.template.targetSection === section) {
        setActiveTemplate(result);
        setTemplateData(result.instance.data || {});
      } else {
        setActiveTemplate(null);
        setTemplateData({});
      }
    } catch (err) {
      console.error('Error loading active template:', err);
      setError('Error cargando plantilla activa');
    } finally {
      setLoading(false);
    }
  };

  const handleFieldChange = (fieldId: string, value: any) => {
    setTemplateData(prev => ({
      ...prev,
      [fieldId]: value
    }));
    setHasChanges(true);
  };

  const handleSaveChanges = async () => {
    if (!activeTemplate || !hasChanges) return;

    setIsSaving(true);
    try {
      const success = await userTemplatesService.updateTemplateInstance(
        activeTemplate.instance.id,
        templateData
      );

      if (success) {
        setHasChanges(false);
        // Actualizar la tarjeta para refrescar el preview
        onUpdate({
          templateData: {
            ...card.templateData,
            data: templateData
          }
        });
      } else {
        throw new Error('No se pudo guardar los cambios');
      }
    } catch (err) {
      console.error('Error saving template data:', err);
      setError('Error guardando cambios');
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetToDefaults = () => {
    if (!activeTemplate) return;

    const defaultData: any = {};
    activeTemplate.template.jsonConfig.forEach(field => {
      defaultData[field.id] = field.defaultValue;
    });

    setTemplateData(defaultData);
    setHasChanges(true);
  };

  const handleRemoveTemplate = async () => {
    if (!activeTemplate || !card.id) return;

    const confirm = window.confirm('¿Estás seguro de que quieres remover esta plantilla? Esta acción no se puede deshacer.');
    if (!confirm) return;

    try {
      const success = await userTemplatesService.removeTemplateFromCard(card.id);
      if (success) {
        setActiveTemplate(null);
        setTemplateData({});
        setHasChanges(false);
        onUpdate({}); // Trigger re-render
      }
    } catch (err) {
      console.error('Error removing template:', err);
      setError('Error removiendo plantilla');
    }
  };

  const renderFieldEditor = (field: any) => {
    const value = templateData[field.id] || field.defaultValue;

    switch (field.type) {
      case 'text':
        return (
          <Input
            value={value}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            placeholder={field.defaultValue}
            className="text-sm"
          />
        );

      case 'textarea':
        return (
          <textarea
            value={value}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            placeholder={field.defaultValue}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={3}
          />
        );

      case 'color':
        return (
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={normalizeColorForPicker(value, '#000000')}
              onChange={(e) => handleFieldChange(field.id, e.target.value)}
              className="w-12 h-10 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer"
            />
            <Input
              value={value}
              onChange={(e) => handleFieldChange(field.id, e.target.value)}
              placeholder="#000000"
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
              onChange={(e) => handleFieldChange(field.id, e.target.value)}
              placeholder="https://ejemplo.com/imagen.jpg"
              className="text-sm"
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
          <Input
            type="number"
            value={value}
            onChange={(e) => handleFieldChange(field.id, parseFloat(e.target.value) || 0)}
            placeholder={field.defaultValue}
            className="text-sm"
          />
        );

      case 'select':
        return (
          <select
            value={value}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {field.options?.map((option: string) => (
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

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600 dark:text-gray-400">Cargando plantilla...</span>
      </div>
    );
  }

  if (!activeTemplate) {
    return null; // No hay plantilla aplicada en esta sección
  }

  const { template } = activeTemplate;
  const editableFields = template.jsonConfig.filter(field => field.editable);

  return (
    <div className="dynamic-template-editor bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl p-6 border border-purple-200 dark:border-purple-700">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
            <Wand2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white text-lg">
              Plantilla: {template.name}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              v{template.version} • {template.author}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowPreview(!showPreview)}
            className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
            title="Vista previa"
          >
            {showPreview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>

          <button
            onClick={() => setIsEditing(!isEditing)}
            className={`p-2 rounded-lg transition-colors ${
              isEditing 
                ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' 
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
            }`}
            title="Editar plantilla"
          >
            <Edit3 className="w-4 h-4" />
          </button>

          <button
            onClick={handleRemoveTemplate}
            className="p-2 text-red-600 hover:text-red-700 transition-colors"
            title="Remover plantilla"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg mb-4">
          <AlertCircle className="w-4 h-4 text-red-600" />
          <span className="text-sm text-red-700 dark:text-red-300">{error}</span>
          <button 
            onClick={() => setError(null)}
            className="ml-auto text-red-600 hover:text-red-700"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Template Fields Editor */}
      {isEditing && (
        <div className="space-y-6 mb-6">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-gray-800 dark:text-gray-200">
              Personalizar Contenido ({editableFields.length} campos)
            </h4>
            
            <div className="flex items-center gap-2">
              <Button
                onClick={handleResetToDefaults}
                variant="outline"
                size="sm"
                className="text-xs"
              >
                <RotateCcw className="w-3 h-3 mr-1" />
                Restaurar
              </Button>

              <Button
                onClick={handleSaveChanges}
                disabled={!hasChanges || isSaving}
                size="sm"
                className={`text-xs ${
                  hasChanges 
                    ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                {isSaving ? (
                  <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                ) : (
                  <Save className="w-3 h-3 mr-1" />
                )}
                {isSaving ? 'Guardando...' : 'Guardar'}
              </Button>
            </div>
          </div>

          {editableFields.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {editableFields.map(field => (
                <div key={field.id} className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    {field.label}
                  </label>
                  {renderFieldEditor(field)}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center p-4 text-gray-500 dark:text-gray-400">
              <Settings className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Esta plantilla no tiene campos editables</p>
            </div>
          )}

          {hasChanges && (
            <div className="flex items-center gap-2 text-sm text-orange-600 dark:text-orange-400">
              <AlertCircle className="w-4 h-4" />
              <span>Tienes cambios sin guardar</span>
            </div>
          )}
        </div>
      )}

      {/* Preview */}
      {showPreview && (
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden bg-white dark:bg-gray-800">
          <div className="p-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Vista Previa</span>
            </div>
          </div>
          
          <div className="p-4">
            <TemplateRenderer
              template={template}
              editable={false}
              previewMode={true}
              initialData={templateData}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default DynamicTemplateEditor;