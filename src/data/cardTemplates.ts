import { CardTemplate, CardTheme } from '@/types';
import { getDefaultProfileDesign } from './profileDesignPresets';

// Temas predefinidos
export const cardThemes: CardTheme[] = [
  {
    id: 'modern-dark',
    name: 'Moderno Oscuro',
    colors: {
      primary: '#6366f1',
      secondary: '#8b5cf6',
      accent: '#06b6d4',
      background: '#0f172a',
      surface: '#1e293b',
      text: {
        primary: '#f8fafc',
        secondary: '#cbd5e1',
        muted: '#64748b'
      }
    },
    fonts: {
      primary: 'Inter, system-ui, sans-serif',
      secondary: 'Inter, system-ui, sans-serif'
    },
    borderRadius: 'lg',
    spacing: 'normal',
    shadow: 'lg',
    animation: 'smooth'
  },
  {
    id: 'minimalist-light',
    name: 'Minimalista Claro',
    colors: {
      primary: '#1f2937',
      secondary: '#374151',
      accent: '#3b82f6',
      background: '#ffffff',
      surface: '#f9fafb',
      text: {
        primary: '#111827',
        secondary: '#6b7280',
        muted: '#9ca3af'
      }
    },
    fonts: {
      primary: 'system-ui, -apple-system, sans-serif',
      secondary: 'system-ui, -apple-system, sans-serif'
    },
    borderRadius: 'md',
    spacing: 'relaxed',
    shadow: 'sm',
    animation: 'subtle'
  },
  {
    id: 'gradient-purple',
    name: 'Gradiente Morado',
    colors: {
      primary: '#8b5cf6',
      secondary: '#a855f7',
      accent: '#ec4899',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      surface: 'rgba(255, 255, 255, 0.1)',
      text: {
        primary: '#ffffff',
        secondary: '#e2e8f0',
        muted: '#cbd5e1'
      }
    },
    fonts: {
      primary: 'Poppins, sans-serif',
      secondary: 'Poppins, sans-serif'
    },
    borderRadius: 'xl',
    spacing: 'normal',
    shadow: 'xl',
    animation: 'bouncy'
  },
  {
    id: 'neon-cyber',
    name: 'Neon Cyber',
    colors: {
      primary: '#00ffff',
      secondary: '#ff00ff',
      accent: '#ffff00',
      background: '#0a0a0a',
      surface: '#1a1a1a',
      text: {
        primary: '#00ffff',
        secondary: '#ff00ff',
        muted: '#888888'
      }
    },
    fonts: {
      primary: 'JetBrains Mono, monospace',
      secondary: 'JetBrains Mono, monospace'
    },
    borderRadius: 'none',
    spacing: 'compact',
    shadow: 'none',
    animation: 'smooth'
  },
  {
    id: 'warm-sunset',
    name: 'Atardecer Cálido',
    colors: {
      primary: '#f59e0b',
      secondary: '#ef4444',
      accent: '#ec4899',
      background: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
      surface: 'rgba(255, 255, 255, 0.8)',
      text: {
        primary: '#7c2d12',
        secondary: '#9a3412',
        muted: '#a16207'
      }
    },
    fonts: {
      primary: 'Playfair Display, serif',
      secondary: 'Source Sans Pro, sans-serif'
    },
    borderRadius: 'full',
    spacing: 'relaxed',
    shadow: 'md',
    animation: 'subtle'
  },
  {
    id: 'glassmorphism',
    name: 'Glassmorfismo',
    colors: {
      primary: '#6366f1',
      secondary: '#8b5cf6',
      accent: '#06b6d4',
      background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05))',
      surface: 'rgba(255, 255, 255, 0.1)',
      text: {
        primary: '#ffffff',
        secondary: 'rgba(255, 255, 255, 0.8)',
        muted: 'rgba(255, 255, 255, 0.6)'
      }
    },
    fonts: {
      primary: 'SF Pro Display, system-ui, sans-serif',
      secondary: 'SF Pro Text, system-ui, sans-serif'
    },
    borderRadius: 'xl',
    spacing: 'normal',
    shadow: 'lg',
    animation: 'smooth'
  }
];

