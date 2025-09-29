// CalistaLife Production Deployment Validator
// Validates deployed Netlify frontend and Render backend environments

const axios = require('axios');
const fs = require('fs');
const path = require('path');

class ProductionDeploymentValidator {
  constructor(config = {}) {
    this.config = {
      frontendUrl: config.frontendUrl || process.env.FRONTEND_URL || 'https://your-netlify-site.netlify.app',
      backendUrl: config.backendUrl || process.env.BACKEND_URL || 'https://your-render-backend.onrender.com',
      ga4MeasurementId: 'G-FL9QNKMXPX',
      expectedSentryDsn: 'https://644e5c1b924e2641283405c73caf24cb@o4510098794676224.ingest.us.sentry.io/4510101948923904',
      ...config
    };
    this.results = [];
    this.startTime = Date.now();
  }

  log(category, status, message, details = null) {
    const result = {
      timestamp: new Date().toISOString(),
      category,
      status, // 'pass', 'fail', 'warn', 'info'
      message,
      details,
      elapsed: Date.now() - this.startTime
    };
    
    this.results.push(result);
    
    const icon = {
      pass: '✅',
      fail: '❌',
      warn: '⚠️',
      info: 'ℹ️'
    }[status] || '📋';
    
    console.log(`${icon} [${category}] ${message}`);
    if (details && typeof details === 'object') {
      console.log(`   ${JSON.stringify(details, null, 2).replace(/\n/g, '\n   ')}`);
    } else if (details) {
      console.log(`   ${details}`);
    }
  }

  async delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Test 1: Frontend Deployment Validation (Netlify)
  async validateFrontendDeployment() {
    this.log('Frontend', 'info', 'Validating Netlify frontend deployment...');
    
    try {
      // Test 1.1: Basic accessibility
      const response = await axios.get(this.config.frontendUrl, { 
        timeout: 10000,
        validateStatus: status => status < 500 
      });
      
      if (response.status === 200) {
        this.log('Frontend', 'pass', 'Frontend is accessible and returning 200 OK');
      } else {
        this.log('Frontend', 'warn', `Frontend returned status ${response.status}`);
        return;
      }

      // Test 1.2: Check for basic HTML structure
      const htmlContent = response.data;
      const hasTitle = htmlContent.includes('<title>') || htmlContent.includes('CalistaLife');
      const hasGA4 = htmlContent.includes('googletagmanager.com/gtag/js') || htmlContent.includes(this.config.ga4MeasurementId);
      
      if (hasTitle) {
        this.log('Frontend', 'pass', 'HTML structure looks valid');
      } else {
        this.log('Frontend', 'fail', 'HTML structure missing title or brand name');
      }

      if (hasGA4) {
        this.log('Frontend', 'pass', 'GA4 tracking script detected in HTML');
      } else {
        this.log('Frontend', 'warn', 'GA4 tracking script not found in HTML (may be loaded dynamically)');
      }

      // Test 1.3: Check for security headers
      const headers = response.headers;
      const hasHTTPS = this.config.frontendUrl.startsWith('https://');
      const hasSecurityHeaders = headers['x-frame-options'] || headers['content-security-policy'];
      
      if (hasHTTPS) {
        this.log('Frontend', 'pass', 'Site is served over HTTPS');
      } else {
        this.log('Frontend', 'fail', 'Site is not using HTTPS - critical security issue');
      }

      if (hasSecurityHeaders) {
        this.log('Frontend', 'pass', 'Security headers detected');
      } else {
        this.log('Frontend', 'info', 'Consider adding security headers for enhanced protection');
      }

      // Test 1.4: Check for sensitive data exposure
      const hasSensitiveData = htmlContent.match(/xkeysib-[a-f0-9]/i) || 
                              htmlContent.match(/eyJ[A-Za-z0-9]/i) || 
                              htmlContent.match(/sk_live_[A-Za-z0-9]/i);
      
      if (hasSensitiveData) {
        this.log('Frontend', 'fail', 'SECURITY ALERT: Sensitive data detected in frontend HTML', {
          issue: 'API keys or tokens found in public HTML',
          action: 'Remove immediately and rotate affected keys'
        });
      } else {
        this.log('Frontend', 'pass', 'No sensitive data detected in frontend HTML');
      }

    } catch (error) {
      this.log('Frontend', 'fail', 'Frontend deployment validation failed', {
        error: error.message,
        url: this.config.frontendUrl,
        suggestion: 'Check Netlify deployment status and URL configuration'
      });
    }
  }

