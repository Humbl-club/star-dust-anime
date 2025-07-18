import React from 'react';
import { useQuery, UseQueryOptions, UseQueryResult, QueryFunction } from '@tanstack/react-query';
import { toast } from 'sonner';
import { 
  generateCorrelationId, 
  classifyError, 
  logError, 
  formatErrorForUser,
  retryWithBackoff,
  getRetryDelay 
} from '@/utils/errorUtils';

interface EnhancedQueryOptions<TData = unknown, TError = Error> extends Omit<UseQueryOptions<TData, TError>, 'onError'> {
  correlationId?: string;
  action?: string;
  showErrorToast?: boolean;
}

/**
 * Enhanced useQuery hook with comprehensive error handling
 * Builds on existing React Query patterns in useSimpleNewApiData
 */
export function useEnhancedQuery<TData = unknown, TError = Error>(
  options: EnhancedQueryOptions<TData, TError>
): UseQueryResult<TData, TError> {
  const { 
    correlationId = generateCorrelationId(),
    action = 'data_fetch',
    showErrorToast = true,
    queryFn,
    retry = 2,
    retryDelay,
    ...queryOptions 
  } = options;

  // Enhanced query function with error handling
  const enhancedQueryFn: QueryFunction<TData> = async (context) => {
    if (!queryFn) {
      throw new Error('queryFn is required');
    }

    try {
      const result = await (queryFn as QueryFunction<TData>)(context);
      return result;
    } catch (error) {
      // Classify and log error
      const classifiedError = classifyError(error, correlationId, action);
      await logError(classifiedError, error);
      
      // Show toast if enabled
      if (showErrorToast) {
        toast.error(formatErrorForUser(classifiedError));
      }
      
      throw classifiedError;
    }
  };

  // Enhanced retry logic
  const enhancedRetryDelay = (attemptIndex: number, error: any) => {
    if (retryDelay && typeof retryDelay === 'function') {
      return retryDelay(attemptIndex, error);
    }
    
    if (typeof retryDelay === 'number') {
      return retryDelay;
    }
    
    // Use error-type aware retry delay
    const errorType = error?.type || 'unknown';
    return getRetryDelay(errorType, attemptIndex);
  };

  // Enhanced retry logic based on error type
  const enhancedRetry = (failureCount: number, error: any) => {
    if (typeof retry === 'function') {
      return retry(failureCount, error);
    }
    
    if (typeof retry === 'number') {
      // Don't retry non-retryable errors
      if (error?.retryable === false) {
        return false;
      }
      
      return failureCount < retry;
    }
    
    return false;
  };

  // Query result with error handling
  const queryResult = useQuery({
    ...queryOptions,
    queryFn: enhancedQueryFn,
    retry: enhancedRetry,
    retryDelay: enhancedRetryDelay,
    // Enhanced meta for debugging
    meta: {
      ...queryOptions.meta,
      correlationId,
      action,
      errorHandlingEnabled: true
    }
  });

  // Handle errors in useEffect to avoid onError deprecation
  React.useEffect(() => {
    if (queryResult.error) {
      console.warn(`Query failed [${correlationId.slice(-8)}]:`, {
        action,
        error: queryResult.error,
        queryKey: queryOptions.queryKey
      });
    }
  }, [queryResult.error, correlationId, action, queryOptions.queryKey]);

  return queryResult;
}

/**
 * Hook for creating async error handlers in components
 * Useful for manual error handling in event handlers
 */
export const useAsyncErrorHandler = (action?: string) => {
  return (asyncFn: () => Promise<any>, options?: { 
    showToast?: boolean;
    onError?: (error: any) => void;
  }) => {
    const correlationId = generateCorrelationId();
    
    return async () => {
      try {
        return await asyncFn();
      } catch (error) {
        const classifiedError = classifyError(error, correlationId, action);
        await logError(classifiedError, error);
        
        if (options?.showToast !== false) {
          toast.error(formatErrorForUser(classifiedError));
        }
        
        if (options?.onError) {
          options.onError(classifiedError);
        }
        
        throw classifiedError;
      }
    };
  };
};

/**
 * Hook for enhanced mutation error handling
 * Similar pattern to useEnhancedQuery but for mutations
 */
export const useMutationErrorHandler = (action?: string) => {
  return {
    onError: async (error: any) => {
      const correlationId = generateCorrelationId();
      const classifiedError = classifyError(error, correlationId, action);
      
      await logError(classifiedError, error);
      toast.error(formatErrorForUser(classifiedError));
    },
    
    onSuccess: (data: any) => {
      console.log(`Mutation successful [${action}]:`, data);
    }
  };
};