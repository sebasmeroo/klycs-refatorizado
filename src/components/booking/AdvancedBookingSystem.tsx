import React, { useState, useEffect } from 'react';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  User, 
  Mail, 
  Phone, 
  MessageSquare, 
  CheckCircle, 
  ArrowLeft,
  CreditCard,
  MapPin,
  Info,
  Sparkles,
  Zap
} from 'lucide-react';
import { IntelligentCalendar } from './IntelligentCalendar';
import { AdvancedBookingsService, AdvancedBookingData } from '@/services/advancedBookings';
import { Button } from '@/components/ui/Button';

interface Service {
  id: string;
  name: string;
  description: string;
  duration: number; // en minutos
  price: number;
  isActive: boolean;
  category?: string;
  icon?: string;
}

interface CardTheme {
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  textColor: string;
  buttonTextColor: string;
  buttonStyle: 'rounded' | 'square' | 'pill';
}

interface AdvancedBookingSystemProps {
  cardId: string;
  services: Service[];
  onBookingComplete: (booking: AdvancedBookingData) => void;
  onBookingError: (error: string) => void;
  theme: CardTheme;
  userEmail?: string;
  cardOwnerEmail: string;
  cardTitle: string;
  className?: string;
}

type BookingStep = 'services' | 'datetime' | 'details' | 'confirmation' | 'success';

interface BookingDetails {
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  notes: string;
}

