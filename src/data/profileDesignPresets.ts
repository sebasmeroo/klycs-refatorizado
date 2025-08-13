import { ProfileDesignPreset, ProfileDesign } from '@/types';

// Configuración por defecto para elementos comunes
const defaultAvatarStyle = {
  size: 96,
  borderRadius: 48,
  border: { width: 0, style: 'none' as const, color: '#ffffff' },
  shadow: {
    enabled: false,
    x: 0,
    y: 0,
    blur: 0,
    spread: 0,
    color: '#000000',
    opacity: 0.1
  },
  position: { x: 0, y: 0 }
};

const defaultPadding = { top: 0, right: 0, bottom: 0, left: 0 };
const defaultMargin = { top: 8, right: 0, bottom: 8, left: 0 };

// Preset Minimalista
const minimalDesign: ProfileDesign = {
  layout: {
    direction: 'column',
    alignment: {
      horizontal: 'center',
      vertical: 'center'
    },
    order: [
      { id: 'avatar', enabled: true, order: 0 },
      { id: 'name', enabled: true, order: 1 },
      { id: 'bio', enabled: true, order: 2 }
    ]
  },
  container: {
    backgroundColor: 'rgba(0,0,0,0.35)',
    border: { width: 1, style: 'solid', color: 'rgba(255,255,255,0.15)' },
    borderRadius: 16,
    variant: 'ticket',
  },
  showCareerDescription: false, // Por defecto no mostrar la descripción de carrera
  content: {
    poster: {
      titleTop: 'STILL WASTING TIME',
      titleBottom: 'LOOKING FOR TICKETS?',
      subtitle: 'Simply relax and download our app, we\'ll take care of the rest.',
      ctaText: 'GET THE APP FOR FREE',
      bgColor: '#d6e3e2',
      frameBorderColor: '#0b0f12',
      ctaBgColor: '#eef4ea',
      ctaTextColor: '#0b0f12',
    },
    ticket: {
      eventTitle: 'ART OF VICTORY',
      dateText: 'MONDAY, JULY 23',
      timeText: '9:00 - 10:00',
      attendeeName: 'Anna Jordan',
      attendeeEmail: 'anna.jordan@email.com',
      ctaPrimary: 'Your Tickets',
      ctaSecondary: 'Get Directions',
      primaryColor: '#ff3b00',
      frameBgColor: '#0a0a0a',
      textColor: '#0a0a0a',
      dockBgColor: 'rgba(255,255,255,0.08)'
    }
  },
  elements: {
    avatar: {
      ...defaultAvatarStyle,
      size: 80,
      borderRadius: 40,
      shadow: {
        enabled: true,
        x: 0,
        y: 2,
        blur: 8,
        spread: 0,
        color: '#000000',
        opacity: 0.1
      }
    },
    name: {
      fontFamily: 'Inter',
      fontSize: 24,
      fontWeight: 600,
      lineHeight: 1.2,
      letterSpacing: -0.5,
      textAlign: 'center',
      color: '#ffffff',
      padding: defaultPadding,
      margin: { ...defaultMargin, top: 16 }
    },
    bio: {
      fontFamily: 'Inter',
      fontSize: 14,
      fontWeight: 400,
      lineHeight: 1.4,
      letterSpacing: 0,
      textAlign: 'center',
      color: 'rgba(255, 255, 255, 0.8)',
      padding: { top: 0, right: 24, bottom: 0, left: 24 },
      margin: { ...defaultMargin, top: 8 }
    }
  },
  spacing: {
    containerPadding: { top: 32, right: 24, bottom: 32, left: 24 },
    elementSpacing: 12
  }
};

