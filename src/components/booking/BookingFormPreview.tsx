import React from 'react';
import { AdvancedBookingCalendar } from './AdvancedBookingCalendar';
import { BookingFormStyle } from '../design/BookingFormStyleEditor';

interface BookingFormPreviewProps {
  services: any[];
  theme: any;
  formStyle?: BookingFormStyle;
  onBookingSubmit?: (booking: any) => void;
}

const defaultFormStyle: BookingFormStyle = {
  theme: 'ios',
  primaryColor: '#3B82F6',
  secondaryColor: '#8B5CF6',
  backgroundColor: '#FFFFFF',
  textColor: '#1F2937',
  
  stepIndicator: {
    backgroundColor: '#F3F4F6',
    textColor: '#6B7280',
    completedColor: '#10B981',
    borderRadius: 12,
    showIcons: true,
    style: 'circle'
  },
  
  buttons: {
    style: 'rounded',
    backgroundColor: '#3B82F6',
    textColor: '#FFFFFF',
    borderColor: 'transparent',
    borderWidth: 0,
    borderRadius: 12,
    shadow: true,
    shadowColor: '#3B82F6',
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
    selectedDayColor: '#3B82F6',
    todayColor: '#2563EB',
    disabledDayColor: '#D1D5DB',
    borderRadius: 12,
    spacing: 4
  },
  
  timeSlots: {
    backgroundColor: '#F9FAFB',
    textColor: '#6B7280',
    selectedColor: '#3B82F6',
    borderColor: '#E5E7EB',
    borderRadius: 12,
    spacing: 12,
    hoverEffect: 'scale'
  },
  
  form: {
    inputBackgroundColor: '#FFFFFF',
    inputTextColor: '#1F2937',
    inputBorderColor: '#D1D5DB',
    inputBorderWidth: 1,
    inputBorderRadius: 12,
    labelColor: '#374151',
    placeholderColor: '#9CA3AF',
    focusBorderColor: '#3B82F6',
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
};

export const BookingFormPreview: React.FC<BookingFormPreviewProps> = ({
  services = [],
  theme,
  formStyle,
  onBookingSubmit
}) => {
  // Servicios de ejemplo si no hay servicios
  const exampleServices = services.length > 0 ? services : [
    {
      id: '1',
      name: 'Consulta General',
      description: 'Consulta inicial de 30 minutos para evaluar tus necesidades',
      duration: 30,
      price: 50,
      isActive: true
    },
    {
      id: '2',
      name: 'Sesión Completa',
      description: 'Sesión completa de 60 minutos con análisis detallado',
      duration: 60,
      price: 90,
      isActive: true
    },
    {
      id: '3',
      name: 'Seguimiento',
      description: 'Sesión de seguimiento de 15 minutos',
      duration: 15,
      price: 25,
      isActive: true
    }
  ];

  const handleBookingSubmit = (bookingData: any) => {
    console.log('Booking submitted:', bookingData);
    if (onBookingSubmit) {
      onBookingSubmit(bookingData);
    } else {
      // Mostrar mensaje de confirmación por defecto
      alert(`¡Reserva confirmada!\n\nServicio: ${bookingData.serviceId}\nFecha: ${bookingData.date}\nHora: ${bookingData.time}\nNombre: ${bookingData.clientName}\nEmail: ${bookingData.clientEmail}`);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100 p-4">
      <AdvancedBookingCalendar
        services={exampleServices}
        onBookingSubmit={handleBookingSubmit}
        theme={theme}
        formStyle={formStyle || defaultFormStyle}
      />
    </div>
  );
};