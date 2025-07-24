import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RefreshCw, Sparkles, TrendingUp, Heart } from 'lucide-react';
import { AnimeCard } from './features/AnimeCard';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useUserTitleLists } from '@/hooks/useUserTitleLists';

interface RecommendedTitle {
  id: string;
  title: string;
  image_url: string;
  score: number;
  anilist_id: number;
  reason: string;
  confidence: number;
  recommendationType: 'genre' | 'similar' | 'trending';
}

export const RecommendedForYou = () => {
  const [recommendations, setRecommendations] = useState<RecommendedTitle[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const { user } = useAuth();
  const { titleLists } = useUserTitleLists();

  const generateRecommendations = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Get user's highly rated titles (score >= 8)
      const highRatedTitles = titleLists.filter(item => item.score && item.score >= 8);
      
      if (highRatedTitles.length === 0) {
        // Fallback to trending content
        await generateTrendingRecommendations();
        return;
      }

      // Get user's favorite genres from high-rated titles
      const genrePreferences = await getUserGenrePreferences(highRatedTitles);
      
      // Get similar titles and genre-based recommendations
      const [similarRecs, genreRecs, trendingRecs] = await Promise.all([
        getSimilarTitleRecommendations(highRatedTitles.slice(0, 3)),
        getGenreBasedRecommendations(genrePreferences),
        getTrendingRecommendations()
      ]);

      // Combine and shuffle recommendations
      const combined = [...similarRecs, ...genreRecs, ...trendingRecs];
      const shuffled = combined.sort(() => Math.random() - 0.5).slice(0, 20);
      
      setRecommendations(shuffled);
    } catch (error) {
      console.error('Error generating recommendations:', error);
    } finally {
      setLoading(false);
    }
  };

  const getUserGenrePreferences = async (highRatedTitles: any[]) => {
    const titleIds = highRatedTitles.map(t => t.title_id);
    
    const { data: genres } = await supabase
      .from('title_genres')
      .select('genre_id, genres(name)')
      .in('title_id', titleIds);

    const genreCounts: Record<string, number> = {};
    genres?.forEach(g => {
      const genreName = (g.genres as any)?.name;
      if (genreName) {
        genreCounts[genreName] = (genreCounts[genreName] || 0) + 1;
      }
    });

    return Object.entries(genreCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([genre]) => genre);
  };

  const getSimilarTitleRecommendations = async (recentTitles: any[]): Promise<RecommendedTitle[]> => {
    const recommendations: RecommendedTitle[] = [];
    
    for (const title of recentTitles) {
      try {
        const { data: similar } = await supabase.rpc('get_related_titles', {
          title_id_param: title.title_id,
          content_type: title.media_type,
          limit_param: 3
        });

        similar?.forEach((item: any) => {
          recommendations.push({
            ...item,
            reason: `Because you liked ${title.title?.title || 'a similar title'}`,
            confidence: 0.8,
            recommendationType: 'similar'
          });
        });
      } catch (error) {
        console.error('Error fetching similar titles:', error);
      }
    }

    return recommendations;
  };

  const getGenreBasedRecommendations = async (genres: string[]): Promise<RecommendedTitle[]> => {
    if (genres.length === 0) return [];

    try {
      const { data: genreBasedTitles } = await supabase
        .from('titles')
        .select(`
          id, title, image_url, score, anilist_id,
          title_genres!inner(genres!inner(name))
        `)
        .in('title_genres.genres.name', genres)
        .gte('score', 7)
        .order('score', { ascending: false })
        .limit(8);

      return genreBasedTitles?.map(item => ({
        id: item.id,
        title: item.title,
        image_url: item.image_url,
        score: item.score,
        anilist_id: item.anilist_id,
        reason: `Based on your genre preferences`,
        confidence: 0.7,
        recommendationType: 'genre' as const
      })) || [];
    } catch (error) {
      console.error('Error fetching genre-based recommendations:', error);
      return [];
    }
  };

  const getTrendingRecommendations = async (): Promise<RecommendedTitle[]> => {
    try {
      const { data: trending } = await supabase
        .from('titles')
        .select('id, title, image_url, score, anilist_id')
        .order('popularity', { ascending: false })
        .gte('score', 7.5)
        .limit(6);

      return trending?.map(item => ({
        id: item.id,
        title: item.title,
        image_url: item.image_url,
        score: item.score,
        anilist_id: item.anilist_id,
        reason: 'Currently trending',
        confidence: 0.6,
        recommendationType: 'trending' as const
      })) || [];
    } catch (error) {
      console.error('Error fetching trending recommendations:', error);
      return [];
    }
  };

  const generateTrendingRecommendations = async () => {
    const trending = await getTrendingRecommendations();
    setRecommendations(trending);
  };

  useEffect(() => {
    if (user && titleLists.length > 0) {
      generateRecommendations();
    }
  }, [user, titleLists.length]);

  const getRecommendationIcon = (type: string) => {
    switch (type) {
      case 'similar': return <Heart className="w-4 h-4" />;
      case 'genre': return <Sparkles className="w-4 h-4" />;
      case 'trending': return <TrendingUp className="w-4 h-4" />;
      default: return <Sparkles className="w-4 h-4" />;
    }
  };

  const filteredRecommendations = activeTab === 'all' 
    ? recommendations 
    : recommendations.filter(r => r.recommendationType === activeTab);

  if (!user) {
    return (
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm shadow-lg">
        <CardContent className="p-8 text-center">
          <p className="text-muted-foreground mb-4">Sign in to get personalized recommendations</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm shadow-lg">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Recommended For You
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={generateRecommendations}
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="similar">Similar</TabsTrigger>
            <TabsTrigger value="genre">Genre</TabsTrigger>
            <TabsTrigger value="trending">Trending</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-6">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : filteredRecommendations.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {filteredRecommendations.map((rec, index) => (
                  <div key={rec.id} className="space-y-2">
                    <div className="animate-fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
                      <AnimeCard
                        anime={{
                          id: rec.id,
                          title: rec.title,
                          image_url: rec.image_url,
                          score: rec.score,
                          anilist_id: rec.anilist_id,
                          genres: [],
                          studios: [],
                          synopsis: '',
                          episodes: 0,
                          status: '',
                          type: 'TV',
                          year: null,
                          mal_id: rec.anilist_id,
                          title_english: '',
                          title_japanese: '',
                          scored_by: 0,
                          rank: null,
                          popularity: null,
                          members: null,
                          favorites: null
                        }}
                      />
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      {getRecommendationIcon(rec.recommendationType)}
                      <span className="text-muted-foreground truncate">{rec.reason}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">No recommendations available</p>
                <p className="text-sm text-muted-foreground">
                  Try rating some anime or manga to get personalized suggestions!
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};