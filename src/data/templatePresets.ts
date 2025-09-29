// Plantillas predefinidas con CSS y configuración JSON

export interface TemplatePreset {
  id: string;
  name: string;
  description: string;
  category: string;
  preview: string;
  customCSS: string;
  editableConfig: {
    profile?: {
      canEditName?: boolean;
      canEditBio?: boolean;
      canEditAvatar?: boolean;
      canEditBackground?: boolean;
    };
    links?: {
      canAdd?: boolean;
      canDelete?: boolean;
      canReorder?: boolean;
      maxLinks?: number;
    };
    social?: {
      allowedPlatforms?: string[];
      canToggleVisibility?: boolean;
    };
    services?: {
      canAdd?: boolean;
      canDelete?: boolean;
      canEditPricing?: boolean;
    };
    booking?: {
      canToggle?: boolean;
      canEditDetails?: boolean;
    };
    elements?: {
      canAdd?: boolean;
      allowedTypes?: string[];
    };
    design?: {
      canChangeColors?: boolean;
      canChangeTheme?: boolean;
      allowedThemes?: string[];
    };
  };
}

export const templatePresets: TemplatePreset[] = [
  {
    id: 'gradient-modern',
    name: 'Moderno con Gradiente',
    description: 'Diseño moderno con gradientes y efectos glassmorphism',
    category: 'modern',
    preview: '/previews/gradient-modern.jpg',
    customCSS: `/* Plantilla Moderna con Gradiente */
.template-container {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  min-height: 100vh;
  padding: 20px;
}

.profile-section {
  text-align: center;
  margin-bottom: 30px;
  background: rgba(255,255,255,0.1);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255,255,255,0.2);
  border-radius: 20px;
  padding: 30px;
}

.profile-avatar {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  margin: 0 auto 20px;
  border: 4px solid rgba(255,255,255,0.3);
  box-shadow: 0 8px 32px rgba(0,0,0,0.1);
}

.profile-name {
  color: white;
  font-size: 28px;
  font-weight: 700;
  margin-bottom: 12px;
  text-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.profile-bio {
  color: rgba(255,255,255,0.9);
  font-size: 16px;
  line-height: 1.6;
}

.links-section {
  margin-bottom: 30px;
}

.link-item {
  display: block;
  background: rgba(255,255,255,0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255,255,255,0.2);
  border-radius: 16px;
  padding: 18px;
  margin-bottom: 12px;
  color: white;
  text-decoration: none;
  transition: all 0.3s ease;
  font-weight: 500;
}

.link-item:hover {
  background: rgba(255,255,255,0.2);
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0,0,0,0.1);
}

.social-section {
  display: flex;
  justify-content: center;
  gap: 15px;
  margin-bottom: 30px;
}

.social-item {
  width: 50px;
  height: 50px;
  background: rgba(255,255,255,0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255,255,255,0.2);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  transition: all 0.3s ease;
}

.social-item:hover {
  background: rgba(255,255,255,0.2);
  transform: scale(1.1);
}`,
    editableConfig: {
      profile: {
        canEditName: true,
        canEditBio: true,
        canEditAvatar: true,
        canEditBackground: false
      },
      links: {
        canAdd: true,
        canDelete: true,
        canReorder: true,
        maxLinks: 8
      },
      social: {
        allowedPlatforms: ['instagram', 'twitter', 'linkedin', 'facebook', 'youtube'],
        canToggleVisibility: true
      },
      services: {
        canAdd: true,
        canDelete: true,
        canEditPricing: true
      },
      booking: {
        canToggle: true,
        canEditDetails: true
      },
      elements: {
        canAdd: true,
        allowedTypes: ['text', 'divider', 'spacer']
      },
      design: {
        canChangeColors: true,
        canChangeTheme: false,
        allowedThemes: []
      }
    }
  },
  {
    id: 'minimal-clean',
    name: 'Minimalista Limpio',
    description: 'Diseño limpio y minimalista con enfoque en el contenido',
    category: 'minimal',
    preview: '/previews/minimal-clean.jpg',
    customCSS: `/* Plantilla Minimalista Limpia */
.template-container {
  background: #f8fafc;
  min-height: 100vh;
  padding: 40px 20px;
}

.profile-section {
  text-align: center;
  margin-bottom: 50px;
  background: white;
  padding: 40px;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  border: 1px solid #e2e8f0;
}

.profile-avatar {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  margin: 0 auto 25px;
  border: 3px solid #e2e8f0;
}

.profile-name {
  color: #1e293b;
  font-size: 32px;
  font-weight: 600;
  margin-bottom: 15px;
  letter-spacing: -0.025em;
}

.profile-bio {
  color: #64748b;
  font-size: 18px;
  line-height: 1.6;
  max-width: 600px;
  margin: 0 auto;
}

.links-section {
  margin-bottom: 40px;
}

.link-item {
  display: block;
  background: white;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  padding: 20px 24px;
  margin-bottom: 16px;
  color: #1e293b;
  text-decoration: none;
  transition: all 0.2s ease;
  font-weight: 500;
  text-align: center;
}

.link-item:hover {
  border-color: #3b82f6;
  background: #f8fafc;
}

.social-section {
  display: flex;
  justify-content: center;
  gap: 12px;
  margin-bottom: 40px;
}

.social-item {
  width: 44px;
  height: 44px;
  background: white;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #64748b;
  transition: all 0.2s ease;
}

.social-item:hover {
  border-color: #3b82f6;
  color: #3b82f6;
}`,
    editableConfig: {
      profile: {
        canEditName: true,
        canEditBio: true,
        canEditAvatar: true,
        canEditBackground: false
      },
      links: {
        canAdd: true,
        canDelete: true,
        canReorder: true,
        maxLinks: 6
      },
      social: {
        allowedPlatforms: ['instagram', 'twitter', 'linkedin', 'website'],
        canToggleVisibility: false
      },
      services: {
        canAdd: false,
        canDelete: false,
        canEditPricing: false
      },
      booking: {
        canToggle: false,
        canEditDetails: false
      },
      elements: {
        canAdd: false,
        allowedTypes: ['text']
      },
      design: {
        canChangeColors: false,
        canChangeTheme: false,
        allowedThemes: []
      }
    }
  },
  {
    id: 'dark-elegant',
    name: 'Oscuro Elegante',
    description: 'Diseño elegante con tema oscuro y acentos de color',
    category: 'dark',
    preview: '/previews/dark-elegant.jpg',
    customCSS: `/* Plantilla Oscura Elegante */
.template-container {
  background: linear-gradient(145deg, #0f172a 0%, #1e293b 100%);
  min-height: 100vh;
  padding: 30px 20px;
}

.profile-section {
  text-align: center;
  margin-bottom: 40px;
  background: rgba(30, 41, 59, 0.5);
  backdrop-filter: blur(10px);
  padding: 40px 30px;
  border-radius: 16px;
  border: 1px solid #334155;
}

.profile-avatar {
  width: 130px;
  height: 130px;
  border-radius: 50%;
  margin: 0 auto 25px;
  border: 3px solid #3b82f6;
  box-shadow: 0 0 20px rgba(59, 130, 246, 0.3);
}

.profile-name {
  color: white;
  font-size: 30px;
  font-weight: 600;
  margin-bottom: 15px;
  background: linear-gradient(135deg, #3b82f6, #8b5cf6);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.profile-bio {
  color: #cbd5e1;
  font-size: 17px;
  line-height: 1.6;
  max-width: 500px;
  margin: 0 auto;
}

.links-section {
  margin-bottom: 35px;
}

.link-item {
  display: block;
  background: rgba(30, 41, 59, 0.6);
  border: 1px solid #334155;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 14px;
  color: white;
  text-decoration: none;
  transition: all 0.3s ease;
  font-weight: 500;
  position: relative;
  overflow: hidden;
}

.link-item::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(59, 130, 246, 0.1), transparent);
  transition: left 0.5s;
}

.link-item:hover::before {
  left: 100%;
}

.link-item:hover {
  background: rgba(51, 65, 85, 0.8);
  border-color: #3b82f6;
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(59, 130, 246, 0.15);
}

.social-section {
  display: flex;
  justify-content: center;
  gap: 18px;
  margin-bottom: 35px;
}

.social-item {
  width: 55px;
  height: 55px;
  background: rgba(30, 41, 59, 0.6);
  border: 1px solid #334155;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #cbd5e1;
  transition: all 0.3s ease;
}

.social-item:hover {
  background: rgba(59, 130, 246, 0.1);
  border-color: #3b82f6;
  color: #3b82f6;
  transform: translateY(-3px);
}`,
    editableConfig: {
      profile: {
        canEditName: true,
        canEditBio: true,
        canEditAvatar: true,
        canEditBackground: true
      },
      links: {
        canAdd: true,
        canDelete: true,
        canReorder: true,
        maxLinks: 12
      },
      social: {
        allowedPlatforms: ['instagram', 'twitter', 'linkedin', 'facebook', 'youtube', 'tiktok'],
        canToggleVisibility: true
      },
      services: {
        canAdd: true,
        canDelete: true,
        canEditPricing: true
      },
      booking: {
        canToggle: true,
        canEditDetails: true
      },
      elements: {
        canAdd: true,
        allowedTypes: ['text', 'divider', 'spacer', 'custom-code']
      },
      design: {
        canChangeColors: true,
        canChangeTheme: true,
        allowedThemes: ['dark', 'blue-dark', 'purple-dark']
      }
    }
  },
  {
    id: 'business-professional',
    name: 'Profesional de Negocios',
    description: 'Diseño corporativo profesional con enfoque en servicios',
    category: 'professional',
    preview: '/previews/business-professional.jpg',
    customCSS: `/* Plantilla Profesional de Negocios */
.template-container {
  background: linear-gradient(to bottom, #f1f5f9, #e2e8f0);
  min-height: 100vh;
  padding: 30px 20px;
}

.profile-section {
  text-align: center;
  margin-bottom: 45px;
  background: white;
  padding: 50px 40px;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0,0,0,0.05);
  border-left: 4px solid #3b82f6;
}

.profile-avatar {
  width: 110px;
  height: 110px;
  border-radius: 8px;
  margin: 0 auto 20px;
  border: 3px solid #3b82f6;
}

.profile-name {
  color: #1e293b;
  font-size: 28px;
  font-weight: 700;
  margin-bottom: 10px;
  letter-spacing: -0.025em;
}

.profile-bio {
  color: #475569;
  font-size: 16px;
  line-height: 1.7;
  max-width: 550px;
  margin: 0 auto;
}

.links-section {
  margin-bottom: 40px;
}

.link-item {
  display: block;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  padding: 22px 28px;
  margin-bottom: 12px;
  color: #1e293b;
  text-decoration: none;
  transition: all 0.2s ease;
  font-weight: 600;
  text-align: left;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
}

.link-item:hover {
  border-color: #3b82f6;
  background: #f8fafc;
  transform: translateX(4px);
  box-shadow: 0 4px 6px rgba(0,0,0,0.05);
}

.social-section {
  display: flex;
  justify-content: center;
  gap: 10px;
  margin-bottom: 40px;
}

.social-item {
  width: 40px;
  height: 40px;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #64748b;
  transition: all 0.2s ease;
}

.social-item:hover {
  border-color: #3b82f6;
  color: #3b82f6;
  background: #f8fafc;
}

.services-section {
  background: white;
  border-radius: 8px;
  padding: 30px;
  margin-bottom: 30px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
}

.service-item {
  padding: 20px;
  border-bottom: 1px solid #e2e8f0;
  margin-bottom: 15px;
}

.service-item:last-child {
  border-bottom: none;
  margin-bottom: 0;
}`,
    editableConfig: {
      profile: {
        canEditName: true,
        canEditBio: true,
        canEditAvatar: true,
        canEditBackground: false
      },
      links: {
        canAdd: true,
        canDelete: true,
        canReorder: true,
        maxLinks: 5
      },
      social: {
        allowedPlatforms: ['linkedin', 'twitter', 'website'],
        canToggleVisibility: false
      },
      services: {
        canAdd: true,
        canDelete: true,
        canEditPricing: true
      },
      booking: {
        canToggle: true,
        canEditDetails: true
      },
      elements: {
        canAdd: false,
        allowedTypes: ['text']
      },
      design: {
        canChangeColors: false,
        canChangeTheme: false,
        allowedThemes: []
      }
    }
  },
  {
    id: 'creative-colorful',
    name: 'Creativo y Colorido',
    description: 'Diseño vibrante y creativo perfecto para artistas y creativos',
    category: 'creative',
    preview: '/previews/creative-colorful.jpg',
    customCSS: `/* Plantilla Creativa y Colorida */
.template-container {
  background: linear-gradient(45deg, #ff6b6b, #4ecdc4, #45b7d1, #96ceb4, #ffeaa7);
  background-size: 300% 300%;
  animation: gradientShift 8s ease infinite;
  min-height: 100vh;
  padding: 25px 20px;
}

@keyframes gradientShift {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}

.profile-section {
  text-align: center;
  margin-bottom: 35px;
  background: rgba(255,255,255,0.95);
  backdrop-filter: blur(10px);
  padding: 35px;
  border-radius: 25px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.1);
  border: 3px solid rgba(255,255,255,0.3);
}

.profile-avatar {
  width: 125px;
  height: 125px;
  border-radius: 50%;
  margin: 0 auto 20px;
  border: 5px solid transparent;
  background: linear-gradient(45deg, #ff6b6b, #4ecdc4, #45b7d1) border-box;
  background-clip: padding-box, border-box;
  background-origin: padding-box, border-box;
}

.profile-name {
  background: linear-gradient(45deg, #ff6b6b, #4ecdc4, #45b7d1);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  font-size: 32px;
  font-weight: 800;
  margin-bottom: 15px;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.profile-bio {
  color: #2d3748;
  font-size: 16px;
  line-height: 1.6;
  font-weight: 500;
}

.links-section {
  margin-bottom: 30px;
}

.link-item {
  display: block;
  background: rgba(255,255,255,0.9);
  backdrop-filter: blur(5px);
  border: 2px solid transparent;
  border-radius: 20px;
  padding: 18px;
  margin-bottom: 15px;
  color: #2d3748;
  text-decoration: none;
  transition: all 0.3s ease;
  font-weight: 600;
  position: relative;
  overflow: hidden;
}

.link-item::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(45deg, #ff6b6b, #4ecdc4, #45b7d1, #96ceb4);
  z-index: -1;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.link-item:hover::before {
  opacity: 1;
}

.link-item:hover {
  color: white;
  transform: translateY(-3px) scale(1.02);
  box-shadow: 0 10px 25px rgba(0,0,0,0.15);
}

.social-section {
  display: flex;
  justify-content: center;
  gap: 15px;
  margin-bottom: 30px;
}

.social-item {
  width: 60px;
  height: 60px;
  background: rgba(255,255,255,0.9);
  backdrop-filter: blur(5px);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #2d3748;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.social-item::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(45deg, #ff6b6b, #4ecdc4, #45b7d1);
  z-index: -1;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.social-item:hover::before {
  opacity: 1;
}

.social-item:hover {
  color: white;
  transform: scale(1.1) rotate(10deg);
}`,
    editableConfig: {
      profile: {
        canEditName: true,
        canEditBio: true,
        canEditAvatar: true,
        canEditBackground: true
      },
      links: {
        canAdd: true,
        canDelete: true,
        canReorder: true,
        maxLinks: 15
      },
      social: {
        allowedPlatforms: ['instagram', 'twitter', 'facebook', 'youtube', 'tiktok', 'website'],
        canToggleVisibility: true
      },
      services: {
        canAdd: true,
        canDelete: true,
        canEditPricing: false
      },
      booking: {
        canToggle: true,
        canEditDetails: true
      },
      elements: {
        canAdd: true,
        allowedTypes: ['text', 'divider', 'spacer', 'custom-code']
      },
      design: {
        canChangeColors: true,
        canChangeTheme: true,
        allowedThemes: ['creative', 'rainbow', 'pastel']
      }
    }
  }
];

export default templatePresets;
