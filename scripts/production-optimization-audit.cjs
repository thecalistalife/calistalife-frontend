// CalistaLife Production Optimization & Configuration Audit
// Identifies and provides solutions for production deployment issues

const axios = require('axios');
const fs = require('fs');
const path = require('path');

class ProductionOptimizationAudit {
  constructor(config = {}) {
    this.config = {
      frontendUrl: 'https://calistalife.com',
      ga4MeasurementId: 'G-FL9QNKMXPX',
      sentryDsn: 'https://644e5c1b924e2641283405c73caf24cb@o4510098794676224.ingest.us.sentry.io/4510101948923904',
      ...config
    };
    this.issues = [];
    this.optimizations = [];
    this.startTime = Date.now();
  }

  log(category, severity, message, details = null, solution = null) {
    const issue = {
      timestamp: new Date().toISOString(),
      category,
      severity, // 'critical', 'high', 'medium', 'low', 'info'
      message,
      details,
      solution,
      elapsed: Date.now() - this.startTime
    };
    
    this.issues.push(issue);
    
    const icon = {
      critical: '🔥',
      high: '❌',
      medium: '⚠️',
      low: 'ℹ️',
      info: '📋'
    }[severity] || '📋';
    
    console.log(`${icon} [${category}] ${message}`);
    if (details) {
      console.log(`   Details: ${typeof details === 'object' ? JSON.stringify(details, null, 2) : details}`);
    }
    if (solution) {
      console.log(`   💡 Solution: ${solution}`);
    }
  }

  // Audit 1: Frontend Configuration Analysis
  async auditFrontendConfiguration() {
    this.log('Frontend', 'info', 'Analyzing frontend configuration at calistalife.com...');
    
    try {
      const response = await axios.get(this.config.frontendUrl, { 
        timeout: 10000,
        headers: {
          'User-Agent': 'CalistaLife-Production-Audit/1.0'
        }
      });
      
      const htmlContent = response.data;
      
      // Check 1.1: GA4 Configuration
      const hasGA4Script = htmlContent.includes('googletagmanager.com/gtag/js');
      const hasGA4Id = htmlContent.includes(this.config.ga4MeasurementId);
      const hasGtagConfig = htmlContent.includes('gtag(') && htmlContent.includes('config');
      
      if (!hasGA4Script || !hasGA4Id || !hasGtagConfig) {
        this.log('Frontend', 'critical', 'GA4 tracking not properly configured', {
          hasScript: hasGA4Script,
          hasId: hasGA4Id,
          hasConfig: hasGtagConfig
        }, 'Add GA4 tracking script and configure VITE_GA4_MEASUREMENT_ID=G-FL9QNKMXPX in Netlify environment variables');
      } else {
        this.log('Frontend', 'info', '✅ GA4 tracking properly configured');
      }

      // Check 1.2: Sentry Configuration
      const hasSentryScript = htmlContent.includes('sentry') || htmlContent.includes('ingest.sentry.io');
      const hasSentryInit = htmlContent.includes('Sentry.init');
      
      if (!hasSentryScript || !hasSentryInit) {
        this.log('Frontend', 'high', 'Sentry error monitoring not configured', {
          hasScript: hasSentryScript,
          hasInit: hasSentryInit
        }, 'Add Sentry integration and configure VITE_SENTRY_DSN in Netlify environment variables');
      } else {
        this.log('Frontend', 'info', '✅ Sentry error monitoring configured');
      }

      // Check 1.3: API Configuration
      const hasApiCalls = htmlContent.includes('/api/') || htmlContent.includes('fetch(');
      const hasLocalhost = htmlContent.includes('localhost') || htmlContent.includes('127.0.0.1');
      
      if (hasLocalhost) {
        this.log('Frontend', 'critical', 'Localhost API URLs detected in production', {
          issue: 'Development URLs found in production build'
        }, 'Configure VITE_API_URL with production backend URL in Netlify environment variables');
      } else if (hasApiCalls) {
        this.log('Frontend', 'info', '✅ API calls configured (no localhost detected)');
      }

      // Check 1.4: Performance Optimization
      const hasMinification = !htmlContent.includes('    ') || htmlContent.includes('.min.');
      const hasCompression = response.headers['content-encoding'];
      const responseSize = Buffer.byteLength(htmlContent, 'utf8');
      
      this.log('Frontend', responseSize > 500000 ? 'medium' : 'info', 'Performance analysis', {
        minified: hasMinification,
        compressed: !!hasCompression,
        sizeKB: Math.round(responseSize / 1024),
        loadTime: Date.now() - this.startTime
      }, responseSize > 500000 ? 'Enable compression and optimize bundle size' : null);

    } catch (error) {
      this.log('Frontend', 'critical', 'Frontend audit failed', {
        error: error.message,
        url: this.config.frontendUrl
      }, 'Check if frontend is properly deployed and accessible');
    }
  }