// Preset Moderno
const modernDesign: ProfileDesign = {
  layout: {
    direction: 'column',
    alignment: {
      horizontal: 'center',
      vertical: 'center'
    },
    order: [
      { id: 'avatar', enabled: true, order: 0 },
      { id: 'name', enabled: true, order: 1 },
      { id: 'bio', enabled: true, order: 2 }
    ]
  },
  container: {
    backgroundColor: 'rgba(0,0,0,0.35)',
    border: { width: 1, style: 'solid', color: 'rgba(255,255,255,0.18)' },
    borderRadius: 18,
    variant: 'default',
  },
  elements: {
    avatar: {
      ...defaultAvatarStyle,
      size: 120,
      borderRadius: 24,
      border: { width: 3, style: 'solid', color: '#ffffff' },
      shadow: {
        enabled: true,
        x: 0,
        y: 8,
        blur: 24,
        spread: 0,
        color: '#000000',
        opacity: 0.15
      }
    },
    name: {
      fontFamily: 'Montserrat',
      fontSize: 28,
      fontWeight: 700,
      lineHeight: 1.1,
      letterSpacing: -1,
      textAlign: 'center',
      color: '#ffffff',
      textShadow: {
        enabled: true,
        x: 0,
        y: 2,
        blur: 4,
        spread: 0,
        color: '#000000',
        opacity: 0.3
      },
      padding: defaultPadding,
      margin: { ...defaultMargin, top: 20 }
    },
    bio: {
      fontFamily: 'Inter',
      fontSize: 16,
      fontWeight: 400,
      lineHeight: 1.5,
      letterSpacing: 0.2,
      textAlign: 'center',
      color: 'rgba(255, 255, 255, 0.9)',
      padding: { top: 8, right: 32, bottom: 8, left: 32 },
      margin: { ...defaultMargin, top: 12 }
    }
  },
  spacing: {
    containerPadding: { top: 40, right: 32, bottom: 40, left: 32 },
    elementSpacing: 16
  }
};

// Preset Clásico
const classicDesign: ProfileDesign = {
  layout: {
    direction: 'column',
    alignment: {
      horizontal: 'center',
      vertical: 'center'
    },
    order: [
      { id: 'avatar', enabled: true, order: 0 },
      { id: 'name', enabled: true, order: 1 },
      { id: 'bio', enabled: true, order: 2 }
    ]
  },
  container: {
    backgroundColor: 'rgba(0,0,0,0.35)',
    border: { width: 1, style: 'solid', color: 'rgba(255,255,255,0.15)' },
    borderRadius: 20,
    variant: 'default',
  },
  elements: {
    avatar: {
      ...defaultAvatarStyle,
      size: 100,
      borderRadius: 50,
      border: { width: 4, style: 'solid', color: '#ffffff' },
      shadow: {
        enabled: true,
        x: 0,
        y: 4,
        blur: 12,
        spread: 0,
        color: '#000000',
        opacity: 0.2
      }
    },
    name: {
      fontFamily: 'Georgia',
      fontSize: 26,
      fontWeight: 400,
      lineHeight: 1.3,
      letterSpacing: 0,
      textAlign: 'center',
      color: '#ffffff',
      padding: defaultPadding,
      margin: { ...defaultMargin, top: 18 }
    },
    bio: {
      fontFamily: 'Georgia',
      fontSize: 15,
      fontWeight: 400,
      lineHeight: 1.6,
      letterSpacing: 0.3,
      textAlign: 'center',
      color: 'rgba(255, 255, 255, 0.85)',
      padding: { top: 4, right: 28, bottom: 4, left: 28 },
      margin: { ...defaultMargin, top: 10 }
    }
  },
  spacing: {
    containerPadding: { top: 36, right: 28, bottom: 36, left: 28 },
    elementSpacing: 14
  }
};

