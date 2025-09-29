// Performance monitoring and real-time metrics for CalistaLife.com
import { reportMessage, trackPerformance } from './sentry';

interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: number;
  metadata?: Record<string, any>;
}

interface PerformanceThresholds {
  pageLoad: number;
  apiResponse: number;
  imageLoad: number;
  componentRender: number;
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private observers: Map<string, PerformanceObserver> = new Map();
  private thresholds: PerformanceThresholds = {
    pageLoad: 2000, // 2 seconds
    apiResponse: 500, // 500ms
    imageLoad: 3000, // 3 seconds
    componentRender: 100, // 100ms
  };
  
  private alertCallbacks: ((metric: PerformanceMetric) => void)[] = [];

  constructor() {
    this.initPerformanceObservers();
  }

  // Initialize browser performance observers
  private initPerformanceObservers() {
    // Page load performance
    if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
      // Navigation timing
      const navObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'navigation') {
            const navEntry = entry as PerformanceNavigationTiming;
            this.recordMetric('page_load_time', navEntry.loadEventEnd - navEntry.fetchStart, {
              type: 'navigation',
              url: window.location.href,
              redirectCount: navEntry.redirectCount,
              transferSize: navEntry.transferSize,
            });
          }
        }
      });
      
      try {
        navObserver.observe({ entryTypes: ['navigation'] });
        this.observers.set('navigation', navObserver);
      } catch (e) {
        console.warn('Navigation timing not supported');
      }

      // Resource loading performance
      const resourceObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'resource') {
            const resourceEntry = entry as PerformanceResourceTiming;
            const loadTime = resourceEntry.responseEnd - resourceEntry.fetchStart;
            
            // Categorize resources
            let category = 'other';
            if (resourceEntry.name.includes('.jpg') || resourceEntry.name.includes('.png') || resourceEntry.name.includes('.webp')) {
              category = 'image';
            } else if (resourceEntry.name.includes('.js')) {
              category = 'script';
            } else if (resourceEntry.name.includes('.css')) {
              category = 'stylesheet';
            } else if (resourceEntry.name.includes('/api/')) {
              category = 'api';
            }
            
            this.recordMetric(`${category}_load_time`, loadTime, {
              type: 'resource',
              url: resourceEntry.name,
              transferSize: resourceEntry.transferSize,
              encodedBodySize: resourceEntry.encodedBodySize,
            });

            // Check for slow images
            if (category === 'image' && loadTime > this.thresholds.imageLoad) {
              this.triggerAlert('slow_image_load', loadTime, {
                url: resourceEntry.name,
                size: resourceEntry.transferSize,
              });
            }
          }
        }
      });
      
      try {
        resourceObserver.observe({ entryTypes: ['resource'] });
        this.observers.set('resource', resourceObserver);
      } catch (e) {
        console.warn('Resource timing not supported');
      }

      // First paint and contentful paint
      const paintObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.recordMetric(entry.name.replace('-', '_'), entry.startTime, {
            type: 'paint',
          });
        }
      });
      
      try {
        paintObserver.observe({ entryTypes: ['paint'] });
        this.observers.set('paint', paintObserver);
      } catch (e) {
        console.warn('Paint timing not supported');
      }

      // Largest contentful paint
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        
        this.recordMetric('largest_contentful_paint', lastEntry.startTime, {
          type: 'lcp',
          element: (lastEntry as any).element?.tagName,
          size: (lastEntry as any).size,
        });
      });
      
      try {
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
        this.observers.set('lcp', lcpObserver);
      } catch (e) {
        console.warn('LCP timing not supported');
      }

      // Layout shift tracking
      const clsObserver = new PerformanceObserver((list) => {
        let clsValue = 0;
        for (const entry of list.getEntries()) {
          if (!(entry as any).hadRecentInput) {
            clsValue += (entry as any).value;
          }
        }
        
        if (clsValue > 0) {
          this.recordMetric('cumulative_layout_shift', clsValue, {
            type: 'cls',
          });
        }
      });
      
      try {
        clsObserver.observe({ entryTypes: ['layout-shift'] });
        this.observers.set('cls', clsObserver);
      } catch (e) {
        console.warn('CLS timing not supported');
      }
    }
  }

  // Record a performance metric
  recordMetric(name: string, value: number, metadata?: Record<string, any>) {
    const metric: PerformanceMetric = {
      name,
      value,
      timestamp: Date.now(),
      metadata,
    };

    this.metrics.push(metric);

    // Check thresholds
    this.checkThresholds(metric);

    // Send to monitoring service
    this.sendToMonitoringService(metric);

    // Keep only recent metrics (last 100)
    if (this.metrics.length > 100) {
      this.metrics.shift();
    }
  }

  // Check if metric exceeds thresholds
  private checkThresholds(metric: PerformanceMetric) {
    let threshold: number | undefined;
    
    switch (metric.name) {
      case 'page_load_time':
        threshold = this.thresholds.pageLoad;
        break;
      case 'api_load_time':
        threshold = this.thresholds.apiResponse;
        break;
      case 'image_load_time':
        threshold = this.thresholds.imageLoad;
        break;
    }

    if (threshold && metric.value > threshold) {
      this.triggerAlert(metric.name, metric.value, metric.metadata);
    }
  }

  // Trigger performance alert
  private triggerAlert(metricName: string, value: number, metadata?: Record<string, any>) {
    const alertData = {
      metric: metricName,
      value,
      threshold: this.getThreshold(metricName),
      metadata,
      url: window.location.href,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
    };

    // Log to console in development
    if (import.meta.env.DEV) {
      console.warn('🚨 Performance Alert:', alertData);
    }

    // Send to Sentry
    reportMessage(`Performance Alert: ${metricName} exceeded threshold`, 'warning', alertData);

    // Trigger callbacks
    const metric: PerformanceMetric = {
      name: metricName,
      value,
      timestamp: Date.now(),
      metadata,
    };
    
    this.alertCallbacks.forEach(callback => {
      try {
        callback(metric);
      } catch (error) {
        console.error('Performance alert callback error:', error);
      }
    });
  }

  private getThreshold(metricName: string): number {
    const thresholdMap: Record<string, number> = {
      'page_load_time': this.thresholds.pageLoad,
      'api_load_time': this.thresholds.apiResponse,
      'image_load_time': this.thresholds.imageLoad,
      'component_render_time': this.thresholds.componentRender,
    };
    
    return thresholdMap[metricName] || 0;
  }

  // Send metric to monitoring service
  private sendToMonitoringService(metric: PerformanceMetric) {
    // In production, send to your monitoring service (New Relic, Datadog, etc.)
    if (typeof window !== 'undefined' && window.gtag) {
      // Send to Google Analytics
      window.gtag('event', 'performance_metric', {
        metric_name: metric.name,
        metric_value: metric.value,
        custom_parameter: metric.metadata,
      });
    }

    // Send to custom monitoring endpoint
    if (import.meta.env.PROD && import.meta.env.VITE_MONITORING_ENDPOINT) {
      fetch(import.meta.env.VITE_MONITORING_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'performance_metric',
          data: metric,
        }),
      }).catch(error => {
        console.error('Failed to send metric to monitoring service:', error);
      });
    }
  }

  // Public API methods
  onAlert(callback: (metric: PerformanceMetric) => void) {
    this.alertCallbacks.push(callback);
  }

  setThresholds(thresholds: Partial<PerformanceThresholds>) {
    this.thresholds = { ...this.thresholds, ...thresholds };
  }

  getMetrics(name?: string): PerformanceMetric[] {
    return name 
      ? this.metrics.filter(m => m.name === name)
      : this.metrics;
  }

  clearMetrics() {
    this.metrics = [];
  }

  // Track custom performance operations
  async trackOperation<T>(name: string, operation: () => Promise<T>): Promise<T> {
    const startTime = performance.now();
    
    try {
      const result = await operation();
      const duration = performance.now() - startTime;
      
      this.recordMetric(name, duration, {
        type: 'custom_operation',
        status: 'success',
      });
      
      return result;
    } catch (error) {
      const duration = performance.now() - startTime;
      
      this.recordMetric(name, duration, {
        type: 'custom_operation',
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      
      throw error;
    }
  }

  // Track API calls
  trackAPICall(url: string, method: string = 'GET') {
    const startTime = performance.now();
    
    return {
      finish: (success: boolean, statusCode?: number, size?: number) => {
        const duration = performance.now() - startTime;
        
        this.recordMetric('api_response_time', duration, {
          type: 'api_call',
          url: url.replace(/\/[0-9a-f-]{36}/g, '/:id'), // Remove UUIDs for grouping
          method,
          success,
          statusCode,
          size,
        });

        // Check API response threshold
        if (duration > this.thresholds.apiResponse) {
          this.triggerAlert('slow_api_response', duration, {
            url,
            method,
            statusCode,
          });
        }
      },
    };
  }

  // Clean up observers
  disconnect() {
    this.observers.forEach(observer => {
      observer.disconnect();
    });
    this.observers.clear();
  }
}

// Create singleton instance
export const performanceMonitor = new PerformanceMonitor();

// React hook for performance tracking
export const usePerformanceTracking = () => {
  return {
    trackOperation: performanceMonitor.trackOperation.bind(performanceMonitor),
    trackAPICall: performanceMonitor.trackAPICall.bind(performanceMonitor),
    recordMetric: performanceMonitor.recordMetric.bind(performanceMonitor),
  };
};

// Higher-order component for performance tracking
export const withPerformanceTracking = <P extends object>(
  Component: React.ComponentType<P>,
  componentName?: string
) => {
  return (props: P) => {
    const renderStartTime = performance.now();
    
    React.useEffect(() => {
      const renderTime = performance.now() - renderStartTime;
      performanceMonitor.recordMetric(
        'component_render_time',
        renderTime,
        {
          component: componentName || Component.name || 'Unknown',
          type: 'react_component',
        }
      );
    }, []);

    return <Component {...props} />;
  };
};

// Web Vitals tracking
export const trackWebVitals = () => {
  if (typeof window !== 'undefined') {
    // Track Core Web Vitals using the web-vitals library
    import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
      getCLS((metric) => {
        performanceMonitor.recordMetric('cls', metric.value, {
          type: 'web_vital',
          id: metric.id,
          entries: metric.entries.length,
        });
      });

      getFID((metric) => {
        performanceMonitor.recordMetric('fid', metric.value, {
          type: 'web_vital',
          id: metric.id,
        });
      });

      getFCP((metric) => {
        performanceMonitor.recordMetric('fcp', metric.value, {
          type: 'web_vital',
          id: metric.id,
        });
      });

      getLCP((metric) => {
        performanceMonitor.recordMetric('lcp', metric.value, {
          type: 'web_vital',
          id: metric.id,
        });
      });

      getTTFB((metric) => {
        performanceMonitor.recordMetric('ttfb', metric.value, {
          type: 'web_vital',
          id: metric.id,
        });
      });
    }).catch(console.warn);
  }
};

export default performanceMonitor;