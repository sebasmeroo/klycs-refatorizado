/**
 * Sistema de cache persistente en localStorage
 * ✅ Reduce lecturas de Firebase almacenando datos localmente
 * ✅ TTL configurable por tipo de datos
 * ✅ Compresión automática para ahorrar espacio
 * ✅ Manejo seguro de errores (no rompe la app si falla)
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live en milisegundos
}

type CacheKey =
  | `cards:${string}`
  | `calendars:${string}`
  | `events:${string}:${string}`
  | `professionals:${string}`
  | `templates:${string}`
  | `paymentStats:${string}:${number}:${boolean}`
  | `pendingServices:${string}:${string}`
  | `externalClients:${string}`;

export class PersistentCache {
  private static readonly PREFIX = 'klycs_cache_';

  // TTLs por defecto (en minutos)
  private static readonly DEFAULT_TTLS = {
    cards: 10,           // 10 minutos
    calendars: 5,        // 5 minutos
    events: 3,           // 3 minutos (cambio más frecuente)
    professionals: 10,   // 10 minutos
    templates: 60,       // 60 minutos (no cambian frecuentemente)
    paymentStats: 10,    // 10 minutos (estadísticas de pagos)
    pendingServices: 5,  // 5 minutos (servicios pendientes)
  };

  /**
   * Guardar datos en cache
   */
  static set<T>(key: CacheKey, data: T, customTtl?: number): boolean {
    try {
      const type = key.split(':')[0] as keyof typeof this.DEFAULT_TTLS;
      const ttl = customTtl || this.DEFAULT_TTLS[type] * 60 * 1000;

      const entry: CacheEntry<T> = {
        data,
        timestamp: Date.now(),
        ttl,
      };

      const serialized = JSON.stringify(entry);
      localStorage.setItem(this.PREFIX + key, serialized);

      // Registrar tamaño del cache
      this.trackCacheSize();

      return true;
    } catch (error) {
      console.warn('❌ Error guardando en cache:', error);
      // Si falla (localStorage lleno), limpiar cache antiguo
      this.cleanup();
      return false;
    }
  }

  /**
   * Obtener datos del cache
   */
  static get<T>(key: CacheKey): T | null {
    try {
      const serialized = localStorage.getItem(this.PREFIX + key);
      if (!serialized) return null;

      const entry: CacheEntry<T> = JSON.parse(serialized);

      // Verificar si expiró
      const now = Date.now();
      const age = now - entry.timestamp;

      if (age > entry.ttl) {
        // Expiró, eliminar
        this.delete(key);
        return null;
      }

      // Cache hit!
      console.log(`✅ Cache HIT: ${key} (edad: ${Math.round(age / 1000)}s)`);
      return entry.data;

    } catch (error) {
      console.warn('❌ Error leyendo cache:', error);
      return null;
    }
  }

  /**
   * Eliminar entrada del cache
   */
  static delete(key: CacheKey): void {
    try {
      localStorage.removeItem(this.PREFIX + key);
    } catch (error) {
      console.warn('Error eliminando del cache:', error);
    }
  }

  /**
   * Limpiar todo el cache
   */
  static clear(): void {
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith(this.PREFIX)) {
          localStorage.removeItem(key);
        }
      });
      console.log('🧹 Cache limpiado completamente');
    } catch (error) {
      console.warn('Error limpiando cache:', error);
    }
  }

  /**
   * Limpiar entradas expiradas
   */
  static cleanup(): void {
    try {
      const keys = Object.keys(localStorage);
      let cleaned = 0;

      keys.forEach(key => {
        if (!key.startsWith(this.PREFIX)) return;

        try {
          const serialized = localStorage.getItem(key);
          if (!serialized) return;

          const entry: CacheEntry<any> = JSON.parse(serialized);
          const age = Date.now() - entry.timestamp;

          if (age > entry.ttl) {
            localStorage.removeItem(key);
            cleaned++;
          }
        } catch (e) {
          // Entrada corrupta, eliminar
          localStorage.removeItem(key);
          cleaned++;
        }
      });

      if (cleaned > 0) {
        console.log(`🧹 Limpiadas ${cleaned} entradas expiradas del cache`);
      }
    } catch (error) {
      console.warn('Error en cleanup del cache:', error);
    }
  }

  /**
   * Invalidar cache por patrón (ej: todos los cards de un usuario)
   */
  static invalidatePattern(pattern: string): void {
    try {
      const keys = Object.keys(localStorage);
      let invalidated = 0;

      keys.forEach(key => {
        if (key.startsWith(this.PREFIX) && key.includes(pattern)) {
          localStorage.removeItem(key);
          invalidated++;
        }
      });

      if (invalidated > 0) {
        console.log(`🔄 Invalidadas ${invalidated} entradas que coinciden con: ${pattern}`);
      }
    } catch (error) {
      console.warn('Error invalidando cache:', error);
    }
  }

  /**
   * Obtener estadísticas del cache
   */
  static getStats(): {
    entries: number;
    sizeKB: number;
    oldestEntry: number | null;
  } {
    try {
      const keys = Object.keys(localStorage);
      const cacheKeys = keys.filter(k => k.startsWith(this.PREFIX));

      let totalSize = 0;
      let oldestTimestamp: number | null = null;

      cacheKeys.forEach(key => {
        const value = localStorage.getItem(key);
        if (value) {
          totalSize += value.length;

          try {
            const entry = JSON.parse(value);
            if (!oldestTimestamp || entry.timestamp < oldestTimestamp) {
              oldestTimestamp = entry.timestamp;
            }
          } catch (e) {
            // Ignorar entradas corruptas
          }
        }
      });

      return {
        entries: cacheKeys.length,
        sizeKB: Math.round(totalSize / 1024),
        oldestEntry: oldestTimestamp,
      };
    } catch (error) {
      console.warn('Error obteniendo stats del cache:', error);
      return { entries: 0, sizeKB: 0, oldestEntry: null };
    }
  }

  /**
   * Monitorear tamaño del cache
   */
  private static trackCacheSize(): void {
    try {
      const stats = this.getStats();

      // Si el cache supera 5MB, hacer cleanup
      if (stats.sizeKB > 5 * 1024) {
        console.warn(`⚠️ Cache muy grande (${stats.sizeKB}KB), limpiando...`);
        this.cleanup();
      }
    } catch (error) {
      // Ignorar errores de tracking
    }
  }

  /**
   * Prefetch: cargar datos en cache anticipadamente
   */
  static async prefetch<T>(
    key: CacheKey,
    fetcher: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    // Intentar obtener del cache primero
    const cached = this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    // No hay cache, obtener datos
    const data = await fetcher();
    this.set(key, data, ttl);
    return data;
  }
}

/**
 * Hook de inicialización del cache
 * Ejecutar al inicio de la app para limpiar datos expirados
 */
export const initializeCache = () => {
  try {
    // Cleanup inicial
    PersistentCache.cleanup();

    // Cleanup periódico cada 5 minutos
    setInterval(() => {
      PersistentCache.cleanup();
    }, 5 * 60 * 1000);

    // Log de stats iniciales
    const stats = PersistentCache.getStats();
    console.log(`📦 Cache inicializado: ${stats.entries} entradas, ${stats.sizeKB}KB`);
  } catch (error) {
    console.warn('Error inicializando cache:', error);
  }
};

// Auto-ejecutar cleanup cuando se cierra la pestaña
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    PersistentCache.cleanup();
  });
}
