#!/usr/bin/env node
/**
 * CalistaLife Pre-Launch Setup Verification
 * Validates all requirements before production launch
 */

const { execSync } = require('child_process');
const fs = require('fs');

class PreLaunchVerifier {
  constructor() {
    this.checks = {
      git: { status: 'pending', score: 0 },
      environment: { status: 'pending', score: 0 },
      backend: { status: 'pending', score: 0 },
      ssl: { status: 'pending', score: 0 },
      scripts: { status: 'pending', score: 0 }
    };
  }

  async verifyGitSetup() {
    console.log('🔍 VERIFYING GIT SETUP');
    console.log('======================');
    
    try {
      // Check for uncommitted changes
      const status = execSync('git status --porcelain', { encoding: 'utf8', stdio: 'pipe' });
      const hasUncommitted = status.trim().length > 0;
      
      if (hasUncommitted) {
        console.log('⚠️  Uncommitted changes detected:');
        console.log(status);
        this.checks.git = {
          status: 'warning',
          score: 50,
          message: 'Uncommitted changes - run git add . && git commit && git push'
        };
        return false;
      }

      // Check remote configuration
      const remotes = execSync('git remote -v', { encoding: 'utf8', stdio: 'pipe' });
      const hasRemote = remotes.trim().length > 0;
      
      if (!hasRemote) {
        console.log('❌ No git remote configured');
        this.checks.git = {
          status: 'failed',
          score: 0,
          message: 'Run: git remote add origin <your-repo-url>'
        };
        return false;
      }

      // Check if latest commit is pushed
      try {
        const unpushed = execSync('git log @{u}..', { encoding: 'utf8', stdio: 'pipe' });
        if (unpushed.trim().length > 0) {
          console.log('⚠️  Unpushed commits detected');
          this.checks.git = {
            status: 'warning',
            score: 75,
            message: 'Run: git push to sync with remote'
          };
          return false;
        }
      } catch (error) {
        // Branch might not have upstream - check if we can push
        console.log('⚠️  No upstream branch configured');
        this.checks.git = {
          status: 'warning',
          score: 75,
          message: 'Run: git push -u origin master (or your branch name)'
        };
        return false;
      }

      console.log('✅ Git setup complete - repository synchronized');
      this.checks.git = { status: 'passed', score: 100, message: 'Git repository properly configured' };
      return true;

    } catch (error) {
      console.log(`❌ Git verification failed: ${error.message}`);
      this.checks.git = { status: 'failed', score: 0, message: `Git error: ${error.message}` };
      return false;
    }
  }

  async verifyEnvironmentVariables() {
    console.log('\n⚙️ VERIFYING ENVIRONMENT SETUP');
    console.log('===============================');
    
    const requiredVars = {
      'VITE_GA4_MEASUREMENT_ID': 'G-FL9QNKMXPX',
      'VITE_API_URL': 'https://api.calistalife.com',
      'VITE_SENTRY_DSN': 'https://'
    };

    let score = 0;
    const missing = [];
    const configured = [];

    // Check local environment files
    const envFiles = ['frontend/.env.production', 'frontend/.env.local'];
    
    for (const envFile of envFiles) {
      if (fs.existsSync(envFile)) {
        const content = fs.readFileSync(envFile, 'utf8');
        
        for (const [varName, expectedPattern] of Object.entries(requiredVars)) {
          const regex = new RegExp(`${varName}\\s*=\\s*(.+)`, 'i');
          const match = content.match(regex);
          
          if (match && match[1].trim() !== '') {
            const value = match[1].trim();
            if (varName === 'VITE_SENTRY_DSN' && value.startsWith('https://')) {
              configured.push(`${varName}=${value.substring(0, 20)}...`);
              score += 33.33;
            } else if (value === expectedPattern || varName === 'VITE_SENTRY_DSN') {
              configured.push(`${varName}=${value}`);
              score += 33.33;
            }
          } else if (!missing.includes(varName)) {
            missing.push(varName);
          }
        }
      }
    }

    if (configured.length > 0) {
      console.log('✅ Configured variables:');
      configured.forEach(v => console.log(`   ${v}`));
    }

    if (missing.length > 0) {
      console.log('❌ Missing variables:');
      missing.forEach(v => console.log(`   ${v}`));
      console.log('\n🔧 Action needed:');
      console.log('   1. Set these in Netlify Dashboard > Site Settings > Environment Variables');
      console.log('   2. Or add to frontend/.env.production file');
    }

    const status = missing.length === 0 ? 'passed' : 'failed';
    this.checks.environment = {
      status,
      score: Math.round(score),
      message: missing.length === 0 ? 'All environment variables configured' : `Missing: ${missing.join(', ')}`
    };

    return missing.length === 0;
  }