// Preset Creativo
const creativeDesign: ProfileDesign = {
  layout: {
    direction: 'column',
    alignment: {
      horizontal: 'left',
      vertical: 'top'
    },
    order: [
      { id: 'name', enabled: true, order: 0 },
      { id: 'avatar', enabled: true, order: 1 },
      { id: 'bio', enabled: true, order: 2 }
    ]
  },
  container: {
    backgroundColor: 'rgba(0,0,0,0.25)',
    border: { width: 0, style: 'none', color: 'transparent' },
    borderRadius: 16,
    variant: 'default',
  },
  elements: {
    avatar: {
      ...defaultAvatarStyle,
      size: 90,
      borderRadius: 16,
      position: { x: 20, y: 0 },
      shadow: {
        enabled: true,
        x: 4,
        y: 4,
        blur: 16,
        spread: 0,
        color: '#000000',
        opacity: 0.25
      }
    },
    name: {
      fontFamily: 'Poppins',
      fontSize: 32,
      fontWeight: 800,
      lineHeight: 1.0,
      letterSpacing: -1.5,
      textAlign: 'left',
      color: '#ffffff',
      padding: { top: 8, right: 0, bottom: 8, left: 24 },
      margin: defaultMargin
    },
    bio: {
      fontFamily: 'Inter',
      fontSize: 14,
      fontWeight: 500,
      lineHeight: 1.4,
      letterSpacing: 0.5,
      textAlign: 'left',
      color: 'rgba(255, 255, 255, 0.8)',
      padding: { top: 4, right: 24, bottom: 4, left: 24 },
      margin: { ...defaultMargin, top: 16 }
    }
  },
  spacing: {
    containerPadding: { top: 24, right: 24, bottom: 32, left: 24 },
    elementSpacing: 8
  }
};

// Preset Profesional
const professionalDesign: ProfileDesign = {
  layout: {
    direction: 'column',
    alignment: {
      horizontal: 'center',
      vertical: 'center'
    },
    order: [
      { id: 'avatar', enabled: true, order: 0 },
      { id: 'name', enabled: true, order: 1 },
      { id: 'bio', enabled: true, order: 2 }
    ]
  },
  container: {
    backgroundColor: '#d6e3e2',
    border: { width: 2, style: 'solid', color: '#0b0f12' },
    borderRadius: 24,
    variant: 'poster',
  },
  content: {
    poster: {
      titleTop: 'STILL WASTING TIME',
      titleBottom: 'LOOKING FOR TICKETS?',
      subtitle: "Simply relax and download our app, we'll take care of the rest.",
      ctaText: 'GET THE APP FOR FREE',
      bgColor: '#d6e3e2',
      frameBorderColor: '#0b0f12',
      ctaBgColor: '#eef4ea',
      ctaTextColor: '#0b0f12',
    },
  },
  elements: {
    avatar: {
      ...defaultAvatarStyle,
      size: 110,
      borderRadius: 55,
      border: { width: 2, style: 'solid', color: 'rgba(0, 0, 0, 0.2)' },
      shadow: {
        enabled: true,
        x: 0,
        y: 6,
        blur: 20,
        spread: 0,
        color: '#000000',
        opacity: 0.15
      }
    },
    name: {
      fontFamily: 'SF Pro Display',
      fontSize: 25,
      fontWeight: 600,
      lineHeight: 1.2,
      letterSpacing: -0.3,
      textAlign: 'center',
      color: '#0b0f12',
      padding: defaultPadding,
      margin: { ...defaultMargin, top: 22 }
    },
    bio: {
      fontFamily: 'SF Pro Display',
      fontSize: 15,
      fontWeight: 400,
      lineHeight: 1.5,
      letterSpacing: 0.1,
      textAlign: 'center',
      color: '#0b0f12cc',
      padding: { top: 6, right: 30, bottom: 6, left: 30 },
      margin: { ...defaultMargin, top: 10 }
    }
  },
  spacing: {
    containerPadding: { top: 38, right: 30, bottom: 38, left: 30 },
    elementSpacing: 15
  }
};

