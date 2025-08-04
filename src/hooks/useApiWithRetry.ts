import { useState, useCallback } from 'react';
import { toast } from 'sonner';

interface RetryOptions {
  maxRetries?: number;
  retryDelay?: number;
  onRetry?: (attempt: number) => void;
}

export function useApiWithRetry<T>(
  apiCall: () => Promise<T>,
  options: RetryOptions = {}
) {
  const { maxRetries = 3, retryDelay = 1000, onRetry } = options;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [data, setData] = useState<T | null>(null);

  const execute = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const result = await apiCall();
        setData(result);
        setLoading(false);
        return result;
      } catch (err) {
        lastError = err as Error;
        
        if (attempt < maxRetries) {
          onRetry?.(attempt + 1);
          
          // Exponential backoff
          const delay = retryDelay * Math.pow(2, attempt);
          await new Promise(resolve => setTimeout(resolve, delay));
          
          toast.info(`Retrying... (${attempt + 1}/${maxRetries})`);
        }
      }
    }
    
    setError(lastError);
    setLoading(false);
    toast.error('Operation failed after multiple attempts');
    throw lastError;
  }, [apiCall, maxRetries, retryDelay, onRetry]);

  return { execute, loading, error, data };
}