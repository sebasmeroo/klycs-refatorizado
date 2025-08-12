import React, { createContext, useContext, useState } from 'react';

export interface BookingTheme {
  id: string;
  name: string;
  style: 'modern' | 'classic' | 'minimal' | 'premium' | 'medical' | 'beauty' | 'fitness';
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    surface: string;
    text: {
      primary: string;
      secondary: string;
      muted: string;
    };
    success: string;
    warning: string;
    error: string;
    info: string;
  };
  typography: {
    fontFamily: string;
    headingWeight: 'normal' | 'medium' | 'semibold' | 'bold' | 'extrabold';
    bodyWeight: 'normal' | 'medium' | 'semibold';
    scale: 'compact' | 'comfortable' | 'spacious';
  };
  layout: {
    borderRadius: 'none' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
    spacing: 'tight' | 'normal' | 'relaxed';
    shadows: 'none' | 'subtle' | 'medium' | 'strong';
    cardStyle: 'flat' | 'outlined' | 'elevated';
  };
  animations: {
    enabled: boolean;
    speed: 'slow' | 'normal' | 'fast';
    style: 'gentle' | 'bouncy' | 'snappy';
  };
  components: {
    buttons: {
      style: 'filled' | 'outlined' | 'ghost' | 'gradient';
      size: 'sm' | 'md' | 'lg';
      fullWidth: boolean;
    };
    inputs: {
      style: 'outlined' | 'filled' | 'underlined';
      size: 'sm' | 'md' | 'lg';
    };
    cards: {
      padding: 'sm' | 'md' | 'lg';
      border: boolean;
    };
  };
}

