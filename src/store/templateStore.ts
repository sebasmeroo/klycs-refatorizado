import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { 
  Template, 
  TemplatePack, 
  AppearIn,
  TemplateCategory,
  TemplateValidationResult 
} from '@/types/templatePack';
import { validateTemplatePack, generateTemplateId } from '@/utils/templateValidation';

interface TemplateFilters {
  search: string;
  category: TemplateCategory | 'all';
  status: 'all' | 'published' | 'draft';
  appearIn: AppearIn | 'all';
}

interface TemplateStore {
  // Estado
  templates: Template[];
  selectedTemplate: Template | null;
  loading: boolean;
  error: string | null;
  filters: TemplateFilters;
  
  // Acciones de datos
  loadTemplates: () => Promise<void>;
  saveTemplate: (template: TemplatePack) => Promise<Template>;
  updateTemplate: (id: string, updates: Partial<TemplatePack>) => Promise<Template>;
  deleteTemplate: (id: string) => Promise<void>;
  duplicateTemplate: (id: string) => Promise<Template>;
  
  // Acciones de estado
  setSelectedTemplate: (template: Template | null) => void;
  setFilters: (filters: Partial<TemplateFilters>) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  
  // Acciones específicas
  publishTemplate: (id: string) => Promise<Template>;
  unpublishTemplate: (id: string) => Promise<Template>;
  setTemplateAppearIn: (id: string, appearIn: AppearIn) => Promise<Template>;
  
  // Import/Export
  importFromPack: (pack: TemplatePack) => Promise<Template>;
  exportToPack: (id: string) => Promise<TemplatePack>;
  
  // Utilidades
  getFilteredTemplates: () => Template[];
  getTemplateById: (id: string) => Template | undefined;
  validateTemplate: (template: TemplatePack) => TemplateValidationResult;
}

// Función para crear una plantilla por defecto
const createDefaultTemplate = (): Omit<TemplatePack, 'meta'> => ({
  component: {
    id: 'default',
    props: {}
  },
  sections: {
    profile: {
      name: '',
      bio: '',
      avatar: '',
      tagline: '',
      phone: '',
      website: '',
      backgroundType: 'gradient',
      backgroundColor: '#667eea',
      backgroundGradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    },
    links: [],
    social: {
      instagram: '',
      twitter: '',
      linkedin: '',
      facebook: '',
      youtube: '',
      tiktok: '',
      website: ''
    },
    services: [],
    booking: {
      enabled: false,
      title: 'Reservar Cita',
      description: ''
    },
    portfolio: [],
    elements: [],
    design: {
      globalStyles: ''
    }
  },
  editable: {
    fields: [
      {
        path: 'sections.profile.name',
        type: 'string',
        label: 'Nombre del perfil',
        required: true
      },
      {
        path: 'sections.profile.bio',
        type: 'text',
        label: 'Biografía'
      }
    ],
    lockedSections: []
  },
  cssGlobal: '',
  appearIn: 'templates'
});

