import React from 'react';
import { BookingFormStyle } from './BookingFormStyleEditor';

export interface BookingFormTemplate {
  id: string;
  name: string;
  description: string;
  style: BookingFormStyle;
  preview: string;
}

export const getBookingFormTemplates = (): BookingFormTemplate[] => [
  {
    id: 'ios-default',
    name: 'iOS Clásico',
    description: 'Diseño limpio inspirado en iOS',
    preview: '/templates/ios-default.jpg',
    style: {
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
    }
  }
];

interface BookingFormTemplatesProps {
  onTemplateSelect: (template: BookingFormTemplate) => void;
}

export const BookingFormTemplates: React.FC<BookingFormTemplatesProps> = ({
  onTemplateSelect
}) => {
  const templates = getBookingFormTemplates();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {templates.map((template) => (
        <div
          key={template.id}
          className="border border-gray-200 rounded-lg p-4 hover:shadow-md cursor-pointer"
          onClick={() => onTemplateSelect(template)}
        >
          <h3 className="font-semibold text-gray-900 mb-2">{template.name}</h3>
          <p className="text-sm text-gray-600 mb-4">{template.description}</p>
          <button className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600">
            Usar Template
          </button>
        </div>
      ))}
    </div>
  );
};