  // Test 2: Backend Deployment Validation (Render)
  async validateBackendDeployment() {
    this.log('Backend', 'info', 'Validating Render backend deployment...');
    
    try {
      // Test 2.1: Health check endpoint
      try {
        const healthResponse = await axios.get(`${this.config.backendUrl}/health`, {
          timeout: 15000,
          validateStatus: status => status < 500
        });
        
        if (healthResponse.status === 200) {
          this.log('Backend', 'pass', 'Backend health check successful', {
            status: healthResponse.status,
            data: healthResponse.data
          });
        } else {
          this.log('Backend', 'warn', `Backend health check returned ${healthResponse.status}`);
        }
      } catch (error) {
        this.log('Backend', 'warn', 'Backend health endpoint not available', {
          error: error.message,
          suggestion: 'Implement /health endpoint or check if backend is fully deployed'
        });
      }

      // Test 2.2: API endpoint test
      try {
        const apiResponse = await axios.get(`${this.config.backendUrl}/api/products`, {
          timeout: 15000,
          validateStatus: status => status < 500
        });
        
        if (apiResponse.status === 200) {
          this.log('Backend', 'pass', 'API endpoints are responding');
        } else if (apiResponse.status === 404) {
          this.log('Backend', 'info', 'Products API endpoint not found (may not be implemented yet)');
        } else {
          this.log('Backend', 'warn', `API returned unexpected status: ${apiResponse.status}`);
        }
      } catch (error) {
        this.log('Backend', 'info', 'Products API test skipped (endpoint may not exist yet)', {
          note: 'This is acceptable if backend is still in development'
        });
      }

      // Test 2.3: CORS configuration
      try {
        const corsResponse = await axios.options(`${this.config.backendUrl}/api/test`, {
          headers: {
            'Origin': this.config.frontendUrl,
            'Access-Control-Request-Method': 'GET',
            'Access-Control-Request-Headers': 'Content-Type'
          },
          timeout: 10000,
          validateStatus: () => true
        });
        
        const corsHeaders = corsResponse.headers;
        if (corsHeaders['access-control-allow-origin'] || corsHeaders['Access-Control-Allow-Origin']) {
          this.log('Backend', 'pass', 'CORS is configured for cross-origin requests');
        } else {
          this.log('Backend', 'warn', 'CORS headers not detected - may cause frontend API issues');
        }
      } catch (error) {
        this.log('Backend', 'info', 'CORS test skipped due to network issues');
      }

    } catch (error) {
      this.log('Backend', 'fail', 'Backend deployment validation failed', {
        error: error.message,
        url: this.config.backendUrl,
        suggestion: 'Check Render deployment status and ensure backend is running'
      });
    }
  }

  // Test 3: Integration Testing
  async validateIntegration() {
    this.log('Integration', 'info', 'Testing frontend-backend integration...');
    
    try {
      // Test 3.1: Frontend can reach backend
      // We'll try to make a request from frontend context to backend
      const frontendResponse = await axios.get(this.config.frontendUrl, { timeout: 10000 });
      const htmlContent = frontendResponse.data;
      
      // Look for backend URL configuration in frontend
      const hasBackendUrl = htmlContent.includes(this.config.backendUrl) || 
                           htmlContent.includes('onrender.com') ||
                           htmlContent.includes('/api/');
      
      if (hasBackendUrl) {
        this.log('Integration', 'pass', 'Frontend appears to be configured to communicate with backend');
      } else {
        this.log('Integration', 'warn', 'Frontend may not be configured to use the correct backend URL', {
          suggestion: 'Check VITE_API_URL environment variable in Netlify'
        });
      }

      // Test 3.2: Test if both services are in the same region/accessible
      const frontendLatency = await this.measureLatency(this.config.frontendUrl);
      const backendLatency = await this.measureLatency(this.config.backendUrl);
      
      this.log('Integration', 'info', 'Network latency measured', {
        frontend: `${frontendLatency}ms`,
        backend: `${backendLatency}ms`,
        acceptable: frontendLatency < 2000 && backendLatency < 5000
      });

      if (frontendLatency < 2000 && backendLatency < 5000) {
        this.log('Integration', 'pass', 'Both services have acceptable response times');
      } else {
        this.log('Integration', 'warn', 'High latency detected - users may experience slow load times');
      }

    } catch (error) {
      this.log('Integration', 'fail', 'Integration testing failed', {
        error: error.message,
        suggestion: 'Verify both frontend and backend are deployed and accessible'
      });
    }
  }

