import React, { useState } from 'react';
import { Clock, Check, ChevronLeft, User, Mail, Phone, MessageSquare } from 'lucide-react';

interface BookingCalendarProps {
  services: Service[];
  onBookingSubmit: (booking: BookingData) => void;
  theme: CardTheme;
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

export const BookingCalendar: React.FC<BookingCalendarProps> = ({
  services,
  onBookingSubmit,
  theme
}) => {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
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
  };

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
    setStep(3);
  };

  const handleContactSubmit = () => {
    if (contactData.name && contactData.email) {
      setStep(4);
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

  // Estilos iOS
  const buttonStyle = {
    backgroundColor: theme.primaryColor,
    color: theme.buttonTextColor,
    borderRadius: theme.buttonStyle === 'rounded' ? '12px' : 
                   theme.buttonStyle === 'pill' ? '24px' : '6px'
  };

  return (
    <div className="w-full max-w-md mx-auto bg-white rounded-3xl shadow-2xl overflow-hidden" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
      
      {/* Progress Bar */}
      <div className="px-4 sm:px-6 py-4 bg-gray-50 border-b border-gray-100">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-600">Paso {step} de 4</span>
          <span className="text-sm text-gray-500">
            {step === 1 && 'Seleccionar servicio'}
            {step === 2 && 'Elegir fecha y hora'}
            {step === 3 && 'Información personal'}
            {step === 4 && 'Confirmar reserva'}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="h-2 rounded-full transition-all duration-300 ease-out"
            style={{ 
              width: `${(step / 4) * 100}%`,
              backgroundColor: theme.primaryColor 
            }}
          />
        </div>
      </div>

      {/* Step 1: Seleccionar Servicio */}
      {step === 1 && (
        <div className="p-4 sm:p-6 min-h-[400px]">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            Selecciona un servicio
          </h2>
          <div className="space-y-4">
            {services.filter(service => service.isActive).map(service => (
              <button
                key={service.id}
                onClick={() => handleServiceSelect(service)}
                className="w-full p-5 text-left bg-gray-50 hover:bg-gray-100 rounded-2xl border border-gray-200 transition-all duration-200 hover:shadow-md"
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-lg text-gray-900">{service.name}</h3>
                  <div className="flex items-center space-x-1 bg-green-100 px-3 py-1 rounded-full">
                    <span className="text-green-700 font-bold">€{service.price}</span>
                  </div>
                </div>
                <p className="text-gray-600 text-sm mb-3">{service.description}</p>
                <div className="flex items-center text-gray-500 text-sm">
                  <Clock size={16} className="mr-1" />
                  <span>{service.duration} minutos</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 2: Calendario y Hora estilo iOS */}
      {step === 2 && (
        <div className="p-4 sm:p-6 min-h-[500px]">
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => setStep(1)}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <ChevronLeft size={20} className="text-gray-600" />
            </button>
            <h2 className="text-xl font-bold text-gray-900">Fecha y hora</h2>
            <div className="w-8" />
          </div>

          {/* Calendario */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {currentMonth} {currentYear}
              </h3>
            </div>
            
            {/* Días de la semana */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {dayNames.map(day => (
                <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">
                  {day}
                </div>
              ))}
            </div>
            
            {/* Días del mes */}
            <div className="grid grid-cols-7 gap-1 mb-6">
              {generateCalendar().map((dayData, index) => (
                <div key={index} className="aspect-square">
                  {dayData && (
                    <button
                      onClick={() => handleDateSelect(dayData.date)}
                      disabled={dayData.isPast}
                      className={`w-full h-full rounded-xl text-sm font-medium transition-all duration-200 ${
                        dayData.isPast
                          ? 'text-gray-300 cursor-not-allowed'
                          : selectedDate === dayData.date.toISOString().split('T')[0]
                          ? 'text-white shadow-lg transform scale-105'
                          : dayData.isToday
                          ? 'text-blue-600 bg-blue-50 hover:bg-blue-100'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                      style={selectedDate === dayData.date.toISOString().split('T')[0] ? buttonStyle : {}}
                    >
                      {dayData.day}
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Selector de hora */}
          {selectedDate && (
            <div className="pb-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Hora disponible</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[200px] overflow-y-auto">
                {generateTimeSlots().map(time => (
                  <button
                    key={time}
                    onClick={() => handleTimeSelect(time)}
                    className={`p-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                      selectedTime === time
                        ? 'text-white shadow-md transform scale-105'
                        : 'text-gray-700 bg-gray-50 hover:bg-gray-100 border border-gray-200'
                    }`}
                    style={selectedTime === time ? buttonStyle : {}}
                  >
                    {time}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Step 3: Información del cliente */}
      {step === 3 && (
        <div className="p-4 sm:p-6 min-h-[400px]">
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => setStep(2)}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <ChevronLeft size={20} className="text-gray-600" />
            </button>
            <h2 className="text-xl font-bold text-gray-900">Tus datos</h2>
            <div className="w-8" />
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <User size={16} className="inline mr-2" />
                Nombre completo *
              </label>
              <input
                type="text"
                value={contactData.name}
                onChange={(e) => setContactData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                placeholder="Tu nombre completo"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Mail size={16} className="inline mr-2" />
                Email *
              </label>
              <input
                type="email"
                value={contactData.email}
                onChange={(e) => setContactData(prev => ({ ...prev, email: e.target.value }))}
                className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                placeholder="tu@email.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Phone size={16} className="inline mr-2" />
                Teléfono (opcional)
              </label>
              <input
                type="tel"
                value={contactData.phone}
                onChange={(e) => setContactData(prev => ({ ...prev, phone: e.target.value }))}
                className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                placeholder="+34 600 000 000"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <MessageSquare size={16} className="inline mr-2" />
                Notas adicionales (opcional)
              </label>
              <textarea
                value={contactData.notes}
                onChange={(e) => setContactData(prev => ({ ...prev, notes: e.target.value }))}
                className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all resize-none"
                rows={3}
                placeholder="Cualquier información adicional..."
              />
            </div>

            <button
              onClick={handleContactSubmit}
              disabled={!contactData.name || !contactData.email}
              className="w-full py-4 rounded-xl font-semibold text-white transition-all duration-200 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              style={buttonStyle}
            >
              Continuar
            </button>
          </div>
        </div>
      )}

      {/* Step 4: Confirmación */}
      {step === 4 && (
        <div className="p-4 sm:p-6 min-h-[400px]">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check size={24} className="text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">¡Casi listo!</h2>
            <p className="text-gray-600">Revisa los detalles de tu reserva</p>
          </div>

          <div className="bg-gray-50 rounded-2xl p-6 mb-6 space-y-4">
            <div className="flex justify-between items-center">
              <span className="font-medium text-gray-700">Servicio:</span>
              <span className="text-gray-900">{selectedService?.name}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="font-medium text-gray-700">Fecha:</span>
              <span className="text-gray-900">
                {new Date(selectedDate).toLocaleDateString('es-ES', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="font-medium text-gray-700">Hora:</span>
              <span className="text-gray-900">{selectedTime}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="font-medium text-gray-700">Duración:</span>
              <span className="text-gray-900">{selectedService?.duration} min</span>
            </div>
            
            <div className="flex justify-between items-center pt-2 border-t border-gray-200">
              <span className="font-semibold text-gray-900">Precio:</span>
              <span className="font-bold text-xl text-green-600">€{selectedService?.price}</span>
            </div>
          </div>

          <div className="space-y-3">
            <button
              onClick={handleFinalSubmit}
              className="w-full py-4 rounded-xl font-semibold text-white transition-all duration-200 hover:shadow-lg"
              style={buttonStyle}
            >
              Confirmar reserva
            </button>
            
            <button
              onClick={() => setStep(3)}
              className="w-full py-3 text-gray-600 hover:text-gray-900 transition-colors"
            >
              Modificar datos
            </button>
          </div>
        </div>
      )}
    </div>
  );
};