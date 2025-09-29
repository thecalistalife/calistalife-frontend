// Analytics event testing and verification utilities
import { analytics } from './analytics';
import { utmTracker } from './utm-tracker';
import { marketingCampaigns } from './marketing-campaigns';

interface EventTestResult {
  event_name: string;
  platform: string;
  success: boolean;
  timestamp: number;
  error?: string;
  data?: any;
}

interface CampaignTestResult {
  test_name: string;
  success: boolean;
  details: string;
  timestamp: number;
  events_fired: EventTestResult[];
}

class AnalyticsTesting {
  private testResults: EventTestResult[] = [];
  private isDebugMode = true;

  constructor() {
    this.setupTestEventListeners();
  }

  // Setup event listeners for testing analytics events
  private setupTestEventListeners() {
    if (typeof window === 'undefined') return;

    // Monitor GA4 events
    const originalGtag = window.gtag;
    window.gtag = (...args: any[]) => {
      this.recordEventTest('GA4', args[0], args[1], args[2], true);
      if (originalGtag) {
        return originalGtag(...args);
      }
    };

    // Monitor Facebook Pixel events
    const originalFbq = window.fbq;
    window.fbq = (...args: any[]) => {
      this.recordEventTest('Facebook Pixel', args[0], args[1], args[2], true);
      if (originalFbq) {
        return originalFbq(...args);
      }
    };
  }

  // Record test event result
  private recordEventTest(platform: string, eventType: string, eventName: string, data: any, success: boolean, error?: string) {
    const result: EventTestResult = {
      event_name: `${eventType}:${eventName}`,
      platform,
      success,
      timestamp: Date.now(),
      data,
      error,
    };

    this.testResults.push(result);

    if (this.isDebugMode) {
      console.log(`🧪 Analytics Test: ${platform} - ${eventType}:${eventName}`, {
        success,
        data,
        error,
      });
    }
  }

  // Test product view event
  async testProductView(): Promise<CampaignTestResult> {
    const testProduct = {
      id: 'test_product_001',
      name: 'Premium Quality Test Dress',
      category: 'Dresses',
      price: 149.99,
      brand: 'TheCalista',
      quality_grade: 'Premium',
      sustainability_rating: 'A+',
    };

    const startTime = Date.now();
    const eventsBefore = this.testResults.length;

    try {
      // Trigger product view event
      analytics.trackProductView(testProduct);

      // Wait for events to fire
      await this.waitForEvents(2); // GA4 + Facebook Pixel

      const newEvents = this.testResults.slice(eventsBefore);
      const success = newEvents.length >= 2 && newEvents.every(event => event.success);

      return {
        test_name: 'Product View Event',
        success,
        details: success 
          ? `Successfully fired ${newEvents.length} events`
          : `Expected 2+ events, got ${newEvents.length}`,
        timestamp: startTime,
        events_fired: newEvents,
      };
    } catch (error) {
      return {
        test_name: 'Product View Event',
        success: false,
        details: `Error: ${error}`,
        timestamp: startTime,
        events_fired: [],
      };
    }
  }

  // Test add to cart event
  async testAddToCart(): Promise<CampaignTestResult> {
    const testProduct = {
      item_id: 'test_product_002',
      item_name: 'Premium Quality Test Blouse',
      category: 'Tops',
      quantity: 1,
      price: 89.99,
      currency: 'USD',
      item_brand: 'TheCalista',
      item_variant: 'Premium',
    };

    const startTime = Date.now();
    const eventsBefore = this.testResults.length;

    try {
      analytics.trackAddToCart(testProduct);
      await this.waitForEvents(2);

      const newEvents = this.testResults.slice(eventsBefore);
      const success = newEvents.length >= 2 && newEvents.every(event => event.success);

      return {
        test_name: 'Add to Cart Event',
        success,
        details: success 
          ? `Successfully fired ${newEvents.length} events`
          : `Expected 2+ events, got ${newEvents.length}`,
        timestamp: startTime,
        events_fired: newEvents,
      };
    } catch (error) {
      return {
        test_name: 'Add to Cart Event',
        success: false,
        details: `Error: ${error}`,
        timestamp: startTime,
        events_fired: [],
      };
    }
  }

