import * as Sentry from '@sentry/react';
import { BrowserTracing } from '@sentry/tracing';
import { info, error, warn } from '@/utils/logger';
import React from 'react';
import { matchPath } from 'react-router-dom';

export interface MonitoringConfig {
  dsn: string;
  environment: string;
  release: string;
  sampleRate: number;
  tracesSampleRate: number;
}

export interface SecurityAlert {
  type: 'security_violation' | 'rate_limit_exceeded' | 'suspicious_activity' | 'authentication_failure';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  metadata: Record<string, any>;
  metrics: {
    eventCount: number;
    timeWindow: string;
  };
  userId?: string;
  ip?: string;
  userAgent?: string;
}

class MonitoringService {
  private isInitialized = false;
  private config: MonitoringConfig | null = null;

  public initialize(config: MonitoringConfig) {
    if (this.isInitialized) {
      warn('Monitoring service already initialized', { component: 'MonitoringService' });
      return;
    }

    try {
      Sentry.init({
        dsn: config.dsn,
        environment: config.environment,
        release: config.release,
        
        // Performance monitoring
        integrations: [
          new BrowserTracing(),
        ],

        // Sampling rates
        sampleRate: config.sampleRate,
        tracesSampleRate: config.tracesSampleRate,

        // Enhanced error reporting
        beforeSend(event) {
          // Filter out non-critical errors in development
          if (config.environment === 'development') {
            if (event.exception?.values?.[0]?.type === 'ChunkLoadError') {
              return null; // Don't send chunk load errors in dev
            }
          }

          // Add custom context
          if (event.user) {
            event.user = {
              ...event.user,
              timestamp: new Date().toISOString(),
            };
          }

          return event;
        },

        // Performance event filtering
        beforeSendTransaction(event) {
          // Filter out very fast transactions (< 100ms)
          if (event.start_timestamp && event.timestamp) {
            const duration = (event.timestamp - event.start_timestamp) * 1000;
            if (duration < 100) {
              return null;
            }
          }
          return event;
        },

        // Additional options
        attachStacktrace: true,
        autoSessionTracking: true,
        sendDefaultPii: false, // Don't send PII by default
      });

      this.config = config;
      this.isInitialized = true;

      info('Monitoring service initialized successfully', {
        component: 'MonitoringService',
        environment: config.environment,
        release: config.release
      });

    } catch (err) {
      error('Failed to initialize monitoring service', err as Error, {
        component: 'MonitoringService'
      });
    }
  }

  public setUser(user: { id: string; email?: string; name?: string }) {
    if (!this.isInitialized) return;

    Sentry.setUser({
      id: user.id,
      email: user.email,
      username: user.name,
    });

    info('User context set for monitoring', {
      component: 'MonitoringService',
      userId: user.id
    });
  }

  public clearUser() {
    if (!this.isInitialized) return;

    Sentry.setUser(null);
    info('User context cleared', { component: 'MonitoringService' });
  }

  public captureException(error: Error, context?: Record<string, any>) {
    if (!this.isInitialized) {
      console.error('Monitoring service not initialized:', error);
      return;
    }

    Sentry.captureException(error, {
      tags: {
        component: context?.component || 'unknown',
        feature: context?.feature || 'unknown',
      },
      extra: context,
      level: 'error',
    });

    // Also log locally
    this.logError(error, context);
  }

  public captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info', context?: Record<string, any>) {
    if (!this.isInitialized) {
      console.log('Monitoring service not initialized:', message);
      return;
    }