// Temas predefinidos inspirados en EasyWeek y otros sistemas modernos
export const bookingThemes: BookingTheme[] = [
  {
    id: 'easyweek-modern',
    name: 'EasyWeek Modern',
    style: 'modern',
    colors: {
      primary: '#10b981', // emerald-500
      secondary: '#0d9488', // teal-600
      accent: '#f59e0b', // amber-500
      background: '#f9fafb', // gray-50
      surface: '#ffffff',
      text: {
        primary: '#111827', // gray-900
        secondary: '#4b5563', // gray-600
        muted: '#9ca3af' // gray-400
      },
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444',
      info: '#3b82f6'
    },
    typography: {
      fontFamily: '"Nunito Sans", system-ui, sans-serif',
      headingWeight: 'bold',
      bodyWeight: 'normal',
      scale: 'comfortable'
    },
    layout: {
      borderRadius: 'xl',
      spacing: 'normal',
      shadows: 'medium',
      cardStyle: 'elevated'
    },
    animations: {
      enabled: true,
      speed: 'normal',
      style: 'gentle'
    },
    components: {
      buttons: {
        style: 'gradient',
        size: 'lg',
        fullWidth: true
      },
      inputs: {
        style: 'outlined',
        size: 'lg'
      },
      cards: {
        padding: 'lg',
        border: true
      }
    }
  },
  {
    id: 'medical-clean',
    name: 'Medical Clean',
    style: 'medical',
    colors: {
      primary: '#2563eb', // blue-600
      secondary: '#1e40af', // blue-700
      accent: '#06b6d4', // cyan-500
      background: '#f8fafc', // slate-50
      surface: '#ffffff',
      text: {
        primary: '#0f172a', // slate-900
        secondary: '#475569', // slate-600
        muted: '#94a3b8' // slate-400
      },
      success: '#059669',
      warning: '#d97706',
      error: '#dc2626',
      info: '#0284c7'
    },
    typography: {
      fontFamily: 'Inter, system-ui, sans-serif',
      headingWeight: 'semibold',
      bodyWeight: 'normal',
      scale: 'comfortable'
    },
    layout: {
      borderRadius: 'lg',
      spacing: 'normal',
      shadows: 'subtle',
      cardStyle: 'outlined'
    },
    animations: {
      enabled: true,
      speed: 'normal',
      style: 'gentle'
    },
    components: {
      buttons: {
        style: 'filled',
        size: 'md',
        fullWidth: false
      },
      inputs: {
        style: 'outlined',
        size: 'md'
      },
      cards: {
        padding: 'md',
        border: true
      }
    }
  },
  {
    id: 'beauty-premium',
    name: 'Beauty Premium',
    style: 'beauty',
    colors: {
      primary: '#ec4899', // pink-500
      secondary: '#be185d', // pink-700
      accent: '#f97316', // orange-500
      background: '#fdf2f8', // pink-50
      surface: '#ffffff',
      text: {
        primary: '#881337', // rose-900
        secondary: '#be123c', // rose-700
        muted: '#f43f5e' // rose-500
      },
      success: '#059669',
      warning: '#d97706',
      error: '#dc2626',
      info: '#0284c7'
    },
    typography: {
      fontFamily: 'Playfair Display, serif',
      headingWeight: 'bold',
      bodyWeight: 'normal',
      scale: 'spacious'
    },
    layout: {
      borderRadius: '2xl',
      spacing: 'relaxed',
      shadows: 'strong',
      cardStyle: 'elevated'
    },
    animations: {
      enabled: true,
      speed: 'slow',
      style: 'bouncy'
    },
    components: {
      buttons: {
        style: 'gradient',
        size: 'lg',
        fullWidth: true
      },
      inputs: {
        style: 'filled',
        size: 'lg'
      },
      cards: {
        padding: 'lg',
        border: false
      }
    }
  },
  {
    id: 'fitness-energy',
    name: 'Fitness Energy',
    style: 'fitness',
    colors: {
      primary: '#ea580c', // orange-600
      secondary: '#dc2626', // red-600
      accent: '#eab308', // yellow-500
      background: '#fef3c7', // yellow-100
      surface: '#ffffff',
      text: {
        primary: '#1c1917', // stone-900
        secondary: '#44403c', // stone-700
        muted: '#78716c' // stone-500
      },
      success: '#059669',
      warning: '#d97706',
      error: '#dc2626',
      info: '#0284c7'
    },
    typography: {
      fontFamily: 'Roboto Condensed, sans-serif',
      headingWeight: 'extrabold',
      bodyWeight: 'medium',
      scale: 'compact'
    },
    layout: {
      borderRadius: 'lg',
      spacing: 'tight',
      shadows: 'strong',
      cardStyle: 'elevated'
    },
    animations: {
      enabled: true,
      speed: 'fast',
      style: 'snappy'
    },
    components: {
      buttons: {
        style: 'filled',
        size: 'lg',
        fullWidth: true
      },
      inputs: {
        style: 'outlined',
        size: 'md'
      },
      cards: {
        padding: 'md',
        border: true
      }
    }
  },
  {
    id: 'minimal-zen',
    name: 'Minimal Zen',
    style: 'minimal',
    colors: {
      primary: '#374151', // gray-700
      secondary: '#6b7280', // gray-500
      accent: '#059669', // emerald-600
      background: '#ffffff',
      surface: '#f9fafb', // gray-50
      text: {
        primary: '#111827', // gray-900
        secondary: '#4b5563', // gray-600
        muted: '#9ca3af' // gray-400
      },
      success: '#059669',
      warning: '#d97706',
      error: '#dc2626',
      info: '#0284c7'
    },
    typography: {
      fontFamily: 'Source Sans Pro, sans-serif',
      headingWeight: 'medium',
      bodyWeight: 'normal',
      scale: 'comfortable'
    },
    layout: {
      borderRadius: 'sm',
      spacing: 'normal',
      shadows: 'none',
      cardStyle: 'flat'
    },
    animations: {
      enabled: false,
      speed: 'normal',
      style: 'gentle'
    },
    components: {
      buttons: {
        style: 'outlined',
        size: 'md',
        fullWidth: false
      },
      inputs: {
        style: 'underlined',
        size: 'md'
      },
      cards: {
        padding: 'md',
        border: true
      }
    }
  },
  {
    id: 'premium-luxury',
    name: 'Premium Luxury',
    style: 'premium',
    colors: {
      primary: '#7c3aed', // violet-600
      secondary: '#5b21b6', // violet-800
      accent: '#fbbf24', // amber-400
      background: '#faf5ff', // violet-50
      surface: '#ffffff',
      text: {
        primary: '#581c87', // violet-900
        secondary: '#7c3aed', // violet-600
        muted: '#a78bfa' // violet-400
      },
      success: '#059669',
      warning: '#d97706',
      error: '#dc2626',
      info: '#0284c7'
    },
    typography: {
      fontFamily: 'Poppins, sans-serif',
      headingWeight: 'bold',
      bodyWeight: 'medium',
      scale: 'spacious'
    },
    layout: {
      borderRadius: '2xl',
      spacing: 'relaxed',
      shadows: 'strong',
      cardStyle: 'elevated'
    },
    animations: {
      enabled: true,
      speed: 'slow',
      style: 'bouncy'
    },
    components: {
      buttons: {
        style: 'gradient',
        size: 'lg',
        fullWidth: true
      },
      inputs: {
        style: 'filled',
        size: 'lg'
      },
      cards: {
        padding: 'lg',
        border: false
      }
    }
  }
];

