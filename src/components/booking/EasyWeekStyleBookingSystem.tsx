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
  Star,
  Sparkles,
  Zap,
  ChevronRight,
  Plus,
  Minus,
  Heart,
  Award,
  Shield,
  TrendingUp
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { IntelligentCalendar } from './IntelligentCalendar';
import { AdvancedBookingsService, AdvancedBookingData } from '@/services/advancedBookings';

interface Service {
  id: string;
  name: string;
  description: string;
  duration: number;
  price: number;
  isActive: boolean;
  category?: string;
  icon?: string;
  rating?: number;
  reviewCount?: number;
  isPopular?: boolean;
  originalPrice?: number;
}

interface EasyWeekStyleBookingSystemProps {
  cardId: string;
  services: Service[];
  onBookingComplete: (booking: AdvancedBookingData) => void;
  onBookingError: (error: string) => void;
  userEmail?: string;
  cardOwnerEmail: string;
  cardTitle: string;
  businessInfo: {
    name: string;
    address?: string;
    phone?: string;
    rating?: number;
    reviewCount?: number;
  };
  className?: string;
}

type BookingStep = 'services' | 'datetime' | 'details' | 'confirmation' | 'success';

interface BookingDetails {
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  notes: string;
}

const fadeInUp = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -30 },
  transition: { duration: 0.4, ease: "easeOut" }
};

const slideIn = {
  initial: { opacity: 0, x: 50 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -50 },
  transition: { duration: 0.3, ease: "easeOut" }
};