  // Test purchase event
  async testPurchase(): Promise<CampaignTestResult> {
    const testPurchase = {
      transaction_id: `test_order_${Date.now()}`,
      value: 239.98,
      currency: 'USD',
      items: [
        {
          item_id: 'test_product_001',
          item_name: 'Premium Quality Test Dress',
          category: 'Dresses',
          quantity: 1,
          price: 149.99,
          currency: 'USD',
          item_brand: 'TheCalista',
          item_variant: 'Premium',
        },
        {
          item_id: 'test_product_002',
          item_name: 'Premium Quality Test Blouse',
          category: 'Tops',
          quantity: 1,
          price: 89.99,
          currency: 'USD',
          item_brand: 'TheCalista',
          item_variant: 'Premium',
        }
      ],
      shipping: 0,
      tax: 19.20,
    };

    const startTime = Date.now();
    const eventsBefore = this.testResults.length;

    try {
      analytics.trackPurchase(testPurchase);
      await this.waitForEvents(3); // GA4 + Facebook Pixel + Google Ads

      const newEvents = this.testResults.slice(eventsBefore);
      const success = newEvents.length >= 3 && newEvents.every(event => event.success);

      return {
        test_name: 'Purchase Event',
        success,
        details: success 
          ? `Successfully fired ${newEvents.length} events including conversion tracking`
          : `Expected 3+ events, got ${newEvents.length}`,
        timestamp: startTime,
        events_fired: newEvents,
      };
    } catch (error) {
      return {
        test_name: 'Purchase Event',
        success: false,
        details: `Error: ${error}`,
        timestamp: startTime,
        events_fired: [],
      };
    }
  }

  // Test UTM parameter recognition
  async testUTMTracking(): Promise<CampaignTestResult> {
    const testUrl = '?utm_source=instagram&utm_medium=social&utm_campaign=quality_spring_2024&utm_content=influencer_sarah&utm_term=premium_dress';
    
    const startTime = Date.now();

    try {
      // Simulate URL change with UTM parameters
      const originalUrl = window.location.search;
      Object.defineProperty(window, 'location', {
        value: {
          ...window.location,
          search: testUrl,
        },
        writable: true,
      });

      // Create new UTM tracker instance to test
      const testTracker = new (utmTracker.constructor as any)();
      await new Promise(resolve => setTimeout(resolve, 100)); // Allow initialization

      const attribution = testTracker.getAttribution();
      const performance = testTracker.getCampaignPerformance();

      // Restore original URL
      Object.defineProperty(window, 'location', {
        value: {
          ...window.location,
          search: originalUrl,
        },
        writable: true,
      });

      const success = attribution && attribution.source === 'instagram' && attribution.campaign === 'quality_spring_2024';

      return {
        test_name: 'UTM Parameter Tracking',
        success,
        details: success 
          ? `Successfully tracked UTM parameters: ${attribution?.source}/${attribution?.medium}/${attribution?.campaign}`
          : `Failed to track UTM parameters: ${JSON.stringify(attribution)}`,
        timestamp: startTime,
        events_fired: [],
      };
    } catch (error) {
      return {
        test_name: 'UTM Parameter Tracking',
        success: false,
        details: `Error: ${error}`,
        timestamp: startTime,
        events_fired: [],
      };
    }
  }

  // Test influencer code recognition
  async testInfluencerTracking(): Promise<CampaignTestResult> {
    const testUrl = '?ref=SARAH2024';
    
    const startTime = Date.now();
    const eventsBefore = this.testResults.length;

    try {
      // Simulate URL with influencer code
      const originalUrl = window.location.search;
      Object.defineProperty(window, 'location', {
        value: {
          ...window.location,
          search: testUrl,
        },
        writable: true,
      });

      // Create new UTM tracker instance to test
      const testTracker = new (utmTracker.constructor as any)();
      await new Promise(resolve => setTimeout(resolve, 100));

      const influencerAttribution = testTracker.getInfluencerAttribution();

      // Restore original URL
      Object.defineProperty(window, 'location', {
        value: {
          ...window.location,
          search: originalUrl,
        },
        writable: true,
      });

      const newEvents = this.testResults.slice(eventsBefore);
      const success = influencerAttribution && influencerAttribution.influencer_id === 'inf_sarah_johnson';

      return {
        test_name: 'Influencer Code Tracking',
        success,
        details: success 
          ? `Successfully tracked influencer: ${influencerAttribution?.influencer_name} (${influencerAttribution?.platform})`
          : `Failed to track influencer code: ${JSON.stringify(influencerAttribution)}`,
        timestamp: startTime,
        events_fired: newEvents,
      };
    } catch (error) {
      return {
        test_name: 'Influencer Code Tracking',
        success: false,
        details: `Error: ${error}`,
        timestamp: startTime,
        events_fired: [],
      };
    }
  }

