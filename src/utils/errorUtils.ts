import { supabase } from '@/integrations/supabase/client';

// Error classification types
export type ErrorType = 
  | 'network'
  | 'authentication'
  | 'authorization'
  | 'validation'
  | 'rate_limit'
  | 'server'
  | 'not_found'
  | 'unknown';

export interface ErrorContext {
  correlationId: string;
  timestamp: string;
  userId?: string;
  route?: string;
  userAgent?: string;
  action?: string;
  additionalData?: Record<string, any>;
}

export interface ClassifiedError {
  type: ErrorType;
  userMessage: string;
  technicalMessage: string;
  correlationId: string;
  context: ErrorContext;
  retryable: boolean;
  recoveryActions?: string[];
}

/**
 * Generate a correlation ID for error tracking
 * Extends the pattern already used in authService.ts
 */
export const generateCorrelationId = (): string => {
  return crypto.randomUUID();
};

/**
 * Collect context information for error tracking
 */
export const collectErrorContext = (
  correlationId: string,
  action?: string,
  additionalData?: Record<string, any>
): ErrorContext => {
  return {
    correlationId,
    timestamp: new Date().toISOString(),
    userId: getCurrentUserId(),
    route: window.location.pathname,
    userAgent: navigator.userAgent,
    action,
    additionalData
  };
};

/**
 * Get current user ID safely
 */
const getCurrentUserId = (): string | undefined => {
  try {
    // This is a synchronous check - no async calls in context collection
    const user = supabase.auth.getUser();
    return undefined; // We'll handle user context in the logging phase
  } catch {
    return undefined;
  }
};

/**
 * Classify error types and provide user-friendly messages
 * Based on existing patterns in authService.ts
 */
export const classifyError = (
  error: any,
  correlationId: string,
  action?: string
): ClassifiedError => {
  const context = collectErrorContext(correlationId, action);
  
  // Network errors
  if (error?.code === 'NETWORK_ERROR' || error?.message?.includes('network') || error?.message?.includes('fetch')) {
    return {
      type: 'network',
      userMessage: 'Connection issue. Please check your internet connection and try again.',
      technicalMessage: error.message || 'Network error occurred',
      correlationId,
      context,
      retryable: true,
      recoveryActions: ['Check internet connection', 'Try again in a moment']
    };
  }

  // Authentication errors
  if (error?.message?.includes('not authenticated') || error?.message?.includes('unauthorized') || error?.code === 'PGRST301') {
    return {
      type: 'authentication',
      userMessage: 'Please sign in to continue.',
      technicalMessage: error.message || 'Authentication required',
      correlationId,
      context,
      retryable: false,
      recoveryActions: ['Sign in to your account']
    };
  }

  // Rate limiting
  if (error?.message?.includes('rate limit') || error?.message?.includes('too many requests') || error?.code === '429') {
    return {
      type: 'rate_limit',
      userMessage: 'Too many requests. Please wait a moment and try again.',
      technicalMessage: error.message || 'Rate limit exceeded',
      correlationId,
      context,
      retryable: true,
      recoveryActions: ['Wait a few seconds', 'Try again later']
    };
  }

  // Validation errors
  if (error?.message?.includes('validation') || error?.message?.includes('invalid') || error?.code?.startsWith('23')) {
    return {
      type: 'validation',
      userMessage: 'Please check your input and try again.',
      technicalMessage: error.message || 'Validation error',
      correlationId,
      context,
      retryable: false,
      recoveryActions: ['Check your input', 'Ensure all required fields are filled']
    };
  }

  // Not found errors
  if (error?.message?.includes('not found') || error?.code === 'PGRST116' || error?.status === 404) {
    return {
      type: 'not_found',
      userMessage: 'The requested information could not be found.',
      technicalMessage: error.message || 'Resource not found',
      correlationId,
      context,
      retryable: false,
      recoveryActions: ['Check the URL', 'Go back and try again']
    };
  }

  // Server errors
  if (error?.message?.includes('server') || error?.status >= 500 || error?.code?.startsWith('5')) {
    return {
      type: 'server',
      userMessage: 'Server issue. Our team has been notified.',
      technicalMessage: error.message || 'Server error occurred',
      correlationId,
      context,
      retryable: true,
      recoveryActions: ['Try again in a few minutes', 'Contact support if the issue persists']
    };
  }

  // Default to unknown error
  return {
    type: 'unknown',
    userMessage: 'An unexpected error occurred. Please try again.',
    technicalMessage: error?.message || 'Unknown error',
    correlationId,
    context,
    retryable: true,
    recoveryActions: ['Try again', 'Refresh the page', 'Contact support if the issue persists']
  };
};

