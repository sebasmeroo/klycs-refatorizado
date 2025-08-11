import { onCLS, onINP, onFCP, onLCP, onTTFB } from 'web-vitals';
import { info, warn } from '@/utils/logger';

export interface WebVitalsMetric {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  timestamp: number;
  url: string;
  id: string;
}

export interface PerformanceBudget {
  LCP: { good: number; poor: number }; // Largest Contentful Paint
  INP: { good: number; poor: number }; // Interaction to Next Paint
  CLS: { good: number; poor: number }; // Cumulative Layout Shift
  FCP: { good: number; poor: number }; // First Contentful Paint
  TTFB: { good: number; poor: number }; // Time to First Byte
}

// Performance budgets based on Google recommendations
const PERFORMANCE_BUDGETS: PerformanceBudget = {
  LCP: { good: 2500, poor: 4000 },
  INP: { good: 200, poor: 500 }, // INP thresholds: good ≤200ms, poor >500ms
  CLS: { good: 0.1, poor: 0.25 },
  FCP: { good: 1800, poor: 3000 },
  TTFB: { good: 800, poor: 1800 }
};

class WebVitalsMonitor {
  private metrics: WebVitalsMetric[] = [];
  private isEnabled: boolean = true;

  constructor() {
    this.initializeMonitoring();
  }

  private initializeMonitoring() {
    if (typeof window === 'undefined' || !this.isEnabled) return;

    // Monitor Core Web Vitals
    onCLS(this.handleMetric.bind(this, 'CLS'));
    onINP(this.handleMetric.bind(this, 'INP'));
    onFCP(this.handleMetric.bind(this, 'FCP'));
    onLCP(this.handleMetric.bind(this, 'LCP'));
    onTTFB(this.handleMetric.bind(this, 'TTFB'));

    // Send metrics before page unload
    window.addEventListener('beforeunload', () => {
      this.sendMetrics();
    });

    // Send metrics after 30 seconds
    setTimeout(() => {
      this.sendMetrics();
    }, 30000);
  }

  private handleMetric(name: string, metric: any) {
    const webVitalMetric: WebVitalsMetric = {
      name,
      value: metric.value,
      rating: this.getRating(name, metric.value),
      timestamp: Date.now(),
      url: window.location.href,
      id: metric.id
    };

    this.metrics.push(webVitalMetric);

    // Log performance issues
    if (webVitalMetric.rating === 'poor') {
      warn(`Poor ${name} performance detected`, {
        component: 'WebVitalsMonitor',
        metric: name,
        value: metric.value,
        threshold: this.getThreshold(name, 'poor'),
        url: window.location.href
      });
    }

    // Log to console in development
    if (import.meta.env.DEV) {
      console.group(`🔍 Web Vitals: ${name}`);
      console.log(`Value: ${metric.value}${this.getUnit(name)}`);
      console.log(`Rating: ${webVitalMetric.rating}`);
      console.log(`URL: ${window.location.href}`);
      console.groupEnd();
    }
  }

  private getRating(metricName: string, value: number): 'good' | 'needs-improvement' | 'poor' {
    const budget = PERFORMANCE_BUDGETS[metricName as keyof PerformanceBudget];
    if (!budget) return 'good';

    if (value <= budget.good) return 'good';
    if (value <= budget.poor) return 'needs-improvement';
    return 'poor';
  }

  private getThreshold(metricName: string, level: 'good' | 'poor'): number {
    const budget = PERFORMANCE_BUDGETS[metricName as keyof PerformanceBudget];
    return budget ? budget[level] : 0;
  }

  private getUnit(metricName: string): string {
    switch (metricName) {
      case 'CLS':
        return '';
      case 'INP':
      case 'LCP':
      case 'FCP':
      case 'TTFB':
        return 'ms';
      default:
        return '';
    }
  }

  private async sendMetrics() {
    if (this.metrics.length === 0) return;

    try {
      // Log metrics for analysis
      info('Web Vitals metrics collected', {
        component: 'WebVitalsMonitor',
        metrics: this.metrics,
        url: window.location.href
      });

      // Send to analytics service (Google Analytics 4)
      if (typeof window !== 'undefined' && (window as any).gtag) {
        this.metrics.forEach(metric => {
          (window as any).gtag('event', 'web_vitals', {
            event_category: 'Web Vitals',
            event_label: metric.name,
            value: Math.round(metric.value),
            custom_parameter_1: metric.rating,
            custom_parameter_2: metric.url
          });
        });
      }

      // Send to custom analytics endpoint (if configured)
      if (import.meta.env.VITE_ANALYTICS_ENDPOINT) {
        await fetch(import.meta.env.VITE_ANALYTICS_ENDPOINT, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            type: 'web-vitals',
            metrics: this.metrics,
            timestamp: Date.now(),
            url: window.location.href,
            userAgent: navigator.userAgent
          })
        });
      }

      // Clear sent metrics
      this.metrics = [];

    } catch (error) {
      warn('Failed to send Web Vitals metrics', {
        component: 'WebVitalsMonitor',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Public methods
  public getMetrics(): WebVitalsMetric[] {
    return [...this.metrics];
  }

  public getCurrentMetrics(): Promise<WebVitalsMetric[]> {
    // En web-vitals v5, los métodos getCurrentXXX no están disponibles
    // Devolvemos las métricas que ya hemos recopilado
    return Promise.resolve([...this.metrics]);
  }

  public getPerformanceScore(): number {
    if (this.metrics.length === 0) return 100;

    const scores = this.metrics.map(metric => {
      switch (metric.rating) {
        case 'good': return 100;
        case 'needs-improvement': return 75;
        case 'poor': return 25;
        default: return 100;
      }
    });

    return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
  }

  public enable() {
    this.isEnabled = true;
    this.initializeMonitoring();
  }

  public disable() {
    this.isEnabled = false;
  }
}

// Create singleton instance
export const webVitalsMonitor = new WebVitalsMonitor();

// Export for manual initialization
export const initWebVitals = () => {
  return webVitalsMonitor;
};

export default webVitalsMonitor;