export const useTemplateStore = create<TemplateStore>()(
  persist(
    (set, get) => ({
      // Estado inicial
      templates: [],
      selectedTemplate: null,
      loading: false,
      error: null,
      filters: {
        search: '',
        category: 'all',
        status: 'all',
        appearIn: 'all'
      },

      // Acciones de datos
      loadTemplates: async () => {
        set({ loading: true, error: null });
        try {
          // Los templates ya están cargados desde el localStorage por persist
          set({ loading: false });
        } catch (error) {
          set({ 
            loading: false, 
            error: error instanceof Error ? error.message : 'Error loading templates' 
          });
        }
      },

      saveTemplate: async (templatePack: TemplatePack) => {
        set({ loading: true, error: null });
        try {
          const now = new Date().toISOString();
          const template: Template = {
            ...templatePack,
            id: templatePack.meta.id || generateTemplateId(),
            createdAt: now,
            updatedAt: now,
            isPublic: templatePack.isPublic || false,
            meta: {
              ...templatePack.meta,
              createdAt: now,
              updatedAt: now
            }
          };

          const templates = get().templates;
          const existingIndex = templates.findIndex(t => t.id === template.id);
          
          let updatedTemplates: Template[];
          if (existingIndex >= 0) {
            // Actualizar existente
            template.createdAt = templates[existingIndex].createdAt;
            updatedTemplates = templates.map(t => 
              t.id === template.id ? template : t
            );
          } else {
            // Crear nuevo
            updatedTemplates = [...templates, template];
          }

          set({ 
            templates: updatedTemplates,
            selectedTemplate: template,
            loading: false 
          });

          return template;
        } catch (error) {
          set({ 
            loading: false, 
            error: error instanceof Error ? error.message : 'Error saving template' 
          });
          throw error;
        }
      },

      updateTemplate: async (id: string, updates: Partial<TemplatePack>) => {
        const templates = get().templates;
        const existingTemplate = templates.find(t => t.id === id);
        
        if (!existingTemplate) {
          throw new Error('Template not found');
        }

        const updatedTemplate: Template = {
          ...existingTemplate,
          ...updates,
          id,
          updatedAt: new Date().toISOString(),
          meta: {
            ...existingTemplate.meta,
            ...updates.meta,
            updatedAt: new Date().toISOString()
          }
        };

        return get().saveTemplate(updatedTemplate);
      },

      deleteTemplate: async (id: string) => {
        set({ loading: true, error: null });
        try {
          const templates = get().templates;
          const updatedTemplates = templates.filter(t => t.id !== id);
          
          set({ 
            templates: updatedTemplates,
            selectedTemplate: get().selectedTemplate?.id === id ? null : get().selectedTemplate,
            loading: false 
          });
        } catch (error) {
          set({ 
            loading: false, 
            error: error instanceof Error ? error.message : 'Error deleting template' 
          });
          throw error;
        }
      },

      duplicateTemplate: async (id: string) => {
        const template = get().getTemplateById(id);
        if (!template) {
          throw new Error('Template not found');
        }

        const duplicatedPack: TemplatePack = {
          ...template,
          meta: {
            ...template.meta,
            id: undefined, // Se generará uno nuevo
            name: `${template.meta.name} (Copia)`
          },
          isPublic: false // Las copias empiezan como borradores
        };

        return get().saveTemplate(duplicatedPack);
      },

      // Acciones de estado
      setSelectedTemplate: (template) => set({ selectedTemplate: template }),
      
      setFilters: (newFilters) => set({ 
        filters: { ...get().filters, ...newFilters } 
      }),
      
      setLoading: (loading) => set({ loading }),
      
      setError: (error) => set({ error }),

      // Acciones específicas
      publishTemplate: async (id: string) => {
        return get().updateTemplate(id, { isPublic: true });
      },

      unpublishTemplate: async (id: string) => {
        return get().updateTemplate(id, { isPublic: false });
      },

      setTemplateAppearIn: async (id: string, appearIn: AppearIn) => {
        return get().updateTemplate(id, { appearIn });
      },

      // Import/Export
      importFromPack: async (pack: TemplatePack) => {
        const validation = get().validateTemplate(pack);
        if (!validation.isValid) {
          throw new Error(`Invalid template pack: ${validation.errors.map(e => e.message).join(', ')}`);
        }

        return get().saveTemplate({
          ...pack,
          meta: {
            ...pack.meta,
            id: undefined // Forzar generación de nuevo ID
          }
        });
      },

      exportToPack: async (id: string) => {
        const template = get().getTemplateById(id);
        if (!template) {
          throw new Error('Template not found');
        }

        // Remover campos específicos de Template que no van en TemplatePack
        const { id: templateId, createdAt, updatedAt, ...pack } = template;
        return pack as TemplatePack;
      },

      // Utilidades
      getFilteredTemplates: () => {
        const { templates, filters } = get();
        
        return templates.filter(template => {
          // Filtro de búsqueda
          if (filters.search) {
            const searchLower = filters.search.toLowerCase();
            const matchesName = template.meta.name.toLowerCase().includes(searchLower);
            const matchesDescription = template.meta.description?.toLowerCase().includes(searchLower);
            const matchesCategory = template.meta.category.toLowerCase().includes(searchLower);
            
            if (!matchesName && !matchesDescription && !matchesCategory) {
              return false;
            }
          }

          // Filtro de categoría
          if (filters.category !== 'all' && template.meta.category !== filters.category) {
            return false;
          }

          // Filtro de estado
          if (filters.status !== 'all') {
            const isPublished = template.isPublic;
            if (filters.status === 'published' && !isPublished) return false;
            if (filters.status === 'draft' && isPublished) return false;
          }

          // Filtro de appearIn
          if (filters.appearIn !== 'all' && template.appearIn !== filters.appearIn) {
            return false;
          }

          return true;
        });
      },

      getTemplateById: (id: string) => {
        return get().templates.find(t => t.id === id);
      },

      validateTemplate: (template: TemplatePack) => {
        return validateTemplatePack(template);
      }
    }),
    {
      name: 'klycs_admin_templates',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ 
        templates: state.templates 
      }),
    }
  )
);
