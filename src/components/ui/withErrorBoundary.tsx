import React, { ComponentType, ReactNode } from 'react';
import ErrorBoundary from './ErrorBoundary';

interface WithErrorBoundaryOptions {
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

function withErrorBoundary<P extends object>(
  Component: ComponentType<P>,
  options: WithErrorBoundaryOptions = {}
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary fallback={options.fallback} onError={options.onError}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;

  return WrappedComponent;
}

export default withErrorBoundary;