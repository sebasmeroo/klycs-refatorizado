import React from 'react';
import { ErrorBoundary, ErrorBoundaryFallbackProps } from './ErrorBoundary';
import { AlertCircle, RefreshCw, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface DashboardErrorFallbackProps extends ErrorBoundaryFallbackProps {
  title?: string;
  subtitle?: string;
}

const DashboardErrorFallback: React.FC<DashboardErrorFallbackProps> = ({
  error,
  resetError,
  componentName,
  title = 'Error en el dashboard',
  subtitle = 'No se pudo cargar esta sección del dashboard'
}) => {
  const navigate = useNavigate();

  const handleGoBack = () => {
    navigate('/dashboard');
  };

  return (
    <div className="glass-card-ios">
      <div className="p-8 text-center">
        <div className="flex justify-center mb-4">
          <div className="ios-error-icon">
            <AlertCircle size={48} className="text-red-500" />
          </div>
        </div>
        
        <h2 className="ios-page-title text-red-600 mb-2">{title}</h2>
        <p className="ios-page-subtitle mb-6">{subtitle}</p>
        
        {componentName && (
          <p className="text-sm text-gray-500 mb-4">
            Componente: {componentName}
          </p>
        )}

        {process.env.NODE_ENV === 'development' && error && (
          <details className="text-left mb-6 p-4 bg-red-50 rounded-lg border border-red-200">
            <summary className="cursor-pointer font-medium text-red-700 mb-2">
              Detalles técnicos
            </summary>
            <pre className="text-xs text-red-600 overflow-auto whitespace-pre-wrap">
              {error.message}
              {'\n\n'}
              {error.stack}
            </pre>
          </details>
        )}
        
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={resetError}
            className="ios-cta-button flex items-center justify-center gap-2"
          >
            <RefreshCw size={16} />
            Reintentar
          </button>
          
          <button
            onClick={handleGoBack}
            className="ios-link-button flex items-center justify-center gap-2"
          >
            <ArrowLeft size={16} />
            Volver al dashboard
          </button>
        </div>
      </div>
    </div>
  );
};

interface DashboardErrorBoundaryProps {
  children: React.ReactNode;
  componentName?: string;
  title?: string;
  subtitle?: string;
}

export const DashboardErrorBoundary: React.FC<DashboardErrorBoundaryProps> = ({
  children,
  componentName,
  title,
  subtitle
}) => {
  return (
    <ErrorBoundary
      componentName={componentName}
      fallback={(props) => (
        <DashboardErrorFallback
          {...props}
          title={title}
          subtitle={subtitle}
        />
      )}
    >
      {children}
    </ErrorBoundary>
  );
};

export default DashboardErrorBoundary;