import * as Sentry from '@sentry/react';

export const initSentry = () => {
  if (import.meta.env.PROD) {
    Sentry.init({
      dsn: import.meta.env.VITE_SENTRY_DSN,
      environment: import.meta.env.MODE,
      tracesSampleRate: 0.1,
      beforeSend(event, hint) {
        // Filter out non-critical errors
        if (event.exception) {
          const error = hint.originalException as Error;
          // Skip network errors that are expected
          if (error?.message?.includes('Failed to fetch')) {
            return null;
          }
        }
        return event;
      },
    });
  }
};

export const captureError = (error: Error, context?: Record<string, any>) => {
  console.error('Error captured:', error);
  if (import.meta.env.PROD) {
    Sentry.captureException(error, { extra: context });
  }
};