interface BookingThemeContextType {
  currentTheme: BookingTheme;
  setTheme: (themeId: string) => void;
  customizeTheme: (updates: Partial<BookingTheme>) => void;
  availableThemes: BookingTheme[];
}

const BookingThemeContext = createContext<BookingThemeContextType | undefined>(undefined);

export const useBookingTheme = () => {
  const context = useContext(BookingThemeContext);
  if (!context) {
    throw new Error('useBookingTheme must be used within a BookingThemeProvider');
  }
  return context;
};

interface BookingThemeProviderProps {
  children: React.ReactNode;
  initialThemeId?: string;
}

export const BookingThemeProvider: React.FC<BookingThemeProviderProps> = ({
  children,
  initialThemeId = 'easyweek-modern'
}) => {
  const [currentTheme, setCurrentTheme] = useState<BookingTheme>(
    bookingThemes.find(t => t.id === initialThemeId) || bookingThemes[0]
  );

  const setTheme = (themeId: string) => {
    const theme = bookingThemes.find(t => t.id === themeId);
    if (theme) {
      setCurrentTheme(theme);
    }
  };

  const customizeTheme = (updates: Partial<BookingTheme>) => {
    setCurrentTheme(prev => ({
      ...prev,
      ...updates,
      colors: updates.colors ? { ...prev.colors, ...updates.colors } : prev.colors,
      typography: updates.typography ? { ...prev.typography, ...updates.typography } : prev.typography,
      layout: updates.layout ? { ...prev.layout, ...updates.layout } : prev.layout,
      animations: updates.animations ? { ...prev.animations, ...updates.animations } : prev.animations,
      components: updates.components ? { ...prev.components, ...updates.components } : prev.components,
    }));
  };

  return (
    <BookingThemeContext.Provider value={{
      currentTheme,
      setTheme,
      customizeTheme,
      availableThemes: bookingThemes
    }}>
      {children}
    </BookingThemeContext.Provider>
  );
};

