// CalistaLife Frontend Security Audit
// Scans for secret leakage and security vulnerabilities before deployment

const fs = require('fs');
const path = require('path');

class FrontendSecurityAudit {
  constructor() {
    this.issues = [];
    this.scanPaths = ['frontend'];
    this.secretPatterns = [
      { pattern: /xkeysib-[a-f0-9]/gi, name: 'Brevo API Key', severity: 'CRITICAL' },
      { pattern: /sk_live_[A-Za-z0-9]/gi, name: 'Stripe Live Key', severity: 'CRITICAL' },
      { pattern: /eyJ[A-Za-z0-9]/gi, name: 'JWT Token', severity: 'HIGH' },
      { pattern: /service_role/gi, name: 'Supabase Service Role', severity: 'CRITICAL' },
      { pattern: /BREVO_API_KEY/gi, name: 'Brevo API Key Reference', severity: 'HIGH' },
      { pattern: /SUPABASE_SERVICE_ROLE_KEY/gi, name: 'Supabase Service Role Reference', severity: 'HIGH' },
      { pattern: /TWILIO_AUTH_TOKEN/gi, name: 'Twilio Auth Token Reference', severity: 'HIGH' },
      { pattern: /postgres:\/\/[^\\s]+/gi, name: 'Database Connection String', severity: 'CRITICAL' },
      { pattern: /mongodb:\/\/[^\\s]+/gi, name: 'MongoDB Connection String', severity: 'CRITICAL' },
      { pattern: /redis:\/\/[^\\s]+/gi, name: 'Redis Connection String', severity: 'HIGH' }
    ];
    this.allowedPublicKeys = [
      'VITE_GA4_MEASUREMENT_ID',
      'VITE_SENTRY_DSN',
      'VITE_BREVO_CLIENT_KEY',
      'VITE_API_URL',
      'VITE_APP_ENV',
      'VITE_FACEBOOK_PIXEL_ID',
      'VITE_GOOGLE_ADS_ID'
    ];
  }

  log(severity, message, details = null) {
    const issue = {
      timestamp: new Date().toISOString(),
      severity,
      message,
      details
    };
    
    this.issues.push(issue);
    
    const icon = {
      CRITICAL: '🔥',
      HIGH: '❌',
      MEDIUM: '⚠️',
      LOW: 'ℹ️',
      INFO: '📋'
    }[severity] || '📋';
    
    console.log(`${icon} [${severity}] ${message}`);
    if (details) {
      console.log(`   ${JSON.stringify(details, null, 2)}`);
    }
  }

  // Scan file for secret patterns
  scanFile(filePath, content) {
    const relativePath = path.relative(process.cwd(), filePath);
    const issues = [];

    this.secretPatterns.forEach(({ pattern, name, severity }) => {
      const matches = content.match(pattern);
      if (matches) {
        matches.forEach(match => {
          // Check if this is an allowed public key
          const isAllowed = this.allowedPublicKeys.some(allowedKey => 
            content.includes(allowedKey) && match.includes(allowedKey)
          );

          if (!isAllowed) {
            issues.push({
              file: relativePath,
              pattern: name,
              match: match.length > 50 ? match.substring(0, 50) + '...' : match,
              severity,
              line: this.findLineNumber(content, match)
            });
          }
        });
      }
    });

    return issues;
  }

