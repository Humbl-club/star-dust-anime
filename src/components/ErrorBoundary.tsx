import React, { Component, ReactNode } from 'react';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw, Home, Copy } from 'lucide-react';
import { toast } from 'sonner';
import { generateCorrelationId, classifyError, logError, formatErrorForUser } from '@/utils/errorUtils';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  correlationId: string;
  errorType: string;
  userMessage: string;
  retryable: boolean;
  recoveryActions: string[];
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      correlationId: '',
      errorType: 'unknown',
      userMessage: 'An unexpected error occurred.',
      retryable: true,
      recoveryActions: []
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    const correlationId = generateCorrelationId();
    const classifiedError = classifyError(error, correlationId, 'component_error');
    
    return {
      hasError: true,
      error,
      correlationId,
      errorType: classifiedError.type,
      userMessage: classifiedError.userMessage,
      retryable: classifiedError.retryable,
      recoveryActions: classifiedError.recoveryActions || []
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log the error with full context
    const correlationId = this.state.correlationId || generateCorrelationId();
    const classifiedError = classifyError(error, correlationId, 'component_error');
    
    // Enhanced error context for React errors
    const enhancedContext = {
      ...classifiedError.context,
      componentStack: errorInfo.componentStack,
      errorBoundary: 'ErrorBoundary',
      additionalData: {
        ...classifiedError.context.additionalData,
        errorInfo
      }
    };

    const enhancedClassifiedError = {
      ...classifiedError,
      context: enhancedContext
    };

    // Log error asynchronously
    logError(enhancedClassifiedError, error);
    
    // Call optional error handler
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Show toast notification
    toast.error(formatErrorForUser(enhancedClassifiedError));
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      correlationId: '',
      errorType: 'unknown',
      userMessage: 'An unexpected error occurred.',
      retryable: true,
      recoveryActions: []
    });
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  handleCopyErrorId = () => {
    const errorId = this.state.correlationId.slice(-8).toUpperCase();
    navigator.clipboard.writeText(errorId);
    toast.success('Error ID copied to clipboard');
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI using existing components
      const errorId = this.state.correlationId.slice(-8).toUpperCase();
      
      return (
        <div className="min-h-screen flex items-center justify-center p-4">
          <Card className="glass-card w-full max-w-md p-6 text-center">
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Something went wrong</AlertTitle>
              <AlertDescription className="mt-2">
                {this.state.userMessage}
              </AlertDescription>
            </Alert>
            
            {/* Error ID for support */}
            <div className="mb-4 p-3 bg-muted/20 rounded-lg">
              <p className="text-sm text-muted-foreground mb-2">
                Error ID for support:
              </p>
              <div className="flex items-center justify-center gap-2">
                <code className="text-sm font-mono bg-background/50 px-2 py-1 rounded">
                  {errorId}
                </code>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={this.handleCopyErrorId}
                  className="h-8 w-8 p-0"
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            </div>

            {/* Recovery actions */}
            {this.state.recoveryActions.length > 0 && (
              <div className="mb-6 text-left">
                <p className="text-sm font-medium mb-2">Try these steps:</p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  {this.state.recoveryActions.map((action, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="inline-block w-1 h-1 bg-current rounded-full mt-2 flex-shrink-0" />
                      {action}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex flex-col gap-3">
              {this.state.retryable && (
                <Button 
                  onClick={this.handleRetry}
                  className="w-full"
                  variant="default"
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Try Again
                </Button>
              )}
              
              <Button 
                onClick={this.handleGoHome}
                variant="outline"
                className="w-full"
              >
                <Home className="mr-2 h-4 w-4" />
                Go Home
              </Button>
            </div>

            {/* Debug info in development */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mt-6 text-left">
                <summary className="text-sm font-medium cursor-pointer">
                  Debug Information
                </summary>
                <pre className="mt-2 text-xs bg-background/50 p-2 rounded overflow-auto">
                  {this.state.error.stack}
                </pre>
              </details>
            )}
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

// Higher-order component for easy wrapping
export const withErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, 'children'>
) => {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );
  
  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
};

// Hook for manual error reporting
export const useErrorBoundary = () => {
  return (error: Error) => {
    throw error;
  };
};