export const AdvancedBookingSystem: React.FC<AdvancedBookingSystemProps> = ({
  cardId,
  services,
  onBookingComplete,
  onBookingError,
  theme,
  userEmail = '',
  cardOwnerEmail,
  cardTitle,
  className = ''
}) => {
  const [currentStep, setCurrentStep] = useState<BookingStep>('services');
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [bookingDetails, setBookingDetails] = useState<BookingDetails>({
    clientName: '',
    clientEmail: userEmail,
    clientPhone: '',
    notes: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [estimatedEndTime, setEstimatedEndTime] = useState<string>('');

  // Calcular hora de finalización cuando se selecciona servicio y hora
  useEffect(() => {
    if (selectedService && selectedTime) {
      const [hours, minutes] = selectedTime.split(':').map(Number);
      const totalMinutes = hours * 60 + minutes + selectedService.duration;
      const endHours = Math.floor(totalMinutes / 60);
      const endMinutes = totalMinutes % 60;
      setEstimatedEndTime(`${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`);
    }
  }, [selectedService, selectedTime]);

  const handleServiceSelect = (service: Service) => {
    setSelectedService(service);
    setCurrentStep('datetime');
  };

  const handleDateTimeConfirm = () => {
    if (selectedDate && selectedTime) {
      setCurrentStep('details');
    }
  };

  const handleDetailsSubmit = () => {
    if (bookingDetails.clientName && bookingDetails.clientEmail) {
      setCurrentStep('confirmation');
    }
  };

  const handleBookingConfirm = async () => {
    if (!selectedService || !selectedDate || !selectedTime) return;

    setIsSubmitting(true);
    
    try {
      // Calcular hora de finalización
      const [hours, minutes] = selectedTime.split(':').map(Number);
      const totalMinutes = hours * 60 + minutes + selectedService.duration;
      const endHours = Math.floor(totalMinutes / 60);
      const endMinutes = totalMinutes % 60;
      const endTime = `${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`;

      const bookingData = {
        cardId,
        serviceId: selectedService.id,
        serviceName: selectedService.name,
        date: selectedDate,
        startTime: selectedTime,
        endTime: endTime,
        duration: selectedService.duration,
        price: selectedService.price,
        clientName: bookingDetails.clientName,
        clientEmail: bookingDetails.clientEmail,
        clientPhone: bookingDetails.clientPhone,
        notes: bookingDetails.notes
      };

      const result = await AdvancedBookingsService.createAdvancedBooking(bookingData);
      
      if (result.success && result.id) {
        setCurrentStep('success');
        onBookingComplete({
          ...bookingData,
          id: result.id,
          status: 'pending',
          createdAt: new Date() as any,
          updatedAt: new Date() as any
        });
      } else {
        onBookingError(result.error || 'Error al crear la reserva');
      }
    } catch (error) {
      onBookingError('Error inesperado al crear la reserva');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    switch (currentStep) {
      case 'datetime':
        setCurrentStep('services');
        setSelectedService(null);
        break;
      case 'details':
        setCurrentStep('datetime');
        break;
      case 'confirmation':
        setCurrentStep('details');
        break;
    }
  };

  const getStepTitle = () => {
    switch (currentStep) {
      case 'services': return 'Selecciona un servicio';
      case 'datetime': return 'Elige fecha y hora';
      case 'details': return 'Tus datos de contacto';
      case 'confirmation': return 'Confirma tu reserva';
      case 'success': return '¡Reserva confirmada!';
      default: return '';
    }
  };

  const getStepProgress = () => {
    switch (currentStep) {
      case 'services': return 25;
      case 'datetime': return 50;
      case 'details': return 75;
      case 'confirmation': return 90;
      case 'success': return 100;
      default: return 0;
    }
  };

  const buttonStyle = {
    backgroundColor: theme.primaryColor,
    color: theme.buttonTextColor,
    borderRadius: theme.buttonStyle === 'rounded' ? '12px' : 
                   theme.buttonStyle === 'pill' ? '24px' : '6px'
  };

  return (
    <div className={`max-w-2xl mx-auto bg-white rounded-3xl shadow-2xl overflow-hidden ${className}`}>
      {/* Header con progreso */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 border-b border-gray-100">
        <div className="flex items-center justify-between mb-4">
          {currentStep !== 'services' && currentStep !== 'success' && (
            <button
              onClick={handleBack}
              className="p-2 hover:bg-white hover:shadow-md rounded-xl transition-all duration-200"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
          )}
          
          <div className="flex-1 text-center">
            <h2 className="text-xl font-bold text-gray-900 mb-1">
              {getStepTitle()}
            </h2>
            <div className="text-sm text-gray-600">
              Reserva en {cardTitle}
            </div>
          </div>
          
          <div className="w-8" />
        </div>

        {/* Barra de progreso */}
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="h-2 rounded-full transition-all duration-500 ease-out"
            style={{ 
              width: `${getStepProgress()}%`,
              backgroundColor: theme.primaryColor 
            }}
          />
        </div>
      </div>

      <div className="p-6">
        {/* Paso 1: Selección de servicio */}
        {currentStep === 'services' && (
          <div className="space-y-4">
            {services.filter(service => service.isActive).map(service => (
              <button
                key={service.id}
                onClick={() => handleServiceSelect(service)}
                className="w-full p-6 text-left bg-gradient-to-r from-gray-50 to-white hover:from-blue-50 hover:to-indigo-50 rounded-2xl border border-gray-200 hover:border-blue-300 transition-all duration-300 hover:shadow-lg group"
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center">
                    {service.icon && (
                      <span className="text-2xl mr-3">{service.icon}</span>
                    )}
                    <div>
                      <h3 className="font-bold text-lg text-gray-900 group-hover:text-blue-900">
                        {service.name}
                      </h3>
                      {service.category && (
                        <span className="text-sm text-gray-500">{service.category}</span>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-green-600">
                      €{service.price}
                    </div>
                    <div className="text-sm text-gray-500">
                      {service.duration} min
                    </div>
                  </div>
                </div>
                <p className="text-gray-600 mb-3">{service.description}</p>
                <div className="flex items-center text-sm text-gray-500">
                  <Clock className="w-4 h-4 mr-2" />
                  <span>Duración: {service.duration} minutos</span>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Paso 2: Fecha y hora */}
        {currentStep === 'datetime' && selectedService && (
          <div className="space-y-6">
            {/* Resumen del servicio seleccionado */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-2xl border border-blue-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900">{selectedService.name}</h3>
                  <div className="flex items-center text-sm text-gray-600 mt-1">
                    <Clock className="w-4 h-4 mr-1" />
                    {selectedService.duration} min
                    <span className="mx-2">•</span>
                    <CreditCard className="w-4 h-4 mr-1" />
                    €{selectedService.price}
                  </div>
                </div>
                <button
                  onClick={() => setCurrentStep('services')}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  Cambiar
                </button>
              </div>
            </div>

            {/* Calendario inteligente */}
            <IntelligentCalendar
              cardId={cardId}
              onDateSelect={setSelectedDate}
              onTimeSelect={setSelectedTime}
              selectedDate={selectedDate}
              selectedTime={selectedTime}
              theme={theme}
            />

            {/* Resumen de selección */}
            {selectedDate && selectedTime && (
              <div className="bg-green-50 p-4 rounded-2xl border border-green-200">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-green-900">
                      {new Date(selectedDate).toLocaleDateString('es-ES', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </div>
                    <div className="text-green-700 mt-1">
                      {selectedTime} - {estimatedEndTime}
                    </div>
                  </div>
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
              </div>
            )}

            {selectedDate && selectedTime && (
              <Button
                onClick={handleDateTimeConfirm}
                className="w-full py-4 font-semibold text-lg"
                style={buttonStyle}
              >
                Continuar con mis datos
              </Button>
            )}
          </div>
        )}

        {/* Paso 3: Detalles del cliente */}
        {currentStep === 'details' && (
          <div className="space-y-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <User className="inline w-4 h-4 mr-2" />
                  Nombre completo *
                </label>
                <input
                  type="text"
                  value={bookingDetails.clientName}
                  onChange={(e) => setBookingDetails(prev => ({ ...prev, clientName: e.target.value }))}
                  className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                  placeholder="Tu nombre completo"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Mail className="inline w-4 h-4 mr-2" />
                  Email *
                </label>
                <input
                  type="email"
                  value={bookingDetails.clientEmail}
                  onChange={(e) => setBookingDetails(prev => ({ ...prev, clientEmail: e.target.value }))}
                  className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                  placeholder="tu@email.com"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Phone className="inline w-4 h-4 mr-2" />
                  Teléfono (opcional)
                </label>
                <input
                  type="tel"
                  value={bookingDetails.clientPhone}
                  onChange={(e) => setBookingDetails(prev => ({ ...prev, clientPhone: e.target.value }))}
                  className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                  placeholder="+34 600 000 000"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <MessageSquare className="inline w-4 h-4 mr-2" />
                  Notas adicionales (opcional)
                </label>
                <textarea
                  value={bookingDetails.notes}
                  onChange={(e) => setBookingDetails(prev => ({ ...prev, notes: e.target.value }))}
                  className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all resize-none"
                  rows={3}
                  placeholder="Cualquier información adicional que quieras compartir..."
                />
              </div>
            </div>

            <Button
              onClick={handleDetailsSubmit}
              disabled={!bookingDetails.clientName || !bookingDetails.clientEmail}
              className="w-full py-4 font-semibold text-lg disabled:opacity-50 disabled:cursor-not-allowed"
              style={buttonStyle}
            >
              Revisar reserva
            </Button>
          </div>
        )}

        {/* Paso 4: Confirmación */}
        {currentStep === 'confirmation' && selectedService && (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-2xl border border-blue-200">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                <Sparkles className="w-5 h-5 mr-2 text-blue-600" />
                Resumen de tu reserva
              </h3>
              
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Servicio:</span>
                  <span className="font-semibold">{selectedService.name}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Fecha:</span>
                  <span className="font-semibold">
                    {new Date(selectedDate).toLocaleDateString('es-ES', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long'
                    })}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Hora:</span>
                  <span className="font-semibold">{selectedTime} - {estimatedEndTime}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Duración:</span>
                  <span className="font-semibold">{selectedService.duration} minutos</span>
                </div>
                
                <div className="flex justify-between items-center pt-3 border-t border-blue-200">
                  <span className="text-lg font-bold text-gray-900">Total:</span>
                  <span className="text-2xl font-bold text-green-600">€{selectedService.price}</span>
                </div>
              </div>
            </div>

            <div className="bg-yellow-50 p-4 rounded-2xl border border-yellow-200">
              <div className="flex items-start">
                <Info className="w-5 h-5 text-yellow-600 mt-0.5 mr-3 flex-shrink-0" />
                <div className="text-sm text-yellow-800">
                  <p className="font-medium mb-1">Información importante:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Recibirás un email de confirmación</li>
                    <li>Puedes reagendar hasta 24h antes</li>
                    <li>Por favor llega 5 minutos antes</li>
                  </ul>
                </div>
              </div>
            </div>

            <Button
              onClick={handleBookingConfirm}
              disabled={isSubmitting}
              className="w-full py-4 font-semibold text-lg flex items-center justify-center"
              style={buttonStyle}
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                  Confirmando reserva...
                </>
              ) : (
                <>
                  <Zap className="w-5 h-5 mr-2" />
                  Confirmar reserva
                </>
              )}
            </Button>
          </div>
        )}

        {/* Paso 5: Éxito */}
        {currentStep === 'success' && selectedService && (
          <div className="text-center space-y-6">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                ¡Reserva confirmada!
              </h3>
              <p className="text-gray-600">
                Tu reserva ha sido creada exitosamente. Recibirás un email de confirmación en breve.
              </p>
            </div>

            <div className="bg-gray-50 p-6 rounded-2xl text-left">
              <h4 className="font-semibold text-gray-900 mb-3">Detalles de tu reserva:</h4>
              <div className="space-y-2 text-sm">
                <div><strong>Servicio:</strong> {selectedService.name}</div>
                <div><strong>Fecha:</strong> {new Date(selectedDate).toLocaleDateString('es-ES')}</div>
                <div><strong>Hora:</strong> {selectedTime} - {estimatedEndTime}</div>
                <div><strong>Cliente:</strong> {bookingDetails.clientName}</div>
                <div><strong>Email:</strong> {bookingDetails.clientEmail}</div>
              </div>
            </div>

            <Button
              onClick={() => window.location.reload()}
              className="w-full py-3 font-semibold"
              style={{...buttonStyle, backgroundColor: theme.secondaryColor}}
            >
              Hacer otra reserva
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};