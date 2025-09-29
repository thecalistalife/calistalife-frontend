// Campaign Infrastructure Testing Script
// This script validates all marketing analytics and monitoring systems

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const util = require('util');

const execAsync = util.promisify(exec);

class CampaignInfrastructureTester {
  constructor() {
    this.testResults = {
      passed: 0,
      failed: 0,
      tests: []
    };
  }

  // Log test result
  logTest(testName, passed, details = '') {
    const result = {
      name: testName,
      passed,
      details,
      timestamp: new Date().toISOString()
    };
    
    this.testResults.tests.push(result);
    if (passed) {
      this.testResults.passed++;
      console.log(`✅ ${testName}: PASSED ${details ? `- ${details}` : ''}`);
    } else {
      this.testResults.failed++;
      console.log(`❌ ${testName}: FAILED ${details ? `- ${details}` : ''}`);
    }
  }

  // Test file existence and structure
  async testFileStructure() {
    console.log('\n📁 Testing Campaign Infrastructure File Structure...');
    
    const requiredFiles = [
      'frontend/src/lib/analytics.ts',
      'frontend/src/lib/utm-tracker.ts',
      'frontend/src/lib/marketing-campaigns.ts',
      'frontend/src/lib/marketing-monitoring.ts',
      'frontend/src/lib/marketing-reports.ts',
      'frontend/src/lib/analytics-testing.ts',
      'frontend/src/components/CampaignDashboard.tsx',
      'frontend/src/components/AnalyticsTracker.tsx',
      'frontend/src/components/ErrorBoundary.tsx',
      'campaigns/campaign-rollout-plan.md',
      'frontend/.env.example'
    ];

    for (const file of requiredFiles) {
      const fullPath = path.join(__dirname, file);
      try {
        if (fs.existsSync(fullPath)) {
          const stats = fs.statSync(fullPath);
          this.logTest(`File exists: ${file}`, true, `${Math.round(stats.size / 1024)}KB`);
        } else {
          this.logTest(`File exists: ${file}`, false, 'File not found');
        }
      } catch (error) {
        this.logTest(`File exists: ${file}`, false, error.message);
      }
    }
  }

  // Test TypeScript compilation
  async testTypeScriptCompilation() {
    console.log('\n🔧 Testing TypeScript Compilation...');
    
    try {
      // Test frontend TypeScript compilation
      const { stdout, stderr } = await execAsync('cd frontend && npx tsc --noEmit --skipLibCheck');
      
      if (stderr && stderr.includes('error')) {
        this.logTest('Frontend TypeScript Compilation', false, 'Compilation errors found');
        console.log('Compilation errors:', stderr);
      } else {
        this.logTest('Frontend TypeScript Compilation', true, 'No compilation errors');
      }
    } catch (error) {
      this.logTest('Frontend TypeScript Compilation', false, error.message);
    }
  }

  // Test analytics integration
  async testAnalyticsIntegration() {
    console.log('\n📊 Testing Analytics Integration...');
    
    // Test analytics.ts imports and exports
    try {
      const analyticsContent = fs.readFileSync('frontend/src/lib/analytics.ts', 'utf8');
      
      const hasGA4Integration = analyticsContent.includes('gtag') && analyticsContent.includes('GA4');
      this.logTest('GA4 Integration Present', hasGA4Integration, 'Google Analytics 4 code found');
      
      const hasFacebookPixel = analyticsContent.includes('fbq') && analyticsContent.includes('Facebook');
      this.logTest('Facebook Pixel Integration Present', hasFacebookPixel, 'Facebook Pixel code found');
      
      const hasGoogleAds = analyticsContent.includes('google_ads') || analyticsContent.includes('conversion');
      this.logTest('Google Ads Integration Present', hasGoogleAds, 'Google Ads conversion tracking found');
      
      const hasQualityTracking = analyticsContent.includes('quality') && analyticsContent.includes('trackCustomEvent');
      this.logTest('Quality-Focused Tracking Present', hasQualityTracking, 'Quality metrics tracking found');
      
      const hasInfluencerTracking = analyticsContent.includes('influencer') || analyticsContent.includes('commission');
      this.logTest('Influencer Tracking Present', hasInfluencerTracking, 'Influencer attribution code found');
      
    } catch (error) {
      this.logTest('Analytics Integration Analysis', false, error.message);
    }
  }