  // Audit 2: Backend Infrastructure Analysis
  async auditBackendInfrastructure() {
    this.log('Backend', 'info', 'Analyzing backend infrastructure...');
    
    const possibleBackendUrls = [
      'https://api.calistalife.com',
      'https://calistalife-backend.onrender.com',
      'https://calista-backend.onrender.com',
      'https://calistalife.com/api'
    ];
    
    let workingBackend = null;
    
    for (const url of possibleBackendUrls) {
      try {
        this.log('Backend', 'info', `Testing backend URL: ${url}`);
        
        const response = await axios.get(`${url}/health`, { 
          timeout: 5000,
          validateStatus: status => status < 500 
        });
        
        if (response.status === 200) {
          workingBackend = url;
          this.log('Backend', 'info', `✅ Backend found at ${url}`, {
            status: response.status,
            responseTime: Date.now() - this.startTime
          });
          break;
        }
      } catch (error) {
        this.log('Backend', 'medium', `Backend not accessible at ${url}`, {
          error: error.code || error.message
        });
      }
    }
    
    if (!workingBackend) {
      this.log('Backend', 'critical', 'No accessible backend found', {
        testedUrls: possibleBackendUrls
      }, 'Deploy backend to Render or configure API proxy on Netlify. Ensure /health endpoint exists.');
      
      return;
    }
    
    // If backend found, test additional endpoints
    try {
      const apiTests = [
        { endpoint: '/api/products', name: 'Products API' },
        { endpoint: '/api/categories', name: 'Categories API' },
        { endpoint: '/api/auth/test', name: 'Auth Test' }
      ];
      
      for (const test of apiTests) {
        try {
          const response = await axios.get(`${workingBackend}${test.endpoint}`, { 
            timeout: 5000,
            validateStatus: () => true 
          });
          
          if (response.status < 500) {
            this.log('Backend', 'info', `✅ ${test.name} responding (${response.status})`);
          }
        } catch (error) {
          this.log('Backend', 'low', `${test.name} not accessible`, {
            note: 'This may be normal if endpoint is not implemented'
          });
        }
      }
      
    } catch (error) {
      this.log('Backend', 'medium', 'Additional backend tests failed', {
        error: error.message
      });
    }
  }

  // Audit 3: Security & Compliance Check
  async auditSecurityCompliance() {
    this.log('Security', 'info', 'Conducting security and compliance audit...');
    
    try {
      const response = await axios.get(this.config.frontendUrl, { timeout: 10000 });
      
      // Check 3.1: HTTPS and SSL
      const isHTTPS = this.config.frontendUrl.startsWith('https://');
      const sslHeaders = response.headers;
      
      if (!isHTTPS) {
        this.log('Security', 'critical', 'Site not using HTTPS', {
          currentProtocol: 'HTTP'
        }, 'Ensure site is served over HTTPS with valid SSL certificate');
      } else {
        this.log('Security', 'info', '✅ Site using HTTPS');
      }
      
      // Check 3.2: Security Headers
      const securityHeaders = {
        'content-security-policy': 'Content Security Policy',
        'x-frame-options': 'X-Frame-Options',
        'x-content-type-options': 'X-Content-Type-Options',
        'strict-transport-security': 'HSTS',
        'referrer-policy': 'Referrer Policy'
      };
      
      const missingHeaders = [];
      for (const [header, name] of Object.entries(securityHeaders)) {
        if (!sslHeaders[header]) {
          missingHeaders.push(name);
        }
      }
      
      if (missingHeaders.length > 0) {
        this.log('Security', 'medium', 'Security headers missing', {
          missing: missingHeaders
        }, 'Add security headers via Netlify _headers file or hosting configuration');
      } else {
        this.log('Security', 'info', '✅ Security headers configured');
      }
      
      // Check 3.3: Exposed Secrets
      const htmlContent = response.data;
      const potentialSecrets = htmlContent.match(/(xkeysib-[a-f0-9]+|sk_live_[A-Za-z0-9]+|eyJ[A-Za-z0-9]+)/gi);
      
      if (potentialSecrets && potentialSecrets.length > 0) {
        this.log('Security', 'critical', 'SECURITY BREACH: Secrets exposed in frontend', {
          count: potentialSecrets.length,
          types: potentialSecrets.map(s => s.substring(0, 20) + '...')
        }, 'IMMEDIATE ACTION: Remove secrets from frontend, rotate all affected keys, redeploy');
      } else {
        this.log('Security', 'info', '✅ No exposed secrets detected in frontend');
      }
      
    } catch (error) {
      this.log('Security', 'high', 'Security audit failed', {
        error: error.message
      }, 'Manual security review required');
    }
  }

