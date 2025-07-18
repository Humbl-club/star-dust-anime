// Service Types for Auth, Analytics, and Utilities

import { User, Session } from '@supabase/supabase-js';

// Auth Service Types
export interface AuthResponse {
  error: Error | null;
  needsConfirmation?: boolean;
  message?: string;
  data?: {
    user: User | null;
    session: Session | null;
  };
}

export interface PasswordValidationResult {
  isValid: boolean;
  score: number;
  errors: string[];
  suggestions: string[];
}

export interface EmailValidationResult {
  isValid: boolean;
  errors: string[];
  suggestions: string[];
}

export interface AuthUser {
  id: string;
  email?: string;
  user_metadata?: Record<string, unknown>;
  app_metadata?: Record<string, unknown>;
  created_at?: string;
  updated_at?: string;
}

export interface AuthSession {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
  user: AuthUser;
}

// Error Utility Types
export interface CorrelationContext {
  correlationId: string;
  timestamp: string;
  operation: string;
  userId?: string;
  additionalContext?: Record<string, unknown>;
}

export interface ErrorContext {
  correlationId: string;
  operation: string;
  userId?: string;
  timestamp: string;
  userAgent?: string;
  url?: string;
  additionalContext?: Record<string, unknown>;
}

export interface ClassifiedError {
  type: 'network' | 'auth' | 'validation' | 'server' | 'client' | 'unknown';
  message: string;
  originalError: Error;
  correlationId: string;
  context: ErrorContext;
  severity: 'low' | 'medium' | 'high' | 'critical';
  userMessage: string;
  actionable: boolean;
  retryable: boolean;
}

export interface ErrorClassificationResult {
  type: ClassifiedError['type'];
  severity: ClassifiedError['severity'];
  userMessage: string;
  actionable: boolean;
  retryable: boolean;
}

// Network Monitoring Types
export interface NetworkRequest {
  id: string;
  url: string;
  method: string;
  status?: number;
  duration?: number;
  timestamp: Date;
  correlationId?: string;
  error?: Error;
}

export interface NetworkMetrics {
  averageResponseTime: number;
  errorRate: number;
  requestCount: number;
  slowQueries: NetworkRequest[];
}

// Analytics Service Types
export interface AnalyticsEvent {
  action: string;
  metadata: Record<string, unknown>;
  timestamp: Date;
  userId?: string;
  sessionId?: string;
  correlationId?: string;
}

export interface AnalyticsMetrics {
  userActivity: {
    totalUsers: number;
    activeUsers: number;
    newUsers: number;
    userGrowth: number;
  };
  contentStats: {
    totalAnime: number;
    totalManga: number;
    mostPopular: Array<{
      id: string;
      title: string;
      views: number;
      score?: number;
    }>;
    recentlyAdded: Array<{
      id: string;
      title: string;
      type: 'anime' | 'manga';
      added_date: string;
    }>;
  };
  searchAnalytics: {
    totalSearches: number;
    aiSearches: number;
    searchSuccessRate: number;
    popularQueries: string[];
  };
  recommendations: {
    totalRecommendations: number;
    clickThroughRate: number;
    topRecommendedGenres: string[];
  };
}

// Validation Service Types
export interface ValidationRule<T> {
  validate: (value: T) => boolean;
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export interface FormValidationResult {
  isValid: boolean;
  fieldErrors: Record<string, string[]>;
  globalErrors: string[];
}

// Cache Service Types
export interface CacheItem<T> {
  data: T;
  timestamp: Date;
  expiresAt: Date;
  accessCount: number;
  lastAccessed: Date;
}

export interface CacheMetrics {
  hitRate: number;
  missRate: number;
  size: number;
  memoryUsage: number;
}

// API Client Types
export interface ApiClientConfig {
  baseURL: string;
  timeout: number;
  retryAttempts: number;
  retryDelay: number;
  correlationIdHeader: string;
}

export interface ApiRequestConfig {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  url: string;
  data?: unknown;
  params?: Record<string, string>;
  headers?: Record<string, string>;
  timeout?: number;
  correlationId?: string;
}

export interface ApiResponse<T> {
  data: T;
  status: number;
  statusText: string;
  headers: Record<string, string>;
  correlationId?: string;
}

// Feature Flag Types
export interface FeatureFlag {
  key: string;
  enabled: boolean;
  description: string;
  rolloutPercentage: number;
  conditions?: Record<string, unknown>;
}

export interface FeatureFlagContext {
  userId?: string;
  userGroups?: string[];
  environment: string;
  version: string;
}

// Logging Service Types
export interface LogEntry {
  level: 'debug' | 'info' | 'warn' | 'error' | 'fatal';
  message: string;
  timestamp: Date;
  correlationId?: string;
  userId?: string;
  context?: Record<string, unknown>;
  error?: Error;
}

export interface LoggerConfig {
  level: LogEntry['level'];
  enableConsole: boolean;
  enableRemote: boolean;
  remoteEndpoint?: string;
  bufferSize: number;
  flushInterval: number;
}

// Additional service types
export interface AuthenticationResult {
  success: boolean;
  user?: {
    id: string;
    email: string;
    username?: string;
  };
  error?: string;
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

export interface ServiceResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  correlationId?: string;
}