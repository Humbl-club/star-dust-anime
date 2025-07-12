import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface RecommendationItem {
  id: string;
  title: string;
  score: number;
  image_url: string;
  genres: string[];
  synopsis: string;
  reason: string;
  confidence: number;
  type: 'anime' | 'manga';
}

interface UserProfile {
  favoriteGenres: string[];
  averageScore: number;
  preferredTypes: string[];
  completedCount: number;
}

export const useSmartRecommendations = () => {
  const { user } = useAuth();
  const [recommendations, setRecommendations] = useState<RecommendationItem[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);

  const analyzeUserProfile = async (): Promise<UserProfile | null> => {
    if (!user) return null;

    try {
      // Get user's anime list
      const { data: animeList } = await supabase
        .from('user_anime_lists')
        .select(`
          score,
          status,
          anime_id,
          titles!inner(title, genres:title_genres(genres(name)))
        `)
        .eq('user_id', user.id)
        .not('score', 'is', null);

      // Get user's manga list
      const { data: mangaList } = await supabase
        .from('user_manga_lists')
        .select(`
          score,
          status,
          manga_id,
          titles!inner(title, genres:title_genres(genres(name)))
        `)
        .eq('user_id', user.id)
        .not('score', 'is', null);

      if (!animeList && !mangaList) return null;

      const allItems = [...(animeList || []), ...(mangaList || [])];
      const genreFrequency: { [key: string]: number } = {};
      let totalScore = 0;
      let scoredItems = 0;
      let completedCount = 0;
      const typePreferences: { [key: string]: number } = {};

      allItems.forEach((item: any) => {
        if (item.score) {
          totalScore += item.score;
          scoredItems++;
        }
        
        if (item.status === 'completed') {
          completedCount++;
        }

        // Count genre preferences
        if (item.titles?.genres) {
          item.titles.genres.forEach((genreObj: any) => {
            const genre = genreObj.genres?.name;
            if (genre) {
              genreFrequency[genre] = (genreFrequency[genre] || 0) + 1;
            }
          });
        }

        // Track type preferences
        const type = item.anime_id ? 'anime' : 'manga';
        typePreferences[type] = (typePreferences[type] || 0) + 1;
      });

      const favoriteGenres = Object.entries(genreFrequency)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .map(([genre]) => genre);

      const preferredTypes = Object.entries(typePreferences)
        .sort(([,a], [,b]) => b - a)
        .map(([type]) => type);

      return {
        favoriteGenres,
        averageScore: scoredItems > 0 ? totalScore / scoredItems : 0,
        preferredTypes,
        completedCount
      };
    } catch (error) {
      console.error('Error analyzing user profile:', error);
      return null;
    }
  };

  const generateRecommendations = async (): Promise<RecommendationItem[]> => {
    if (!userProfile || !user) return [];

    try {
      // Get titles user hasn't seen
      const { data: userAnimeEntries } = await supabase
        .from('user_anime_lists')
        .select(`
          anime_details:anime_detail_id (
            titles:title_id (
              anilist_id
            )
          )
        `)
        .eq('user_id', user.id);

      const { data: userMangaEntries } = await supabase
        .from('user_manga_lists')
        .select(`
          manga_details:manga_detail_id (
            titles:title_id (
              anilist_id
            )
          )
        `)
        .eq('user_id', user.id);

      const excludeAnimeIds = userAnimeEntries?.map(item => 
        item.anime_details?.titles?.anilist_id?.toString()
      ).filter(Boolean) || [];
      const excludeMangaIds = userMangaEntries?.map(item => 
        item.manga_details?.titles?.anilist_id?.toString()
      ).filter(Boolean) || [];

      // Get anime recommendations
      const animeRecommendations = await getContentRecommendations(
        'anime',
        userProfile,
        excludeAnimeIds
      );

      // Get manga recommendations  
      const mangaRecommendations = await getContentRecommendations(
        'manga',
        userProfile,
        excludeMangaIds
      );

      // Combine and sort by confidence
      const allRecommendations = [...animeRecommendations, ...mangaRecommendations]
        .sort((a, b) => b.confidence - a.confidence)
        .slice(0, 20);

      return allRecommendations;
    } catch (error) {
      console.error('Error generating recommendations:', error);
      return [];
    }
  };

  const getContentRecommendations = async (
    type: 'anime' | 'manga',
    profile: UserProfile,
    excludeIds: string[]
  ): Promise<RecommendationItem[]> => {
    const isAnime = type === 'anime';
    const tableName = isAnime ? 'anime_details' : 'manga_details';
    
    // Build query for high-rated content in user's favorite genres
    let query = supabase
      .from('titles')
      .select(`
        id,
        title,
        image_url,
        synopsis,
        score,
        ${tableName}!inner(*),
        genres:title_genres!inner(genres!inner(name))
      `)
      .gte('score', Math.max(profile.averageScore - 1, 6.0))
      .order('score', { ascending: false })
      .limit(50);

    if (excludeIds.length > 0) {
      query = query.not('id', 'in', `(${excludeIds.join(',')})`);
    }

    const { data: content } = await query;

    if (!content) return [];

    // Score each recommendation based on user preferences
    const recommendations: RecommendationItem[] = content.map((item: any) => {
      const itemGenres = item.genres?.map((g: any) => g.genres?.name).filter(Boolean) || [];
      
      // Calculate genre match score
      const genreMatches = itemGenres.filter(genre => 
        profile.favoriteGenres.includes(genre)
      ).length;
      
      const genreScore = genreMatches / Math.max(profile.favoriteGenres.length, 1);
      
      // Calculate overall confidence
      const scoreBonus = item.score ? (item.score - 5) / 5 : 0;
      const confidence = (genreScore * 0.7 + scoreBonus * 0.3) * 100;
      
      // Generate reason
      let reason = '';
      if (genreMatches > 0) {
        const matchedGenres = itemGenres.filter(genre => 
          profile.favoriteGenres.includes(genre)
        );
        reason = `Matches your favorite genres: ${matchedGenres.slice(0, 2).join(', ')}`;
      } else {
        reason = `Highly rated ${type} (${item.score}/10)`;
      }

      return {
        id: item.id,
        title: item.title,
        score: item.score || 0,
        image_url: item.image_url,
        genres: itemGenres,
        synopsis: item.synopsis || '',
        reason,
        confidence: Math.round(confidence),
        type
      };
    });

    return recommendations
      .filter(rec => rec.confidence > 30)
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 10);
  };

  const refreshRecommendations = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const profile = await analyzeUserProfile();
      setUserProfile(profile);
      
      if (profile) {
        const recs = await generateRecommendations();
        setRecommendations(recs);
      }
    } catch (error) {
      console.error('Error refreshing recommendations:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      refreshRecommendations();
    }
  }, [user]);

  return {
    recommendations,
    userProfile,
    loading,
    refreshRecommendations
  };
};