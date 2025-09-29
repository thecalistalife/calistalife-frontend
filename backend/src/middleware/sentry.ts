import * as Sentry from '@sentry/node';
import * as Tracing from '@sentry/tracing';
import { Request, Response, NextFunction } from 'express';

// Initialize Sentry for backend
export const initSentry = (app: any) => {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || 'development',
    
    // Performance Monitoring
    integrations: [
      new Sentry.Integrations.Http({ tracing: true }),
      new Tracing.Integrations.Express({ app }),
      new Tracing.Integrations.Postgres(),
      new Tracing.Integrations.Mysql(),
    ],
    
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    
    // Filter and enhance errors
    beforeSend(event, hint) {
      // Add custom context for API errors
      if (event.request) {
        event.tags = {
          ...event.tags,
          component: 'backend',
          endpoint: event.request.url,
          method: event.request.method,
        };
      }
      
      // Filter out health check errors in production
      if (process.env.NODE_ENV === 'production') {
        if (event.request?.url?.includes('/health') || 
            event.request?.url?.includes('/status')) {
          return null;
        }
      }
      
      return event;
    },
    
    initialScope: {
      tags: {
        component: 'backend',
        version: process.env.npm_package_version || '1.0.0',
      },
    },
  });

  // Request tracing middleware
  app.use(Sentry.Handlers.requestHandler());
  app.use(Sentry.Handlers.tracingHandler());
  
  return Sentry;
};

// Error handler middleware (should be last)
export const sentryErrorHandler = Sentry.Handlers.errorHandler({
  shouldHandleError(error) {
    // Send all errors to Sentry in development
    if (process.env.NODE_ENV === 'development') {
      return true;
    }
    
    // In production, only send 4xx and 5xx errors
    const status = error.status || error.statusCode || 500;
    return status >= 400;
  },
});

// Custom error tracking functions
export const reportBackendError = (error: Error, context?: {
  userId?: string;
  endpoint?: string;
  method?: string;
  ip?: string;
  userAgent?: string;
  requestBody?: any;
}) => {
  Sentry.withScope(scope => {
    if (context) {
      // Set user context
      if (context.userId) {
        scope.setUser({ id: context.userId });
      }
      
      // Set request context
      scope.setContext('request', {
        endpoint: context.endpoint,
        method: context.method,
        ip: context.ip,
        userAgent: context.userAgent,
        body: context.requestBody,
      });
    }
    
    Sentry.captureException(error);
  });
};

// API endpoint performance tracking
export const trackAPIPerformance = (endpoint: string, method: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const transaction = Sentry.startTransaction({
      op: 'http.server',
      name: `${method} ${endpoint}`,
      tags: {
        endpoint,
        method,
        component: 'api',
      },
    });
    
    // Add transaction to request for later use
    (req as any).sentryTransaction = transaction;
    
    // Track response time
    const startTime = Date.now();
    
    const originalSend = res.send;
    res.send = function(data) {
      const duration = Date.now() - startTime;
      
      // Set transaction status based on response
      if (res.statusCode >= 200 && res.statusCode < 300) {
        transaction.setStatus('ok');
      } else if (res.statusCode >= 400) {
        transaction.setStatus('invalid_argument');
      } else if (res.statusCode >= 500) {
        transaction.setStatus('internal_error');
      }
      
      // Add performance data
      transaction.setData('response_time', duration);
      transaction.setData('status_code', res.statusCode);
      transaction.setData('response_size', data ? data.length : 0);
      
      transaction.finish();
      
      return originalSend.call(this, data);
    };
    
    next();
  };
};

// Database operation tracking
export const trackDatabaseOperation = (operation: string, table: string) => {
  const transaction = Sentry.startTransaction({
    op: 'db.query',
    name: `${operation} ${table}`,
    tags: {
      operation,
      table,
      component: 'database',
    },
  });
  
  return {
    finish: (success: boolean = true, error?: Error) => {
      transaction.setStatus(success ? 'ok' : 'internal_error');
      if (error) {
        transaction.setData('error', error.message);
      }
      transaction.finish();
    },
  };
};

// E-commerce specific tracking
export const trackEcommerceEvent = (event: string, data: {
  userId?: string;
  productId?: string;
  orderId?: string;
  amount?: number;
  currency?: string;
  [key: string]: any;
}) => {
  Sentry.withScope(scope => {
    scope.setTag('eventType', 'ecommerce');
    scope.setContext('ecommerce', {
      event,
      ...data,
      timestamp: new Date().toISOString(),
    });
    
    if (data.userId) {
      scope.setUser({ id: data.userId });
    }
    
    Sentry.captureMessage(`E-commerce: ${event}`, 'info');
  });
};

// Authentication error tracking
export const trackAuthError = (error: Error, context: {
  email?: string;
  ip?: string;
  userAgent?: string;
  attemptType: 'login' | 'register' | 'reset' | 'verify';
}) => {
  Sentry.withScope(scope => {
    scope.setTag('errorType', 'authentication');
    scope.setContext('authAttempt', context);
    Sentry.captureException(error);
  });
};

// Payment error tracking
export const trackPaymentError = (error: Error, context: {
  orderId?: string;
  userId?: string;
  amount?: number;
  currency?: string;
  paymentMethod?: string;
  provider?: string;
}) => {
  Sentry.withScope(scope => {
    scope.setTag('errorType', 'payment');
    scope.setContext('payment', context);
    Sentry.captureException(error);
  });
};

// Review system error tracking
export const trackReviewSystemError = (error: Error, context: {
  productId?: string;
  userId?: string;
  reviewId?: string;
  operation?: 'create' | 'update' | 'delete' | 'vote';
}) => {
  Sentry.withScope(scope => {
    scope.setTag('errorType', 'reviewSystem');
    scope.setContext('reviewSystem', context);
    Sentry.captureException(error);
  });
};

// Email service error tracking
export const trackEmailError = (error: Error, context: {
  templateId?: string;
  recipient?: string;
  subject?: string;
  provider?: string;
}) => {
  Sentry.withScope(scope => {
    scope.setTag('errorType', 'email');
    scope.setContext('email', {
      ...context,
      // Don't log sensitive email content
      recipient: context.recipient ? 'redacted@domain.com' : undefined,
    });
    Sentry.captureException(error);
  });
};

export default Sentry;