// Hook para generar estilos CSS dinámicos basados en el tema
export const useThemeStyles = () => {
  const { currentTheme } = useBookingTheme();

  const getButtonStyles = (variant: 'primary' | 'secondary' | 'outline' = 'primary') => {
    const baseStyles = `
      font-family: ${currentTheme.typography.fontFamily};
      font-weight: ${currentTheme.typography.headingWeight};
      border-radius: ${getBorderRadius()};
      transition: all 0.3s ease;
      ${currentTheme.animations.enabled ? 'transform: translateY(0);' : ''}
    `;

    const sizes = {
      sm: 'px-3 py-2 text-sm',
      md: 'px-4 py-3 text-base',
      lg: 'px-6 py-4 text-lg'
    };

    const size = sizes[currentTheme.components.buttons.size];

    switch (variant) {
      case 'primary':
        if (currentTheme.components.buttons.style === 'gradient') {
          return `${baseStyles} ${size} background: linear-gradient(135deg, ${currentTheme.colors.primary}, ${currentTheme.colors.secondary}); color: white; border: none; ${getShadow()}`;
        }
        return `${baseStyles} ${size} background-color: ${currentTheme.colors.primary}; color: white; border: none; ${getShadow()}`;
      
      case 'secondary':
        return `${baseStyles} ${size} background-color: ${currentTheme.colors.surface}; color: ${currentTheme.colors.primary}; border: 2px solid ${currentTheme.colors.primary};`;
      
      case 'outline':
        return `${baseStyles} ${size} background-color: transparent; color: ${currentTheme.colors.primary}; border: 1px solid ${currentTheme.colors.primary};`;
      
      default:
        return baseStyles;
    }
  };

  const getInputStyles = () => {
    const baseStyles = `
      font-family: ${currentTheme.typography.fontFamily};
      border-radius: ${getBorderRadius()};
      transition: all 0.3s ease;
    `;

    const sizes = {
      sm: 'px-3 py-2 text-sm',
      md: 'px-4 py-3 text-base',
      lg: 'px-4 py-4 text-lg'
    };

    const size = sizes[currentTheme.components.inputs.size];

    switch (currentTheme.components.inputs.style) {
      case 'outlined':
        return `${baseStyles} ${size} border: 1px solid ${currentTheme.colors.text.muted}; background-color: ${currentTheme.colors.surface}; focus:border-color: ${currentTheme.colors.primary}; focus:ring: 2px ${currentTheme.colors.primary}40;`;
      
      case 'filled':
        return `${baseStyles} ${size} border: none; background-color: ${currentTheme.colors.background}; focus:ring: 2px ${currentTheme.colors.primary}40;`;
      
      case 'underlined':
        return `${baseStyles} ${size} border: none; border-bottom: 2px solid ${currentTheme.colors.text.muted}; background-color: transparent; border-radius: 0; focus:border-bottom-color: ${currentTheme.colors.primary};`;
      
      default:
        return baseStyles;
    }
  };

  const getCardStyles = () => {
    const baseStyles = `
      font-family: ${currentTheme.typography.fontFamily};
      border-radius: ${getBorderRadius()};
      background-color: ${currentTheme.colors.surface};
    `;

    const paddings = {
      sm: 'p-4',
      md: 'p-6',
      lg: 'p-8'
    };

    const padding = paddings[currentTheme.components.cards.padding];

    switch (currentTheme.layout.cardStyle) {
      case 'elevated':
        return `${baseStyles} ${padding} ${getShadow()} ${currentTheme.components.cards.border ? `border: 1px solid ${currentTheme.colors.text.muted}20` : 'border: none'};`;
      
      case 'outlined':
        return `${baseStyles} ${padding} border: 1px solid ${currentTheme.colors.text.muted}40; box-shadow: none;`;
      
      case 'flat':
        return `${baseStyles} ${padding} border: none; box-shadow: none;`;
      
      default:
        return baseStyles;
    }
  };

  const getBorderRadius = () => {
    const radiusMap = {
      none: '0',
      sm: '0.25rem',
      md: '0.5rem',
      lg: '0.75rem',
      xl: '1rem',
      '2xl': '1.5rem',
      full: '9999px'
    };
    return radiusMap[currentTheme.layout.borderRadius];
  };

  const getShadow = () => {
    const shadowMap = {
      none: 'box-shadow: none;',
      subtle: 'box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);',
      medium: 'box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);',
      strong: 'box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);'
    };
    return shadowMap[currentTheme.layout.shadows];
  };

  const getSpacing = () => {
    const spacingMap = {
      tight: 'space-y-4',
      normal: 'space-y-6',
      relaxed: 'space-y-8'
    };
    return spacingMap[currentTheme.layout.spacing];
  };

  const getAnimationStyles = () => {
    if (!currentTheme.animations.enabled) return '';

    const durationMap = {
      slow: '0.5s',
      normal: '0.3s',
      fast: '0.15s'
    };

    const easingMap = {
      gentle: 'ease-out',
      bouncy: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
      snappy: 'cubic-bezier(0.4, 0, 0.2, 1)'
    };

    return `
      transition: all ${durationMap[currentTheme.animations.speed]} ${easingMap[currentTheme.animations.style]};
    `;
  };

  return {
    currentTheme,
    getButtonStyles,
    getInputStyles,
    getCardStyles,
    getBorderRadius,
    getShadow,
    getSpacing,
    getAnimationStyles
  };
};

// Componente para seleccionar temas
export const BookingThemeSelector: React.FC<{
  onThemeChange?: (themeId: string) => void;
}> = ({ onThemeChange }) => {
  const { currentTheme, setTheme, availableThemes } = useBookingTheme();

  const handleThemeChange = (themeId: string) => {
    setTheme(themeId);
    onThemeChange?.(themeId);
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">Seleccionar Tema</h3>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {availableThemes.map((theme) => (
          <button
            key={theme.id}
            onClick={() => handleThemeChange(theme.id)}
            className={`p-4 rounded-lg border-2 transition-all ${
              currentTheme.id === theme.id
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex flex-col items-center space-y-2">
              <div 
                className="w-12 h-12 rounded-lg"
                style={{
                  background: `linear-gradient(135deg, ${theme.colors.primary}, ${theme.colors.secondary})`
                }}
              />
              <span className="text-sm font-medium">{theme.name}</span>
              <span className="text-xs text-gray-500 capitalize">{theme.style}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};