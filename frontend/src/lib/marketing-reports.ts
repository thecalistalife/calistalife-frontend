// Automated marketing reports system for campaign attribution and customer analytics
import { analytics } from './analytics';
import { utmTracker } from './utm-tracker';
import { marketingMonitoring } from './marketing-monitoring';

interface ReportConfig {
  id: string;
  name: string;
  type: 'daily' | 'weekly' | 'monthly' | 'campaign';
  schedule: string; // cron format
  recipients: string[];
  metrics: string[];
  segments: string[];
  enabled: boolean;
}

interface CustomerSegment {
  id: string;
  name: string;
  description: string;
  criteria: {
    quality_preference?: 'premium' | 'standard' | 'budget';
    sustainability_focus?: boolean;
    avg_order_value_min?: number;
    total_orders_min?: number;
    lifetime_value_min?: number;
    acquisition_source?: string[];
  };
  size: number;
  conversion_rate: number;
  avg_order_value: number;
  lifetime_value: number;
}

interface CampaignAttribution {
  source: string;
  medium: string;
  campaign: string;
  sessions: number;
  conversions: number;
  revenue: number;
  cost: number;
  roas: number;
  quality_conversions: number;
  avg_quality_score: number;
}

interface QualityMetrics {
  overall_quality_conversion_rate: number;
  quality_premium_factor: number;
  sustainability_conversion_rate: number;
  premium_segment_size: number;
  quality_customer_ltv: number;
  quality_retention_rate: number;
  top_quality_products: Array<{
    product_id: string;
    name: string;
    quality_score: number;
    conversion_rate: number;
    revenue: number;
  }>;
}

interface ReportData {
  report_id: string;
  generated_at: string;
  period: {
    start_date: string;
    end_date: string;
  };
  summary: {
    total_revenue: number;
    total_sessions: number;
    overall_conversion_rate: number;
    total_orders: number;
    avg_order_value: number;
  };
  attribution: CampaignAttribution[];
  segments: CustomerSegment[];
  quality_metrics: QualityMetrics;
  top_performers: {
    campaigns: CampaignAttribution[];
    products: any[];
    influencers: any[];
  };
  alerts_summary: {
    total_alerts: number;
    critical_alerts: number;
    resolved_alerts: number;
  };
}

