/**
 * 🧪 CalistaLife.com - Comprehensive Testing Script for All Fixes
 * Tests manifest, images, API endpoints, and React component stability
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:3001';
const FRONTEND_URL = 'http://localhost:5174';

class ComprehensiveTestSuite {
  constructor() {
    this.results = {
      manifest: [],
      images: [],
      api: [],
      components: [],
      performance: [],
      errors: [],
      summary: {
        total: 0,
        passed: 0,
        failed: 0,
        warnings: 0
      }
    };
  }

  async runAllTests() {
    console.log('🚀 Starting Comprehensive Fix Validation\n');
    
    try {
      await this.testManifest();
      await this.testImageHandling();
      await this.testAPIEndpoints();
      await this.testComponentStability();
      await this.testPerformance();
      
      this.generateTestReport();
      
    } catch (error) {
      console.error('❌ Test suite failed:', error.message);
      this.results.errors.push({
        type: 'SUITE_ERROR',
        message: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }

  async testManifest() {
    console.log('📋 Testing Manifest Fix...');
    
    try {
      // Test manifest accessibility
      const response = await axios.get(`${FRONTEND_URL}/manifest.webmanifest`);
      
      if (response.status === 200) {
        this.addResult('manifest', 'Manifest file accessible', 'PASS');
        
        // Test manifest JSON validity
        try {
          const manifest = response.data;
          
          // Validate required fields
          const requiredFields = ['name', 'short_name', 'start_url', 'display'];
          const missingFields = requiredFields.filter(field => !manifest[field]);
          
          if (missingFields.length === 0) {
            this.addResult('manifest', 'All required fields present', 'PASS');
          } else {
            this.addResult('manifest', `Missing fields: ${missingFields.join(', ')}`, 'FAIL');
          }
          
          // Test icon paths
          if (manifest.icons && manifest.icons.length > 0) {
            let validIcons = 0;
            for (const icon of manifest.icons) {
              try {
                const iconResponse = await axios.get(`${FRONTEND_URL}${icon.src}`);
                if (iconResponse.status === 200) {
                  validIcons++;
                }
              } catch (iconError) {
                this.addResult('manifest', `Icon not found: ${icon.src}`, 'WARN');
              }
            }
            
            if (validIcons > 0) {
              this.addResult('manifest', `${validIcons}/${manifest.icons.length} icons accessible`, 'PASS');
            }
          }
          
        } catch (parseError) {
          this.addResult('manifest', 'Invalid JSON format', 'FAIL');
        }
      }
    } catch (error) {
      this.addResult('manifest', `Manifest not accessible: ${error.message}`, 'FAIL');
    }
  }

  async testImageHandling() {
    console.log('🖼️  Testing Image Handling Improvements...');
    
    // Test fallback image system
    const testUrls = [
      'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=600&h=600&q=80',
      'https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=600&h=600&q=80',
      'https://images.unsplash.com/invalid-photo-url?auto=format&fit=crop&w=600&h=600&q=80'
    ];
    
    let validImages = 0;
    for (const url of testUrls) {
      try {
        const response = await axios.head(url, { timeout: 5000 });
        if (response.status === 200) {
          validImages++;
        }
      } catch (error) {
        // Expected for invalid URLs
        if (url.includes('invalid-photo')) {
          this.addResult('images', 'Invalid image URL correctly fails', 'PASS');
        } else {
          this.addResult('images', `Image URL failed: ${url}`, 'WARN');
        }
      }
    }
    
    this.addResult('images', `${validImages}/${testUrls.length - 1} valid images accessible`, validImages > 0 ? 'PASS' : 'FAIL');
    
    // Test frontend accessibility
    try {
      const frontendResponse = await axios.get(FRONTEND_URL);
      if (frontendResponse.status === 200) {
        this.addResult('images', 'Frontend accessible for image testing', 'PASS');
      }
    } catch (error) {
      this.addResult('images', 'Frontend not accessible', 'FAIL');
    }
  }

  async testAPIEndpoints() {
    console.log('🔌 Testing API Endpoints...');
    
    try {
      // Test health endpoint
      const healthResponse = await axios.get(`${BASE_URL}/api/health`);
      if (healthResponse.status === 200) {
        this.addResult('api', 'Health endpoint working', 'PASS');
      }
    } catch (error) {
      this.addResult('api', 'Health endpoint failed', 'FAIL');
      return; // Skip other tests if backend is down
    }

    // Test products endpoint
    try {
      const productsResponse = await axios.get(`${BASE_URL}/api/products`);
      if (productsResponse.status === 200 && productsResponse.data.success) {
        this.addResult('api', 'Products API working', 'PASS');
        
        // Test quality fields in products
        const products = productsResponse.data.data;
        if (products && products.length > 0) {
          const sampleProduct = products[0];
          const qualityFields = [
            'fabric_composition', 'thread_count', 'fabric_weight',
            'durability_score', 'quality_grade', 'sustainability_rating'
          ];
          
          const presentFields = qualityFields.filter(field => 
            sampleProduct.hasOwnProperty(field) && sampleProduct[field] !== null
          );
          
          this.addResult('api', `Quality fields present: ${presentFields.length}/${qualityFields.length}`, 
            presentFields.length >= 4 ? 'PASS' : 'WARN');
        }
      }
    } catch (error) {
      this.addResult('api', `Products API failed: ${error.message}`, 'FAIL');
    }

    // Test reviews endpoint with proper productId
    try {
      // First get a product to test reviews
      const productsResponse = await axios.get(`${BASE_URL}/api/products`);
      if (productsResponse.data?.success && productsResponse.data.data.length > 0) {
        const testProductId = productsResponse.data.data[0].id;
        
        // Test reviews endpoint
        const reviewsResponse = await axios.get(`${BASE_URL}/api/reviews/${testProductId}?limit=10`);
        if (reviewsResponse.status === 200) {
          this.addResult('api', 'Reviews API working correctly', 'PASS');
        } else {
          this.addResult('api', `Reviews API returned status ${reviewsResponse.status}`, 'WARN');
        }
        
        // Test reviews summary
        const summaryResponse = await axios.get(`${BASE_URL}/api/reviews/summary/${testProductId}`);
        if (summaryResponse.status === 200) {
          this.addResult('api', 'Reviews summary API working', 'PASS');
        }
      }
    } catch (error) {
      this.addResult('api', `Reviews API failed: ${error.message}`, 'FAIL');
    }
  }

  async testComponentStability() {
    console.log('⚛️  Testing React Component Stability...');
    
    // Test if components exist and are properly structured
    const componentPaths = [
      'frontend/src/components/reviews/EnhancedProductReviews.tsx',
      'frontend/src/components/recommendations/ProductRecommendations.tsx',
      'frontend/src/components/ui/ErrorBoundary.tsx',
      'frontend/src/components/ui/ImageWithFallback.tsx'
    ];
    
    for (const componentPath of componentPaths) {
      const fullPath = path.join(__dirname, componentPath);
      if (fs.existsSync(fullPath)) {
        this.addResult('components', `Component exists: ${path.basename(componentPath)}`, 'PASS');
        
        // Basic syntax check
        try {
          const content = fs.readFileSync(fullPath, 'utf8');
          
          // Check for useCallback usage (prevents infinite loops)
          if (content.includes('useCallback')) {
            this.addResult('components', `useCallback implemented: ${path.basename(componentPath)}`, 'PASS');
          } else {
            this.addResult('components', `Missing useCallback: ${path.basename(componentPath)}`, 'WARN');
          }
          
          // Check for proper dependency arrays
          const useEffectMatches = content.match(/useEffect\([^,]+,\s*\[[^\]]*\]/g);
          if (useEffectMatches && useEffectMatches.length > 0) {
            this.addResult('components', `Dependency arrays present: ${path.basename(componentPath)}`, 'PASS');
          } else {
            this.addResult('components', `Missing dependency arrays: ${path.basename(componentPath)}`, 'WARN');
          }
          
        } catch (error) {
          this.addResult('components', `Error reading component: ${path.basename(componentPath)}`, 'FAIL');
        }
      } else {
        this.addResult('components', `Component missing: ${path.basename(componentPath)}`, 'FAIL');
      }
    }
  }

  async testPerformance() {
    console.log('⚡ Testing Performance Improvements...');
    
    try {
      // Test frontend load time
      const startTime = Date.now();
      const response = await axios.get(FRONTEND_URL);
      const loadTime = Date.now() - startTime;
      
      if (response.status === 200) {
        this.addResult('performance', `Frontend load time: ${loadTime}ms`, loadTime < 2000 ? 'PASS' : 'WARN');
      }
      
      // Test API response time
      const apiStartTime = Date.now();
      await axios.get(`${BASE_URL}/api/health`);
      const apiLoadTime = Date.now() - apiStartTime;
      
      this.addResult('performance', `API response time: ${apiLoadTime}ms`, apiLoadTime < 500 ? 'PASS' : 'WARN');
      
    } catch (error) {
      this.addResult('performance', `Performance test failed: ${error.message}`, 'FAIL');
    }
  }

  addResult(category, message, status) {
    const result = {
      message,
      status,
      timestamp: new Date().toISOString()
    };
    
    this.results[category].push(result);
    this.results.summary.total++;
    
    if (status === 'PASS') {
      this.results.summary.passed++;
      console.log(`  ✅ ${message}`);
    } else if (status === 'WARN') {
      this.results.summary.warnings++;
      console.log(`  ⚠️  ${message}`);
    } else {
      this.results.summary.failed++;
      console.log(`  ❌ ${message}`);
    }
  }

  generateTestReport() {
    console.log('\n📊 COMPREHENSIVE TEST RESULTS');
    console.log('='.repeat(50));
    
    const categories = ['manifest', 'images', 'api', 'components', 'performance'];
    
    categories.forEach(category => {
      if (this.results[category].length > 0) {
        console.log(`\n${category.toUpperCase()}:`);
        this.results[category].forEach(result => {
          const icon = result.status === 'PASS' ? '✅' : 
                      result.status === 'WARN' ? '⚠️' : '❌';
          console.log(`  ${icon} ${result.message}`);
        });
      }
    });
    
    // Summary
    console.log('\n📈 TEST SUMMARY:');
    console.log(`Total Tests: ${this.results.summary.total}`);
    console.log(`✅ Passed: ${this.results.summary.passed}`);
    console.log(`⚠️  Warnings: ${this.results.summary.warnings}`);
    console.log(`❌ Failed: ${this.results.summary.failed}`);
    
    const passRate = ((this.results.summary.passed / this.results.summary.total) * 100).toFixed(1);
    console.log(`📊 Pass Rate: ${passRate}%`);
    
    // Overall status
    if (this.results.summary.failed === 0) {
      if (this.results.summary.warnings === 0) {
        console.log('\n🎉 ALL TESTS PASSED! System is production ready.');
      } else {
        console.log('\n✨ All critical tests passed with minor warnings.');
      }
    } else {
      console.log('\n🔧 Some tests failed. Review issues before deployment.');
    }
    
    // Next steps
    console.log('\n🎯 NEXT STEPS:');
    if (this.results.summary.failed === 0) {
      console.log('1. ✅ All fixes validated successfully');
      console.log('2. 🚀 System ready for production deployment');
      console.log('3. 📧 Test order confirmation email manually');
      console.log('4. 📱 Verify mobile responsiveness');
      console.log('5. 🔍 Run final quality assurance checks');
    } else {
      console.log('1. 🔧 Fix failing tests before deployment');
      console.log('2. ⚠️  Address warnings for optimal performance');
      console.log('3. 🔄 Re-run tests after fixes');
    }
    
    // Save detailed results
    const reportData = {
      timestamp: new Date().toISOString(),
      results: this.results,
      environment: {
        frontend: FRONTEND_URL,
        backend: BASE_URL,
        node_version: process.version
      }
    };
    
    const reportPath = path.join(__dirname, 'test-results.json');
    fs.writeFileSync(reportPath, JSON.stringify(reportData, null, 2));
    console.log(`\n💾 Detailed test results saved to: ${reportPath}`);
  }
}

// Run tests if script is executed directly
if (require.main === module) {
  const testSuite = new ComprehensiveTestSuite();
  testSuite.runAllTests().catch(console.error);
}

module.exports = ComprehensiveTestSuite;