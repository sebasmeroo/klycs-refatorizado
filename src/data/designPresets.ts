import { DesignPreset, ModuleStyle } from '@/types';

export const designPresets: DesignPreset[] = [
  // Spacing Presets
  {
    id: 'spacing-none',
    name: 'Sin espaciado',
    description: 'Elimina todo el espaciado interior y exterior',
    category: 'spacing',
    icon: '⬜',
    style: {
      spacing: {
        padding: { top: 0, right: 0, bottom: 0, left: 0, unit: 'px' },
        margin: { top: 0, right: 0, bottom: 0, left: 0, unit: 'px' },
        gap: { value: 0, unit: 'px' }
      }
    }
  },
  {
    id: 'spacing-compact',
    name: 'Compacto',
    description: 'Espaciado reducido para diseños densos',
    category: 'spacing',
    icon: '📦',
    style: {
      spacing: {
        padding: { top: 8, right: 8, bottom: 8, left: 8, unit: 'px' },
        margin: { top: 4, right: 4, bottom: 4, left: 4, unit: 'px' },
        gap: { value: 4, unit: 'px' }
      }
    }
  },
  {
    id: 'spacing-fullwidth',
    name: 'Ancho completo',
    description: 'Sin espaciado lateral, perfecto para elementos que ocupan todo el ancho',
    category: 'spacing',
    icon: '↔️',
    style: {
      spacing: {
        padding: { top: 16, right: 0, bottom: 16, left: 0, unit: 'px' },
        margin: { top: 0, right: 0, bottom: 0, left: 0, unit: 'px' },
        gap: { value: 0, unit: 'px' }
      },
      layout: {
        width: { type: 'full' },
        height: { type: 'auto' },
        positioning: { type: 'relative' },
        overflow: 'visible',
        zIndex: 0,
        display: 'block'
      }
    }
  },
  {
    id: 'spacing-centered',
    name: 'Centrado',
    description: 'Espaciado equilibrado con contenido centrado',
    category: 'spacing',
    icon: '⚪',
    style: {
      spacing: {
        padding: { top: 24, right: 24, bottom: 24, left: 24, unit: 'px' },
        margin: { top: 16, right: 16, bottom: 16, left: 16, unit: 'px' },
        gap: { value: 12, unit: 'px' }
      },
      layout: {
        width: { type: 'custom', value: 80, unit: '%' },
        height: { type: 'auto' },
        positioning: { type: 'relative' },
        overflow: 'visible',
        zIndex: 0,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center'
      }
    }
  },

  // Border Presets
  {
    id: 'border-none',
    name: 'Sin bordes',
    description: 'Elimina todos los bordes',
    category: 'border',
    icon: '🚫',
    style: {
      border: {
        radius: { topLeft: 0, topRight: 0, bottomLeft: 0, bottomRight: 0, unit: 'px' },
        width: { top: 0, right: 0, bottom: 0, left: 0, unit: 'px' },
        style: 'solid',
        color: 'transparent'
      }
    }
  },
  {
    id: 'border-subtle',
    name: 'Sutil',
    description: 'Bordes ligeros con esquinas redondeadas',
    category: 'border',
    icon: '▢',
    style: {
      border: {
        radius: { topLeft: 8, topRight: 8, bottomLeft: 8, bottomRight: 8, unit: 'px' },
        width: { top: 1, right: 1, bottom: 1, left: 1, unit: 'px' },
        style: 'solid',
        color: '#e2e8f0'
      }
    }
  },
  {
    id: 'border-card',
    name: 'Tarjeta',
    description: 'Estilo de tarjeta con bordes redondeados',
    category: 'border',
    icon: '🎴',
    style: {
      border: {
        radius: { topLeft: 16, topRight: 16, bottomLeft: 16, bottomRight: 16, unit: 'px' },
        width: { top: 1, right: 1, bottom: 1, left: 1, unit: 'px' },
        style: 'solid',
        color: '#334155'
      }
    }
  },
  {
    id: 'border-pill',
    name: 'Píldora',
    description: 'Bordes completamente redondeados',
    category: 'border',
    icon: '💊',
    style: {
      border: {
        radius: { topLeft: 9999, topRight: 9999, bottomLeft: 9999, bottomRight: 9999, unit: 'px' },
        width: { top: 2, right: 2, bottom: 2, left: 2, unit: 'px' },
        style: 'solid',
        color: '#94a3b8'
      }
    }
  },
  {
    id: 'border-sharp',
    name: 'Afilado',
    description: 'Bordes gruesos sin redondear',
    category: 'border',
    icon: '⬛',
    style: {
      border: {
        radius: { topLeft: 0, topRight: 0, bottomLeft: 0, bottomRight: 0, unit: 'px' },
        width: { top: 3, right: 3, bottom: 3, left: 3, unit: 'px' },
        style: 'solid',
        color: '#475569'
      }
    }
  },

  // Layout Presets
  {
    id: 'layout-fullwidth',
    name: 'Ancho completo',
    description: 'Ocupa todo el ancho disponible',
    category: 'layout',
    icon: '↔️',
    style: {
      layout: {
        width: { type: 'full' },
        height: { type: 'auto' },
        positioning: { type: 'relative' },
        overflow: 'visible',
        zIndex: 0,
        display: 'block'
      }
    }
  },
  {
    id: 'layout-centered',
    name: 'Centrado',
    description: 'Contenido centrado con ancho limitado',
    category: 'layout',
    icon: '⚪',
    style: {
      layout: {
        width: { type: 'custom', value: 80, unit: '%' },
        height: { type: 'auto' },
        positioning: { type: 'relative' },
        overflow: 'visible',
        zIndex: 0,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center'
      }
    }
  },
  {
    id: 'layout-flex-row',
    name: 'Fila Flex',
    description: 'Elementos en fila con flexbox',
    category: 'layout',
    icon: '→',
    style: {
      layout: {
        width: { type: 'full' },
        height: { type: 'auto' },
        positioning: { type: 'relative' },
        overflow: 'visible',
        zIndex: 0,
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 16
      }
    }
  },
  {
    id: 'layout-flex-column',
    name: 'Columna Flex',
    description: 'Elementos en columna con flexbox',
    category: 'layout',
    icon: '↓',
    style: {
      layout: {
        width: { type: 'full' },
        height: { type: 'auto' },
        positioning: { type: 'relative' },
        overflow: 'visible',
        zIndex: 0,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-start',
        alignItems: 'stretch',
        gap: 16
      }
    }
  },
  {
    id: 'layout-sticky',
    name: 'Pegado arriba',
    description: 'Se mantiene visible al hacer scroll',
    category: 'layout',
    icon: '📌',
    style: {
      layout: {
        width: { type: 'full' },
        height: { type: 'auto' },
        positioning: { type: 'sticky', top: 0 },
        overflow: 'visible',
        zIndex: 50,
        display: 'block'
      }
    }
  },
  {
    id: 'layout-floating',
    name: 'Flotante',
    description: 'Elemento flotante posicionado absolutamente',
    category: 'layout',
    icon: '🎈',
    style: {
      layout: {
        width: { type: 'custom', value: 200, unit: 'px' },
        height: { type: 'auto' },
        positioning: { type: 'absolute', top: 20, right: 20 },
        overflow: 'visible',
        zIndex: 40,
        display: 'block'
      }
    }
  },

  // Effects Presets
  {
    id: 'effect-none',
    name: 'Sin efectos',
    description: 'Elimina todos los efectos visuales',
    category: 'effects',
    icon: '🚫',
    style: {
      effects: {
        opacity: 1,
        blur: 0,
        brightness: 1,
        contrast: 1,
        saturate: 1,
        hueRotate: 0,
        sepia: 0,
        grayscale: 0
      }
    }
  },
  {
    id: 'effect-subtle',
    name: 'Sutil',
    description: 'Efectos ligeros que mejoran la legibilidad',
    category: 'effects',
    icon: '✨',
    style: {
      effects: {
        opacity: 0.95,
        blur: 0,
        brightness: 1.05,
        contrast: 1.05,
        saturate: 1.1,
        hueRotate: 0,
        sepia: 0,
        grayscale: 0
      }
    }
  },
  {
    id: 'effect-dramatic',
    name: 'Dramático',
    description: 'Efectos intensos para destacar elementos',
    category: 'effects',
    icon: '🎭',
    style: {
      effects: {
        opacity: 1,
        blur: 0,
        brightness: 1.2,
        contrast: 1.3,
        saturate: 1.4,
        hueRotate: 0,
        sepia: 0,
        grayscale: 0
      }
    }
  },
  {
    id: 'effect-vintage',
    name: 'Vintage',
    description: 'Efecto retro con sepia y desaturación',
    category: 'effects',
    icon: '📷',
    style: {
      effects: {
        opacity: 0.9,
        blur: 0,
        brightness: 1.1,
        contrast: 1.2,
        saturate: 0.8,
        hueRotate: 0,
        sepia: 0.3,
        grayscale: 0.1
      }
    }
  },
  {
    id: 'effect-monochrome',
    name: 'Monocromático',
    description: 'Convierte a escala de grises',
    category: 'effects',
    icon: '⚫',
    style: {
      effects: {
        opacity: 1,
        blur: 0,
        brightness: 1,
        contrast: 1.1,
        saturate: 0,
        hueRotate: 0,
        sepia: 0,
        grayscale: 1
      }
    }
  },
  {
    id: 'effect-glass',
    name: 'Cristal',
    description: 'Efecto de cristal con desenfoque de fondo',
    category: 'effects',
    icon: '🔍',
    style: {
      effects: {
        opacity: 0.8,
        blur: 0,
        brightness: 1.1,
        contrast: 1,
        saturate: 1,
        hueRotate: 0,
        sepia: 0,
        grayscale: 0,
        backdrop: {
          blur: 10,
          brightness: 1.1,
          contrast: 1,
          saturate: 1.2
        }
      }
    }
  }
];