  // Audit 4: Performance & SEO
  async auditPerformanceSEO() {
    this.log('Performance', 'info', 'Analyzing performance and SEO metrics...');
    
    try {
      const startTime = Date.now();
      const response = await axios.get(this.config.frontendUrl, { 
        timeout: 15000,
        headers: {
          'User-Agent': 'CalistaLife-SEO-Audit/1.0'
        }
      });
      const loadTime = Date.now() - startTime;
      
      const htmlContent = response.data;
      
      // Performance Metrics
      const metrics = {
        loadTime,
        responseSize: Buffer.byteLength(htmlContent, 'utf8'),
        compressed: !!response.headers['content-encoding'],
        cached: !!response.headers['cache-control']
      };
      
      this.log('Performance', loadTime > 3000 ? 'medium' : 'info', 'Load performance', {
        loadTime: `${loadTime}ms`,
        sizeKB: Math.round(metrics.responseSize / 1024),
        compressed: metrics.compressed,
        cached: metrics.cached
      }, loadTime > 3000 ? 'Optimize images, enable compression, implement CDN' : null);
      
      // SEO Audit
      const seoChecks = {
        hasTitle: htmlContent.includes('<title>') && !htmlContent.includes('<title></title>'),
        hasMetaDescription: htmlContent.includes('name="description"'),
        hasOgTags: htmlContent.includes('property="og:'),
        hasStructuredData: htmlContent.includes('application/ld+json'),
        hasCanonical: htmlContent.includes('rel="canonical"'),
        hasViewport: htmlContent.includes('name="viewport"')
      };
      
      const seoIssues = Object.entries(seoChecks)
        .filter(([key, value]) => !value)
        .map(([key]) => key);
      
      if (seoIssues.length > 0) {
        this.log('SEO', 'medium', 'SEO optimization opportunities', {
          missing: seoIssues,
          current: seoChecks
        }, 'Implement missing SEO elements: title, meta description, Open Graph tags, structured data');
      } else {
        this.log('SEO', 'info', '✅ SEO fundamentals in place');
      }
      
    } catch (error) {
      this.log('Performance', 'medium', 'Performance audit failed', {
        error: error.message
      }, 'Manual performance testing recommended');
    }
  }

  // Generate Action Plan
  generateActionPlan() {
    const criticalIssues = this.issues.filter(i => i.severity === 'critical');
    const highPriorityIssues = this.issues.filter(i => i.severity === 'high');
    const mediumIssues = this.issues.filter(i => i.severity === 'medium');
    
    const actionPlan = {
      timestamp: new Date().toISOString(),
      summary: {
        totalIssues: this.issues.length,
        critical: criticalIssues.length,
        high: highPriorityIssues.length,
        medium: mediumIssues.length,
        low: this.issues.filter(i => i.severity === 'low').length
      },
      readinessScore: Math.max(0, 100 - (criticalIssues.length * 25) - (highPriorityIssues.length * 15) - (mediumIssues.length * 5)),
      immediateActions: [],
      shortTermActions: [],
      recommendations: []
    };
    
    // Immediate Actions (Critical Issues)
    criticalIssues.forEach(issue => {
      if (issue.solution) {
        actionPlan.immediateActions.push({
          priority: 'CRITICAL',
          action: issue.solution,
          issue: issue.message,
          category: issue.category
        });
      }
    });
    
    // Short-term Actions (High Priority)
    highPriorityIssues.forEach(issue => {
      if (issue.solution) {
        actionPlan.shortTermActions.push({
          priority: 'HIGH',
          action: issue.solution,
          issue: issue.message,
          category: issue.category
        });
      }
    });
    
    // Medium Priority Recommendations
    mediumIssues.forEach(issue => {
      if (issue.solution) {
        actionPlan.recommendations.push({
          priority: 'MEDIUM',
          action: issue.solution,
          issue: issue.message,
          category: issue.category
        });
      }
    });
    
    return actionPlan;
  }

