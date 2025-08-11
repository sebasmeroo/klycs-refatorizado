import { Card, CardTheme, LayoutModule, CardLink, Service, ContactInfo, SocialLinks, CardLayout } from '@/types';

export interface CardTemplate {
  id: string;
  name: string;
  description: string;
  category: 'business' | 'creative' | 'minimal' | 'modern' | 'luxury';
  coverImage: string;
  theme: CardTheme;
  layout: CardLayout;
  sampleData: {
    basicInfo: {
      fullName: string;
      title: string;
      description: string;
      bio: string;
      avatar?: string;
    };
    links: CardLink[];
    services: Service[];
    contactInfo: ContactInfo;
    socialLinks: SocialLinks;
  };
}

export const cardTemplates: CardTemplate[] = [
  // Business Templates
  {
    id: 'business-executive',
    name: 'Ejecutivo Profesional',
    description: 'Diseño elegante y profesional para ejecutivos y empresarios',
    category: 'business',
    coverImage: '/templates/business-executive.jpg',
    theme: {
      primaryColor: '#1e3c72',
      secondaryColor: '#2a5298',
      backgroundColor: '#000000',
      textColor: '#ffffff',
      buttonTextColor: '#ffffff',
      headingColor: '#ffffff',
      subtitleColor: '#cccccc',
      buttonStyle: 'rounded',
      cardStyle: 'gradient',
      layout: 'centered',
      fontFamily: 'Inter',
      fontSize: 'base',
      fontWeight: 'medium',
    },
    layout: {
      modules: [
        { id: 'profile', type: 'profile', isVisible: true, showTitle: true, order: 0, style: {} },
        { id: 'bio', type: 'bio', isVisible: true, showTitle: true, order: 1, style: {} },
        { id: 'services', type: 'services', isVisible: true, showTitle: true, order: 2, style: {} },
        { id: 'contact', type: 'contact', isVisible: true, showTitle: true, order: 3, style: {} },
        { id: 'social', type: 'social', isVisible: true, showTitle: true, order: 4, style: {} },
        { id: 'links', type: 'links', isVisible: true, showTitle: true, order: 5, style: {} },
        { id: 'portfolio', type: 'portfolio', isVisible: false, showTitle: true, order: 6, style: {} },
        { id: 'booking', type: 'booking', isVisible: false, showTitle: true, order: 7, style: {} }
      ]
    },
    sampleData: {
      basicInfo: {
        fullName: 'Juan Pérez',
        title: 'Director General',
        description: 'Líder empresarial especializado en transformación digital',
        bio: 'Líder empresarial con más de 15 años de experiencia en el sector tecnológico. Especialista en transformación digital y crecimiento empresarial.',
        avatar: '/avatars/business-male.jpg',
      },
      links: [
        { id: '1', title: 'Sitio Web Corporativo', url: 'https://empresa.com', icon: 'globe', isActive: true, order: 0, openInNewTab: true },
        { id: '2', title: 'LinkedIn', url: 'https://linkedin.com/in/juanperez', icon: 'linkedin', isActive: true, order: 1, openInNewTab: true },
        { id: '3', title: 'Email Corporativo', url: 'mailto:juan@empresa.com', icon: 'mail', isActive: true, order: 2, openInNewTab: false },
        { id: '4', title: 'Teléfono Directo', url: 'tel:+34600123456', icon: 'phone', isActive: true, order: 3, openInNewTab: false },
      ],
      services: [
        { id: '1', name: 'Consultoría Estratégica', description: 'Análisis y planificación empresarial', price: 200, duration: 60, isActive: true },
        { id: '2', name: 'Mentoring Ejecutivo', description: 'Desarrollo de liderazgo personalizado', price: 150, duration: 45, isActive: true },
      ],
      contactInfo: {
        email: 'juan@empresa.com',
        phone: '+34600123456',
        website: 'https://empresa.com',
        address: 'Madrid, España'
      },
      socialLinks: {
        linkedin: 'https://linkedin.com/in/juanperez',
        twitter: '',
        instagram: '',
        facebook: '',
        youtube: '',
        tiktok: ''
      }
    },
  },
  {
    id: 'business-consultant',
    name: 'Consultor de Negocios',
    description: 'Template profesional para consultores y asesores empresariales',
    category: 'business',
    coverImage: '/templates/business-consultant.jpg',
    theme: {
      background: {
        type: 'gradient',
        color: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      },
      font: {
        family: 'Inter',
        size: 'base',
        weight: 'medium',
      },
      colors: {
        primary: '#667eea',
        secondary: '#764ba2',
        accent: '#8b5cf6',
        text: '#ffffff',
        background: '#1a1a1a',
      },
      buttonStyle: {
        style: 'outline',
        borderRadius: 12,
        shadow: false,
      },
    },
    layout: {
      modules: [
        { id: 'profile', type: 'profile', isVisible: true, showTitle: true, order: 0, style: {} },
        { id: 'bio', type: 'bio', isVisible: true, showTitle: true, order: 1, style: {} },
        { id: 'services', type: 'services', isVisible: true, showTitle: true, order: 2, style: {} },
        { id: 'contact', type: 'contact', isVisible: true, showTitle: true, order: 3, style: {} },
        { id: 'social', type: 'social', isVisible: true, showTitle: true, order: 4, style: {} },
        { id: 'links', type: 'links', isVisible: true, showTitle: true, order: 5, style: {} },
        { id: 'portfolio', type: 'portfolio', isVisible: false, showTitle: true, order: 6, style: {} },
        { id: 'booking', type: 'booking', isVisible: false, showTitle: true, order: 7, style: {} }
      ]
    },
    sampleData: {
      basicInfo: {
        fullName: 'María García',
        title: 'Consultora Estratégica',
        description: 'Ayudo a empresas a optimizar sus procesos y alcanzar sus objetivos de crecimiento mediante estrategias personalizadas.',
        profileImage: '/avatars/business-female.jpg',
      },
      links: [
        { title: 'Portfolio', url: 'https://portfolio.com', type: 'website' },
        { title: 'LinkedIn', url: 'https://linkedin.com/in/mariagarcia', type: 'social' },
        { title: 'Contacto', url: 'mailto:maria@consultora.com', type: 'email' },
      ],
      services: [
        { id: '1', name: 'Auditoría Empresarial', description: 'Análisis integral de la empresa', price: 300, duration: 90, isActive: true },
        { id: '2', name: 'Plan de Negocio', description: 'Desarrollo de estrategia empresarial', price: 500, duration: 120, isActive: true },
      ],
      contactInfo: {
        email: 'maria@consultora.com',
        phone: '+34600654321',
        website: 'https://portfolio.com',
        address: 'Barcelona, España'
      },
      socialLinks: {
        linkedin: 'https://linkedin.com/in/mariagarcia',
        twitter: '',
        instagram: '',
        facebook: '',
        youtube: '',
        tiktok: ''
      }
    },
  },

  // Creative Templates
  {
    id: 'creative-artist',
    name: 'Artista Creativo',
    description: 'Diseño vibrante y expresivo para artistas y creativos',
    category: 'creative',
    coverImage: '/templates/creative-artist.jpg',
    theme: {
      background: {
        type: 'gradient',
        color: 'linear-gradient(135deg, #ff6b6b 0%, #ffa726 100%)',
      },
      font: {
        family: 'Poppins',
        size: 'lg',
        weight: 'normal',
      },
      colors: {
        primary: '#ff6b6b',
        secondary: '#ffa726',
        accent: '#4ecdc4',
        text: '#2c3e50',
        background: '#ffffff',
      },
      buttonStyle: {
        style: 'filled',
        borderRadius: 25,
        shadow: true,
      },
    },
    sampleData: {
      basicInfo: {
        fullName: 'Alex Rodríguez',
        title: 'Artista Visual',
        description: 'Creo arte que inspira y conecta. Especializado en ilustración digital y diseño gráfico con un toque único y personal.',
        profileImage: '/avatars/creative-artist.jpg',
      },
      links: [
        { title: 'Portfolio', url: 'https://behance.net/alex', type: 'website' },
        { title: 'Instagram', url: 'https://instagram.com/alexart', type: 'social' },
        { title: 'Tienda Online', url: 'https://shop.com', type: 'website' },
        { title: 'Contacto', url: 'mailto:alex@arte.com', type: 'email' },
      ],
      services: [
        { name: 'Ilustración Digital', description: 'Creación de ilustraciones personalizadas', price: 80, duration: 120 },
        { name: 'Diseño de Logo', description: 'Diseño de identidad visual única', price: 150, duration: 180 },
      ],
    },
  },
  {
    id: 'creative-photographer',
    name: 'Fotógrafo Profesional',
    description: 'Template elegante para fotógrafos y profesionales visuales',
    category: 'creative',
    coverImage: '/templates/creative-photographer.jpg',
    theme: {
      background: {
        type: 'solid',
        color: '#000000',
      },
      font: {
        family: 'Playfair Display',
        size: 'base',
        weight: 'normal',
      },
      colors: {
        primary: '#000000',
        secondary: '#333333',
        accent: '#c9a96e',
        text: '#ffffff',
        background: '#000000',
      },
      buttonStyle: {
        style: 'outline',
        borderRadius: 4,
        shadow: false,
      },
    },
    sampleData: {
      basicInfo: {
        fullName: 'Sofia Martínez',
        title: 'Fotógrafa de Bodas',
        description: 'Capturo los momentos más especiales con un estilo único y elegante. Especializada en fotografía de bodas y eventos.',
        profileImage: '/avatars/photographer-female.jpg',
      },
      links: [
        { title: 'Portfolio', url: 'https://sofia-foto.com', type: 'website' },
        { title: 'Instagram', url: 'https://instagram.com/sofia_foto', type: 'social' },
        { title: 'Reservar Sesión', url: 'mailto:sofia@foto.com', type: 'email' },
      ],
      services: [
        { name: 'Sesión de Bodas', description: 'Cobertura completa del evento', price: 800, duration: 480 },
        { name: 'Sesión de Pareja', description: 'Fotos románticas y naturales', price: 200, duration: 120 },
      ],
    },
  },

  // Minimal Templates
  {
    id: 'minimal-clean',
    name: 'Minimalista Limpio',
    description: 'Diseño simple y elegante con enfoque en el contenido',
    category: 'minimal',
    coverImage: '/templates/minimal-clean.jpg',
    theme: {
      background: {
        type: 'solid',
        color: '#ffffff',
      },
      font: {
        family: 'Inter',
        size: 'base',
        weight: 'normal',
      },
      colors: {
        primary: '#2c3e50',
        secondary: '#34495e',
        accent: '#3498db',
        text: '#2c3e50',
        background: '#ffffff',
      },
      buttonStyle: {
        style: 'outline',
        borderRadius: 6,
        shadow: false,
      },
    },
    sampleData: {
      basicInfo: {
        fullName: 'Carlos López',
        title: 'Desarrollador Web',
        description: 'Desarrollo aplicaciones web modernas y eficientes. Especializado en React, Node.js y diseño de experiencia de usuario.',
        profileImage: '/avatars/developer-male.jpg',
      },
      links: [
        { title: 'GitHub', url: 'https://github.com/carlos', type: 'website' },
        { title: 'LinkedIn', url: 'https://linkedin.com/in/carlos', type: 'social' },
        { title: 'Email', url: 'mailto:carlos@dev.com', type: 'email' },
      ],
      services: [
        { name: 'Desarrollo Web', description: 'Aplicaciones web personalizadas', price: 100, duration: 60 },
        { name: 'Consultoría Técnica', description: 'Asesoramiento en tecnología', price: 80, duration: 45 },
      ],
    },
  },
  {
    id: 'minimal-modern',
    name: 'Moderno Minimalista',
    description: 'Diseño contemporáneo con líneas limpias y tipografía elegante',
    category: 'minimal',
    coverImage: '/templates/minimal-modern.jpg',
    theme: {
      background: {
        type: 'gradient',
        color: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
      },
      font: {
        family: 'Roboto',
        size: 'base',
        weight: 'light',
      },
      colors: {
        primary: '#4a5568',
        secondary: '#718096',
        accent: '#4299e1',
        text: '#2d3748',
        background: '#ffffff',
      },
      buttonStyle: {
        style: 'filled',
        borderRadius: 8,
        shadow: true,
      },
    },
    sampleData: {
      basicInfo: {
        fullName: 'Ana Fernández',
        title: 'Diseñadora UX/UI',
        description: 'Creo experiencias digitales intuitivas y atractivas. Especializada en investigación de usuarios y prototipado.',
        profileImage: '/avatars/designer-female.jpg',
      },
      links: [
        { title: 'Dribbble', url: 'https://dribbble.com/ana', type: 'website' },
        { title: 'Behance', url: 'https://behance.net/ana', type: 'website' },
        { title: 'LinkedIn', url: 'https://linkedin.com/in/ana', type: 'social' },
      ],
      services: [
        { name: 'Diseño UX/UI', description: 'Diseño de interfaces de usuario', price: 120, duration: 90 },
        { name: 'Prototipado', description: 'Prototipos interactivos', price: 90, duration: 60 },
      ],
    },
  },

  // Modern Templates
  {
    id: 'modern-tech',
    name: 'Tecnología Moderna',
    description: 'Diseño futurista perfecto para profesionales tech',
    category: 'modern',
    coverImage: '/templates/modern-tech.jpg',
    theme: {
      background: {
        type: 'gradient',
        color: 'linear-gradient(135deg, #0f0f23 0%, #1a1a2e 100%)',
      },
      font: {
        family: 'Roboto Mono',
        size: 'base',
        weight: 'normal',
      },
      colors: {
        primary: '#00d4ff',
        secondary: '#0084ff',
        accent: '#7c3aed',
        text: '#ffffff',
        background: '#0f0f23',
      },
      buttonStyle: {
        style: 'filled',
        borderRadius: 12,
        shadow: true,
      },
    },
    sampleData: {
      basicInfo: {
        fullName: 'David Kim',
        title: 'Ingeniero de Software',
        description: 'Desarrollo soluciones tecnológicas innovadoras. Especializado en IA, machine learning y arquitectura de sistemas.',
        profileImage: '/avatars/tech-male.jpg',
      },
      links: [
        { title: 'GitHub', url: 'https://github.com/david', type: 'website' },
        { title: 'Portfolio', url: 'https://davidkim.dev', type: 'website' },
        { title: 'Twitter', url: 'https://twitter.com/davidkim', type: 'social' },
      ],
      services: [
        { name: 'Desarrollo de Software', description: 'Aplicaciones personalizadas', price: 150, duration: 120 },
        { name: 'Consultoría en IA', description: 'Implementación de IA en negocios', price: 200, duration: 90 },
      ],
    },
  },
  {
    id: 'modern-startup',
    name: 'Startup Innovadora',
    description: 'Diseño dinámico para emprendedores y startups',
    category: 'modern',
    coverImage: '/templates/modern-startup.jpg',
    theme: {
      background: {
        type: 'gradient',
        color: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      },
      font: {
        family: 'Poppins',
        size: 'base',
        weight: 'medium',
      },
      colors: {
        primary: '#667eea',
        secondary: '#764ba2',
        accent: '#f093fb',
        text: '#ffffff',
        background: '#1a1a2e',
      },
      buttonStyle: {
        style: 'filled',
        borderRadius: 20,
        shadow: true,
      },
    },
    sampleData: {
      basicInfo: {
        fullName: 'Laura Ruiz',
        title: 'Fundadora & CEO',
        description: 'Emprendedora apasionada por la innovación. Fundé mi startup para revolucionar la forma en que las empresas se conectan con sus clientes.',
        profileImage: '/avatars/startup-female.jpg',
      },
      links: [
        { title: 'Mi Startup', url: 'https://startup.com', type: 'website' },
        { title: 'LinkedIn', url: 'https://linkedin.com/in/laura', type: 'social' },
        { title: 'Pitch Deck', url: 'https://pitch.com', type: 'website' },
      ],
      services: [
        { name: 'Consultoría Startup', description: 'Asesoramiento para emprendedores', price: 120, duration: 60 },
        { name: 'Mentoring', description: 'Mentoría personalizada', price: 80, duration: 45 },
      ],
    },
  },

  // Luxury Templates
  {
    id: 'luxury-premium',
    name: 'Premium Exclusivo',
    description: 'Diseño de lujo para profesionales de alto nivel',
    category: 'luxury',
    coverImage: '/templates/luxury-premium.jpg',
    theme: {
      background: {
        type: 'gradient',
        color: 'linear-gradient(135deg, #1a1a1a 0%, #2c2c2c 100%)',
      },
      font: {
        family: 'Playfair Display',
        size: 'lg',
        weight: 'normal',
      },
      colors: {
        primary: '#c9a96e',
        secondary: '#8b7355',
        accent: '#d4af37',
        text: '#ffffff',
        background: '#1a1a1a',
      },
      buttonStyle: {
        style: 'outline',
        borderRadius: 4,
        shadow: false,
      },
    },
    sampleData: {
      basicInfo: {
        fullName: 'Roberto Alonso',
        title: 'CEO & Fundador',
        description: 'Líder visionario con más de 20 años de experiencia en mercados internacionales. Especializado en inversiones y estrategia corporativa.',
        profileImage: '/avatars/luxury-male.jpg',
      },
      links: [
        { title: 'Corporativo', url: 'https://alonso-corp.com', type: 'website' },
        { title: 'LinkedIn', url: 'https://linkedin.com/in/robertoalonso', type: 'social' },
        { title: 'Contacto Ejecutivo', url: 'mailto:ceo@alonso-corp.com', type: 'email' },
      ],
      services: [
        { name: 'Consultoría Ejecutiva', description: 'Asesoramiento estratégico de alto nivel', price: 500, duration: 120 },
        { name: 'Inversiones', description: 'Análisis de oportunidades de inversión', price: 800, duration: 180 },
      ],
    },
  },
  {
    id: 'luxury-elegant',
    name: 'Elegancia Refinada',
    description: 'Diseño sofisticado para profesionales exclusivos',
    category: 'luxury',
    coverImage: '/templates/luxury-elegant.jpg',
    theme: {
      background: {
        type: 'solid',
        color: '#0a0a0a',
      },
      font: {
        family: 'Cormorant Garamond',
        size: 'base',
        weight: 'normal',
      },
      colors: {
        primary: '#ffffff',
        secondary: '#cccccc',
        accent: '#c9a96e',
        text: '#ffffff',
        background: '#0a0a0a',
      },
      buttonStyle: {
        style: 'outline',
        borderRadius: 0,
        shadow: false,
      },
    },
    sampleData: {
      basicInfo: {
        fullName: 'Isabella Martín',
        title: 'Consultora de Lujo',
        description: 'Especialista en marcas de lujo y experiencias premium. Ayudo a empresas exclusivas a conectar con clientes de alto valor.',
        profileImage: '/avatars/luxury-female.jpg',
      },
      links: [
        { title: 'Portfolio Exclusivo', url: 'https://isabella-luxury.com', type: 'website' },
        { title: 'LinkedIn', url: 'https://linkedin.com/in/isabella', type: 'social' },
        { title: 'Contacto Privado', url: 'mailto:isabella@luxury.com', type: 'email' },
      ],
      services: [
        { name: 'Consultoría de Lujo', description: 'Estrategia para marcas premium', price: 400, duration: 120 },
        { name: 'Branding Exclusivo', description: 'Desarrollo de identidad de lujo', price: 600, duration: 180 },
      ],
    },
  },
];