  // Test email automation triggers
  async testEmailAutomation(): Promise<CampaignTestResult> {
    const testEmail = 'test@calista-campaigns.com';
    const testUserData = {
      firstName: 'Test',
      lastName: 'User',
      preferences: ['quality', 'sustainable'],
    };

    const startTime = Date.now();

    try {
      // Test welcome email (will not actually send in test mode)
      const result = await marketingCampaigns.sendWelcomeEmail(testEmail, testUserData);

      return {
        test_name: 'Email Automation Trigger',
        success: !!result,
        details: result 
          ? 'Email automation trigger successful (test mode)'
          : 'Email automation trigger failed',
        timestamp: startTime,
        events_fired: [],
      };
    } catch (error) {
      return {
        test_name: 'Email Automation Trigger',
        success: false,
        details: `Error: ${error}`,
        timestamp: startTime,
        events_fired: [],
      };
    }
  }

  // Run comprehensive analytics test suite
  async runFullTestSuite(): Promise<{
    overall_success: boolean;
    total_tests: number;
    passed_tests: number;
    test_results: CampaignTestResult[];
    summary: string;
  }> {
    console.log('🧪 Running comprehensive analytics test suite...');

    const tests = [
      () => this.testProductView(),
      () => this.testAddToCart(),
      () => this.testPurchase(),
      () => this.testUTMTracking(),
      () => this.testInfluencerTracking(),
      () => this.testEmailAutomation(),
    ];

    const results: CampaignTestResult[] = [];

    for (const test of tests) {
      try {
        const result = await test();
        results.push(result);
        
        // Small delay between tests
        await new Promise(resolve => setTimeout(resolve, 200));
      } catch (error) {
        results.push({
          test_name: 'Unknown Test',
          success: false,
          details: `Test execution error: ${error}`,
          timestamp: Date.now(),
          events_fired: [],
        });
      }
    }

    const passedTests = results.filter(r => r.success).length;
    const totalTests = results.length;
    const overallSuccess = passedTests === totalTests;

    const summary = `Analytics Test Suite: ${passedTests}/${totalTests} tests passed. ${
      overallSuccess ? '✅ All systems operational' : '❌ Issues detected'
    }`;

    console.log(summary);

    return {
      overall_success: overallSuccess,
      total_tests: totalTests,
      passed_tests: passedTests,
      test_results: results,
      summary,
    };
  }

  // Wait for events to be fired
  private async waitForEvents(expectedCount: number, timeout: number = 1000): Promise<void> {
    const startCount = this.testResults.length;
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      if (this.testResults.length >= startCount + expectedCount) {
        return;
      }
      await new Promise(resolve => setTimeout(resolve, 50));
    }
  }

  // Get recent test results
  getTestResults(limit: number = 20): EventTestResult[] {
    return this.testResults.slice(-limit);
  }

  // Clear test results
  clearTestResults(): void {
    this.testResults = [];
  }

  // Generate test report
  generateTestReport(): string {
    const recentResults = this.getTestResults(50);
    const platformStats = this.getTestStatsByPlatform(recentResults);
    const successRate = recentResults.length > 0 ? 
      (recentResults.filter(r => r.success).length / recentResults.length * 100).toFixed(1) : '0';

    return `
📊 Analytics Testing Report
==========================
Overall Success Rate: ${successRate}%
Total Events Tested: ${recentResults.length}

Platform Breakdown:
${Object.entries(platformStats).map(([platform, stats]) => 
  `  ${platform}: ${stats.success}/${stats.total} (${((stats.success / stats.total) * 100).toFixed(1)}%)`
).join('\n')}

Recent Test Results:
${recentResults.slice(-10).map(result => 
  `  ${result.success ? '✅' : '❌'} ${result.platform} - ${result.event_name}`
).join('\n')}
`;
  }

  // Get test statistics by platform
  private getTestStatsByPlatform(results: EventTestResult[]): Record<string, { total: number; success: number }> {
    return results.reduce((stats, result) => {
      if (!stats[result.platform]) {
        stats[result.platform] = { total: 0, success: 0 };
      }
      stats[result.platform].total++;
      if (result.success) {
        stats[result.platform].success++;
      }
      return stats;
    }, {} as Record<string, { total: number; success: number }>);
  }
}

// Create singleton instance
export const analyticsTesting = new AnalyticsTesting();

// React hook for analytics testing
export const useAnalyticsTesting = () => {
  return {
    runFullTestSuite: analyticsTesting.runFullTestSuite.bind(analyticsTesting),
    testProductView: analyticsTesting.testProductView.bind(analyticsTesting),
    testAddToCart: analyticsTesting.testAddToCart.bind(analyticsTesting),
    testPurchase: analyticsTesting.testPurchase.bind(analyticsTesting),
    getTestResults: analyticsTesting.getTestResults.bind(analyticsTesting),
    generateTestReport: analyticsTesting.generateTestReport.bind(analyticsTesting),
    clearTestResults: analyticsTesting.clearTestResults.bind(analyticsTesting),
  };
};

export default analyticsTesting;