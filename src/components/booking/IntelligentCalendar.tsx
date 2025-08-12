import React, { useState, useEffect, useCallback } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon, 
  Clock, 
  Users, 
  CheckCircle, 
  AlertCircle,
  Smartphone,
  Tablet,
  Monitor
} from 'lucide-react';
import { AdvancedBookingsService, TimeSlot, AvailabilitySlot } from '@/services/advancedBookings';

interface IntelligentCalendarProps {
  cardId: string;
  onDateSelect: (date: string) => void;
  onTimeSelect: (time: string) => void;
  selectedDate?: string;
  selectedTime?: string;
  theme?: {
    primaryColor: string;
    secondaryColor: string;
    textColor: string;
    backgroundColor: string;
  };
  className?: string;
}

interface CalendarDay {
  date: Date;
  day: number;
  isToday: boolean;
  isPast: boolean;
  isCurrentMonth: boolean;
  hasAvailability: boolean;
  availableSlots: number;
}

export const IntelligentCalendar: React.FC<IntelligentCalendarProps> = ({
  cardId,
  onDateSelect,
  onTimeSelect,
  selectedDate,
  selectedTime,
  theme = {
    primaryColor: '#007AFF',
    secondaryColor: '#34C759', 
    textColor: '#000000',
    backgroundColor: '#FFFFFF'
  },
  className = ''
}) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [calendarDays, setCalendarDays] = useState<CalendarDay[]>([]);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month');
  const [deviceType, setDeviceType] = useState<'mobile' | 'tablet' | 'desktop'>('desktop');

  // Detectar tipo de dispositivo
  useEffect(() => {
    const updateDeviceType = () => {
      const width = window.innerWidth;
      if (width < 768) {
        setDeviceType('mobile');
      } else if (width < 1024) {
        setDeviceType('tablet');
      } else {
        setDeviceType('desktop');
      }
    };

    updateDeviceType();
    window.addEventListener('resize', updateDeviceType);
    return () => window.removeEventListener('resize', updateDeviceType);
  }, []);

  // Generar días del calendario
  const generateCalendarDays = useCallback(async () => {
    setLoading(true);
    
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const today = new Date();
    
    // Primer y último día del mes
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);
    
    // Primer día de la semana que se muestra (puede ser del mes anterior)
    const startDate = new Date(firstDayOfMonth);
    startDate.setDate(startDate.getDate() - firstDayOfMonth.getDay());
    
    // Último día de la semana que se muestra (puede ser del mes siguiente)
    const endDate = new Date(lastDayOfMonth);
    const daysToAdd = 6 - lastDayOfMonth.getDay();
    endDate.setDate(endDate.getDate() + daysToAdd);
    
    const days: CalendarDay[] = [];
    const currentDate = new Date(startDate);
    
    // Generar todos los días del calendario
    while (currentDate <= endDate) {
      const dateStr = currentDate.toISOString().split('T')[0];
      
      // Verificar disponibilidad para este día
      const availableSlots = await AdvancedBookingsService.getAvailableTimeSlots(cardId, dateStr);
      
      days.push({
        date: new Date(currentDate),
        day: currentDate.getDate(),
        isToday: currentDate.toDateString() === today.toDateString(),
        isPast: currentDate < today && !currentDate.toDateString() === today.toDateString(),
        isCurrentMonth: currentDate.getMonth() === month,
        hasAvailability: availableSlots.filter(slot => slot.available).length > 0,
        availableSlots: availableSlots.filter(slot => slot.available).length
      });
      
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    setCalendarDays(days);
    setLoading(false);
  }, [currentMonth, cardId]);

  // Cargar slots de tiempo para la fecha seleccionada
  const loadTimeSlots = useCallback(async (date: string) => {
    if (!date) return;
    
    setLoading(true);
    const slots = await AdvancedBookingsService.getAvailableTimeSlots(cardId, date);
    setTimeSlots(slots);
    setLoading(false);
  }, [cardId]);

  useEffect(() => {
    generateCalendarDays();
  }, [generateCalendarDays]);

  useEffect(() => {
    if (selectedDate) {
      loadTimeSlots(selectedDate);
    }
  }, [selectedDate, loadTimeSlots]);

  const handleDateClick = (day: CalendarDay) => {
    if (day.isPast || !day.hasAvailability) return;
    
    const dateStr = day.date.toISOString().split('T')[0];
    onDateSelect(dateStr);
  };

  const handleTimeClick = (time: string) => {
    onTimeSelect(time);
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth(prev => {
      const newMonth = new Date(prev);
      if (direction === 'prev') {
        newMonth.setMonth(newMonth.getMonth() - 1);
      } else {
        newMonth.setMonth(newMonth.getMonth() + 1);
      }
      return newMonth;
    });
  };

  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const dayNames = deviceType === 'mobile' 
    ? ['D', 'L', 'M', 'X', 'J', 'V', 'S']
    : ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

  const getDayStyles = (day: CalendarDay) => {
    const baseClasses = "relative flex items-center justify-center text-sm font-medium transition-all duration-200 cursor-pointer select-none";
    
    const sizeClasses = deviceType === 'mobile' 
      ? "w-10 h-10 text-xs" 
      : deviceType === 'tablet'
      ? "w-12 h-12 text-sm"
      : "w-14 h-14 text-sm";

    if (day.isPast) {
      return `${baseClasses} ${sizeClasses} text-gray-300 cursor-not-allowed`;
    }

    if (!day.isCurrentMonth) {
      return `${baseClasses} ${sizeClasses} text-gray-400`;
    }

    if (!day.hasAvailability) {
      return `${baseClasses} ${sizeClasses} text-gray-400 cursor-not-allowed`;
    }

    if (selectedDate === day.date.toISOString().split('T')[0]) {
      return `${baseClasses} ${sizeClasses} text-white rounded-xl shadow-lg transform scale-110`;
    }

    if (day.isToday) {
      return `${baseClasses} ${sizeClasses} text-blue-600 bg-blue-50 rounded-xl hover:bg-blue-100`;
    }

    return `${baseClasses} ${sizeClasses} text-gray-700 rounded-xl hover:bg-gray-50 hover:shadow-md hover:scale-105`;
  };

  const getTimeSlotStyles = (slot: TimeSlot) => {
    const baseClasses = "flex items-center justify-between p-3 rounded-xl border transition-all duration-200 cursor-pointer";
    
    if (!slot.available) {
      return `${baseClasses} bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed`;
    }

    if (selectedTime === slot.time) {
      return `${baseClasses} text-white border-transparent shadow-lg transform scale-105`;
    }

    return `${baseClasses} bg-white border-gray-200 text-gray-700 hover:border-blue-300 hover:shadow-md hover:scale-102`;
  };

  const getDeviceIcon = () => {
    switch (deviceType) {
      case 'mobile': return <Smartphone className="w-4 h-4" />;
      case 'tablet': return <Tablet className="w-4 h-4" />;
      default: return <Monitor className="w-4 h-4" />;
    }
  };

  return (
    <div className={`bg-white rounded-2xl shadow-xl overflow-hidden ${className}`} style={{ backgroundColor: theme.backgroundColor }}>
      {/* Header con navegación */}
      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-100">
        <div className="flex items-center space-x-3">
          <CalendarIcon className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">
            {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
          </h3>
        </div>
        
        <div className="flex items-center space-x-2">
          {/* Indicador de dispositivo */}
          <div className="flex items-center space-x-1 text-xs text-gray-500 bg-white px-2 py-1 rounded-lg">
            {getDeviceIcon()}
            <span className="hidden sm:inline">{deviceType}</span>
          </div>
          
          {/* Navegación */}
          <button
            onClick={() => navigateMonth('prev')}
            className="p-2 hover:bg-white hover:shadow-md rounded-lg transition-all duration-200"
          >
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>
          <button
            onClick={() => navigateMonth('next')}
            className="p-2 hover:bg-white hover:shadow-md rounded-lg transition-all duration-200"
          >
            <ChevronRight className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </div>

      <div className="p-4">
        {/* Días de la semana */}
        <div className={`grid grid-cols-7 gap-1 mb-3`}>
          {dayNames.map(day => (
            <div key={day} className="text-center text-xs font-medium text-gray-500 py-2">
              {day}
            </div>
          ))}
        </div>

        {/* Calendario */}
        <div className="grid grid-cols-7 gap-1 mb-6">
          {loading ? (
            Array.from({ length: 42 }).map((_, i) => (
              <div key={i} className="w-14 h-14 bg-gray-100 rounded-xl animate-pulse" />
            ))
          ) : (
            calendarDays.map((day, index) => (
              <div key={index} className="relative">
                <button
                  onClick={() => handleDateClick(day)}
                  className={getDayStyles(day)}
                  style={selectedDate === day.date.toISOString().split('T')[0] ? 
                    { backgroundColor: theme.primaryColor } : {}
                  }
                  disabled={day.isPast || !day.hasAvailability}
                >
                  {day.day}
                  
                  {/* Indicador de disponibilidad */}
                  {day.hasAvailability && day.isCurrentMonth && !day.isPast && (
                    <div 
                      className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full text-xs flex items-center justify-center"
                      style={{ 
                        backgroundColor: theme.secondaryColor,
                        color: 'white',
                        fontSize: '10px'
                      }}
                    >
                      {day.availableSlots > 9 ? '9+' : day.availableSlots}
                    </div>
                  )}
                </button>
              </div>
            ))
          )}
        </div>

        {/* Slots de tiempo */}
        {selectedDate && (
          <div className="border-t border-gray-100 pt-4">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-semibold text-gray-900 flex items-center">
                <Clock className="w-5 h-5 mr-2 text-blue-600" />
                Horarios disponibles
              </h4>
              <div className="text-sm text-gray-500">
                {timeSlots.filter(slot => slot.available).length} disponibles
              </div>
            </div>

            <div className={`grid gap-2 max-h-64 overflow-y-auto ${
              deviceType === 'mobile' ? 'grid-cols-2' : 
              deviceType === 'tablet' ? 'grid-cols-3' : 'grid-cols-4'
            }`}>
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="h-12 bg-gray-100 rounded-xl animate-pulse" />
                ))
              ) : timeSlots.length === 0 ? (
                <div className="col-span-full text-center py-8 text-gray-500">
                  <AlertCircle className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                  <p>No hay horarios disponibles para esta fecha</p>
                </div>
              ) : (
                timeSlots.map(slot => (
                  <button
                    key={slot.time}
                    onClick={() => slot.available && handleTimeClick(slot.time)}
                    className={getTimeSlotStyles(slot)}
                    style={selectedTime === slot.time && slot.available ? 
                      { backgroundColor: theme.primaryColor } : {}
                    }
                    disabled={!slot.available}
                  >
                    <div className="flex items-center">
                      <span className="font-medium">{slot.time}</span>
                      {slot.available ? (
                        <CheckCircle className="w-4 h-4 ml-2 text-green-500" />
                      ) : (
                        <AlertCircle className="w-4 h-4 ml-2 text-red-400" />
                      )}
                    </div>
                    
                    {/* Indicador de capacidad */}
                    {slot.available && slot.remainingCapacity > 1 && (
                      <div className="flex items-center text-xs text-gray-500">
                        <Users className="w-3 h-3 mr-1" />
                        {slot.remainingCapacity}
                      </div>
                    )}
                  </button>
                ))
              )}
            </div>

            {/* Leyenda */}
            <div className="flex items-center justify-center space-x-4 mt-4 text-xs text-gray-500">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-green-500 rounded-full mr-1"></div>
                Disponible
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-red-400 rounded-full mr-1"></div>
                Ocupado
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-blue-500 rounded-full mr-1"></div>
                Seleccionado
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Estilos CSS adicionales para animaciones */}
      <style jsx>{`
        @keyframes pulse-slow {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        
        .hover\\:scale-102:hover {
          transform: scale(1.02);
        }
        
        .hover\\:scale-105:hover {
          transform: scale(1.05);
        }
        
        @media (max-width: 768px) {
          .grid-cols-7 {
            gap: 0.125rem;
          }
        }
        
        /* Smooth scroll para horarios */
        .overflow-y-auto {
          scrollbar-width: thin;
          scrollbar-color: #e5e7eb #f9fafb;
        }
        
        .overflow-y-auto::-webkit-scrollbar {
          width: 6px;
        }
        
        .overflow-y-auto::-webkit-scrollbar-track {
          background: #f9fafb;
          border-radius: 3px;
        }
        
        .overflow-y-auto::-webkit-scrollbar-thumb {
          background: #e5e7eb;
          border-radius: 3px;
        }
        
        .overflow-y-auto::-webkit-scrollbar-thumb:hover {
          background: #d1d5db;
        }
      `}</style>
    </div>
  );
};