// Templates predefinidos
export const cardTemplates: CardTemplate[] = [
  {
    id: 'personal-basic',
    name: 'Personal Básico',
    description: 'Perfecto para uso personal con enlaces esenciales',
    category: 'personal',
    preview: '/templates/personal-basic.jpg',
    theme: cardThemes[0], // modern-dark
    defaultLinks: [
      {
        title: 'Instagram',
        url: 'https://instagram.com/tuusuario',
        description: 'Sígueme en Instagram',
        icon: 'Instagram',
        iconType: 'lucide',
        isVisible: true,
        order: 1,
        style: {
          variant: 'solid',
          backgroundColor: '#E4405F',
          textColor: '#ffffff',
          borderRadius: '12px'
        }
      },
      {
        title: 'Twitter',
        url: 'https://twitter.com/tuusuario',
        description: 'Sígueme en Twitter',
        icon: 'Twitter',
        iconType: 'lucide',
        isVisible: true,
        order: 2,
        style: {
          variant: 'solid',
          backgroundColor: '#1DA1F2',
          textColor: '#ffffff',
          borderRadius: '12px'
        }
      },
      {
        title: 'LinkedIn',
        url: 'https://linkedin.com/in/tuusuario',
        description: 'Conecta conmigo profesionalmente',
        icon: 'Linkedin',
        iconType: 'lucide',
        isVisible: true,
        order: 3,
        style: {
          variant: 'solid',
          backgroundColor: '#0A66C2',
          textColor: '#ffffff',
          borderRadius: '12px'
        }
      },
      {
        title: 'Mi Sitio Web',
        url: 'https://tusitio.com',
        description: 'Visita mi sitio web personal',
        icon: 'Globe',
        iconType: 'lucide',
        isVisible: true,
        order: 4,
        style: {
          variant: 'outline',
          borderColor: '#6366f1',
          textColor: '#6366f1',
          borderRadius: '12px'
        }
      }
    ],
    defaultElements: [
      {
        type: 'text',
        content: {
          text: '¡Hola! Soy [Tu Nombre] y este es mi espacio digital. Conecta conmigo a través de mis redes sociales.',
          fontSize: '16px',
          textAlign: 'center'
        },
        isVisible: true,
        order: 1,
        style: {
          textAlign: 'center',
          margin: '20px 0'
        }
      }
    ]
  },
  {
    id: 'business-professional',
    name: 'Profesional de Negocios',
    description: 'Ideal para empresarios y profesionales',
    category: 'business',
    preview: '/templates/business-professional.jpg',
    theme: cardThemes[1], // minimalist-light
    defaultLinks: [
      {
        title: 'Agenda una Reunión',
        url: 'https://calendly.com/tuusuario',
        description: 'Reserva tiempo en mi calendario',
        icon: 'Calendar',
        iconType: 'lucide',
        isVisible: true,
        order: 1,
        style: {
          variant: 'solid',
          backgroundColor: '#3b82f6',
          textColor: '#ffffff',
          borderRadius: '8px'
        }
      },
      {
        title: 'Mi Portafolio',
        url: 'https://tuportafolio.com',
        description: 'Ve mis trabajos y proyectos',
        icon: 'Briefcase',
        iconType: 'lucide',
        isVisible: true,
        order: 2,
        style: {
          variant: 'outline',
          borderColor: '#1f2937',
          textColor: '#1f2937',
          borderRadius: '8px'
        }
      },
      {
        title: 'LinkedIn',
        url: 'https://linkedin.com/in/tuusuario',
        description: 'Red profesional',
        icon: 'Linkedin',
        iconType: 'lucide',
        isVisible: true,
        order: 3,
        style: {
          variant: 'solid',
          backgroundColor: '#0A66C2',
          textColor: '#ffffff',
          borderRadius: '8px'
        }
      },
      {
        title: 'Email',
        url: 'mailto:tu@email.com',
        description: 'Contáctame directamente',
        icon: 'Mail',
        iconType: 'lucide',
        isVisible: true,
        order: 4,
        style: {
          variant: 'ghost',
          textColor: '#374151',
          borderRadius: '8px'
        }
      }
    ],
    defaultElements: [
      {
        type: 'text',
        content: {
          text: 'Especialista en [Tu Área] con más de X años de experiencia ayudando a empresas a alcanzar sus objetivos.',
          fontSize: '18px',
          textAlign: 'center'
        },
        isVisible: true,
        order: 1,
        style: {
          textAlign: 'center',
          margin: '24px 0',
          fontWeight: '500'
        }
      }
    ]
  },
  {
    id: 'creative-artist',
    name: 'Artista Creativo',
    description: 'Para artistas, diseñadores y creativos',
    category: 'creative',
    preview: '/templates/creative-artist.jpg',
    theme: cardThemes[2], // gradient-purple
    defaultLinks: [
      {
        title: 'Mi Arte en Instagram',
        url: 'https://instagram.com/tuarte',
        description: 'Ve mis últimas creaciones',
        icon: 'Palette',
        iconType: 'lucide',
        isVisible: true,
        order: 1,
        style: {
          variant: 'gradient',
          backgroundColor: 'linear-gradient(45deg, #8b5cf6, #ec4899)',
          textColor: '#ffffff',
          borderRadius: '16px'
        }
      },
      {
        title: 'Tienda Online',
        url: 'https://tutienda.com',
        description: 'Compra mis obras',
        icon: 'ShoppingBag',
        iconType: 'lucide',
        isVisible: true,
        order: 2,
        style: {
          variant: 'solid',
          backgroundColor: '#ec4899',
          textColor: '#ffffff',
          borderRadius: '16px'
        }
      },
      {
        title: 'Behance',
        url: 'https://behance.net/tuusuario',
        description: 'Portafolio profesional',
        icon: 'Image',
        iconType: 'lucide',
        isVisible: true,
        order: 3,
        style: {
          variant: 'glassmorphism',
          backgroundColor: 'rgba(255, 255, 255, 0.2)',
          textColor: '#ffffff',
          borderRadius: '16px'
        }
      },
      {
        title: 'Comisiones',
        url: 'https://tucomisiones.com',
        description: 'Encarga tu obra personalizada',
        icon: 'Brush',
        iconType: 'lucide',
        isVisible: true,
        order: 4,
        style: {
          variant: 'outline',
          borderColor: '#ffffff',
          textColor: '#ffffff',
          borderRadius: '16px'
        }
      }
    ],
    defaultElements: [
      {
        type: 'text',
        content: {
          text: '🎨 Artista digital creando mundos de fantasía y emociones a través del color y la forma.',
          fontSize: '16px',
          textAlign: 'center'
        },
        isVisible: true,
        order: 1,
        style: {
          textAlign: 'center',
          margin: '20px 0'
        }
      },
      {
        type: 'divider',
        content: {
          type: 'gradient',
          colors: ['#8b5cf6', '#ec4899']
        },
        isVisible: true,
        order: 2,
        style: {
          margin: '16px 0'
        }
      }
    ]
  },
  {
    id: 'social-influencer',
    name: 'Influencer Social',
    description: 'Para creadores de contenido e influencers',
    category: 'social',
    preview: '/templates/social-influencer.jpg',
    theme: cardThemes[4], // warm-sunset
    defaultLinks: [
      {
        title: 'YouTube',
        url: 'https://youtube.com/c/tucanal',
        description: 'Suscríbete a mi canal',
        icon: 'Play',
        iconType: 'lucide',
        isVisible: true,
        order: 1,
        style: {
          variant: 'solid',
          backgroundColor: '#FF0000',
          textColor: '#ffffff',
          borderRadius: '20px'
        }
      },
      {
        title: 'TikTok',
        url: 'https://tiktok.com/@tuusuario',
        description: 'Sígueme en TikTok',
        icon: 'Music',
        iconType: 'lucide',
        isVisible: true,
        order: 2,
        style: {
          variant: 'solid',
          backgroundColor: '#000000',
          textColor: '#ffffff',
          borderRadius: '20px'
        }
      },
      {
        title: 'Instagram',
        url: 'https://instagram.com/tuusuario',
        description: 'Fotos y stories diarios',
        icon: 'Instagram',
        iconType: 'lucide',
        isVisible: true,
        order: 3,
        style: {
          variant: 'gradient',
          backgroundColor: 'linear-gradient(45deg, #f59e0b, #ef4444, #ec4899)',
          textColor: '#ffffff',
          borderRadius: '20px'
        }
      },
      {
        title: 'Patreon',
        url: 'https://patreon.com/tuusuario',
        description: 'Apoya mi contenido',
        icon: 'Heart',
        iconType: 'lucide',
        isVisible: true,
        order: 4,
        style: {
          variant: 'solid',
          backgroundColor: '#FF424D',
          textColor: '#ffffff',
          borderRadius: '20px'
        }
      }
    ],
    defaultElements: [
      {
        type: 'text',
        content: {
          text: '✨ Creando contenido que inspira y entretiene. ¡Únete a mi comunidad!',
          fontSize: '18px',
          textAlign: 'center'
        },
        isVisible: true,
        order: 1,
        style: {
          textAlign: 'center',
          margin: '20px 0',
          fontWeight: '600'
        }
      }
    ]
  },
  {
    id: 'tech-developer',
    name: 'Desarrollador Tech',
    description: 'Para programadores y profesionales tech',
    category: 'creative',
    preview: '/templates/tech-developer.jpg',
    theme: cardThemes[3], // neon-cyber
    defaultLinks: [
      {
        title: 'GitHub',
        url: 'https://github.com/tuusuario',
        description: 'Ve mi código',
        icon: 'Github',
        iconType: 'lucide',
        isVisible: true,
        order: 1,
        style: {
          variant: 'outline',
          borderColor: '#00ffff',
          textColor: '#00ffff',
          borderRadius: '4px'
        }
      },
      {
        title: 'Stack Overflow',
        url: 'https://stackoverflow.com/users/tuusuario',
        description: 'Mi perfil técnico',
        icon: 'Code',
        iconType: 'lucide',
        isVisible: true,
        order: 2,
        style: {
          variant: 'solid',
          backgroundColor: '#ff00ff',
          textColor: '#000000',
          borderRadius: '4px'
        }
      },
      {
        title: 'LinkedIn',
        url: 'https://linkedin.com/in/tuusuario',
        description: 'Red profesional',
        icon: 'Linkedin',
        iconType: 'lucide',
        isVisible: true,
        order: 3,
        style: {
          variant: 'outline',
          borderColor: '#ffff00',
          textColor: '#ffff00',
          borderRadius: '4px'
        }
      },
      {
        title: 'Mi Blog Tech',
        url: 'https://tublog.dev',
        description: 'Artículos y tutoriales',
        icon: 'BookOpen',
        iconType: 'lucide',
        isVisible: true,
        order: 4,
        style: {
          variant: 'ghost',
          textColor: '#888888',
          borderRadius: '4px'
        }
      }
    ],
    defaultElements: [
      {
        type: 'text',
        content: {
          text: '> Full Stack Developer especializado en [tecnologías]\n> Construyendo el futuro con código',
          fontSize: '14px',
          textAlign: 'left'
        },
        isVisible: true,
        order: 1,
        style: {
          textAlign: 'left',
          margin: '16px 0',
          fontFamily: 'JetBrains Mono, monospace'
        }
      }
    ]
  }
];

