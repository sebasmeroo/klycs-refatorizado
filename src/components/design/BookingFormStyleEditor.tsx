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
    step1Title?: string;
    step2Title?: string;
    step3Title?: string;
    step4Title?: string;
    step1Visible?: boolean;
    step2Visible?: boolean;
    step3Visible?: boolean;
    step4Visible?: boolean;
    buttonText?: string;
  };
  stepIndicator: {
    backgroundColor: string;
    textColor: string;
    completedColor: string;
    borderRadius: number;
    showIcons: boolean;
    style: 'circle' | 'square' | 'pill';
  };
  buttons: {
    style: 'rounded' | 'square' | 'pill' | 'custom';
    backgroundColor: string;
    textColor: string;
    borderColor: string;
    borderWidth: number;
    borderRadius: number;
    shadow: boolean;
    shadowColor: string;
    shadowIntensity: number;
    hoverEffect: 'lift' | 'glow' | 'pulse' | 'scale' | 'none';
    hoverColor: string;
    icon?: boolean;
    iconPosition?: 'left' | 'right';
    iconColor?: string;
  };
  serviceCards: {
    backgroundColor: string;
    borderColor: string;
    borderWidth: number;
    borderRadius: number;
    shadow: boolean;
    shadowColor: string;
    textColor: string;
    priceColor: string;
    hoverEffect: 'lift' | 'scale' | 'glow' | 'none';
    spacing: number;
  };
  calendar: {
    backgroundColor: string;
    headerColor: string;
    dayColor: string;
    selectedDayColor: string;
    todayColor: string;
    disabledDayColor: string;
    borderRadius: number;
    spacing: number;
  };
  timeSlots: {
    backgroundColor: string;
    textColor: string;
    selectedColor: string;
    borderColor: string;
    borderRadius: number;
    spacing: number;
    hoverEffect: 'lift' | 'scale' | 'glow' | 'none';
  };
  form: {
    inputBackgroundColor: string;
    inputTextColor: string;
    inputBorderColor: string;
    inputBorderWidth: number;
    inputBorderRadius: number;
    labelColor: string;
    placeholderColor: string;
    focusBorderColor: string;
    spacing: number;
  };
  container: {
    backgroundColor: string;
    borderRadius: number;
    shadow: boolean;
    shadowColor: string;
    shadowIntensity: number;
    borderColor: string;
    borderWidth: number;
    maxWidth: number;
    padding: number;
  };
  effects: {
    backdrop: boolean;
    blur: number;
    gradient: boolean;
    gradientDirection: string;
    animation: 'fadeIn' | 'slideUp' | 'bounce' | 'none';
    transition: number;
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
    step4: 'Confirma reserva',
    step1Title: 'Selecciona un servicio',
    step2Title: 'Fecha',
    step3Title: 'Hora',
    step4Title: 'Tus datos',
    step1Visible: true,
    step2Visible: true,
    step3Visible: true,
    step4Visible: true,
    buttonText: 'Continuar'
  },
  stepIndicator: {
    backgroundColor: '#F2F2F7',
    textColor: '#007AFF',
    completedColor: '#34C759',
    borderRadius: 8,
    showIcons: true,
    style: 'circle'
  },
  buttons: {
    style: 'rounded',
    backgroundColor: '#007AFF',
    textColor: '#FFFFFF',
    borderColor: 'transparent',
    borderWidth: 0,
    borderRadius: 12,
    shadow: true,
    shadowColor: '#007AFF',
    shadowIntensity: 20,
    hoverEffect: 'lift',
    hoverColor: '#2563EB',
    icon: true,
    iconPosition: 'left',
    iconColor: '#FFFFFF'
  },
  serviceCards: {
    backgroundColor: '#F9FAFB',
    borderColor: '#E5E7EB',
    borderWidth: 1,
    borderRadius: 16,
    shadow: false,
    shadowColor: '#000000',
    textColor: '#1F2937',
    priceColor: '#059669',
    hoverEffect: 'lift',
    spacing: 16
  },
  calendar: {
    backgroundColor: '#FFFFFF',
    headerColor: '#1F2937',
    dayColor: '#6B7280',
    selectedDayColor: '#007AFF',
    todayColor: '#2563EB',
    disabledDayColor: '#D1D5DB',
    borderRadius: 12,
    spacing: 4
  },
  timeSlots: {
    backgroundColor: '#F9FAFB',
    textColor: '#6B7280',
    selectedColor: '#007AFF',
    borderColor: '#E5E7EB',
    borderRadius: 12,
    spacing: 12,
    hoverEffect: 'scale'
  },
  form: {
    inputBackgroundColor: '#FFFFFF',
    inputTextColor: '#1F2937',
    inputBorderColor: '#C6C6C8',
    inputBorderWidth: 1,
    inputBorderRadius: 12,
    labelColor: '#374151',
    placeholderColor: '#9CA3AF',
    focusBorderColor: '#007AFF',
    spacing: 16
  },
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    shadow: true,
    shadowColor: '#000000',
    shadowIntensity: 10,
    borderColor: 'transparent',
    borderWidth: 0,
    maxWidth: 448,
    padding: 24
  },
  effects: {
    backdrop: false,
    blur: 0,
    gradient: false,
    gradientDirection: 'to-br',
    animation: 'fadeIn',
    transition: 300
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
