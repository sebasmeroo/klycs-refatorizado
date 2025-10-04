import React from 'react';
import { Check, Loader2, AlertCircle } from 'lucide-react';

interface SaveIndicatorProps {
  isSaving: boolean;
  lastSaved?: Date | null;
  error?: boolean;
}

/**
 * Indicador visual de estado de guardado (patrón Notion/Linear)
 */
export const SaveIndicator: React.FC<SaveIndicatorProps> = ({
  isSaving,
  lastSaved,
  error
}) => {
  const getTimeAgo = (date: Date) => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);

    if (seconds < 5) return 'justo ahora';
    if (seconds < 60) return 'hace unos segundos';
    if (seconds < 120) return 'hace 1 minuto';
    if (seconds < 3600) return `hace ${Math.floor(seconds / 60)} minutos`;
    return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  };

  if (error) {
    return (
      <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
        <AlertCircle className="w-4 h-4" />
        <span>Error al guardar</span>
      </div>
    );
  }

  if (isSaving) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span>Guardando...</span>
      </div>
    );
  }

  if (lastSaved) {
    return (
      <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
        <Check className="w-4 h-4" />
        <span>Guardado {getTimeAgo(lastSaved)}</span>
      </div>
    );
  }

  return null;
};
