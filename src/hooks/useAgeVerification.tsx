import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface ContentPreferences {
  age_verified: boolean;
  show_adult_content: boolean;
  content_rating_preference: 'all' | 'teen' | 'mature' | 'adult';
}

export const useAgeVerification = () => {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState<ContentPreferences | null>(null);
  const [isVerified, setIsVerified] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPreferences = async () => {
      if (!user) {
        // For non-authenticated users, check if they've already verified age
        const hasVerified = localStorage.getItem('age_verified');
        setIsVerified(!!hasVerified);
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('user_content_preferences')
          .select('age_verified, show_adult_content, content_rating_preference')
          .eq('user_id', user.id)
          .maybeSingle();

        if (data) {
          setPreferences(data as ContentPreferences);
          setIsVerified(data.age_verified || false);
        } else {
          // No preferences found, user needs to verify age
          setIsVerified(false);
        }
      } catch (error) {
        console.error('Error fetching preferences:', error);
        setIsVerified(false);
      }
      
      setLoading(false);
    };

    fetchPreferences();
  }, [user]);

  const shouldShowContent = (contentRating?: string) => {
    if (!preferences || !isVerified) return false;
    
    if (!contentRating) return true; // No rating = safe to show
    
    const userLevel = preferences.content_rating_preference;
    
    // Map content ratings to numeric levels for comparison
    const ratingLevels = {
      'all': 0,
      'teen': 1,
      'mature': 2,
      'adult': 3
    };
    
    const contentLevel = ratingLevels[contentRating.toLowerCase() as keyof typeof ratingLevels] ?? 0;
    const userLevelNum = ratingLevels[userLevel] ?? 0;
    
    return contentLevel <= userLevelNum;
  };

  const updatePreferences = (newPreferences: Partial<ContentPreferences>) => {
    setPreferences(prev => prev ? { ...prev, ...newPreferences } : null);
    if (newPreferences.age_verified !== undefined) {
      setIsVerified(newPreferences.age_verified);
    }
  };

  return {
    preferences,
    isVerified,
    loading,
    shouldShowContent,
    updatePreferences
  };
};