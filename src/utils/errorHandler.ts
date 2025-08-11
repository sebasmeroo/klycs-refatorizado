/**
 * Global error handling utilities
 */
import { error as logError } from './logger';
import { toast } from './toast';

export interface AppError extends Error {
  code?: string;
  statusCode?: number;
  context?: Record<string, any>;
}

export class NetworkError extends Error {
  statusCode: number;
  code: string;
  
  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.name = 'NetworkError';
    this.statusCode = statusCode;
    this.code = `NETWORK_${statusCode}`;
  }
}

export class ValidationError extends Error {
  code: string;
  field?: string;
  
  constructor(message: string, field?: string) {
    super(message);
    this.name = 'ValidationError';
    this.code = 'VALIDATION_ERROR';
    this.field = field;
  }
}

export class AuthError extends Error {
  code: string;
  
  constructor(message: string, code: string = 'AUTH_ERROR') {
    super(message);
    this.name = 'AuthError';
    this.code = code;
  }
}

export class AppErrorHandler {
  /**
   * Handle errors globally with appropriate user feedback
   */
  static handle(error: Error | AppError, context?: Record<string, any>): void {
    // Log the error
    logError(error.message, error, { 
      component: 'ErrorHandler',
      ...context 
    });

    // Show user-friendly message
    if (error instanceof NetworkError) {
      this.handleNetworkError(error);
    } else if (error instanceof ValidationError) {
      this.handleValidationError(error);
    } else if (error instanceof AuthError) {
      this.handleAuthError(error);
    } else {
      this.handleGenericError(error);
    }
  }

  private static handleNetworkError(error: NetworkError): void {
    if (error.statusCode >= 500) {
      toast.error('Error del servidor. Por favor, intenta más tarde.');
    } else if (error.statusCode === 404) {
      toast.error('Recurso no encontrado.');
    } else if (error.statusCode === 403) {
      toast.error('No tienes permisos para realizar esta acción.');
    } else if (error.statusCode === 401) {
      toast.error('Tu sesión ha expirado. Por favor, inicia sesión nuevamente.');
    } else {
      toast.error('Error de conexión. Verifica tu internet.');
    }
  }

  private static handleValidationError(error: ValidationError): void {
    toast.warning(error.message);
  }

  private static handleAuthError(_error: AuthError): void {
    toast.error('Error de autenticación. Por favor, inicia sesión nuevamente.');
    
    // Redirect to login after a delay
    setTimeout(() => {
      window.location.href = '/login';
    }, 2000);
  }

  private static handleGenericError(error: Error): void {
    const isFirebaseError = error.message.includes('Firebase') || error.message.includes('firebase');
    
    if (isFirebaseError) {
      toast.error('Error de servicio. Por favor, intenta más tarde.');
    } else {
      toast.error('Ha ocurrido un error inesperado.');
    }
  }

  /**
   * Wrap async functions with error handling
   */
  static async withErrorHandling<T>(
    fn: () => Promise<T>,
    context?: Record<string, any>
  ): Promise<T | null> {
    try {
      return await fn();
    } catch (error) {
      this.handle(error as Error, context);
      return null;
    }
  }

  /**
   * Create error boundary handler for React components
   */
  static createErrorBoundaryHandler(componentName: string) {
    return (error: Error, errorInfo: { componentStack: string }) => {
      logError(`Error boundary caught error in ${componentName}`, error, {
        component: componentName,
        componentStack: errorInfo.componentStack
      });
      
      toast.error('Ha ocurrido un error. La página se recargará automáticamente.');
      
      // Auto-reload after showing error
      setTimeout(() => {
        window.location.reload();
      }, 3000);
    };
  }

  /**
   * Handle API responses with proper error mapping
   */
  static handleApiResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      if (response.status >= 500) {
        throw new NetworkError('Error del servidor', response.status);
      } else if (response.status === 404) {
        throw new NetworkError('Recurso no encontrado', 404);
      } else if (response.status === 403) {
        throw new NetworkError('Sin permisos', 403);
      } else if (response.status === 401) {
        throw new AuthError('Sesión expirada', 'SESSION_EXPIRED');
      } else {
        throw new NetworkError('Error de red', response.status);
      }
    }
    
    return response.json();
  }

  /**
   * Validate form data with error throwing
   */
  static validateRequired(value: any, fieldName: string): void {
    if (!value || (typeof value === 'string' && value.trim() === '')) {
      throw new ValidationError(`${fieldName} es requerido`, fieldName);
    }
  }

  static validateEmail(email: string): void {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new ValidationError('Email inválido', 'email');
    }
  }

  static validatePhone(phone: string): void {
    const phoneRegex = /^\+?[\d\s\-\(\)]{10,}$/;
    if (!phoneRegex.test(phone)) {
      throw new ValidationError('Teléfono inválido', 'phone');
    }
  }

  /**
   * Retry wrapper for failed operations
   */
  static async withRetry<T>(
    fn: () => Promise<T>,
    maxRetries: number = 3,
    delay: number = 1000,
    context?: Record<string, any>
  ): Promise<T> {
    let lastError: Error;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error as Error;
        
        if (attempt === maxRetries) {
          break;
        }
        
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, delay * attempt));
      }
    }
    
    this.handle(lastError!, { ...context, attempts: maxRetries });
    throw lastError!;
  }
}

export default AppErrorHandler;