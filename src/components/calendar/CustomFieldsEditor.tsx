import React, { useState, useCallback, useRef, useEffect } from 'react';
import { CustomEventField } from '@/types/calendar';
import {
  Plus,
  Trash2,
  GripVertical,
  Eye,
  EyeOff,
  Type,
  AlignLeft,
  Link as LinkIcon,
  Mail,
  Phone,
  Hash,
  List,
  Calendar as CalendarIcon,
  ChevronDown,
  ChevronUp,
  Save
} from 'lucide-react';
import { toast } from '@/utils/toast';

interface CustomFieldsEditorProps {
  fields: CustomEventField[];
  onUpdate: (fields: CustomEventField[]) => void;
}

const FIELD_TYPES = [
  { value: 'text', label: 'Texto corto', icon: Type },
  { value: 'textarea', label: 'Texto largo', icon: AlignLeft },
  { value: 'url', label: 'Enlace/URL', icon: LinkIcon },
  { value: 'email', label: 'Email', icon: Mail },
  { value: 'phone', label: 'Teléfono', icon: Phone },
  { value: 'number', label: 'Número', icon: Hash },
  { value: 'select', label: 'Selección', icon: List },
  { value: 'date', label: 'Fecha', icon: CalendarIcon },
] as const;

export const CustomFieldsEditor: React.FC<CustomFieldsEditorProps> = ({
  fields,
  onUpdate
}) => {
  const [expandedField, setExpandedField] = useState<string | null>(null);
  const [draggedField, setDraggedField] = useState<string | null>(null);
  const [localFields, setLocalFields] = useState<CustomEventField[]>(fields);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Sincronizar localFields cuando fields cambie desde fuera (pero NO durante el debounce)
  useEffect(() => {
    if (!debounceTimerRef.current) {
      setLocalFields(fields);
    }
  }, [fields]);

  // Debounced update - solo actualiza el padre después de 800ms sin cambios
  const debouncedUpdate = useCallback((newFields: CustomEventField[]) => {
    // Limpiar timer anterior
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Actualizar estado local inmediatamente (para UI responsiva)
    setLocalFields(newFields);

    // Actualizar el padre después de 800ms
    debounceTimerRef.current = setTimeout(() => {
      onUpdate(newFields);
      debounceTimerRef.current = null;
    }, 800);
  }, [onUpdate]);

  const addField = () => {
    const newField: CustomEventField = {
      id: `field_${Date.now()}`,
      label: 'Nuevo campo',
      type: 'text',
      placeholder: '',
      required: false,
      order: localFields.length,
      isVisible: true
    };
    const newFields = [...localFields, newField];
    // Agregar campo es una acción inmediata (no debounced)
    setLocalFields(newFields);
    onUpdate(newFields);
    setExpandedField(newField.id);
    toast.success('Campo agregado');
  };

  const updateField = (id: string, updates: Partial<CustomEventField>) => {
    const newFields = localFields.map(f => f.id === id ? { ...f, ...updates } : f);
    debouncedUpdate(newFields);
  };

  const deleteField = (id: string) => {
    const newFields = localFields.filter(f => f.id !== id);
    // Eliminar campo es una acción inmediata (no debounced)
    setLocalFields(newFields);
    onUpdate(newFields);
    toast.success('Campo eliminado');
  };

  const toggleVisibility = (id: string) => {
    const field = localFields.find(f => f.id === id);
    if (field) {
      const newFields = localFields.map(f => 
        f.id === id ? { ...f, isVisible: !f.isVisible } : f
      );
      // Toggle es una acción inmediata (no debounced)
      setLocalFields(newFields);
      onUpdate(newFields);
    }
  };

  const handleDragStart = (id: string) => {
    setDraggedField(id);
  };

  const handleDragOver = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!draggedField || draggedField === targetId) return;

    const draggedIndex = localFields.findIndex(f => f.id === draggedField);
    const targetIndex = localFields.findIndex(f => f.id === targetId);

    const newFields = [...localFields];
    const [removed] = newFields.splice(draggedIndex, 1);
    newFields.splice(targetIndex, 0, removed);

    const reordered = newFields.map((field, index) => ({
      ...field,
      order: index
    }));

    // Drag es una acción inmediata (no debounced)
    setLocalFields(reordered);
    onUpdate(reordered);
  };

  const handleDragEnd = () => {
    setDraggedField(null);
  };

  const getTypeIcon = (type: string) => {
    const fieldType = FIELD_TYPES.find(ft => ft.value === type);
    return fieldType?.icon || Type;
  };

  return (
    <div className="space-y-4 text-gray-900">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-gray-200">
        <div>
          <h3 className="text-xl font-semibold text-gray-900">Campos Personalizados</h3>
          <p className="text-sm text-gray-600 mt-1">
            Personaliza el formulario de creación de eventos
          </p>
        </div>
        <button
          onClick={addField}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white rounded-lg transition-all"
        >
          <Plus className="w-4 h-4" />
          Agregar Campo
        </button>
      </div>

      {/* Fields List */}
      {localFields.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-xl border border-gray-200 border-dashed">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-200 rounded-full flex items-center justify-center">
            <Type className="w-8 h-8 text-gray-500" />
          </div>
          <p className="text-gray-600 mb-2">No hay campos personalizados</p>
          <p className="text-sm text-gray-500">
            Agrega campos para personalizar el formulario de eventos
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {localFields
            .sort((a, b) => a.order - b.order)
            .map((field) => {
              const Icon = getTypeIcon(field.type);
              const isExpanded = expandedField === field.id;

              return (
                  <div
                    key={field.id}
                    draggable
                    onDragStart={() => handleDragStart(field.id)}
                    onDragOver={(e) => handleDragOver(e, field.id)}
                    onDragEnd={handleDragEnd}
                    className={`bg-white border rounded-xl transition-all ${
                      draggedField === field.id
                        ? 'border-purple-400 shadow-lg scale-105'
                        : 'border-gray-200'
                    } ${!field.isVisible ? 'opacity-60' : ''}`}
                  >
                  {/* Field Header */}
                  <div className="flex items-center gap-3 p-4">
                    <GripVertical className="w-5 h-5 text-gray-400 cursor-move" />
                    
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <div className="p-2 bg-purple-50 rounded-lg">
                        <Icon className="w-4 h-4 text-purple-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {field.label}
                        </p>
                        <p className="text-xs text-gray-500">
                          {FIELD_TYPES.find(ft => ft.value === field.type)?.label}
                          {field.required && ' • Obligatorio'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => toggleVisibility(field.id)}
                        className={`p-2 rounded-lg transition-colors ${
                          field.isVisible
                            ? 'bg-green-50 text-green-600 hover:bg-green-100'
                            : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                        }`}
                        title={field.isVisible ? 'Ocultar campo' : 'Mostrar campo'}
                      >
                        {field.isVisible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                      </button>

                      <button
                        onClick={() => setExpandedField(isExpanded ? null : field.id)}
                        className="p-2 bg-gray-100 hover:bg-gray-200 text-gray-500 rounded-lg transition-colors"
                      >
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </button>

                      <button
                        onClick={() => deleteField(field.id)}
                        className="p-2 bg-red-50 hover:bg-red-100 text-red-500 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Field Editor (Expanded) */}
                  {isExpanded && (
                    <div className="px-4 pb-4 space-y-3 border-t border-gray-200 pt-4">
                      {/* Label */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Etiqueta del campo
                        </label>
                        <input
                          type="text"
                          value={field.label}
                          onChange={(e) => updateField(field.id, { label: e.target.value })}
                          className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder:text-gray-400 focus:border-purple-500 focus:outline-none"
                          placeholder="ej: Código Postal"
                        />
                      </div>

                      {/* Type */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Tipo de campo
                        </label>
                        <select
                          value={field.type}
                          onChange={(e) => updateField(field.id, { type: e.target.value as any })}
                          className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:border-purple-500 focus:outline-none"
                        >
                          {FIELD_TYPES.map(ft => (
                            <option key={ft.value} value={ft.value}>{ft.label}</option>
                          ))}
                        </select>
                      </div>

                      {/* Placeholder */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Placeholder (texto de ayuda)
                        </label>
                        <input
                          type="text"
                          value={field.placeholder || ''}
                          onChange={(e) => updateField(field.id, { placeholder: e.target.value })}
                          className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder:text-gray-400 focus:border-purple-500 focus:outline-none"
                          placeholder="ej: Ingresa tu código postal"
                        />
                      </div>

                      {/* Options (only for select type) */}
                      {field.type === 'select' && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Opciones (una por línea)
                          </label>
                          <textarea
                            value={field.options?.join('\n') || ''}
                            onChange={(e) => updateField(field.id, { 
                              options: e.target.value.split('\n').filter(o => o.trim()) 
                            })}
                            className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder:text-gray-400 focus:border-purple-500 focus:outline-none resize-none"
                            rows={4}
                            placeholder="Opción 1&#10;Opción 2&#10;Opción 3"
                          />
                        </div>
                      )}

                      {/* Required */}
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id={`required-${field.id}`}
                          checked={field.required}
                          onChange={(e) => updateField(field.id, { required: e.target.checked })}
                          className="w-4 h-4 rounded border-gray-300 bg-white text-purple-600 focus:ring-purple-500 focus:ring-offset-0"
                        />
                        <label htmlFor={`required-${field.id}`} className="text-sm text-gray-700 cursor-pointer">
                          Campo obligatorio
                        </label>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
        </div>
      )}

      {/* Info Box */}
      {localFields.length > 0 && (
        <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="w-5 h-5 text-blue-500 mt-0.5">ℹ️</div>
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">Campos personalizados</p>
            <ul className="list-disc list-inside space-y-1 text-blue-700 text-xs">
              <li>Arrastra para reordenar los campos</li>
              <li>Los campos ocultos no aparecerán en el formulario</li>
              <li>Los campos obligatorios deben completarse para crear un evento</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomFieldsEditor;
