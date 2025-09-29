#!/usr/bin/env node
/**
 * CalistaLife Master Launch Orchestrator
 * Coordinates complete production deployment, validation, and marketing launch
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

class CalistaMasterOrchestrator {
  constructor() {
    this.launchTimestamp = new Date().toISOString();
    this.steps = [
      { id: 'validation', name: 'Production Validation Suite', script: 'final-production-validation.cjs' },
      { id: 'marketing', name: 'Marketing Campaign Launch', script: 'marketing-campaign-launch.cjs' },
      { id: 'monitoring', name: 'Operations Monitoring Setup', script: 'operations-monitoring.cjs' }
    ];
    this.results = {};
  }

  async executeStep(step) {
    console.log(`\n🚀 EXECUTING: ${step.name}`);
    console.log('='.repeat(50));
    
    const startTime = Date.now();
    
    try {
      // Check if script exists
      const scriptPath = path.join('scripts', step.script);
      if (!fs.existsSync(scriptPath)) {
        throw new Error(`Script not found: ${scriptPath}`);
      }

      // Execute script
      const result = execSync(`node ${scriptPath}`, { 
        encoding: 'utf8',
        timeout: 120000, // 2 minute timeout
        stdio: 'pipe'
      });

      const duration = Date.now() - startTime;
      
      this.results[step.id] = {
        status: 'success',
        duration,
        output: result,
        timestamp: new Date().toISOString()
      };

      console.log(`✅ ${step.name} completed successfully (${duration}ms)`);
      return true;

    } catch (error) {
      const duration = Date.now() - startTime;
      
      this.results[step.id] = {
        status: 'failed',
        duration,
        error: error.message,
        output: error.stdout || '',
        stderr: error.stderr || '',
        timestamp: new Date().toISOString()
      };

      console.error(`❌ ${step.name} failed: ${error.message}`);
      return false;
    }
  }

  async startContinuousMonitoring() {
    console.log('\n🔄 Starting Continuous Monitoring...');
    
    try {
      // Start monitoring in background
      const monitoring = spawn('node', ['scripts/operations-monitoring.cjs', '--continuous'], {
        detached: true,
        stdio: ['ignore', 'pipe', 'pipe']
      });

      monitoring.unref(); // Allow parent to exit

      // Save monitoring PID for later management
      fs.writeFileSync('.monitoring-pid', monitoring.pid.toString());
      
      console.log(`✅ Continuous monitoring started (PID: ${monitoring.pid})`);
      
      this.results.continuous_monitoring = {
        status: 'running',
        pid: monitoring.pid,
        timestamp: new Date().toISOString()
      };

      return true;

    } catch (error) {
      console.error(`❌ Failed to start continuous monitoring: ${error.message}`);
      
      this.results.continuous_monitoring = {
        status: 'failed',
        error: error.message,
        timestamp: new Date().toISOString()
      };

      return false;
    }
  }

  async runPreflightChecks() {
    console.log('🔍 PREFLIGHT CHECKS');
    console.log('===================');

    const checks = {
      git_status: await this.checkGitStatus(),
      environment_files: await this.checkEnvironmentFiles(),
      dependencies: await this.checkDependencies(),
      scripts: await this.checkScripts()
    };

    const allPassed = Object.values(checks).every(check => check.status === 'pass');
    
    if (!allPassed) {
      console.log('\n❌ PREFLIGHT FAILED - Cannot proceed with launch');
      const failedChecks = Object.entries(checks)
        .filter(([_, check]) => check.status !== 'pass')
        .map(([name, check]) => `${name}: ${check.message}`);
      
      failedChecks.forEach(failure => console.log(`   - ${failure}`));
      return false;
    }

    console.log('✅ All preflight checks passed');
    this.results.preflight = { status: 'passed', checks, timestamp: new Date().toISOString() };
    return true;
  }

  async checkGitStatus() {
    try {
      const status = execSync('git status --porcelain', { encoding: 'utf8', stdio: 'pipe' });
      const hasUncommitted = status.trim().length > 0;
      
      if (hasUncommitted) {
        return {
          status: 'warning',
          message: 'Uncommitted changes detected - ensure latest changes are pushed'
        };
      }

      // Check if remote exists
      const remotes = execSync('git remote -v', { encoding: 'utf8', stdio: 'pipe' });
      const hasRemote = remotes.trim().length > 0;
      
      return {
        status: hasRemote ? 'pass' : 'fail',
        message: hasRemote ? 'Git repository configured' : 'No git remote configured'
      };

    } catch (error) {
      return {
        status: 'fail',
        message: `Git check failed: ${error.message}`
      };
    }
  }

  async checkEnvironmentFiles() {
    const requiredFiles = ['frontend/.env.production', 'netlify.toml'];
    const missing = requiredFiles.filter(file => !fs.existsSync(file));
    
    if (missing.length > 0) {
      return {
        status: 'fail',
        message: `Missing files: ${missing.join(', ')}`
      };
    }

    return { status: 'pass', message: 'All environment files present' };
  }

  async checkDependencies() {
    try {
      execSync('node --version', { stdio: 'pipe' });
      return { status: 'pass', message: 'Node.js available' };
    } catch (error) {
      return { status: 'fail', message: 'Node.js not found' };
    }
  }

  async checkScripts() {
    const requiredScripts = this.steps.map(step => step.script);
    const missing = requiredScripts.filter(script => 
      !fs.existsSync(path.join('scripts', script))
    );

    if (missing.length > 0) {
      return {
        status: 'fail', 
        message: `Missing scripts: ${missing.join(', ')}`
      };
    }

    return { status: 'pass', message: 'All required scripts present' };
  }

  generateLaunchReport() {
    const report = {
      launch_timestamp: this.launchTimestamp,
      completion_timestamp: new Date().toISOString(),
      results: this.results,
      summary: this.generateSummary(),
      next_steps: this.generateNextSteps()
    };

    // Save detailed report
    fs.writeFileSync(
      `scripts/launch-report-${new Date().toISOString().split('T')[0]}.json`,
      JSON.stringify(report, null, 2)
    );

    return report;
  }

  generateSummary() {
    const totalSteps = this.steps.length + 2; // +2 for preflight and monitoring
    const successfulSteps = Object.values(this.results).filter(r => 
      r.status === 'success' || r.status === 'passed' || r.status === 'running'
    ).length;

    const successRate = Math.round((successfulSteps / totalSteps) * 100);
    
    return {
      total_steps: totalSteps,
      successful_steps: successfulSteps,
      success_rate: `${successRate}%`,
      status: successRate >= 95 ? 'EXCELLENT' : successRate >= 80 ? 'GOOD' : 'NEEDS_ATTENTION'
    };
  }

  generateNextSteps() {
    const summary = this.generateSummary();
    const steps = [];

    if (summary.success_rate === '100%') {
      steps.push('✅ Launch completed successfully! Monitor KPIs for first 48 hours');
      steps.push('📊 Review marketing campaign performance and optimize');
      steps.push('🔄 Set up weekly performance reviews');
    } else {
      const failed = Object.entries(this.results)
        .filter(([_, result]) => result.status === 'failed')
        .map(([step, _]) => step);
      
      if (failed.length > 0) {
        steps.push(`❌ Address failed steps: ${failed.join(', ')}`);
      }
      steps.push('🔧 Review errors in launch report');
      steps.push('🔄 Retry failed steps after fixes');
    }

    return steps;
  }

  async executeMasterLaunch() {
    console.log('🎯 CALISTALIFE MASTER LAUNCH ORCHESTRATION');
    console.log('==========================================');
    console.log(`Started: ${this.launchTimestamp}\n`);

    // Step 1: Preflight checks
    const preflightOk = await this.runPreflightChecks();
    if (!preflightOk) {
      process.exit(1);
    }

    // Step 2: Execute main steps sequentially
    let allSuccessful = true;
    for (const step of this.steps) {
      const success = await this.executeStep(step);
      if (!success) {
        allSuccessful = false;
        // Continue with other steps but mark overall as failed
      }
    }

    // Step 3: Start continuous monitoring
    await this.startContinuousMonitoring();

    // Step 4: Generate final report
    const report = this.generateLaunchReport();

    // Final summary
    console.log('\n🎊 LAUNCH ORCHESTRATION COMPLETE!');
    console.log('==================================');
    console.log(`Success Rate: ${report.summary.success_rate}`);
    console.log(`Status: ${report.summary.status}`);
    
    if (report.summary.success_rate === '100%') {
      console.log('\n🚀 CalistaLife is live and ready for growth!');
      console.log('💰 Marketing campaigns are active');
      console.log('📊 Monitoring is running continuously');
      console.log('🎯 Target: ROAS 3.5x, CAC $35, CR 2.5%');
    } else {
      console.log('\n⚠️  Some issues detected - review launch report');
    }

    console.log(`\n📋 Next Steps:`);
    report.next_steps.forEach(step => console.log(`   ${step}`));

    console.log(`\n📊 Detailed report saved: launch-report-${new Date().toISOString().split('T')[0]}.json`);

    return report;
  }
}

// Execute if run directly
if (require.main === module) {
  const orchestrator = new CalistaMasterOrchestrator();
  
  orchestrator.executeMasterLaunch()
    .then(report => {
      const exitCode = report.summary.success_rate === '100%' ? 0 : 1;
      process.exit(exitCode);
    })
    .catch(error => {
      console.error('💥 Master launch failed:', error);
      process.exit(1);
    });
}

module.exports = CalistaMasterOrchestrator;