/**
 * Enhanced error logging with context
 * Extends the console.error pattern from existing hooks
 */
export const logError = async (
  classifiedError: ClassifiedError,
  originalError?: any
): Promise<void> => {
  try {
    // Enhanced console logging with context
    console.group(`🔥 Error [${classifiedError.correlationId}]`);
    console.error('Type:', classifiedError.type);
    console.error('User Message:', classifiedError.userMessage);
    console.error('Technical Message:', classifiedError.technicalMessage);
    console.error('Context:', classifiedError.context);
    console.error('Retryable:', classifiedError.retryable);
    console.error('Recovery Actions:', classifiedError.recoveryActions);
    if (originalError) {
      console.error('Original Error:', originalError);
    }
    console.groupEnd();

    // Get user ID asynchronously for logging
    const { data: { user } } = await supabase.auth.getUser();
    
    // Log to service health metrics for monitoring
    // This uses the existing database function from authService pattern
    await supabase.rpc('log_service_metric', {
      service_name_param: 'frontend_app',
      metric_type_param: 'error_occurred',
      metric_value_param: 1,
      metadata_param: {
        error_type: classifiedError.type,
        correlation_id: classifiedError.correlationId,
        user_id: user?.id,
        route: classifiedError.context.route,
        action: classifiedError.context.action,
        user_message: classifiedError.userMessage,
        technical_message: classifiedError.technicalMessage,
        retryable: classifiedError.retryable,
        timestamp: classifiedError.context.timestamp
      }
    });
  } catch (loggingError) {
    // Don't fail the application if logging fails
    console.error('Failed to log error:', loggingError);
  }
};

/**
 * Create a standardized async error handler
 * Follows the try-catch pattern from authService.ts
 */
export const createAsyncErrorHandler = (
  action: string,
  onError?: (error: ClassifiedError) => void
) => {
  return async (asyncFn: () => Promise<any>) => {
    const correlationId = generateCorrelationId();
    
    try {
      return await asyncFn();
    } catch (error) {
      const classifiedError = classifyError(error, correlationId, action);
      await logError(classifiedError, error);
      
      if (onError) {
        onError(classifiedError);
      }
      
      throw classifiedError;
    }
  };
};

/**
 * Retry logic with exponential backoff
 * Based on the retry pattern in useSimpleNewApiData.tsx
 */
export const retryWithBackoff = async <T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> => {
  let lastError: any;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      if (attempt === maxRetries) {
        break;
      }
      
      // Check if error is retryable
      const correlationId = generateCorrelationId();
      const classifiedError = classifyError(error, correlationId);
      
      if (!classifiedError.retryable) {
        throw classifiedError;
      }
      
      // Exponential backoff delay
      const delay = Math.min(baseDelay * Math.pow(2, attempt), 30000);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError;
};

/**
 * Format error for user display with correlation ID
 * Used in toast messages and error boundaries
 */
export const formatErrorForUser = (classifiedError: ClassifiedError): string => {
  const baseMessage = classifiedError.userMessage;
  const errorId = classifiedError.correlationId.slice(-8).toUpperCase();
  
  return `${baseMessage}\n\nError ID: ${errorId}`;
};

/**
 * Check if error is a connection/network issue
 */
export const isNetworkError = (error: any): boolean => {
  return error?.type === 'network' || 
         error?.message?.includes('network') || 
         error?.message?.includes('fetch') ||
         !navigator.onLine;
};

/**
 * Get appropriate retry delay based on error type
 */
export const getRetryDelay = (errorType: ErrorType, attempt: number): number => {
  const baseDelays = {
    network: 2000,
    rate_limit: 5000,
    server: 3000,
    unknown: 1000,
    authentication: 0, // No retry
    authorization: 0, // No retry
    validation: 0, // No retry
    not_found: 0 // No retry
  };
  
  const baseDelay = baseDelays[errorType] || 1000;
  return Math.min(baseDelay * Math.pow(2, attempt), 30000);
};