import React from 'react';
import { Card } from '@/types';
import { Monitor } from 'lucide-react';

interface DesktopPreviewProps {
  card: Card;
}

export const DesktopPreview: React.FC<DesktopPreviewProps> = ({ card }) => {
  return (
    <div className="flex flex-col items-center justify-center h-full">
      <div className="w-64 h-40 bg-gray-200 dark:bg-gray-700 rounded-lg border-2 border-gray-300 dark:border-gray-600 flex items-center justify-center mb-4">
        <Monitor className="w-12 h-12 text-gray-400" />
      </div>
      <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
        Vista de escritorio<br />
        <span className="text-xs">Próximamente disponible</span>
      </p>
    </div>
  );
};

export default DesktopPreview;