// Preset Neon
const neonDesign: ProfileDesign = {
  layout: {
    direction: 'column',
    alignment: {
      horizontal: 'center',
      vertical: 'center'
    },
    order: [
      { id: 'avatar', enabled: true, order: 0 },
      { id: 'name', enabled: true, order: 1 },
      { id: 'bio', enabled: true, order: 2 }
    ]
  },
  container: {
    backgroundColor: 'rgba(10,10,35,0.9)',
    border: { width: 2, style: 'solid', color: '#00ffff' },
    borderRadius: 12,
    variant: 'default',
  },
  elements: {
    avatar: {
      ...defaultAvatarStyle,
      size: 100,
      borderRadius: 20,
      border: { width: 3, style: 'solid', color: '#ff00ff' },
      shadow: {
        enabled: true,
        x: 0,
        y: 0,
        blur: 20,
        spread: 0,
        color: '#00ffff',
        opacity: 0.6
      }
    },
    name: {
      fontFamily: 'Orbitron',
      fontSize: 26,
      fontWeight: 800,
      lineHeight: 1.1,
      letterSpacing: 2,
      textAlign: 'center',
      color: '#00ffff',
      textShadow: {
        enabled: true,
        x: 0,
        y: 0,
        blur: 10,
        spread: 0,
        color: '#00ffff',
        opacity: 0.8
      },
      padding: defaultPadding,
      margin: { ...defaultMargin, top: 20 }
    },
    bio: {
      fontFamily: 'Roboto Mono',
      fontSize: 13,
      fontWeight: 400,
      lineHeight: 1.4,
      letterSpacing: 1,
      textAlign: 'center',
      color: '#ff00ff',
      padding: { top: 0, right: 20, bottom: 0, left: 20 },
      margin: { ...defaultMargin, top: 15 }
    }
  },
  spacing: {
    containerPadding: { top: 30, right: 25, bottom: 30, left: 25 },
    elementSpacing: 12
  }
};

// Preset Vintage
const vintageDesign: ProfileDesign = {
  layout: {
    direction: 'column',
    alignment: {
      horizontal: 'center',
      vertical: 'center'
    },
    order: [
      { id: 'avatar', enabled: true, order: 0 },
      { id: 'name', enabled: true, order: 1 },
      { id: 'bio', enabled: true, order: 2 }
    ]
  },
  container: {
    backgroundColor: 'rgba(139,119,101,0.85)',
    border: { width: 3, style: 'double', color: '#8B4513' },
    borderRadius: 8,
    variant: 'default',
  },
  elements: {
    avatar: {
      ...defaultAvatarStyle,
      size: 95,
      borderRadius: 48,
      border: { width: 4, style: 'solid', color: '#CD853F' },
      shadow: {
        enabled: true,
        x: 2,
        y: 2,
        blur: 8,
        spread: 0,
        color: '#8B4513',
        opacity: 0.4
      }
    },
    name: {
      fontFamily: 'Playfair Display',
      fontSize: 28,
      fontWeight: 700,
      lineHeight: 1.2,
      letterSpacing: 0.5,
      textAlign: 'center',
      color: '#F5DEB3',
      padding: defaultPadding,
      margin: { ...defaultMargin, top: 18 }
    },
    bio: {
      fontFamily: 'Crimson Text',
      fontSize: 16,
      fontWeight: 400,
      lineHeight: 1.6,
      letterSpacing: 0.2,
      textAlign: 'center',
      color: 'rgba(245,222,179,0.9)',
      padding: { top: 5, right: 25, bottom: 5, left: 25 },
      margin: { ...defaultMargin, top: 12 }
    }
  },
  spacing: {
    containerPadding: { top: 35, right: 25, bottom: 35, left: 25 },
    elementSpacing: 14
  }
};

