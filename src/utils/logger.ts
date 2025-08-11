// Professional logging utility for production-ready applications

type LogLevel = 'log' | 'info' | 'warn' | 'error' | 'debug';

interface LogContext {
  component?: string;
  action?: string;
  userId?: string;
  cardId?: string;
  [key: string]: any;
}

class Logger {
  private isDev = import.meta.env.DEV;
  private isProduction = import.meta.env.PROD;

  private formatMessage(level: LogLevel, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${level.toUpperCase()}]`;
    
    if (context) {
      const contextStr = Object.entries(context)
        .map(([key, value]) => `${key}=${value}`)
        .join(' ');
      return `${prefix} ${message} (${contextStr})`;
    }
    
    return `${prefix} ${message}`;
  }

  private shouldLog(level: LogLevel): boolean {
    // In production, only log warnings and errors
    if (this.isProduction) {
      return level === 'warn' || level === 'error';
    }
    
    // In development, log everything
    return this.isDev;
  }

  private sendToAnalytics(level: LogLevel, message: string, context?: LogContext) {
    // In production, send errors to analytics service
    if (this.isProduction && level === 'error') {
      // Integrate with analytics service (Google Analytics)
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', 'exception', {
          description: message,
          fatal: false,
          custom_map: { error_context: JSON.stringify(context) }
        });
      }
      
      // Can also integrate with Sentry in the future:
      // if (window.Sentry) {
      //   window.Sentry.captureException(new Error(message), { extra: context });
      // }
    }
  }

  log(message: string, context?: LogContext): void {
    if (this.shouldLog('log')) {
      console.log(this.formatMessage('log', message, context));
    }
  }

  info(message: string, context?: LogContext): void {
    if (this.shouldLog('info')) {
      console.info(this.formatMessage('info', message, context));
    }
  }

  warn(message: string, context?: LogContext): void {
    if (this.shouldLog('warn')) {
      console.warn(this.formatMessage('warn', message, context));
    }
    this.sendToAnalytics('warn', message, context);
  }

  error(message: string, error?: Error, context?: LogContext): void {
    if (this.shouldLog('error')) {
      const fullContext = { ...context, error: error?.message, stack: error?.stack };
      console.error(this.formatMessage('error', message, fullContext));
      if (error) {
        console.error(error);
      }
    }
    this.sendToAnalytics('error', message, { ...context, error: error?.message });
  }

  debug(message: string, context?: LogContext): void {
    if (this.shouldLog('debug')) {
      console.debug(this.formatMessage('debug', message, context));
    }
  }

  // Convenience methods for common use cases
  auth(message: string, userId?: string): void {
    this.info(message, { component: 'auth', userId });
  }

  card(message: string, cardId?: string, userId?: string): void {
    this.info(message, { component: 'card', cardId, userId });
  }

  booking(message: string, bookingId?: string, userId?: string): void {
    this.info(message, { component: 'booking', bookingId, userId });
  }

  storage(message: string, path?: string, userId?: string): void {
    this.info(message, { component: 'storage', path, userId });
  }
}

// Export singleton instance
export const logger = new Logger();

// Export convenience functions
export const log = logger.log.bind(logger);
export const info = logger.info.bind(logger);
export const warn = logger.warn.bind(logger);
export const error = logger.error.bind(logger);
export const debug = logger.debug.bind(logger);

// Development-only logging
export const devLog = (message: string, data?: any) => {
  if (import.meta.env.DEV) {
    console.log(`🔧 ${message}`, data || '');
  }
};

export const devError = (message: string, err?: Error) => {
  if (import.meta.env.DEV) {
    console.error(`🚨 ${message}`, err || '');
  }
};

// Performance logging
export const perfLog = (operation: string, startTime: number) => {
  if (import.meta.env.DEV) {
    const duration = performance.now() - startTime;
    console.log(`⚡ ${operation} took ${duration.toFixed(2)}ms`);
  }
};