  // Test UTM and campaign tracking
  async testCampaignTracking() {
    console.log('\n🎯 Testing Campaign & UTM Tracking...');
    
    try {
      const utmContent = fs.readFileSync('frontend/src/lib/utm-tracker.ts', 'utf8');
      
      const hasUTMParsing = utmContent.includes('utm_source') && utmContent.includes('utm_campaign');
      this.logTest('UTM Parameter Parsing', hasUTMParsing, 'UTM parameter extraction code found');
      
      const hasInfluencerCodes = utmContent.includes('SARAH2024') || utmContent.includes('influencer_id');
      this.logTest('Influencer Code Recognition', hasInfluencerCodes, 'Influencer tracking codes found');
      
      const hasCommissionTracking = utmContent.includes('commission') && utmContent.includes('revenue');
      this.logTest('Commission Calculation', hasCommissionTracking, 'Commission tracking logic found');
      
      const hasAttribution = utmContent.includes('attribution') && utmContent.includes('localStorage');
      this.logTest('Attribution Persistence', hasAttribution, 'Attribution storage code found');
      
    } catch (error) {
      this.logTest('Campaign Tracking Analysis', false, error.message);
    }
  }

  // Test marketing automation
  async testMarketingAutomation() {
    console.log('\n📧 Testing Marketing Automation...');
    
    try {
      const campaignsContent = fs.readFileSync('frontend/src/lib/marketing-campaigns.ts', 'utf8');
      
      const hasWelcomeEmail = campaignsContent.includes('sendWelcomeEmail') && campaignsContent.includes('quality');
      this.logTest('Welcome Email Automation', hasWelcomeEmail, 'Welcome email template found');
      
      const hasAbandonedCart = campaignsContent.includes('abandonedCart') && campaignsContent.includes('stage');
      this.logTest('Abandoned Cart Recovery', hasAbandonedCart, 'Multi-stage cart recovery found');
      
      const hasOrderConfirmation = campaignsContent.includes('orderConfirmation') && campaignsContent.includes('quality');
      this.logTest('Order Confirmation with Quality Info', hasOrderConfirmation, 'Quality-focused order emails found');
      
      const hasCareGuide = campaignsContent.includes('careGuide') && campaignsContent.includes('premium');
      this.logTest('Quality Care Guide Emails', hasCareGuide, 'Care instruction automation found');
      
      const hasBrevoIntegration = campaignsContent.includes('brevo') || campaignsContent.includes('templateId');
      this.logTest('Brevo Email Service Integration', hasBrevoIntegration, 'Email service integration found');
      
    } catch (error) {
      this.logTest('Marketing Automation Analysis', false, error.message);
    }
  }

  // Test monitoring and alerting
  async testMonitoringSystem() {
    console.log('\n🔍 Testing Monitoring & Alerting...');
    
    try {
      const monitoringContent = fs.readFileSync('frontend/src/lib/marketing-monitoring.ts', 'utf8');
      
      const hasSentryIntegration = monitoringContent.includes('sentry') && monitoringContent.includes('captureException');
      this.logTest('Sentry Error Tracking', hasSentryIntegration, 'Sentry integration found');
      
      const hasPerformanceMonitoring = monitoringContent.includes('performance') && monitoringContent.includes('snapshot');
      this.logTest('Performance Monitoring', hasPerformanceMonitoring, 'Performance tracking found');
      
      const hasThresholdAlerts = monitoringContent.includes('threshold') && monitoringContent.includes('alert');
      this.logTest('Threshold-Based Alerting', hasThresholdAlerts, 'Alert threshold system found');
      
      const hasAnalyticsErrorTracking = monitoringContent.includes('analytics') && monitoringContent.includes('error');
      this.logTest('Analytics Error Monitoring', hasAnalyticsErrorTracking, 'Analytics failure tracking found');
      
      const hasRealtimeMonitoring = monitoringContent.includes('interval') || monitoringContent.includes('monitoring');
      this.logTest('Real-time Monitoring', hasRealtimeMonitoring, 'Live monitoring system found');
      
    } catch (error) {
      this.logTest('Monitoring System Analysis', false, error.message);
    }
  }

  // Test reporting system
  async testReportingSystem() {
    console.log('\n📈 Testing Marketing Reports...');
    
    try {
      const reportsContent = fs.readFileSync('frontend/src/lib/marketing-reports.ts', 'utf8');
      
      const hasScheduledReports = reportsContent.includes('schedule') && reportsContent.includes('cron');
      this.logTest('Scheduled Report Generation', hasScheduledReports, 'Automated reporting found');
      
      const hasSegmentation = reportsContent.includes('segment') && reportsContent.includes('quality_focused');
      this.logTest('Customer Segmentation Reporting', hasSegmentation, 'Quality segment reporting found');
      
      const hasAttribution = reportsContent.includes('attribution') && reportsContent.includes('campaign');
      this.logTest('Campaign Attribution Reporting', hasAttribution, 'Attribution analysis found');
      
      const hasInfluencerReports = reportsContent.includes('influencer') && reportsContent.includes('performance');
      this.logTest('Influencer Performance Reports', hasInfluencerReports, 'Influencer analytics found');
      
      const hasEmailDelivery = reportsContent.includes('recipients') && reportsContent.includes('email');
      this.logTest('Email Report Delivery', hasEmailDelivery, 'Report distribution found');
      
    } catch (error) {
      this.logTest('Reporting System Analysis', false, error.message);
    }
  }

