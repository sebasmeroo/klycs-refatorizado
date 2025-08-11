import React from 'react';
import { Card } from '@/types';
import { Layers, Construction } from 'lucide-react';

interface ElementsEditorProps {
  card: Card;
  onUpdate: (updates: Partial<Card>) => void;
}

export const ElementsEditor: React.FC<ElementsEditorProps> = ({ card, onUpdate }) => {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center space-x-3 pb-4 border-b border-gray-200 dark:border-gray-700">
        <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-teal-600 rounded-lg flex items-center justify-center">
          <Layers className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Elementos Adicionales
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Agrega elementos personalizados a tu tarjeta
          </p>
        </div>
      </div>

      {/* Coming Soon */}
      <div className="text-center py-16 bg-gradient-to-br from-teal-50 to-emerald-50 dark:from-teal-900/20 dark:to-emerald-900/20 rounded-xl border border-teal-200 dark:border-teal-800">
        <Construction className="w-16 h-16 text-teal-600 dark:text-teal-400 mx-auto mb-4" />
        <h4 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          Editor de Elementos
        </h4>
        <p className="text-gray-600 dark:text-gray-400 mb-4 max-w-md mx-auto">
          Agrega textos, imágenes, divisores, espaciadores y elementos embed personalizados a tu tarjeta.
        </p>
        <div className="inline-flex items-center px-4 py-2 bg-teal-100 dark:bg-teal-900/30 text-teal-800 dark:text-teal-300 rounded-full text-sm font-medium">
          Próximamente disponible
        </div>
      </div>
    </div>
  );
};

export default ElementsEditor;