import React, { useState } from 'react';
import { Plus, Trash2, Edit3, Save, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import type { EditableFieldRule, FieldType, TemplatePack } from '@/types/templatePack';
import { getValueByPath, setValueByPath, pathToLabel } from '@/utils/pathUtils';
import { validateFieldValue } from '@/utils/templateValidation';

interface TemplateFieldsEditorProps {
  fields: EditableFieldRule[];
  onChange: (fields: EditableFieldRule[]) => void;
  templateData?: TemplatePack;
  className?: string;
}

const fieldTypeOptions: { value: FieldType; label: string }[] = [
  { value: 'string', label: 'Texto' },
  { value: 'text', label: 'Texto largo' },
  { value: 'number', label: 'Número' },
  { value: 'color', label: 'Color' },
  { value: 'image', label: 'Imagen' },
  { value: 'url', label: 'URL' },
  { value: 'boolean', label: 'Verdadero/Falso' },
  { value: 'select', label: 'Selección' }
];

export const TemplateFieldsEditor: React.FC<TemplateFieldsEditorProps> = ({
  fields,
  onChange,
  templateData,
  className = ''
}) => {
  const [editingField, setEditingField] = useState<string | null>(null);
  const [newField, setNewField] = useState<Partial<EditableFieldRule>>({
    path: '',
    type: 'string',
    label: '',
    required: false
  });

  const addField = () => {
    if (!newField.path || !newField.type) return;

    const field: EditableFieldRule = {
      path: newField.path,
      type: newField.type,
      label: newField.label || pathToLabel(newField.path),
      required: newField.required || false,
      min: newField.min,
      max: newField.max,
      options: newField.options,
      placeholder: newField.placeholder
    };

    onChange([...fields, field]);
    setNewField({
      path: '',
      type: 'string',
      label: '',
      required: false
    });
  };

  const updateField = (index: number, updates: Partial<EditableFieldRule>) => {
    const updatedFields = fields.map((field, i) => 
      i === index ? { ...field, ...updates } : field
    );
    onChange(updatedFields);
  };

  const removeField = (index: number) => {
    onChange(fields.filter((_, i) => i !== index));
  };

  const validateFieldPath = (path: string): { valid: boolean; message?: string } => {
    if (!path) return { valid: false, message: 'Path is required' };
    
    if (!templateData) return { valid: true };

    const pathValue = getValueByPath(templateData, path);
    if (!pathValue.exists) {
      return { valid: false, message: 'Path does not exist in template' };
    }

    return { valid: true };
  };

  const renderFieldEditor = (field: EditableFieldRule, index: number) => {
    const isEditing = editingField === `${index}`;
    const pathValidation = validateFieldPath(field.path);

    if (!isEditing) {
      return (
        <div key={index} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h4 className="font-medium text-gray-900 dark:text-white">
                  {field.label || pathToLabel(field.path)}
                </h4>
                <span className="px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded">
                  {field.type}
                </span>
                {field.required && (
                  <span className="px-2 py-1 text-xs bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 rounded">
                    Required
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                Path: <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded">{field.path}</code>
              </p>
              {!pathValidation.valid && (
                <p className="text-sm text-red-600 dark:text-red-400">
                  ⚠️ {pathValidation.message}
                </p>
              )}
              {field.placeholder && (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Placeholder: {field.placeholder}
                </p>
              )}
              {field.type === 'select' && field.options && (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Options: {field.options.join(', ')}
                </p>
              )}
              {(field.min !== undefined || field.max !== undefined) && (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Range: {field.min ?? '∞'} - {field.max ?? '∞'}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditingField(`${index}`)}
              >
                <Edit3 className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => removeField(index)}
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div key={index} className="bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700 p-4">
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Path *
              </label>
              <Input
                value={field.path}
                onChange={(e) => updateField(index, { path: e.target.value })}
                placeholder="component.props.primaryColor"
                className={!pathValidation.valid ? 'border-red-300' : ''}
              />
              {!pathValidation.valid && (
                <p className="text-sm text-red-600 mt-1">{pathValidation.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Type *
              </label>
              <select
                value={field.type}
                onChange={(e) => updateField(index, { type: e.target.value as FieldType })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                {fieldTypeOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Label
              </label>
              <Input
                value={field.label || ''}
                onChange={(e) => updateField(index, { label: e.target.value })}
                placeholder={pathToLabel(field.path)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Placeholder
              </label>
              <Input
                value={field.placeholder || ''}
                onChange={(e) => updateField(index, { placeholder: e.target.value })}
                placeholder="Enter value..."
              />
            </div>
          </div>

          {(field.type === 'string' || field.type === 'text' || field.type === 'number') && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Min {field.type === 'number' ? 'Value' : 'Length'}
                </label>
                <Input
                  type="number"
                  value={field.min || ''}
                  onChange={(e) => updateField(index, { min: e.target.value ? Number(e.target.value) : undefined })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Max {field.type === 'number' ? 'Value' : 'Length'}
                </label>
                <Input
                  type="number"
                  value={field.max || ''}
                  onChange={(e) => updateField(index, { max: e.target.value ? Number(e.target.value) : undefined })}
                />
              </div>
            </div>
          )}

          {field.type === 'select' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Options (comma separated)
              </label>
              <Input
                value={field.options?.join(', ') || ''}
                onChange={(e) => updateField(index, { 
                  options: e.target.value.split(',').map(s => s.trim()).filter(Boolean) 
                })}
                placeholder="option1, option2, option3"
              />
            </div>
          )}

          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={field.required || false}
                onChange={(e) => updateField(index, { required: e.target.checked })}
                className="rounded border-gray-300"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">Required</span>
            </label>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <Button
              size="sm"
              onClick={() => setEditingField(null)}
            >
              <Save className="w-4 h-4 mr-2" />
              Save
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEditingField(null)}
            >
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Editable Fields
        </h3>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {fields.length} field{fields.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Lista de campos existentes */}
      <div className="space-y-3">
        {fields.map((field, index) => renderFieldEditor(field, index))}
      </div>

      {/* Formulario para nuevo campo */}
      <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <h4 className="font-medium text-gray-900 dark:text-white mb-4">Add New Field</h4>
        
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Path *
              </label>
              <Input
                value={newField.path || ''}
                onChange={(e) => setNewField({ ...newField, path: e.target.value })}
                placeholder="component.props.primaryColor"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Type *
              </label>
              <select
                value={newField.type || 'string'}
                onChange={(e) => setNewField({ ...newField, type: e.target.value as FieldType })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                {fieldTypeOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Label
            </label>
            <Input
              value={newField.label || ''}
              onChange={(e) => setNewField({ ...newField, label: e.target.value })}
              placeholder={newField.path ? pathToLabel(newField.path) : 'Field label'}
            />
          </div>

          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={newField.required || false}
                onChange={(e) => setNewField({ ...newField, required: e.target.checked })}
                className="rounded border-gray-300"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">Required</span>
            </label>
          </div>

          <Button
            onClick={addField}
            disabled={!newField.path || !newField.type}
            className="w-full"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Field
          </Button>
        </div>
      </div>
    </div>
  );
};
