import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface IOSDatePickerProps {
  onDateSelect: (date: Date) => void;
  onNext: () => void;
  selectedDate?: Date;
}

export const IOSDatePicker: React.FC<IOSDatePickerProps> = ({
  onDateSelect,
  onNext,
  selectedDate
}) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  const today = new Date();
  const months = [
    'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
    'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
  ];
  const weekDays = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    // Días vacíos al inicio
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Días del mes
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    
    return days;
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth(prev => {
      const newMonth = new Date(prev);
      if (direction === 'prev') {
        newMonth.setMonth(prev.getMonth() - 1);
      } else {
        newMonth.setMonth(prev.getMonth() + 1);
      }
      return newMonth;
    });
  };

  const isDateDisabled = (date: Date | null) => {
    if (!date) return true;
    return date < today;
  };

  const isDateSelected = (date: Date | null) => {
    if (!date || !selectedDate) return false;
    return date.toDateString() === selectedDate.toDateString();
  };

  const formatMonthYear = (date: Date) => {
    return `${months[date.getMonth()]} ${date.getFullYear()}`;
  };

  const days = getDaysInMonth(currentMonth);

  return (
    <div className="bg-white rounded-3xl shadow-lg max-w-sm mx-auto p-6" style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      
      {/* Header con mes y flechas */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => navigateMonth('prev')}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <ChevronLeft size={20} className="text-gray-600" />
        </button>
        
        <h2 className="text-lg font-semibold text-gray-900 text-center">
          {formatMonthYear(currentMonth)}
        </h2>
        
        <button
          onClick={() => navigateMonth('next')}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <ChevronRight size={20} className="text-gray-600" />
        </button>
      </div>

      {/* Días de la semana */}
      <div className="grid grid-cols-7 gap-1 mb-3">
        {weekDays.map(day => (
          <div key={day} className="text-center py-2">
            <span className="text-sm font-medium text-gray-400">{day}</span>
          </div>
        ))}
      </div>

      {/* Días del mes */}
      <div className="grid grid-cols-7 gap-1 mb-8">
        {days.map((date, index) => (
          <div key={index} className="aspect-square">
            {date && (
              <button
                onClick={() => !isDateDisabled(date) && onDateSelect(date)}
                disabled={isDateDisabled(date)}
                className={`w-full h-full rounded-lg text-sm font-medium transition-all duration-200 ${
                  isDateDisabled(date)
                    ? 'text-gray-300 cursor-not-allowed'
                    : isDateSelected(date)
                    ? 'bg-gray-800 text-white shadow-md'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                {date.getDate()}
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Botón Siguiente en la esquina inferior derecha */}
      <div className="flex justify-end">
        <button
          onClick={onNext}
          disabled={!selectedDate}
          className={`px-6 py-3 rounded-2xl font-semibold text-white transition-all duration-200 ${
            selectedDate
              ? 'bg-blue-500 hover:bg-blue-600 shadow-lg hover:shadow-xl'
              : 'bg-gray-300 cursor-not-allowed'
          }`}
        >
          Siguiente
        </button>
      </div>
    </div>
  );
};