// Supabase Edge Function Types

// Base request/response types for all edge functions
export interface EdgeFunctionRequest<T = Record<string, unknown>> {
  body: T;
  headers: Record<string, string>;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'OPTIONS';
  url: string;
}

export interface EdgeFunctionResponse<T = unknown> {
  data?: T;
  error?: {
    message: string;
    code?: string;
    details?: string;
    correlationId?: string;
  };
  success: boolean;
  correlationId?: string;
}

// Authentication function types
export interface AuthEmailRequest {
  email: string;
  user_id: string;
  email_action_type: 'signup' | 'recovery' | 'invite' | 'email_change';
  token: string;
  redirect_to: string;
}

export interface AuthEmailResponse {
  success: boolean;
  message: string;
  emailId?: string;
  correlationId: string;
}

// Sync function types
export interface SyncRequest {
  contentType: 'anime' | 'manga';
  maxPages?: number;
  correlationId?: string;
  forceRefresh?: boolean;
}

export interface SyncResponse {
  success: boolean;
  message: string;
  results?: {
    titlesInserted: number;
    detailsInserted: number;
    genresCreated: number;
    studiosCreated: number;
    authorsCreated: number;
    relationshipsCreated: number;
    processed: number;
    errors: string[];
  };
  correlationId: string;
  executionTime?: number;
}

// Image sync function types
export interface ImageSyncRequest {
  limit?: number;
  contentType?: 'anime' | 'manga';
  correlationId?: string;
}

export interface ImageSyncResponse {
  success: boolean;
  message: string;
  results?: {
    processed: number;
    updated: number;
    failed: number;
    errors: string[];
  };
  correlationId: string;
}

// AI Search function types
export interface AISearchRequest {
  query: string;
  contentType?: 'anime' | 'manga' | 'both';
  limit?: number;
  userId?: string;
}

export interface AISearchResponse {
  success: boolean;
  results: {
    id: string;
    title: string;
    synopsis: string;
    image_url: string;
    score?: number;
    type: string;
    relevanceScore: number;
  }[];
  queryId: string;
  processingTime: number;
}

// Bulk operation function types
export interface BulkOperationRequest {
  operation: 'delete' | 'update' | 'sync';
  contentType: 'anime' | 'manga';
  filters?: {
    year?: number;
    status?: string;
    genre?: string;
  };
  data?: Record<string, unknown>;
  userId: string;
}

export interface BulkOperationResponse {
  success: boolean;
  message: string;
  results?: {
    processed: number;
    successful: number;
    failed: number;
    errors: string[];
  };
  operationId: string;
}

// Email processing function types
export interface ProcessEmailQueueRequest {
  batchSize?: number;
  retryFailed?: boolean;
}

export interface ProcessEmailQueueResponse {
  success: boolean;
  message: string;
  results?: {
    processed: number;
    sent: number;
    failed: number;
    retried: number;
  };
}

// Content report function types
export interface ContentReportRequest {
  reportedContentId: string;
  reportedContentType: 'anime' | 'manga' | 'review' | 'comment';
  reportReason: string;
  description?: string;
  reporterUserId: string;
}

export interface ContentReportResponse {
  success: boolean;
  message: string;
  reportId: string;
  moderationRequired: boolean;
}

// Analytics function types
export interface AnalyticsRequest {
  startDate?: string;
  endDate?: string;
  granularity?: 'hourly' | 'daily' | 'weekly' | 'monthly';
  metrics?: string[];
}

export interface AnalyticsResponse {
  success: boolean;
  data: {
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
        score: number;
        popularity: number;
      }>;
    };
    searchMetrics: {
      totalSearches: number;
      aiSearches: number;
      popularQueries: string[];
      successRate: number;
    };
  };
  generatedAt: string;
}

// Health check function types
export interface HealthCheckResponse {
  success: boolean;
  status: 'healthy' | 'degraded' | 'unhealthy';
  checks: {
    database: boolean;
    auth: boolean;
    storage: boolean;
    externalApis: boolean;
  };
  version: string;
  timestamp: string;
}

// Type guards for edge function responses
export const isEdgeFunctionResponse = <T>(response: unknown): response is EdgeFunctionResponse<T> => {
  return (
    typeof response === 'object' &&
    response !== null &&
    'success' in response &&
    typeof (response as any).success === 'boolean'
  );
};

export const isSyncResponse = (response: unknown): response is SyncResponse => {
  return (
    isEdgeFunctionResponse(response) &&
    'message' in response &&
    typeof (response as any).message === 'string'
  );
};

export const isImageSyncResponse = (response: unknown): response is ImageSyncResponse => {
  return (
    isEdgeFunctionResponse(response) &&
    'message' in response &&
    typeof (response as any).message === 'string'
  );
};

// Error types for edge functions
export interface EdgeFunctionError {
  code: string;
  message: string;
  details?: string;
  correlationId?: string;
  timestamp: string;
  function: string;
}

export const isEdgeFunctionError = (error: unknown): error is EdgeFunctionError => {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    'message' in error &&
    'function' in error
  );
};