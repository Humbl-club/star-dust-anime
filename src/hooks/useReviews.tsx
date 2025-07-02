import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Review {
  id: string;
  user_id: string;
  anime_id?: string;
  manga_id?: string;
  rating?: number;
  title?: string;
  content: string;
  spoiler_warning: boolean;
  helpful_count: number;
  created_at: string;
  updated_at: string;
  user?: {
    full_name?: string;
    username?: string;
    avatar_url?: string;
  };
}

export interface ReviewReaction {
  id: string;
  review_id: string;
  user_id: string;
  reaction_type: 'helpful' | 'unhelpful' | 'love' | 'funny';
  created_at: string;
}

export const useReviews = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  // Fetch reviews for a specific anime/manga
  const getReviews = async (contentId: string, contentType: 'anime' | 'manga') => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select(`
          *,
          profiles:user_id (
            full_name,
            username,
            avatar_url
          )
        `)
        .eq(contentType === 'anime' ? 'anime_id' : 'manga_id', contentId)
        .order('helpful_count', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Review[];
    } catch (error: any) {
      console.error('Error fetching reviews:', error);
      toast.error('Failed to load reviews');
      return [];
    } finally {
      setLoading(false);
    }
  };

  // Create a new review
  const createReview = async (
    contentId: string,
    contentType: 'anime' | 'manga',
    reviewData: {
      rating?: number;
      title?: string;
      content: string;
      spoiler_warning?: boolean;
    }
  ) => {
    if (!user) {
      toast.error('Please sign in to write a review');
      return null;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('reviews')
        .insert({
          user_id: user.id,
          [contentType === 'anime' ? 'anime_id' : 'manga_id']: contentId,
          ...reviewData
        })
        .select()
        .single();

      if (error) throw error;
      toast.success('Review published successfully!');
      return data;
    } catch (error: any) {
      console.error('Error creating review:', error);
      toast.error('Failed to publish review');
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Update a review
  const updateReview = async (reviewId: string, updates: Partial<Review>) => {
    if (!user) return null;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('reviews')
        .update(updates)
        .eq('id', reviewId)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      toast.success('Review updated successfully!');
      return data;
    } catch (error: any) {
      console.error('Error updating review:', error);
      toast.error('Failed to update review');
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Delete a review
  const deleteReview = async (reviewId: string) => {
    if (!user) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('reviews')
        .delete()
        .eq('id', reviewId)
        .eq('user_id', user.id);

      if (error) throw error;
      toast.success('Review deleted successfully');
    } catch (error: any) {
      console.error('Error deleting review:', error);
      toast.error('Failed to delete review');
    } finally {
      setLoading(false);
    }
  };

  // React to a review
  const reactToReview = async (reviewId: string, reactionType: ReviewReaction['reaction_type']) => {
    if (!user) {
      toast.error('Please sign in to react to reviews');
      return;
    }

    try {
      // Check if user already reacted with this type
      const { data: existingReaction } = await supabase
        .from('review_reactions')
        .select('id')
        .eq('review_id', reviewId)
        .eq('user_id', user.id)
        .eq('reaction_type', reactionType)
        .single();

      if (existingReaction) {
        // Remove reaction
        await supabase
          .from('review_reactions')
          .delete()
          .eq('id', existingReaction.id);
        
        // Update helpful count if it was helpful/unhelpful
        if (reactionType === 'helpful') {
          // Will implement helpful count update later
        }
      } else {
        // Add reaction
        await supabase
          .from('review_reactions')
          .insert({
            review_id: reviewId,
            user_id: user.id,
            reaction_type: reactionType
          });

        // Update helpful count if it's helpful
        if (reactionType === 'helpful') {
          // Will implement helpful count update later
        }
      }

      toast.success(`${reactionType} reaction ${existingReaction ? 'removed' : 'added'}!`);
    } catch (error: any) {
      console.error('Error reacting to review:', error);
      toast.error('Failed to react to review');
    }
  };

  // Get user's review for specific content
  const getUserReview = async (contentId: string, contentType: 'anime' | 'manga') => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .eq('user_id', user.id)
        .eq(contentType === 'anime' ? 'anime_id' : 'manga_id', contentId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    } catch (error: any) {
      console.error('Error fetching user review:', error);
      return null;
    }
  };

  return {
    loading,
    getReviews,
    createReview,
    updateReview,
    deleteReview,
    reactToReview,
    getUserReview
  };
};