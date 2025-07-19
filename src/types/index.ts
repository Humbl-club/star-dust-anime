// Central export for all types
export * from './api.types';
export type { 
  // UI types (avoid naming conflicts)
  LayoutProps, NavigationProps, ContentCardProps, SearchBarProps, FilterPanelProps,
  ModalProps, ButtonProps, InputProps, LoadingSpinnerProps, ErrorMessageProps
} from './ui.types';
export * from './database.types';

// Common utility types
export type Prettify<T> = {
  [K in keyof T]: T[K];
} & Record<string, never>;

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends Record<string, unknown> ? DeepPartial<T[P]> : T[P];
};

export type OptionalField<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export type RequireAtLeastOne<T, Keys extends keyof T = keyof T> = Pick<T, Exclude<keyof T, Keys>> &
  {
    [K in Keys]-?: Required<Pick<T, K>> & Partial<Pick<T, Exclude<Keys, K>>>;
  }[Keys];

export type ExcludeNull<T> = T extends null ? never : T;
export type ExcludeUndefined<T> = T extends undefined ? never : T;
export type NonEmpty<T> = T extends Record<string, never> ? never : T;

// Status types
export type LoadingState = 'idle' | 'loading' | 'success' | 'error';
export type NetworkState = 'online' | 'offline';
export type Theme = 'light' | 'dark' | 'system';

// Error types
export interface AppError {
  message: string;
  code?: string;
  stack?: string;
  context?: Record<string, unknown>;
}

// State management types
export interface StoreState {
  loading: boolean;
  error: AppError | null;
  lastUpdated?: Date;
}

// Event types
export interface AppEvent<T = unknown> {
  type: string;
  payload?: T;
  timestamp: Date;
  source?: string;
}

// Config types
export interface AppConfig {
  api: {
    baseUrl: string;
    timeout: number;
    retries: number;
  };
  features: {
    enableAnalytics: boolean;
    enableNotifications: boolean;
    enableOfflineMode: boolean;
  };
  ui: {
    theme: Theme;
    locale: string;
    timezone: string;
  };
}

// Analytics types
export interface AnalyticsEvent {
  name: string;
  properties?: Record<string, unknown>;
  timestamp: Date;
  userId?: string;
  sessionId?: string;
}

// Performance types
export interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  timestamp: Date;
  context?: Record<string, unknown>;
}