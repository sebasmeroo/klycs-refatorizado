import { templateDistributionService } from './templateDistribution';
import { userTemplatesService } from './userTemplates';

export interface TemplateDebugInfo {
  templateId: string;
  templateName: string;
  hasReactCode: boolean;
  hasCSS: boolean;
  reactCodeLength: number;
  cssCodeLength: number;
  isPublic: boolean;
  targetSection: string;
  reactCodePreview: string;
  cssCodePreview: string;
}

export interface TemplateFixResult {
  success: boolean;
  message: string;
  debugInfo?: TemplateDebugInfo;
}

class TemplateDebuggerService {
  
  // Diagnosticar una plantilla específica
  async diagnoseTemplate(templateId: string): Promise<TemplateDebugInfo | null> {
    try {
      const template = await templateDistributionService.getTemplateById(templateId);
      if (!template) {
        console.error('❌ Plantilla no encontrada:', templateId);
        return null;
      }

      const debugInfo: TemplateDebugInfo = {
        templateId: template.id || templateId,
        templateName: template.name,
        hasReactCode: !!(template.reactCode && template.reactCode.trim()),
        hasCSS: !!(template.cssCode && template.cssCode.trim()),
        reactCodeLength: template.reactCode?.length || 0,
        cssCodeLength: template.cssCode?.length || 0,
        isPublic: template.isPublic,
        targetSection: template.targetSection,
        reactCodePreview: (template.reactCode || '').substring(0, 200),
        cssCodePreview: (template.cssCode || '').substring(0, 200)
      };

      console.log('🔍 Debug info para plantilla:', debugInfo);
      return debugInfo;
    } catch (error) {
      console.error('❌ Error diagnosticando plantilla:', error);
      return null;
    }
  }

  // Arreglar plantilla vacía agregando contenido de ejemplo
  async fixEmptyTemplate(templateId: string): Promise<TemplateFixResult> {
    try {
      const debugInfo = await this.diagnoseTemplate(templateId);
      if (!debugInfo) {
        return {
          success: false,
          message: 'No se pudo encontrar la plantilla'
        };
      }

      // Si la plantilla ya tiene contenido, no hacer nada
      if (debugInfo.hasReactCode && debugInfo.hasCSS) {
        return {
          success: true,
          message: 'La plantilla ya tiene contenido válido',
          debugInfo
        };
      }

      // Obtener plantilla completa para actualizarla
      const template = await templateDistributionService.getTemplateById(templateId);
      if (!template) {
        return {
          success: false,
          message: 'No se pudo cargar la plantilla para actualizar'
        };
      }

      // Contenido de ejemplo basado en la sección
      const exampleContent = this.getExampleContent(debugInfo.targetSection);

      // Actualizar plantilla con contenido de ejemplo
      const updateData = {
        reactCode: debugInfo.hasReactCode ? template.reactCode : exampleContent.reactCode,
        cssCode: debugInfo.hasCSS ? template.cssCode : exampleContent.cssCode,
        jsonConfig: template.jsonConfig && template.jsonConfig.length > 0 
          ? template.jsonConfig 
          : exampleContent.jsonConfig
      };

      const success = await templateDistributionService.updateTemplate(templateId, updateData);

      if (success) {
        const newDebugInfo = await this.diagnoseTemplate(templateId);
        return {
          success: true,
          message: `✅ Plantilla actualizada con contenido de ejemplo para ${debugInfo.targetSection}`,
          debugInfo: newDebugInfo || debugInfo
        };
      } else {
        return {
          success: false,
          message: 'No se pudo actualizar la plantilla'
        };
      }
    } catch (error) {
      console.error('❌ Error arreglando plantilla:', error);
      return {
        success: false,
        message: `Error: ${error instanceof Error ? error.message : 'Error desconocido'}`
      };
    }
  }

  // Diagnosticar plantilla activa para una tarjeta
  async diagnoseActiveTemplateForCard(cardId: string): Promise<TemplateDebugInfo | null> {
    try {
      const activeTemplate = await userTemplatesService.getActiveTemplateForCard(cardId);
      if (!activeTemplate) {
        console.log('ℹ️ No hay plantilla activa para la tarjeta:', cardId);
        return null;
      }

      return await this.diagnoseTemplate(activeTemplate.template.id);
    } catch (error) {
      console.error('❌ Error diagnosticando plantilla activa:', error);
      return null;
    }
  }

