const { defineConfig } = require('cypress')

module.exports = defineConfig({
  e2e: {
    baseUrl: 'http://localhost:5174',
    supportFile: 'cypress/support/e2e.js',
    specPattern: 'cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',
    videosFolder: 'cypress/videos',
    screenshotsFolder: 'cypress/screenshots',
    
    // Test configuration
    viewportWidth: 1280,
    viewportHeight: 720,
    video: true,
    screenshotOnRunFailure: true,
    defaultCommandTimeout: 10000,
    requestTimeout: 10000,
    responseTimeout: 10000,
    
    // Retry configuration for stability
    retries: {
      runMode: 2,
      openMode: 0,
    },
    
    // Environment variables for different environments
    env: {
      API_URL: 'http://localhost:3001',
      ADMIN_URL: 'http://localhost:5174/calistasecretstoreewfsdca/enter',
      TEST_EMAIL: 'test@cypress.com',
      ADMIN_EMAIL: process.env.CYPRESS_ADMIN_EMAIL || 'admin@thecalista.com',
      ADMIN_PASSWORD: process.env.CYPRESS_ADMIN_PASSWORD || 'admin123',
    },

    setupNodeEvents(on, config) {
      // Task for custom logging and monitoring
      on('task', {
        // Log performance metrics
        logMetric({ name, value, metadata }) {
          console.log(`📊 Performance Metric: ${name} = ${value}ms`, metadata);
          return null;
        },
        
        // Send alert if test fails
        sendAlert({ testName, error, screenshot }) {
          console.error(`🚨 Test Failed: ${testName}`, error);
          
          // In production, send to monitoring service
          if (process.env.NODE_ENV === 'production') {
            // Send to Slack, email, or monitoring service
            // Implementation depends on your alert system
          }
          
          return null;
        },
        
        // Log test results
        logTestResult({ suite, test, status, duration, screenshot }) {
          const result = {
            timestamp: new Date().toISOString(),
            suite,
            test,
            status,
            duration,
            screenshot,
            environment: config.baseUrl,
          };
          
          console.log(`✅ Test Result:`, result);
          return null;
        },
      });

      // Handle test results
      on('after:run', (results) => {
        console.log('📈 Test Suite Complete:', {
          totalTests: results.totalTests,
          totalPassed: results.totalPassed,
          totalFailed: results.totalFailed,
          totalSkipped: results.totalSkipped,
          duration: results.totalDuration,
        });
        
        // Send results to monitoring service in production
        if (process.env.NODE_ENV === 'production') {
          // Implementation for sending results to your monitoring dashboard
        }
      });

      return config;
    },
  },
  
  component: {
    devServer: {
      framework: 'react',
      bundler: 'vite',
    },
    specPattern: 'cypress/component/**/*.cy.{js,jsx,ts,tsx}',
  },
});