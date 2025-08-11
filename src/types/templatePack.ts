export type TemplateCategory = 'minimal' | 'modern' | 'creative' | 'luxury' | 'business';
export type AppearIn = 'templates' | 'design-presets' | 'both';
export type FieldType = 'string' | 'text' | 'number' | 'color' | 'image' | 'url' | 'boolean' | 'select';

export interface EditableFieldRule {
  path: string;
  type: FieldType;
  label?: string;
  min?: number;
  max?: number;
  options?: string[];
  required?: boolean;
  placeholder?: string;
}

export interface TemplatePackMeta {
  id?: string;
  name: string;
  description?: string;
  category: TemplateCategory;
  coverImage?: string;
  version: string;
  author?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface TemplateComponent {
  id: string;
  props: Record<string, any>;
}

export interface TemplatePackSections {
  profile: Record<string, any>;
  links: any[];
  social: Record<string, any>;
  services: any[];
  booking: Record<string, any>;
  portfolio: any[];
  elements: any[];
  design: {
    globalStyles?: string;
    [key: string]: any;
  };
}

export interface TemplatePackEditable {
  fields: EditableFieldRule[];
  lockedSections: Array<keyof TemplatePackSections>;
}

export interface TemplatePack {
  meta: TemplatePackMeta;
  component: TemplateComponent;
  sections: TemplatePackSections;
  editable: TemplatePackEditable;
  cssGlobal?: string;
  appearIn: AppearIn;
  isPublic?: boolean;
}

export interface Template extends TemplatePack {
  id: string;
  createdAt: string;
  updatedAt: string;
  isPublic: boolean;
}

// Registro de componentes React
export interface RegisteredTemplateComponent {
  id: string;
  name: string;
  description?: string;
  component: React.ComponentType<{
    card: any;
    props?: Record<string, any>;
  }>;
  defaultProps?: Record<string, any>;
  editableFields?: EditableFieldRule[];
}

export type RegisteredTemplateComponents = Record<string, RegisteredTemplateComponent>;

// Utilidades de path
export interface PathValue {
  value: any;
  exists: boolean;
}

export interface ValidationError {
  path: string;
  message: string;
  type: 'required' | 'type' | 'format' | 'range';
}

export interface TemplateValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}