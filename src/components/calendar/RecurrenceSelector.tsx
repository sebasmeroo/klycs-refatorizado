import React from 'react';
import { RecurrencePattern } from '@/types/calendar';
import { Calendar, Repeat } from 'lucide-react';

interface RecurrenceSelectorProps {
  value: RecurrencePattern | null;
  onChange: (pattern: RecurrencePattern | null) => void;
}

const WEEKDAYS = [
  { value: 0, label: 'D', fullLabel: 'Domingo' },
  { value: 1, label: 'L', fullLabel: 'Lunes' },
  { value: 2, label: 'M', fullLabel: 'Martes' },
  { value: 3, label: 'X', fullLabel: 'Miércoles' },
  { value: 4, label: 'J', fullLabel: 'Jueves' },
  { value: 5, label: 'V', fullLabel: 'Viernes' },
  { value: 6, label: 'S', fullLabel: 'Sábado' },
];

export const RecurrenceSelector: React.FC<RecurrenceSelectorProps> = ({
  value,
  onChange
}) => {
  const [isRecurring, setIsRecurring] = React.useState(!!value && value.type !== 'none');

  const toggleRecurrence = () => {
    const newValue = !isRecurring;
    setIsRecurring(newValue);
    
    if (newValue) {
      // Activar recurrencia con valores por defecto
      onChange({
        type: 'weekly',
        interval: 1,
        weekdays: [],
        count: 12 // 12 semanas por defecto (3 meses)
      });
    } else {
      // Desactivar recurrencia
      onChange(null);
    }
  };

  const toggleWeekday = (day: number) => {
    if (!value || !isRecurring) return;
    
    const currentWeekdays = value.weekdays || [];
    const newWeekdays = currentWeekdays.includes(day)
      ? currentWeekdays.filter(d => d !== day)
      : [...currentWeekdays, day].sort((a, b) => a - b);
    
    onChange({
      ...value,
      weekdays: newWeekdays
    });
  };

  const updateCount = (count: number) => {
    if (!value || !isRecurring) return;
    onChange({
      ...value,
      count: Math.min(Math.max(1, count), 52) // Limitar entre 1 y 52 semanas
    });
  };

  return (
    <div className="space-y-4">
      {/* Toggle Recurrencia */}
      <div className="flex items-center justify-between p-4 bg-gray-50 border border-gray-200 rounded-xl">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-100 rounded-lg">
            <Repeat className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">Evento Recurrente</p>
            <p className="text-xs text-gray-600">Repetir este evento semanalmente</p>
          </div>
        </div>
        
        <button
          type="button"
          onClick={toggleRecurrence}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
            isRecurring ? 'bg-purple-600' : 'bg-gray-300'
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              isRecurring ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>

      {/* Configuración de Recurrencia */}
      {isRecurring && value && (
        <div className="space-y-4 p-4 bg-purple-50 border border-purple-200 rounded-xl">
          {/* Selección de Días */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-3">
              Seleccionar días
            </label>
            <div className="grid grid-cols-7 gap-2">
              {WEEKDAYS.map((day) => {
                const isSelected = value.weekdays?.includes(day.value) || false;
                
                return (
                  <button
                    key={day.value}
                    type="button"
                    onClick={() => toggleWeekday(day.value)}
                    className={`aspect-square flex flex-col items-center justify-center rounded-lg border-2 transition-all ${
                      isSelected
                        ? 'bg-purple-600 border-purple-500 text-white shadow-sm'
                        : 'bg-white border-gray-300 text-gray-600 hover:border-purple-400 hover:bg-purple-50'
                    }`}
                    title={day.fullLabel}
                  >
                    <span className="text-xs font-semibold">{day.label}</span>
                  </button>
                );
              })}
            </div>
            {value.weekdays && value.weekdays.length > 0 && (
              <p className="text-xs text-gray-700 mt-2">
                Se repetirá los días: {value.weekdays.map(d => WEEKDAYS[d].fullLabel).join(', ')}
              </p>
            )}
          </div>

          {/* Número de Repeticiones */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Duración de la recurrencia
            </label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                min="1"
                max="52"
                value={value.count || 12}
                onChange={(e) => updateCount(parseInt(e.target.value) || 12)}
                className="flex-1 px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 focus:outline-none"
              />
              <span className="text-sm text-gray-600">semanas</span>
            </div>
            <p className="text-xs text-gray-600 mt-1">
              Se crearán hasta {value.count || 12} eventos (máximo 52)
            </p>
          </div>

          {/* Info */}
          <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <Calendar className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-xs text-blue-900">
              <p className="font-medium mb-1">¿Cómo funciona?</p>
              <p className="text-blue-700">
                {value.weekdays && value.weekdays.length > 0 ? (
                  <>El evento se creará automáticamente cada semana en los días seleccionados durante {value.count || 12} semanas.</>
                ) : (
                  <>Selecciona al menos un día de la semana para crear eventos recurrentes.</>
                )}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RecurrenceSelector;
