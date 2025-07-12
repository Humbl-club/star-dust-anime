import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

interface RecommendationItem {
  id: string;
  title: string;
  score: number;
  image_url: string;
  genres: string[];
  synopsis: string;
  recommendationType: 'ai' | 'collaborative' | 'content' | 'trending';
  confidence: number;
}

export const useHybridRecommendations = () => {
  const [recommendations, setRecommendations] = useState<RecommendationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  // Content-based recommendations (75% of results)
  const getContentBasedRecs = useCallback(async (contentType: 'anime' | 'manga', limit: number) => {
    if (!user) return [];

    // Get user's highest rated content using unified table
    const { data: userList } = await supabase
      .from('user_title_lists')
      .select(`
        *,
        titles!inner(*),
        anime_details:titles!inner(anime_details(*)),
        manga_details:titles!inner(manga_details(*))
      `)
      .eq('user_id', user.id)
      .eq('media_type', contentType)
      .gte('score', 8)
      .order('score', { ascending: false })
      .limit(10);

    if (!userList?.length) return [];

    // Extract preferred genres from top-rated content
    const preferredGenres = new Set<string>();
    const consumedIds: string[] = [];
    
    userList.forEach((item: any) => {
      const content = item[contentType];
      if (content) {
        consumedIds.push(content.id);
        if (content.genres && Array.isArray(content.genres)) {
          content.genres.forEach((genre: string) => preferredGenres.add(genre));
        }
      }
    });

    const genreArray = Array.from(preferredGenres).slice(0, 5);
    
    if (genreArray.length === 0 || consumedIds.length === 0) {
      return [];
    }

    // Find similar content by genre using normalized tables
    const joinCondition = contentType === 'anime' 
      ? 'anime_details!inner(*)'
      : 'manga_details!inner(*)';
    
    const { data: similar } = await supabase
      .from('titles')
      .select(`*, ${joinCondition}`)
      .not('id', 'in', `(${consumedIds.join(',')})`)
      .gte('score', 7)
      .order('score', { ascending: false })
      .limit(limit);

    return (similar || []).map(item => ({
      ...item,
      recommendationType: 'content' as const,
      confidence: 0.8
    }));
  }, [user]);

  // Trending recommendations
  const getTrendingRecs = useCallback(async (contentType: 'anime' | 'manga', limit: number) => {
    const joinCondition = contentType === 'anime' 
      ? 'anime_details!inner(*)'
      : 'manga_details!inner(*)';
    
    const { data: trending } = await supabase
      .from('titles')
      .select(`*, ${joinCondition}`)
      .order('popularity', { ascending: false })
      .gte('score', 7.5)
      .limit(limit);

    return (trending || []).map(item => ({
      ...item,
      recommendationType: 'trending' as const,
      confidence: 0.6
    }));
  }, []);

  // AI recommendations (25% of results, rate limited)
  const getAIRecs = useCallback(async (contentType: 'anime' | 'manga', limit: number) => {
    if (!user) return [];

    try {
      const { data, error } = await supabase.functions.invoke('ai-recommendations', {
        body: { userId: user.id, contentType, count: limit }
      });

      if (error) throw error;

      return (data?.recommendations || []).map((rec: any) => ({
        ...rec.content,
        recommendationType: 'ai' as const,
        confidence: rec.confidence_score || 0.9
      }));
    } catch (error) {
      console.error('AI recommendations error:', error);
      return [];
    }
  }, [user]);

  const generateRecommendations = useCallback(async (contentType: 'anime' | 'manga' = 'anime') => {
    if (!user) {
      toast.error('Please sign in to get recommendations');
      return;
    }

    setLoading(true);

    try {
      // Hybrid approach: 75% algorithmic, 25% AI
      const [contentBased, trending, aiRecs] = await Promise.all([
        getContentBasedRecs(contentType, 12), // 60% content-based
        getTrendingRecs(contentType, 6),      // 30% trending
        getAIRecs(contentType, 4)             // 10% AI (reduced from 25% for cost)
      ]);

      // Combine and shuffle recommendations
      const combined = [...contentBased, ...trending, ...aiRecs];
      const shuffled = combined.sort(() => Math.random() - 0.5).slice(0, 20);

      setRecommendations(shuffled);

      if (shuffled.length === 0) {
        toast.info('No recommendations available. Try rating some content first!');
      }

    } catch (error) {
      console.error('Error generating recommendations:', error);
      toast.error('Failed to generate recommendations');
    } finally {
      setLoading(false);
    }
  }, [user, getContentBasedRecs, getTrendingRecs, getAIRecs]);

  // Auto-generate recommendations on user change
  useEffect(() => {
    if (user) {
      generateRecommendations();
    }
  }, [user, generateRecommendations]);

  return {
    recommendations,
    loading,
    generateRecommendations,
    refreshRecommendations: () => generateRecommendations()
  };
};