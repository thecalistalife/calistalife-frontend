// Marketing analytics monitoring and alerting system
import { sentry } from './sentry';
import { analytics } from './analytics';

interface MarketingAlert {
  id: string;
  type: 'analytics_failure' | 'conversion_drop' | 'revenue_spike' | 'utm_anomaly' | 'influencer_performance';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  data: Record<string, any>;
  timestamp: number;
  resolved: boolean;
}

interface ThresholdConfig {
  conversion_rate_drop: number; // Percentage drop that triggers alert
  revenue_spike_multiplier: number; // Revenue multiplier for spike detection
  analytics_error_rate: number; // Error rate threshold for analytics events
  utm_session_threshold: number; // Minimum sessions for UTM validation
  influencer_cvr_threshold: number; // Minimum CVR for influencer alerts
}

interface CampaignPerformanceSnapshot {
  timestamp: number;
  total_sessions: number;
  conversions: number;
  revenue: number;
  analytics_errors: number;
  utm_attribution_rate: number;
  top_sources: string[];
}

class MarketingMonitoring {
  private alerts: MarketingAlert[] = [];
  private thresholds: ThresholdConfig = {
    conversion_rate_drop: 20, // 20% drop triggers alert
    revenue_spike_multiplier: 2.0, // 2x revenue spike
    analytics_error_rate: 5, // 5% error rate
    utm_session_threshold: 50, // Minimum 50 sessions
    influencer_cvr_threshold: 1, // 1% minimum CVR
  };
  
