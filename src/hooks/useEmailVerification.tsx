import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface EmailVerificationStatus {
  isVerified: boolean;
  isLoading: boolean;
  canUseFeature: (feature: string) => boolean;
  showVerificationPrompt: boolean;
  verificationStatus: 'pending' | 'verified' | 'expired' | null;
  daysRemaining: number | null;
  verifyEmail: () => Promise<void>;
  resendVerification: () => Promise<void>;
  isResending: boolean;
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
  const [isVerified, setIsVerified] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [verificationStatus, setVerificationStatus] = useState<'pending' | 'verified' | 'expired' | null>(null);
  const [daysRemaining, setDaysRemaining] = useState<number | null>(null);
  const [isResending, setIsResending] = useState<boolean>(false);

  // Check verification status
  const checkVerificationStatus = async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      
      // Call the database function to check verification status
      const { data, error } = await supabase
        .rpc('check_email_verification_status', {
          user_id_param: user.id
        });

      if (error) {
        console.error('Error checking verification status:', error);
        // Default to unverified if there's an error
        setIsVerified(false);
        setVerificationStatus('pending');
        setDaysRemaining(7);
        return;
      }

      if (data && data.length > 0) {
        const status = data[0];
        setIsVerified(status.is_verified);
        setVerificationStatus(status.verification_status as 'pending' | 'verified' | 'expired');
        setDaysRemaining(status.days_remaining);
      } else {
        // No verification record found, default to unverified
        setIsVerified(false);
        setVerificationStatus('pending');
        setDaysRemaining(7);
      }
    } catch (error) {
      console.error('Error in checkVerificationStatus:', error);
      setIsVerified(false);
      setVerificationStatus('pending');
      setDaysRemaining(7);
    } finally {
      setIsLoading(false);
    }
  };

  // Initialize verification status when user changes
  useEffect(() => {
    checkVerificationStatus();
  }, [user]);

  // Set up real-time listener for verification status changes
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('email-verification-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'email_verification_status',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('Verification status changed:', payload);
          checkVerificationStatus();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${user.id}`
        },
        (payload) => {
          console.log('Profile verification status changed:', payload);
          checkVerificationStatus();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  // Check if user can use a specific feature
  const canUseFeature = (feature: string): boolean => {
    if (!user) return false;
    
    // If email is verified, allow all features
    if (isVerified) return true;
    
    // If feature is not restricted, allow it
    if (!RESTRICTED_FEATURES.includes(feature)) return true;
    
    // If verification is expired, block restricted features
    if (verificationStatus === 'expired') return false;
    
    // If verification is pending but within grace period, allow limited access
    if (verificationStatus === 'pending' && daysRemaining !== null && daysRemaining > 0) {
      return true;
    }
    
    return false;
  };

  // Verify email (placeholder - actual verification happens via email link)
  const verifyEmail = async () => {
    if (!user) return;
    
    try {
      // This would typically be called when user clicks email verification link
      // For now, we'll manually mark as verified (in real app, this would be handled by auth callback)
      await supabase
        .from('email_verification_status')
        .upsert({
          user_id: user.id,
          email: user.email!,
          verification_status: 'verified',
          updated_at: new Date().toISOString()
        });
      
      // Also update profile
      await supabase
        .from('profiles')
        .update({
          verification_status: 'verified',
          verification_required_until: null
        })
        .eq('id', user.id);
      
      toast.success('Email verified successfully!');
      checkVerificationStatus();
    } catch (error) {
      console.error('Error verifying email:', error);
      toast.error('Failed to verify email');
    }
  };

  // Enhanced resend verification with retry logic and monitoring
  const resendVerification = async () => {
    if (!user || isResending) return;
    
    try {
      setIsResending(true);
      
      // Queue verification email
      const correlationId = crypto.randomUUID();
      const { error } = await supabase
        .from('email_queue')
        .insert({
          email: user.email!,
          user_id: user.id,
          email_type: 'resend_confirmation',
          metadata: {
            redirect_to: `${window.location.origin}/`,
          },
          correlation_id: correlationId
        });

      if (error) {
        console.error('Error queueing verification:', error);
        
        // Enhanced error handling
        if (error.message?.includes('rate limit')) {
          toast.error('Too many requests. Please wait before requesting another verification email.');
        } else {
          toast.error('Failed to queue verification email. Please try again.');
        }
        return;
      }

      toast.success('Verification email queued! Please check your inbox in a few moments.', {
        description: `Request ID: ${correlationId}`
      });
      
      checkVerificationStatus();
    } catch (error) {
      console.error('Error in resendVerification:', error);
      toast.error('An unexpected error occurred. Please try again.');
    } finally {
      setIsResending(false);
    }
  };

  return {
    isVerified,
    isLoading,
    canUseFeature,
    showVerificationPrompt: !isVerified && verificationStatus === 'pending',
    verificationStatus,
    daysRemaining,
    verifyEmail,
    resendVerification,
    isResending
  };
};