    Sentry.captureMessage(message, {
      level,
      tags: {
        component: context?.component || 'unknown',
      },
      extra: context,
    });
  }

  public addBreadcrumb(message: string, category: string, data?: Record<string, any>) {
    if (!this.isInitialized) return;

    Sentry.addBreadcrumb({
      message,
      category,
      data,
      level: 'info',
      timestamp: Date.now() / 1000,
    });
  }

  public async sendSecurityAlert(alert: SecurityAlert) {
    if (!this.isInitialized) {
      warn('Cannot send security alert - monitoring not initialized', { alert });
      return;
    }

    try {
      // Send to Sentry with high priority
      Sentry.captureMessage(alert.title, {
        level: this.mapSeverityToSentryLevel(alert.severity),
        tags: {
          alert_type: alert.type,
          severity: alert.severity,
          component: 'SecurityMonitoring',
        },
        extra: {
          description: alert.description,
          metadata: alert.metadata,
          metrics: alert.metrics,
          userId: alert.userId,
          ip: alert.ip,
          userAgent: alert.userAgent,
        },
      });

      // Send webhook notification for critical alerts
      if (alert.severity === 'critical' || alert.severity === 'high') {
        await this.sendWebhookAlert(alert);
      }

      info('Security alert sent successfully', {
        component: 'MonitoringService',
        alertType: alert.type,
        severity: alert.severity
      });

    } catch (err) {
      error('Failed to send security alert', err as Error, {
        component: 'MonitoringService',
        alert
      });
    }
  }

  private mapSeverityToSentryLevel(severity: SecurityAlert['severity']): Sentry.SeverityLevel {
    switch (severity) {
      case 'critical': return 'fatal';
      case 'high': return 'error';
      case 'medium': return 'warning';
      case 'low': return 'info';
      default: return 'info';
    }
  }

  private async sendWebhookAlert(alert: SecurityAlert) {
    const webhookUrl = import.meta.env.VITE_SECURITY_WEBHOOK_URL;
    if (!webhookUrl) return;

    try {
      const payload = {
        text: `🚨 ${alert.severity.toUpperCase()}: ${alert.title}`,
        attachments: [{
          color: this.getAlertColor(alert.severity),
          fields: [
            {
              title: 'Type',
              value: alert.type,
              short: true
            },
            {
              title: 'Severity',
              value: alert.severity,
              short: true
            },
            {
              title: 'Event Count',
              value: alert.metrics.eventCount.toString(),
              short: true
            },
            {
              title: 'Time Window',
              value: alert.metrics.timeWindow,
              short: true
            },
            {
              title: 'Description',
              value: alert.description,
              short: false
            }
          ],
          footer: 'Klycs Security Monitor',
          ts: Math.floor(Date.now() / 1000)
        }]
      };

      await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

    } catch (err) {
      error('Failed to send webhook alert', err as Error, {
        component: 'MonitoringService'
      });
    }
  }

  private getAlertColor(severity: SecurityAlert['severity']): string {
    switch (severity) {
      case 'critical': return 'danger';
      case 'high': return 'warning';
      case 'medium': return '#ff9500';
      case 'low': return 'good';
      default: return 'good';
    }
  }

  private logError(error: Error, context?: Record<string, any>) {
    const errorInfo = {
      message: error.message,
      stack: error.stack,
      name: error.name,
      ...context
    };

    error('Error captured by monitoring service', error, errorInfo);
  }

  public measurePerformance(name: string) {
    if (!this.isInitialized) return () => {};

    const startTime = performance.now();
    
    return () => {
      const duration = performance.now() - startTime;
      
      // Send custom metric to Sentry
      Sentry.addBreadcrumb({
        message: `Performance: ${name}`,
        category: 'performance',
        data: { duration },
        level: 'info'
      });

      // Log slow operations
      if (duration > 1000) {
        warn(`Slow operation detected: ${name}`, {
          component: 'MonitoringService',
          operation: name,
          duration: `${duration.toFixed(2)}ms`
        });
      }

      return duration;
    };
  }

  public isHealthy(): boolean {
    return this.isInitialized && this.config !== null;
  }

  public getConfig(): MonitoringConfig | null {
    return this.config;
  }
}

// Create singleton instance
export const monitoringService = new MonitoringService();

// Initialize with environment variables
export const initializeMonitoring = () => {
  const config: MonitoringConfig = {
    dsn: import.meta.env.VITE_SENTRY_DSN || '',
    environment: import.meta.env.NODE_ENV || 'development',
    release: import.meta.env.VITE_APP_VERSION || '1.0.0',
    sampleRate: import.meta.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    tracesSampleRate: import.meta.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  };

  if (config.dsn) {
    monitoringService.initialize(config);
  } else {
    // Only warn in production, silent in development
    if (config.environment === 'production') {
      warn('Sentry DSN not provided - monitoring disabled', {
        component: 'MonitoringService'
      });
    } else {
      // Silent in development - this is expected
      info('Monitoring disabled in development (no Sentry DSN)', {
        component: 'MonitoringService'
      });
    }
  }

  return monitoringService;
};

export default monitoringService;
