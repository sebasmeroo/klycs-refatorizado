import { info, warn, error } from '@/utils/logger';
import { monitoringService } from './monitoring';

export interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  blockDuration?: number; // How long to block after exceeding limit
  skipSuccessfulRequests?: boolean; // Don't count successful requests
  skipFailedRequests?: boolean; // Don't count failed requests
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
  retryAfter?: number;
  error?: string;
}

export interface RateLimitEntry {
  count: number;
  windowStart: number;
  blocked?: boolean;
  blockExpiry?: number;
  lastReset?: number;
}

class RateLimitService {
  private storage: Map<string, RateLimitEntry> = new Map();
  private readonly configs: Map<string, RateLimitConfig> = new Map();

  constructor() {
    this.initializeDefaultConfigs();
    this.startCleanupInterval();
  }

  private initializeDefaultConfigs() {
    // Define rate limits for different actions
    this.configs.set('card_create', {
      windowMs: 60 * 60 * 1000, // 1 hour
      maxRequests: 5,
      blockDuration: 15 * 60 * 1000 // 15 minutes block
    });

    this.configs.set('file_upload', {
      windowMs: 60 * 60 * 1000, // 1 hour
      maxRequests: 20,
      blockDuration: 30 * 60 * 1000 // 30 minutes block
    });

    this.configs.set('login_attempt', {
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxRequests: 5,
      blockDuration: 60 * 60 * 1000, // 1 hour block
      skipSuccessfulRequests: true
    });

    this.configs.set('api_call', {
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 100,
      blockDuration: 5 * 60 * 1000 // 5 minutes block
    });

    this.configs.set('booking_create', {
      windowMs: 60 * 60 * 1000, // 1 hour
      maxRequests: 10,
      blockDuration: 30 * 60 * 1000 // 30 minutes block
    });

    this.configs.set('password_reset', {
      windowMs: 60 * 60 * 1000, // 1 hour
      maxRequests: 3,
      blockDuration: 2 * 60 * 60 * 1000 // 2 hours block
    });

    this.configs.set('contact_form', {
      windowMs: 60 * 60 * 1000, // 1 hour
      maxRequests: 5,
      blockDuration: 60 * 60 * 1000 // 1 hour block
    });
  }

  /**
   * Check if a request is allowed under rate limiting rules
   */
  public async checkRateLimit(
    action: string, 
    identifier: string, 
    options?: { 
      success?: boolean; 
      customConfig?: RateLimitConfig;
      bypassUserId?: string;
    }
  ): Promise<RateLimitResult> {
    try {
      const config = options?.customConfig || this.configs.get(action);
      
      if (!config) {
        warn(`No rate limit config found for action: ${action}`, {
          component: 'RateLimitService',
          action,
          identifier
        });
        return { allowed: true, remaining: Infinity, resetTime: 0 };
      }

      const key = `${action}:${identifier}`;
      const now = Date.now();
      const entry = this.storage.get(key) || {
        count: 0,
        windowStart: now,
        lastReset: now
      };

      // Check if currently blocked
      if (entry.blocked && entry.blockExpiry && now < entry.blockExpiry) {
        const retryAfter = Math.ceil((entry.blockExpiry - now) / 1000);
        
        await this.sendRateLimitAlert({
          action,
          identifier,
          type: 'blocked_request_attempted',
          remainingBlockTime: retryAfter
        });

        return {
          allowed: false,
          remaining: 0,
          resetTime: entry.blockExpiry,
          retryAfter,
          error: 'Rate limit exceeded. You are temporarily blocked.'
        };
      }

      // Check if we need to reset the window
      const timeSinceWindowStart = now - entry.windowStart;
      if (timeSinceWindowStart >= config.windowMs) {
        // Reset window
        entry.count = 0;
        entry.windowStart = now;
        entry.blocked = false;
        entry.blockExpiry = undefined;
        entry.lastReset = now;
      }

      // Skip counting based on config
      const shouldCount = this.shouldCountRequest(config, options?.success);
      
      if (shouldCount) {
        entry.count++;
      }

      // Check if limit exceeded
      if (entry.count > config.maxRequests) {
        // Block the identifier
        entry.blocked = true;
        entry.blockExpiry = now + (config.blockDuration || config.windowMs);
        
        await this.sendRateLimitAlert({
          action,
          identifier,
          type: 'rate_limit_exceeded',
          requestCount: entry.count,
          maxRequests: config.maxRequests,
          windowMs: config.windowMs,
          blockDuration: config.blockDuration
        });

        this.storage.set(key, entry);

        return {
          allowed: false,
          remaining: 0,
          resetTime: entry.blockExpiry,
          retryAfter: Math.ceil((entry.blockExpiry - now) / 1000),
          error: 'Rate limit exceeded. You have been temporarily blocked.'
        };
      }

      // Update storage
      this.storage.set(key, entry);

      const remaining = config.maxRequests - entry.count;
      const resetTime = entry.windowStart + config.windowMs;

      // Log when approaching limit
      if (remaining <= 2) {
        warn(`Rate limit approaching for ${action}`, {
          component: 'RateLimitService',
          action,
          identifier,
          remaining,
          count: entry.count,
          maxRequests: config.maxRequests
        });
      }

      return {
        allowed: true,
        remaining,
        resetTime
      };

    } catch (err) {
      error('Rate limit check failed', err as Error, {
        component: 'RateLimitService',
        action,
        identifier
      });

      // Fail open - allow request if rate limiting fails
      return { allowed: true, remaining: 0, resetTime: 0 };
    }
  }