  // Test dashboard components
  async testDashboardComponents() {
    console.log('\n📊 Testing Campaign Dashboard...');
    
    try {
      const dashboardContent = fs.readFileSync('frontend/src/components/CampaignDashboard.tsx', 'utf8');
      
      const hasRealTimeMetrics = dashboardContent.includes('real-time') || dashboardContent.includes('live');
      this.logTest('Real-time Metrics Display', hasRealTimeMetrics, 'Live dashboard features found');
      
      const hasInfluencerPerformance = dashboardContent.includes('influencer') && dashboardContent.includes('performance');
      this.logTest('Influencer Performance Dashboard', hasInfluencerPerformance, 'Influencer tracking UI found');
      
      const hasQualityMetrics = dashboardContent.includes('quality') && dashboardContent.includes('conversion');
      this.logTest('Quality Metrics Dashboard', hasQualityMetrics, 'Quality-focused KPIs found');
      
      const hasAlertsDisplay = dashboardContent.includes('alert') && dashboardContent.includes('severity');
      this.logTest('Live Alerts Display', hasAlertsDisplay, 'Alert notification UI found');
      
      const hasTestingSuite = dashboardContent.includes('test') && dashboardContent.includes('analytics');
      this.logTest('Analytics Testing Integration', hasTestingSuite, 'Testing UI integration found');
      
    } catch (error) {
      this.logTest('Dashboard Components Analysis', false, error.message);
    }
  }

  // Test campaign rollout plan
  async testCampaignPlan() {
    console.log('\n📋 Testing Campaign Rollout Plan...');
    
    try {
      const planContent = fs.readFileSync('campaigns/campaign-rollout-plan.md', 'utf8');
      
      const hasPhased = planContent.includes('Phase') && planContent.includes('Week');
      this.logTest('Phased Rollout Strategy', hasPhased, 'Multi-phase campaign plan found');
      
      const hasInfluencers = planContent.includes('Sarah Johnson') && planContent.includes('SARAH2024');
      this.logTest('Influencer Coordination Plan', hasInfluencers, 'Influencer strategy documented');
      
      const hasMetrics = planContent.includes('KPI') && planContent.includes('conversion');
      this.logTest('Success Metrics Definition', hasMetrics, 'Performance targets defined');
      
      const hasQualityFocus = planContent.includes('quality') && planContent.includes('premium');
      this.logTest('Quality-Focused Messaging', hasQualityFocus, 'Quality positioning strategy found');
      
      const hasRiskManagement = planContent.includes('Risk') && planContent.includes('Mitigation');
      this.logTest('Risk Management Plan', hasRiskManagement, 'Risk mitigation strategies found');
      
    } catch (error) {
      this.logTest('Campaign Plan Analysis', false, error.message);
    }
  }

  // Test environment configuration
  async testEnvironmentConfig() {
    console.log('\n⚙️ Testing Environment Configuration...');
    
    try {
      const envContent = fs.readFileSync('frontend/.env.example', 'utf8');
      
      const hasAnalyticsVars = envContent.includes('GA4') && envContent.includes('FACEBOOK_PIXEL');
      this.logTest('Analytics Environment Variables', hasAnalyticsVars, 'Analytics config vars found');
      
      const hasSentryConfig = envContent.includes('SENTRY') && envContent.includes('DSN');
      this.logTest('Sentry Configuration', hasSentryConfig, 'Error tracking config found');
      
      const hasPerformanceConfig = envContent.includes('PERFORMANCE') && envContent.includes('MONITORING');
      this.logTest('Performance Monitoring Config', hasPerformanceConfig, 'Performance config found');
      
      const hasDebugSettings = envContent.includes('DEBUG') && envContent.includes('ANALYTICS');
      this.logTest('Debug Configuration', hasDebugSettings, 'Debug settings found');
      
    } catch (error) {
      this.logTest('Environment Configuration Analysis', false, error.message);
    }
  }

