import React from 'react';
import { Card } from '@/types';
import { Image, Construction } from 'lucide-react';

interface PortfolioEditorProps {
  card: Card;
  onUpdate: (updates: Partial<Card>) => void;
}

export const PortfolioEditor: React.FC<PortfolioEditorProps> = ({ card, onUpdate }) => {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center space-x-3 pb-4 border-b border-gray-200 dark:border-gray-700">
        <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-lg flex items-center justify-center">
          <Image className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Portfolio
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Muestra tus trabajos con imágenes y videos
          </p>
        </div>
      </div>

      {/* Coming Soon */}
      <div className="text-center py-16 bg-gradient-to-br from-cyan-50 to-blue-50 dark:from-cyan-900/20 dark:to-blue-900/20 rounded-xl border border-cyan-200 dark:border-cyan-800">
        <Construction className="w-16 h-16 text-cyan-600 dark:text-cyan-400 mx-auto mb-4" />
        <h4 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          Editor de Portfolio
        </h4>
        <p className="text-gray-600 dark:text-gray-400 mb-4 max-w-md mx-auto">
          El editor de portfolio estará disponible próximamente. Podrás subir imágenes, videos y organizar tu trabajo profesional.
        </p>
        <div className="inline-flex items-center px-4 py-2 bg-cyan-100 dark:bg-cyan-900/30 text-cyan-800 dark:text-cyan-300 rounded-full text-sm font-medium">
          Próximamente disponible
        </div>
      </div>
    </div>
  );
};

export default PortfolioEditor;