  private shouldCountRequest(config: RateLimitConfig, success?: boolean): boolean {
    if (success === true && config.skipSuccessfulRequests) {
      return false;
    }
    
    if (success === false && config.skipFailedRequests) {
      return false;
    }
    
    return true;
  }

  /**
   * Reset rate limit for a specific action and identifier
   */
  public resetRateLimit(action: string, identifier: string): void {
    const key = `${action}:${identifier}`;
    this.storage.delete(key);
    
    info('Rate limit reset', {
      component: 'RateLimitService',
      action,
      identifier
    });
  }

  /**
   * Get current rate limit status
   */
  public getRateLimitStatus(action: string, identifier: string): RateLimitEntry | null {
    const key = `${action}:${identifier}`;
    return this.storage.get(key) || null;
  }

  /**
   * Add or update rate limit configuration
   */
  public setRateLimitConfig(action: string, config: RateLimitConfig): void {
    this.configs.set(action, config);
    
    info('Rate limit config updated', {
      component: 'RateLimitService',
      action,
      config
    });
  }

  /**
   * Get all active rate limits (for debugging/monitoring)
   */
  public getActiveLimits(): Array<{ key: string; entry: RateLimitEntry; config?: RateLimitConfig }> {
    const active: Array<{ key: string; entry: RateLimitEntry; config?: RateLimitConfig }> = [];
    
    for (const [key, entry] of this.storage.entries()) {
      const action = key.split(':')[0];
      const config = this.configs.get(action);
      active.push({ key, entry, config });
    }
    
    return active;
  }

  /**
   * Clean up expired entries
   */
  private startCleanupInterval(): void {
    const CLEANUP_INTERVAL = 5 * 60 * 1000; // 5 minutes
    
    setInterval(() => {
      this.cleanup();
    }, CLEANUP_INTERVAL);
  }

  private cleanup(): void {
    const now = Date.now();
    let cleanedCount = 0;
    
    for (const [key, entry] of this.storage.entries()) {
      const action = key.split(':')[0];
      const config = this.configs.get(action);
      
      if (!config) {
        this.storage.delete(key);
        cleanedCount++;
        continue;
      }
      
      // Remove if window has expired and not blocked
      const windowExpired = (now - entry.windowStart) > config.windowMs;
      const blockExpired = !entry.blocked || !entry.blockExpiry || now > entry.blockExpiry;
      
      if (windowExpired && blockExpired) {
        this.storage.delete(key);
        cleanedCount++;
      }
    }
    
    if (cleanedCount > 0) {
      info(`Cleaned up ${cleanedCount} expired rate limit entries`, {
        component: 'RateLimitService'
      });
    }
  }

  private async sendRateLimitAlert(data: {
    action: string;
    identifier: string;
    type: 'rate_limit_exceeded' | 'blocked_request_attempted';
    requestCount?: number;
    maxRequests?: number;
    windowMs?: number;
    blockDuration?: number;
    remainingBlockTime?: number;
  }): Promise<void> {
    try {
      const alertMessage = data.type === 'rate_limit_exceeded' 
        ? `Rate limit exceeded for ${data.action}`
        : `Blocked request attempted for ${data.action}`;

      // Send to monitoring service
      await monitoringService.sendSecurityAlert({
        type: 'rate_limit_exceeded',
        severity: 'medium',
        title: alertMessage,
        description: `Action: ${data.action}, Identifier: ${data.identifier}`,
        metadata: {
          action: data.action,
          identifier: data.identifier,
          type: data.type,
          requestCount: data.requestCount,
          maxRequests: data.maxRequests,
          windowMs: data.windowMs,
          blockDuration: data.blockDuration,
          remainingBlockTime: data.remainingBlockTime
        },
        metrics: {
          eventCount: data.requestCount || 1,
          timeWindow: data.windowMs ? `${data.windowMs / 1000}s` : 'unknown'
        }
      });

      warn('Rate limit alert sent', {
        component: 'RateLimitService',
        ...data
      });

    } catch (err) {
      error('Failed to send rate limit alert', err as Error, {
        component: 'RateLimitService',
        alertData: data
      });
    }
  }

  /**
   * Check if an IP or user is currently blocked for any action
   */
  public isBlocked(identifier: string): boolean {
    const now = Date.now();
    
    for (const [key, entry] of this.storage.entries()) {
      if (key.includes(identifier) && entry.blocked && entry.blockExpiry && now < entry.blockExpiry) {
        return true;
      }
    }
    
    return false;
  }

  /**
   * Get statistics about rate limiting
   */
  public getStats(): {
    totalEntries: number;
    blockedCount: number;
    configCount: number;
    topActions: Array<{ action: string; count: number }>;
  } {
    const now = Date.now();
    let blockedCount = 0;
    const actionCounts: Map<string, number> = new Map();
    
    for (const [key, entry] of this.storage.entries()) {
      const action = key.split(':')[0];
      actionCounts.set(action, (actionCounts.get(action) || 0) + 1);
      
      if (entry.blocked && entry.blockExpiry && now < entry.blockExpiry) {
        blockedCount++;
      }
    }
    
    const topActions = Array.from(actionCounts.entries())
      .map(([action, count]) => ({ action, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
    
    return {
      totalEntries: this.storage.size,
      blockedCount,
      configCount: this.configs.size,
      topActions
    };
  }
}

// Create singleton instance
export const rateLimitService = new RateLimitService();

// Helper function for easy use in components/services
export const checkRateLimit = (
  action: string, 
  identifier: string, 
  options?: { success?: boolean; customConfig?: RateLimitConfig }
): Promise<RateLimitResult> => {
  return rateLimitService.checkRateLimit(action, identifier, options);
};

export default rateLimitService;