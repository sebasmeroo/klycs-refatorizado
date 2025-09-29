import type { TemplatePack, Template } from '@/types/templatePack';
import { validateTemplatePack } from '@/utils/templateValidation';

export interface ImportResult {
  success: boolean;
  template?: Template;
  errors: string[];
}

export interface ExportOptions {
  pretty?: boolean;
  includeMetadata?: boolean;
}

/**
 * Servicio para import/export de plantillas
 */
export class TemplateIOService {
  /**
   * Importa una plantilla desde un archivo JSON
   */
  static async importFromFile(file: File): Promise<ImportResult> {
    try {
      const text = await file.text();
      return this.importFromJSON(text);
    } catch (error) {
      return {
        success: false,
        errors: [`Error reading file: ${error instanceof Error ? error.message : 'Unknown error'}`]
      };
    }
  }

  /**
   * Importa una plantilla desde un string JSON
   */
  static importFromJSON(jsonString: string): ImportResult {
    try {
      const data = JSON.parse(jsonString);
      return this.importFromObject(data);
    } catch (error) {
      return {
        success: false,
        errors: [`Invalid JSON format: ${error instanceof Error ? error.message : 'Unknown error'}`]
      };
    }
  }

  /**
   * Importa una plantilla desde un objeto
   */
  static importFromObject(data: any): ImportResult {
    try {
      // Validar estructura básica
      if (!data || typeof data !== 'object') {
        return {
          success: false,
          errors: ['Invalid template data: must be an object']
        };
      }

      // Convertir a TemplatePack si es necesario
      const templatePack = this.normalizeTemplatePack(data);

      // Validar el pack
      const validation = validateTemplatePack(templatePack);
      if (!validation.isValid) {
        return {
          success: false,
          errors: validation.errors.map(e => `${e.path}: ${e.message}`)
        };
      }

      return {
        success: true,
        template: templatePack as Template,
        errors: []
      };
    } catch (error) {
      return {
        success: false,
        errors: [`Error processing template: ${error instanceof Error ? error.message : 'Unknown error'}`]
      };
    }
  }

  /**
   * Exporta una plantilla a JSON
   */
  static exportToJSON(template: TemplatePack, options: ExportOptions = {}): string {
    const { pretty = true, includeMetadata = true } = options;

    let exportData = { ...template };

    if (!includeMetadata) {
      // Remover metadatos internos
      const { meta, ...rest } = exportData;
      const cleanMeta = {
        name: meta.name,
        description: meta.description,
        category: meta.category,
        version: meta.version,
        author: meta.author
      };
      exportData = { meta: cleanMeta, ...rest };
    }

    return JSON.stringify(exportData, null, pretty ? 2 : 0);
  }

