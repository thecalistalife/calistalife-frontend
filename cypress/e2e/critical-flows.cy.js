// Critical user flows testing for CalistaLife.com
// These tests run hourly to ensure core functionality is working

describe('Critical User Flows - CalistaLife.com', () => {
  let testStartTime;

  beforeEach(() => {
    testStartTime = Date.now();
    
    // Set up performance monitoring
    cy.window().then((win) => {
      win.cypressStartTime = Date.now();
    });
    
    // Visit homepage and wait for initial load
    cy.visit('/', { timeout: 10000 });
    cy.wait(1000); // Allow for initial render
  });

  afterEach(function() {
    const testDuration = Date.now() - testStartTime;
    
    // Log test performance
    cy.task('logTestResult', {
      suite: this.currentTest.parent.title,
      test: this.currentTest.title,
      status: this.currentTest.state,
      duration: testDuration,
      screenshot: this.currentTest.state === 'failed' ? 'available' : null,
    });
  });

  context('Homepage and Product Browsing', () => {
    it('should load homepage within performance threshold', () => {
      // Check page load performance
      cy.window().then((win) => {
        const loadTime = Date.now() - win.cypressStartTime;
        
        // Log performance metric
        cy.task('logMetric', {
          name: 'homepage_load_time',
          value: loadTime,
          metadata: { test: 'homepage_load', url: win.location.href }
        });
        
        // Assert performance threshold (2 seconds)
        expect(loadTime).to.be.lessThan(2000);
      });

      // Check essential elements are visible
      cy.get('header').should('be.visible');
      cy.get('nav').should('be.visible');
      cy.get('main').should('be.visible');
      cy.get('footer').should('be.visible');
      
      // Check product grid loads
      cy.get('[data-testid="product-grid"]', { timeout: 5000 }).should('be.visible');
      cy.get('[data-testid="product-card"]').should('have.length.greaterThan', 0);
    });

    it('should display products with images and quality information', () => {
      // Wait for products to load
      cy.get('[data-testid="product-card"]').first().within(() => {
        // Check product image loads
        cy.get('img').should('be.visible').and(($img) => {
          expect($img[0].naturalWidth).to.be.greaterThan(0);
        });
        
        // Check product details are present
        cy.get('[data-testid="product-name"]').should('be.visible');
        cy.get('[data-testid="product-price"]').should('be.visible');
        
        // Check quality badges
        cy.get('[data-testid="quality-badge"]').should('exist');
        cy.get('[data-testid="sustainability-badge"]').should('exist');
      });
    });

    it('should navigate to product details page', () => {
      // Click on first product
      cy.get('[data-testid="product-card"]').first().click();
      
      // Check URL changed to product page
      cy.url().should('include', '/product/');
      
      // Check product details page loads
      cy.get('[data-testid="product-title"]').should('be.visible');
      cy.get('[data-testid="product-price"]').should('be.visible');
      cy.get('[data-testid="product-images"]').should('be.visible');
      cy.get('[data-testid="quality-information"]').should('be.visible');
      
      // Check add to cart button is present
      cy.get('[data-testid="add-to-cart-btn"]').should('be.visible');
    });
  });

  context('Product Reviews System', () => {
    it('should load and display reviews', () => {
      // Navigate to a product page
      cy.visit('/product/cc5f24d2-4fdf-4f21-9063-5328e5eab01f'); // Monochrome Hoodie
      
      // Check reviews section loads
      cy.get('[data-testid="reviews-section"]', { timeout: 8000 }).should('be.visible');
      
      // Check review summary
      cy.get('[data-testid="review-summary"]').within(() => {
        cy.get('[data-testid="average-rating"]').should('be.visible');
        cy.get('[data-testid="total-reviews"]').should('be.visible');
      });
      
      // Check individual reviews load (if any exist)
      cy.get('body').then(($body) => {
        if ($body.find('[data-testid="review-item"]').length > 0) {
          cy.get('[data-testid="review-item"]').first().within(() => {
            cy.get('[data-testid="reviewer-name"]').should('be.visible');
            cy.get('[data-testid="review-rating"]').should('be.visible');
            cy.get('[data-testid="review-text"]').should('be.visible');
          });
        }
      });
    });

    it('should allow submitting a new review', () => {
      cy.visit('/product/cc5f24d2-4fdf-4f21-9063-5328e5eab01f');
      
      // Click write review button
      cy.get('[data-testid="write-review-btn"]').click();
      
      // Fill out review form
      cy.get('[data-testid="reviewer-name"]').type('Cypress Test User');
      cy.get('[data-testid="reviewer-email"]').type('cypress@test.com');
      cy.get('[data-testid="review-title"]').type('Great product quality!');
      cy.get('[data-testid="review-text"]').type('This product exceeded my expectations. The fabric quality is excellent and matches the description perfectly.');
      
      // Set ratings
      cy.get('[data-testid="overall-rating"] select').select('5');
      cy.get('[data-testid="quality-rating"] select').select('5');
      cy.get('[data-testid="comfort-rating"] select').select('4');
      
      // Submit review
      cy.get('[data-testid="submit-review-btn"]').click();
      
      // Check success message or review appears
      cy.get('[data-testid="review-success"]').should('be.visible');
    });
  });

  context('Shopping Cart Functionality', () => {
    it('should add product to cart and proceed to checkout', () => {
      // Navigate to product page
      cy.visit('/product/cc5f24d2-4fdf-4f21-9063-5328e5eab01f');
      
      // Select size and color if available
      cy.get('body').then(($body) => {
        if ($body.find('[data-testid="size-selector"]').length > 0) {
          cy.get('[data-testid="size-selector"]').select('M');
        }
        if ($body.find('[data-testid="color-selector"]').length > 0) {
          cy.get('[data-testid="color-selector"]').first().click();
        }
      });
      
      // Add to cart
      cy.get('[data-testid="add-to-cart-btn"]').click();
      
      // Check cart counter updates
      cy.get('[data-testid="cart-counter"]').should('contain', '1');
      
      // Go to cart
      cy.get('[data-testid="cart-link"]').click();
      
      // Verify item in cart
      cy.get('[data-testid="cart-item"]').should('have.length', 1);
      cy.get('[data-testid="cart-total"]').should('be.visible');
      
      // Proceed to checkout
      cy.get('[data-testid="checkout-btn"]').click();
      
      // Check checkout page loads
      cy.url().should('include', '/checkout');
      cy.get('[data-testid="checkout-form"]').should('be.visible');
    });

    it('should complete checkout process', () => {
      // Add item to cart first
      cy.visit('/product/cc5f24d2-4fdf-4f21-9063-5328e5eab01f');
      cy.get('[data-testid="add-to-cart-btn"]').click();
      cy.get('[data-testid="cart-link"]').click();
      cy.get('[data-testid="checkout-btn"]').click();
      
      // Fill checkout form
      cy.get('[data-testid="customer-name"]').type('Cypress Test Customer');
      cy.get('[data-testid="customer-email"]').type('cypress@test.com');
      cy.get('[data-testid="customer-phone"]').type('+1234567890');
      
      // Address fields
      cy.get('[data-testid="address-line1"]').type('123 Test Street');
      cy.get('[data-testid="address-city"]').type('Test City');
      cy.get('[data-testid="address-postal"]').type('12345');
      
      // Submit order (in test mode)
      cy.get('[data-testid="place-order-btn"]').click();
      
      // Check order confirmation
      cy.get('[data-testid="order-confirmation"]', { timeout: 10000 }).should('be.visible');
      cy.get('[data-testid="order-number"]').should('be.visible');
    });
  });

  context('Admin System Health Check', () => {
    it('should access admin panel and verify core functions', () => {
      // Visit admin login page
      cy.visit(Cypress.env('ADMIN_URL'));
      
      // Check login form is present
      cy.get('[data-testid="admin-login-form"]').should('be.visible');
      
      // Note: In production, you might want to skip actual login for security
      // This is just to verify the admin panel is accessible
      cy.get('[data-testid="admin-email"]').should('be.visible');
      cy.get('[data-testid="admin-password"]').should('be.visible');
      cy.get('[data-testid="admin-login-btn"]').should('be.visible');
    });
  });

  context('Performance and Error Monitoring', () => {
    it('should not have JavaScript errors', () => {
      // Listen for uncaught exceptions
      cy.window().then((win) => {
        cy.stub(win.console, 'error').as('consoleError');
      });
      
      // Navigate through key pages
      cy.visit('/');
      cy.visit('/collections');
      cy.visit('/product/cc5f24d2-4fdf-4f21-9063-5328e5eab01f');
      
      // Check for errors
      cy.get('@consoleError').should('not.have.been.called');
    });

    it('should meet Core Web Vitals thresholds', () => {
      cy.visit('/', { timeout: 10000 });
      
      // Wait for page to fully load
      cy.wait(3000);
      
      // Check web vitals using browser performance API
      cy.window().then((win) => {
        // Check for performance entries
        const perfEntries = win.performance.getEntriesByType('navigation')[0];
        
        if (perfEntries) {
          const loadTime = perfEntries.loadEventEnd - perfEntries.fetchStart;
          const firstPaint = win.performance.getEntriesByName('first-paint')[0]?.startTime || 0;
          
          // Log metrics
          cy.task('logMetric', {
            name: 'page_load_complete',
            value: loadTime,
            metadata: { 
              firstPaint,
              domContentLoaded: perfEntries.domContentLoadedEventEnd - perfEntries.fetchStart,
              url: win.location.href
            }
          });
          
          // Assert performance thresholds
          expect(loadTime).to.be.lessThan(3000, 'Page load should be under 3 seconds');
          if (firstPaint > 0) {
            expect(firstPaint).to.be.lessThan(1000, 'First paint should be under 1 second');
          }
        }
      });
    });

    it('should have working image fallbacks', () => {
      cy.visit('/');
      
      // Check all images load or have fallback
      cy.get('img').each(($img) => {
        // Check if image loaded successfully or has fallback
        cy.wrap($img).should('satisfy', (img) => {
          return img[0].complete && img[0].naturalHeight !== 0 || 
                 img[0].src.includes('placeholder') ||
                 img[0].alt.includes('fallback');
        });
      });
    });
  });

  context('Mobile Responsiveness', () => {
    it('should work properly on mobile viewport', () => {
      // Set mobile viewport
      cy.viewport('iphone-x');
      
      // Visit homepage
      cy.visit('/');
      
      // Check mobile navigation
      cy.get('[data-testid="mobile-menu-btn"]').should('be.visible').click();
      cy.get('[data-testid="mobile-menu"]').should('be.visible');
      
      // Check products display properly
      cy.get('[data-testid="product-grid"]').should('be.visible');
      cy.get('[data-testid="product-card"]').should('be.visible');
      
      // Test mobile product page
      cy.get('[data-testid="product-card"]').first().click();
      cy.get('[data-testid="product-title"]').should('be.visible');
      
      // Test mobile cart
      cy.get('[data-testid="add-to-cart-btn"]').click();
      cy.get('[data-testid="cart-counter"]').should('contain', '1');
    });
  });
});

// API Health Check Tests
describe('API Health and Performance', () => {
  it('should verify API endpoints are responding', () => {
    const apiUrl = Cypress.env('API_URL');
    
    // Health check
    cy.request({
      url: `${apiUrl}/api/health`,
      timeout: 5000,
    }).then((response) => {
      expect(response.status).to.eq(200);
      expect(response.body).to.have.property('success', true);
    });
    
    // Products API
    cy.request({
      url: `${apiUrl}/api/products`,
      timeout: 10000,
    }).then((response) => {
      expect(response.status).to.eq(200);
      expect(response.body).to.have.property('success', true);
      expect(response.body.data).to.be.an('array');
      expect(response.body.data.length).to.be.greaterThan(0);
    });
  });

  it('should verify API response times', () => {
    const startTime = Date.now();
    const apiUrl = Cypress.env('API_URL');
    
    cy.request(`${apiUrl}/api/products`).then(() => {
      const responseTime = Date.now() - startTime;
      
      cy.task('logMetric', {
        name: 'api_response_time',
        value: responseTime,
        metadata: { endpoint: '/api/products', method: 'GET' }
      });
      
      // Assert API response time threshold (500ms)
      expect(responseTime).to.be.lessThan(500);
    });
  });
});