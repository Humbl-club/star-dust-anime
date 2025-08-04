import { supabase } from '@/integrations/supabase/client';
import { AppError, errorHandler } from './errorHandling';

export class SupabaseConnectionManager {
  private retryCount = 0;
  private maxRetries = 3;
  private retryDelay = 1000;
  private healthCheckInterval: NodeJS.Timeout | null = null;
  private isHealthy = true;
  private connectionStatus: 'connected' | 'disconnected' | 'checking' = 'connected';
  
  async executeWithRetry<T>(
    operation: () => Promise<T>,
    operationName: string
  ): Promise<T> {
    console.log(`🔄 Executing ${operationName} (attempt ${this.retryCount + 1}/${this.maxRetries + 1})`);
    
    try {
      const result = await operation();
      this.retryCount = 0; // Reset on success
      this.isHealthy = true;
      this.connectionStatus = 'connected';
      
      console.log(`✅ ${operationName} succeeded`);
      return result;
    } catch (error) {
      console.error(`❌ ${operationName} failed:`, error);
      
      if (this.retryCount < this.maxRetries) {
        this.retryCount++;
        const delay = this.retryDelay * this.retryCount;
        
        console.warn(`⏳ ${operationName} failed, retrying in ${delay}ms (${this.retryCount}/${this.maxRetries})...`);
        
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.executeWithRetry(operation, operationName);
      }
      
      this.isHealthy = false;
      this.connectionStatus = 'disconnected';
      
      throw new AppError(
        `${operationName} failed after ${this.maxRetries} retries: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'CONNECTION_ERROR',
        503
      );
    }
  }
  
  async healthCheck(): Promise<boolean> {
    this.connectionStatus = 'checking';
    
    try {
      // Simple query to check database connectivity
      const { data, error } = await supabase
        .from('titles')
        .select('id')
        .limit(1)
        .maybeSingle();
      
      const isHealthy = !error;
      this.isHealthy = isHealthy;
      this.connectionStatus = isHealthy ? 'connected' : 'disconnected';
      
      if (!isHealthy) {
        console.warn('🔍 Health check failed:', error);
      } else {
        console.log('✅ Health check passed');
      }
      
      return isHealthy;
    } catch (error) {
      console.error('❌ Health check error:', error);
      this.isHealthy = false;
      this.connectionStatus = 'disconnected';
      return false;
    }
  }
  
  startHealthMonitoring(callback?: (isHealthy: boolean, status: string) => void) {
    console.log('🔄 Starting health monitoring (30s intervals)');
    
    // Run initial health check
    this.healthCheck().then(isHealthy => {
      callback?.(isHealthy, this.connectionStatus);
    });
    
    // Set up periodic health checks
    this.healthCheckInterval = setInterval(async () => {
      const isHealthy = await this.healthCheck();
      callback?.(isHealthy, this.connectionStatus);
    }, 30000); // Check every 30 seconds
  }
  
  stopHealthMonitoring() {
    if (this.healthCheckInterval) {
      console.log('⏹️ Stopping health monitoring');
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
  }
  
  // Wrapper for Supabase queries with automatic retry
  async query<T>(
    queryOperation: () => Promise<{ data: T | null; error: any }>,
    operationName?: string
  ): Promise<T> {
    const operation = async () => {
      const { data, error } = await queryOperation();
      
      if (error) {
        throw new AppError(
          `Database query failed: ${error.message}`,
          'DATABASE_ERROR',
          error.code === 'PGRST301' ? 404 : 500
        );
      }
      
      return data as T;
    };
    
    return this.executeWithRetry(
      operation,
      operationName || 'Database Query'
    );
  }
  
  // Wrapper for RPC calls with automatic retry
  async rpc<T>(
    rpcOperation: () => Promise<{ data: T | null; error: any }>,
    operationName?: string
  ): Promise<T> {
    const operation = async () => {
      const { data, error } = await rpcOperation();
      
      if (error) {
        throw new AppError(
          `RPC call failed: ${error.message}`,
          'RPC_ERROR',
          500
        );
      }
      
      return data as T;
    };
    
    return this.executeWithRetry(
      operation,
      operationName || 'RPC Call'
    );
  }
  
  // Wrapper for Edge Function calls with automatic retry
  async edgeFunction<T>(
    functionName: string,
    payload?: any,
    operationName?: string
  ): Promise<T> {
    const operation = async () => {
      const { data, error } = await supabase.functions.invoke(functionName, {
        body: payload
      });
      
      if (error) {
        throw new AppError(
          `Edge function failed: ${error.message}`,
          'EDGE_FUNCTION_ERROR',
          500
        );
      }
      
      return data as T;
    };
    
    return this.executeWithRetry(
      operation,
      operationName || `Edge Function ${functionName}`
    );
  }
  
  // Get current connection status
  getStatus() {
    return {
      isHealthy: this.isHealthy,
      connectionStatus: this.connectionStatus,
      retryCount: this.retryCount,
      maxRetries: this.maxRetries
    };
  }
  
  // Reset connection state
  reset() {
    this.retryCount = 0;
    this.isHealthy = true;
    this.connectionStatus = 'connected';
    console.log('🔄 Connection state reset');
  }
  
  // Configure retry settings
  configure(options: {
    maxRetries?: number;
    retryDelay?: number;
  }) {
    if (options.maxRetries !== undefined) {
      this.maxRetries = options.maxRetries;
    }
    if (options.retryDelay !== undefined) {
      this.retryDelay = options.retryDelay;
    }
    
    console.log('⚙️ Connection manager configured:', {
      maxRetries: this.maxRetries,
      retryDelay: this.retryDelay
    });
  }
}

// Export singleton instance
export const connectionManager = new SupabaseConnectionManager();

// Cleanup on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    connectionManager.stopHealthMonitoring();
  });
}