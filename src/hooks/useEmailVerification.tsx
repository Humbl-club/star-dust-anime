import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';

export interface EmailVerificationStatus {
  isVerified: boolean;
  isLoading: boolean;
  canUseFeature: (feature: string) => boolean;
  showVerificationPrompt: boolean;
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
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [showVerificationPrompt, setShowVerificationPrompt] = useState(false);

  useEffect(() => {
    if (user) {
      setIsLoading(false);
      
      // Check if user just signed up but email is not verified
      const justSignedUp = sessionStorage.getItem('justSignedUp');
      if (justSignedUp && !user.email_confirmed_at) {
        setShowVerificationPrompt(true);
        sessionStorage.removeItem('justSignedUp');
      }
    } else {
      setIsLoading(false);
    }
  }, [user]);

  const isVerified = user?.email_confirmed_at != null;

  const canUseFeature = (feature: string): boolean => {
    if (!user) return false;
    if (isVerified) return true;
    return !RESTRICTED_FEATURES.includes(feature);
  };

  return {
    isVerified,
    isLoading,
    canUseFeature,
    showVerificationPrompt: !isVerified && !!user
  };
};