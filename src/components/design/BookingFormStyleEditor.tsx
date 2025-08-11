import React from 'react';
import { UltimateColorPicker } from './UltimateColorPicker';

export interface BookingFormStyle {
  theme: 'ios' | 'material' | 'minimal';
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  textColor: string;
  stepTexts: {
    step1: string;
    step2: string;
    step3: string;
    step4: string;
  };
  stepIndicator: {
    backgroundColor: string;
    textColor: string;
    completedColor: string;
    borderRadius: number;
    showIcons: boolean;
    style: 'circle' | 'square' | 'pill';
  };
  fields: {
    backgroundColor: string;
    borderColor: string;
    focusColor: string;
    borderRadius: number;
    padding: number;
  };
  buttons: {
    primaryBackground: string;
    primaryText: string;
    secondaryBackground: string;
    secondaryText: string;
    borderRadius: number;
    padding: number;
  };
  layout: {
    maxWidth: number;
    spacing: number;
    cardElevation: number;
  };
  effects: {
    enableAnimations: boolean;
    enableShadows: boolean;
    enableGradients: boolean;
  };
}

export const getDefaultBookingFormStyle = (): BookingFormStyle => ({
  theme: 'ios',
  primaryColor: '#007AFF',
  secondaryColor: '#34C759',
  backgroundColor: '#FFFFFF',
  textColor: '#000000',
  stepTexts: {
    step1: 'Selecciona servicio',
    step2: 'Elige fecha y hora',
    step3: 'Ingresa tus datos',
    step4: 'Confirma reserva'
  },
  stepIndicator: {
    backgroundColor: '#F2F2F7',
    textColor: '#007AFF',
    completedColor: '#34C759',
    borderRadius: 8,
    showIcons: true,
    style: 'circle'
  },
  fields: {
    backgroundColor: '#FFFFFF',
    borderColor: '#C6C6C8',
    focusColor: '#007AFF',
    borderRadius: 8,
    padding: 12
  },
  buttons: {
    primaryBackground: '#007AFF',
    primaryText: '#FFFFFF',
    secondaryBackground: '#F2F2F7',
    secondaryText: '#007AFF',
    borderRadius: 8,
    padding: 12
  },
  layout: {
    maxWidth: 600,
    spacing: 16,
    cardElevation: 2
  },
  effects: {
    enableAnimations: true,
    enableShadows: true,
    enableGradients: false
  }
});

interface BookingFormStyleEditorProps {
  formStyle: BookingFormStyle;
  onStyleChange: (style: BookingFormStyle) => void;
}

export const BookingFormStyleEditor: React.FC<BookingFormStyleEditorProps> = ({
  formStyle,
  onStyleChange
}) => {
  const updateStyle = (updates: Partial<BookingFormStyle>) => {
    onStyleChange({ ...formStyle, ...updates });
  };

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">Personalización del Formulario</h3>
      
      {/* Theme Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Tema del Formulario
        </label>
        <select
          value={formStyle.theme}
          onChange={(e) => updateStyle({ theme: e.target.value as any })}
          className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          <option value="ios">iOS Style</option>
          <option value="material">Material Design</option>
          <option value="minimal">Minimalista</option>
        </select>
      </div>

      {/* Colors */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Color Primario
          </label>
          <UltimateColorPicker
            color={formStyle.primaryColor}
            onChange={(color) => updateStyle({ primaryColor: color })}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Color Secundario
          </label>
          <UltimateColorPicker
            color={formStyle.secondaryColor}
            onChange={(color) => updateStyle({ secondaryColor: color })}
          />
        </div>
      </div>
    </div>
  );
};