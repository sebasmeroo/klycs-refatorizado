/**
 * Sistema de logging seguro que solo muestra información en desarrollo
 * En producción, solo logs críticos sin información sensible
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogConfig {
  production: boolean;
  allowedLevels: LogLevel[];
}

class SecureLogger {
  private config: LogConfig;

  constructor() {
    this.config = {
      production: import.meta.env.MODE === 'production',
      allowedLevels: import.meta.env.MODE === 'production' 
        ? ['error'] // Solo errores en producción
        : ['warn', 'error'] // Solo warnings y errores en desarrollo
    };
  }

  private shouldLog(level: LogLevel): boolean {
    return this.config.allowedLevels.includes(level);
  }

  private sanitizeData(data: any): any {
    if (!data) return data;
    
    if (typeof data === 'string') {
      // Ocultar UIDs, tokens y datos sensibles
      return data
        .replace(/uid['":]?\s*['"]?[a-zA-Z0-9]{20,}/gi, 'UID:[HIDDEN]')
        .replace(/token['":]?\s*['"]?[a-zA-Z0-9+/=]{50,}/gi, 'TOKEN:[HIDDEN]')
        .replace(/[a-zA-Z0-9+/=]{100,}/g, '[LONG_TOKEN_HIDDEN]')
        .replace(/6n69apb5GMb7NxReTd1LTZZzTpg2/g, 'ADMIN_UID:[HIDDEN]');
    }

    if (typeof data === 'object') {
      const sanitized = { ...data };
      
      // Campos sensibles a ocultar
      const sensitiveFields = ['uid', 'token', 'password', 'email', 'apiKey', 'auth'];
      
      sensitiveFields.forEach(field => {
        if (sanitized[field]) {
          sanitized[field] = '[HIDDEN]';
        }
      });

      return sanitized;
    }

    return data;
  }

  debug(message: string, ...args: any[]): void {
    if (!this.shouldLog('debug')) return;
    
    if (this.config.production) return; // Nunca debug en producción
    
    console.log(`🔍 ${message}`, ...args.map(arg => this.sanitizeData(arg)));
  }

  info(message: string, ...args: any[]): void {
    if (!this.shouldLog('info')) return;
    
    const sanitizedMessage = this.config.production 
      ? this.sanitizeData(message) 
      : message;
      
    const sanitizedArgs = this.config.production 
      ? args.map(arg => this.sanitizeData(arg))
      : args;
    
    console.info(`ℹ️ ${sanitizedMessage}`, ...sanitizedArgs);
  }

  warn(message: string, ...args: any[]): void {
    if (!this.shouldLog('warn')) return;
    
    const sanitizedMessage = this.sanitizeData(message);
    const sanitizedArgs = args.map(arg => this.sanitizeData(arg));
    
    console.warn(`⚠️ ${sanitizedMessage}`, ...sanitizedArgs);
  }

  error(message: string, ...args: any[]): void {
    if (!this.shouldLog('error')) return;
    
    // Los errores siempre se muestran, pero sanitizados en producción
    const sanitizedMessage = this.config.production 
      ? this.sanitizeData(message) 
      : message;
      
    const sanitizedArgs = this.config.production 
      ? args.map(arg => this.sanitizeData(arg))
      : args;
    
    console.error(`❌ ${sanitizedMessage}`, ...sanitizedArgs);
  }

  // Método especial para información de desarrollo que NUNCA debe aparecer en producción
  devOnly(message: string, ...args: any[]): void {
    // NO mostrar en ningún entorno - información inútil
    return;
  }

  // Método para logs de reglas de Firebase que solo aparecen en desarrollo
  firebaseRules(rules: string): void {
    // NO mostrar reglas - información sensible
    return;
  }

  // Método seguro para logs de autenticación
  auth(message: string, hideInProduction = true): void {
    // NO mostrar información de auth - información sensible
    return;
  }
}

export const secureLogger = new SecureLogger();

// Función helper para reemplazar console.log problemáticos
export const devLog = (...args: any[]) => {
  secureLogger.devOnly(args.join(' '));
};

// Función helper para errores seguros
export const safeError = (message: string, error?: any) => {
  secureLogger.error(message, error);
};