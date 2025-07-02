import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Recommendation {
  id: string;
  user_id: string;
  anime_id?: string;
  manga_id?: string;
  recommendation_type: 'ai_generated' | 'similar_users' | 'trending' | 'genre_based';
  confidence_score: number;
  reason?: string;
  dismissed: boolean;
  created_at: string;
  content?: any;
}

export const useRecommendations = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);

  // Fetch user's recommendations
  const fetchRecommendations = async (contentType?: 'anime' | 'manga') => {
    if (!user) return;

    setLoading(true);
    try {
      let query = supabase
        .from('recommendations')
        .select(`
          *,
          anime:anime_id (*),
          manga:manga_id (*)
        `)
        .eq('user_id', user.id)
        .eq('dismissed', false)
        .order('confidence_score', { ascending: false });

      if (contentType) {
        query = query.not(contentType === 'anime' ? 'anime_id' : 'manga_id', 'is', null);
      }

      const { data, error } = await query.limit(20);

      if (error) throw error;
      
      // Merge content data
      const enrichedData = data?.map(rec => ({
        ...rec,
        content: rec.anime || rec.manga
      })) || [];
      
      setRecommendations(enrichedData as Recommendation[]);
    } catch (error: any) {
      console.error('Error fetching recommendations:', error);
      toast.error('Failed to load recommendations');
    } finally {
      setLoading(false);
    }
  };

  // Generate AI recommendations
  const generateAIRecommendations = async (contentType: 'anime' | 'manga', count = 5) => {
    if (!user) {
      toast.error('Please sign in to get recommendations');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-recommendations', {
        body: {
          userId: user.id,
          contentType,
          count
        }
      });

      if (error) throw error;
      
      if (data.success) {
        toast.success('AI recommendations generated!');
        await fetchRecommendations(contentType);
      } else {
        throw new Error(data.error || 'Failed to generate recommendations');
      }
    } catch (error: any) {
      console.error('Error generating AI recommendations:', error);
      toast.error('Failed to generate recommendations');
    } finally {
      setLoading(false);
    }
  };

  // Dismiss a recommendation
  const dismissRecommendation = async (recommendationId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('recommendations')
        .update({ dismissed: true })
        .eq('id', recommendationId)
        .eq('user_id', user.id);

      if (error) throw error;
      
      setRecommendations(prev => 
        prev.filter(rec => rec.id !== recommendationId)
      );
      
      toast.success('Recommendation dismissed');
    } catch (error: any) {
      console.error('Error dismissing recommendation:', error);
      toast.error('Failed to dismiss recommendation');
    }
  };

  // Generate genre-based recommendations
  const generateGenreRecommendations = async (contentType: 'anime' | 'manga') => {
    if (!user) return;

    setLoading(true);
    try {
      // Get user's preferences
      const { data: userLists } = await supabase
        .from(contentType === 'anime' ? 'user_anime_lists' : 'user_manga_lists')
        .select('*')
        .eq('user_id', user.id)
        .gte('score', 8);

      if (!userLists || userLists.length === 0) {
        toast.info('Rate some content first to get better recommendations');
        return;
      }

      // Get content details for highly rated items
      const contentIds = userLists.map(item => 
        contentType === 'anime' ? (item as any).anime_id : (item as any).manga_id
      );
      
      const { data: likedContent } = await supabase
        .from(contentType === 'anime' ? 'anime' : 'manga')
        .select('genres')
        .in('id', contentIds);

      // Count genre preferences
      const genreCount: Record<string, number> = {};
      likedContent?.forEach(content => {
        content.genres?.forEach((genre: string) => {
          genreCount[genre] = (genreCount[genre] || 0) + 1;
        });
      });

      // Get top genres
      const topGenres = Object.entries(genreCount)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 3)
        .map(([genre]) => genre);

      if (topGenres.length === 0) return;

      // Find recommendations based on top genres
      const { data: recommendations } = await supabase
        .from(contentType === 'anime' ? 'anime' : 'manga')
        .select('*')
        .overlaps('genres', topGenres)
        .not('id', 'in', `(${contentIds.join(',')})`)
        .order('score', { ascending: false })
        .limit(10);

      // Save genre-based recommendations
      if (recommendations && recommendations.length > 0) {
        const recsToSave = recommendations.map(content => ({
          user_id: user.id,
          [contentType === 'anime' ? 'anime_id' : 'manga_id']: content.id,
          recommendation_type: 'genre_based' as const,
          confidence_score: 0.7,
          reason: `Based on your love for ${topGenres.slice(0, 2).join(' and ')} ${contentType}`
        }));

        await supabase
          .from('recommendations')
          .upsert(recsToSave, { 
            onConflict: `user_id,${contentType}_id`,
            ignoreDuplicates: false 
          });

        toast.success('Genre-based recommendations updated!');
        await fetchRecommendations(contentType);
      }
    } catch (error: any) {
      console.error('Error generating genre recommendations:', error);
      toast.error('Failed to generate genre recommendations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchRecommendations();
    }
  }, [user]);

  return {
    loading,
    recommendations,
    fetchRecommendations,
    generateAIRecommendations,
    generateGenreRecommendations,
    dismissRecommendation
  };
};