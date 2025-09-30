// Core Web Vitals monitoring and performance tracking
import { onCLS, onFID, onFCP, onLCP, onTTFB } from 'web-vitals';
import type { Metric } from 'web-vitals';
import { config } from './config';

interface WebVitalsConfig {
  reportAllChanges?: boolean;
  enableLogging?: boolean;
  enableAnalytics?: boolean;
  enableSentry?: boolean;
  reportToServer?: boolean;
  serverEndpoint?: string;
}

interface PerformanceMetrics {
  cls: number | null;
  fid: number | null;
  fcp: number | null;
  lcp: number | null;
  ttfb: number | null;
  timestamp: number;
  url: string;
  userAgent: string;
  connectionType: string;
  deviceType: 'mobile' | 'tablet' | 'desktop';
}

class WebVitalsManager {
  private config: WebVitalsConfig;
  private metrics: Partial<PerformanceMetrics> = {};
  private isInitialized = false;

  constructor(options: WebVitalsConfig = {}) {
    this.config = {
      reportAllChanges: false,
      enableLogging: true,
      enableAnalytics: true,
      enableSentry: true,
      reportToServer: false,
      serverEndpoint: '/api/analytics/web-vitals',
      ...options
    };
  }

  // Initialize Web Vitals monitoring
  init(): void {
    if (this.isInitialized || typeof window === 'undefined') return;

    this.isInitialized = true;
    
    // Initialize basic metrics
    this.metrics = {
      cls: null,
      fid: null,
      fcp: null,
      lcp: null,
      ttfb: null,
      timestamp: Date.now(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      connectionType: this.getConnectionType(),
      deviceType: this.getDeviceType(),
    };

    // Start monitoring Core Web Vitals
    this.startMonitoring();

    // Report when page is about to unload
    window.addEventListener('beforeunload', () => {
      this.reportMetrics();
    });

    // Report when page becomes hidden
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.reportMetrics();
      }
    });

    console.log('📊 Web Vitals monitoring initialized');
  }

  // Start monitoring all Core Web Vitals
  private startMonitoring(): void {
    const reportMetric = (metric: Metric) => {
      this.handleMetric(metric);
    };

    // Cumulative Layout Shift
    onCLS(reportMetric, { reportAllChanges: this.config.reportAllChanges });
    
    // First Input Delay
    onFID(reportMetric);
    
    // First Contentful Paint
    onFCP(reportMetric);
    
    // Largest Contentful Paint
    onLCP(reportMetric, { reportAllChanges: this.config.reportAllChanges });
    
    // Time to First Byte
    onTTFB(reportMetric);

    // Get initial values for metrics that might already be available
    this.getInitialMetrics();
  }

  // Get initial metrics if available
  private async getInitialMetrics(): Promise<void> {
    // Note: In newer web-vitals versions, we rely on the onXXX callbacks
    // to capture metrics as they become available rather than trying to get
    // immediate values with getXXX functions
    console.log('Web Vitals initialized - metrics will be captured as they become available');
  }

  // Handle individual metric
  private handleMetric(metric: Metric): void {
    const { name, value, id, rating } = metric;
    
    // Update local metrics
    this.updateMetric(name.toLowerCase() as keyof PerformanceMetrics, value);

    if (this.config.enableLogging) {
      const emoji = this.getMetricEmoji(name, rating);
      console.log(`${emoji} ${name}: ${value.toFixed(2)}ms (${rating})`);
    }

    // Send to analytics
    if (this.config.enableAnalytics) {
      this.sendToAnalytics(metric);
    }

    // Send to Sentry
    if (this.config.enableSentry) {
      this.sendToSentry(metric);
    }

    // Immediate reporting for critical metrics
    if (this.isCriticalMetric(metric)) {
      this.reportMetrics();
    }
  }

  // Update metric value
  private updateMetric(name: keyof PerformanceMetrics, value: number): void {
    (this.metrics as any)[name] = value;
  }

  // Get metric emoji for logging
  private getMetricEmoji(name: string, rating: 'good' | 'needs-improvement' | 'poor'): string {
    const emojis = {
      CLS: '🎯',
      FID: '⚡',
      FCP: '🎨',
      LCP: '🖼️',
      TTFB: '🚀'
    };

    const ratingEmojis = {
      good: '✅',
      'needs-improvement': '⚠️',
      poor: '❌'
    };

    return `${emojis[name as keyof typeof emojis] || '📊'} ${ratingEmojis[rating]}`;
  }

  // Check if metric is critical and should be reported immediately
  private isCriticalMetric(metric: Metric): boolean {
    return metric.rating === 'poor' || 
           (metric.name === 'LCP' && metric.value > 4000) ||
           (metric.name === 'FID' && metric.value > 300) ||
           (metric.name === 'CLS' && metric.value > 0.25);
  }

  // Send metric to Google Analytics
  private sendToAnalytics(metric: Metric): void {
    if (!window.gtag || !config.ga4MeasurementId) return;

    try {
      window.gtag('event', metric.name, {
        event_category: 'Web Vitals',
        event_label: metric.id,
        value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
        custom_parameter_1: metric.rating,
        custom_parameter_2: this.getDeviceType(),
        custom_parameter_3: this.getConnectionType(),
        non_interaction: true,
      });
    } catch (error) {
      console.warn('Failed to send Web Vitals to Analytics:', error);
    }
  }

  // Send metric to Sentry
  private sendToSentry(metric: Metric): void {
    try {
      if (typeof window !== 'undefined' && (window as any).Sentry) {
        const Sentry = (window as any).Sentry;
        
        // Add as breadcrumb
        Sentry.addBreadcrumb({
          category: 'web-vitals',
          message: `${metric.name}: ${metric.value.toFixed(2)}`,
          level: metric.rating === 'poor' ? 'warning' : 'info',
          data: {
            value: metric.value,
            rating: metric.rating,
            id: metric.id,
            url: window.location.href,
          },
        });

        // Set measurement
        Sentry.setMeasurement(metric.name, metric.value, 'millisecond');

        // Send as transaction if poor rating
        if (metric.rating === 'poor') {
          Sentry.withScope((scope) => {
            scope.setTag('web-vital', metric.name);
            scope.setLevel('warning');
            Sentry.captureMessage(`Poor Web Vital: ${metric.name} = ${metric.value.toFixed(2)}`, 'warning');
          });
        }
      }
    } catch (error) {
      console.warn('Failed to send Web Vitals to Sentry:', error);
    }
  }

  // Report all metrics to server
  private reportMetrics(): void {
    if (!this.config.reportToServer || !this.config.serverEndpoint) return;

    const completeMetrics: PerformanceMetrics = {
      cls: this.metrics.cls || 0,
      fid: this.metrics.fid || 0,
      fcp: this.metrics.fcp || 0,
      lcp: this.metrics.lcp || 0,
      ttfb: this.metrics.ttfb || 0,
      timestamp: this.metrics.timestamp || Date.now(),
      url: this.metrics.url || window.location.href,
      userAgent: this.metrics.userAgent || navigator.userAgent,
      connectionType: this.metrics.connectionType || 'unknown',
      deviceType: this.metrics.deviceType || 'desktop',
    };

    // Send to server endpoint
    try {
      navigator.sendBeacon(
        this.config.serverEndpoint,
        JSON.stringify(completeMetrics)
      );
    } catch (error) {
      console.warn('Failed to send Web Vitals to server:', error);
    }
  }

  // Get connection type
  private getConnectionType(): string {
    const connection = (navigator as any).connection || 
                      (navigator as any).mozConnection || 
                      (navigator as any).webkitConnection;
    
    if (connection) {
      return connection.effectiveType || connection.type || 'unknown';
    }
    
    return 'unknown';
  }

  // Get device type based on screen size
  private getDeviceType(): 'mobile' | 'tablet' | 'desktop' {
    const width = window.innerWidth;
    
    if (width < 768) return 'mobile';
    if (width < 1024) return 'tablet';
    return 'desktop';
  }

  // Get performance summary
  getPerformanceSummary(): {
    score: number;
    rating: 'good' | 'needs-improvement' | 'poor';
    metrics: Partial<PerformanceMetrics>;
  } {
    const { cls = 0, fid = 0, lcp = 0 } = this.metrics;
    
    // Calculate overall performance score (0-100)
    let score = 100;
    
    // LCP scoring (0-40 points)
    if (lcp > 4000) score -= 40;
    else if (lcp > 2500) score -= 20;
    
    // FID scoring (0-30 points)
    if (fid > 300) score -= 30;
    else if (fid > 100) score -= 15;
    
    // CLS scoring (0-30 points)
    if (cls > 0.25) score -= 30;
    else if (cls > 0.1) score -= 15;
    
    const rating = score >= 90 ? 'good' : score >= 70 ? 'needs-improvement' : 'poor';
    
    return {
      score,
      rating,
      metrics: this.metrics as Partial<PerformanceMetrics>,
    };
  }

  // Get current metrics
  getCurrentMetrics(): Partial<PerformanceMetrics> {
    return { ...this.metrics };
  }
}

// Create singleton instance
export const webVitals = new WebVitalsManager({
  reportAllChanges: false,
  enableLogging: config.appEnv === 'development',
  enableAnalytics: !!config.ga4MeasurementId,
  enableSentry: !!config.sentryDsn,
  reportToServer: config.appEnv === 'production',
});

// Auto-initialize
if (typeof window !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => webVitals.init());
  } else {
    webVitals.init();
  }
}

// Export utility functions
export const getWebVitalsScore = () => webVitals.getPerformanceSummary().score;
export const getWebVitalsMetrics = () => webVitals.getCurrentMetrics();

export default webVitals;