  async verifyBackendDeployment() {
    console.log('\n🚀 VERIFYING BACKEND DEPLOYMENT');
    console.log('===============================');
    
    try {
      // Test backend connectivity
      const https = require('https');
      const backendUrl = 'https://api.calistalife.com/health';
      
      const result = await new Promise((resolve) => {
        const request = https.get(backendUrl, (response) => {
          resolve({ 
            status: response.statusCode, 
            success: response.statusCode === 200 
          });
        });
        
        request.on('error', (error) => {
          resolve({ 
            status: 0, 
            success: false, 
            error: error.message 
          });
        });
        
        request.setTimeout(5000, () => {
          request.destroy();
          resolve({ 
            status: 0, 
            success: false, 
            error: 'Timeout' 
          });
        });
      });

      if (result.success) {
        console.log('✅ Backend API responding correctly');
        this.checks.backend = { 
          status: 'passed', 
          score: 100, 
          message: 'Backend deployed and accessible' 
        };
        return true;
      } else {
        console.log(`❌ Backend not accessible: ${result.error || `HTTP ${result.status}`}`);
        console.log('🔧 Action needed:');
        console.log('   1. Deploy backend to Render');
        console.log('   2. Configure environment variables on Render dashboard');
        console.log('   3. Ensure custom domain api.calistalife.com points to Render');
        
        this.checks.backend = { 
          status: 'failed', 
          score: 0, 
          message: `Backend not accessible: ${result.error || 'HTTP error'}` 
        };
        return false;
      }

    } catch (error) {
      console.log(`❌ Backend verification failed: ${error.message}`);
      this.checks.backend = { 
        status: 'failed', 
        score: 0, 
        message: `Backend check failed: ${error.message}` 
      };
      return false;
    }
  }

  async verifySSLCertificates() {
    console.log('\n🔒 VERIFYING SSL CERTIFICATES');
    console.log('=============================');
    
    const domains = [
      { name: 'calistalife.com', type: 'frontend' },
      { name: 'api.calistalife.com', type: 'backend' }
    ];

    let validCerts = 0;
    const issues = [];

    for (const domain of domains) {
      try {
        const https = require('https');
        const tls = require('tls');
        
        const certInfo = await new Promise((resolve, reject) => {
          const options = {
            host: domain.name,
            port: 443,
            servername: domain.name
          };

          const socket = tls.connect(options, () => {
            const cert = socket.getPeerCertificate();
            socket.destroy();
            resolve({
              valid: socket.authorized,
              validTo: cert.valid_to,
              issuer: cert.issuer?.O || 'Unknown',
              daysUntilExpiry: Math.floor((new Date(cert.valid_to) - new Date()) / (1000 * 60 * 60 * 24))
            });
          });

          socket.on('error', (error) => {
            socket.destroy();
            reject(error);
          });

          socket.setTimeout(5000, () => {
            socket.destroy();
            reject(new Error('Timeout'));
          });
        });

        if (certInfo.valid && certInfo.daysUntilExpiry > 30) {
          console.log(`✅ ${domain.name}: Valid SSL (${certInfo.daysUntilExpiry} days)`);
          validCerts++;
        } else if (certInfo.daysUntilExpiry <= 30) {
          console.log(`⚠️  ${domain.name}: SSL expires soon (${certInfo.daysUntilExpiry} days)`);
          issues.push(`${domain.name} SSL expires in ${certInfo.daysUntilExpiry} days`);
        } else {
          console.log(`❌ ${domain.name}: Invalid SSL certificate`);
          issues.push(`${domain.name} has invalid SSL certificate`);
        }

      } catch (error) {
        console.log(`❌ ${domain.name}: SSL check failed - ${error.message}`);
        issues.push(`${domain.name}: ${error.message}`);
      }
    }

    const score = Math.round((validCerts / domains.length) * 100);
    const status = validCerts === domains.length ? 'passed' : 'failed';

    this.checks.ssl = {
      status,
      score,
      message: issues.length === 0 ? 'SSL certificates valid' : `Issues: ${issues.join(', ')}`
    };

    if (issues.length > 0) {
      console.log('\n🔧 SSL Action needed:');
      console.log('   1. Ensure domains point to correct hosting platforms');
      console.log('   2. Enable SSL on Netlify (automatic)');
      console.log('   3. Configure custom domain on Render with SSL');
    }

    return validCerts === domains.length;
  }

