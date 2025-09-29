import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorId: string;
}

class ErrorBoundary extends Component<Props, State> {
  private retryCount = 0;
  private readonly maxRetries = 3;

  constructor(props: Props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null,
      errorId: ''
    };
  }

  static getDerivedStateFromError(error: Error): State {
    // Generate error ID for tracking
    const errorId = `ERR_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    return {
      hasError: true,
      error,
      errorId
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error details
    console.error('Error Boundary caught an error:', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      errorId: this.state.errorId,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    });

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Report to error tracking service
    this.reportError(error, errorInfo);
  }

  private reportError = (error: Error, errorInfo: ErrorInfo) => {
    // In production, send to error tracking service like Sentry
    const errorReport = {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      errorId: this.state.errorId,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      userId: localStorage.getItem('auth_token') ? 'authenticated' : 'anonymous'
    };

    // For development, just log to console
    if (process.env.NODE_ENV === 'development') {
      console.group('🚨 Error Report');
      console.error('Error ID:', this.state.errorId);
      console.error('Message:', error.message);
      console.error('Stack:', error.stack);
      console.error('Component Stack:', errorInfo.componentStack);
      console.groupEnd();
    } else {
      // In production, send to monitoring service
      // fetch('/api/errors/report', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(errorReport)
      // }).catch(console.error);
    }
  };

  private handleRetry = () => {
    if (this.retryCount < this.maxRetries) {
      this.retryCount++;
      this.setState({
        hasError: false,
        error: null,
        errorId: ''
      });
    } else {
      // Max retries reached, redirect to home
      window.location.href = '/';
    }
  };

  private handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const { error, errorId } = this.state;
      const canRetry = this.retryCount < this.maxRetries;

      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-md w-full space-y-8 text-center">
            <div>
              <AlertTriangle className="mx-auto h-16 w-16 text-red-500" />
              <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
                Oops! Something went wrong
              </h2>
              <p className="mt-2 text-sm text-gray-600">
                We encountered an unexpected error. Don't worry, our team has been notified.
              </p>
            </div>

            {/* Error Details (in development) */}
            {process.env.NODE_ENV === 'development' && error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-left">
                <h3 className="text-sm font-medium text-red-800 mb-2">
                  Error Details (Development Mode)
                </h3>
                <p className="text-xs text-red-700 mb-2">
                  <strong>ID:</strong> {errorId}
                </p>
                <p className="text-xs text-red-700 mb-2">
                  <strong>Message:</strong> {error.message}
                </p>
                {error.stack && (
                  <details className="text-xs text-red-600">
                    <summary className="cursor-pointer hover:text-red-800">
                      Stack Trace
                    </summary>
                    <pre className="mt-2 whitespace-pre-wrap text-xs">
                      {error.stack}
                    </pre>
                  </details>
                )}
              </div>
            )}

            {/* Error ID for user reference */}
            <div className="bg-gray-100 rounded-lg p-3">
              <p className="text-xs text-gray-500">
                Error ID: <code className="font-mono">{errorId}</code>
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Reference this ID when contacting support
              </p>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              {canRetry && (
                <button
                  onClick={this.handleRetry}
                  className="w-full flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Try Again ({this.maxRetries - this.retryCount} remaining)
                </button>
              )}

              <button
                onClick={this.handleReload}
                className="w-full flex justify-center items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Reload Page
              </button>

              <button
                onClick={() => window.location.href = '/'}
                className="w-full flex justify-center items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                <Home className="w-4 h-4 mr-2" />
                Go to Homepage
              </button>
            </div>

            {/* Help Text */}
            <div className="text-xs text-gray-500">
              <p>If the problem persists, please contact support at:</p>
              <a 
                href="mailto:support@thecalista.com" 
                className="text-blue-600 hover:text-blue-500"
              >
                support@thecalista.com
              </a>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// HOC for wrapping components with error boundary
export const withErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  fallback?: ReactNode,
  onError?: (error: Error, errorInfo: ErrorInfo) => void
) => {
  return (props: P) => (
    <ErrorBoundary fallback={fallback} onError={onError}>
      <Component {...props} />
    </ErrorBoundary>
  );
};

export default ErrorBoundary;