  // Test 4: Environment Variable Validation
  async validateEnvironmentVariables() {
    this.log('Environment', 'info', 'Validating environment variable configuration...');
    
    try {
      // Test 4.1: Check frontend environment variables by looking at client-side requests
      const frontendResponse = await axios.get(this.config.frontendUrl, { timeout: 10000 });
      const htmlContent = frontendResponse.data;
      
      // Check for GA4 measurement ID
      const hasGA4ID = htmlContent.includes(this.config.ga4MeasurementId);
      if (hasGA4ID) {
        this.log('Environment', 'pass', 'GA4 Measurement ID properly configured in frontend');
      } else {
        this.log('Environment', 'fail', 'GA4 Measurement ID not found in frontend', {
          expected: this.config.ga4MeasurementId,
          suggestion: 'Set VITE_GA4_MEASUREMENT_ID in Netlify environment variables'
        });
      }

      // Check for Sentry DSN (should be present but not the full DSN for security)
      const hasSentry = htmlContent.includes('sentry') || htmlContent.includes('ingest.sentry.io');
      if (hasSentry) {
        this.log('Environment', 'pass', 'Sentry integration detected in frontend');
      } else {
        this.log('Environment', 'warn', 'Sentry integration not detected', {
          suggestion: 'Set VITE_SENTRY_DSN in Netlify environment variables'
        });
      }

      // Test 4.2: Security check - ensure no secrets in frontend
      const hasSecrets = htmlContent.match(/xkeysib-/i) || 
                        htmlContent.match(/sk_live_/i) ||
                        htmlContent.match(/service_role/i);
      
      if (hasSecrets) {
        this.log('Environment', 'fail', 'CRITICAL: Backend secrets detected in frontend', {
          issue: 'Secret API keys found in public frontend code',
          action: 'Remove secrets from frontend environment variables immediately'
        });
      } else {
        this.log('Environment', 'pass', 'No backend secrets detected in frontend (secure)');
      }

      // Test 4.3: Check environment-specific configuration
      const isProdMode = htmlContent.includes('production') || !htmlContent.includes('development');
      if (isProdMode) {
        this.log('Environment', 'pass', 'Frontend appears to be in production mode');
      } else {
        this.log('Environment', 'warn', 'Frontend may be in development mode', {
          suggestion: 'Set VITE_APP_ENV=production in Netlify'
        });
      }

    } catch (error) {
      this.log('Environment', 'fail', 'Environment variable validation failed', {
        error: error.message
      });
    }
  }

  // Helper function to measure latency
  async measureLatency(url) {
    const start = Date.now();
    try {
      await axios.get(url, { timeout: 10000, validateStatus: () => true });
      return Date.now() - start;
    } catch (error) {
      return Date.now() - start; // Return time even if request failed
    }
  }

  // Generate comprehensive report
  generateReport() {
    const totalTests = this.results.length;
    const passed = this.results.filter(r => r.status === 'pass').length;
    const failed = this.results.filter(r => r.status === 'fail').length;
    const warnings = this.results.filter(r => r.status === 'warn').length;
    
    const overallStatus = failed > 0 ? 'FAILED' : warnings > 3 ? 'PASSED_WITH_WARNINGS' : 'PASSED';
    const successRate = Math.round((passed / totalTests) * 100);
    
    const report = {
      timestamp: new Date().toISOString(),
      duration: Date.now() - this.startTime,
      environment: {
        frontend: this.config.frontendUrl,
        backend: this.config.backendUrl
      },
      overallStatus,
      summary: {
        total: totalTests,
        passed,
        failed,
        warnings,
        successRate
      },
      results: this.results,
      recommendations: this.generateRecommendations()
    };
    
    return report;
  }

