import React from 'react';
import type { RegisteredTemplateComponents, RegisteredTemplateComponent } from '@/types/templatePack';
import type { Card } from '@/types';

/**
 * Registro global de componentes de plantillas
 */
class TemplateRegistry {
  private components: RegisteredTemplateComponents = {};

  /**
   * Registra un nuevo componente de plantilla
   */
  register(component: RegisteredTemplateComponent): void {
    this.components[component.id] = component;
  }

  /**
   * Obtiene un componente registrado por ID
   */
  get(id: string): RegisteredTemplateComponent | undefined {
    return this.components[id];
  }

  /**
   * Obtiene todos los componentes registrados
   */
  getAll(): RegisteredTemplateComponents {
    return { ...this.components };
  }

  /**
   * Obtiene una lista de IDs de componentes registrados
   */
  getIds(): string[] {
    return Object.keys(this.components);
  }

  /**
   * Verifica si un componente está registrado
   */
  has(id: string): boolean {
    return id in this.components;
  }

  /**
   * Desregistra un componente
   */
  unregister(id: string): boolean {
    if (this.has(id)) {
      delete this.components[id];
      return true;
    }
    return false;
  }

  /**
   * Renderiza un componente registrado
   */
  render(id: string, card: Card, props?: Record<string, any>): React.ReactElement | null {
    const component = this.get(id);
    if (!component) {
      console.warn(`Template component '${id}' not found in registry`);
      return null;
    }

    try {
      const mergedProps = {
        ...component.defaultProps,
        ...props
      };

      return React.createElement(component.component, {
        card,
        props: mergedProps
      });
    } catch (error) {
      console.error(`Error rendering template component '${id}':`, error);
      return null;
    }
  }
}

// Instancia singleton del registro
export const templateRegistry = new TemplateRegistry();

// Componente por defecto para casos donde no hay plantilla específica
const DefaultTemplateComponent: React.FC<{ card: Card; props?: any }> = ({ card }) => {
  return (
    <div className="template-default">
      <div className="profile-section">
        {card.profile.avatar && (
          <img 
            src={card.profile.avatar} 
            alt={card.profile.name}
            className="avatar"
          />
        )}
        <h1 className="name">{card.profile.name}</h1>
        {card.profile.bio && <p className="bio">{card.profile.bio}</p>}
      </div>

      {card.links.length > 0 && (
        <div className="links-section">
          {card.links
            .filter(link => link.isVisible)
            .sort((a, b) => a.order - b.order)
            .map(link => (
              <a
                key={link.id}
                href={link.url}
                className="link-item"
                target="_blank"
                rel="noopener noreferrer"
              >
                {link.title}
              </a>
            ))}
        </div>
      )}

      {card.socialLinks.length > 0 && (
        <div className="social-section">
          {card.socialLinks
            .filter(social => social.isVisible)
            .map(social => (
              <a
                key={social.id}
                href={social.url}
                className="social-link"
                target="_blank"
                rel="noopener noreferrer"
              >
                {social.platform}
              </a>
            ))}
        </div>
      )}
    </div>
  );
};

// Registrar el componente por defecto
templateRegistry.register({
  id: 'default',
  name: 'Default Template',
  description: 'Default template component for basic cards',
  component: DefaultTemplateComponent,
  defaultProps: {},
  editableFields: [
    {
      path: 'sections.profile.name',
      type: 'string',
      label: 'Nombre',
      required: true
    },
    {
      path: 'sections.profile.bio',
      type: 'text',
      label: 'Biografía'
    }
  ]
});

// Componente de ejemplo más avanzado
const ModernGlassTemplate: React.FC<{ card: Card; props?: any }> = ({ card, props = {} }) => {
  const {
    primaryColor = '#3b82f6',
    secondaryColor = '#8b5cf6',
    showAvatar = true,
    layout = 'centered',
    glassOpacity = 0.1
  } = props;

  const containerStyle = {
    background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
    padding: '20px',
    borderRadius: '20px',
    color: 'white',
    textAlign: layout as 'center' | 'left' | 'right',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
  };

  const glassStyle = {
    background: `rgba(255, 255, 255, ${glassOpacity})`,
    backdropFilter: 'blur(8px)',
    borderRadius: '16px',
    padding: '16px',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    marginBottom: '16px'
  };

  return (
    <div style={containerStyle}>
      <div style={glassStyle}>
        <div className="profile-section">
          {showAvatar && card.profile.avatar && (
            <img 
              src={card.profile.avatar} 
              alt={card.profile.name}
              style={{
                width: '80px',
                height: '80px',
                borderRadius: '50%',
                border: '3px solid rgba(255, 255, 255, 0.3)',
                marginBottom: '12px'
              }}
            />
          )}
          <h1 style={{ 
            fontSize: '24px', 
            fontWeight: 'bold', 
            marginBottom: '8px',
            textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)'
          }}>
            {card.profile.name}
          </h1>
          {card.profile.bio && (
            <p style={{ 
              fontSize: '14px', 
              opacity: 0.9,
              lineHeight: '1.5'
            }}>
              {card.profile.bio}
            </p>
          )}
        </div>
      </div>

      {card.links.length > 0 && (
        <div className="links-section">
          {card.links
            .filter(link => link.isVisible)
            .sort((a, b) => a.order - b.order)
            .map(link => (
              <a
                key={link.id}
                href={link.url}
                style={{
                  ...glassStyle,
                  display: 'block',
                  textDecoration: 'none',
                  color: 'white',
                  transition: 'all 0.3s ease',
                  cursor: 'pointer'
                }}
                target="_blank"
                rel="noopener noreferrer"
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 12px 40px rgba(0, 0, 0, 0.2)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.1)';
                }}
              >
                <strong>{link.title}</strong>
                {link.description && (
                  <p style={{ 
                    fontSize: '12px', 
                    opacity: 0.8, 
                    margin: '4px 0 0 0' 
                  }}>
                    {link.description}
                  </p>
                )}
              </a>
            ))}
        </div>
      )}
    </div>
  );
};

// Registrar el componente de vidrio moderno
templateRegistry.register({
  id: 'modern-glass',
  name: 'Modern Glass',
  description: 'Modern glass morphism template with customizable colors',
  component: ModernGlassTemplate,
  defaultProps: {
    primaryColor: '#3b82f6',
    secondaryColor: '#8b5cf6',
    showAvatar: true,
    layout: 'centered',
    glassOpacity: 0.1
  },
  editableFields: [
    {
      path: 'component.props.primaryColor',
      type: 'color',
      label: 'Color Principal',
      required: true
    },
    {
      path: 'component.props.secondaryColor',
      type: 'color',
      label: 'Color Secundario',
      required: true
    },
    {
      path: 'component.props.showAvatar',
      type: 'boolean',
      label: 'Mostrar Avatar'
    },
    {
      path: 'component.props.layout',
      type: 'select',
      label: 'Alineación',
      options: ['centered', 'left', 'right']
    },
    {
      path: 'component.props.glassOpacity',
      type: 'number',
      label: 'Opacidad del Cristal',
      min: 0,
      max: 1
    },
    {
      path: 'sections.profile.name',
      type: 'string',
      label: 'Nombre',
      required: true
    },
    {
      path: 'sections.profile.bio',
      type: 'text',
      label: 'Biografía'
    }
  ]
});

export default templateRegistry;
