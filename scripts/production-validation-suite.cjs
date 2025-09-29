// CalistaLife Production Validation Suite
// Comprehensive testing framework for analytics, email, database, and monitoring

const axios = require('axios');
const fs = require('fs');
const path = require('path');

class ProductionValidationSuite {
  constructor() {
    this.testResults = [];
    this.config = {
      baseUrl: process.env.BASE_URL || 'http://localhost:5174',
      apiUrl: process.env.API_URL || 'http://localhost:3001',
      ga4MeasurementId: process.env.VITE_GA4_MEASUREMENT_ID || 'G-FL9QNKMXPX',
      sentryDsn: process.env.VITE_SENTRY_DSN || process.env.SENTRY_DSN,
      brevoApiKey: process.env.BREVO_API_KEY,
      supabaseUrl: process.env.SUPABASE_URL || 'https://mrshlwfzkikpdycybqzi.supabase.co'
    };
    this.startTime = Date.now();
  }

  log(test, status, message, details = null) {
    const result = {
      timestamp: new Date().toISOString(),
      test,
      status, // 'pass', 'fail', 'warn', 'info'
      message,
      details,
      duration: Date.now() - this.startTime
    };
    
    this.testResults.push(result);
    
    const statusIcon = {
      pass: '✅',
      fail: '❌', 
      warn: '⚠️',
      info: 'ℹ️'
    }[status] || '📋';
    
    console.log(`${statusIcon} [${test}] ${message}`);
    if (details) console.log(`   Details: ${JSON.stringify(details, null, 2)}`);
  }

  async delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Test 1: Google Analytics 4 Integration
  async testGA4Integration() {
    this.log('GA4', 'info', 'Testing Google Analytics 4 integration...');
    
    try {
      // Test 1.1: Verify GA4 Measurement ID is configured
      if (!this.config.ga4MeasurementId || this.config.ga4MeasurementId === 'G-XXXXXXX') {
        this.log('GA4', 'fail', 'GA4 Measurement ID not configured properly');
        return;
      }
      
      this.log('GA4', 'pass', `GA4 Measurement ID configured: ${this.config.ga4MeasurementId}`);
      
      // Test 1.2: Send test event to GA4 Measurement Protocol
      const testEventData = {
        client_id: 'test-client-' + Date.now(),
        events: [{
          name: 'production_validation_test',
          params: {
            event_category: 'testing',
            event_label: 'production_launch',
            value: 1,
            custom_parameter: 'calista_validation'
          }
        }]
      };
      
      try {
        const response = await axios.post(
          `https://www.google-analytics.com/mp/collect?measurement_id=${this.config.ga4MeasurementId}&api_secret=${process.env.GA4_API_SECRET || 'test'}`,
          testEventData,
          { 
            headers: { 'Content-Type': 'application/json' },
            timeout: 5000 
          }
        );
        
        if (response.status === 204) {
          this.log('GA4', 'pass', 'Test event sent to GA4 successfully');
        } else {
          this.log('GA4', 'warn', 'GA4 event sent but received unexpected response', { status: response.status });
        }
      } catch (error) {
        this.log('GA4', 'warn', 'GA4 Measurement Protocol test failed (API secret may be missing)', { error: error.message });
      }
      
      // Test 1.3: Instructions for manual DebugView validation
      this.log('GA4', 'info', 'Manual validation required: Visit your site with ?debug_mode=true and check GA4 DebugView');
      
    } catch (error) {
      this.log('GA4', 'fail', 'GA4 integration test failed', { error: error.message });
    }
  }