// Preset Futurista (usa la variante 'ticket' por defecto y paleta fría)
const futuristicDesign: ProfileDesign = {
  layout: {
    direction: 'column',
    alignment: {
      horizontal: 'center',
      vertical: 'center'
    },
    order: [
      { id: 'name', enabled: true, order: 0 },
      { id: 'avatar', enabled: true, order: 1 },
      { id: 'bio', enabled: true, order: 2 }
    ]
  },
  container: {
    backgroundColor: '#0a0a0a',
    border: { width: 1, style: 'solid', color: '#1a1a1a' },
    borderRadius: 24,
    variant: 'ticket',
  },
  content: {
    ticket: {
      eventTitle: 'ART OF VICTORY',
      dateText: 'MONDAY, JULY 23',
      timeText: '9:00 - 10:00',
      attendeeName: 'Anna Jordan',
      attendeeEmail: 'anna.jordan@email.com',
      ctaPrimary: 'Your Tickets',
      ctaSecondary: 'Get Directions',
      primaryColor: '#00e0ff',
      frameBgColor: '#0a0a0a',
      textColor: '#0a0a0a',
      dockBgColor: 'rgba(255,255,255,0.08)'
    }
  },
  elements: {
    avatar: {
      ...defaultAvatarStyle,
      size: 84,
      borderRadius: 12,
      border: { width: 2, style: 'solid', color: '#00e0ff' },
      shadow: {
        enabled: true,
        x: 0,
        y: 4,
        blur: 15,
        spread: 0,
        color: '#00e0ff',
        opacity: 0.3
      }
    },
    name: {
      fontFamily: 'JetBrains Mono',
      fontSize: 22,
      fontWeight: 700,
      lineHeight: 1.1,
      letterSpacing: 2,
      textAlign: 'center',
      color: '#00e0ff',
      padding: defaultPadding,
      margin: { ...defaultMargin, top: 0, bottom: 20 }
    },
    bio: {
      fontFamily: 'Inter',
      fontSize: 12,
      fontWeight: 300,
      lineHeight: 1.5,
      letterSpacing: 1.5,
      textAlign: 'center',
      color: '#94a3b8',
      padding: { top: 0, right: 30, bottom: 0, left: 30 },
      margin: { ...defaultMargin, top: 15 }
    }
  },
  spacing: {
    containerPadding: { top: 30, right: 30, bottom: 30, left: 30 },
    elementSpacing: 10
  }
};

// Preset Elegante
const elegantDesign: ProfileDesign = {
  layout: {
    direction: 'row',
    alignment: {
      horizontal: 'left',
      vertical: 'center'
    },
    order: [
      { id: 'avatar', enabled: true, order: 0 },
      { id: 'name', enabled: true, order: 1 },
      { id: 'bio', enabled: true, order: 2 }
    ]
  },
  container: {
    backgroundColor: 'rgba(17,24,39,0.9)',
    border: { width: 1, style: 'solid', color: 'rgba(156,163,175,0.3)' },
    borderRadius: 24,
    variant: 'default',
  },
  elements: {
    avatar: {
      ...defaultAvatarStyle,
      size: 120,
      borderRadius: 60,
      border: { width: 3, style: 'solid', color: '#d4af37' },
      shadow: {
        enabled: true,
        x: 0,
        y: 8,
        blur: 25,
        spread: 0,
        color: '#000000',
        opacity: 0.3
      }
    },
    name: {
      fontFamily: 'Cormorant Garamond',
      fontSize: 32,
      fontWeight: 600,
      lineHeight: 1.1,
      letterSpacing: -0.5,
      textAlign: 'left',
      color: '#d4af37',
      padding: { top: 0, right: 0, bottom: 0, left: 25 },
      margin: defaultMargin
    },
    bio: {
      fontFamily: 'Lato',
      fontSize: 16,
      fontWeight: 300,
      lineHeight: 1.5,
      letterSpacing: 0.3,
      textAlign: 'left',
      color: 'rgba(209,213,219,0.9)',
      padding: { top: 5, right: 20, bottom: 5, left: 25 },
      margin: { ...defaultMargin, top: 8 }
    }
  },
  spacing: {
    containerPadding: { top: 30, right: 30, bottom: 30, left: 30 },
    elementSpacing: 0
  }
};

