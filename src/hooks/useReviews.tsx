import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface Review {
  id: string;
  user_id: string;
  title_id: string;
  title?: string;
  content: string;
  rating?: number;
  spoiler_warning?: boolean;
  helpful_count?: number;
  created_at: string;
  updated_at?: string;
  profiles?: {
    username: string;
    full_name: string;
    avatar_url: string;
  };
}

export const useReviews = (titleId?: string) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchReviews = async () => {
    if (!titleId) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const { data, error: fetchError } = await supabase
        .from('reviews')
        .select(`
          *,
          profiles (
            username,
            full_name,
            avatar_url
          )
        `)
        .eq('title_id', titleId)
        .order('created_at', { ascending: false });
      
      if (fetchError) {
        throw fetchError;
      }
      
      setReviews(data || []);
    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching reviews:', err);
    } finally {
      setLoading(false);
    }
  };

  const addReview = async (reviewData: {
    title?: string;
    content: string;
    rating?: number;
    spoiler_warning?: boolean;
  }) => {
    if (!user || !titleId) return;

    try {
      const { error: insertError } = await supabase
        .from('reviews')
        .insert({
          user_id: user.id,
          title_id: titleId,
          title: reviewData.title,
          content: reviewData.content,
          rating: reviewData.rating,
          spoiler_warning: reviewData.spoiler_warning
        });

      if (insertError) {
        throw insertError;
      }

      await fetchReviews();
    } catch (err: any) {
      setError(err.message);
      console.error('Error adding review:', err);
      throw err;
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [titleId, user]);

  return {
    reviews,
    loading,
    error,
    addReview,
    refetch: fetchReviews
  };
};