export const getTemplatesByCategory = (category: CardTemplate['category']) => {
  return cardTemplates.filter(template => template.category === category);
};

export const getTemplateById = (id: string) => {
  return cardTemplates.find(template => template.id === id);
};

// Default layout for templates that don't have one
const defaultLayout = {
  modules: [
    { id: 'profile', type: 'profile', isVisible: true, showTitle: true, order: 0, style: {} },
    { id: 'bio', type: 'bio', isVisible: true, showTitle: true, order: 1, style: {} },
    { id: 'services', type: 'services', isVisible: true, showTitle: true, order: 2, style: {} },
    { id: 'contact', type: 'contact', isVisible: true, showTitle: true, order: 3, style: {} },
    { id: 'social', type: 'social', isVisible: true, showTitle: true, order: 4, style: {} },
    { id: 'links', type: 'links', isVisible: true, showTitle: true, order: 5, style: {} },
    { id: 'portfolio', type: 'portfolio', isVisible: false, showTitle: true, order: 6, style: {} },
    { id: 'booking', type: 'booking', isVisible: false, showTitle: true, order: 7, style: {} }
  ]
};

export const applyTemplate = (template: CardTemplate): Partial<Card> => {
  const { sampleData, theme, layout, id, name } = template;
  
  // Normalize links data
  const normalizedLinks = sampleData.links.map((link, index) => ({
    id: link.id || String(index + 1),
    title: link.title,
    url: link.url,
    icon: link.icon || (link.type === 'email' ? 'mail' : link.type === 'social' ? 'link' : 'globe'),
    isActive: link.isActive !== undefined ? link.isActive : true,
    order: link.order !== undefined ? link.order : index,
    openInNewTab: link.openInNewTab !== undefined ? link.openInNewTab : true
  }));

  // Normalize services data
  const normalizedServices = (sampleData.services || []).map((service, index) => ({
    id: service.id || String(index + 1),
    name: service.name,
    description: service.description,
    price: service.price,
    duration: service.duration,
    isActive: service.isActive !== undefined ? service.isActive : true
  }));

  // Ensure contactInfo and socialLinks exist
  const contactInfo = sampleData.contactInfo || {
    email: '',
    phone: '',
    website: '',
    address: ''
  };

  const socialLinks = sampleData.socialLinks || {
    linkedin: '',
    twitter: '',
    instagram: '',
    facebook: '',
    youtube: '',
    tiktok: ''
  };
  
  return {
    title: name,
    description: sampleData.basicInfo.description,
    coverImage: template.coverImage,
    theme,
    layout: layout || defaultLayout,
    basicInfo: sampleData.basicInfo,
    links: normalizedLinks,
    services: normalizedServices,
    contactInfo,
    socialLinks,
    // Add template reference
    templateId: id,
  };
};