  // Test 2: Sentry Error Monitoring
  async testSentryIntegration() {
    this.log('Sentry', 'info', 'Testing Sentry error monitoring integration...');
    
    try {
      // Test 2.1: Verify Sentry DSN is configured
      if (!this.config.sentryDsn) {
        this.log('Sentry', 'fail', 'Sentry DSN not configured');
        return;
      }
      
      // Parse Sentry DSN to extract project info
      const dsnMatch = this.config.sentryDsn.match(/https:\/\/([^@]+)@([^\/]+)\/([^$]+)/);
      if (!dsnMatch) {
        this.log('Sentry', 'fail', 'Invalid Sentry DSN format');
        return;
      }
      
      const [, publicKey, host, projectId] = dsnMatch;
      this.log('Sentry', 'pass', `Sentry DSN configured for project: ${projectId}`);
      
      // Test 2.2: Send test error to Sentry
      try {
        const testError = {
          message: 'CalistaLife Production Validation Test Error',
          level: 'info',
          tags: {
            environment: 'production_test',
            component: 'validation_suite'
          },
          extra: {
            test_timestamp: new Date().toISOString(),
            validation_suite: 'calista_production_launch'
          }
        };
        
        const sentryUrl = `https://${host}/api/${projectId}/store/`;
        const authHeader = `Sentry sentry_version=7,sentry_key=${publicKey},sentry_timestamp=${Math.floor(Date.now() / 1000)}`;
        
        const response = await axios.post(sentryUrl, testError, {
          headers: {
            'X-Sentry-Auth': authHeader,
            'Content-Type': 'application/json'
          },
          timeout: 5000
        });
        
        this.log('Sentry', 'pass', 'Test error sent to Sentry successfully');
        this.log('Sentry', 'info', 'Check Sentry dashboard for the test error: https://sentry.io/organizations/calista-44/projects/javascript-nextjs/');
        
      } catch (error) {
        this.log('Sentry', 'warn', 'Direct Sentry API test failed (expected in client-side setup)', { error: error.message });
      }
      
    } catch (error) {
      this.log('Sentry', 'fail', 'Sentry integration test failed', { error: error.message });
    }
  }

