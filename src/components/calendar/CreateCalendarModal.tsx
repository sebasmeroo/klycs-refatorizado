import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Users, Lock, Globe, Palette, Check, Crown } from 'lucide-react';
import { useCreateCalendar } from '@/hooks/useCalendar';
import { useAuth } from '@/hooks/useAuth';
import { subscriptionsService } from '@/services/subscriptions';

interface CreateCalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCalendarCreated?: (calendarId: string) => void;
}

const PREDEFINED_COLORS = [
  '#3B82F6', // Blue
  '#10B981', // Green
  '#F59E0B', // Yellow
  '#EF4444', // Red
  '#8B5CF6', // Purple
  '#F97316', // Orange
  '#06B6D4', // Cyan
  '#84CC16', // Lime
  '#EC4899', // Pink
  '#6B7280', // Gray
];

export const CreateCalendarModal: React.FC<CreateCalendarModalProps> = ({
  isOpen,
  onClose,
  onCalendarCreated
}) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: PREDEFINED_COLORS[0],
    isPublic: false
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  // ✅ Usar React Query mutation con invalidación automática
  const createCalendarMutation = useCreateCalendar();
  const isLoading = createCalendarMutation.isPending;

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.name.trim()) {
      newErrors.name = 'El nombre del calendario es requerido';
    } else if (formData.name.length > 100) {
      newErrors.name = 'El nombre no puede exceder 100 caracteres';
    }

    if (formData.description && formData.description.length > 500) {
      newErrors.description = 'La descripción no puede exceder 500 caracteres';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm() || !user?.id) return;

    // ✅ VALIDACIÓN DE LÍMITES - Verificar si puede crear calendario
    const limitsCheck = await subscriptionsService.checkPlanLimits(user.id, 'calendars');

    if (limitsCheck.success && limitsCheck.data) {
      const { canProceed, limit, current, plan } = limitsCheck.data;

      if (!canProceed) {
        const planName = plan.name?.toLowerCase() || 'free';

        if (planName === 'free' || planName === 'básico') {
          setErrors({ general: 'Plan FREE: No puedes crear calendarios. Actualiza a PRO para obtener 1 calendario colaborativo.' });
          setShowUpgradeModal(true);
          return;
        } else if (planName === 'pro' || planName === 'profesional' || planName === 'pro anual') {
          setErrors({ general: 'Plan PRO: Ya tienes tu calendario. Actualiza a BUSINESS para calendarios ilimitados.' });
          setShowUpgradeModal(true);
          return;
        }
      }
    }

    try {
      const calendarId = await createCalendarMutation.mutateAsync({
        ownerId: user.id,
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        color: formData.color
      });

      // ✅ Registrar uso después de crear
      await subscriptionsService.recordUsage(user.id, 'calendars', 1, {
        calendarId,
        calendarName: formData.name
      });

      onCalendarCreated?.(calendarId);
      handleClose();
    } catch (error) {
      console.error('Error al crear calendario:', error);
      setErrors({ general: 'Error al crear el calendario. Por favor intenta de nuevo.' });
    }
  };

  const handleClose = () => {
    setFormData({
      name: '',
      description: '',
      color: PREDEFINED_COLORS[0],
      isPublic: false
    });
    setErrors({});
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
        onClick={handleClose}
      >
        <motion.div
          initial={{ scale: 0.95, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.95, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-hidden"
        >
          {/* Header */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Crear nuevo calendario</h2>
              <button
                onClick={handleClose}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          </div>

          {/* Formulario */}
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Nombre */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nombre del calendario *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                  errors.name ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
                placeholder="Ej: Familia, Trabajo, Proyecto..."
                maxLength={100}
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name}</p>
              )}
            </div>

            {/* Descripción */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Descripción (opcional)
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none ${
                  errors.description ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
                placeholder="Describe el propósito de este calendario..."
                maxLength={500}
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-600">{errors.description}</p>
              )}
            </div>

            {/* Color */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                <Palette className="w-4 h-4 inline mr-2" />
                Color del calendario
              </label>
              <div className="grid grid-cols-5 gap-3">
                {PREDEFINED_COLORS.map(color => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, color }))}
                    className="relative w-12 h-12 rounded-lg shadow-md hover:shadow-lg transition-shadow focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                    style={{ backgroundColor: color }}
                  >
                    {formData.color === color && (
                      <Check className="w-6 h-6 text-white absolute inset-0 m-auto" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Configuración de privacidad */}
            <div>
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isPublic}
                  onChange={(e) => setFormData(prev => ({ ...prev, isPublic: e.target.checked }))}
                  className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                />
                <div className="flex items-center space-x-2">
                  {formData.isPublic ? (
                    <Globe className="w-4 h-4 text-green-600" />
                  ) : (
                    <Lock className="w-4 h-4 text-gray-500" />
                  )}
                  <span className="text-sm font-medium text-gray-700">
                    {formData.isPublic ? 'Calendario público' : 'Calendario privado'}
                  </span>
                </div>
              </label>
              <p className="mt-1 text-xs text-gray-500 ml-7">
                {formData.isPublic 
                  ? 'Cualquier persona con el enlace puede ver este calendario'
                  : 'Solo las personas invitadas pueden ver este calendario'
                }
              </p>
            </div>

            {/* Error general */}
            {errors.general && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{errors.general}</p>
              </div>
            )}

            {/* Botones */}
            <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={handleClose}
                disabled={isLoading}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Plus className="w-4 h-4" />
                )}
                <span>{isLoading ? 'Creando...' : 'Crear calendario'}</span>
              </button>
            </div>
          </form>
        </motion.div>

        {/* Modal de Upgrade */}
        <AnimatePresence>
          {showUpgradeModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4"
              onClick={() => setShowUpgradeModal(false)}
            >
              <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl"
              >
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Crown className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    Actualiza tu Plan
                  </h3>
                  <p className="text-gray-600">
                    Has alcanzado el límite de calendarios de tu plan actual
                  </p>
                </div>

                <div className="space-y-4 mb-6">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <h4 className="font-semibold text-gray-900 mb-2">Plan PRO - €9.99/mes</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>✓ 1 tarjeta con gestión completa</li>
                      <li>✓ 1 calendario colaborativo</li>
                      <li>✓ Profesionales ilimitados</li>
                      <li>✓ Reservas ilimitadas</li>
                    </ul>
                  </div>

                  <div className="p-4 bg-purple-50 rounded-lg">
                    <h4 className="font-semibold text-gray-900 mb-2">Plan BUSINESS - €40/mes</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>✓ Calendarios ilimitados</li>
                      <li>✓ Tarjetas ilimitadas</li>
                      <li>✓ Profesionales ilimitados</li>
                      <li>✓ Analytics avanzado</li>
                    </ul>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setShowUpgradeModal(false)}
                    className="flex-1 px-4 py-2 bg-gray-200 text-gray-900 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    Cerrar
                  </button>
                  <button
                    onClick={() => window.location.href = '/dashboard/settings'}
                    className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all"
                  >
                    Ver Planes
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </AnimatePresence>
  );
};
