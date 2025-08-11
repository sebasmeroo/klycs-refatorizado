import React from 'react';
import { Check } from 'lucide-react';

interface IOSTimePickerProps {
  onTimeSelect: (time: string) => void;
  onConfirm: () => void;
  selectedTime?: string;
}

export const IOSTimePicker: React.FC<IOSTimePickerProps> = ({
  onTimeSelect,
  onConfirm,
  selectedTime
}) => {
  const timeSlots = [
    '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
    '15:00', '15:30', '16:00', '16:30', '17:00', '17:30',
    '18:00', '18:30', '19:00', '19:30', '20:00'
  ];

  return (
    <div className="bg-white rounded-3xl p-6 shadow-xl max-w-sm mx-auto">
      {/* Header */}
      <div className="text-center mb-6">
        <h2 className="text-lg font-semibold text-gray-900">
          Selecciona una hora
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Elige el horario que mejor te convenga
        </p>
      </div>

      {/* Grid de horarios */}
      <div className="grid grid-cols-3 gap-3 mb-6 max-h-64 overflow-y-auto">
        {timeSlots.map(time => (
          <button
            key={time}
            onClick={() => onTimeSelect(time)}
            className={`
              py-3 px-4 rounded-2xl text-sm font-medium transition-all duration-200
              ${selectedTime === time
                ? 'bg-blue-500 text-white shadow-lg'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }
            `}
          >
            {time}
          </button>
        ))}
      </div>

      {/* Botón Confirmar */}
      <div className="flex justify-center">
        <button
          onClick={onConfirm}
          disabled={!selectedTime}
          className={`
            flex items-center space-x-2 px-8 py-3 rounded-full font-semibold text-white transition-all duration-200
            ${selectedTime 
              ? 'bg-green-500 hover:bg-green-600 shadow-lg hover:shadow-xl' 
              : 'bg-gray-300 cursor-not-allowed'
            }
          `}
        >
          <Check size={18} />
          <span>Confirmar Reserva</span>
        </button>
      </div>
    </div>
  );
};