  // Find line number of match in content
  findLineNumber(content, match) {
    const lines = content.split('\n');
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes(match)) {
        return i + 1;
      }
    }
    return 0;
  }

  // Get all files to scan
  getFilesToScan(dir) {
    const files = [];
    const extensions = ['.env', '.ts', '.tsx', '.js', '.jsx', '.json', '.yml', '.yaml', '.toml'];
    
    const scanDirectory = (directory) => {
      try {
        const items = fs.readdirSync(directory);
        
        items.forEach(item => {
          const fullPath = path.join(directory, item);
          const stat = fs.statSync(fullPath);
          
          if (stat.isDirectory()) {
            // Skip node_modules and other irrelevant directories
            if (!['node_modules', '.git', 'dist', 'build', '.next'].includes(item)) {
              scanDirectory(fullPath);
            }
          } else if (stat.isFile()) {
            const ext = path.extname(item);
            if (extensions.includes(ext) || item.startsWith('.env')) {
              files.push(fullPath);
            }
          }
        });
      } catch (error) {
        this.log('MEDIUM', `Could not scan directory: ${directory}`, { error: error.message });
      }
    };

    this.scanPaths.forEach(scanPath => {
      if (fs.existsSync(scanPath)) {
        scanDirectory(scanPath);
      }
    });

    return files;
  }

  // Validate environment file structure
  validateEnvironmentFiles() {
    this.log('INFO', 'Validating environment file security...');

    const envFiles = [
      'frontend/.env.production',
      'frontend/.env.local',
      'frontend/.env.example'
    ];

    envFiles.forEach(envFile => {
      if (fs.existsSync(envFile)) {
        const content = fs.readFileSync(envFile, 'utf8');
        const relativePath = path.relative(process.cwd(), envFile);

        // Check for secret references in environment files
        const secretRefs = [
          'BREVO_API_KEY',
          'SUPABASE_SERVICE_ROLE_KEY',
          'TWILIO_AUTH_TOKEN',
          'STRIPE_SECRET_KEY'
        ];

        secretRefs.forEach(secretRef => {
          if (content.includes(secretRef) && !content.includes(`# ${secretRef}`) && !content.includes(`# VITE_${secretRef}`)) {
            this.log('HIGH', `Secret reference found in environment file`, {
              file: relativePath,
              secret: secretRef,
              action: 'Remove secret from frontend environment file'
            });
          }
        });

        // Validate that only VITE_ prefixed vars are used in production
        if (envFile.includes('production')) {
          const lines = content.split('\n');
          lines.forEach((line, index) => {
            if (line.trim() && !line.trim().startsWith('#') && line.includes('=')) {
              const varName = line.split('=')[0].trim();
              if (!varName.startsWith('VITE_') && !['NODE_ENV', 'NODE_VERSION', 'NPM_VERSION'].includes(varName)) {
                this.log('MEDIUM', `Non-VITE variable in production environment`, {
                  file: relativePath,
                  line: index + 1,
                  variable: varName,
                  suggestion: 'Use VITE_ prefix for client-side variables'
                });
              }
            }
          });
        }
      }
    });
  }

  // Check for hardcoded secrets in code
  validateCodeFiles() {
    this.log('INFO', 'Scanning code files for hardcoded secrets...');

    const codeFiles = this.getFilesToScan().filter(file => 
      ['.ts', '.tsx', '.js', '.jsx'].includes(path.extname(file))
    );

    codeFiles.forEach(filePath => {
      try {
        const content = fs.readFileSync(filePath, 'utf8');
        const fileIssues = this.scanFile(filePath, content);
        
        fileIssues.forEach(issue => {
          this.log(issue.severity, `Secret detected in code file`, issue);
        });

        // Check for direct API calls that should go through backend
        const directApiCalls = [
          'api.brevo.com',
          'api.sendinblue.com',
          'api.twilio.com'
        ];

        directApiCalls.forEach(apiUrl => {
          if (content.includes(apiUrl)) {
            this.log('MEDIUM', `Direct API call detected - should use backend proxy`, {
              file: path.relative(process.cwd(), filePath),
              api: apiUrl,
              suggestion: 'Route API calls through backend for security'
            });
          }
        });

      } catch (error) {
        this.log('LOW', `Could not read file: ${filePath}`, { error: error.message });
      }
    });
  }

  // Validate build configuration
  validateBuildConfig() {
    this.log('INFO', 'Validating build configuration...');

    // Check package.json for security issues
    const packageJsonPath = 'frontend/package.json';
    if (fs.existsSync(packageJsonPath)) {
      try {
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
        
        // Check for dangerous scripts
        const dangerousPatterns = ['rm -rf', 'curl', 'wget', 'eval'];
        Object.entries(packageJson.scripts || {}).forEach(([scriptName, scriptValue]) => {
          dangerousPatterns.forEach(pattern => {
            if (scriptValue.includes(pattern)) {
              this.log('HIGH', `Potentially dangerous script detected`, {
                script: scriptName,
                pattern: pattern,
                value: scriptValue
              });
            }
          });
        });

        // Check for outdated security-critical dependencies
        const securityDeps = ['vite', 'react', 'typescript'];
        securityDeps.forEach(dep => {
          if (packageJson.dependencies?.[dep] || packageJson.devDependencies?.[dep]) {
            this.log('INFO', `Security-critical dependency found`, { 
              dependency: dep,
              suggestion: 'Keep updated to latest version'
            });
          }
        });

      } catch (error) {
        this.log('MEDIUM', 'Could not parse package.json', { error: error.message });
      }
    }

    // Check Netlify configuration
    if (fs.existsSync('netlify.toml')) {
      this.log('INFO', 'Netlify configuration found - validating security settings');
      
      const netlifyConfig = fs.readFileSync('netlify.toml', 'utf8');
      
      // Check for security headers
      if (netlifyConfig.includes('X-Frame-Options')) {
        this.log('INFO', 'Security headers configured in netlify.toml');
      } else {
        this.log('MEDIUM', 'Security headers not found in netlify.toml');
      }

      // Check for secret exposure in build settings
      const fileIssues = this.scanFile('netlify.toml', netlifyConfig);
      fileIssues.forEach(issue => {
        this.log(issue.severity, `Secret detected in Netlify config`, issue);
      });
    }
  }

  // Generate security report
  generateSecurityReport() {
    const criticalIssues = this.issues.filter(i => i.severity === 'CRITICAL');
    const highIssues = this.issues.filter(i => i.severity === 'HIGH');
    const mediumIssues = this.issues.filter(i => i.severity === 'MEDIUM');
    
    const securityScore = Math.max(0, 100 - (criticalIssues.length * 25) - (highIssues.length * 15) - (mediumIssues.length * 5));
    
    return {
      timestamp: new Date().toISOString(),
      securityScore,
      status: criticalIssues.length > 0 ? 'CRITICAL_ISSUES' :
              highIssues.length > 0 ? 'HIGH_RISK' :
              mediumIssues.length > 0 ? 'MEDIUM_RISK' : 'SECURE',
      summary: {
        total: this.issues.length,
        critical: criticalIssues.length,
        high: highIssues.length,
        medium: mediumIssues.length,
        low: this.issues.filter(i => i.severity === 'LOW').length
      },
      issues: this.issues,
      recommendations: this.generateRecommendations()
    };
  }

  generateRecommendations() {
    const recommendations = [];
    const criticalIssues = this.issues.filter(i => i.severity === 'CRITICAL');
    const highIssues = this.issues.filter(i => i.severity === 'HIGH');

    if (criticalIssues.length > 0) {
      recommendations.push({
        priority: 'CRITICAL',
        action: 'Remove all critical secrets from frontend code immediately',
        details: 'Critical secrets detected that could compromise security'
      });
    }

    if (highIssues.length > 0) {
      recommendations.push({
        priority: 'HIGH',
        action: 'Refactor code to use backend API proxy for all secret operations',
        details: 'High-risk patterns detected that should be moved to backend'
      });
    }

    recommendations.push({
      priority: 'MEDIUM',
      action: 'Ensure all sensitive operations go through backend API',
      details: 'Follow security best practices for client-server architecture'
    });

    recommendations.push({
      priority: 'LOW',
      action: 'Regular security audits and dependency updates',
      details: 'Maintain ongoing security posture with regular reviews'
    });

    return recommendations;
  }

  // Main audit function
  async runAudit() {
    console.log('🔒 CalistaLife Frontend Security Audit\n');
    console.log(`🕐 Started: ${new Date().toISOString()}`);
    console.log(`📁 Scanning paths: ${this.scanPaths.join(', ')}\n`);

    this.validateEnvironmentFiles();
    console.log('');
    
    this.validateCodeFiles();
    console.log('');
    
    this.validateBuildConfig();
    console.log('');

    // Generate comprehensive report
    const report = this.generateSecurityReport();
    
    try {
      if (!fs.existsSync('logs')) {
        fs.mkdirSync('logs', { recursive: true });
      }
      fs.writeFileSync(
        path.join('logs', `frontend-security-audit-${new Date().toISOString().split('T')[0]}.json`),
        JSON.stringify(report, null, 2)
      );
    } catch (err) {
      console.log('⚠️ Could not save security audit report');
    }

    // Display results
    console.log('='.repeat(80));
    console.log('🔒 FRONTEND SECURITY AUDIT RESULTS');
    console.log('='.repeat(80));

    const statusIcon = {
      'SECURE': '✅',
      'MEDIUM_RISK': '⚠️',
      'HIGH_RISK': '❌',
      'CRITICAL_ISSUES': '🔥'
    }[report.status];

    console.log(`\n${statusIcon} Security Status: ${report.status}`);
    console.log(`📊 Security Score: ${report.securityScore}/100`);
    console.log(`🔍 Issues Found: ${report.summary.total}`);
    console.log(`   🔥 Critical: ${report.summary.critical}`);
    console.log(`   ❌ High: ${report.summary.high}`);
    console.log(`   ⚠️ Medium: ${report.summary.medium}`);
    console.log(`   ℹ️ Low: ${report.summary.low}`);

    if (report.recommendations.length > 0) {
      console.log('\n📋 SECURITY RECOMMENDATIONS:');
      report.recommendations.forEach(rec => {
        const priority = rec.priority === 'CRITICAL' ? '🔥' : 
                        rec.priority === 'HIGH' ? '❌' : 
                        rec.priority === 'MEDIUM' ? '⚠️' : 'ℹ️';
        console.log(`\n${priority} ${rec.action}`);
        console.log(`   ${rec.details}`);
      });
    }

    console.log('\n' + '='.repeat(80));

    if (report.securityScore >= 90) {
      console.log('🎉 Frontend security audit passed! Ready for deployment.');
    } else if (report.securityScore >= 70) {
      console.log('⚠️ Address security issues before production deployment.');
    } else {
      console.log('🔥 CRITICAL: Fix security issues immediately before deployment!');
    }

    return report;
  }
}

// Export for use in other scripts
module.exports = FrontendSecurityAudit;

// Run audit if called directly
if (require.main === module) {
  const audit = new FrontendSecurityAudit();
  audit.runAudit().catch(console.error);
}