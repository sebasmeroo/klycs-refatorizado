import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AppErrorHandler } from '@/utils/errorHandler';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: React.ComponentType<ErrorBoundaryFallbackProps>;
  componentName?: string;
  showHomeButton?: boolean;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

export interface ErrorBoundaryFallbackProps {
  error?: Error;
  resetError: () => void;
  componentName?: string;
  showHomeButton?: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo
    });

    // Use our error handler
    const handler = AppErrorHandler.createErrorBoundaryHandler(
      this.props.componentName || 'Unknown Component'
    );
    handler(error, errorInfo);
  }

  resetError = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback;
      return (
        <FallbackComponent
          error={this.state.error}
          resetError={this.resetError}
          componentName={this.props.componentName}
          showHomeButton={this.props.showHomeButton}
        />
      );
    }

    return this.props.children;
  }
}

const DefaultErrorFallback: React.FC<ErrorBoundaryFallbackProps> = ({
  error,
  resetError,
  componentName,
  showHomeButton = true
}) => {
  const handleGoHome = () => {
    window.location.href = '/dashboard';
  };

  const handleReload = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
        <div className="flex justify-center mb-4">
          <div className="bg-red-100 rounded-full p-3">
            <AlertTriangle className="h-8 w-8 text-red-600" />
          </div>
        </div>
        
        <h1 className="text-xl font-semibold text-gray-900 mb-2">
          Algo salió mal
        </h1>
        
        <p className="text-gray-600 mb-6">
          {componentName 
            ? `Ha ocurrido un error en ${componentName}. Por favor, intenta recargar la página.`
            : 'Ha ocurrido un error inesperado. Por favor, intenta recargar la página.'
          }
        </p>

        {process.env.NODE_ENV === 'development' && error && (
          <details className="text-left mb-6 p-3 bg-gray-100 rounded text-sm">
            <summary className="cursor-pointer font-medium text-gray-700 mb-2">
              Detalles del error (desarrollo)
            </summary>
            <pre className="text-xs text-red-600 overflow-auto">
              {error.message}
              {error.stack}
            </pre>
          </details>
        )}
        
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={resetError}
            className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Intentar de nuevo
          </button>
          
          {showHomeButton && (
            <button
              onClick={handleGoHome}
              className="flex-1 bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors flex items-center justify-center gap-2"
            >
              <Home className="h-4 w-4" />
              Ir al inicio
            </button>
          )}
          
          <button
            onClick={handleReload}
            className="flex-1 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
          >
            Recargar página
          </button>
        </div>
      </div>
    </div>
  );
};

// HOC para envolver componentes con error boundary
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  componentName?: string
): React.ComponentType<P> {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary componentName={componentName || Component.displayName || Component.name}>
      <Component {...props} />
    </ErrorBoundary>
  );
  
  WrappedComponent.displayName = `withErrorBoundary(${componentName || Component.displayName || Component.name})`;
  
  return WrappedComponent;
}

export default ErrorBoundary;