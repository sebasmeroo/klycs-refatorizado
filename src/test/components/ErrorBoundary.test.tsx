import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import ErrorBoundary from '@/components/ui/ErrorBoundary';

// Mock del logger para evitar errores en tests
vi.mock('@/utils/logger', () => ({
  error: vi.fn(),
}));

// Mock del error handler
vi.mock('@/utils/errorHandler', () => ({
  AppErrorHandler: {
    createErrorBoundaryHandler: vi.fn(() => vi.fn()),
  },
}));

const ThrowError = ({ shouldThrow = false }: { shouldThrow?: boolean }) => {
  if (shouldThrow) {
    throw new Error('Test error');
  }
  return <div>No error here</div>;
};

describe('ErrorBoundary', () => {
  it('renders children when there is no error', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={false} />
      </ErrorBoundary>
    );
    
    expect(screen.getByText('No error here')).toBeInTheDocument();
  });

  it('renders error UI when there is an error', () => {
    // Silence console.error for this test
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );
    
    expect(screen.getByText('Oops! Algo salió mal')).toBeInTheDocument();
    expect(screen.getByText('Recargar página')).toBeInTheDocument();
    expect(screen.getByText('Ir al inicio')).toBeInTheDocument();
    
    consoleSpy.mockRestore();
  });

  it('renders custom fallback when provided', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    const CustomFallback = <div>Custom error UI</div>;
    
    render(
      <ErrorBoundary fallback={CustomFallback}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );
    
    expect(screen.getByText('Custom error UI')).toBeInTheDocument();
    
    consoleSpy.mockRestore();
  });

  it('shows error details in development mode', () => {
    const originalEnv = import.meta.env.DEV;
    // @ts-ignore
    import.meta.env.DEV = true;
    
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );
    
    expect(screen.getByText('Detalles del error (solo en desarrollo)')).toBeInTheDocument();
    
    consoleSpy.mockRestore();
    // @ts-ignore
    import.meta.env.DEV = originalEnv;
  });
});