class MarketingReports {
  private reports: ReportConfig[] = [];
  private reportHistory: ReportData[] = [];
  private isSchedulerActive = false;
  private schedulerInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.initializeDefaultReports();
    this.startScheduler();
  }

  // Initialize default report configurations
  private initializeDefaultReports() {
    this.reports = [
      {
        id: 'daily_performance',
        name: 'Daily Performance Summary',
        type: 'daily',
        schedule: '0 9 * * *', // 9 AM daily
        recipients: ['marketing@calista.com', 'analytics@calista.com'],
        metrics: ['revenue', 'conversions', 'sessions', 'roas', 'quality_metrics'],
        segments: ['all', 'quality_focused', 'sustainability_focused'],
        enabled: true,
      },
      {
        id: 'weekly_attribution',
        name: 'Weekly Attribution Analysis',
        type: 'weekly',
        schedule: '0 10 * * 1', // 10 AM Monday
        recipients: ['marketing@calista.com', 'executive@calista.com'],
        metrics: ['attribution', 'channel_performance', 'customer_segments', 'quality_trends'],
        segments: ['all', 'premium', 'eco_conscious', 'loyal'],
        enabled: true,
      },
      {
        id: 'monthly_insights',
        name: 'Monthly Strategic Insights',
        type: 'monthly',
        schedule: '0 9 1 * *', // 9 AM on 1st of month
        recipients: ['executive@calista.com', 'marketing@calista.com', 'finance@calista.com'],
        metrics: ['comprehensive', 'trends', 'forecasts', 'recommendations'],
        segments: ['comprehensive'],
        enabled: true,
      },
      {
        id: 'influencer_performance',
        name: 'Influencer Performance Report',
        type: 'weekly',
        schedule: '0 11 * * 2', // 11 AM Tuesday
        recipients: ['influencer@calista.com', 'marketing@calista.com'],
        metrics: ['influencer_attribution', 'commission_tracking', 'content_performance'],
        segments: ['influencer_driven'],
        enabled: true,
      },
    ];
  }

  // Start report scheduler
  startScheduler() {
    if (this.isSchedulerActive) return;

    this.isSchedulerActive = true;
    
    // Check every hour for scheduled reports
    this.schedulerInterval = setInterval(() => {
      this.checkScheduledReports();
    }, 60 * 60 * 1000); // Every hour

    console.log('📊 Marketing reports scheduler started');
  }

  // Stop report scheduler
  stopScheduler() {
    if (!this.isSchedulerActive) return;

    this.isSchedulerActive = false;
    if (this.schedulerInterval) {
      clearInterval(this.schedulerInterval);
      this.schedulerInterval = null;
    }

    console.log('📊 Marketing reports scheduler stopped');
  }

  // Check for scheduled reports that need to be generated
  private checkScheduledReports() {
    const now = new Date();
    
    this.reports.filter(report => report.enabled).forEach(report => {
      if (this.shouldGenerateReport(report, now)) {
        this.generateReport(report.id);
      }
    });
  }

  // Check if report should be generated based on schedule
  private shouldGenerateReport(report: ReportConfig, now: Date): boolean {
    // Simple scheduling logic - in production, use a proper cron library
    const hour = now.getHours();
    const dayOfWeek = now.getDay();
    const dayOfMonth = now.getDate();

    switch (report.type) {
      case 'daily':
        return hour === 9; // 9 AM daily
      case 'weekly':
        return dayOfWeek === 1 && hour === 10; // Monday 10 AM
      case 'monthly':
        return dayOfMonth === 1 && hour === 9; // 1st of month 9 AM
      default:
        return false;
    }
  }

  // Generate report by ID
  async generateReport(reportId: string): Promise<ReportData | null> {
    const reportConfig = this.reports.find(r => r.id === reportId);
    if (!reportConfig) {
      console.error(`Report configuration not found: ${reportId}`);
      return null;
    }

    try {
      console.log(`📊 Generating report: ${reportConfig.name}`);

      const reportData = await this.collectReportData(reportConfig);
      
      // Store report in history
      this.reportHistory.unshift(reportData);
      
      // Keep only last 100 reports
      this.reportHistory = this.reportHistory.slice(0, 100);

      // Send report to recipients
      await this.sendReportToRecipients(reportConfig, reportData);

      // Track report generation event
      analytics.trackCustomEvent('marketing_report_generated', {
        report_id: reportId,
        report_type: reportConfig.type,
        recipients_count: reportConfig.recipients.length,
        data_points: Object.keys(reportData.summary).length,
      });

      console.log(`✅ Report generated successfully: ${reportConfig.name}`);
      return reportData;
    } catch (error) {
      console.error(`❌ Failed to generate report ${reportId}:`, error);
      return null;
    }
  }

  // Collect data for report
  private async collectReportData(config: ReportConfig): Promise<ReportData> {
    const period = this.getReportPeriod(config.type);
    
    return {
      report_id: `${config.id}_${Date.now()}`,
      generated_at: new Date().toISOString(),
      period,
      summary: await this.collectSummaryData(period),
      attribution: await this.collectAttributionData(period),
      segments: await this.collectSegmentData(config.segments),
      quality_metrics: await this.collectQualityMetrics(period),
      top_performers: await this.collectTopPerformers(period),
      alerts_summary: this.collectAlertsData(period),
    };
  }

  // Get report period based on type
  private getReportPeriod(type: string): { start_date: string; end_date: string } {
    const now = new Date();
    const end_date = now.toISOString();
    let start_date: string;

    switch (type) {
      case 'daily':
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        start_date = yesterday.toISOString();
        break;
      case 'weekly':
        const weekAgo = new Date(now);
        weekAgo.setDate(weekAgo.getDate() - 7);
        start_date = weekAgo.toISOString();
        break;
      case 'monthly':
        const monthAgo = new Date(now);
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        start_date = monthAgo.toISOString();
        break;
      default:
        start_date = new Date(now.setDate(now.getDate() - 1)).toISOString();
    }

    return { start_date, end_date };
  }

  // Collect summary data (mock implementation - replace with real data)
  private async collectSummaryData(period: any) {
    return {
      total_revenue: Math.floor(Math.random() * 50000) + 10000,
      total_sessions: Math.floor(Math.random() * 5000) + 1000,
      overall_conversion_rate: Math.random() * 5 + 2,
      total_orders: Math.floor(Math.random() * 200) + 50,
      avg_order_value: Math.random() * 100 + 80,
    };
  }

  // Collect attribution data
  private async collectAttributionData(period: any): Promise<CampaignAttribution[]> {
    return [
      {
        source: 'instagram',
        medium: 'social',
        campaign: 'quality_spring_2024',
        sessions: Math.floor(Math.random() * 1000) + 200,
        conversions: Math.floor(Math.random() * 50) + 10,
        revenue: Math.random() * 15000 + 5000,
        cost: Math.random() * 3000 + 1000,
        roas: Math.random() * 3 + 2,
        quality_conversions: Math.floor(Math.random() * 20) + 5,
        avg_quality_score: Math.random() * 3 + 7,
      },
      {
        source: 'facebook',
        medium: 'social',
        campaign: 'quality_spring_2024',
        sessions: Math.floor(Math.random() * 800) + 150,
        conversions: Math.floor(Math.random() * 40) + 8,
        revenue: Math.random() * 12000 + 4000,
        cost: Math.random() * 2500 + 800,
        roas: Math.random() * 3 + 2.2,
        quality_conversions: Math.floor(Math.random() * 15) + 3,
        avg_quality_score: Math.random() * 3 + 6.5,
      },
      {
        source: 'google',
        medium: 'cpc',
        campaign: 'premium_fashion_search',
        sessions: Math.floor(Math.random() * 1200) + 300,
        conversions: Math.floor(Math.random() * 60) + 15,
        revenue: Math.random() * 18000 + 6000,
        cost: Math.random() * 4000 + 1500,
        roas: Math.random() * 2 + 2.5,
        quality_conversions: Math.floor(Math.random() * 25) + 8,
        avg_quality_score: Math.random() * 3 + 7.5,
      },
    ];
  }

  // Collect customer segment data
  private async collectSegmentData(segments: string[]): Promise<CustomerSegment[]> {
    const allSegments: CustomerSegment[] = [
      {
        id: 'quality_focused',
        name: 'Quality-Focused Customers',
        description: 'Customers who prioritize quality over price',
        criteria: {
          quality_preference: 'premium',
          avg_order_value_min: 150,
        },
        size: Math.floor(Math.random() * 500) + 200,
        conversion_rate: Math.random() * 3 + 6,
        avg_order_value: Math.random() * 100 + 180,
        lifetime_value: Math.random() * 200 + 400,
      },
      {
        id: 'sustainability_focused',
        name: 'Sustainability-Focused Customers',
        description: 'Customers who prioritize sustainable and eco-friendly products',
        criteria: {
          sustainability_focus: true,
          avg_order_value_min: 120,
        },
        size: Math.floor(Math.random() * 300) + 150,
        conversion_rate: Math.random() * 2 + 7,
        avg_order_value: Math.random() * 80 + 140,
        lifetime_value: Math.random() * 150 + 350,
      },
      {
        id: 'premium',
        name: 'Premium Customers',
        description: 'High-value customers with luxury preferences',
        criteria: {
          quality_preference: 'premium',
          avg_order_value_min: 200,
          total_orders_min: 3,
        },
        size: Math.floor(Math.random() * 200) + 80,
        conversion_rate: Math.random() * 2 + 8,
        avg_order_value: Math.random() * 150 + 250,
        lifetime_value: Math.random() * 300 + 600,
      },
    ];

    if (segments.includes('all') || segments.includes('comprehensive')) {
      return allSegments;
    }

    return allSegments.filter(segment => segments.includes(segment.id));
  }

  // Collect quality-specific metrics
  private async collectQualityMetrics(period: any): Promise<QualityMetrics> {
    return {
      overall_quality_conversion_rate: Math.random() * 2 + 4,
      quality_premium_factor: Math.random() * 1 + 2.5,
      sustainability_conversion_rate: Math.random() * 3 + 6,
      premium_segment_size: Math.floor(Math.random() * 400) + 200,
      quality_customer_ltv: Math.random() * 200 + 450,
      quality_retention_rate: Math.random() * 20 + 70,
      top_quality_products: [
        {
          product_id: 'premium_dress_001',
          name: 'Premium Silk Evening Dress',
          quality_score: 9.2,
          conversion_rate: 8.5,
          revenue: Math.random() * 5000 + 2000,
        },
        {
          product_id: 'sustainable_blouse_002',
          name: 'Organic Cotton Premium Blouse',
          quality_score: 8.9,
          conversion_rate: 7.8,
          revenue: Math.random() * 3000 + 1500,
        },
      ],
    };
  }

  // Collect top performers data
  private async collectTopPerformers(period: any) {
    const attribution = await this.collectAttributionData(period);
    
    return {
      campaigns: attribution.sort((a, b) => b.roas - a.roas).slice(0, 3),
      products: [
        { id: 'premium_dress_001', name: 'Premium Silk Evening Dress', revenue: 5420, conversions: 23 },
        { id: 'sustainable_blouse_002', name: 'Organic Cotton Premium Blouse', revenue: 3680, conversions: 18 },
        { id: 'quality_pants_003', name: 'Premium Wool Trousers', revenue: 2940, conversions: 15 },
      ],
      influencers: [
        { name: 'Sarah Johnson', revenue: 4200, conversions: 21, commission_owed: 336 },
        { name: 'Mike Torres', revenue: 3800, conversions: 19, commission_owed: 456 },
        { name: 'Emma Chen', revenue: 2600, conversions: 13, commission_owed: 260 },
      ],
    };
  }

  // Collect alerts data
  private collectAlertsData(period: any) {
    const status = marketingMonitoring.getMonitoringStatus();
    
    return {
      total_alerts: status.total_alerts,
      critical_alerts: marketingMonitoring.getRecentAlerts().filter(a => a.severity === 'critical').length,
      resolved_alerts: status.total_alerts - status.unresolved_alerts,
    };
  }

  // Send report to recipients
  private async sendReportToRecipients(config: ReportConfig, reportData: ReportData) {
    const reportContent = this.generateReportContent(config, reportData);
    
    // In production, this would send actual emails
    console.log(`📧 Sending ${config.name} to:`, config.recipients);
    console.log('Report preview:', reportContent.slice(0, 500) + '...');
    
    // Track email sent event
    analytics.trackCustomEvent('marketing_report_sent', {
      report_id: reportData.report_id,
      report_type: config.type,
      recipients_count: config.recipients.length,
    });
  }

  // Generate report content
  private generateReportContent(config: ReportConfig, data: ReportData): string {
    return `
📊 ${config.name}
Period: ${new Date(data.period.start_date).toLocaleDateString()} - ${new Date(data.period.end_date).toLocaleDateString()}
Generated: ${new Date(data.generated_at).toLocaleString()}

🎯 PERFORMANCE SUMMARY
======================
Total Revenue: $${data.summary.total_revenue.toLocaleString()}
Total Sessions: ${data.summary.total_sessions.toLocaleString()}
Conversion Rate: ${data.summary.overall_conversion_rate.toFixed(2)}%
Total Orders: ${data.summary.total_orders}
Average Order Value: $${data.summary.avg_order_value.toFixed(2)}

📈 TOP CAMPAIGNS
================
${data.attribution.map(attr => 
  `${attr.source}/${attr.campaign}: $${attr.revenue.toFixed(2)} revenue, ${attr.roas.toFixed(2)}x ROAS`
).join('\n')}

✨ QUALITY METRICS
==================
Quality Conversion Rate: ${data.quality_metrics.overall_quality_conversion_rate.toFixed(2)}%
Quality Premium Factor: ${data.quality_metrics.quality_premium_factor.toFixed(2)}x
Sustainability CVR: ${data.quality_metrics.sustainability_conversion_rate.toFixed(2)}%
Premium Segment Size: ${data.quality_metrics.premium_segment_size}

👥 CUSTOMER SEGMENTS
====================
${data.segments.map(segment => 
  `${segment.name}: ${segment.size} customers, ${segment.conversion_rate.toFixed(2)}% CVR, $${segment.avg_order_value.toFixed(2)} AOV`
).join('\n')}

🏆 TOP PERFORMERS
=================
Best Campaign: ${data.top_performers.campaigns[0]?.campaign || 'N/A'}
Best Product: ${data.top_performers.products[0]?.name || 'N/A'}
Best Influencer: ${data.top_performers.influencers[0]?.name || 'N/A'}

🚨 ALERTS SUMMARY
=================
Total Alerts: ${data.alerts_summary.total_alerts}
Critical Alerts: ${data.alerts_summary.critical_alerts}
Resolved Alerts: ${data.alerts_summary.resolved_alerts}

---
This report was automatically generated by TheCalista Marketing Analytics System.
For questions, contact: analytics@calista.com
`;
  }

  // Get report by ID
  getReport(reportId: string): ReportData | null {
    return this.reportHistory.find(r => r.report_id === reportId) || null;
  }

  // Get recent reports
  getRecentReports(limit: number = 10): ReportData[] {
    return this.reportHistory.slice(0, limit);
  }

  // Get reports by type
  getReportsByType(type: string): ReportData[] {
    const typeConfigs = this.reports.filter(r => r.type === type);
    const configIds = typeConfigs.map(r => r.id);
    
    return this.reportHistory.filter(r => 
      configIds.some(id => r.report_id.startsWith(id))
    );
  }

  // Add or update report configuration
  configureReport(config: ReportConfig): void {
    const existingIndex = this.reports.findIndex(r => r.id === config.id);
    
    if (existingIndex >= 0) {
      this.reports[existingIndex] = config;
    } else {
      this.reports.push(config);
    }

    analytics.trackCustomEvent('marketing_report_configured', {
      report_id: config.id,
      report_type: config.type,
      enabled: config.enabled,
    });
  }

  // Delete report configuration
  deleteReportConfig(reportId: string): boolean {
    const initialLength = this.reports.length;
    this.reports = this.reports.filter(r => r.id !== reportId);
    
    if (this.reports.length < initialLength) {
      analytics.trackCustomEvent('marketing_report_deleted', {
        report_id: reportId,
      });
      return true;
    }
    
    return false;
  }

  // Get all report configurations
  getReportConfigs(): ReportConfig[] {
    return [...this.reports];
  }

  // Generate ad-hoc report
  async generateAdHocReport(
    name: string,
    metrics: string[],
    segments: string[],
    period?: { start_date: string; end_date: string }
  ): Promise<ReportData> {
    const config: ReportConfig = {
      id: `adhoc_${Date.now()}`,
      name,
      type: 'campaign',
      schedule: '',
      recipients: [],
      metrics,
      segments,
      enabled: false,
    };

    const reportData = await this.collectReportData(config);
    
    if (period) {
      reportData.period = period;
    }

    this.reportHistory.unshift(reportData);
    
    analytics.trackCustomEvent('adhoc_report_generated', {
      report_name: name,
      metrics_count: metrics.length,
      segments_count: segments.length,
    });

    return reportData;
  }

  // Export report data
  exportReport(reportId: string, format: 'json' | 'csv' = 'json'): string | null {
    const report = this.getReport(reportId);
    if (!report) return null;

    if (format === 'json') {
      return JSON.stringify(report, null, 2);
    }

    // CSV format (simplified)
    if (format === 'csv') {
      const summary = report.summary;
      return `Metric,Value
Total Revenue,${summary.total_revenue}
Total Sessions,${summary.total_sessions}
Conversion Rate,${summary.overall_conversion_rate}
Total Orders,${summary.total_orders}
Average Order Value,${summary.avg_order_value}`;
    }

    return null;
  }

  // Get reporting status
  getReportingStatus() {
    return {
      scheduler_active: this.isSchedulerActive,
      total_reports: this.reportHistory.length,
      active_configs: this.reports.filter(r => r.enabled).length,
      total_configs: this.reports.length,
      last_generated: this.reportHistory[0]?.generated_at || null,
    };
  }
}

// Create singleton instance
export const marketingReports = new MarketingReports();

// React hook for marketing reports
export const useMarketingReports = () => {
  return {
    generateReport: marketingReports.generateReport.bind(marketingReports),
    generateAdHocReport: marketingReports.generateAdHocReport.bind(marketingReports),
    getRecentReports: marketingReports.getRecentReports.bind(marketingReports),
    getReport: marketingReports.getReport.bind(marketingReports),
    getReportConfigs: marketingReports.getReportConfigs.bind(marketingReports),
    configureReport: marketingReports.configureReport.bind(marketingReports),
    exportReport: marketingReports.exportReport.bind(marketingReports),
    getReportingStatus: marketingReports.getReportingStatus.bind(marketingReports),
  };
};

export default marketingReports;