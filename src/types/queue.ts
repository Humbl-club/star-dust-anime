// Email Queue System Types
import { Database } from '@/integrations/supabase/types';

export interface EmailQueueItem {
  id: string;
  email: string;
  user_id: string;
  email_type: 'verification' | 'password_reset' | 'confirmation' | 'welcome' | 'resend_confirmation';
  status: 'pending' | 'sent' | 'failed' | 'retrying';
  retry_count: number;
  correlation_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  next_retry_at: string | null;
  error_message: string | null;
}

export interface EmailDeliveryTracking {
  id: string;
  user_id: string;
  email: string;
  email_type: string;
  delivery_status: 'queued' | 'sent' | 'delivered' | 'bounced' | 'failed';
  provider: string;
  external_id: string | null;
  correlation_id: string;
  sent_at: string | null;
  delivered_at: string | null;
  failed_at: string | null;
  retry_count: number;
  error_message: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface EmailSent {
  id: string;
  user_id: string;
  email: string;
  email_type: string;
  correlation_id: string | null;
  metadata: Record<string, unknown>;
  sent_at: string;
}

export interface EmailVerificationStatus {
  id: string;
  user_id: string;
  email: string;
  verification_status: 'pending' | 'verified' | 'expired' | 'failed';
  verification_token: string | null;
  verification_sent_at: string;
  verification_expires_at: string;
  verification_attempts: number;
  last_attempt_at: string | null;
  created_at: string;
  updated_at: string;
}

// Queue Operation Types
export interface QueueMetrics {
  totalPending: number;
  totalSent: number;
  totalFailed: number;
  retryingCount: number;
  avgDeliveryTime: number;
  successRate: number;
}

export interface EmailQueueResult {
  success: boolean;
  message: string;
  emailId?: string;
  correlationId?: string;
  estimatedDelivery?: string;
}

export interface BulkEmailOperation {
  operation: 'send' | 'retry' | 'cancel';
  emailIds: string[];
  reason?: string;
  metadata?: Record<string, unknown>;
}

// Type guards for queue items
export const isEmailQueueItem = (item: unknown): item is EmailQueueItem => {
  return (
    typeof item === 'object' &&
    item !== null &&
    'id' in item &&
    'email' in item &&
    'user_id' in item &&
    'email_type' in item &&
    'status' in item
  );
};

export const isEmailDeliveryTracking = (item: unknown): item is EmailDeliveryTracking => {
  return (
    typeof item === 'object' &&
    item !== null &&
    'id' in item &&
    'delivery_status' in item &&
    'provider' in item
  );
};

// Email template types
export interface EmailTemplate {
  name: string;
  subject: string;
  htmlContent: string;
  textContent?: string;
  variables: string[];
}

export interface EmailContext {
  user: {
    id: string;
    email: string;
    full_name?: string;
  };
  template: EmailTemplate;
  variables: Record<string, string>;
  correlationId: string;
}