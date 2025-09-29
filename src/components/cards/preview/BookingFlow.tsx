import React, { useState, useEffect } from 'react';
import { Card, TeamProfessional } from '@/types';
import { X, Calendar, Clock, User, ChevronRight, Check, Loader } from 'lucide-react';
import { CollaborativeCalendarService, CalendarEventService } from '@/services/collaborativeCalendar';
import { toast } from '@/utils/toast';

interface BookingFlowProps {
  card: Card;
  onClose: () => void;
}

type FlowStep = 'professionals' | 'services' | 'calendar' | 'time' | 'info' | 'confirmation';

interface BookingData {
  professionalId?: string;
  professionalName?: string;
  serviceId?: string;
  serviceName?: string;
  date?: Date;
  time?: string;
  clientName?: string;
  clientEmail?: string;
  clientPhone?: string;
  notes?: string;
}

export const BookingFlow: React.FC<BookingFlowProps> = ({ card, onClose }) => {
  const [currentStep, setCurrentStep] = useState<FlowStep>('professionals');
  const [professionals, setProfessionals] = useState<TeamProfessional[]>([]);
  const [bookingData, setBookingData] = useState<BookingData>({});
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadProfessionals();
  }, []);

  const loadProfessionals = async () => {
    if (!card.userId) {
      setProfessionals([]);
      setCurrentStep('calendar');
      return;
    }

    try {
      setLoading(true);
      const profs = await CollaborativeCalendarService.getProfessionals(card.userId);
      setProfessionals(profs.filter(p => p.isActive));
      
      // Determinar el primer paso
      if (card.calendar?.showProfessionals && profs.length > 0) {
        setCurrentStep('professionals');
      } else if (card.services && card.services.length > 0) {
        setCurrentStep('services');
      } else {
        setCurrentStep('calendar');
      }
    } catch (error) {
      console.error('Error loading professionals:', error);
      setProfessionals([]);
      setCurrentStep('calendar');
    } finally {
      setLoading(false);
    }
  };

  const handleProfessionalSelect = (prof: TeamProfessional) => {
    setBookingData(prev => ({
      ...prev,
      professionalId: prof.id,
      professionalName: prof.name
    }));
    
    // Si el profesional tiene servicios, ir a servicios, sino calendario
    if (card.services && card.services.length > 0) {
      setCurrentStep('services');
    } else {
      setCurrentStep('calendar');
    }
  };

  const handleSkipProfessional = () => {
    setBookingData(prev => ({
      ...prev,
      professionalId: undefined,
      professionalName: 'Sin asignar'
    }));
    
    if (card.services && card.services.length > 0) {
      setCurrentStep('services');
    } else {
      setCurrentStep('calendar');
    }
  };

  const handleServiceSelect = (serviceId: string, serviceName: string) => {
    setBookingData(prev => ({
      ...prev,
      serviceId,
      serviceName
    }));
    setCurrentStep('calendar');
  };

  const handleDateSelect = (date: Date) => {
    setBookingData(prev => ({ ...prev, date }));
    setCurrentStep('time');
  };

  const handleTimeSelect = (time: string) => {
    setBookingData(prev => ({ ...prev, time }));
    setCurrentStep('info');
  };

  const handleSubmit = async () => {
    if (!bookingData.clientName || !bookingData.clientEmail) {
      toast.error('Por favor completa todos los campos requeridos');
      return;
    }

    try {
      setSubmitting(true);

      // Calcular fecha y hora de inicio/fin
      const startDateTime = new Date(bookingData.date!);
      const [hours, minutes] = bookingData.time!.split(':');
      startDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
      
      const endDateTime = new Date(startDateTime);
      endDateTime.setHours(startDateTime.getHours() + 1); // 1 hora por defecto

      // Crear evento en el calendario colaborativo
      const calendarId = card.calendar?.linkedCalendarId;
      
      if (!calendarId) {
        toast.error('No hay calendario configurado');
        return;
      }

      const eventData = {
        calendarId,
        title: `${bookingData.serviceName || 'Reserva'} - ${bookingData.clientName}`,
        description: `Cliente: ${bookingData.clientName}\nEmail: ${bookingData.clientEmail}\nTeléfono: ${bookingData.clientPhone || 'No proporcionado'}\n\nNotas: ${bookingData.notes || 'Sin notas'}`,
        startDate: startDateTime,
        endDate: endDateTime,
        isAllDay: false,
        createdBy: 'cliente',
        attendees: [{
          userId: 'cliente',
          name: bookingData.clientName!,
          email: bookingData.clientEmail!,
          status: 'pending',
          isOrganizer: false
        }],
        status: 'pending' as const,
        visibility: 'public' as const,
        color: '#3B82F6'
      };

      await CalendarEventService.createEvent(calendarId, eventData);

      setCurrentStep('confirmation');
      toast.success('¡Reserva confirmada!');
    } catch (error) {
      console.error('Error creating booking:', error);
      toast.error('Error al crear la reserva');
    } finally {
      setSubmitting(false);
    }
  };

  const renderStepIndicator = () => {
    const steps: FlowStep[] = [];
    
    if (card.calendar?.showProfessionals && professionals.length > 0) {
      steps.push('professionals');
    }
    if (card.services && card.services.length > 0) {
      steps.push('services');
    }
    steps.push('calendar', 'time', 'info');

    const currentIndex = steps.indexOf(currentStep);

    return (
      <div className="flex items-center justify-center gap-2 mb-6">
        {steps.map((step, index) => (
          <div
            key={step}
            className={`h-2 rounded-full transition-all ${
              index <= currentIndex
                ? 'bg-blue-500 w-8'
                : 'bg-white/20 w-2'
            }`}
          />
        ))}
      </div>
    );
  };

  const renderProfessionalsStep = () => (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold text-white mb-4">Selecciona un Profesional</h3>
      
      {loading ? (
        <div className="flex justify-center py-8">
          <Loader className="w-8 h-8 text-white animate-spin" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3">
            {professionals.map((prof) => (
              <button
                key={prof.id}
                onClick={() => handleProfessionalSelect(prof)}
                className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 hover:bg-white/20 transition-all text-center"
              >
                {prof.avatar ? (
                  <img
                    src={prof.avatar}
                    alt={prof.name}
                    className="w-16 h-16 rounded-full mx-auto mb-2 object-cover border-2"
                    style={{ borderColor: prof.color }}
                  />
                ) : (
                  <div
                    className="w-16 h-16 rounded-full mx-auto mb-2 flex items-center justify-center text-white font-semibold text-xl"
                    style={{ backgroundColor: prof.color }}
                  >
                    {prof.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <p className="text-sm font-medium text-white">{prof.name}</p>
                <p className="text-xs text-white/60">{prof.role}</p>
              </button>
            ))}
          </div>

          <button
            onClick={handleSkipProfessional}
            className="w-full py-3 text-white/70 text-sm hover:text-white transition-colors"
          >
            Continuar sin seleccionar
          </button>
        </>
      )}
    </div>
  );

  const renderServicesStep = () => (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold text-white mb-4">Selecciona un Servicio</h3>
      
      <div className="space-y-2">
        {card.services?.filter(s => s.isActive).map((service) => (
          <button
            key={service.id}
            onClick={() => handleServiceSelect(service.id, service.name)}
            className="w-full bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 hover:bg-white/20 transition-all text-left"
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="font-medium text-white">{service.name}</p>
                <p className="text-sm text-white/60 mt-1">{service.description}</p>
                <div className="flex items-center gap-3 mt-2">
                  <span className="text-sm text-white/80">⏱️ {service.duration} min</span>
                  {service.price && (
                    <span className="text-sm font-medium text-blue-300">
                      ${service.price}
                    </span>
                  )}
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-white/40" />
            </div>
          </button>
        ))}
      </div>
    </div>
  );

  const renderCalendarStep = () => {
    const today = new Date();
    const dates = Array.from({ length: 14 }, (_, i) => {
      const date = new Date(today);
      date.setDate(date.getDate() + i);
      return date;
    });

    return (
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-white mb-4">Selecciona una Fecha</h3>
        
        <div className="grid grid-cols-7 gap-2">
          {dates.map((date) => {
            const isSelected = bookingData.date?.toDateString() === date.toDateString();
            return (
              <button
                key={date.toISOString()}
                onClick={() => handleDateSelect(date)}
                className={`aspect-square rounded-xl flex flex-col items-center justify-center transition-all ${
                  isSelected
                    ? 'bg-blue-500 text-white'
                    : 'bg-white/10 text-white/80 hover:bg-white/20'
                }`}
              >
                <span className="text-xs">{date.toLocaleDateString('es', { weekday: 'short' })}</span>
                <span className="text-lg font-semibold">{date.getDate()}</span>
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  const renderTimeStep = () => {
    const times = [
      '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
      '12:00', '12:30', '14:00', '14:30', '15:00', '15:30',
      '16:00', '16:30', '17:00', '17:30', '18:00', '18:30'
    ];

    return (
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-white mb-4">Selecciona una Hora</h3>
        
        <div className="grid grid-cols-3 gap-2">
          {times.map((time) => {
            const isSelected = bookingData.time === time;
            return (
              <button
                key={time}
                onClick={() => handleTimeSelect(time)}
                className={`py-3 rounded-xl font-medium transition-all ${
                  isSelected
                    ? 'bg-blue-500 text-white'
                    : 'bg-white/10 text-white/80 hover:bg-white/20'
                }`}
              >
                {time}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  const renderInfoStep = () => (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold text-white mb-4">Tus Datos</h3>
      
      <div className="space-y-3">
        <input
          type="text"
          placeholder="Nombre completo *"
          value={bookingData.clientName || ''}
          onChange={(e) => setBookingData(prev => ({ ...prev, clientName: e.target.value }))}
          className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        
        <input
          type="email"
          placeholder="Email *"
          value={bookingData.clientEmail || ''}
          onChange={(e) => setBookingData(prev => ({ ...prev, clientEmail: e.target.value }))}
          className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        
        <input
          type="tel"
          placeholder="Teléfono"
          value={bookingData.clientPhone || ''}
          onChange={(e) => setBookingData(prev => ({ ...prev, clientPhone: e.target.value }))}
          className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        
        <textarea
          placeholder="Notas adicionales"
          value={bookingData.notes || ''}
          onChange={(e) => setBookingData(prev => ({ ...prev, notes: e.target.value }))}
          rows={3}
          className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        />
      </div>

      {/* Resumen */}
      <div className="mt-6 p-4 bg-white/5 rounded-xl border border-white/10">
        <p className="text-xs text-white/50 uppercase tracking-wider mb-2">Resumen</p>
        {bookingData.professionalName && (
          <p className="text-sm text-white mb-1">👤 {bookingData.professionalName}</p>
        )}
        {bookingData.serviceName && (
          <p className="text-sm text-white mb-1">💼 {bookingData.serviceName}</p>
        )}
        {bookingData.date && (
          <p className="text-sm text-white mb-1">
            📅 {bookingData.date.toLocaleDateString('es', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        )}
        {bookingData.time && (
          <p className="text-sm text-white">⏰ {bookingData.time}</p>
        )}
      </div>

      <button
        onClick={handleSubmit}
        disabled={submitting || !bookingData.clientName || !bookingData.clientEmail}
        className="w-full py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-medium hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {submitting ? (
          <>
            <Loader className="w-5 h-5 animate-spin" />
            Confirmando...
          </>
        ) : (
          <>
            <Check className="w-5 h-5" />
            Confirmar Reserva
          </>
        )}
      </button>
    </div>
  );

  const renderConfirmationStep = () => (
    <div className="text-center py-8">
      <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
        <Check className="w-10 h-10 text-white" />
      </div>
      <h3 className="text-2xl font-bold text-white mb-2">¡Reserva Confirmada!</h3>
      <p className="text-white/70 mb-6">
        Te hemos enviado un correo de confirmación a {bookingData.clientEmail}
      </p>
      
      <div className="p-4 bg-white/5 rounded-xl border border-white/10 mb-6 text-left">
        <p className="text-xs text-white/50 uppercase tracking-wider mb-3">Detalles de tu reserva</p>
        {bookingData.professionalName && (
          <p className="text-sm text-white mb-2">👤 {bookingData.professionalName}</p>
        )}
        {bookingData.serviceName && (
          <p className="text-sm text-white mb-2">💼 {bookingData.serviceName}</p>
        )}
        {bookingData.date && (
          <p className="text-sm text-white mb-2">
            📅 {bookingData.date.toLocaleDateString('es', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        )}
        {bookingData.time && (
          <p className="text-sm text-white">⏰ {bookingData.time}</p>
        )}
      </div>

      <button
        onClick={onClose}
        className="w-full py-3 bg-white/10 text-white rounded-xl font-medium hover:bg-white/20 transition-all"
      >
        Cerrar
      </button>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md bg-gradient-to-br from-gray-900 to-gray-800 rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-br from-gray-900 to-gray-800 p-6 border-b border-white/10 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">
            {card.calendar?.title || 'Reservar Cita'}
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 transition-colors flex items-center justify-center"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {currentStep !== 'confirmation' && renderStepIndicator()}
          
          {currentStep === 'professionals' && renderProfessionalsStep()}
          {currentStep === 'services' && renderServicesStep()}
          {currentStep === 'calendar' && renderCalendarStep()}
          {currentStep === 'time' && renderTimeStep()}
          {currentStep === 'info' && renderInfoStep()}
          {currentStep === 'confirmation' && renderConfirmationStep()}
        </div>
      </div>
    </div>
  );
};

export default BookingFlow;
