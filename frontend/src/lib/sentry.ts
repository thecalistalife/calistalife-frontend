import * as Sentry from '@sentry/react';
import { BrowserTracing } from '@sentry/tracing';

// Sentry configuration for CalistaLife.com
export const initSentry = () => {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN, // Add to .env files
    environment: import.meta.env.PROD ? 'production' : 'development',
    
    // Performance Monitoring
    integrations: [
      new BrowserTracing({
        // Track page loads and navigation
        routingInstrumentation: Sentry.reactRouterV6Instrumentation(
          React.useEffect,
          useLocation,
          useNavigationType,
          createRoutesFromChildren,
          matchRoutes
        ),
        
        // Track specific user interactions
        tracingOrigins: [
          'localhost',
          /^https:\/\/api\.thecalista\.com/,
          /^https:\/\/thecalista\.com/,
          /^https:\/\/.*\.thecalista\.com/
        ],
        
        // Custom performance tracking
        beforeNavigate: context => ({
          ...context,
          tags: {
            section: 'navigation',
            userType: localStorage.getItem('auth_token') ? 'authenticated' : 'anonymous'
          }
        }),
      }),
      
      // Track errors in specific contexts
      new Sentry.Replay({
        // Capture replays on errors and performance issues
        maskAllInputs: true,
        blockAllMedia: false,
      }),
    ],

    // Performance monitoring sampling
    tracesSampleRate: import.meta.env.PROD ? 0.1 : 1.0, // 10% in prod, 100% in dev
    
    // Session replay sampling
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,

    // Error filtering and context
    beforeSend(event, hint) {
      // Filter out development errors
      if (import.meta.env.DEV) {
        console.group('🚨 Sentry Error Report');
        console.error('Event:', event);
        console.error('Hint:', hint);
        console.groupEnd();
      }

      // Filter out specific errors
      const error = hint.originalException;
      if (error && error.message) {
        // Ignore network errors from ad blockers
        if (error.message.includes('blocked:CSP') || 
            error.message.includes('Non-Error promise rejection')) {
          return null;
        }

        // Ignore cancelled requests
        if (error.name === 'AbortError' || error.message.includes('cancelled')) {
          return null;
        }
      }

      // Add custom context
      event.tags = {
        ...event.tags,
        component: 'frontend',
        section: window.location.pathname.split('/')[1] || 'home',
      };

      return event;
    },

    // Add user context
    initialScope: {
      tags: {
        component: 'frontend',
        version: import.meta.env.VITE_APP_VERSION || '1.0.0',
      },
    },
  });

  // Set user context when available
  const updateUserContext = () => {
    const token = localStorage.getItem('auth_token');
    const userString = localStorage.getItem('user');
    
    Sentry.setUser(token ? {
      id: userString ? JSON.parse(userString).id : 'authenticated',
      email: userString ? JSON.parse(userString).email : undefined,
    } : null);
  };

  // Update user context on auth changes
  updateUserContext();
  window.addEventListener('storage', updateUserContext);
};

// Custom error reporting functions
export const reportError = (error: Error, context?: Record<string, any>) => {
  Sentry.withScope(scope => {
    if (context) {
      scope.setContext('custom', context);
    }
    Sentry.captureException(error);
  });
};

export const reportMessage = (message: string, level: 'info' | 'warning' | 'error' = 'info', context?: Record<string, any>) => {
  Sentry.withScope(scope => {
    if (context) {
      scope.setContext('custom', context);
    }
    Sentry.captureMessage(message, level);
  });
};

// Performance tracking helpers
export const trackPerformance = (name: string, operation: () => Promise<any>) => {
  const transaction = Sentry.startTransaction({ name, op: 'custom' });
  
  return operation()
    .then(result => {
      transaction.setStatus('ok');
      return result;
    })
    .catch(error => {
      transaction.setStatus('internal_error');
      throw error;
    })
    .finally(() => {
      transaction.finish();
    });
};

// API call tracking
export const trackAPICall = (url: string, method: string = 'GET') => {
  return Sentry.startTransaction({
    name: `API ${method} ${url}`,
    op: 'http.client',
    tags: {
      'http.method': method,
      'http.url': url,
    },
  });
};

// E-commerce specific tracking
export const trackEcommerce = (event: string, data: Record<string, any>) => {
  Sentry.addBreadcrumb({
    category: 'ecommerce',
    message: event,
    level: 'info',
    data,
    timestamp: Date.now() / 1000,
  });
  
  // Also send as custom event
  Sentry.withScope(scope => {
    scope.setTag('eventType', 'ecommerce');
    scope.setContext('ecommerce', data);
    Sentry.captureMessage(`E-commerce: ${event}`, 'info');
  });
};

// Image loading error tracking
export const trackImageError = (src: string, fallbackUsed: boolean = false) => {
  Sentry.withScope(scope => {
    scope.setTag('errorType', 'imageLoad');
    scope.setContext('imageError', {
      originalSrc: src,
      fallbackUsed,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
    });
    Sentry.captureMessage(`Image load failed: ${src}`, 'warning');
  });
};

// Review system error tracking
export const trackReviewError = (productId: string, error: Error, context?: Record<string, any>) => {
  Sentry.withScope(scope => {
    scope.setTag('errorType', 'reviewSystem');
    scope.setContext('reviewError', {
      productId,
      ...context,
    });
    Sentry.captureException(error);
  });
};

export default Sentry;