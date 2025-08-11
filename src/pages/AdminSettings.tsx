import React from 'react';
import { Settings } from 'lucide-react';

export const AdminSettings: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Configuración</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Ajustes y configuración del sistema
        </p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-12">
        <div className="text-center">
          <Settings className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Configuración del Sistema
          </h3>
          <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
            Configura parámetros del sistema, preferencias y ajustes generales.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminSettings;