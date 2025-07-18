// Central exports for all TypeScript types

// API Types
export type { 
  AnalyticsData, 
  PopularContentItem, 
  ContentItem, 
  SyncResponse, 
  ErrorResponse,
  BaseContent,
  AnimeContent,
  MangaContent,
  PaginationInfo,
  ApiResponse,
  UseEnhancedQueryOptions,
  UseEnhancedQueryResult,
  UseApiDataOptions,
  UseApiDataResult,
  SupabaseFunctionResponse
} from './api';

// Component Types
export type { 
  AnimeCardProps, 
  AnalyticsChartsProps, 
  StatCardProps,
  AddToListButtonProps,
  FilterOptions,
  SEOMetaTagsProps,
  ContentReportModalProps,
  DropdownResult,
  NavigationHandler,
  FormEventHandler,
  ClickEventHandler,
  ChangeEventHandler,
  SubmitEventHandler
} from './components';

// Hook Types
export type { 
  AnimeDetailData, 
  MangaDetailData, 
  UseAnimeDetailResult, 
  UseMangaDetailResult,
  AnalyticsResults,
  UseAnalyticsResult,
  AsyncActionHandler,
  DataTransformer,
  ErrorHandler,
  RefreshHandler
} from './hooks';

// Service Types
export type { 
  PasswordValidationResult, 
  EmailValidationResult, 
  CorrelationContext, 
  ErrorContext,
  ClassifiedError,
  AuthenticationResult,
  ValidationError,
  ServiceResponse
} from './services';

// Queue Types
export type {
  EmailQueueItem,
  EmailDeliveryTracking,
  EmailSent,
  EmailVerificationStatus,
  QueueMetrics,
  EmailQueueResult,
  BulkEmailOperation,
  EmailTemplate,
  EmailContext
} from './queue';

// Edge Function Types
export type {
  EdgeFunctionRequest,
  EdgeFunctionResponse,
  AuthEmailRequest,
  AuthEmailResponse,
  SyncRequest,
  ImageSyncRequest,
  AISearchRequest,
  AISearchResponse,
  BulkOperationRequest,
  BulkOperationResponse,
  ProcessEmailQueueRequest,
  ProcessEmailQueueResponse,
  ContentReportRequest,
  ContentReportResponse,
  AnalyticsRequest,
  AnalyticsResponse,
  HealthCheckResponse,
  EdgeFunctionError
} from './edge-functions';

// Validation Types
export type {
  ProfileData,
  EmailData,
  PasswordData,
  SignUpData,
  LoginData,
  ReviewData,
  CommentData,
  ListEntryData,
  SearchFiltersData,
  ContentReportData,
  UserPreferencesData,
  ContentPreferencesData,
  ApiDataRequestData,
  SyncRequestData
} from './validation';

// Validation Functions
export {
  validateProfile,
  validateEmail,
  validatePassword,
  validateSignUp,
  validateLogin,
  validateReview,
  validateComment,
  validateListEntry,
  validateSearchFilters,
  validateContentReport,
  validateUserPreferences,
  validateContentPreferences,
  validateApiDataRequest,
  validateSyncRequest,
  profileSchema,
  emailSchema,
  passwordSchema,
  signUpSchema,
  loginSchema,
  reviewSchema,
  commentSchema,
  listEntrySchema,
  searchFiltersSchema,
  contentReportSchema,
  userPreferencesSchema,
  contentPreferencesSchema,
  apiDataRequestSchema,
  syncRequestSchema
} from './validation';

// Type Guards
export * from './guards';

// Common utility types
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;
export type Nullable<T> = T | null;
export type Maybe<T> = T | undefined;
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

// Event handler types
export type AsyncHandler<T = void> = () => Promise<T>;
export type AsyncHandlerWithArgs<TArgs extends unknown[], TReturn = void> = (...args: TArgs) => Promise<TReturn>;

// Generic API types
export type ID = string | number;
export type Timestamp = string | Date;
export type MediaType = 'anime' | 'manga';
export type SortOrder = 'asc' | 'desc';

// Status types for consistency
export type AnimeStatusType = 'watching' | 'completed' | 'on_hold' | 'dropped' | 'plan_to_watch';
export type MangaStatusType = 'reading' | 'completed' | 'on_hold' | 'dropped' | 'plan_to_read';

// Error types for consistency
export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical';
export type ErrorType = 'network' | 'auth' | 'validation' | 'server' | 'client' | 'unknown';