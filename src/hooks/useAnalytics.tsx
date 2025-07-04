import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface AnalyticsData {
  userActivity: {
    totalUsers: number;
    activeUsers: number;
    newUsers: number;
    userGrowth: number;
  };
  contentStats: {
    totalAnime: number;
    totalManga: number;
    mostPopular: any[];
    recentlyAdded: any[];
  };
  searchAnalytics: {
    totalSearches: number;
    aiSearches: number;
    popularQueries: string[];
    searchSuccessRate: number;
  };
  recommendations: {
    totalRecommendations: number;
    clickThroughRate: number;
    topRecommendedGenres: string[];
  };
}

export const useAnalytics = () => {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchUserActivity = useCallback(async () => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: profiles } = await supabase
      .from('profiles')
      .select('created_at')
      .order('created_at', { ascending: false });

    const totalUsers = profiles?.length || 0;
    const newUsers = profiles?.filter(p => 
      new Date(p.created_at) >= thirtyDaysAgo
    ).length || 0;

    // Mock active users calculation (would need activity tracking)
    const activeUsers = Math.floor(totalUsers * 0.6);
    const userGrowth = totalUsers > 0 ? (newUsers / totalUsers) * 100 : 0;

    return {
      totalUsers,
      activeUsers,
      newUsers,
      userGrowth
    };
  }, []);

  const fetchContentStats = useCallback(async () => {
    const [animeStats, mangaStats, popularAnime] = await Promise.all([
      supabase.from('anime_stats').select('*').single(),
      supabase.from('manga_stats').select('*').single(),
      supabase.from('anime')
        .select('title, popularity, score, image_url')
        .order('popularity', { ascending: false })
        .limit(10)
    ]);

    const { data: recentAnime } = await supabase
      .from('anime')
      .select('title, created_at, score, image_url')
      .order('created_at', { ascending: false })
      .limit(10);

    return {
      totalAnime: animeStats.data?.total_anime || 0,
      totalManga: mangaStats.data?.total_manga || 0,
      mostPopular: popularAnime.data || [],
      recentlyAdded: recentAnime || []
    };
  }, []);

  const fetchSearchAnalytics = useCallback(async () => {
    // Mock search analytics (would need search logging)
    return {
      totalSearches: 15420,
      aiSearches: 2840,
      popularQueries: ['naruto', 'attack on titan', 'demon slayer', 'one piece', 'jujutsu kaisen'],
      searchSuccessRate: 87.5
    };
  }, []);

  const fetchRecommendationMetrics = useCallback(async () => {
    // Mock recommendation analytics
    return {
      totalRecommendations: 8930,
      clickThroughRate: 23.5,
      topRecommendedGenres: ['Action', 'Adventure', 'Drama', 'Comedy', 'Romance']
    };
  }, []);

  const loadAnalytics = useCallback(async () => {
    setLoading(true);
    try {
      const [userActivity, contentStats, searchAnalytics, recommendations] = await Promise.all([
        fetchUserActivity(),
        fetchContentStats(),
        fetchSearchAnalytics(),
        fetchRecommendationMetrics()
      ]);

      setAnalytics({
        userActivity,
        contentStats,
        searchAnalytics,
        recommendations
      });
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  }, [fetchUserActivity, fetchContentStats, fetchSearchAnalytics, fetchRecommendationMetrics]);

  // Track user action
  const trackAction = useCallback(async (action: string, metadata: any = {}) => {
    if (!user) return;

    try {
      await supabase.from('activity_feed').insert({
        user_id: user.id,
        activity_type: action,
        metadata
      });
    } catch (error) {
      console.error('Error tracking action:', error);
    }
  }, [user]);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  return {
    analytics,
    loading,
    refreshAnalytics: loadAnalytics,
    trackAction
  };
};