  /**
   * Exporta una plantilla como archivo descargable
   */
  static exportAsFile(template: TemplatePack, options: ExportOptions = {}): void {
    const jsonString = this.exportToJSON(template, options);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `${this.sanitizeFilename(template.meta.name)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  }

  /**
   * Exporta múltiples plantillas como un pack
   */
  static exportMultipleAsFile(templates: TemplatePack[], packName: string = 'template-pack'): void {
    const packData = {
      name: packName,
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      templates
    };

    const jsonString = JSON.stringify(packData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `${this.sanitizeFilename(packName)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  }

  /**
   * Normaliza un objeto a TemplatePack
   */
  private static normalizeTemplatePack(data: any): TemplatePack {
    // Valores por defecto
    const defaultPack: TemplatePack = {
      meta: {
        name: 'Untitled Template',
        category: 'modern',
        version: '1.0.0'
      },
      component: {
        id: 'default',
        props: {}
      },
      sections: {
        profile: {},
        links: [],
        social: {},
        services: [],
        portfolio: [],
        booking: {},
        elements: [],
        design: {}
      },
      editable: {
        fields: [],
        lockedSections: []
      },
      appearIn: 'templates'
    };

    // Merge con los datos proporcionados
    const normalized: TemplatePack = {
      meta: { ...defaultPack.meta, ...data.meta },
      component: { ...defaultPack.component, ...data.component },
      sections: { ...defaultPack.sections, ...data.sections },
      editable: { ...defaultPack.editable, ...data.editable },
      cssGlobal: data.cssGlobal || data.sections?.design?.globalStyles || '',
      appearIn: data.appearIn || defaultPack.appearIn,
      isPublic: data.isPublic || false
    };

    // Normalizar secciones individuales
    if (data.sections) {
      Object.keys(defaultPack.sections).forEach(key => {
        if (data.sections[key] !== undefined) {
          normalized.sections[key as keyof typeof normalized.sections] = data.sections[key];
        }
      });
    }

    return normalized;
  }

  /**
   * Sanitiza un nombre de archivo
   */
  private static sanitizeFilename(filename: string): string {
    return filename
      .replace(/[^a-z0-9]/gi, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '')
      .toLowerCase() || 'template';
  }

  /**
   * Valida que un archivo sea JSON válido
   */
  static async validateFile(file: File): Promise<{ valid: boolean; error?: string }> {
    try {
      if (!file.name.toLowerCase().endsWith('.json')) {
        return { valid: false, error: 'File must be a JSON file' };
      }

      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        return { valid: false, error: 'File is too large (max 10MB)' };
      }

      const text = await file.text();
      JSON.parse(text);

      return { valid: true };
    } catch (error) {
      return {
        valid: false,
        error: error instanceof Error ? error.message : 'Invalid JSON file'
      };
    }
  }

  /**
   * Crea un template pack ejemplo para pruebas
   */
  static createSamplePack(): TemplatePack {
    return {
      meta: {
        name: 'Sample Template',
        description: 'A sample template for testing',
        category: 'modern',
        version: '1.0.0',
        author: 'Template System'
      },
      component: {
        id: 'sample-card',
        props: {
          primaryColor: '#3b82f6',
          secondaryColor: '#8b5cf6',
          showAvatar: true,
          layout: 'centered'
        }
      },
      sections: {
        profile: {
          name: 'John Doe',
          bio: 'Sample biography text',
          avatar: '',
          backgroundType: 'gradient',
          backgroundColor: '#3b82f6',
          backgroundGradient: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)'
        },
        links: [
          {
            id: 'link1',
            title: 'My Website',
            url: 'https://example.com',
            description: 'Visit my website',
            isVisible: true,
            order: 0
          }
        ],
        social: {
          instagram: 'https://instagram.com/example',
          twitter: 'https://twitter.com/example'
        },
        services: [],
        booking: {
          enabled: false
        },
        elements: [],
        design: {
          globalStyles: `
            .template-container {
              background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
              border-radius: 20px;
              padding: 20px;
            }
          `
        }
      },
      editable: {
        fields: [
          {
            path: 'component.props.primaryColor',
            type: 'color',
            label: 'Color Principal',
            required: true
          },
          {
            path: 'component.props.secondaryColor',
            type: 'color',
            label: 'Color Secundario'
          },
          {
            path: 'sections.profile.name',
            type: 'string',
            label: 'Nombre del Perfil',
            required: true,
            max: 50
          },
          {
            path: 'sections.profile.bio',
            type: 'text',
            label: 'Biografía',
            max: 200
          },
          {
            path: 'component.props.showAvatar',
            type: 'boolean',
            label: 'Mostrar Avatar'
          },
          {
            path: 'component.props.layout',
            type: 'select',
            label: 'Diseño',
            options: ['centered', 'left', 'right']
          }
        ],
        lockedSections: ['elements']
      },
      cssGlobal: `
        :root {
          --primary-color: #3b82f6;
          --secondary-color: #8b5cf6;
        }
      `,
      appearIn: 'both'
    };
  }
}
