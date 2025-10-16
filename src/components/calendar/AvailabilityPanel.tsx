import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar,
  Clock,
  Plus,
  X,
  Check,
  AlertCircle,
  Loader2,
  Info,
  Repeat
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { SharedCalendar, AvailabilityRecurrence } from '@/types/calendar';
import {
  useCreateAvailability,
  useAvailabilityByDateRange,
  useDeleteAvailability
} from '@/hooks/useProfessionalAvailability';
import { Button } from '@/components/ui/Button';

interface AvailabilityPanelProps {
  calendar: SharedCalendar;
  professionalId: string;
  professionalName: string;
  professionalEmail: string;
  selectedDate: Date;
  onClose?: () => void;
}

export const AvailabilityPanel: React.FC<AvailabilityPanelProps> = ({
  calendar,
  professionalId,
  professionalName,
  professionalEmail,
  selectedDate,
  onClose
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [note, setNote] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('17:00');
  const [recurrence, setRecurrence] = useState<AvailabilityRecurrence>('once');
  const [recurrenceEndDate, setRecurrenceEndDate] = useState('');
  const [customDate, setCustomDate] = useState(format(selectedDate, 'yyyy-MM-dd'));

  const createAvailability = useCreateAvailability();

  // Obtener disponibilidades existentes para la fecha seleccionada
  const startOfDay = useMemo(() => {
    const d = new Date(selectedDate);
    d.setHours(0, 0, 0, 0);
    return d;
  }, [selectedDate]);

  const endOfDay = useMemo(() => {
    const d = new Date(selectedDate);
    d.setHours(23, 59, 59, 999);
    return d;
  }, [selectedDate]);

  const { data: existingData } = useAvailabilityByDateRange(
    calendar.id,
    startOfDay,
    endOfDay
  );

  const existingAvailabilities = existingData?.availabilities || [];

  // Filtrar y deduplicar disponibilidades recurrentes
  // Para recurrencias, solo mostrar la instancia base (no mostrar cada expansión)
  const myAvailabilities = useMemo(() => {
    const filtered = existingAvailabilities.filter(
      a => a.professionalId === professionalId
    );

    // Deduplicar por ID base de recurrencia
    // Las instancias expandidas comparten el mismo ID base antes del sufijo -YYYYMMDD
    const seen = new Set<string>();
    const deduplicated: typeof filtered = [];

    for (const availability of filtered) {
      // Si es recurrente, usar el ID base (sin sufijo de fecha)
      const baseId = availability.recurrence !== 'once'
        ? availability.id.split('-').slice(0, -1).join('-') || availability.id
        : availability.id;

      if (!seen.has(baseId)) {
        seen.add(baseId);
        deduplicated.push(availability);
      }
    }

    return deduplicated;
  }, [existingAvailabilities, professionalId]);

  const deleteAvailability = useDeleteAvailability();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      return;
    }

    try {
      const dateToUse = new Date(customDate);

      await createAvailability.mutateAsync({
        calendarId: calendar.id,
        professionalId,
        professionalName,
        professionalEmail,
        professionalColor: calendar.color,
        type: 'note',
        date: dateToUse,
        startTime,
        endTime,
        title: title.trim(),
        note: note.trim() || undefined,
        recurrence,
        recurrenceEndDate: recurrence !== 'once' && recurrenceEndDate ? new Date(recurrenceEndDate) : undefined,
      });

      // Reset form
      setTitle('');
      setNote('');
      setStartTime('09:00');
      setEndTime('17:00');
      setRecurrence('once');
      setRecurrenceEndDate('');
      setCustomDate(format(selectedDate, 'yyyy-MM-dd'));
      setIsOpen(false);
    } catch (error) {
      console.error('Error creating availability:', error);
      alert('Error al crear la solicitud. Por favor intenta de nuevo.');
    }
  };

  const handleDelete = async (availabilityId: string) => {
    if (!confirm('¿Estás seguro de eliminar esta solicitud?')) return;

    try {
      await deleteAvailability.mutateAsync({
        availabilityId,
        calendarId: calendar.id,
      });
    } catch (error) {
      console.error('Error deleting availability:', error);
    }
  };

  const getStatusLabel = (status: 'pending' | 'approved' | 'rejected') => {
    switch (status) {
      case 'pending':
        return { label: 'Pendiente', color: 'bg-yellow-100 text-yellow-700' };
      case 'approved':
        return { label: 'Aprobado', color: 'bg-green-100 text-green-700' };
      case 'rejected':
        return { label: 'Rechazado', color: 'bg-red-100 text-red-700' };
    }
  };

  const getRecurrenceLabel = (rec: AvailabilityRecurrence): string => {
    switch (rec) {
      case 'once': return 'Solo un día';
      case 'daily': return 'Diario';
      case 'weekly': return 'Semanal';
      case 'monthly': return 'Mensual';
      default: return 'Solo un día';
    }
  };

  return (
    <div className="space-y-4">
      {/* Header con botón para abrir formulario */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">
            Gestionar Notas
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Bloquea horarios o agrega notas
          </p>
        </div>
        <Button
          size="sm"
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2"
        >
          {isOpen ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {isOpen ? 'Cerrar' : 'Añadir'}
        </Button>
      </div>

      {/* Formulario animado */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <form onSubmit={handleSubmit} className="bg-slate-50 rounded-2xl p-4 space-y-4 border border-slate-200">
              {/* Selector de fecha */}
              <div>
                <label className="text-xs font-medium text-slate-700 uppercase mb-2 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Selecciona la fecha
                </label>
                <input
                  type="date"
                  value={customDate}
                  onChange={(e) => setCustomDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  required
                />
              </div>

              {/* Horarios */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-700 uppercase mb-1 flex items-center gap-2">
                    <Clock className="w-3 h-3" />
                    Desde hora *
                  </label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-700 uppercase mb-1 block">
                    Hasta hora *
                  </label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    required
                  />
                </div>
              </div>

              {/* Recurrencia */}
              <div>
                <label className="text-xs font-medium text-slate-700 uppercase mb-2 flex items-center gap-2">
                  <Repeat className="w-4 h-4" />
                  Repetición
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {(['once', 'daily', 'weekly', 'monthly'] as AvailabilityRecurrence[]).map((rec) => (
                    <button
                      key={rec}
                      type="button"
                      onClick={() => setRecurrence(rec)}
                      className={`px-3 py-2 rounded-xl text-xs font-medium border-2 transition ${
                        recurrence === rec
                          ? 'bg-indigo-100 text-indigo-700 border-indigo-200'
                          : 'bg-white text-slate-600 border-slate-200'
                      }`}
                    >
                      {getRecurrenceLabel(rec)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Fecha fin de recurrencia (si no es 'once') */}
              {recurrence !== 'once' && (
                <div>
                  <label className="text-xs font-medium text-slate-700 uppercase mb-1 block">
                    Repetir hasta (opcional)
                  </label>
                  <input
                    type="date"
                    value={recurrenceEndDate}
                    onChange={(e) => setRecurrenceEndDate(e.target.value)}
                    min={customDate}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              )}

              {/* Título */}
              <div>
                <label className="text-xs font-medium text-slate-700 uppercase mb-1 block">
                  Título *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ej: Reunión importante, Día bloqueado, etc."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  required
                />
              </div>

              {/* Nota opcional */}
              <div>
                <label className="text-xs font-medium text-slate-700 uppercase mb-1 block">
                  Detalles (opcional)
                </label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Agrega información adicional..."
                  rows={3}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
                />
              </div>

              {/* Info de aprobación */}
              <div className="flex items-start gap-2 bg-blue-50 border border-blue-200 rounded-xl p-3">
                <Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-blue-700">
                  Esta solicitud será enviada al propietario del calendario para su aprobación.
                </p>
              </div>

              {/* Botones */}
              <div className="flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsOpen(false)}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={createAvailability.isPending || !title.trim()}
                  className="flex items-center gap-2"
                >
                  {createAvailability.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      Enviar solicitud
                    </>
                  )}
                </Button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Lista de solicitudes existentes */}
      {myAvailabilities.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-slate-500 uppercase">
            Tus solicitudes ({myAvailabilities.length})
          </p>
          <div className="space-y-2">
            {myAvailabilities.map((availability) => {
              const statusInfo = getStatusLabel(availability.status);
              return (
                <motion.div
                  key={availability.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="bg-white border border-slate-200 rounded-xl p-3 space-y-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${statusInfo.color}`}>
                          {statusInfo.label}
                        </span>
                        {availability.recurrence !== 'once' && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-100 text-purple-700 flex items-center gap-1">
                            <Repeat className="w-3 h-3" />
                            {getRecurrenceLabel(availability.recurrence)}
                          </span>
                        )}
                      </div>
                      <p className="text-sm font-medium text-slate-900">{availability.title}</p>
                      {availability.recurrence === 'once' ? (
                        <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {format(availability.date, "d 'de' MMMM, yyyy", { locale: es })}
                        </p>
                      ) : (
                        <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                          <Repeat className="w-3 h-3" />
                          Se repite {getRecurrenceLabel(availability.recurrence).toLowerCase()} desde el{' '}
                          {format(availability.date, "d 'de' MMMM", { locale: es })}
                          {availability.recurrenceEndDate && (
                            <> hasta el {format(availability.recurrenceEndDate, "d 'de' MMMM", { locale: es })}</>
                          )}
                        </p>
                      )}
                      <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {availability.startTime} - {availability.endTime}
                      </p>
                      {availability.note && (
                        <p className="text-xs text-slate-600 mt-1 line-clamp-2">{availability.note}</p>
                      )}
                    </div>
                    {availability.status === 'pending' && (
                      <button
                        onClick={() => handleDelete(availability.id)}
                        className="p-1 rounded-lg hover:bg-slate-100 transition text-slate-400 hover:text-red-600"
                        disabled={deleteAvailability.isPending}
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {availability.status === 'rejected' && availability.rejectionReason && (
                    <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg p-2">
                      <AlertCircle className="w-3 h-3 text-red-600 mt-0.5 flex-shrink-0" />
                      <p className="text-xs text-red-700">
                        <span className="font-semibold">Motivo:</span> {availability.rejectionReason}
                      </p>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
