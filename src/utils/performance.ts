import { onCLS, onINP, onFCP, onLCP, onTTFB } from 'web-vitals';

export interface WebVitalsMetric {
  id: string;
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta: number;
  entries: PerformanceEntry[];
}

export interface PerformanceData {
  lcp?: number;
  inp?: number;
  cls?: number;
  fcp?: number;
  ttfb?: number;
  timestamp: number;
  url: string;
  userAgent: string;
}

class PerformanceMonitor {
  private metrics: Map<string, WebVitalsMetric> = new Map();
  private onMetricCallback?: (metric: WebVitalsMetric) => void;

  constructor() {
    this.initializeWebVitals();
  }

  private initializeWebVitals() {
    // Largest Contentful Paint
    onLCP((metric) => {
      this.handleMetric(metric);
    });

    // Interaction to Next Paint
    onINP((metric) => {
      this.handleMetric(metric);
    });

    // Cumulative Layout Shift
    onCLS((metric) => {
      this.handleMetric(metric);
    });

    // First Contentful Paint
    onFCP((metric) => {
      this.handleMetric(metric);
    });

    // Time to First Byte
    onTTFB((metric) => {
      this.handleMetric(metric);
    });
  }

  private handleMetric(metric: WebVitalsMetric) {
    this.metrics.set(metric.name, metric);
    
    // Send to analytics
    this.sendToAnalytics(metric);
    
    // Call callback if set
    if (this.onMetricCallback) {
      this.onMetricCallback(metric);
    }

    // Log in development
    if (import.meta.env.DEV) {
      this.logMetric(metric);
    }
  }

  private sendToAnalytics(metric: WebVitalsMetric) {
    // Send to your analytics service
    const performanceData: PerformanceData = {
      [metric.name.toLowerCase()]: metric.value,
      timestamp: Date.now(),
      url: window.location.href,
      userAgent: navigator.userAgent,
    };

    // You can send this to Firebase Analytics, Google Analytics, or your own service
    if (window.gtag) {
      window.gtag('event', metric.name, {
        event_category: 'Web Vitals',
        value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
        metric_id: metric.id,
        metric_value: metric.value,
        metric_delta: metric.delta,
        custom_map: {
          metric_rating: metric.rating,
        },
      });
    }

    // Store in localStorage for performance dashboard
    this.storeMetricLocally(performanceData);
  }

  private storeMetricLocally(data: PerformanceData) {
    try {
      const storageKey = 'klycs-performance-metrics';
      const stored = localStorage.getItem(storageKey);
      const metrics = stored ? JSON.parse(stored) : [];
      
      metrics.push(data);
      
      // Keep only last 100 metrics
      if (metrics.length > 100) {
        metrics.splice(0, metrics.length - 100);
      }
      
      localStorage.setItem(storageKey, JSON.stringify(metrics));
    } catch (error) {
      // Silent fail for storage issues
    }
  }

  private logMetric(metric: WebVitalsMetric) {
    const color = metric.rating === 'good' ? 'green' : 
                  metric.rating === 'needs-improvement' ? 'orange' : 'red';
    
    console.group(`%c🔍 ${metric.name}`, `color: ${color}; font-weight: bold;`);
    console.log(`Value: ${metric.value.toFixed(2)}${metric.name === 'CLS' ? '' : 'ms'}`);
    console.log(`Rating: ${metric.rating}`);
    console.log(`Delta: ${metric.delta.toFixed(2)}`);
    console.groupEnd();
  }

  public onMetric(callback: (metric: WebVitalsMetric) => void) {
    this.onMetricCallback = callback;
  }

  public getMetrics(): Map<string, WebVitalsMetric> {
    return this.metrics;
  }

