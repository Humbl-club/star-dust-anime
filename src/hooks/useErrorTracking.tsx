import { useCallback } from 'react';
import * as Sentry from '@sentry/react';
import { toast } from 'sonner';

export const useErrorTracking = () => {
  const trackError = useCallback((
    error: Error | string,
    context?: Record<string, any>,
    showToast = true
  ) => {
    const errorObj = typeof error === 'string' ? new Error(error) : error;
    
    console.error('Tracked error:', errorObj, context);
    
    if (import.meta.env.PROD) {
      Sentry.captureException(errorObj, { extra: context });
    }
    
    if (showToast) {
      toast.error(errorObj.message || 'An error occurred');
    }
  }, []);

  const trackEvent = useCallback((
    eventName: string,
    data?: Record<string, any>
  ) => {
    if (import.meta.env.PROD) {
      Sentry.addBreadcrumb({
        message: eventName,
        category: 'user-action',
        data,
      });
    }
  }, []);

  return { trackError, trackEvent };
};