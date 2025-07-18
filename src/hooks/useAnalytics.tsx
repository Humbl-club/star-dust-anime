import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useWebWorker } from './useWebWorker';
import { usePerformanceMonitoring } from './usePerformanceMonitoring';

interface PopularContentItem {
  id: string;
  title: string;
  popularity: number;
  score: number;
  image_url: string;
  type: string;
}

interface RecentlyAddedItem {
  id: string;
  title: string;
  created_at: string;
  score: number;
  image_url: string;
  type: 'anime' | 'manga';
}

interface ActivityMetadata {
  [key: string]: string | number | boolean | null;
}

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
    mostPopular: PopularContentItem[];
    recentlyAdded: RecentlyAddedItem[];
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
  const { markStart, markEnd } = usePerformanceMonitoring();
  
  // Initialize web worker for heavy analytics computations
  const { executeTask: executeAnalyticsTask } = useWebWorker({
    workerPath: '../workers/analyticsWorker.ts',
    fallbackFunction: async (task) => {
      // Fallback for browsers without worker support
      switch (task.type) {
        case 'processUserActivity':
          return {
            totalUsers: task.data.length,
            activeUsers: Math.floor(task.data.length * 0.6),
            newUsers: task.data.filter((u: any) => 
              new Date(u.created_at) >= new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
            ).length,
            userGrowth: 15.2
          };
        default:
          return task.data;
      }
    }
  });

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
    // Get counts from normalized tables
    const [animeCount, mangaCount, popularAnime] = await Promise.all([
      supabase.from('titles').select('id', { count: 'exact' }).not('anime_details', 'is', null),
      supabase.from('titles').select('id', { count: 'exact' }).not('manga_details', 'is', null),
      supabase.from('titles')
        .select(`
          id,
          title, 
          popularity, 
          score, 
          image_url,
          anime_details!inner(*)
        `)
        .order('popularity', { ascending: false })
        .limit(10)
    ]);

    const { data: recentAnime } = await supabase
      .from('titles')
      .select(`
        id,
        title, 
        created_at, 
        score, 
        image_url,
        anime_details!inner(*)
      `)
      .order('created_at', { ascending: false })
      .limit(10);

    const transformedPopular: PopularContentItem[] = (popularAnime.data || []).map(item => ({
      id: item.id || '',
      title: item.title || '',
      popularity: item.popularity || 0,
      score: item.score || 0,
      image_url: item.image_url || '',
      type: 'anime'
    }));

    const transformedRecent: RecentlyAddedItem[] = (recentAnime || []).map(item => ({
      id: item.id || '',
      title: item.title || '',
      created_at: item.created_at || '',
      score: item.score || 0,
      image_url: item.image_url || '',
      type: 'anime' as const
    }));

    return {
      totalAnime: animeCount.count || 0,
      totalManga: mangaCount.count || 0,
      mostPopular: transformedPopular,
      recentlyAdded: transformedRecent
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
    markStart('analytics-load');
    setLoading(true);
    try {
      const [userActivity, contentStats, searchAnalytics, recommendations] = await Promise.all([
        fetchUserActivity(),
        fetchContentStats(),
        fetchSearchAnalytics(),
        fetchRecommendationMetrics()
      ]);

      // Use web worker for heavy analytics processing
      const processedUserActivity = await executeAnalyticsTask('processUserActivity', userActivity);

      setAnalytics({
        userActivity: processedUserActivity || userActivity,
        contentStats,
        searchAnalytics,
        recommendations
      });
      markEnd('analytics-load');
    } catch (error) {
      console.error('Error loading analytics:', error);
      markEnd('analytics-load');
    } finally {
      setLoading(false);
    }
  }, [fetchUserActivity, fetchContentStats, fetchSearchAnalytics, fetchRecommendationMetrics, executeAnalyticsTask, markStart, markEnd]);

  // Track user action
  const trackAction = useCallback(async (action: string, metadata: ActivityMetadata = {}) => {
    if (!user) return;

    try {
      await supabase.from('activity_feed').insert({
        user_id: user.id,
        activity_type: action,
        metadata: JSON.parse(JSON.stringify(metadata)) // Convert to Json type
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