export const EasyWeekStyleBookingSystem: React.FC<EasyWeekStyleBookingSystemProps> = ({
  cardId,
  services,
  onBookingComplete,
  onBookingError,
  userEmail = '',
  cardOwnerEmail,
  cardTitle,
  businessInfo,
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

  // Calcular hora de finalización
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

  const StepIndicator = () => (
    <div className="flex items-center justify-center mb-8">
      <div className="flex items-center space-x-4">
        {['services', 'datetime', 'details', 'confirmation'].map((step, index) => {
          const stepNumber = index + 1;
          const isActive = currentStep === step;
          const isCompleted = getStepProgress() > (stepNumber - 1) * 25;
          
          return (
            <React.Fragment key={step}>
              <motion.div
                className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300 ${
                  isCompleted
                    ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-200'
                    : isActive
                    ? 'bg-emerald-100 text-emerald-600 ring-2 ring-emerald-500'
                    : 'bg-gray-100 text-gray-400'
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {isCompleted && stepNumber < 4 ? (
                  <CheckCircle className="w-5 h-5" />
                ) : (
                  stepNumber
                )}
              </motion.div>
              {index < 3 && (
                <div
                  className={`w-12 h-1 rounded-full transition-all duration-300 ${
                    getStepProgress() > stepNumber * 25 ? 'bg-emerald-500' : 'bg-gray-200'
                  }`}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );

  const BusinessHeader = () => (
    <motion.div 
      className="text-center mb-8 pb-6 border-b border-gray-100"
      {...fadeInUp}
    >
      <div className="flex items-center justify-center mb-3">
        <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg">
          <span className="text-2xl font-bold text-white">
            {businessInfo.name.charAt(0).toUpperCase()}
          </span>
        </div>
      </div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">{businessInfo.name}</h1>
      {businessInfo.address && (
        <div className="flex items-center justify-center text-gray-600 mb-2">
          <MapPin className="w-4 h-4 mr-1" />
          <span className="text-sm">{businessInfo.address}</span>
        </div>
      )}
      {businessInfo.rating && (
        <div className="flex items-center justify-center">
          <div className="flex items-center bg-yellow-50 px-3 py-1 rounded-full">
            <Star className="w-4 h-4 text-yellow-500 mr-1" fill="currentColor" />
            <span className="text-sm font-semibold text-yellow-700">
              {businessInfo.rating}
            </span>
            <span className="text-xs text-gray-500 ml-1">
              ({businessInfo.reviewCount} reseñas)
            </span>
          </div>
        </div>
      )}
    </motion.div>
  );

  const ServiceCard = ({ service, index }: { service: Service; index: number }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.1 }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className="relative group cursor-pointer"
      onClick={() => handleServiceSelect(service)}
    >
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm hover:shadow-xl transition-all duration-300 group-hover:border-emerald-300">
        {service.isPopular && (
          <div className="absolute -top-3 left-6">
            <div className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white px-3 py-1 rounded-full text-xs font-semibold flex items-center">
              <Award className="w-3 h-3 mr-1" />
              Popular
            </div>
          </div>
        )}
        
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center">
            {service.icon && (
              <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center mr-4 group-hover:bg-emerald-100 transition-colors">
                <span className="text-2xl">{service.icon}</span>
              </div>
            )}
            <div>
              <h3 className="font-bold text-lg text-gray-900 group-hover:text-emerald-600 transition-colors">
                {service.name}
              </h3>
              {service.category && (
                <span className="text-sm text-gray-500 bg-gray-50 px-2 py-1 rounded-full">
                  {service.category}
                </span>
              )}
            </div>
          </div>
          
          <div className="text-right">
            <div className="flex items-center mb-1">
              {service.originalPrice && service.originalPrice > service.price && (
                <span className="text-sm text-gray-400 line-through mr-2">
                  €{service.originalPrice}
                </span>
              )}
              <span className="text-2xl font-bold text-emerald-600">
                €{service.price}
              </span>
            </div>
            <div className="text-sm text-gray-500 flex items-center">
              <Clock className="w-4 h-4 mr-1" />
              {service.duration} min
            </div>
          </div>
        </div>

        <p className="text-gray-600 mb-4 text-sm leading-relaxed">
          {service.description}
        </p>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {service.rating && (
              <div className="flex items-center">
                <Star className="w-4 h-4 text-yellow-500 mr-1" fill="currentColor" />
                <span className="text-sm font-medium">{service.rating}</span>
                {service.reviewCount && (
                  <span className="text-xs text-gray-500 ml-1">
                    ({service.reviewCount})
                  </span>
                )}
              </div>
            )}
          </div>
          
          <motion.div
            className="flex items-center text-emerald-600 font-medium group-hover:text-emerald-700"
            whileHover={{ x: 4 }}
          >
            <span className="text-sm mr-2">Reservar</span>
            <ChevronRight className="w-4 h-4" />
          </motion.div>
        </div>
      </div>
    </motion.div>
  );

  return (
    <div className={`max-w-4xl mx-auto bg-gray-50 min-h-screen ${className}`}>
      {/* Header fijo */}
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {currentStep !== 'services' && currentStep !== 'success' && (
              <motion.button
                onClick={handleBack}
                className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
                whileHover={{ x: -2 }}
                whileTap={{ scale: 0.95 }}
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                <span className="font-medium">Volver</span>
              </motion.button>
            )}
            
            <div className="flex-1 text-center">
              {currentStep !== 'success' && <StepIndicator />}
            </div>
            
            <div className="w-20" />
          </div>
          
          {currentStep !== 'success' && (
            <div className="mt-4">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <motion.div 
                  className="h-2 rounded-full bg-gradient-to-r from-emerald-500 to-teal-600"
                  initial={{ width: 0 }}
                  animate={{ width: `${getStepProgress()}%` }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Contenido principal */}
      <div className="px-6 py-8">
        <AnimatePresence mode="wait">
          {/* Paso 1: Selección de servicio */}
          {currentStep === 'services' && (
            <motion.div key="services" {...fadeInUp}>
              <BusinessHeader />
              
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-3">
                  Elige tu servicio
                </h2>
                <p className="text-gray-600 text-lg">
                  Selecciona el servicio que mejor se adapte a tus necesidades
                </p>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                {services.filter(service => service.isActive).map((service, index) => (
                  <ServiceCard key={service.id} service={service} index={index} />
                ))}
              </div>
            </motion.div>
          )}

          {/* Paso 2: Fecha y hora */}
          {currentStep === 'datetime' && selectedService && (
            <motion.div key="datetime" {...fadeInUp}>
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-3">
                  Selecciona fecha y hora
                </h2>
                <p className="text-gray-600">
                  Elige el momento perfecto para tu {selectedService.name.toLowerCase()}
                </p>
              </div>

              {/* Resumen del servicio seleccionado */}
              <motion.div 
                className="bg-white rounded-2xl p-6 mb-8 border border-emerald-200 shadow-sm"
                {...slideIn}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    {selectedService.icon && (
                      <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center mr-4">
                        <span className="text-xl">{selectedService.icon}</span>
                      </div>
                    )}
                    <div>
                      <h3 className="font-semibold text-gray-900 text-lg">{selectedService.name}</h3>
                      <div className="flex items-center text-gray-600 mt-1">
                        <Clock className="w-4 h-4 mr-1" />
                        <span className="text-sm">{selectedService.duration} min</span>
                        <span className="mx-2">•</span>
                        <CreditCard className="w-4 h-4 mr-1" />
                        <span className="text-sm">€{selectedService.price}</span>
                      </div>
                    </div>
                  </div>
                  <motion.button
                    onClick={() => setCurrentStep('services')}
                    className="text-emerald-600 hover:text-emerald-700 font-medium text-sm px-4 py-2 rounded-lg hover:bg-emerald-50 transition-all"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Cambiar servicio
                  </motion.button>
                </div>
              </motion.div>

              {/* Calendario */}
              <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                <IntelligentCalendar
                  cardId={cardId}
                  onDateSelect={setSelectedDate}
                  onTimeSelect={setSelectedTime}
                  selectedDate={selectedDate}
                  selectedTime={selectedTime}
                  theme={{
                    primaryColor: '#10b981',
                    secondaryColor: '#0d9488',
                    textColor: '#111827',
                    backgroundColor: '#ffffff'
                  }}
                />
              </div>

              {/* Resumen de selección */}
              {selectedDate && selectedTime && (
                <motion.div 
                  className="mt-8"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="bg-gradient-to-r from-emerald-50 to-teal-50 p-6 rounded-2xl border border-emerald-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-emerald-900 text-lg">
                          {new Date(selectedDate).toLocaleDateString('es-ES', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </div>
                        <div className="text-emerald-700 mt-1 flex items-center">
                          <Clock className="w-4 h-4 mr-2" />
                          {selectedTime} - {estimatedEndTime}
                        </div>
                      </div>
                      <CheckCircle className="w-8 h-8 text-emerald-600" />
                    </div>
                  </div>

                  <motion.button
                    onClick={handleDateTimeConfirm}
                    className="w-full mt-6 bg-gradient-to-r from-emerald-500 to-teal-600 text-white py-4 px-6 rounded-xl font-semibold text-lg hover:from-emerald-600 hover:to-teal-700 transition-all duration-300 shadow-lg hover:shadow-xl"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Continuar con mis datos
                  </motion.button>
                </motion.div>
              )}
            </motion.div>
          )}

          {/* Paso 3: Detalles del cliente */}
          {currentStep === 'details' && (
            <motion.div key="details" {...fadeInUp}>
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-3">
                  Tus datos de contacto
                </h2>
                <p className="text-gray-600">
                  Necesitamos algunos datos para confirmar tu reserva
                </p>
              </div>

              <div className="bg-white rounded-2xl p-8 shadow-sm max-w-2xl mx-auto">
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      <User className="inline w-4 h-4 mr-2" />
                      Nombre completo *
                    </label>
                    <input
                      type="text"
                      value={bookingDetails.clientName}
                      onChange={(e) => setBookingDetails(prev => ({ ...prev, clientName: e.target.value }))}
                      className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all text-lg"
                      placeholder="Introduce tu nombre completo"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      <Mail className="inline w-4 h-4 mr-2" />
                      Email *
                    </label>
                    <input
                      type="email"
                      value={bookingDetails.clientEmail}
                      onChange={(e) => setBookingDetails(prev => ({ ...prev, clientEmail: e.target.value }))}
                      className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all text-lg"
                      placeholder="tu@email.com"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      <Phone className="inline w-4 h-4 mr-2" />
                      Teléfono (opcional)
                    </label>
                    <input
                      type="tel"
                      value={bookingDetails.clientPhone}
                      onChange={(e) => setBookingDetails(prev => ({ ...prev, clientPhone: e.target.value }))}
                      className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all text-lg"
                      placeholder="+34 600 000 000"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      <MessageSquare className="inline w-4 h-4 mr-2" />
                      Notas adicionales (opcional)
                    </label>
                    <textarea
                      value={bookingDetails.notes}
                      onChange={(e) => setBookingDetails(prev => ({ ...prev, notes: e.target.value }))}
                      className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all resize-none text-lg"
                      rows={4}
                      placeholder="¿Algo que deberíamos saber para preparar tu cita?"
                    />
                  </div>
                </div>

                <motion.button
                  onClick={handleDetailsSubmit}
                  disabled={!bookingDetails.clientName || !bookingDetails.clientEmail}
                  className="w-full mt-8 bg-gradient-to-r from-emerald-500 to-teal-600 text-white py-4 px-6 rounded-xl font-semibold text-lg hover:from-emerald-600 hover:to-teal-700 transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Revisar reserva
                </motion.button>
              </div>
            </motion.div>
          )}

          {/* Paso 4: Confirmación */}
          {currentStep === 'confirmation' && selectedService && (
            <motion.div key="confirmation" {...fadeInUp}>
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-3">
                  Confirma tu reserva
                </h2>
                <p className="text-gray-600">
                  Revisa todos los detalles antes de confirmar
                </p>
              </div>

              <div className="bg-white rounded-2xl p-8 shadow-sm max-w-2xl mx-auto">
                <div className="border-b border-gray-100 pb-6 mb-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                    <Sparkles className="w-5 h-5 mr-2 text-emerald-600" />
                    Resumen de tu reserva
                  </h3>
                  
                  <div className="space-y-4">
                    <div className="flex justify-between items-center py-2">
                      <span className="text-gray-600">Servicio:</span>
                      <span className="font-semibold text-lg">{selectedService.name}</span>
                    </div>
                    
                    <div className="flex justify-between items-center py-2">
                      <span className="text-gray-600">Fecha:</span>
                      <span className="font-semibold">
                        {new Date(selectedDate).toLocaleDateString('es-ES', {
                          weekday: 'long',
                          day: 'numeric',
                          month: 'long'
                        })}
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center py-2">
                      <span className="text-gray-600">Hora:</span>
                      <span className="font-semibold">{selectedTime} - {estimatedEndTime}</span>
                    </div>
                    
                    <div className="flex justify-between items-center py-2">
                      <span className="text-gray-600">Duración:</span>
                      <span className="font-semibold">{selectedService.duration} minutos</span>
                    </div>
                    
                    <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                      <span className="text-xl font-bold text-gray-900">Total:</span>
                      <span className="text-3xl font-bold text-emerald-600">€{selectedService.price}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 p-4 rounded-xl border border-blue-200 mb-6">
                  <div className="flex items-start">
                    <Shield className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
                    <div className="text-sm text-blue-800">
                      <p className="font-medium mb-2">Información importante:</p>
                      <ul className="list-disc list-inside space-y-1 text-sm">
                        <li>Recibirás un email de confirmación</li>
                        <li>Puedes reagendar hasta 24h antes</li>
                        <li>Por favor llega 5 minutos antes</li>
                        <li>Cancela gratis hasta 2 horas antes</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <motion.button
                  onClick={handleBookingConfirm}
                  disabled={isSubmitting}
                  className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 text-white py-4 px-6 rounded-xl font-semibold text-lg hover:from-emerald-600 hover:to-teal-700 transition-all duration-300 shadow-lg hover:shadow-xl flex items-center justify-center disabled:opacity-50"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
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
                </motion.button>
              </div>
            </motion.div>
          )}

          {/* Paso 5: Éxito */}
          {currentStep === 'success' && selectedService && (
            <motion.div key="success" {...fadeInUp}>
              <div className="text-center max-w-2xl mx-auto">
                <motion.div 
                  className="w-24 h-24 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.5, type: "spring", bounce: 0.5 }}
                >
                  <CheckCircle className="w-12 h-12 text-white" />
                </motion.div>
                
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                >
                  <h2 className="text-4xl font-bold text-gray-900 mb-4">
                    ¡Reserva confirmada!
                  </h2>
                  <p className="text-xl text-gray-600 mb-8">
                    Tu reserva ha sido creada exitosamente. Te hemos enviado un email de confirmación.
                  </p>
                </motion.div>

                <motion.div 
                  className="bg-white p-8 rounded-2xl shadow-sm text-left mb-8"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                >
                  <h3 className="font-bold text-gray-900 mb-6 text-center text-lg">
                    Detalles de tu reserva
                  </h3>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <strong>Servicio:</strong> 
                      <span>{selectedService.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <strong>Fecha:</strong> 
                      <span>{new Date(selectedDate).toLocaleDateString('es-ES')}</span>
                    </div>
                    <div className="flex justify-between">
                      <strong>Hora:</strong> 
                      <span>{selectedTime} - {estimatedEndTime}</span>
                    </div>
                    <div className="flex justify-between">
                      <strong>Cliente:</strong> 
                      <span>{bookingDetails.clientName}</span>
                    </div>
                    <div className="flex justify-between">
                      <strong>Email:</strong> 
                      <span>{bookingDetails.clientEmail}</span>
                    </div>
                  </div>
                </motion.div>

                <div className="flex flex-col sm:flex-row gap-4">
                  <motion.button
                    onClick={() => window.location.reload()}
                    className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-600 text-white py-3 px-6 rounded-xl font-semibold hover:from-emerald-600 hover:to-teal-700 transition-all"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Hacer otra reserva
                  </motion.button>
                  <motion.button
                    className="flex-1 bg-white text-emerald-600 py-3 px-6 rounded-xl font-semibold border-2 border-emerald-600 hover:bg-emerald-50 transition-all"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Heart className="w-4 h-4 mr-2 inline" />
                    Compartir experiencia
                  </motion.button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};