  public getStoredMetrics(): PerformanceData[] {
    try {
      const stored = localStorage.getItem('klycs-performance-metrics');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  public getPerformanceScore(): number {
    const metrics = this.getMetrics();
    const scores: number[] = [];

    metrics.forEach((metric) => {
      let score = 0;
      switch (metric.rating) {
        case 'good':
          score = 100;
          break;
        case 'needs-improvement':
          score = 75;
          break;
        case 'poor':
          score = 50;
          break;
      }
      scores.push(score);
    });

    return scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
  }

  public measureCustomMetric(name: string, startTime: number) {
    const endTime = performance.now();
    const duration = endTime - startTime;

    const customMetric = {
      name: `custom_${name}`,
      value: duration,
      timestamp: Date.now(),
      url: window.location.href,
    };

    // Store custom metric
    this.storeMetricLocally({
      ...customMetric,
      userAgent: navigator.userAgent
    } as PerformanceData);

    if (import.meta.env.DEV) {
      console.log(`⏱️ ${name}: ${duration.toFixed(2)}ms`);
    }

    return duration;
  }

  public measureResourceTiming() {
    const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
    
    const slowResources = resources
      .filter(resource => resource.duration > 1000)
      .map(resource => ({
        name: resource.name,
        duration: resource.duration,
        size: resource.transferSize,
        type: resource.initiatorType,
      }));

    if (slowResources.length > 0 && import.meta.env.DEV) {
      console.warn('🐌 Slow resources detected:', slowResources);
    }

    return {
      totalResources: resources.length,
      slowResources: slowResources.length,
      averageLoadTime: resources.reduce((acc, r) => acc + r.duration, 0) / resources.length,
    };
  }
}

// Create global instance
export const performanceMonitor = new PerformanceMonitor();

// Performance utilities
export const measureFunction = <T extends (...args: any[]) => any>(
  fn: T,
  name: string
): T => {
  return ((...args: any[]) => {
    const startTime = performance.now();
    const result = fn(...args);
    
    if (result instanceof Promise) {
      return result.finally(() => {
        performanceMonitor.measureCustomMetric(name, startTime);
      });
    } else {
      performanceMonitor.measureCustomMetric(name, startTime);
      return result;
    }
  }) as T;
};

export const withPerformanceTracking = (name: string) => {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    const originalMethod = descriptor.value;
    
    descriptor.value = function (...args: any[]) {
      const startTime = performance.now();
      const result = originalMethod.apply(this, args);
      
      if (result instanceof Promise) {
        return result.finally(() => {
          performanceMonitor.measureCustomMetric(`${name}_${propertyKey}`, startTime);
        });
      } else {
        performanceMonitor.measureCustomMetric(`${name}_${propertyKey}`, startTime);
        return result;
      }
    };
    
    return descriptor;
  };
};

// Performance observer for long tasks
export const observeLongTasks = () => {
  if ('PerformanceObserver' in window) {
    try {
      const observer = new PerformanceObserver((list) => {
        const longTasks = list.getEntries();
        longTasks.forEach((task) => {
          if (import.meta.env.DEV) {
            console.warn(`🐌 Long task detected: ${task.duration.toFixed(2)}ms`);
          }
          
          // Send to analytics
          if (window.gtag) {
            window.gtag('event', 'long_task', {
              event_category: 'Performance',
              value: Math.round(task.duration),
              custom_map: {
                task_name: task.name,
                start_time: task.startTime,
              },
            });
          }
        });
      });
      
      observer.observe({ entryTypes: ['longtask'] });
    } catch (error) {
      // PerformanceObserver not supported
    }
  }
};

// Initialize performance monitoring
export const initializePerformanceMonitoring = () => {
  // Start Web Vitals monitoring (already initialized in constructor)
  
  // Observe long tasks
  observeLongTasks();
  
  // Monitor resource loading
  window.addEventListener('load', () => {
    setTimeout(() => {
      performanceMonitor.measureResourceTiming();
    }, 1000);
  });
  
  // Track navigation timing
  window.addEventListener('load', () => {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    
    const timings = {
      dns: navigation.domainLookupEnd - navigation.domainLookupStart,
      tcp: navigation.connectEnd - navigation.connectStart,
      ttfb: navigation.responseStart - navigation.requestStart,
      download: navigation.responseEnd - navigation.responseStart,
      domProcessing: navigation.domContentLoadedEventStart - navigation.responseEnd,
      total: navigation.loadEventEnd - navigation.fetchStart,
    };
    
    if (import.meta.env.DEV) {
      console.table(timings);
    }
    
    // Send navigation timings to analytics
    Object.entries(timings).forEach(([key, value]) => {
      if (window.gtag) {
        window.gtag('event', `navigation_${key}`, {
          event_category: 'Performance',
          value: Math.round(value),
        });
      }
    });
  });
};

// Types for global gtag
declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
  }
}