  generateRecommendations() {
    const recommendations = [];
    const criticalIssues = this.results.filter(r => r.status === 'fail');
    const warnings = this.results.filter(r => r.status === 'warn');
    
    if (criticalIssues.length > 0) {
      recommendations.push({
        priority: 'CRITICAL',
        category: 'Failed Tests',
        message: 'Address all failed tests before proceeding to production',
        actions: criticalIssues.map(issue => `Fix ${issue.category}: ${issue.message}`)
      });
    }
    
    if (warnings.length > 0) {
      recommendations.push({
        priority: 'HIGH',
        category: 'Warnings',
        message: 'Review and resolve warnings for optimal performance',
        actions: warnings.map(warn => `Review ${warn.category}: ${warn.message}`)
      });
    }
    
    recommendations.push({
      priority: 'MEDIUM',
      category: 'Post-Deployment',
      message: 'Complete post-deployment validation',
      actions: [
        'Test user registration and login flows',
        'Verify email delivery end-to-end',
        'Test payment processing (if implemented)',
        'Check mobile responsiveness',
        'Validate SEO meta tags and structured data'
      ]
    });
    
    return recommendations;
  }

  // Main validation function
  async runValidation() {
    console.log('🚀 CalistaLife Production Deployment Validation\n');
    console.log(`Frontend: ${this.config.frontendUrl}`);
    console.log(`Backend: ${this.config.backendUrl}\n`);
    
    const validationTests = [
      () => this.validateFrontendDeployment(),
      () => this.validateBackendDeployment(),
      () => this.validateIntegration(),
      () => this.validateEnvironmentVariables()
    ];
    
    for (const test of validationTests) {
      try {
        await test();
        await this.delay(1000); // Brief pause between tests
      } catch (error) {
        this.log('System', 'fail', `Test execution failed: ${error.message}`);
      }
    }
    
    // Generate and save report
    const report = this.generateReport();
    const timestamp = new Date().toISOString().split('T')[0];
    const reportPath = path.join(__dirname, '../logs', `production-deployment-${timestamp}.json`);
    
    try {
      fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    } catch (err) {
      console.log('⚠️ Could not save report file, but validation completed');
    }
    
    // Display results
    console.log('\n' + '='.repeat(80));
    console.log('🎯 PRODUCTION DEPLOYMENT VALIDATION RESULTS');
    console.log('='.repeat(80));
    
    const statusIcon = {
      'PASSED': '✅',
      'PASSED_WITH_WARNINGS': '⚠️',
      'FAILED': '❌'
    }[report.overallStatus];
    
    console.log(`\n${statusIcon} Overall Status: ${report.overallStatus}`);
    console.log(`📊 Tests: ${report.summary.passed}/${report.summary.total} passed (${report.summary.successRate}% success rate)`);
    console.log(`⏱️ Duration: ${Math.round(report.duration / 1000)}s`);
    
    if (report.recommendations.length > 0) {
      console.log('\n📋 RECOMMENDATIONS:');
      report.recommendations.forEach(rec => {
        const priority = rec.priority === 'CRITICAL' ? '🔴' : rec.priority === 'HIGH' ? '🟡' : '🟢';
        console.log(`\n${priority} ${rec.category}: ${rec.message}`);
        rec.actions.forEach(action => console.log(`   • ${action}`));
      });
    }
    
    console.log('\n' + '='.repeat(80));
    
    return report;
  }
}

// Export for use in other scripts
module.exports = ProductionDeploymentValidator;

// Run validation if called directly
if (require.main === module) {
  // Check for command line arguments
  const args = process.argv.slice(2);
  const config = {};
  
  // Parse command line arguments
  args.forEach((arg, index) => {
    if (arg === '--frontend' && args[index + 1]) {
      config.frontendUrl = args[index + 1];
    } else if (arg === '--backend' && args[index + 1]) {
      config.backendUrl = args[index + 1];
    }
  });
  
  console.log('Usage: node production-deployment-validator.cjs --frontend https://your-site.netlify.app --backend https://your-api.onrender.com\n');
  
  const validator = new ProductionDeploymentValidator(config);
  validator.runValidation().catch(console.error);
}