  // Obtener contenido de ejemplo según la sección
  private getExampleContent(section: string) {
    const examples = {
      profile: {
        reactCode: `
function ProfileTemplate({ data }) {
  return (
    <div className="profile-template">
      <div className="profile-header">
        <img 
          src={data.profileImage || 'https://via.placeholder.com/120'} 
          alt={data.name || 'Profile'} 
          className="profile-avatar"
        />
        <h1 className="profile-name">{data.name || 'Tu Nombre'}</h1>
        <p className="profile-title">{data.title || 'Tu Título'}</p>
      </div>
      <div className="profile-bio">
        <p>{data.bio || 'Tu biografía aquí...'}</p>
      </div>
      <div className="profile-contact">
        {data.email && <p className="contact-email">📧 {data.email}</p>}
        {data.phone && <p className="contact-phone">📱 {data.phone}</p>}
      </div>
    </div>
  );
}
        `.trim(),
        cssCode: `
.profile-template {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 2rem;
  border-radius: 16px;
  text-align: center;
  box-shadow: 0 10px 30px rgba(0,0,0,0.2);
}

.profile-header {
  margin-bottom: 1.5rem;
}

.profile-avatar {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  border: 4px solid rgba(255,255,255,0.3);
  margin-bottom: 1rem;
  object-fit: cover;
}

.profile-name {
  font-size: 2rem;
  font-weight: bold;
  margin: 0 0 0.5rem 0;
  text-shadow: 0 2px 4px rgba(0,0,0,0.3);
}

.profile-title {
  font-size: 1.2rem;
  opacity: 0.9;
  margin: 0;
}

.profile-bio {
  margin: 1.5rem 0;
  font-size: 1rem;
  line-height: 1.6;
  opacity: 0.95;
}

.profile-contact {
  margin-top: 1.5rem;
}

.contact-email, .contact-phone {
  margin: 0.5rem 0;
  font-size: 0.9rem;
  opacity: 0.9;
}
        `.trim(),
        jsonConfig: [
          {
            id: 'name',
            label: 'Nombre',
            type: 'text',
            defaultValue: 'Tu Nombre',
            editable: true
          },
          {
            id: 'title',
            label: 'Título',
            type: 'text',
            defaultValue: 'Tu Título',
            editable: true
          },
          {
            id: 'bio',
            label: 'Biografía',
            type: 'textarea',
            defaultValue: 'Tu biografía aquí...',
            editable: true
          },
          {
            id: 'profileImage',
            label: 'Imagen de Perfil',
            type: 'image',
            defaultValue: 'https://via.placeholder.com/120',
            editable: true
          }
        ]
      },
      links: {
        reactCode: `
function LinksTemplate({ data }) {
  return (
    <div className="links-template">
      <h2 className="links-title">Mis Enlaces</h2>
      <div className="links-grid">
        {(data.links || []).map((link, index) => (
          <a 
            key={index} 
            href={link.url} 
            className="link-card"
            target="_blank"
            rel="noopener noreferrer"
          >
            <span className="link-icon">🔗</span>
            <span className="link-text">{link.title}</span>
          </a>
        ))}
      </div>
    </div>
  );
}
        `.trim(),
        cssCode: `
.links-template {
  padding: 1.5rem;
}

.links-title {
  font-size: 1.5rem;
  font-weight: bold;
  margin-bottom: 1rem;
  text-align: center;
  color: #333;
}

.links-grid {
  display: grid;
  gap: 0.75rem;
}

.link-card {
  display: flex;
  align-items: center;
  padding: 1rem;
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  color: white;
  text-decoration: none;
  border-radius: 12px;
  transition: transform 0.2s, box-shadow 0.2s;
  box-shadow: 0 4px 15px rgba(0,0,0,0.1);
}

.link-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0,0,0,0.2);
}

.link-icon {
  font-size: 1.5rem;
  margin-right: 0.75rem;
}

.link-text {
  font-weight: 600;
}
        `.trim(),
        jsonConfig: []
      }
    };

    return examples[section as keyof typeof examples] || examples.profile;
  }
}

export const templateDebuggerService = new TemplateDebuggerService();
