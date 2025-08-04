import { supabase } from '@/integrations/supabase/client';
import { AppError } from './errorHandling';

export class SupabaseConnectionManager {
  private retryCount = 0;
  private maxRetries = 3;
  private retryDelay = 1000;
  private healthCheckInterval: NodeJS.Timeout | null = null;
  
  async executeWithRetry<T>(
    operation: () => Promise<T>,
    operationName: string
  ): Promise<T> {
    try {
      const result = await operation();
      this.retryCount = 0; // Reset on success
      return result;
    } catch (error) {
      if (this.retryCount < this.maxRetries) {
        this.retryCount++;
        console.warn(`${operationName} failed, retrying (${this.retryCount}/${this.maxRetries})...`);
        await new Promise(resolve => setTimeout(resolve, this.retryDelay * this.retryCount));
        return this.executeWithRetry(operation, operationName);
      }
      
      throw new AppError(
        `${operationName} failed after ${this.maxRetries} retries`,
        'CONNECTION_ERROR',
        503
      );
    }
  }
  
  async healthCheck(): Promise<boolean> {
    try {
      const { error } = await supabase.from('titles').select('count').limit(1).single();
      return !error;
    } catch {
      return false;
    }
  }
  
  startHealthMonitoring(callback?: (isHealthy: boolean) => void) {
    this.healthCheckInterval = setInterval(async () => {
      const isHealthy = await this.healthCheck();
      callback?.(isHealthy);
    }, 30000); // Check every 30 seconds
  }
  
  stopHealthMonitoring() {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
  }
}

export const connectionManager = new SupabaseConnectionManager();