  // Main audit function
  async runAudit() {
    console.log('🔍 CalistaLife Production Optimization & Configuration Audit\n');
    console.log(`Target: ${this.config.frontendUrl}`);
    console.log(`Started: ${new Date().toISOString()}\n`);
    
    const auditTasks = [
      () => this.auditFrontendConfiguration(),
      () => this.auditBackendInfrastructure(),
      () => this.auditSecurityCompliance(),
      () => this.auditPerformanceSEO()
    ];
    
    for (const task of auditTasks) {
      try {
        await task();
        console.log(''); // Add spacing between audits
      } catch (error) {
        this.log('System', 'high', `Audit task failed: ${error.message}`);
      }
    }
    
    // Generate comprehensive action plan
    const actionPlan = this.generateActionPlan();
    const timestamp = new Date().toISOString().split('T')[0];
    
    try {
      if (!fs.existsSync('logs')) {
        fs.mkdirSync('logs', { recursive: true });
      }
      fs.writeFileSync(
        path.join('logs', `production-optimization-${timestamp}.json`),
        JSON.stringify({ issues: this.issues, actionPlan }, null, 2)
      );
    } catch (err) {
      console.log('⚠️ Could not save audit report');
    }
    
    // Display Results
    console.log('='.repeat(80));
    console.log('🎯 PRODUCTION OPTIMIZATION AUDIT RESULTS');
    console.log('='.repeat(80));
    
    const readinessIcon = actionPlan.readinessScore >= 90 ? '🟢' : 
                         actionPlan.readinessScore >= 70 ? '🟡' : '🔴';
    
    console.log(`\n${readinessIcon} Production Readiness Score: ${actionPlan.readinessScore}/100`);
    console.log(`📊 Issues Found: ${actionPlan.summary.totalIssues} total`);
    console.log(`   🔥 Critical: ${actionPlan.summary.critical}`);
    console.log(`   ❌ High: ${actionPlan.summary.high}`);
    console.log(`   ⚠️ Medium: ${actionPlan.summary.medium}`);
    console.log(`   ℹ️ Low: ${actionPlan.summary.low}`);
    
    // Immediate Actions Required
    if (actionPlan.immediateActions.length > 0) {
      console.log('\n🔥 IMMEDIATE ACTIONS REQUIRED:');
      actionPlan.immediateActions.forEach((action, index) => {
        console.log(`${index + 1}. [${action.category}] ${action.action}`);
      });
    }
    
    // Short-term Actions
    if (actionPlan.shortTermActions.length > 0) {
      console.log('\n❌ HIGH PRIORITY ACTIONS:');
      actionPlan.shortTermActions.forEach((action, index) => {
        console.log(`${index + 1}. [${action.category}] ${action.action}`);
      });
    }
    
    // Recommendations
    if (actionPlan.recommendations.length > 0) {
      console.log('\n⚠️ OPTIMIZATION RECOMMENDATIONS:');
      actionPlan.recommendations.forEach((action, index) => {
        console.log(`${index + 1}. [${action.category}] ${action.action}`);
      });
    }
    
    // Next Steps
    console.log('\n🚀 NEXT STEPS:');
    if (actionPlan.summary.critical > 0) {
      console.log('1. 🔥 Address all CRITICAL issues before proceeding');
      console.log('2. ✅ Re-run validation after fixes');
      console.log('3. 🎯 Proceed with marketing launch when readiness score ≥90');
    } else if (actionPlan.summary.high > 0) {
      console.log('1. ❌ Address HIGH priority issues for optimal performance');
      console.log('2. ✅ Re-run validation');
      console.log('3. 🎯 Marketing launch can proceed with monitoring');
    } else {
      console.log('1. ✅ Configuration looks good for production!');
      console.log('2. 📊 Monitor performance metrics closely');
      console.log('3. 🚀 Ready for marketing campaign launch');
    }
    
    console.log('\n' + '='.repeat(80));
    
    return actionPlan;
  }
}

// Export for use in other scripts
module.exports = ProductionOptimizationAudit;

// Run audit if called directly
if (require.main === module) {
  const audit = new ProductionOptimizationAudit();
  audit.runAudit().catch(console.error);
}