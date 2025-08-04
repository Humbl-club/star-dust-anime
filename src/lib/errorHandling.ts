import { toast } from "@/hooks/use-toast";

export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500,
    public isOperational: boolean = true
  ) {
    super(message);
    this.name = 'AppError';
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export interface ErrorResponse {
  success: false;
  error: {
    message: string;
    code: string;
    statusCode?: number;
  };
}

export interface SuccessResponse<T = any> {
  success: true;
  data: T;
}

export type ApiResponse<T = any> = SuccessResponse<T> | ErrorResponse;

export const errorHandler = {
  handleError: (error: Error | AppError, showToast: boolean = true): ErrorResponse => {
    if (error instanceof AppError && error.isOperational) {
      console.error(`[${error.code}] ${error.message}`);
      
      if (showToast) {
        toast({
          variant: "destructive",
          title: "Error",
          description: error.message,
        });
      }
      
      return {
        success: false,
        error: {
          message: error.message,
          code: error.code,
          statusCode: error.statusCode
        }
      };
    }
    
    // Log to monitoring service in production
    if (import.meta.env.PROD) {
      // Send to error tracking service (Sentry is already configured)
      console.error('Critical error:', error);
    } else {
      // Development: log full error details
      console.error('Development error:', error);
    }
    
    if (showToast) {
      toast({
        variant: "destructive",
        title: "Unexpected Error",
        description: "An unexpected error occurred. Please try again.",
      });
    }
    
    return {
      success: false,
      error: {
        message: 'An unexpected error occurred',
        code: 'UNKNOWN_ERROR',
        statusCode: 500
      }
    };
  },

  handleAsyncError: async <T>(
    operation: () => Promise<T>,
    errorMessage: string = "Operation failed"
  ): Promise<ApiResponse<T>> => {
    try {
      const result = await operation();
      return {
        success: true,
        data: result
      };
    } catch (error) {
      return errorHandler.handleError(
        error instanceof Error ? error : new AppError(errorMessage, 'ASYNC_ERROR'),
        false // Don't show toast for async operations by default
      );
    }
  },

  createError: (message: string, code: string, statusCode: number = 500): AppError => {
    return new AppError(message, code, statusCode);
  }
};

// Common error types
export const ErrorCodes = {
  // Authentication errors
  AUTHENTICATION_FAILED: 'AUTHENTICATION_FAILED',
  UNAUTHORIZED: 'UNAUTHORIZED',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  
  // Network errors
  NETWORK_ERROR: 'NETWORK_ERROR',
  API_ERROR: 'API_ERROR',
  TIMEOUT_ERROR: 'TIMEOUT_ERROR',
  
  // Data errors
  DATA_NOT_FOUND: 'DATA_NOT_FOUND',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_INPUT: 'INVALID_INPUT',
  
  // Application errors
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
  OPERATION_FAILED: 'OPERATION_FAILED',
  RATE_LIMITED: 'RATE_LIMITED'
} as const;

// Utility function to check if error is operational
export const isOperationalError = (error: Error): boolean => {
  return error instanceof AppError && error.isOperational;
};

// Global error boundary helper
export const withErrorHandling = <T extends (...args: any[]) => any>(
  fn: T,
  errorMessage?: string
): T => {
  return ((...args: any[]) => {
    try {
      const result = fn(...args);
      
      // Handle async functions
      if (result instanceof Promise) {
        return result.catch((error) => {
          errorHandler.handleError(
            error instanceof Error ? error : new AppError(
              errorMessage || 'Function execution failed',
              'FUNCTION_ERROR'
            )
          );
          throw error;
        });
      }
      
      return result;
    } catch (error) {
      errorHandler.handleError(
        error instanceof Error ? error : new AppError(
          errorMessage || 'Function execution failed',
          'FUNCTION_ERROR'
        )
      );
      throw error;
    }
  }) as T;
};