  private performanceHistory: CampaignPerformanceSnapshot[] = [];
  private isMonitoring = false;
  private monitoringInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.setupAnalyticsErrorTracking();
    this.startPerformanceMonitoring();
  }

  // Setup error tracking for analytics events
  private setupAnalyticsErrorTracking() {
    // Monitor GA4 failures
    const originalGtag = window.gtag;
    if (originalGtag) {
      window.gtag = (...args: any[]) => {
        try {
          return originalGtag(...args);
        } catch (error) {
          this.trackAnalyticsError('GA4', error, args);
          throw error;
        }
      };
    }

    // Monitor Facebook Pixel failures
    const originalFbq = window.fbq;
    if (originalFbq) {
      window.fbq = (...args: any[]) => {
        try {
          return originalFbq(...args);
        } catch (error) {
          this.trackAnalyticsError('Facebook Pixel', error, args);
          throw error;
        }
      };
    }

    // Monitor fetch requests to analytics endpoints
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const [url] = args;
      try {
        const response = await originalFetch(...args);
        
        // Check if it's an analytics-related request that failed
        if (typeof url === 'string' && this.isAnalyticsEndpoint(url) && !response.ok) {
          this.trackAnalyticsError('HTTP Request', new Error(`${response.status}: ${response.statusText}`), { url });
        }
        
        return response;
      } catch (error) {
        if (typeof url === 'string' && this.isAnalyticsEndpoint(url)) {
          this.trackAnalyticsError('Network Error', error, { url });
        }
        throw error;
      }
    };
  }

  // Check if URL is an analytics endpoint
  private isAnalyticsEndpoint(url: string): boolean {
    const analyticsPatterns = [
      'google-analytics.com',
      'googletagmanager.com',
      'facebook.com/tr',
      'connect.facebook.net',
      'doubleclick.net',
      'analytics.google.com',
    ];
    
    return analyticsPatterns.some(pattern => url.includes(pattern));
  }

  // Track analytics errors
  private trackAnalyticsError(platform: string, error: any, context: any) {
    const errorData = {
      platform,
      error_message: error?.message || 'Unknown error',
      context,
      user_agent: navigator.userAgent,
      timestamp: Date.now(),
    };

    // Send to Sentry
    sentry.captureException(error, {
      tags: {
        component: 'marketing_analytics',
        platform,
      },
      extra: errorData,
    });

    // Create internal alert
    this.createAlert({
      type: 'analytics_failure',
      severity: 'high',
      message: `${platform} analytics error: ${error?.message || 'Unknown error'}`,
      data: errorData,
    });

    console.error(`🚨 Marketing Analytics Error [${platform}]:`, errorData);
  }

  // Start performance monitoring
  startPerformanceMonitoring() {
    if (this.isMonitoring) return;

    this.isMonitoring = true;
    this.monitoringInterval = setInterval(() => {
      this.capturePerformanceSnapshot();
      this.analyzePerformanceTrends();
    }, 60000); // Every minute

    console.log('🔍 Marketing performance monitoring started');
  }

  // Stop performance monitoring
  stopPerformanceMonitoring() {
    if (!this.isMonitoring) return;

    this.isMonitoring = false;
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }

    console.log('⏹️ Marketing performance monitoring stopped');
  }

  // Capture current performance snapshot
  private capturePerformanceSnapshot() {
    // In production, this would get real data from your analytics API
    const snapshot: CampaignPerformanceSnapshot = {
      timestamp: Date.now(),
      total_sessions: this.getMockSessionCount(),
      conversions: this.getMockConversions(),
      revenue: this.getMockRevenue(),
      analytics_errors: this.getRecentAnalyticsErrors(),
      utm_attribution_rate: this.getMockAttributionRate(),
      top_sources: this.getMockTopSources(),
    };

    this.performanceHistory.push(snapshot);

    // Keep only last 24 hours of snapshots
    const twentyFourHoursAgo = Date.now() - (24 * 60 * 60 * 1000);
    this.performanceHistory = this.performanceHistory.filter(s => s.timestamp > twentyFourHoursAgo);
  }

  // Analyze performance trends and generate alerts
  private analyzePerformanceTrends() {
    if (this.performanceHistory.length < 2) return;

    const current = this.performanceHistory[this.performanceHistory.length - 1];
    const previous = this.performanceHistory[this.performanceHistory.length - 2];

    // Conversion rate monitoring
    this.checkConversionRateTrends(current, previous);

    // Revenue monitoring
    this.checkRevenueTrends(current, previous);

    // Analytics error rate monitoring
    this.checkAnalyticsErrorRate(current);

    // UTM attribution monitoring
    this.checkUTMAttributionTrends(current, previous);
  }

  // Check conversion rate trends
  private checkConversionRateTrends(current: CampaignPerformanceSnapshot, previous: CampaignPerformanceSnapshot) {
    const currentCVR = current.conversions / current.total_sessions * 100;
    const previousCVR = previous.conversions / previous.total_sessions * 100;
    
    const dropPercentage = ((previousCVR - currentCVR) / previousCVR) * 100;

    if (dropPercentage > this.thresholds.conversion_rate_drop) {
      this.createAlert({
        type: 'conversion_drop',
        severity: 'critical',
        message: `Conversion rate dropped ${dropPercentage.toFixed(1)}% (${currentCVR.toFixed(2)}% → ${previousCVR.toFixed(2)}%)`,
        data: {
          current_cvr: currentCVR,
          previous_cvr: previousCVR,
          drop_percentage: dropPercentage,
          current_conversions: current.conversions,
          current_sessions: current.total_sessions,
        },
      });
    }
  }

  // Check revenue trends
  private checkRevenueTrends(current: CampaignPerformanceSnapshot, previous: CampaignPerformanceSnapshot) {
    const revenueMultiplier = current.revenue / previous.revenue;

    if (revenueMultiplier >= this.thresholds.revenue_spike_multiplier) {
      this.createAlert({
        type: 'revenue_spike',
        severity: 'low',
        message: `Revenue spike detected: ${revenueMultiplier.toFixed(1)}x increase ($${previous.revenue.toFixed(2)} → $${current.revenue.toFixed(2)})`,
        data: {
          current_revenue: current.revenue,
          previous_revenue: previous.revenue,
          multiplier: revenueMultiplier,
        },
      });
    } else if (revenueMultiplier < 0.7) {
      this.createAlert({
        type: 'conversion_drop',
        severity: 'medium',
        message: `Revenue decline: ${((1 - revenueMultiplier) * 100).toFixed(1)}% drop ($${previous.revenue.toFixed(2)} → $${current.revenue.toFixed(2)})`,
        data: {
          current_revenue: current.revenue,
          previous_revenue: previous.revenue,
          decline_percentage: (1 - revenueMultiplier) * 100,
        },
      });
    }
  }

  // Check analytics error rate
  private checkAnalyticsErrorRate(current: CampaignPerformanceSnapshot) {
    const errorRate = current.analytics_errors / current.total_sessions * 100;

    if (errorRate > this.thresholds.analytics_error_rate) {
      this.createAlert({
        type: 'analytics_failure',
        severity: 'high',
        message: `High analytics error rate: ${errorRate.toFixed(1)}% (${current.analytics_errors} errors in ${current.total_sessions} sessions)`,
        data: {
          error_rate: errorRate,
          total_errors: current.analytics_errors,
          total_sessions: current.total_sessions,
        },
      });
    }
  }

  // Check UTM attribution trends
  private checkUTMAttributionTrends(current: CampaignPerformanceSnapshot, previous: CampaignPerformanceSnapshot) {
    const attributionDrop = previous.utm_attribution_rate - current.utm_attribution_rate;

    if (attributionDrop > 10 && current.total_sessions > this.thresholds.utm_session_threshold) {
      this.createAlert({
        type: 'utm_anomaly',
        severity: 'medium',
        message: `UTM attribution rate dropped ${attributionDrop.toFixed(1)}% (${previous.utm_attribution_rate.toFixed(1)}% → ${current.utm_attribution_rate.toFixed(1)}%)`,
        data: {
          current_attribution_rate: current.utm_attribution_rate,
          previous_attribution_rate: previous.utm_attribution_rate,
          drop_percentage: attributionDrop,
          total_sessions: current.total_sessions,
        },
      });
    }
  }

  // Create and process alert
  private createAlert(alertData: {
    type: MarketingAlert['type'];
    severity: MarketingAlert['severity'];
    message: string;
    data: Record<string, any>;
  }) {
    const alert: MarketingAlert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      resolved: false,
      ...alertData,
    };

    this.alerts.unshift(alert);
    
    // Keep only last 100 alerts
    this.alerts = this.alerts.slice(0, 100);

    // Send to external monitoring systems
    this.sendAlertToExternalSystems(alert);

    // Auto-resolve certain types of alerts after time
    if (alert.severity === 'low') {
      setTimeout(() => this.resolveAlert(alert.id), 30 * 60 * 1000); // 30 minutes
    }
  }

  // Send alert to external monitoring systems
  private sendAlertToExternalSystems(alert: MarketingAlert) {
    // Send to Sentry
    sentry.captureMessage(`Marketing Alert: ${alert.message}`, {
      level: alert.severity === 'critical' ? 'error' : 
             alert.severity === 'high' ? 'warning' : 'info',
      tags: {
        alert_type: alert.type,
        severity: alert.severity,
      },
      extra: alert.data,
    });

    // Custom event for dashboard
    analytics.trackCustomEvent('marketing_alert_created', {
      alert_id: alert.id,
      alert_type: alert.type,
      severity: alert.severity,
      message: alert.message,
    });

    console.log(`🚨 Marketing Alert [${alert.severity.toUpperCase()}]:`, alert.message);
  }

  // Resolve alert
  resolveAlert(alertId: string) {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.resolved = true;
      
      analytics.trackCustomEvent('marketing_alert_resolved', {
        alert_id: alertId,
        alert_type: alert.type,
        resolution_time: Date.now() - alert.timestamp,
      });
    }
  }

  // Get recent alerts
  getRecentAlerts(limit: number = 20): MarketingAlert[] {
    return this.alerts.slice(0, limit);
  }

  // Get unresolved alerts
  getUnresolvedAlerts(): MarketingAlert[] {
    return this.alerts.filter(alert => !alert.resolved);
  }

  // Get alerts by type
  getAlertsByType(type: MarketingAlert['type']): MarketingAlert[] {
    return this.alerts.filter(alert => alert.type === type);
  }

  // Update thresholds
  updateThresholds(newThresholds: Partial<ThresholdConfig>) {
    this.thresholds = { ...this.thresholds, ...newThresholds };
    
    analytics.trackCustomEvent('monitoring_thresholds_updated', {
      thresholds: this.thresholds,
    });
  }

  // Get current monitoring status
  getMonitoringStatus() {
    return {
      is_monitoring: this.isMonitoring,
      total_alerts: this.alerts.length,
      unresolved_alerts: this.getUnresolvedAlerts().length,
      performance_snapshots: this.performanceHistory.length,
      thresholds: this.thresholds,
      last_snapshot: this.performanceHistory[this.performanceHistory.length - 1],
    };
  }

  // Mock data methods (replace with real data in production)
  private getMockSessionCount(): number {
    return Math.floor(Math.random() * 500) + 200;
  }

  private getMockConversions(): number {
    return Math.floor(Math.random() * 20) + 5;
  }

  private getMockRevenue(): number {
    return Math.random() * 5000 + 1000;
  }

  private getMockAttributionRate(): number {
    return Math.random() * 40 + 30; // 30-70%
  }

  private getMockTopSources(): string[] {
    return ['instagram', 'facebook', 'google', 'email'];
  }

  private getRecentAnalyticsErrors(): number {
    return Math.floor(Math.random() * 5); // 0-4 errors
  }

  // Generate monitoring report
  generateMonitoringReport(): string {
    const status = this.getMonitoringStatus();
    const recentAlerts = this.getRecentAlerts(5);
    
    return `
🔍 Marketing Analytics Monitoring Report
========================================
Status: ${status.is_monitoring ? '✅ Active' : '❌ Inactive'}
Total Alerts: ${status.total_alerts}
Unresolved Alerts: ${status.unresolved_alerts}
Performance Snapshots: ${status.performance_snapshots}

Current Thresholds:
- Conversion Rate Drop: ${this.thresholds.conversion_rate_drop}%
- Revenue Spike Multiplier: ${this.thresholds.revenue_spike_multiplier}x
- Analytics Error Rate: ${this.thresholds.analytics_error_rate}%
- UTM Session Threshold: ${this.thresholds.utm_session_threshold}
- Influencer CVR Threshold: ${this.thresholds.influencer_cvr_threshold}%

Recent Alerts:
${recentAlerts.map(alert => 
  `- [${alert.severity.toUpperCase()}] ${alert.type}: ${alert.message}`
).join('\n')}

Last Performance Snapshot:
- Sessions: ${status.last_snapshot?.total_sessions || 0}
- Conversions: ${status.last_snapshot?.conversions || 0}
- Revenue: $${status.last_snapshot?.revenue.toFixed(2) || '0.00'}
- Attribution Rate: ${status.last_snapshot?.utm_attribution_rate.toFixed(1) || '0.0'}%
`;
  }
}

// Create singleton instance
export const marketingMonitoring = new MarketingMonitoring();

// React hook for marketing monitoring
export const useMarketingMonitoring = () => {
  return {
    getRecentAlerts: marketingMonitoring.getRecentAlerts.bind(marketingMonitoring),
    getUnresolvedAlerts: marketingMonitoring.getUnresolvedAlerts.bind(marketingMonitoring),
    resolveAlert: marketingMonitoring.resolveAlert.bind(marketingMonitoring),
    getMonitoringStatus: marketingMonitoring.getMonitoringStatus.bind(marketingMonitoring),
    generateMonitoringReport: marketingMonitoring.generateMonitoringReport.bind(marketingMonitoring),
    startMonitoring: marketingMonitoring.startPerformanceMonitoring.bind(marketingMonitoring),
    stopMonitoring: marketingMonitoring.stopPerformanceMonitoring.bind(marketingMonitoring),
  };
};

export default marketingMonitoring;