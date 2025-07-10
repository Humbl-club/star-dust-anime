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
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [verificationStatus, setVerificationStatus] = useState<'pending' | 'verified' | 'expired' | null>(null);
  const [verificationRequiredUntil, setVerificationRequiredUntil] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchVerificationStatus();
    } else {
      setIsLoading(false);
      setVerificationStatus(null);
    }
  }, [user]);

  const fetchVerificationStatus = async () => {
    if (!user) return;
    
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('verification_status, verification_required_until')
        .eq('id', user.id)
        .single();

      if (profile) {
        setVerificationStatus(profile.verification_status as 'pending' | 'verified' | 'expired');
        setVerificationRequiredUntil(profile.verification_required_until);
      }
    } catch (error) {
      console.error('Error fetching verification status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const verifyEmail = async () => {
    if (!user) return;
    
    try {
      await supabase.rpc('verify_user_email', { user_id_param: user.id });
      setVerificationStatus('verified');
      setVerificationRequiredUntil(null);
    } catch (error) {
      console.error('Error verifying email:', error);
      throw error;
    }
  };

  const getDaysRemaining = (): number | null => {
    if (!verificationRequiredUntil || verificationStatus !== 'pending') return null;
    
    const now = new Date();
    const until = new Date(verificationRequiredUntil);
    const diffTime = until.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return Math.max(0, diffDays);
  };

  const isVerified = verificationStatus === 'verified';
  const showVerificationPrompt = user && verificationStatus === 'pending';

  const canUseFeature = (feature: string): boolean => {
    if (!user) return false;
    if (isVerified) return true;
    return !RESTRICTED_FEATURES.includes(feature);
  };

  return {
    isVerified,
    isLoading,
    canUseFeature,
    showVerificationPrompt: !!showVerificationPrompt,
    verificationStatus,
    daysRemaining: getDaysRemaining(),
    verifyEmail
  };
};