export const getPresetsByCategory = (category: DesignPreset['category']) => {
  return designPresets.filter(preset => preset.category === category);
};

export const getPresetById = (id: string) => {
  return designPresets.find(preset => preset.id === id);
};

export const applyPreset = (baseStyle: ModuleStyle, preset: DesignPreset): ModuleStyle => {
  return {
    ...baseStyle,
    ...preset.style
  };
};

// Professional design combinations
export const professionalCombinations = [
  {
    id: 'hero-fullwidth',
    name: 'Hero Full Width',
    description: 'Sección hero que ocupa todo el ancho sin espaciado lateral',
    presets: ['spacing-fullwidth', 'border-none', 'layout-fullwidth']
  },
  {
    id: 'card-elegant',
    name: 'Tarjeta Elegante',
    description: 'Tarjeta con bordes suaves y espaciado equilibrado',
    presets: ['spacing-centered', 'border-card', 'effect-subtle']
  },
  {
    id: 'button-cta',
    name: 'Botón Call-to-Action',
    description: 'Botón destacado para acciones principales',
    presets: ['spacing-compact', 'border-pill', 'effect-dramatic']
  },
  {
    id: 'sidebar-sticky',
    name: 'Barra lateral pegajosa',
    description: 'Barra lateral que se mantiene visible',
    presets: ['spacing-compact', 'border-subtle', 'layout-sticky']
  },
  {
    id: 'gallery-grid',
    name: 'Galería en grilla',
    description: 'Diseño en grilla para mostrar imágenes o contenido',
    presets: ['spacing-none', 'border-none', 'layout-flex-row']
  }
];

export const applyCombination = (baseStyle: ModuleStyle, combinationId: string): ModuleStyle => {
  const combination = professionalCombinations.find(c => c.id === combinationId);
  if (!combination) return baseStyle;

  let resultStyle = baseStyle;
  
  combination.presets.forEach(presetId => {
    const preset = getPresetById(presetId);
    if (preset) {
      resultStyle = applyPreset(resultStyle, preset);
    }
  });

  return resultStyle;
};