// Función helper para generar un slug único
export const generateUniqueSlug = (name: string): string => {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remover acentos
    .replace(/[^a-z0-9\s-]/g, '') // Solo letras, números, espacios y guiones
    .replace(/\s+/g, '-') // Espacios a guiones
    .replace(/-+/g, '-') // Múltiples guiones a uno solo
    .trim()
    .replace(/^-+|-+$/g, '') // Remover guiones al inicio y final
    + '-' + Math.random().toString(36).substr(2, 6); // Agregar sufijo aleatorio
};

// Funciones helper para crear tarjetas desde templates
export const createCardFromTemplate = (template: CardTemplate, userId: string, customTitle?: string) => {
  return {
    userId,
    title: customTitle || template.name,
    description: template.description,
    slug: generateUniqueSlug(customTitle || template.name),
    isPublic: true,
    
    profile: {
      name: 'Tu Nombre',
      bio: '',
      avatar: '',
      backgroundImage: '',
      backgroundType: 'color' as const,
      backgroundColor: template.theme.colors.background,
      backgroundGradient: '',
      design: getDefaultProfileDesign()
    },
    
    links: template.defaultLinks.map((link, index) => ({
      id: `link-${Date.now()}-${index}`,
      ...link,
      analytics: {
        clicks: 0
      }
    })),
    
    elements: template.defaultElements.map((element, index) => ({
      id: `element-${Date.now()}-${index}`,
      ...element
    })),
    
    // ===== NUEVAS SECCIONES =====
    
    // Redes sociales vacías inicialmente
    socialLinks: [],
   
    // Servicios vacíos inicialmente
    services: [],

    portfolio: {
      items: [],
      style: {
        layout: 'grid',
        columns: 2,
        spacing: 'normal',
        aspectRatio: 'auto',
        showTitles: true,
        showDescriptions: false,
        borderRadius: '12px',
        shadow: 'md'
      },
      isVisible: false,
      showTitle: false,
      title: 'Portfolio',
      order: 5
    },
    // Sistema de reservas desactivado inicialmente
    booking: {
      enabled: false,
      title: 'Reserva una Cita',
      description: 'Agenda una reunión conmigo',
      services: [],
      calendar: {
        enabled: false,
        timeSlots: [],
        availability: [],
        blackoutDates: []
      },
      form: {
        fields: [],
        requiresApproval: true,
        autoConfirm: false,
        notification: {
          email: true,
          sms: false
        }
      },
      payment: {
        enabled: false,
        requiresDeposit: false,
        depositAmount: 0
      },
      style: {
        layout: 'inline' as const,
        buttonStyle: {
          variant: 'solid' as const,
          backgroundColor: template.theme.colors.primary,
          textColor: '#ffffff',
          borderRadius: '12px'
        },
        calendarTheme: 'default' as const,
        formStyle: {
          backgroundColor: '#ffffff',
          textColor: '#1f2937',
          borderRadius: '12px',
          spacing: 'normal'
        }
      }
    },
    
    theme: template.theme,
    customCSS: '',
    
    settings: {
      seo: {
        title: customTitle || template.name,
        description: template.description
      },
      analytics: {
        enabled: true,
        trackClicks: true,
        trackViews: true
      },
      sharing: {
        enabled: true,
        allowEmbed: true
      },
      branding: {
        showWatermark: true
      }
    }
  };
};
