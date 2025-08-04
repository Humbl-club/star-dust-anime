interface EnvironmentConfig {
  supabase: {
    url: string;
    anonKey: string;
  };
  api: {
    baseUrl: string;
    timeout: number;
  };
  features: {
    analytics: boolean;
    gamification: boolean;
    offlineMode: boolean;
    pushNotifications: boolean;
  };
  app: {
    name: string;
    version: string;
    url: string;
  };
}

class EnvironmentManager {
  private config: EnvironmentConfig;
  
  constructor() {
    this.config = this.loadConfig();
    this.validateConfig();
  }
  
  private loadConfig(): EnvironmentConfig {
    const isProduction = this.isProduction();
    
    return {
      supabase: {
        url: "https://axtpbgsjbmhbuqomarcr.supabase.co",
        anonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF4dHBiZ3NqYm1oYnVxb21hcmNyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc1MDk0NzksImV4cCI6MjA2MzA4NTQ3OX0.ySdY2C6kZQhKKNfFVaLeLIzGEw00cJy2iJRFhxixqDo",
      },
      api: {
        baseUrl: isProduction ? '/api' : '/api',
        timeout: 30000,
      },
      features: {
        analytics: true,
        gamification: true,
        offlineMode: true,
        pushNotifications: isProduction, // Enable push notifications in production
      },
      app: {
        name: 'AnimeHub',
        version: '1.0.0',
        url: window.location.origin,
      }
    };
  }
  
  private validateConfig() {
    if (!this.config.supabase.url || !this.config.supabase.anonKey) {
      throw new Error('Missing required Supabase configuration');
    }
    
    // Validate URL format
    try {
      new URL(this.config.supabase.url);
    } catch {
      throw new Error('Invalid Supabase URL format');
    }
    
    // Validate timeout
    if (this.config.api.timeout < 1000) {
      console.warn('API timeout is very low, this may cause issues');
    }
  }
  
  get(path: string): any {
    return path.split('.').reduce((obj, key) => obj?.[key], this.config);
  }
  
  getSupabaseConfig() {
    return this.config.supabase;
  }
  
  getApiConfig() {
    return this.config.api;
  }
  
  getAppConfig() {
    return this.config.app;
  }
  
  isFeatureEnabled(feature: keyof EnvironmentConfig['features']): boolean {
    return this.config.features[feature] || false;
  }
  
  isDevelopment(): boolean {
    return window.location.hostname === 'localhost' || 
           window.location.hostname.includes('lovable');
  }
  
  isProduction(): boolean {
    return !this.isDevelopment();
  }
  
  getBaseUrl(): string {
    return this.config.app.url;
  }
  
  // Production-specific configurations
  getProductionConfig() {
    return {
      enableAnalytics: this.config.features.analytics,
      enableCaching: true,
      enablePushNotifications: this.config.features.pushNotifications,
      enableServiceWorker: true,
      apiTimeout: this.config.api.timeout,
      logLevel: this.isProduction() ? 'error' : 'debug'
    };
  }
  
  // Development-specific configurations  
  getDevelopmentConfig() {
    return {
      enableDevTools: true,
      enableDebugMode: true,
      enableMockData: false,
      logLevel: 'debug',
      enableHotReload: true
    };
  }
}

export const env = new EnvironmentManager();