import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  query, 
  where, 
  getDocs,
  orderBy,
  limit,
  Timestamp,
  deleteDoc
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { logger } from '@/utils/logger';
import { z } from 'zod';

export interface RateLimitRule {
  id: string;
  endpoint: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  maxRequests: number;
  windowMs: number;
  skipIf?: (req: any) => boolean;
  keyGenerator?: (req: any) => string;
  message?: string;
  statusCode?: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface RateLimitAttempt {
  id: string;
  key: string;
  endpoint: string;
  method: string;
  ip: string;
  userId?: string;
  userAgent?: string;
  timestamp: Date;
  isBlocked: boolean;
  metadata?: Record<string, any>;
}

export interface SecurityEvent {
  id: string;
  type: 'rate_limit_exceeded' | 'suspicious_activity' | 'failed_validation' | 'unauthorized_access' | 'sql_injection_attempt' | 'xss_attempt' | 'brute_force';
  severity: 'low' | 'medium' | 'high' | 'critical';
  ip: string;
  userId?: string;
  userAgent?: string;
  endpoint?: string;
  method?: string;
  payload?: any;
  blocked: boolean;
  description: string;
  metadata: Record<string, any>;
  timestamp: Date;
}

export interface SecurityConfig {
  id: string;
  name: string;
  value: any;
  description: string;
  category: 'rate_limit' | 'validation' | 'monitoring' | 'firewall';
  isActive: boolean;
  updatedAt: Date;
}

class SecurityService {
  private rateLimitCache = new Map<string, { count: number; resetTime: number }>();
  private suspiciousIPs = new Set<string>();
  private blockedIPs = new Set<string>();

