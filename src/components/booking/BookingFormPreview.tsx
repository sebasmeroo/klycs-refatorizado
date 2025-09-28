import React from 'react';
import { AdvancedBookingCalendar } from './AdvancedBookingCalendar';
import { BookingFormStyle, getDefaultBookingFormStyle } from '../design/BookingFormStyleEditor';

interface BookingFormPreviewProps {
  services: any[];
  theme: any;
  formStyle?: BookingFormStyle;
  onBookingSubmit?: (booking: any) => void;
}

const defaultFormStyle: BookingFormStyle = getDefaultBookingFormStyle();

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
