import * as Sentry from '@sentry/react';
import { supabase } from '@/integrations/supabase/client';

// Intercept Supabase errors
export const setupApiErrorTracking = () => {
  const originalFrom = supabase.from.bind(supabase);
  
  supabase.from = (table: string) => {
    const query = originalFrom(table);
    const originalSelect = query.select.bind(query);
    const originalInsert = query.insert.bind(query);
    const originalUpdate = query.update.bind(query);
    const originalDelete = query.delete.bind(query);
    
    // Wrap select operations
    query.select = (...args: any[]) => {
      const result = originalSelect(...args);
      return wrapQueryResult(result, table, 'select');
    };
    
    // Wrap insert operations
    query.insert = (...args: any[]) => {
      const result = originalInsert(...args);
      return wrapQueryResult(result, table, 'insert');
    };
    
    // Wrap update operations
    query.update = (...args: any[]) => {
      const result = originalUpdate(...args);
      return wrapQueryResult(result, table, 'update');
    };
    
    // Wrap delete operations
    query.delete = (...args: any[]) => {
      const result = originalDelete(...args);
      return wrapQueryResult(result, table, 'delete');
    };
    
    return query;
  };
};

// Helper function to wrap query results and track errors
const wrapQueryResult = (result: any, table: string, operation: string) => {
  const originalThen = result.then?.bind(result);
  
  if (originalThen) {
    result.then = (onfulfilled?: any, onrejected?: any) => {
      return originalThen(
        (response: any) => {
          if (response?.error) {
            console.error(`Supabase ${operation} error on ${table}:`, response.error);
            
            if (import.meta.env.PROD) {
              Sentry.captureException(new Error(response.error.message), {
                tags: {
                  component: 'supabase-api',
                  table,
                  operation,
                },
                extra: {
                  error: response.error,
                  table,
                  operation,
                  timestamp: new Date().toISOString(),
                }
              });
            }
          }
          return onfulfilled?.(response);
        },
        (error: any) => {
          console.error(`Supabase ${operation} rejection on ${table}:`, error);
          
          if (import.meta.env.PROD) {
            Sentry.captureException(error, {
              tags: {
                component: 'supabase-api',
                table,
                operation,
              },
              extra: {
                table,
                operation,
                timestamp: new Date().toISOString(),
              }
            });
          }
          
          return onrejected?.(error);
        }
      );
    };
  }
  
  return result;
};

// Track general API errors
export const trackApiError = (
  error: Error,
  endpoint: string,
  method: string = 'GET',
  context?: Record<string, any>
) => {
  console.error(`API Error [${method}] ${endpoint}:`, error);
  
  if (import.meta.env.PROD) {
    Sentry.captureException(error, {
      tags: {
        component: 'api',
        endpoint,
        method,
      },
      extra: {
        endpoint,
        method,
        context,
        timestamp: new Date().toISOString(),
      }
    });
  }
};