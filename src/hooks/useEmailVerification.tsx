import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

export interface EmailVerificationStatus {
  isVerified: boolean;
  isLoading: boolean;
  canUseFeature: (feature: string) => boolean;
  showVerificationPrompt: boolean;
  verificationStatus: 'pending' | 'verified' | 'expired' | null;
  daysRemaining: number | null;
  verifyEmail: () => Promise<void>;
}

const RESTRICTED_FEATURES = [
  'add_to_list',
  'create_review',
  'rate_anime',
  'follow_users',
  'create_lists',
  'sync_anilist',
  'my_lists',
  'recommendations',
  'gamification',
  'analytics'
];

export const useEmailVerification = (): EmailVerificationStatus => {
  // MOCK EMAIL VERIFICATION FOR TESTING - ALWAYS VERIFIED
  const { user } = useAuth();
  
  const verifyEmail = async () => {
    // Mock verify function - does nothing in test mode
    console.log('Mock email verification - already verified for testing');
  };

  // Always return verified state for testing
  return {
    isVerified: true,
    isLoading: false,
    canUseFeature: () => true, // Always allow all features
    showVerificationPrompt: false,
    verificationStatus: 'verified',
    daysRemaining: null,
    verifyEmail
  };
};