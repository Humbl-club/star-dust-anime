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
    return {
      supabase: {
        url: "https://axtpbgsjbmhbuqomarcr.supabase.co",
        anonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF4dHBiZ3NqYm1oYnVxb21hcmNyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc1MDk0NzksImV4cCI6MjA2MzA4NTQ3OX0.ySdY2C6kZQhKKNfFVaLeLIzGEw00cJy2iJRFhxixqDo",
      },
      api: {
        baseUrl: '/api',
        timeout: 30000,
      },
      features: {
        analytics: true,
        gamification: true,
        offlineMode: true,
        pushNotifications: false,
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
}

export const env = new EnvironmentManager();