  /**
   * Inicializar reglas de rate limiting predeterminadas
   */
  async initializeDefaultRateLimits(): Promise<{ success: boolean; error?: string }> {
    try {
      const defaultRules: Omit<RateLimitRule, 'id' | 'createdAt' | 'updatedAt'>[] = [
        {
          endpoint: '/api/auth/login',
          method: 'POST',
          maxRequests: 5,
          windowMs: 15 * 60 * 1000, // 15 minutos
          message: 'Demasiados intentos de login. Intenta de nuevo en 15 minutos.',
          statusCode: 429,
          isActive: true
        },
        {
          endpoint: '/api/auth/register',
          method: 'POST',
          maxRequests: 3,
          windowMs: 60 * 60 * 1000, // 1 hora
          message: 'Límite de registros alcanzado. Intenta de nuevo en 1 hora.',
          statusCode: 429,
          isActive: true
        },
        {
          endpoint: '/api/cards',
          method: 'POST',
          maxRequests: 10,
          windowMs: 60 * 60 * 1000, // 1 hora
          message: 'Límite de creación de tarjetas alcanzado.',
          statusCode: 429,
          isActive: true
        },
        {
          endpoint: '/api/bookings',
          method: 'POST',
          maxRequests: 20,
          windowMs: 60 * 60 * 1000, // 1 hora
          message: 'Límite de reservas alcanzado.',
          statusCode: 429,
          isActive: true
        },
        {
          endpoint: '/api/payments',
          method: 'POST',
          maxRequests: 5,
          windowMs: 5 * 60 * 1000, // 5 minutos
          message: 'Límite de intentos de pago alcanzado.',
          statusCode: 429,
          isActive: true
        },
        {
          endpoint: '*',
          method: 'GET',
          maxRequests: 1000,
          windowMs: 60 * 60 * 1000, // 1 hora
          message: 'Límite general de requests alcanzado.',
          statusCode: 429,
          isActive: true
        }
      ];

      for (const ruleData of defaultRules) {
        const docRef = doc(collection(db, 'rate_limit_rules'));
        await setDoc(docRef, {
          ...ruleData,
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }

      logger.info('Default rate limit rules initialized');
      return { success: true };

    } catch (error) {
      logger.error('Error initializing rate limit rules', { 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to initialize rules'
      };
    }
  }

  /**
   * Verificar rate limit
   */
  async checkRateLimit(
    endpoint: string,
    method: string,
    ip: string,
    userId?: string,
    userAgent?: string
  ): Promise<{ 
    allowed: boolean; 
    remaining?: number; 
    resetTime?: number; 
    error?: string; 
    statusCode?: number; 
  }> {
    try {
      // Verificar si la IP está bloqueada
      if (this.blockedIPs.has(ip)) {
        await this.logSecurityEvent({
          type: 'unauthorized_access',
          severity: 'high',
          ip,
          userId,
          userAgent,
          endpoint,
          method,
          blocked: true,
          description: 'Request from blocked IP',
          metadata: { reason: 'IP in blocklist' }
        });

        return { 
          allowed: false, 
          error: 'IP bloqueada por actividad sospechosa',
          statusCode: 403
        };
      }

      // Buscar reglas aplicables
      const rulesQuery = query(
        collection(db, 'rate_limit_rules'),
        where('isActive', '==', true)
      );

      const rulesSnapshot = await getDocs(rulesQuery);
      
      for (const ruleDoc of rulesSnapshot.docs) {
        const rule = { id: ruleDoc.id, ...ruleDoc.data() } as RateLimitRule;

        // Verificar si la regla aplica
        if (!this.ruleMatches(rule, endpoint, method)) {
          continue;
        }

        // Generar clave única para el rate limit
        const key = this.generateRateLimitKey(rule, ip, userId);

        // Verificar límite
        const limitCheck = await this.checkLimit(rule, key, ip, userId, userAgent, endpoint, method);
        
        if (!limitCheck.allowed) {
          return {
            allowed: false,
            remaining: 0,
            resetTime: limitCheck.resetTime,
            error: rule.message || 'Rate limit exceeded',
            statusCode: rule.statusCode || 429
          };
        }
      }

      return { allowed: true };

    } catch (error) {
      logger.error('Error checking rate limit', { 
        endpoint, 
        method, 
        ip,
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      
      return {
        allowed: true, // En caso de error, permitir la request pero logear
        error: 'Error interno al verificar rate limit'
      };
    }
  }

  /**
   * Verificar si una regla aplica a la request
   */
  private ruleMatches(rule: RateLimitRule, endpoint: string, method: string): boolean {
    if (rule.method !== method && rule.method !== '*') {
      return false;
    }

    if (rule.endpoint === '*') {
      return true;
    }

    if (rule.endpoint === endpoint) {
      return true;
    }

    // Verificar patrones con wildcards
    const pattern = rule.endpoint.replace(/\*/g, '.*');
    const regex = new RegExp(`^${pattern}$`);
    return regex.test(endpoint);
  }

  /**
   * Generar clave para rate limit
   */
  private generateRateLimitKey(rule: RateLimitRule, ip: string, userId?: string): string {
    if (rule.keyGenerator) {
      return rule.keyGenerator({ ip, userId });
    }

    // Por defecto, usar IP + endpoint + método
    const base = `${rule.endpoint}:${rule.method}:${ip}`;
    return userId ? `${base}:${userId}` : base;
  }

  /**
   * Verificar límite específico
   */
  private async checkLimit(
    rule: RateLimitRule,
    key: string,
    ip: string,
    userId?: string,
    userAgent?: string,
    endpoint?: string,
    method?: string
  ): Promise<{ allowed: boolean; resetTime?: number }> {
    const now = Date.now();
    const windowStart = now - rule.windowMs;

    // Verificar cache en memoria primero
    const cached = this.rateLimitCache.get(key);
    if (cached && cached.resetTime > now) {
      if (cached.count >= rule.maxRequests) {
        // Registrar intento bloqueado
        await this.recordRateLimitAttempt({
          key,
          endpoint: endpoint || rule.endpoint,
          method: method || rule.method,
          ip,
          userId,
          userAgent,
          isBlocked: true
        });

        // Log security event
        await this.logSecurityEvent({
          type: 'rate_limit_exceeded',
          severity: 'medium',
          ip,
          userId,
          userAgent,
          endpoint,
          method,
          blocked: true,
          description: `Rate limit exceeded for ${rule.endpoint}`,
          metadata: { 
            rule: rule.id, 
            attempts: cached.count, 
            limit: rule.maxRequests 
          }
        });

        return { allowed: false, resetTime: cached.resetTime };
      }

      // Incrementar contador
      cached.count++;
      this.rateLimitCache.set(key, cached);
    } else {
      // Verificar en Firestore para persistencia
      const attemptsQuery = query(
        collection(db, 'rate_limit_attempts'),
        where('key', '==', key),
        where('timestamp', '>=', Timestamp.fromMillis(windowStart)),
        orderBy('timestamp', 'desc')
      );

      const attemptsSnapshot = await getDocs(attemptsQuery);
      const attemptCount = attemptsSnapshot.size;

      if (attemptCount >= rule.maxRequests) {
        await this.recordRateLimitAttempt({
          key,
          endpoint: endpoint || rule.endpoint,
          method: method || rule.method,
          ip,
          userId,
          userAgent,
          isBlocked: true
        });

        const resetTime = now + rule.windowMs;
        this.rateLimitCache.set(key, { count: attemptCount + 1, resetTime });

        return { allowed: false, resetTime };
      }

      // Actualizar cache
      const resetTime = now + rule.windowMs;
      this.rateLimitCache.set(key, { count: attemptCount + 1, resetTime });
    }

    // Registrar intento exitoso
    await this.recordRateLimitAttempt({
      key,
      endpoint: endpoint || rule.endpoint,
      method: method || rule.method,
      ip,
      userId,
      userAgent,
      isBlocked: false
    });

    return { allowed: true };
  }

  /**
   * Registrar intento de rate limit
   */
  private async recordRateLimitAttempt(data: Omit<RateLimitAttempt, 'id' | 'timestamp'>): Promise<void> {
    try {
      const attemptData: Omit<RateLimitAttempt, 'id'> = {
        ...data,
        timestamp: new Date()
      };

      const docRef = doc(collection(db, 'rate_limit_attempts'));
      await setDoc(docRef, attemptData);

    } catch (error) {
      logger.error('Error recording rate limit attempt', { 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  }

  /**
   * Validar entrada con esquemas Zod
   */
  validateInput<T>(schema: z.ZodSchema<T>, data: unknown, context?: {
    ip: string;
    userId?: string;
    endpoint?: string;
  }): { success: boolean; data?: T; errors?: string[]; } {
    try {
      const result = schema.safeParse(data);

      if (!result.success) {
        const errors = result.error.errors.map(err => 
          `${err.path.join('.')}: ${err.message}`
        );

        // Log evento de seguridad para validaciones fallidas
        if (context) {
          this.logSecurityEvent({
            type: 'failed_validation',
            severity: 'low',
            ip: context.ip,
            userId: context.userId,
            endpoint: context.endpoint,
            blocked: false,
            description: 'Input validation failed',
            metadata: { 
              errors,
              input: typeof data === 'object' ? JSON.stringify(data) : String(data)
            }
          });
        }

        return { success: false, errors };
      }

      return { success: true, data: result.data };

    } catch (error) {
      logger.error('Error validating input', { 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      
      return { 
        success: false, 
        errors: ['Error interno de validación'] 
      };
    }
  }

  /**
   * Detectar y bloquear actividad sospechosa
   */
  async detectSuspiciousActivity(
    ip: string,
    userId?: string,
    userAgent?: string,
    patterns?: {
      sqlInjection?: boolean;
      xssAttempt?: boolean;
      bruteForce?: boolean;
      rapidRequests?: boolean;
    }
  ): Promise<{ blocked: boolean; reason?: string }> {
    try {
      const suspiciousPatterns: Array<{ type: SecurityEvent['type']; detected: boolean; severity: SecurityEvent['severity'] }> = [];

      // Detectar inyección SQL
      if (patterns?.sqlInjection) {
        suspiciousPatterns.push({
          type: 'sql_injection_attempt',
          detected: true,
          severity: 'high'
        });
      }

      // Detectar intentos XSS
      if (patterns?.xssAttempt) {
        suspiciousPatterns.push({
          type: 'xss_attempt',
          detected: true,
          severity: 'high'
        });
      }

      // Detectar fuerza bruta
      if (patterns?.bruteForce) {
        suspiciousPatterns.push({
          type: 'brute_force',
          detected: true,
          severity: 'critical'
        });
      }

      // Detectar requests rápidas excesivas
      if (patterns?.rapidRequests) {
        suspiciousPatterns.push({
          type: 'suspicious_activity',
          detected: true,
          severity: 'medium'
        });
      }

      let shouldBlock = false;
      let blockReason = '';

      for (const pattern of suspiciousPatterns) {
        if (pattern.detected) {
          await this.logSecurityEvent({
            type: pattern.type,
            severity: pattern.severity,
            ip,
            userId,
            userAgent,
            blocked: pattern.severity === 'critical' || pattern.severity === 'high',
            description: `Suspicious activity detected: ${pattern.type}`,
            metadata: { 
              pattern: pattern.type,
              autoBlocked: pattern.severity === 'critical'
            }
          });

          if (pattern.severity === 'critical') {
            shouldBlock = true;
            blockReason = `Critical security threat: ${pattern.type}`;
            this.blockedIPs.add(ip);
          } else if (pattern.severity === 'high') {
            this.suspiciousIPs.add(ip);
            
            // Bloquear si ya estaba marcado como sospechoso
            if (this.suspiciousIPs.has(ip)) {
              shouldBlock = true;
              blockReason = `Multiple high-severity security events`;
              this.blockedIPs.add(ip);
            }
          }
        }
      }

      return { blocked: shouldBlock, reason: blockReason };

    } catch (error) {
      logger.error('Error detecting suspicious activity', { 
        ip,
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      
      return { blocked: false };
    }
  }

  /**
   * Log evento de seguridad
   */
  async logSecurityEvent(eventData: Omit<SecurityEvent, 'id' | 'timestamp'>): Promise<void> {
    try {
      const securityEvent: Omit<SecurityEvent, 'id'> = {
        ...eventData,
        timestamp: new Date()
      };

      const docRef = doc(collection(db, 'security_events'));
      await setDoc(docRef, securityEvent);

      // Log también en el sistema de logging principal
      logger.warn('Security event logged', {
        type: eventData.type,
        severity: eventData.severity,
        ip: eventData.ip,
        blocked: eventData.blocked,
        description: eventData.description
      });

      // Alertas automáticas para eventos críticos
      if (eventData.severity === 'critical') {
        await this.triggerSecurityAlert(securityEvent);
      }

    } catch (error) {
      logger.error('Error logging security event', { 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  }

  /**
   * Trigger alerta de seguridad
   */
  private async triggerSecurityAlert(event: Omit<SecurityEvent, 'id'>): Promise<void> {
    try {
      // Implementar notificación inmediata a administradores
      logger.error('CRITICAL SECURITY ALERT', {
        type: event.type,
        ip: event.ip,
        description: event.description,
        timestamp: event.timestamp
      });

      // Aquí se podría integrar con servicios de alertas como PagerDuty, Slack, etc.
      
    } catch (error) {
      logger.error('Error triggering security alert', { 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  }

  /**
   * Limpiar intentos antiguos de rate limit
   */
  async cleanupOldAttempts(): Promise<{ success: boolean; cleaned: number; error?: string }> {
    try {
      const cutoffTime = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 horas atrás
      
      const oldAttemptsQuery = query(
        collection(db, 'rate_limit_attempts'),
        where('timestamp', '<', cutoffTime),
        limit(1000) // Limpiar en lotes
      );

      const snapshot = await getDocs(oldAttemptsQuery);
      let cleaned = 0;

      for (const doc of snapshot.docs) {
        await deleteDoc(doc.ref);
        cleaned++;
      }

      // Limpiar cache en memoria
      const now = Date.now();
      for (const [key, data] of this.rateLimitCache.entries()) {
        if (data.resetTime < now) {
          this.rateLimitCache.delete(key);
        }
      }

      logger.info('Rate limit cleanup completed', { cleaned });

      return { success: true, cleaned };

    } catch (error) {
      logger.error('Error cleaning up old attempts', { 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      
      return {
        success: false,
        cleaned: 0,
        error: error instanceof Error ? error.message : 'Failed to cleanup'
      };
    }
  }

  /**
   * Obtener estadísticas de seguridad
   */
  async getSecurityStats(timeframe: 'hour' | 'day' | 'week' | 'month' = 'day'): Promise<{
    success: boolean;
    data?: {
      totalEvents: number;
      blockedRequests: number;
      topThreats: Array<{ type: string; count: number }>;
      suspiciousIPs: Array<{ ip: string; events: number }>;
      rateLimitHits: number;
    };
    error?: string;
  }> {
    try {
      const timeframes = {
        hour: 60 * 60 * 1000,
        day: 24 * 60 * 60 * 1000,
        week: 7 * 24 * 60 * 60 * 1000,
        month: 30 * 24 * 60 * 60 * 1000
      };

      const cutoffTime = new Date(Date.now() - timeframes[timeframe]);

      // Obtener eventos de seguridad
      const eventsQuery = query(
        collection(db, 'security_events'),
        where('timestamp', '>=', cutoffTime),
        orderBy('timestamp', 'desc'),
        limit(1000)
      );

      const eventsSnapshot = await getDocs(eventsQuery);
      const events = eventsSnapshot.docs.map(doc => doc.data() as SecurityEvent);

      // Obtener intentos de rate limit
      const attemptsQuery = query(
        collection(db, 'rate_limit_attempts'),
        where('timestamp', '>=', cutoffTime),
        where('isBlocked', '==', true)
      );

      const attemptsSnapshot = await getDocs(attemptsQuery);

      // Procesar estadísticas
      const totalEvents = events.length;
      const blockedRequests = events.filter(e => e.blocked).length;
      const rateLimitHits = attemptsSnapshot.size;

      // Top amenazas
      const threatCounts = new Map<string, number>();
      events.forEach(event => {
        const current = threatCounts.get(event.type) || 0;
        threatCounts.set(event.type, current + 1);
      });

      const topThreats = Array.from(threatCounts.entries())
        .map(([type, count]) => ({ type, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      // IPs sospechosas
      const ipCounts = new Map<string, number>();
      events.forEach(event => {
        const current = ipCounts.get(event.ip) || 0;
        ipCounts.set(event.ip, current + 1);
      });

      const suspiciousIPs = Array.from(ipCounts.entries())
        .map(([ip, events]) => ({ ip, events }))
        .sort((a, b) => b.events - a.events)
        .slice(0, 10);

      return {
        success: true,
        data: {
          totalEvents,
          blockedRequests,
          topThreats,
          suspiciousIPs,
          rateLimitHits
        }
      };

    } catch (error) {
      logger.error('Error getting security stats', { 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get stats'
      };
    }
  }

  /**
   * Crear regla de rate limit personalizada
   */
  async createRateLimitRule(
    ruleData: Omit<RateLimitRule, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<{ success: boolean; data?: RateLimitRule; error?: string }> {
    try {
      const rule: Omit<RateLimitRule, 'id'> = {
        ...ruleData,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const docRef = doc(collection(db, 'rate_limit_rules'));
      await setDoc(docRef, rule);

      logger.info('Rate limit rule created', { 
        endpoint: ruleData.endpoint,
        maxRequests: ruleData.maxRequests 
      });

      return {
        success: true,
        data: { id: docRef.id, ...rule }
      };

    } catch (error) {
      logger.error('Error creating rate limit rule', { 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create rule'
      };
    }
  }

  /**
   * Desbloquear IP
   */
  async unblockIP(ip: string, reason?: string): Promise<{ success: boolean; error?: string }> {
    try {
      this.blockedIPs.delete(ip);
      this.suspiciousIPs.delete(ip);

      await this.logSecurityEvent({
        type: 'unauthorized_access',
        severity: 'low',
        ip,
        blocked: false,
        description: `IP unblocked manually`,
        metadata: { 
          reason: reason || 'Manual unblock',
          action: 'unblocked'
        }
      });

      logger.info('IP unblocked', { ip, reason });

      return { success: true };

    } catch (error) {
      logger.error('Error unblocking IP', { 
        ip,
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to unblock IP'
      };
    }
  }
}

// Esquemas de validación comunes
export const validationSchemas = {
  // Validación de email
  email: z.string()
    .email('Email inválido')
    .max(254, 'Email demasiado largo')
    .transform(email => email.toLowerCase().trim()),

  // Validación de contraseña
  password: z.string()
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .max(128, 'La contraseña es demasiado larga')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'La contraseña debe contener al menos una minúscula, una mayúscula y un número'),

  // Validación de texto limpio (sin HTML, SQL, etc.)
  cleanText: z.string()
    .max(1000, 'Texto demasiado largo')
    .regex(/^[^<>{}$&]*$/, 'El texto contiene caracteres no permitidos')
    .transform(text => text.trim()),

  // Validación de URL
  url: z.string()
    .url('URL inválida')
    .max(2048, 'URL demasiado larga')
    .regex(/^https?:\/\//, 'Solo se permiten URLs HTTP/HTTPS'),

  // Validación de teléfono
  phone: z.string()
    .regex(/^\+?[1-9]\d{1,14}$/, 'Número de teléfono inválido')
    .max(20, 'Número demasiado largo'),

  // Validación de tarjeta de crédito
  cardData: z.object({
    title: z.string()
      .min(1, 'El título es requerido')
      .max(100, 'Título demasiado largo')
      .regex(/^[^<>{}$&]*$/, 'Título contiene caracteres no permitidos'),
    description: z.string()
      .max(500, 'Descripción demasiado larga')
      .regex(/^[^<>{}$&]*$/, 'Descripción contiene caracteres no permitidos')
      .optional(),
    bio: z.string()
      .max(1000, 'Bio demasiado larga')
      .regex(/^[^<>{}$&]*$/, 'Bio contiene caracteres no permitidos')
      .optional()
  }),

  // Validación de reserva
  bookingData: z.object({
    serviceId: z.string()
      .min(1, 'ID de servicio requerido')
      .regex(/^[a-zA-Z0-9_-]+$/, 'ID de servicio inválido'),
    date: z.date()
      .min(new Date(), 'La fecha debe ser futura'),
    customerName: z.string()
      .min(1, 'Nombre requerido')
      .max(100, 'Nombre demasiado largo')
      .regex(/^[a-zA-ZÀ-ÿ\s]+$/, 'Nombre contiene caracteres inválidos'),
    customerEmail: validationSchemas.email,
    customerPhone: validationSchemas.phone.optional()
  })
};

export const securityService = new SecurityService();