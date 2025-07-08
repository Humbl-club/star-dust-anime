import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

export const useFirstTimeUser = () => {
  const { user } = useAuth();
  const [isFirstTime, setIsFirstTime] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkFirstTimeUser = async () => {
      if (!user?.id) {
        setLoading(false);
        return;
      }

      try {
        // Check if user has is_first_login flag set to true
        const { data, error } = await supabase
          .from('user_points')
          .select('is_first_login')
          .eq('user_id', user.id)
          .single();

        if (error) {
          console.error('Error checking first time user:', error);
          setIsFirstTime(false);
        } else {
          setIsFirstTime(data?.is_first_login ?? false);
        }
      } catch (error) {
        console.error('Error in checkFirstTimeUser:', error);
        setIsFirstTime(false);
      } finally {
        setLoading(false);
      }
    };

    checkFirstTimeUser();
  }, [user?.id]);

  const markAsReturningUser = async () => {
    if (!user?.id) return;

    try {
      await supabase
        .from('user_points')
        .update({ is_first_login: false })
        .eq('user_id', user.id);
      
      setIsFirstTime(false);
    } catch (error) {
      console.error('Error marking as returning user:', error);
    }
  };

  return {
    isFirstTime,
    loading,
    markAsReturningUser
  };
};