import React from 'react';
import { Card } from '@/types';
import { Palette, Construction } from 'lucide-react';

interface DesignEditorProps {
  card: Card;
  onUpdate: (updates: Partial<Card>) => void;
}

export const DesignEditor: React.FC<DesignEditorProps> = ({ card, onUpdate }) => {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center space-x-3 pb-4 border-b border-gray-200 dark:border-gray-700">
        <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-lg flex items-center justify-center">
          <Palette className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Diseño y Temas
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Personaliza la apariencia de tu tarjeta
          </p>
        </div>
      </div>

      {/* Coming Soon */}
      <div className="text-center py-16 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-xl border border-indigo-200 dark:border-indigo-800">
        <Construction className="w-16 h-16 text-indigo-600 dark:text-indigo-400 mx-auto mb-4" />
        <h4 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          Editor de Diseño
        </h4>
        <p className="text-gray-600 dark:text-gray-400 mb-4 max-w-md mx-auto">
          Personaliza temas, colores, tipografías, espaciado y efectos visuales avanzados para tu tarjeta.
        </p>
        <div className="inline-flex items-center px-4 py-2 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-300 rounded-full text-sm font-medium">
          Próximamente disponible
        </div>
      </div>
    </div>
  );
};

export default DesignEditor;