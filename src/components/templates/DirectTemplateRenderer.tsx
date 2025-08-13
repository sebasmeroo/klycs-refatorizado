import React, { useState, useEffect, useMemo } from 'react';
import { executeJSXDirectly } from '@/utils/jsxTransformer';

interface DirectTemplateRendererProps {
  jsxCode: string;
  data: any;
  onError?: (error: string) => void;
  onSuccess?: () => void;
  className?: string;
}

/**
 * Renderiza código JSX directamente como componente React sin iframe
 */
export const DirectTemplateRenderer: React.FC<DirectTemplateRendererProps> = ({
  jsxCode,
  data,
  onError,
  onSuccess,
  className = ''
}) => {
  const [Component, setComponent] = useState<React.ComponentType<any> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Memoizar el código para evitar re-compilaciones innecesarias
  const memoizedCode = useMemo(() => jsxCode, [jsxCode]);

  useEffect(() => {
    let isMounted = true;

    const compileComponent = async () => {
      if (!memoizedCode?.trim()) {
        setError('No hay código JSX para renderizar');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Compilar el JSX directamente
        const compiledComponent = await executeJSXDirectly(memoizedCode, data);

        if (!isMounted) return;

        if (compiledComponent) {
          setComponent(() => compiledComponent);
          setError(null);
          onSuccess?.();
        } else {
          throw new Error('No se pudo compilar el componente JSX');
        }

      } catch (err: any) {
        if (!isMounted) return;
        
        const errorMessage = err.message || 'Error desconocido al compilar JSX';
        setError(errorMessage);
        onError?.(errorMessage);
        console.error('Error en DirectTemplateRenderer:', err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    compileComponent();

    return () => {
      isMounted = false;
    };
  }, [memoizedCode, data, onError, onSuccess]);

  if (loading) {
    return (
      <div className={`flex items-center justify-center p-4 ${className}`}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`p-4 border border-red-300 rounded-lg bg-red-50 ${className}`}>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-red-600 rounded-full"></div>
          <span className="text-sm font-medium text-red-800">Error de Renderizado</span>
        </div>
        <p className="text-xs text-red-700 mt-2 font-mono">{error}</p>
      </div>
    );
  }

  if (!Component) {
    return (
      <div className={`p-4 border border-yellow-300 rounded-lg bg-yellow-50 ${className}`}>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-yellow-600 rounded-full"></div>
          <span className="text-sm font-medium text-yellow-800">Componente no encontrado</span>
        </div>
      </div>
    );
  }

  // Renderizar el componente React directamente
  return (
    <div className={`direct-template-renderer w-full ${className}`}>
      <Component data={data} />
    </div>
  );
};

/**
 * Hook para usar DirectTemplateRenderer de forma más sencilla
 */
export const useDirectTemplate = (jsxCode: string, data: any) => {
  const [component, setComponent] = useState<React.ComponentType<any> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadComponent = async () => {
      if (!jsxCode?.trim()) {
        setError('Código JSX vacío');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const compiledComponent = await executeJSXDirectly(jsxCode, data);

        if (isMounted) {
          setComponent(() => compiledComponent);
          setError(null);
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err.message || 'Error compilando JSX');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadComponent();

    return () => {
      isMounted = false;
    };
  }, [jsxCode, data]);

  return { component, loading, error };
};

export default DirectTemplateRenderer;