  // Test 3: Supabase Database Connection
  async testSupabaseConnection() {
    this.log('Supabase', 'info', 'Testing Supabase database connection...');
    
    try {
      // Test 3.1: Verify Supabase URL is configured
      if (!this.config.supabaseUrl) {
        this.log('Supabase', 'fail', 'Supabase URL not configured');
        return;
      }
      
      this.log('Supabase', 'pass', `Supabase URL configured: ${this.config.supabaseUrl}`);
      
      // Test 3.2: Test database connectivity via REST API
      try {
        const anonKey = process.env.SUPABASE_ANON_KEY;
        if (!anonKey) {
          this.log('Supabase', 'warn', 'Supabase anon key not available for connection test');
          return;
        }
        
        const response = await axios.get(`${this.config.supabaseUrl}/rest/v1/`, {
          headers: {
            'apikey': anonKey,
            'Authorization': `Bearer ${anonKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 10000
        });
        
        if (response.status === 200) {
          this.log('Supabase', 'pass', 'Supabase REST API connection successful');
        } else {
          this.log('Supabase', 'warn', 'Supabase connection returned unexpected status', { status: response.status });
        }
        
      } catch (error) {
        this.log('Supabase', 'fail', 'Supabase connection test failed', { 
          error: error.message,
          suggestion: 'Check Supabase anon key and network connectivity'
        });
      }
      
    } catch (error) {
      this.log('Supabase', 'fail', 'Supabase test failed', { error: error.message });
    }
  }

  // Test 4: Brevo Email Service
  async testBrevoEmailService() {
    this.log('Brevo', 'info', 'Testing Brevo email service integration...');
    
    try {
      // Test 4.1: Verify Brevo API key is configured
      if (!this.config.brevoApiKey) {
        this.log('Brevo', 'fail', 'Brevo API key not configured');
        return;
      }
      
      // Test 4.2: Test Brevo API connection
      try {
        const response = await axios.get('https://api.brevo.com/v3/account', {
          headers: {
            'api-key': this.config.brevoApiKey,
            'Content-Type': 'application/json'
          },
          timeout: 10000
        });
        
        if (response.status === 200) {
          this.log('Brevo', 'pass', 'Brevo API connection successful', {
            account: response.data.companyName,
            plan: response.data.plan?.type,
            credits: response.data.plan?.creditsLeft
          });
        }
        
      } catch (error) {
        this.log('Brevo', 'fail', 'Brevo API connection failed', { 
          error: error.message,
          suggestion: 'Check Brevo API key validity'
        });
        return;
      }
      
      // Test 4.3: Test email template retrieval
      try {
        const templatesResponse = await axios.get('https://api.brevo.com/v3/emailTemplates', {
          headers: {
            'api-key': this.config.brevoApiKey,
            'Content-Type': 'application/json'
          },
          timeout: 10000
        });
        
        this.log('Brevo', 'pass', `Found ${templatesResponse.data.templates.length} email templates`, {
          templates: templatesResponse.data.templates.map(t => ({ id: t.id, name: t.name }))
        });
        
      } catch (error) {
        this.log('Brevo', 'warn', 'Could not retrieve Brevo templates', { error: error.message });
      }
      
      // Test 4.4: Instructions for manual email test
      this.log('Brevo', 'info', 'Manual validation: Send test email via backend API to verify end-to-end functionality');
      
    } catch (error) {
      this.log('Brevo', 'fail', 'Brevo email service test failed', { error: error.message });
    }
  }

  // Test 5: Application Health Checks
  async testApplicationHealth() {
    this.log('Health', 'info', 'Testing application health endpoints...');
    
    try {
      // Test 5.1: Frontend health
      try {
        const frontendResponse = await axios.get(this.config.baseUrl, { 
          timeout: 10000,
          validateStatus: status => status < 500 
        });
        
        if (frontendResponse.status === 200) {
          this.log('Health', 'pass', 'Frontend application is accessible');
        } else {
          this.log('Health', 'warn', `Frontend returned status ${frontendResponse.status}`);
        }
        
      } catch (error) {
        this.log('Health', 'fail', 'Frontend application is not accessible', { 
          error: error.message,
          baseUrl: this.config.baseUrl
        });
      }
      
      // Test 5.2: Backend API health
      try {
        const backendResponse = await axios.get(`${this.config.apiUrl}/health`, { 
          timeout: 10000,
          validateStatus: status => status < 500 
        });
        
        if (backendResponse.status === 200) {
          this.log('Health', 'pass', 'Backend API is healthy', backendResponse.data);
        } else {
          this.log('Health', 'warn', `Backend API returned status ${backendResponse.status}`);
        }
        
      } catch (error) {
        this.log('Health', 'warn', 'Backend API health check failed', { 
          error: error.message,
          apiUrl: this.config.apiUrl,
          suggestion: 'Backend may not be deployed yet'
        });
      }
      
    } catch (error) {
      this.log('Health', 'fail', 'Application health test failed', { error: error.message });
    }
  }

  // Test 6: Security Configuration
  async testSecurityConfiguration() {
    this.log('Security', 'info', 'Testing security configuration...');
    
    try {
      // Test 6.1: Environment variables security
      const sensitivePatterns = [
        'password', 'secret', 'key', 'token', 'api_key'
      ];
      
      const envVars = Object.keys(process.env);
      const exposedSecrets = envVars.filter(key => 
        key.startsWith('VITE_') && 
        sensitivePatterns.some(pattern => key.toLowerCase().includes(pattern))
      );
      
      if (exposedSecrets.length > 0) {
        this.log('Security', 'fail', 'Potential secrets exposed in VITE_ environment variables', { 
          exposedVars: exposedSecrets,
          suggestion: 'Move sensitive keys to backend-only environment variables'
        });
      } else {
        this.log('Security', 'pass', 'No sensitive data exposed in frontend environment variables');
      }
      
      // Test 6.2: HTTPS configuration (in production)
      if (this.config.baseUrl.startsWith('https://')) {
        this.log('Security', 'pass', 'Application is configured for HTTPS');
      } else if (this.config.baseUrl.includes('localhost')) {
        this.log('Security', 'info', 'Using HTTP for localhost (acceptable for development)');
      } else {
        this.log('Security', 'warn', 'Application should use HTTPS in production');
      }
      
      // Test 6.3: API key configuration
      const requiredSecrets = ['BREVO_API_KEY', 'SUPABASE_SERVICE_ROLE_KEY', 'SENTRY_DSN'];
      const missingSecrets = requiredSecrets.filter(key => !process.env[key]);
      
      if (missingSecrets.length > 0) {
        this.log('Security', 'warn', 'Some required secrets are not configured', { 
          missing: missingSecrets,
          suggestion: 'Configure these via CI/CD environment variables'
        });
      } else {
        this.log('Security', 'pass', 'All required secrets are configured');
      }
      
    } catch (error) {
      this.log('Security', 'fail', 'Security configuration test failed', { error: error.message });
    }
  }

  // Generate comprehensive report
  generateReport() {
    const totalTests = this.testResults.length;
    const passed = this.testResults.filter(r => r.status === 'pass').length;
    const failed = this.testResults.filter(r => r.status === 'fail').length;
    const warnings = this.testResults.filter(r => r.status === 'warn').length;
    
    const overallStatus = failed > 0 ? 'FAILED' : warnings > 0 ? 'PASSED_WITH_WARNINGS' : 'PASSED';
    
    const report = {
      timestamp: new Date().toISOString(),
      duration: Date.now() - this.startTime,
      overallStatus,
      summary: {
        total: totalTests,
        passed,
        failed,
        warnings,
        successRate: Math.round((passed / totalTests) * 100)
      },
      configuration: this.config,
      results: this.testResults,
      recommendations: this.generateRecommendations()
    };
    
    return report;
  }

  generateRecommendations() {
    const recommendations = [];
    const failedTests = this.testResults.filter(r => r.status === 'fail');
    const warningTests = this.testResults.filter(r => r.status === 'warn');
    
    if (failedTests.length > 0) {
      recommendations.push({
        priority: 'HIGH',
        category: 'Failed Tests',
        message: 'Resolve all failed tests before production deployment',
        actions: failedTests.map(t => `Fix ${t.test}: ${t.message}`)
      });
    }
    
    if (warningTests.length > 0) {
      recommendations.push({
        priority: 'MEDIUM',
        category: 'Warnings',
        message: 'Address warnings to ensure optimal production performance',
        actions: warningTests.map(t => `Review ${t.test}: ${t.message}`)
      });
    }
    
    recommendations.push({
      priority: 'LOW',
      category: 'Manual Validation',
      message: 'Complete manual validation steps',
      actions: [
        'Visit your site with ?debug_mode=true and check GA4 DebugView',
        'Send test email via backend API',
        'Check Sentry dashboard for test error',
        'Verify all automation workflows in Brevo dashboard'
      ]
    });
    
    return recommendations;
  }

  // Main validation function
  async runValidation() {
    console.log('🚀 Starting CalistaLife Production Validation Suite...\n');
    
    const tests = [
      () => this.testGA4Integration(),
      () => this.testSentryIntegration(),
      () => this.testSupabaseConnection(),
      () => this.testBrevoEmailService(),
      () => this.testApplicationHealth(),
      () => this.testSecurityConfiguration()
    ];
    
    for (const test of tests) {
      try {
        await test();
        await this.delay(1000); // Brief delay between tests
      } catch (error) {
        this.log('System', 'fail', `Test execution failed: ${error.message}`, { error: error.stack });
      }
    }
    
    // Generate and save report
    const report = this.generateReport();
    const reportPath = path.join(__dirname, '../logs', `production-validation-${new Date().toISOString().split('T')[0]}.json`);
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    // Display results
    console.log('\n' + '='.repeat(80));
    console.log('🎯 CALISTA LIFE PRODUCTION VALIDATION RESULTS');
    console.log('='.repeat(80));
    
    const statusIcon = {
      'PASSED': '✅',
      'PASSED_WITH_WARNINGS': '⚠️', 
      'FAILED': '❌'
    }[report.overallStatus];
    
    console.log(`\n${statusIcon} Overall Status: ${report.overallStatus}`);
    console.log(`📊 Tests: ${report.summary.passed}/${report.summary.total} passed (${report.summary.successRate}% success rate)`);
    console.log(`⏱️ Duration: ${Math.round(report.duration / 1000)}s`);
    console.log(`📝 Report saved: ${reportPath}`);
    
    if (report.recommendations.length > 0) {
      console.log('\n📋 RECOMMENDATIONS:');
      report.recommendations.forEach(rec => {
        console.log(`\n${rec.priority === 'HIGH' ? '🔴' : rec.priority === 'MEDIUM' ? '🟡' : '🟢'} ${rec.category}: ${rec.message}`);
        rec.actions.forEach(action => console.log(`   • ${action}`));
      });
    }
    
    console.log('\n' + '='.repeat(80));
    
    return report;
  }
}

// Export for use in other scripts
module.exports = ProductionValidationSuite;

// Run validation if called directly
if (require.main === module) {
  const validation = new ProductionValidationSuite();
  validation.runValidation().catch(console.error);
}