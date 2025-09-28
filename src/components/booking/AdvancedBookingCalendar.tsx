import React, { useState, useEffect } from 'react';
import { Clock, Check, ChevronLeft, User, Mail, Phone, MessageSquare, Calendar as CalendarIcon, Sparkles } from 'lucide-react';
import { BookingFormStyle } from '../design/BookingFormStyleEditor';

interface AdvancedBookingCalendarProps {
  services: Service[];
  onBookingSubmit: (booking: BookingData) => void;
  theme: CardTheme;
  formStyle: BookingFormStyle;
  currentStep?: number;
  onStepChange?: (step: number) => void;
}

interface BookingData {
  serviceId: string;
  date: string;
  time: string;
  clientName: string;
  clientEmail: string;
  clientPhone?: string;
  notes?: string;
}

interface Service {
  id: string;
  name: string;
  description: string;
  duration: number;
  price: number;
  isActive: boolean;
}

interface CardTheme {
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  textColor: string;
  buttonTextColor: string;
  buttonStyle: 'rounded' | 'square' | 'pill';
}

export const AdvancedBookingCalendar: React.FC<AdvancedBookingCalendarProps> = ({
  services,
  onBookingSubmit,
  theme,
  formStyle,
  currentStep,
  onStepChange
}) => {
  const [internalStep, setInternalStep] = useState<1 | 2 | 3 | 4>(1);
  const [renderKey, setRenderKey] = useState(0);
  
  // Usar el paso externo si está disponible, sino usar el interno
  const step = currentStep || internalStep;
  const setStep = onStepChange || setInternalStep;

  // Forzar re-render cuando cambien los estilos del calendario o horarios
  useEffect(() => {
    setRenderKey(prev => prev + 1);
  }, [formStyle.calendar, formStyle.timeSlots]);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [contactData, setContactData] = useState({
    name: '',
    email: '',
    phone: '',
    notes: ''
  });

  // Generar calendario del mes actual
  const generateCalendar = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    
    const days = [];
    
    // Días vacíos al inicio
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(null);
    }
    
    // Días del mes
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const isToday = date.toDateString() === today.toDateString();
      const isPast = date < today && !isToday;
      days.push({ day, date, isToday, isPast });
    }
    
    return days;
  };

  // Generar horarios disponibles
  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 9; hour <= 17; hour++) {
      for (let minutes of [0, 30]) {
        if (hour === 17 && minutes === 30) break;
        const time = `${hour.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
        slots.push(time);
      }
    }
    return slots;
  };

  const handleServiceSelect = (service: Service) => {
    setSelectedService(service);
    setStep(2);
  };

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date.toISOString().split('T')[0]);
    setStep(3); // Ir al paso de hora
  };

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
    setStep(4); // Ir al paso de datos
  };

  const handleContactSubmit = () => {
    if (contactData.name && contactData.email) {
      handleFinalSubmit();
    }
  };

  const handleFinalSubmit = () => {
    if (selectedService && selectedDate && selectedTime) {
      onBookingSubmit({
        serviceId: selectedService.id,
        date: selectedDate,
        time: selectedTime,
        clientName: contactData.name,
        clientEmail: contactData.email,
        clientPhone: contactData.phone,
        notes: contactData.notes
      });
    }
  };

  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

  const today = new Date();
  const currentMonth = monthNames[today.getMonth()];
  const currentYear = today.getFullYear();

  // Aplicar animaciones CSS
  const getAnimationClass = () => {
    switch (formStyle.effects.animation) {
      case 'fadeIn': return 'animate-fade-in';
      case 'slideUp': return 'animate-slide-up';
      case 'bounce': return 'animate-bounce-in';
      default: return '';
    }
  };

  // Estilos dinámicos para el contenedor principal
  const containerStyle = {
    backgroundColor: formStyle.container.backgroundColor,
    borderRadius: `${formStyle.container.borderRadius}px`,
    padding: `${formStyle.container.padding}px`,
    maxWidth: `${formStyle.container.maxWidth}px`,
    boxShadow: formStyle.container.shadow 
      ? `0 25px 50px -12px ${formStyle.container.shadowColor}${Math.round(formStyle.container.shadowIntensity * 2.55).toString(16)}`
      : 'none',
    borderColor: formStyle.container.borderColor,
    borderWidth: `${formStyle.container.borderWidth}px`,
    borderStyle: formStyle.container.borderWidth > 0 ? 'solid' : 'none',
    transition: `all ${formStyle.effects.transition}ms ease-out`,
    backdropFilter: formStyle.effects.backdrop ? `blur(${formStyle.effects.blur}px)` : 'none',
    background: formStyle.effects.gradient 
      ? `linear-gradient(${formStyle.effects.gradientDirection}, ${formStyle.primaryColor}, ${formStyle.secondaryColor})`
      : formStyle.container.backgroundColor
  };

  // Estilos para botones
  const getButtonStyle = (isSelected = false, isHover = false) => ({
    backgroundColor: isSelected ? formStyle.buttons.hoverColor : formStyle.buttons.backgroundColor,
    color: formStyle.buttons.textColor,
    borderColor: formStyle.buttons.borderColor,
    borderWidth: `${formStyle.buttons.borderWidth}px`,
    borderStyle: formStyle.buttons.borderWidth > 0 ? 'solid' : 'none',
    borderRadius: formStyle.buttons.style === 'pill' ? '9999px' 
                  : formStyle.buttons.style === 'square' ? '4px'
                  : formStyle.buttons.style === 'custom' ? `${formStyle.buttons.borderRadius}px`
                  : '12px',
    boxShadow: formStyle.buttons.shadow 
      ? `0 8px 16px ${formStyle.buttons.shadowColor}${Math.round(formStyle.buttons.shadowIntensity * 2.55).toString(16)}`
      : 'none',
    transition: `all ${formStyle.effects.transition}ms ease-out`,
    transform: isHover && formStyle.buttons.hoverEffect === 'lift' ? 'translateY(-2px) scale(1.02)' : 'none'
  });

  // Estilos para tarjetas de servicios
  const getServiceCardStyle = (isSelected = false) => ({
    backgroundColor: formStyle.serviceCards.backgroundColor,
    borderColor: isSelected ? formStyle.primaryColor : formStyle.serviceCards.borderColor,
    borderWidth: `${formStyle.serviceCards.borderWidth}px`,
    borderStyle: 'solid',
    borderRadius: `${formStyle.serviceCards.borderRadius}px`,
    color: formStyle.serviceCards.textColor,
    boxShadow: formStyle.serviceCards.shadow 
      ? `0 4px 12px ${formStyle.serviceCards.shadowColor}20`
      : 'none',
    transition: `all ${formStyle.effects.transition}ms ease-out`,
    margin: `${formStyle.serviceCards.spacing / 2}px 0`
  });

  // Estilos para inputs del formulario
  const getInputStyle = (isFocused = false) => ({
    backgroundColor: formStyle.form.inputBackgroundColor,
    color: formStyle.form.inputTextColor,
    borderColor: isFocused ? formStyle.form.focusBorderColor : formStyle.form.inputBorderColor,
    borderWidth: `${formStyle.form.inputBorderWidth}px`,
    borderStyle: 'solid',
    borderRadius: `${formStyle.form.inputBorderRadius}px`,
    padding: '16px',
    transition: `all ${formStyle.effects.transition}ms ease-out`,
    outline: 'none'
  });

  return (
    <div className={`mx-auto shadow-2xl overflow-hidden ${getAnimationClass()}`} style={containerStyle}>
      
      {/* Progress Bar */}
      <div 
        className="px-6 py-4 border-b"
        style={{ 
          backgroundColor: formStyle.stepIndicator.backgroundColor,
          borderColor: formStyle.serviceCards.borderColor
        }}
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium" style={{ color: formStyle.stepIndicator.textColor }}>
            Paso {step} de 4
          </span>
          <span className="text-sm" style={{ color: formStyle.stepIndicator.textColor }}>
            {step === 1 && (formStyle.stepTexts?.step1Title || 'Seleccionar servicio')}
            {step === 2 && (formStyle.stepTexts?.step2Title || 'Fecha')}
            {step === 3 && (formStyle.stepTexts?.step3Title || 'Hora')}
            {step === 4 && (formStyle.stepTexts?.step4Title || 'Tus datos')}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="h-2 rounded-full transition-all duration-300 ease-out"
            style={{ 
              width: `${(step / 4) * 100}%`,
              backgroundColor: formStyle.stepIndicator.completedColor,
              borderRadius: `${formStyle.stepIndicator.borderRadius}px`
            }}
          />
        </div>
      </div>

      {/* Step 1: Seleccionar Servicio */}
      {step === 1 && (
        <div className="p-6 min-h-[400px]">
          {formStyle.stepTexts?.step1Visible !== false && (
            <h2 
              className="text-2xl font-bold mb-6 text-center"
              style={{ color: formStyle.textColor }}
            >
              {formStyle.buttons.icon && '🎯 '}{formStyle.stepTexts?.step1Title || 'Selecciona un servicio'}
            </h2>
          )}
          <div className="space-y-4">
            {services.filter(service => service.isActive).map(service => (
              <button
                key={service.id}
                onClick={() => handleServiceSelect(service)}
                className="w-full p-5 text-left transition-all duration-200 hover:shadow-md"
                style={getServiceCardStyle()}
                onMouseEnter={(e) => {
                  if (formStyle.serviceCards.hoverEffect === 'scale') {
                    e.currentTarget.style.transform = 'scale(1.02)';
                  } else if (formStyle.serviceCards.hoverEffect === 'lift') {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                  } else if (formStyle.serviceCards.hoverEffect === 'glow') {
                    e.currentTarget.style.boxShadow = `0 8px 25px ${formStyle.primaryColor}40`;
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'none';
                  e.currentTarget.style.boxShadow = formStyle.serviceCards.shadow 
                    ? `0 4px 12px ${formStyle.serviceCards.shadowColor}20`
                    : 'none';
                }}
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-lg" style={{ color: formStyle.serviceCards.textColor }}>
                    {service.name}
                  </h3>
                  <div 
                    className="px-3 py-1 rounded-full"
                    style={{ 
                      backgroundColor: `${formStyle.serviceCards.priceColor}20`,
                      color: formStyle.serviceCards.priceColor
                    }}
                  >
                    <span className="font-bold">€{service.price}</span>
                  </div>
                </div>
                <p className="text-sm mb-3" style={{ color: formStyle.serviceCards.textColor }}>
                  {service.description}
                </p>
                <div className="flex items-center text-sm" style={{ color: formStyle.serviceCards.textColor }}>
                  <Clock size={16} className="mr-1" />
                  <span>{service.duration} minutos</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 2: Fecha */}
      {step === 2 && (
        <div className="p-6 min-h-[500px]">
          {formStyle.stepTexts?.step2Visible !== false && (
            <div className="text-center mb-6">
              <h2 className="text-xl font-bold" style={{ color: formStyle.textColor }}>
                {formStyle.buttons.icon && '📅 '}{formStyle.stepTexts?.step2Title || 'Fecha'}
              </h2>
            </div>
          )}

          {/* Calendario */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold" style={{ color: formStyle.calendar.headerColor }}>
                {currentMonth} {currentYear}
              </h3>
            </div>
            
            {/* Días de la semana */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {dayNames.map(day => (
                <div 
                  key={day} 
                  className="text-center text-sm font-medium py-2"
                  style={{ color: formStyle.calendar.dayColor }}
                >
                  {day}
                </div>
              ))}
            </div>
            
            {/* Días del mes */}
            <div className="grid grid-cols-7 gap-1 mb-6" style={{ gap: `${formStyle.calendar.spacing}px` }}>
              {generateCalendar().map((dayData, index) => (
                <div key={`${index}-${renderKey}`} className="aspect-square">
                  {dayData && (
                    <button
                      onClick={() => handleDateSelect(dayData.date)}
                      disabled={dayData.isPast}
                      className="w-full h-full text-sm font-medium transition-all duration-200"
                      style={{
                        borderRadius: `${formStyle.calendar.borderRadius}px`,
                        backgroundColor: selectedDate === dayData.date.toISOString().split('T')[0]
                          ? formStyle.calendar.selectedDayColor
                          : dayData.isToday
                          ? formStyle.calendar.todayColor
                          : formStyle.calendar.backgroundColor,
                        color: selectedDate === dayData.date.toISOString().split('T')[0] || dayData.isToday
                          ? '#FFFFFF'
                          : dayData.isPast
                          ? formStyle.calendar.disabledDayColor
                          : formStyle.calendar.dayColor,
                        cursor: dayData.isPast ? 'not-allowed' : 'pointer',
                        opacity: dayData.isPast ? 0.4 : 1,
                        transform: selectedDate === dayData.date.toISOString().split('T')[0] ? 'scale(1.1)' : 'scale(1)'
                      }}
                    >
                      {dayData.day}
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>


        </div>
      )}

      {/* Step 3: Selección de Hora */}
      {step === 3 && (
        <div className="p-6 min-h-[400px]">
          {formStyle.stepTexts?.step3Visible !== false && (
            <div className="text-center mb-6">
              <h2 className="text-xl font-bold" style={{ color: formStyle.textColor }}>
                {formStyle.buttons.icon && '⏰ '}{formStyle.stepTexts?.step3Title || 'Hora'}
              </h2>
            </div>
          )}

          <div className="text-center mb-6">
            <p className="text-sm text-gray-600">
              Fecha seleccionada: <span className="font-semibold">{selectedDate}</span>
            </p>
          </div>

          {/* Selector de hora */}
          <div className="pb-4">
            <h3 className="text-lg font-semibold mb-4 text-center" style={{ color: formStyle.textColor }}>
              {formStyle.buttons.icon && '⏰ '}Horarios disponibles
            </h3>
            <div 
              className="grid grid-cols-3 gap-3 max-h-[300px] overflow-y-auto"
              style={{ gap: `${formStyle.timeSlots.spacing}px` }}
            >
              {generateTimeSlots().map(time => (
                <button
                  key={`${time}-${renderKey}`}
                  onClick={() => handleTimeSelect(time)}
                  className="p-3 text-sm font-medium transition-all duration-200"
                  style={{
                    borderRadius: `${formStyle.timeSlots.borderRadius}px`,
                    backgroundColor: selectedTime === time 
                      ? formStyle.timeSlots.selectedColor 
                      : formStyle.timeSlots.backgroundColor,
                    color: selectedTime === time 
                      ? '#FFFFFF' 
                      : formStyle.timeSlots.textColor,
                    borderColor: formStyle.timeSlots.borderColor,
                    borderWidth: '1px',
                    borderStyle: 'solid',
                    transform: selectedTime === time ? 'scale(1.05)' : 'scale(1)'
                  }}
                  onMouseEnter={(e) => {
                    if (formStyle.timeSlots.hoverEffect === 'scale' && selectedTime !== time) {
                      e.currentTarget.style.transform = 'scale(1.05)';
                    } else if (formStyle.timeSlots.hoverEffect === 'glow') {
                      e.currentTarget.style.boxShadow = `0 4px 12px ${formStyle.primaryColor}40`;
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (selectedTime !== time) {
                      e.currentTarget.style.transform = 'scale(1)';
                      e.currentTarget.style.boxShadow = 'none';
                    }
                  }}
                >
                  {time}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Step 4: Información del cliente */}
      {step === 4 && (
        <div className="p-6 min-h-[400px]">
          {formStyle.stepTexts?.step4Visible !== false && (
            <div className="text-center mb-6">
              <h2 className="text-xl font-bold" style={{ color: formStyle.textColor }}>
                {formStyle.buttons.icon && '👤 '}{formStyle.stepTexts?.step4Title || 'Tus datos'}
              </h2>
            </div>
          )}

          <div className="space-y-4" style={{ gap: `${formStyle.form.spacing}px` }}>
            <div>
              <label 
                className="block text-sm font-medium mb-2"
                style={{ color: formStyle.form.labelColor }}
              >
                <User size={16} className="inline mr-2" />
                Nombre completo *
              </label>
              <input
                type="text"
                value={contactData.name}
                onChange={(e) => setContactData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full transition-all"
                style={getInputStyle()}
                placeholder="Tu nombre completo"
                required
                onFocus={(e) => {
                  e.target.style.borderColor = formStyle.form.focusBorderColor;
                  e.target.style.boxShadow = `0 0 0 3px ${formStyle.form.focusBorderColor}20`;
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = formStyle.form.inputBorderColor;
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>

            <div>
              <label 
                className="block text-sm font-medium mb-2"
                style={{ color: formStyle.form.labelColor }}
              >
                <Mail size={16} className="inline mr-2" />
                Email *
              </label>
              <input
                type="email"
                value={contactData.email}
                onChange={(e) => setContactData(prev => ({ ...prev, email: e.target.value }))}
                className="w-full transition-all"
                style={getInputStyle()}
                placeholder="tu@email.com"
                required
                onFocus={(e) => {
                  e.target.style.borderColor = formStyle.form.focusBorderColor;
                  e.target.style.boxShadow = `0 0 0 3px ${formStyle.form.focusBorderColor}20`;
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = formStyle.form.inputBorderColor;
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>

            <div>
              <label 
                className="block text-sm font-medium mb-2"
                style={{ color: formStyle.form.labelColor }}
              >
                <Phone size={16} className="inline mr-2" />
                Teléfono (opcional)
              </label>
              <input
                type="tel"
                value={contactData.phone}
                onChange={(e) => setContactData(prev => ({ ...prev, phone: e.target.value }))}
                className="w-full transition-all"
                style={getInputStyle()}
                placeholder="+34 600 000 000"
                onFocus={(e) => {
                  e.target.style.borderColor = formStyle.form.focusBorderColor;
                  e.target.style.boxShadow = `0 0 0 3px ${formStyle.form.focusBorderColor}20`;
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = formStyle.form.inputBorderColor;
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>

            <div>
              <label 
                className="block text-sm font-medium mb-2"
                style={{ color: formStyle.form.labelColor }}
              >
                <MessageSquare size={16} className="inline mr-2" />
                Notas adicionales (opcional)
              </label>
              <textarea
                value={contactData.notes}
                onChange={(e) => setContactData(prev => ({ ...prev, notes: e.target.value }))}
                className="w-full resize-none transition-all"
                style={{
                  ...getInputStyle(),
                  minHeight: '80px'
                }}
                rows={3}
                placeholder="Cualquier información adicional..."
                onFocus={(e) => {
                  e.target.style.borderColor = formStyle.form.focusBorderColor;
                  e.target.style.boxShadow = `0 0 0 3px ${formStyle.form.focusBorderColor}20`;
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = formStyle.form.inputBorderColor;
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>

            <button
              onClick={handleContactSubmit}
              disabled={!contactData.name || !contactData.email}
              className="w-full py-4 font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              style={getButtonStyle()}
              onMouseEnter={(e) => {
                if (!e.currentTarget.disabled && formStyle.buttons.hoverEffect === 'lift') {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                } else if (!e.currentTarget.disabled && formStyle.buttons.hoverEffect === 'glow') {
                  e.currentTarget.style.boxShadow = `0 12px 24px ${formStyle.buttons.shadowColor}40`;
                } else if (!e.currentTarget.disabled && formStyle.buttons.hoverEffect === 'pulse') {
                  e.currentTarget.style.animation = 'pulse 1s infinite';
                }
              }}
              onMouseLeave={(e) => {
                if (!e.currentTarget.disabled) {
                  e.currentTarget.style.transform = 'none';
                  e.currentTarget.style.animation = 'none';
                  e.currentTarget.style.boxShadow = formStyle.buttons.shadow 
                    ? `0 8px 16px ${formStyle.buttons.shadowColor}${Math.round(formStyle.buttons.shadowIntensity * 2.55).toString(16)}`
                    : 'none';
                }
              }}
            >
              {formStyle.buttons.icon && '✨ '}{formStyle.stepTexts?.buttonText || 'Continuar'}
            </button>
          </div>
        </div>
      )}



      {/* Estilos CSS para animaciones */}
      <style>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes slide-up {
          from { 
            opacity: 0; 
            transform: translateY(20px);
          }
          to { 
            opacity: 1; 
            transform: translateY(0);
          }
        }
        
        @keyframes bounce-in {
          0% { 
            opacity: 0; 
            transform: scale(0.8);
          }
          50% { 
            opacity: 1; 
            transform: scale(1.1);
          }
          100% { 
            opacity: 1; 
            transform: scale(1);
          }
        }
        
        .animate-fade-in {
          animation: fade-in ${formStyle.effects.transition}ms ease-out;
        }
        
        .animate-slide-up {
          animation: slide-up ${formStyle.effects.transition}ms ease-out;
        }
        
        .animate-bounce-in {
          animation: bounce-in ${formStyle.effects.transition}ms ease-out;
        }
      `}</style>
    </div>
  );
};