// Preset Minimalista Oscuro
const darkMinimalDesign: ProfileDesign = {
  layout: {
    direction: 'column',
    alignment: {
      horizontal: 'center',
      vertical: 'center'
    },
    order: [
      { id: 'avatar', enabled: true, order: 0 },
      { id: 'name', enabled: true, order: 1 },
      { id: 'bio', enabled: true, order: 2 }
    ]
  },
  container: {
    backgroundColor: 'rgba(0,0,0,0.8)',
    border: { width: 0, style: 'none', color: 'transparent' },
    borderRadius: 32,
    variant: 'default',
  },
  elements: {
    avatar: {
      ...defaultAvatarStyle,
      size: 90,
      borderRadius: 45,
      border: { width: 1, style: 'solid', color: 'rgba(255,255,255,0.1)' },
      shadow: {
        enabled: false,
        x: 0,
        y: 0,
        blur: 0,
        spread: 0,
        color: '#000000',
        opacity: 0
      }
    },
    name: {
      fontFamily: 'Inter',
      fontSize: 22,
      fontWeight: 500,
      lineHeight: 1.3,
      letterSpacing: -0.2,
      textAlign: 'center',
      color: '#ffffff',
      padding: defaultPadding,
      margin: { ...defaultMargin, top: 16 }
    },
    bio: {
      fontFamily: 'Inter',
      fontSize: 14,
      fontWeight: 400,
      lineHeight: 1.5,
      letterSpacing: 0,
      textAlign: 'center',
      color: 'rgba(255,255,255,0.6)',
      padding: { top: 0, right: 20, bottom: 0, left: 20 },
      margin: { ...defaultMargin, top: 8 }
    }
  },
  spacing: {
    containerPadding: { top: 40, right: 30, bottom: 40, left: 30 },
    elementSpacing: 8
  }
};

export const profileDesignPresets: ProfileDesignPreset[] = [
  {
    id: 'minimal',
    name: 'Minimalista',
    description: 'Diseño limpio y simple con elementos centrados',
    category: 'minimal',
    preview: '/presets/minimal-preview.png',
    design: minimalDesign
  },
  {
    id: 'dark-minimal',
    name: 'Minimalista Oscuro',
    description: 'Versión oscura del diseño minimalista',
    category: 'minimal',
    preview: '/presets/dark-minimal-preview.png',
    design: darkMinimalDesign
  },
  {
    id: 'modern',
    name: 'Moderno',
    description: 'Estilo contemporáneo con sombras y tipografía bold',
    category: 'modern',
    preview: '/presets/modern-preview.png',
    design: modernDesign
  },
  {
    id: 'classic',
    name: 'Clásico',
    description: 'Diseño elegante con tipografías serif tradicionales',
    category: 'classic',
    preview: '/presets/classic-preview.png',
    design: classicDesign
  },
  {
    id: 'vintage',
    name: 'Vintage',
    description: 'Estilo retro con colores cálidos y tipografías clásicas',
    category: 'classic',
    preview: '/presets/vintage-preview.png',
    design: vintageDesign
  },
  {
    id: 'creative',
    name: 'Creativo',
    description: 'Layout asimétrico con elementos desalineados',
    category: 'creative',
    preview: '/presets/creative-preview.png',
    design: creativeDesign
  },
  {
    id: 'neon',
    name: 'Neón',
    description: 'Estilo cyberpunk con colores brillantes y efectos de luz',
    category: 'creative',
    preview: '/presets/neon-preview.png',
    design: neonDesign
  },
  {
    id: 'futuristic',
    name: 'Futurista',
    description: 'Diseño tech con tipografías monospace y colores fríos',
    category: 'creative',
    preview: '/presets/futuristic-preview.png',
    design: futuristicDesign
  },
  {
    id: 'professional',
    name: 'Profesional',
    description: 'Estilo corporativo con tipografías San Francisco',
    category: 'professional',
    preview: '/presets/professional-preview.png',
    design: professionalDesign
  },
  {
    id: 'elegant',
    name: 'Elegante',
    description: 'Diseño sofisticado con layout horizontal y detalles dorados',
    category: 'professional',
    preview: '/presets/elegant-preview.png',
    design: elegantDesign
  }
];

// Función helper para obtener preset por ID
export const getPresetById = (id: string): ProfileDesignPreset | undefined => {
  return profileDesignPresets.find(preset => preset.id === id);
};

// Función helper para obtener presets por categoría
export const getPresetsByCategory = (category: string): ProfileDesignPreset[] => {
  return profileDesignPresets.filter(preset => preset.category === category);
};

// Función helper para obtener todas las categorías disponibles
export const getPresetCategories = (): string[] => {
  const categories = [...new Set(profileDesignPresets.map(preset => preset.category))];
  return categories.sort();
};

// Función helper para obtener configuración por defecto
export const getDefaultProfileDesign = (): ProfileDesign => {
  return minimalDesign;
};