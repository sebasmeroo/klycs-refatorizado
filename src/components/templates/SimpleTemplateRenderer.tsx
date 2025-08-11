import React, { useMemo } from 'react';

interface SimpleTemplateRendererProps {
  templateCode: string;
  data: any;
  onError?: (error: string) => void;
  className?: string;
}

export const SimpleTemplateRenderer: React.FC<SimpleTemplateRendererProps> = ({
  templateCode,
  data,
  onError,
  className = ''
}) => {
  const renderedComponent = useMemo(() => {
    try {
      // Crear función que genera el componente
      const componentFunction = new Function('React', 'data', `
        ${templateCode}
        return LuxuryCards({ data });
      `);
      
      // Ejecutar y obtener el resultado
      return componentFunction(React, data);
    } catch (error) {
      console.error('Error rendering template:', error);
      onError?.(error.message);
      return (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="text-red-700 text-sm">
            Error renderizando plantilla: {error.message}
          </div>
        </div>
      );
    }
  }, [templateCode, data, onError]);

  return (
    <div className={`simple-template-renderer ${className}`}>
      {renderedComponent}
    </div>
  );
};

export default SimpleTemplateRenderer;