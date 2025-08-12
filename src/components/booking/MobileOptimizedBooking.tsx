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
  ChevronRight,
  Star,
  Award,
  Shield,
  MapPin,
  X,
  Menu,
  ChevronDown,
  Zap
} from 'lucide-react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { useBookingTheme } from './BookingThemeSystem';
import { 
  AnimatedContainer, 
  AnimatedButton, 
  AnimatedCard, 
  AnimatedInput,
  AnimatedStepIndicator 
} from './BookingAnimations';

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

interface MobileOptimizedBookingProps {
  cardId: string;
  services: Service[];
  onBookingComplete: (booking: any) => void;
  onBookingError: (error: string) => void;
  userEmail?: string;
  businessInfo: {
    name: string;
    address?: string;
    phone?: string;
    rating?: number;
    reviewCount?: number;
    image?: string;
  };
  className?: string;
}

type BookingStep = 'services' | 'datetime' | 'details' | 'confirmation' | 'success';

interface TimeSlot {
  time: string;
  available: boolean;
  price?: number;
}

export const MobileOptimizedBooking: React.FC<MobileOptimizedBookingProps> = ({
  cardId,
  services,
  onBookingComplete,
  onBookingError,
  userEmail = '',
  businessInfo,
  className = ''
}) => {
  const { currentTheme } = useBookingTheme();
  const [currentStep, setCurrentStep] = useState<BookingStep>('services');
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [bookingDetails, setBookingDetails] = useState({
    clientName: '',
    clientEmail: userEmail,
    clientPhone: '',
    notes: ''
  });

  // Mock data para el calendario móvil
  const [availableDates] = useState(() => {
    const dates = [];
    const today = new Date();
    for (let i = 0; i < 14; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      dates.push({
        date: date.toISOString().split('T')[0],
        dayName: date.toLocaleDateString('es-ES', { weekday: 'short' }),
        dayNumber: date.getDate(),
        available: Math.random() > 0.3 // 70% de días disponibles
      });
    }
    return dates;
  });

  const [availableTimeSlots] = useState<TimeSlot[]>([
    { time: '09:00', available: true },
    { time: '09:30', available: false },
    { time: '10:00', available: true },
    { time: '10:30', available: true },
    { time: '11:00', available: false },
    { time: '11:30', available: true },
    { time: '12:00', available: true },
    { time: '14:00', available: true },
    { time: '14:30', available: false },
    { time: '15:00', available: true },
    { time: '15:30', available: true },
    { time: '16:00', available: true },
    { time: '16:30', available: false },
    { time: '17:00', available: true }
  ]);

  const handleServiceSelect = (service: Service) => {
    setSelectedService(service);
    setCurrentStep('datetime');
  };

  const handleDateSelect = (date: string) => {
    setSelectedDate(date);
    setShowDatePicker(false);
    setShowTimePicker(true);
  };

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
    setShowTimePicker(false);
  };

  const handleNext = () => {
    switch (currentStep) {
      case 'datetime':
        if (selectedDate && selectedTime) {
          setCurrentStep('details');
        }
        break;
      case 'details':
        if (bookingDetails.clientName && bookingDetails.clientEmail) {
          setCurrentStep('confirmation');
        }
        break;
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

  const handleConfirmBooking = async () => {
    setIsSubmitting(true);
    try {
      // Simular creación de reserva
      await new Promise(resolve => setTimeout(resolve, 2000));
      setCurrentStep('success');
      onBookingComplete({
        service: selectedService,
        date: selectedDate,
        time: selectedTime,
        details: bookingDetails
      });
    } catch (error) {
      onBookingError('Error al crear la reserva');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStepProgress = () => {
    const steps = { services: 25, datetime: 50, details: 75, confirmation: 90, success: 100 };
    return steps[currentStep] || 0;
  };

  // Header móvil
  const MobileHeader = () => (
    <div className="sticky top-0 z-50 bg-white border-b border-gray-100 px-4 py-3">
      <div className="flex items-center justify-between">
        {currentStep !== 'services' && currentStep !== 'success' && (
          <motion.button
            onClick={handleBack}
            className="p-2 -ml-2 rounded-lg hover:bg-gray-100"
            whileTap={{ scale: 0.95 }}
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </motion.button>
        )}
        
        <div className="flex-1 text-center">
          <h1 className="text-lg font-bold text-gray-900 truncate">
            {businessInfo.name}
          </h1>
          {businessInfo.rating && (
            <div className="flex items-center justify-center mt-1">
              <Star className="w-4 h-4 text-yellow-500 mr-1" fill="currentColor" />
              <span className="text-sm text-gray-600">
                {businessInfo.rating} ({businessInfo.reviewCount})
              </span>
            </div>
          )}
        </div>
        
        <div className="w-10" />
      </div>
      
      {currentStep !== 'success' && (
        <div className="mt-3">
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>Paso {['services', 'datetime', 'details', 'confirmation'].indexOf(currentStep) + 1} de 4</span>
            <span>{getStepProgress()}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-1">
            <motion.div 
              className="h-1 rounded-full bg-gradient-to-r from-emerald-500 to-teal-600"
              initial={{ width: 0 }}
              animate={{ width: `${getStepProgress()}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
          </div>
        </div>
      )}
    </div>
  );

  // Selección de servicios optimizada para móvil
  const MobileServiceSelection = () => (
    <div className="p-4 space-y-4">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          ¿Qué servicio necesitas?
        </h2>
        <p className="text-gray-600">
          Elige el servicio perfecto para ti
        </p>
      </div>

      <div className="space-y-3">
        {services.filter(service => service.isActive).map((service, index) => (
          <motion.div
            key={service.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
          >
            <AnimatedCard
              onClick={() => handleServiceSelect(service)}
              className="p-4 relative"
              hover={true}
            >
              {service.isPopular && (
                <div className="absolute -top-2 left-4">
                  <div className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white px-2 py-1 rounded-full text-xs font-semibold flex items-center">
                    <Award className="w-3 h-3 mr-1" />
                    Popular
                  </div>
                </div>
              )}
              
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center mb-2">
                    {service.icon && (
                      <span className="text-2xl mr-3">{service.icon}</span>
                    )}
                    <div>
                      <h3 className="font-bold text-lg text-gray-900">
                        {service.name}
                      </h3>
                      {service.category && (
                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                          {service.category}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                    {service.description}
                  </p>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center text-sm text-gray-500">
                      <Clock className="w-4 h-4 mr-1" />
                      {service.duration} min
                    </div>
                    
                    {service.rating && (
                      <div className="flex items-center text-sm">
                        <Star className="w-4 h-4 text-yellow-500 mr-1" fill="currentColor" />
                        {service.rating}
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="text-right ml-4">
                  {service.originalPrice && service.originalPrice > service.price && (
                    <div className="text-sm text-gray-400 line-through">
                      €{service.originalPrice}
                    </div>
                  )}
                  <div className="text-xl font-bold text-emerald-600">
                    €{service.price}
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400 ml-auto mt-1" />
                </div>
              </div>
            </AnimatedCard>
          </motion.div>
        ))}
      </div>
    </div>
  );

  // Selector de fecha y hora móvil
  const MobileDateTimeSelection = () => (
    <div className="p-4 space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          ¿Cuándo te viene mejor?
        </h2>
        <p className="text-gray-600">
          Selecciona tu fecha y hora preferida
        </p>
      </div>

      {/* Resumen del servicio */}
      {selectedService && (
        <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-emerald-900">{selectedService.name}</h3>
              <div className="flex items-center text-emerald-700 text-sm mt-1">
                <Clock className="w-4 h-4 mr-1" />
                {selectedService.duration} min • €{selectedService.price}
              </div>
            </div>
            <button
              onClick={() => setCurrentStep('services')}
              className="text-emerald-600 text-sm font-medium"
            >
              Cambiar
            </button>
          </div>
        </div>
      )}

      {/* Selector de fecha */}
      <div>
        <h3 className="font-semibold text-gray-900 mb-3">Fecha</h3>
        <button
          onClick={() => setShowDatePicker(true)}
          className="w-full p-4 text-left border border-gray-300 rounded-xl flex items-center justify-between"
        >
          <div className="flex items-center">
            <CalendarIcon className="w-5 h-5 text-gray-400 mr-3" />
            <span className={selectedDate ? 'text-gray-900' : 'text-gray-500'}>
              {selectedDate 
                ? new Date(selectedDate).toLocaleDateString('es-ES', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long'
                  })
                : 'Selecciona una fecha'
              }
            </span>
          </div>
          <ChevronDown className="w-5 h-5 text-gray-400" />
        </button>
      </div>

      {/* Selector de hora */}
      {selectedDate && (
        <div>
          <h3 className="font-semibold text-gray-900 mb-3">Hora</h3>
          <button
            onClick={() => setShowTimePicker(true)}
            className="w-full p-4 text-left border border-gray-300 rounded-xl flex items-center justify-between"
          >
            <div className="flex items-center">
              <Clock className="w-5 h-5 text-gray-400 mr-3" />
              <span className={selectedTime ? 'text-gray-900' : 'text-gray-500'}>
                {selectedTime || 'Selecciona una hora'}
              </span>
            </div>
            <ChevronDown className="w-5 h-5 text-gray-400" />
          </button>
        </div>
      )}

      {/* Botón continuar */}
      {selectedDate && selectedTime && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="pt-4"
        >
          <AnimatedButton
            onClick={handleNext}
            className="w-full"
            size="lg"
          >
            Continuar
          </AnimatedButton>
        </motion.div>
      )}
    </div>
  );

  // Modal de selección de fecha
  const DatePickerModal = () => (
    <AnimatePresence>
      {showDatePicker && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black bg-opacity-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setShowDatePicker(false)}
        >
          <motion.div
            className="w-full max-w-md bg-white rounded-t-3xl p-6 max-h-96 overflow-y-auto"
            initial={{ y: 300 }}
            animate={{ y: 0 }}
            exit={{ y: 300 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">Selecciona fecha</h3>
              <button
                onClick={() => setShowDatePicker(false)}
                className="p-2 rounded-lg hover:bg-gray-100"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              {availableDates.map((dateObj) => (
                <motion.button
                  key={dateObj.date}
                  onClick={() => dateObj.available && handleDateSelect(dateObj.date)}
                  disabled={!dateObj.available}
                  className={`p-3 rounded-xl text-left transition-all ${
                    dateObj.available
                      ? selectedDate === dateObj.date
                        ? 'bg-emerald-500 text-white'
                        : 'bg-gray-50 hover:bg-emerald-50 text-gray-900'
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  }`}
                  whileTap={dateObj.available ? { scale: 0.95 } : {}}
                >
                  <div className="text-xs font-medium">{dateObj.dayName}</div>
                  <div className="text-lg font-bold">{dateObj.dayNumber}</div>
                </motion.button>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  // Modal de selección de hora
  const TimePickerModal = () => (
    <AnimatePresence>
      {showTimePicker && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black bg-opacity-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setShowTimePicker(false)}
        >
          <motion.div
            className="w-full max-w-md bg-white rounded-t-3xl p-6 max-h-96 overflow-y-auto"
            initial={{ y: 300 }}
            animate={{ y: 0 }}
            exit={{ y: 300 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">Selecciona hora</h3>
              <button
                onClick={() => setShowTimePicker(false)}
                className="p-2 rounded-lg hover:bg-gray-100"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            
            <div className="grid grid-cols-3 gap-3">
              {availableTimeSlots.map((slot) => (
                <motion.button
                  key={slot.time}
                  onClick={() => slot.available && handleTimeSelect(slot.time)}
                  disabled={!slot.available}
                  className={`p-3 rounded-xl text-center transition-all ${
                    slot.available
                      ? selectedTime === slot.time
                        ? 'bg-emerald-500 text-white'
                        : 'bg-gray-50 hover:bg-emerald-50 text-gray-900'
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  }`}
                  whileTap={slot.available ? { scale: 0.95 } : {}}
                >
                  <div className="text-sm font-bold">{slot.time}</div>
                </motion.button>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  // Formulario de detalles móvil
  const MobileDetailsForm = () => (
    <div className="p-4 space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Tus datos
        </h2>
        <p className="text-gray-600">
          Solo necesitamos algunos datos para confirmar
        </p>
      </div>

      <div className="space-y-4">
        <AnimatedInput
          placeholder="Nombre completo"
          value={bookingDetails.clientName}
          onChange={(e) => setBookingDetails(prev => ({ ...prev, clientName: e.target.value }))}
          icon={<User className="w-5 h-5" />}
        />
        
        <AnimatedInput
          type="email"
          placeholder="Email"
          value={bookingDetails.clientEmail}
          onChange={(e) => setBookingDetails(prev => ({ ...prev, clientEmail: e.target.value }))}
          icon={<Mail className="w-5 h-5" />}
        />
        
        <AnimatedInput
          type="tel"
          placeholder="Teléfono (opcional)"
          value={bookingDetails.clientPhone}
          onChange={(e) => setBookingDetails(prev => ({ ...prev, clientPhone: e.target.value }))}
          icon={<Phone className="w-5 h-5" />}
        />
        
        <div>
          <textarea
            placeholder="Notas adicionales (opcional)"
            value={bookingDetails.notes}
            onChange={(e) => setBookingDetails(prev => ({ ...prev, notes: e.target.value }))}
            className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all resize-none"
            rows={3}
          />
        </div>
      </div>

      <AnimatedButton
        onClick={handleNext}
        disabled={!bookingDetails.clientName || !bookingDetails.clientEmail}
        className="w-full"
        size="lg"
      >
        Revisar reserva
      </AnimatedButton>
    </div>
  );

  // Confirmación móvil
  const MobileConfirmation = () => (
    <div className="p-4 space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Confirma tu reserva
        </h2>
        <p className="text-gray-600">
          Revisa todos los detalles
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
        <div className="flex justify-between">
          <span className="text-gray-600">Servicio:</span>
          <span className="font-semibold">{selectedService?.name}</span>
        </div>
        
        <div className="flex justify-between">
          <span className="text-gray-600">Fecha:</span>
          <span className="font-semibold">
            {new Date(selectedDate).toLocaleDateString('es-ES', {
              weekday: 'short',
              day: 'numeric',
              month: 'short'
            })}
          </span>
        </div>
        
        <div className="flex justify-between">
          <span className="text-gray-600">Hora:</span>
          <span className="font-semibold">{selectedTime}</span>
        </div>
        
        <div className="flex justify-between border-t pt-4">
          <span className="text-lg font-bold">Total:</span>
          <span className="text-2xl font-bold text-emerald-600">
            €{selectedService?.price}
          </span>
        </div>
      </div>

      <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
        <div className="flex items-start">
          <Shield className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">Políticas de cancelación:</p>
            <ul className="text-xs space-y-1">
              <li>• Cancela gratis hasta 2h antes</li>
              <li>• Confirmaremos tu reserva por email</li>
              <li>• Llega 5 minutos antes</li>
            </ul>
          </div>
        </div>
      </div>

      <AnimatedButton
        onClick={handleConfirmBooking}
        loading={isSubmitting}
        className="w-full"
        size="lg"
      >
        {isSubmitting ? 'Confirmando...' : (
          <>
            <Zap className="w-5 h-5 mr-2" />
            Confirmar reserva
          </>
        )}
      </AnimatedButton>
    </div>
  );

  // Pantalla de éxito móvil
  const MobileSuccess = () => (
    <div className="p-4 text-center space-y-6">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.5, type: "spring", bounce: 0.5 }}
        className="w-20 h-20 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center mx-auto"
      >
        <CheckCircle className="w-10 h-10 text-white" />
      </motion.div>
      
      <div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          ¡Listo!
        </h2>
        <p className="text-gray-600 text-lg">
          Tu reserva está confirmada
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 p-6 text-left space-y-3">
        <h3 className="font-bold text-gray-900 text-center mb-4">
          Detalles de tu reserva
        </h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <strong>Servicio:</strong> <span>{selectedService?.name}</span>
          </div>
          <div className="flex justify-between">
            <strong>Fecha:</strong> <span>{new Date(selectedDate).toLocaleDateString('es-ES')}</span>
          </div>
          <div className="flex justify-between">
            <strong>Hora:</strong> <span>{selectedTime}</span>
          </div>
          <div className="flex justify-between">
            <strong>Cliente:</strong> <span>{bookingDetails.clientName}</span>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <AnimatedButton
          onClick={() => window.location.reload()}
          className="w-full"
          size="lg"
        >
          Nueva reserva
        </AnimatedButton>
        
        <button className="w-full py-3 text-emerald-600 font-semibold">
          Compartir experiencia
        </button>
      </div>
    </div>
  );

  return (
    <div className={`min-h-screen bg-gray-50 ${className}`}>
      <MobileHeader />
      
      <AnimatePresence mode="wait">
        {currentStep === 'services' && (
          <motion.div
            key="services"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3 }}
          >
            <MobileServiceSelection />
          </motion.div>
        )}
        
        {currentStep === 'datetime' && (
          <motion.div
            key="datetime"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3 }}
          >
            <MobileDateTimeSelection />
          </motion.div>
        )}
        
        {currentStep === 'details' && (
          <motion.div
            key="details"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3 }}
          >
            <MobileDetailsForm />
          </motion.div>
        )}
        
        {currentStep === 'confirmation' && (
          <motion.div
            key="confirmation"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3 }}
          >
            <MobileConfirmation />
          </motion.div>
        )}
        
        {currentStep === 'success' && (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <MobileSuccess />
          </motion.div>
        )}
      </AnimatePresence>

      <DatePickerModal />
      <TimePickerModal />
    </div>
  );
};