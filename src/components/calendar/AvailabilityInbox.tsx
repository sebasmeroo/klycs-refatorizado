import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Check,
  XCircle,
  Clock,
  Calendar,
  User,
  MessageCircle,
  Loader2,
  CheckCircle,
  AlertCircle,
  Inbox
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  usePendingAvailabilities,
  useApproveAvailability,
  useRejectAvailability,
  useApproveBatchAvailabilities
} from '@/hooks/useProfessionalAvailability';
import { Button } from '@/components/ui/Button';
import { ProfessionalAvailability, AvailabilityType } from '@/types/calendar';

interface AvailabilityInboxProps {
  ownerId: string;
  calendarIds: string[];
  onClose: () => void;
}

export const AvailabilityInbox: React.FC<AvailabilityInboxProps> = ({
  ownerId,
  calendarIds,
  onClose
}) => {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  const { data, isLoading, refetch } = usePendingAvailabilities(
    ownerId,
    calendarIds
  );

  const pendingAvailabilities = data?.availabilities || [];

  const approveAvailability = useApproveAvailability();
  const rejectAvailability = useRejectAvailability();
  const approveBatch = useApproveBatchAvailabilities();

  const handleSelectAll = () => {
    if (selectedIds.size === pendingAvailabilities.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(pendingAvailabilities.map(a => a.id)));
    }
  };

  const handleToggleSelect = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
  };

  const handleApprove = async (id: string) => {
    try {
      await approveAvailability.mutateAsync({
        availabilityId: id,
        reviewedBy: ownerId,
      });
      setSelectedIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
    } catch (error) {
      console.error('Error approving availability:', error);
      alert('Error al aprobar la solicitud');
    }
  };

  const handleReject = async (id: string) => {
    if (!rejectionReason.trim()) {
      alert('Por favor, escribe un motivo para el rechazo');
      return;
    }

    try {
      await rejectAvailability.mutateAsync({
        availabilityId: id,
        reviewedBy: ownerId,
        rejectionReason: rejectionReason.trim(),
      });
      setRejectingId(null);
      setRejectionReason('');
      setSelectedIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
    } catch (error) {
      console.error('Error rejecting availability:', error);
      alert('Error al rechazar la solicitud');
    }
  };

  const handleApproveBatch = async () => {
    if (selectedIds.size === 0) return;

    try {
      await approveBatch.mutateAsync({
        availabilityIds: Array.from(selectedIds),
        reviewedBy: ownerId,
      });
      setSelectedIds(new Set());
    } catch (error) {
      console.error('Error approving batch:', error);
      alert('Error al aprobar las solicitudes seleccionadas');
    }
  };

  const getTypeLabel = (type: AvailabilityType) => {
    switch (type) {
      case 'schedule':
        return 'Disponibilidad';
      case 'block':
        return 'Bloqueo';
      case 'note':
        return 'Nota';
    }
  };

  const getTypeColor = (type: AvailabilityType) => {
    switch (type) {
      case 'schedule':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'block':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'note':
        return 'bg-blue-100 text-blue-700 border-blue-200';
    }
  };

  const groupedByProfessional = useMemo(() => {
    const groups = new Map<string, ProfessionalAvailability[]>();
    pendingAvailabilities.forEach(availability => {
      const key = availability.professionalId;
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(availability);
    });
    return groups;
  }, [pendingAvailabilities]);

  return (
    <div className="h-full w-full max-w-2xl bg-white border-l border-slate-200 shadow-xl overflow-hidden flex flex-col"
    >
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
              <Inbox className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">
                Solicitudes de Disponibilidad
              </h2>
              <p className="text-sm text-white/80 mt-0.5">
                {pendingAvailabilities.length} solicitudes pendientes
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Batch actions */}
        {selectedIds.size > 0 && (
          <div className="bg-indigo-50 border-b border-indigo-200 px-6 py-3 flex items-center justify-between">
            <p className="text-sm font-medium text-indigo-900">
              {selectedIds.size} solicitud{selectedIds.size > 1 ? 'es' : ''} seleccionada{selectedIds.size > 1 ? 's' : ''}
            </p>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setSelectedIds(new Set())}
              >
                Cancelar
              </Button>
              <Button
                size="sm"
                onClick={handleApproveBatch}
                disabled={approveBatch.isPending}
                className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-2"
              >
                {approveBatch.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Aprobando...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    Aprobar todas
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            </div>
          ) : pendingAvailabilities.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                ¡Todo al día!
              </h3>
              <p className="text-sm text-slate-600">
                No hay solicitudes pendientes de revisión
              </p>
            </div>
          ) : (
            <>
              {/* Checkbox para seleccionar todas */}
              <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
                <input
                  type="checkbox"
                  checked={selectedIds.size === pendingAvailabilities.length}
                  onChange={handleSelectAll}
                  className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <label className="text-sm font-medium text-slate-700 cursor-pointer" onClick={handleSelectAll}>
                  Seleccionar todas
                </label>
              </div>

              {/* Agrupar por profesional */}
              {Array.from(groupedByProfessional.entries()).map(([professionalId, availabilities]) => {
                const professional = availabilities[0];
                return (
                  <div key={professionalId} className="space-y-3">
                    <div className="flex items-center gap-3 mb-3">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold"
                        style={{ backgroundColor: professional.professionalColor }}
                      >
                        {professional.professionalName[0]}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900">
                          {professional.professionalName}
                        </p>
                        <p className="text-xs text-slate-500">
                          {professional.professionalEmail}
                        </p>
                      </div>
                    </div>

                    {availabilities.map((availability) => (
                      <motion.div
                        key={availability.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`bg-slate-50 border-2 rounded-2xl p-4 transition ${
                          selectedIds.has(availability.id)
                            ? 'border-indigo-500 bg-indigo-50'
                            : 'border-slate-200'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <input
                            type="checkbox"
                            checked={selectedIds.has(availability.id)}
                            onChange={() => handleToggleSelect(availability.id)}
                            className="mt-1 w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                          />

                          <div className="flex-1 space-y-3">
                            <div>
                              <div className="flex items-center gap-2 mb-2">
                                <span className={`px-2 py-1 rounded-full text-xs font-semibold border ${getTypeColor(availability.type)}`}>
                                  {getTypeLabel(availability.type)}
                                </span>
                                <span className="flex items-center gap-1 text-xs text-slate-500">
                                  <Calendar className="w-3 h-3" />
                                  {format(availability.date, "d 'de' MMMM, yyyy", { locale: es })}
                                </span>
                              </div>
                              <h4 className="font-semibold text-slate-900">
                                {availability.title}
                              </h4>
                              {availability.type === 'schedule' &&
                                availability.startTime &&
                                availability.endTime && (
                                  <p className="text-sm text-slate-600 mt-1 flex items-center gap-1">
                                    <Clock className="w-4 h-4" />
                                    {availability.startTime} - {availability.endTime}
                                  </p>
                                )}
                              {availability.note && (
                                <p className="text-sm text-slate-600 mt-2">
                                  {availability.note}
                                </p>
                              )}
                              <p className="text-xs text-slate-400 mt-2">
                                Solicitado{' '}
                                {format(availability.requestedAt, "d 'de' MMMM 'a las' HH:mm", {
                                  locale: es,
                                })}
                              </p>
                            </div>

                            {/* Actions */}
                            {rejectingId === availability.id ? (
                              <div className="space-y-2">
                                <textarea
                                  value={rejectionReason}
                                  onChange={(e) => setRejectionReason(e.target.value)}
                                  placeholder="Escribe el motivo del rechazo..."
                                  rows={2}
                                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 resize-none"
                                  autoFocus
                                />
                                <div className="flex items-center gap-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      setRejectingId(null);
                                      setRejectionReason('');
                                    }}
                                  >
                                    Cancelar
                                  </Button>
                                  <Button
                                    size="sm"
                                    onClick={() => handleReject(availability.id)}
                                    disabled={rejectAvailability.isPending || !rejectionReason.trim()}
                                    className="bg-red-600 hover:bg-red-700 text-white"
                                  >
                                    {rejectAvailability.isPending ? (
                                      <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                      'Confirmar rechazo'
                                    )}
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <Button
                                  size="sm"
                                  onClick={() => handleApprove(availability.id)}
                                  disabled={approveAvailability.isPending}
                                  className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-2"
                                >
                                  {approveAvailability.isPending ? (
                                    <>
                                      <Loader2 className="w-4 h-4 animate-spin" />
                                      Aprobando...
                                    </>
                                  ) : (
                                    <>
                                      <Check className="w-4 h-4" />
                                      Aprobar
                                    </>
                                  )}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setRejectingId(availability.id)}
                                  className="text-red-600 hover:bg-red-50 hover:border-red-200"
                                >
                                  <XCircle className="w-4 h-4 mr-2" />
                                  Rechazar
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                );
              })}
            </>
          )}
        </div>
      </div>
  );
};
