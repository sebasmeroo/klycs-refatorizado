import type { 
  TemplatePack, 
  TemplateValidationResult, 
  ValidationError,
  EditableFieldRule 
} from '@/types/templatePack';
import { getValueByPath } from './pathUtils';

/**
 * Genera un ID único para una plantilla
 */
export function generateTemplateId(): string {
  return `template_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Valida un TemplatePack completo
 */
export function validateTemplatePack(pack: TemplatePack): TemplateValidationResult {
  const errors: ValidationError[] = [];

  // Validar meta
  if (!pack.meta) {
    errors.push({
      path: 'meta',
      message: 'Meta information is required',
      type: 'required'
    });
  } else {
    if (!pack.meta.name || pack.meta.name.trim() === '') {
      errors.push({
        path: 'meta.name',
        message: 'Template name is required',
        type: 'required'
      });
    }

    if (!pack.meta.category) {
      errors.push({
        path: 'meta.category',
        message: 'Template category is required',
        type: 'required'
      });
    }

    if (!pack.meta.version) {
      errors.push({
        path: 'meta.version',
        message: 'Template version is required',
        type: 'required'
      });
    }
  }

  // Validar component
  if (!pack.component) {
    errors.push({
      path: 'component',
      message: 'Component configuration is required',
      type: 'required'
    });
  } else {
    if (!pack.component.id) {
      errors.push({
        path: 'component.id',
        message: 'Component ID is required',
        type: 'required'
      });
    }

    if (!pack.component.props || typeof pack.component.props !== 'object') {
      errors.push({
        path: 'component.props',
        message: 'Component props must be an object',
        type: 'type'
      });
    }
  }

  // Validar sections
  if (!pack.sections) {
    errors.push({
      path: 'sections',
      message: 'Sections are required',
      type: 'required'
    });
  } else {
    const requiredSections = ['profile', 'links', 'social', 'services', 'portfolio', 'booking', 'elements', 'design'];
    requiredSections.forEach(section => {
      if (!(section in pack.sections)) {
        errors.push({
          path: `sections.${section}`,
          message: `Section '${section}' is required`,
          type: 'required'
        });
      }
    });
  }

  // Validar editable
  if (!pack.editable) {
    errors.push({
      path: 'editable',
      message: 'Editable configuration is required',
      type: 'required'
    });
  } else {
    if (!Array.isArray(pack.editable.fields)) {
      errors.push({
        path: 'editable.fields',
        message: 'Editable fields must be an array',
        type: 'type'
      });
    } else {
      pack.editable.fields.forEach((field, index) => {
        const fieldErrors = validateEditableFieldRule(field, pack);
        fieldErrors.forEach(error => {
          errors.push({
            ...error,
            path: `editable.fields[${index}].${error.path}`
          });
        });
      });
    }

    if (!Array.isArray(pack.editable.lockedSections)) {
      errors.push({
        path: 'editable.lockedSections',
        message: 'Locked sections must be an array',
        type: 'type'
      });
    }
  }

  // Validar appearIn
  if (!pack.appearIn) {
    errors.push({
      path: 'appearIn',
      message: 'AppearIn is required',
      type: 'required'
    });
  } else {
    const validAppearIn = ['templates', 'design-presets', 'both'];
    if (!validAppearIn.includes(pack.appearIn)) {
      errors.push({
        path: 'appearIn',
        message: `AppearIn must be one of: ${validAppearIn.join(', ')}`,
        type: 'format'
      });
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Valida una regla de campo editable
 */
export function validateEditableFieldRule(rule: EditableFieldRule, pack: TemplatePack): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!rule.path) {
    errors.push({
      path: 'path',
      message: 'Field path is required',
      type: 'required'
    });
  } else {
    // Verificar que el path existe en el pack
    const pathValue = getValueByPath(pack, rule.path);
    if (!pathValue.exists) {
      errors.push({
        path: 'path',
        message: `Path '${rule.path}' does not exist in template`,
        type: 'format'
      });
    }
  }

  if (!rule.type) {
    errors.push({
      path: 'type',
      message: 'Field type is required',
      type: 'required'
    });
  } else {
    const validTypes = ['string', 'text', 'number', 'color', 'image', 'url', 'boolean', 'select'];
    if (!validTypes.includes(rule.type)) {
      errors.push({
        path: 'type',
        message: `Field type must be one of: ${validTypes.join(', ')}`,
        type: 'format'
      });
    }
  }

  if (rule.type === 'select' && (!rule.options || !Array.isArray(rule.options) || rule.options.length === 0)) {
    errors.push({
      path: 'options',
      message: 'Select fields must have options array with at least one option',
      type: 'required'
    });
  }

  if (rule.type === 'number') {
    if (rule.min !== undefined && rule.max !== undefined && rule.min > rule.max) {
      errors.push({
        path: 'min',
        message: 'Minimum value cannot be greater than maximum value',
        type: 'range'
      });
    }
  }

  return errors;
}

/**
 * Valida que un valor cumpla con una regla de campo
 */
export function validateFieldValue(value: any, rule: EditableFieldRule): ValidationError[] {
  const errors: ValidationError[] = [];

  // Verificar si es requerido
  if (rule.required && (value === undefined || value === null || value === '')) {
    errors.push({
      path: rule.path,
      message: `${rule.label || rule.path} is required`,
      type: 'required'
    });
    return errors; // Si es requerido y está vacío, no validar más
  }

  // Si está vacío y no es requerido, no validar más
  if (value === undefined || value === null || value === '') {
    return errors;
  }

  // Validaciones por tipo
  switch (rule.type) {
    case 'string':
    case 'text':
      if (typeof value !== 'string') {
        errors.push({
          path: rule.path,
          message: `${rule.label || rule.path} must be a string`,
          type: 'type'
        });
      } else {
        if (rule.min !== undefined && value.length < rule.min) {
          errors.push({
            path: rule.path,
            message: `${rule.label || rule.path} must be at least ${rule.min} characters`,
            type: 'range'
          });
        }
        if (rule.max !== undefined && value.length > rule.max) {
          errors.push({
            path: rule.path,
            message: `${rule.label || rule.path} must be no more than ${rule.max} characters`,
            type: 'range'
          });
        }
      }
      break;

    case 'number':
      if (typeof value !== 'number' || isNaN(value)) {
        errors.push({
          path: rule.path,
          message: `${rule.label || rule.path} must be a valid number`,
          type: 'type'
        });
      } else {
        if (rule.min !== undefined && value < rule.min) {
          errors.push({
            path: rule.path,
            message: `${rule.label || rule.path} must be at least ${rule.min}`,
            type: 'range'
          });
        }
        if (rule.max !== undefined && value > rule.max) {
          errors.push({
            path: rule.path,
            message: `${rule.label || rule.path} must be no more than ${rule.max}`,
            type: 'range'
          });
        }
      }
      break;

    case 'color':
      if (typeof value !== 'string') {
        errors.push({
          path: rule.path,
          message: `${rule.label || rule.path} must be a string`,
          type: 'type'
        });
      } else {
        const colorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
        if (!colorRegex.test(value)) {
          errors.push({
            path: rule.path,
            message: `${rule.label || rule.path} must be a valid hex color (e.g., #FF0000)`,
            type: 'format'
          });
        }
      }
      break;

    case 'url':
      if (typeof value !== 'string') {
        errors.push({
          path: rule.path,
          message: `${rule.label || rule.path} must be a string`,
          type: 'type'
        });
      } else {
        try {
          new URL(value);
        } catch {
          errors.push({
            path: rule.path,
            message: `${rule.label || rule.path} must be a valid URL`,
            type: 'format'
          });
        }
      }
      break;

    case 'boolean':
      if (typeof value !== 'boolean') {
        errors.push({
          path: rule.path,
          message: `${rule.label || rule.path} must be true or false`,
          type: 'type'
        });
      }
      break;

    case 'select':
      if (rule.options && !rule.options.includes(value)) {
        errors.push({
          path: rule.path,
          message: `${rule.label || rule.path} must be one of: ${rule.options.join(', ')}`,
          type: 'format'
        });
      }
      break;

    case 'image':
      // Para imágenes, aceptamos URLs o data URLs
      if (typeof value !== 'string') {
        errors.push({
          path: rule.path,
          message: `${rule.label || rule.path} must be a string`,
          type: 'type'
        });
      } else {
        const isDataUrl = value.startsWith('data:image/');
        const isHttpUrl = value.startsWith('http://') || value.startsWith('https://');
        
        if (!isDataUrl && !isHttpUrl) {
          errors.push({
            path: rule.path,
            message: `${rule.label || rule.path} must be a valid image URL or data URL`,
            type: 'format'
          });
        }
      }
      break;
  }

  return errors;
}
