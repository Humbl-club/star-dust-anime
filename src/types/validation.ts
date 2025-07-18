// Form Validation Schemas with Zod Integration
import { z } from 'zod';

// User Profile Validation Schemas
export const profileSchema = z.object({
  full_name: z.string().min(1, 'Full name is required').max(100, 'Name too long'),
  username: z.string()
    .min(3, 'Username must be at least 3 characters')
    .max(20, 'Username must be less than 20 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
  bio: z.string().max(500, 'Bio must be less than 500 characters').optional(),
  location: z.string().max(100, 'Location must be less than 100 characters').optional(),
  birth_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format').optional(),
  avatar_url: z.string().url('Invalid URL format').optional()
});

export const emailSchema = z.object({
  email: z.string().email('Invalid email format').min(1, 'Email is required')
});

export const passwordSchema = z.object({
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character')
});

export const signUpSchema = z.object({
  email: emailSchema.shape.email,
  password: passwordSchema.shape.password,
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
});

export const loginSchema = z.object({
  email: emailSchema.shape.email,
  password: z.string().min(1, 'Password is required')
});

// Content Validation Schemas
export const reviewSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100, 'Title too long'),
  content: z.string().min(10, 'Review must be at least 10 characters').max(5000, 'Review too long'),
  rating: z.number().min(1, 'Rating must be at least 1').max(10, 'Rating must be at most 10'),
  spoiler_warning: z.boolean().default(false)
});

export const commentSchema = z.object({
  content: z.string().min(1, 'Comment cannot be empty').max(1000, 'Comment too long')
});

export const listEntrySchema = z.object({
  title_id: z.string().uuid('Invalid title ID'),
  status_id: z.string().uuid('Invalid status ID'),
  score: z.number().min(0).max(10).optional(),
  episodes_watched: z.number().min(0).optional(),
  chapters_read: z.number().min(0).optional(),
  volumes_read: z.number().min(0).optional(),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format').optional(),
  finish_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format').optional(),
  notes: z.string().max(1000, 'Notes too long').optional()
});

// Search and Filter Validation Schemas
export const searchFiltersSchema = z.object({
  contentType: z.enum(['anime', 'manga']),
  search: z.string().max(100, 'Search term too long').optional(),
  genre: z.string().max(50, 'Genre name too long').optional(),
  status: z.string().max(50, 'Status too long').optional(),
  type: z.string().max(50, 'Type too long').optional(),
  year: z.string().regex(/^\d{4}$/, 'Invalid year format').optional(),
  season: z.enum(['Spring', 'Summer', 'Fall', 'Winter']).optional(),
  sort_by: z.enum(['score', 'popularity', 'title', 'year', 'episodes', 'chapters']).default('score'),
  order: z.enum(['asc', 'desc']).default('desc'),
  page: z.number().min(1, 'Page must be at least 1').default(1),
  limit: z.number().min(1, 'Limit must be at least 1').max(100, 'Limit too high').default(20)
});

// Report Validation Schema
export const contentReportSchema = z.object({
  reported_content_id: z.string().uuid('Invalid content ID'),
  reported_content_type: z.enum(['anime', 'manga', 'review', 'comment']),
  report_reason: z.enum([
    'inappropriate_content',
    'spam',
    'harassment',
    'misinformation',
    'copyright_violation',
    'other'
  ]),
  description: z.string().max(1000, 'Description too long').optional()
});

// Settings and Preferences Validation Schemas
export const userPreferencesSchema = z.object({
  list_visibility: z.enum(['public', 'private', 'friends_only']).default('public'),
  preferred_genres: z.array(z.string()).max(10, 'Too many preferred genres'),
  excluded_genres: z.array(z.string()).max(10, 'Too many excluded genres'),
  auto_add_sequels: z.boolean().default(true),
  show_adult_content: z.boolean().default(false),
  privacy_level: z.enum(['public', 'private', 'limited']).default('public'),
  notification_settings: z.object({
    email: z.boolean().default(true),
    push: z.boolean().default(true),
    follows: z.boolean().default(true),
    reviews: z.boolean().default(true)
  })
});

export const contentPreferencesSchema = z.object({
  content_rating_preference: z.enum(['all', 'teen', 'mature']).default('teen'),
  show_adult_content: z.boolean().default(false),
  age_verified: z.boolean().default(false),
  age_verification_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format').optional()
});

// API Request Validation Schemas
export const apiDataRequestSchema = z.object({
  contentType: z.enum(['anime', 'manga']),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
  search: z.string().max(100).optional(),
  genre: z.string().max(50).optional(),
  status: z.string().max(50).optional(),
  type: z.string().max(50).optional(),
  year: z.string().regex(/^\d{4}$/).optional(),
  season: z.enum(['Spring', 'Summer', 'Fall', 'Winter']).optional(),
  sort_by: z.string().max(20).default('score'),
  order: z.enum(['asc', 'desc']).default('desc'),
  autoFetch: z.boolean().default(true)
});

export const syncRequestSchema = z.object({
  contentType: z.enum(['anime', 'manga']),
  maxPages: z.number().min(1).max(50).default(1),
  forceRefresh: z.boolean().default(false)
});

// Type exports for validated data
export type ProfileData = z.infer<typeof profileSchema>;
export type EmailData = z.infer<typeof emailSchema>;
export type PasswordData = z.infer<typeof passwordSchema>;
export type SignUpData = z.infer<typeof signUpSchema>;
export type LoginData = z.infer<typeof loginSchema>;
export type ReviewData = z.infer<typeof reviewSchema>;
export type CommentData = z.infer<typeof commentSchema>;
export type ListEntryData = z.infer<typeof listEntrySchema>;
export type SearchFiltersData = z.infer<typeof searchFiltersSchema>;
export type ContentReportData = z.infer<typeof contentReportSchema>;
export type UserPreferencesData = z.infer<typeof userPreferencesSchema>;
export type ContentPreferencesData = z.infer<typeof contentPreferencesSchema>;
export type ApiDataRequestData = z.infer<typeof apiDataRequestSchema>;
export type SyncRequestData = z.infer<typeof syncRequestSchema>;

// Validation helper functions
export const validateProfile = (data: unknown): ProfileData => {
  return profileSchema.parse(data);
};

export const validateEmail = (data: unknown): EmailData => {
  return emailSchema.parse(data);
};

export const validatePassword = (data: unknown): PasswordData => {
  return passwordSchema.parse(data);
};

export const validateSignUp = (data: unknown): SignUpData => {
  return signUpSchema.parse(data);
};

export const validateLogin = (data: unknown): LoginData => {
  return loginSchema.parse(data);
};

export const validateReview = (data: unknown): ReviewData => {
  return reviewSchema.parse(data);
};

export const validateComment = (data: unknown): CommentData => {
  return commentSchema.parse(data);
};

export const validateListEntry = (data: unknown): ListEntryData => {
  return listEntrySchema.parse(data);
};

export const validateSearchFilters = (data: unknown): SearchFiltersData => {
  return searchFiltersSchema.parse(data);
};

export const validateContentReport = (data: unknown): ContentReportData => {
  return contentReportSchema.parse(data);
};

export const validateUserPreferences = (data: unknown): UserPreferencesData => {
  return userPreferencesSchema.parse(data);
};

export const validateContentPreferences = (data: unknown): ContentPreferencesData => {
  return contentPreferencesSchema.parse(data);
};

export const validateApiDataRequest = (data: unknown): ApiDataRequestData => {
  return apiDataRequestSchema.parse(data);
};

export const validateSyncRequest = (data: unknown): SyncRequestData => {
  return syncRequestSchema.parse(data);
};