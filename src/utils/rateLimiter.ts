/**
 * Sistema de Rate Limiting del lado del cliente
 * ✅ Previene spam y reduce costos de Firebase
 * ✅ Múltiples estrategias: por operación, por usuario, global
 * ✅ Almacenamiento persistente en localStorage
 */

interface RateLimitConfig {
  maxRequests: number;  // Máximo de requests permitidos
  windowMs: number;     // Ventana de tiempo en milisegundos
  key: string;          // Clave única para el límite
}

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

export class RateLimiter {
  private static readonly PREFIX = 'klycs_ratelimit_';

  /**
   * Verificar si una operación está permitida
   * @returns true si está permitido, false si excedió el límite
   */
  static check(config: RateLimitConfig): boolean {
    try {
      const key = this.PREFIX + config.key;
      const now = Date.now();

      // Obtener entrada actual
      const stored = localStorage.getItem(key);
      let entry: RateLimitEntry;

      if (stored) {
        entry = JSON.parse(stored);

        // Si la ventana expiró, resetear contador
        if (now >= entry.resetTime) {
          entry = {
            count: 1,
            resetTime: now + config.windowMs,
          };
        } else {
          // Dentro de la ventana, incrementar contador
          entry.count++;
        }
      } else {
        // Primera vez, crear entrada
        entry = {
          count: 1,
          resetTime: now + config.windowMs,
        };
      }

      // Guardar entrada actualizada
      localStorage.setItem(key, JSON.stringify(entry));

      // Verificar si excedió el límite
      const allowed = entry.count <= config.maxRequests;

      if (!allowed) {
        const secondsLeft = Math.ceil((entry.resetTime - now) / 1000);
        console.warn(`⏱️  Rate limit excedido para ${config.key}. Intenta en ${secondsLeft}s`);
      }

      return allowed;

    } catch (error) {
      console.warn('Error en rate limiter:', error);
      // En caso de error, permitir la operación (fail open)
      return true;
    }
  }

  /**
   * Resetear un límite específico
   */
  static reset(key: string): void {
    try {
      localStorage.removeItem(this.PREFIX + key);
    } catch (error) {
      console.warn('Error reseteando rate limit:', error);
    }
  }

  /**
   * Obtener tiempo restante hasta el reset (en segundos)
   */
  static getTimeUntilReset(key: string): number {
    try {
      const stored = localStorage.getItem(this.PREFIX + key);
      if (!stored) return 0;

      const entry: RateLimitEntry = JSON.parse(stored);
      const now = Date.now();
      const secondsLeft = Math.max(0, Math.ceil((entry.resetTime - now) / 1000));

      return secondsLeft;
    } catch (error) {
      return 0;
    }
  }

  /**
   * Obtener información de uso actual
   */
  static getUsage(key: string): { current: number; max: number; resetIn: number } | null {
    try {
      const stored = localStorage.getItem(this.PREFIX + key);
      if (!stored) return null;

      const entry: RateLimitEntry = JSON.parse(stored);
      const resetIn = this.getTimeUntilReset(key);

      // No podemos saber el max sin la config, retornar solo lo que tenemos
      return {
        current: entry.count,
        max: 0, // Desconocido
        resetIn,
      };
    } catch (error) {
      return null;
    }
  }

  /**
   * Limpiar todos los límites expirados
   */
  static cleanup(): void {
    try {
      const now = Date.now();
      const keys = Object.keys(localStorage);

      keys.forEach(key => {
        if (!key.startsWith(this.PREFIX)) return;

        try {
          const stored = localStorage.getItem(key);
          if (!stored) return;

          const entry: RateLimitEntry = JSON.parse(stored);

          // Si expiró, eliminar
          if (now >= entry.resetTime) {
            localStorage.removeItem(key);
          }
        } catch (e) {
          // Entrada corrupta, eliminar
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.warn('Error en cleanup de rate limiter:', error);
    }
  }
}

// ===== CONFIGURACIONES PREDEFINIDAS =====

/**
 * Límites específicos por tipo de operación
 */
export const RateLimits = {
  // Escrituras (más restrictivo)
  CARD_CREATE: {
    maxRequests: 5,
    windowMs: 60 * 1000, // 5 cards por minuto
  },
  CARD_UPDATE: {
    maxRequests: 30,
    windowMs: 60 * 1000, // 30 updates por minuto (auto-save)
  },
  CARD_DELETE: {
    maxRequests: 3,
    windowMs: 60 * 1000, // 3 deletes por minuto
  },

  // Bookings
  BOOKING_CREATE: {
    maxRequests: 10,
    windowMs: 60 * 60 * 1000, // 10 reservas por hora
  },
  BOOKING_CANCEL: {
    maxRequests: 5,
    windowMs: 60 * 60 * 1000, // 5 cancelaciones por hora
  },

  // Comentarios
  COMMENT_CREATE: {
    maxRequests: 20,
    windowMs: 60 * 1000, // 20 comentarios por minuto
  },

  // Invitaciones
  INVITE_SEND: {
    maxRequests: 10,
    windowMs: 60 * 60 * 1000, // 10 invitaciones por hora
  },

  // Lecturas (más permisivo pero aún controlado)
  CARDS_FETCH: {
    maxRequests: 100,
    windowMs: 60 * 1000, // 100 fetches por minuto
  },
  ANALYTICS_TRACK: {
    maxRequests: 50,
    windowMs: 60 * 1000, // 50 eventos de analytics por minuto
  },
} as const;

/**
 * Helper function para usar límites predefinidos
 */
export const checkRateLimit = (
  operation: keyof typeof RateLimits,
  userId: string
): boolean => {
  const config = RateLimits[operation];
  return RateLimiter.check({
    ...config,
    key: `${operation}:${userId}`,
  });
};

/**
 * Decorador para funciones que necesitan rate limiting
 */
export const withRateLimit = <T extends (...args: any[]) => any>(
  fn: T,
  operation: keyof typeof RateLimits,
  getUserId: (...args: Parameters<T>) => string
): T => {
  return ((...args: Parameters<T>) => {
    const userId = getUserId(...args);
    const allowed = checkRateLimit(operation, userId);

    if (!allowed) {
      const timeLeft = RateLimiter.getTimeUntilReset(`${operation}:${userId}`);
      throw new Error(
        `Rate limit excedido. Intenta de nuevo en ${timeLeft} segundos.`
      );
    }

    return fn(...args);
  }) as T;
};

// Cleanup automático cada 5 minutos
if (typeof window !== 'undefined') {
  setInterval(() => {
    RateLimiter.cleanup();
  }, 5 * 60 * 1000);
}