  async verifyLaunchScripts() {
    console.log('\n📜 VERIFYING LAUNCH SCRIPTS');
    console.log('===========================');
    
    const requiredScripts = [
      'final-production-validation.cjs',
      'marketing-campaign-launch.cjs',
      'operations-monitoring.cjs',
      'master-launch-orchestrator.cjs'
    ];

    let validScripts = 0;
    const missing = [];

    for (const script of requiredScripts) {
      const scriptPath = `scripts/${script}`;
      if (fs.existsSync(scriptPath)) {
        // Basic syntax check
        try {
          execSync(`node -c ${scriptPath}`, { stdio: 'pipe' });
          console.log(`✅ ${script}: Ready`);
          validScripts++;
        } catch (error) {
          console.log(`❌ ${script}: Syntax error`);
          missing.push(`${script} (syntax error)`);
        }
      } else {
        console.log(`❌ ${script}: Missing`);
        missing.push(script);
      }
    }

    const score = Math.round((validScripts / requiredScripts.length) * 100);
    const status = validScripts === requiredScripts.length ? 'passed' : 'failed';

    this.checks.scripts = {
      status,
      score,
      message: missing.length === 0 ? 'All launch scripts ready' : `Missing: ${missing.join(', ')}`
    };

    return validScripts === requiredScripts.length;
  }

  generateReadinessReport() {
    const totalScore = Object.values(this.checks).reduce((sum, check) => sum + check.score, 0);
    const maxScore = Object.keys(this.checks).length * 100;
    const overallScore = Math.round((totalScore / maxScore) * 100);

    const report = {
      timestamp: new Date().toISOString(),
      overall_score: overallScore,
      status: overallScore >= 95 ? 'READY_FOR_LAUNCH' : overallScore >= 80 ? 'MINOR_ISSUES' : 'CRITICAL_ISSUES',
      checks: this.checks,
      recommendations: this.generateRecommendations()
    };

    // Save report
    fs.writeFileSync('scripts/pre-launch-report.json', JSON.stringify(report, null, 2));

    return report;
  }

  generateRecommendations() {
    const recommendations = [];
    
    for (const [checkName, result] of Object.entries(this.checks)) {
      if (result.status === 'failed') {
        recommendations.push(`❌ ${checkName}: ${result.message}`);
      } else if (result.status === 'warning') {
        recommendations.push(`⚠️  ${checkName}: ${result.message}`);
      }
    }

    if (recommendations.length === 0) {
      recommendations.push('🚀 All systems ready for production launch!');
    }

    return recommendations;
  }

  async runCompleteVerification() {
    console.log('🎯 CALISTALIFE PRE-LAUNCH VERIFICATION');
    console.log('======================================');
    console.log(`Started: ${new Date().toISOString()}\n`);

    // Run all verification checks
    await this.verifyGitSetup();
    await this.verifyEnvironmentVariables();
    await this.verifyBackendDeployment();
    await this.verifySSLCertificates();
    await this.verifyLaunchScripts();

    // Generate final report
    const report = this.generateReadinessReport();

    console.log('\n📊 PRE-LAUNCH VERIFICATION COMPLETE');
    console.log('===================================');
    console.log(`Overall Readiness Score: ${report.overall_score}%`);
    console.log(`Status: ${report.status}`);
    
    console.log('\n📋 VERIFICATION SUMMARY:');
    for (const [check, result] of Object.entries(this.checks)) {
      const icon = result.status === 'passed' ? '✅' : result.status === 'warning' ? '⚠️ ' : '❌';
      console.log(`   ${icon} ${check}: ${result.score}% - ${result.message}`);
    }

    if (report.recommendations.length > 0) {
      console.log('\n🔧 RECOMMENDATIONS:');
      report.recommendations.forEach(rec => console.log(`   ${rec}`));
    }

    if (report.overall_score >= 95) {
      console.log('\n🚀 READY FOR PRODUCTION LAUNCH!');
      console.log('Execute: node scripts/master-launch-orchestrator.cjs');
    } else if (report.overall_score >= 80) {
      console.log('\n⚠️  MINOR ISSUES - Launch possible but not optimal');
      console.log('Address warnings for best results');
    } else {
      console.log('\n❌ CRITICAL ISSUES - Do not launch yet');
      console.log('Resolve failed checks before proceeding');
    }

    console.log(`\n📊 Detailed report: scripts/pre-launch-report.json`);

    return report;
  }
}

// Execute if run directly
if (require.main === module) {
  const verifier = new PreLaunchVerifier();
  
  verifier.runCompleteVerification()
    .then(report => {
      const exitCode = report.overall_score >= 80 ? 0 : 1;
      process.exit(exitCode);
    })
    .catch(error => {
      console.error('💥 Pre-launch verification failed:', error);
      process.exit(1);
    });
}

module.exports = PreLaunchVerifier;