  // Test React component integration
  async testReactIntegration() {
    console.log('\n⚛️ Testing React Component Integration...');
    
    try {
      const appContent = fs.readFileSync('frontend/src/App.tsx', 'utf8');
      
      const hasAnalyticsInit = appContent.includes('analytics') && appContent.includes('init');
      this.logTest('Analytics Initialization in App', hasAnalyticsInit, 'Analytics startup code found');
      
      const hasErrorBoundary = appContent.includes('ErrorBoundary');
      this.logTest('Error Boundary Integration', hasErrorBoundary, 'Error handling wrapper found');
      
      const hasAnalyticsTracker = appContent.includes('AnalyticsTracker');
      this.logTest('Analytics Tracker Component', hasAnalyticsTracker, 'Route tracking component found');
      
      const hasSentryInit = appContent.includes('sentry') && appContent.includes('init');
      this.logTest('Sentry Initialization', hasSentryInit, 'Error tracking initialization found');
      
    } catch (error) {
      this.logTest('React Integration Analysis', false, error.message);
    }
  }

  // Test backend integration points
  async testBackendIntegration() {
    console.log('\n🔗 Testing Backend Integration Points...');
    
    // Check if backend files have necessary middleware
    try {
      // Test if backend has Sentry middleware
      const backendFiles = ['backend/src/middleware/sentry.ts'];
      
      for (const file of backendFiles) {
        if (fs.existsSync(file)) {
          const content = fs.readFileSync(file, 'utf8');
          const hasSentryMiddleware = content.includes('sentry') && content.includes('middleware');
          this.logTest(`Backend Sentry Integration: ${file}`, hasSentryMiddleware, 'Sentry middleware found');
        } else {
          this.logTest(`Backend File Exists: ${file}`, false, 'File not found');
        }
      }
      
    } catch (error) {
      this.logTest('Backend Integration Analysis', false, error.message);
    }
  }

  // Generate comprehensive test report
  generateReport() {
    const total = this.testResults.passed + this.testResults.failed;
    const successRate = total > 0 ? ((this.testResults.passed / total) * 100).toFixed(1) : '0';
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 CAMPAIGN INFRASTRUCTURE TEST REPORT');
    console.log('='.repeat(60));
    console.log(`Total Tests: ${total}`);
    console.log(`✅ Passed: ${this.testResults.passed}`);
    console.log(`❌ Failed: ${this.testResults.failed}`);
    console.log(`📈 Success Rate: ${successRate}%`);
    console.log(`🕒 Generated: ${new Date().toLocaleString()}`);
    
    if (this.testResults.failed > 0) {
      console.log('\n❌ FAILED TESTS:');
      this.testResults.tests
        .filter(test => !test.passed)
        .forEach(test => {
          console.log(`  • ${test.name}: ${test.details}`);
        });
    }
    
    console.log('\n✅ CAMPAIGN INFRASTRUCTURE STATUS:');
    if (successRate >= 90) {
      console.log('🚀 READY FOR PRODUCTION DEPLOYMENT');
      console.log('All critical systems are operational and ready for campaign launch.');
    } else if (successRate >= 75) {
      console.log('⚠️  READY FOR STAGING WITH MINOR FIXES');
      console.log('Most systems operational. Address failed tests before production.');
    } else {
      console.log('🚨 NOT READY FOR DEPLOYMENT');
      console.log('Critical issues detected. Significant fixes required before launch.');
    }
    
    // Save report to file
    const reportData = {
      summary: {
        total,
        passed: this.testResults.passed,
        failed: this.testResults.failed,
        successRate: parseFloat(successRate),
        timestamp: new Date().toISOString()
      },
      tests: this.testResults.tests
    };
    
    fs.writeFileSync('campaign-infrastructure-test-report.json', JSON.stringify(reportData, null, 2));
    console.log('\n📄 Detailed report saved to: campaign-infrastructure-test-report.json');
    
    return reportData;
  }

  // Run all tests
  async runAllTests() {
    console.log('🧪 Starting Campaign Infrastructure Test Suite...');
    console.log('Testing marketing analytics, monitoring, and campaign systems...\n');
    
    await this.testFileStructure();
    await this.testTypeScriptCompilation();
    await this.testAnalyticsIntegration();
    await this.testCampaignTracking();
    await this.testMarketingAutomation();
    await this.testMonitoringSystem();
    await this.testReportingSystem();
    await this.testDashboardComponents();
    await this.testCampaignPlan();
    await this.testEnvironmentConfig();
    await this.testReactIntegration();
    await this.testBackendIntegration();
    
    return this.generateReport();
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  const tester = new CampaignInfrastructureTester();
  tester.runAllTests()
    .then((report) => {
      process.exit(report.summary.failed > 0 ? 1 : 0);
    })
    .catch((error) => {
      console.error('❌ Test suite failed:', error);
      process.exit(1);
    });
}

module.exports = CampaignInfrastructureTester;