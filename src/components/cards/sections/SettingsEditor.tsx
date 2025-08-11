import React from 'react';
import { Card } from '@/types';
import { Settings, Construction } from 'lucide-react';

interface SettingsEditorProps {
  card: Card;
  onUpdate: (updates: Partial<Card>) => void;
}

export const SettingsEditor: React.FC<SettingsEditorProps> = ({ card, onUpdate }) => {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center space-x-3 pb-4 border-b border-gray-200 dark:border-gray-700">
        <div className="w-10 h-10 bg-gradient-to-br from-gray-500 to-gray-600 rounded-lg flex items-center justify-center">
          <Settings className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Configuración
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            SEO, analytics y configuraciones avanzadas
          </p>
        </div>
      </div>

      {/* Coming Soon */}
      <div className="text-center py-16 bg-gradient-to-br from-gray-50 to-slate-50 dark:from-gray-900/20 dark:to-slate-900/20 rounded-xl border border-gray-200 dark:border-gray-800">
        <Construction className="w-16 h-16 text-gray-600 dark:text-gray-400 mx-auto mb-4" />
        <h4 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          Configuración Avanzada
        </h4>
        <p className="text-gray-600 dark:text-gray-400 mb-4 max-w-md mx-auto">
          Configura SEO, analytics, dominio personalizado, branding y otras opciones avanzadas.
        </p>
        <div className="inline-flex items-center px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300 rounded-full text-sm font-medium">
          Próximamente disponible
        </div>
      </div>
    </div>
  );
};

export default SettingsEditor;