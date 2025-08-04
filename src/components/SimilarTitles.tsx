import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useNamePreference } from '@/hooks/useNamePreference';

interface SimilarTitlesProps {
  titleId: string;
  contentType: 'anime' | 'manga';
  currentTitle: string;
}

interface SimilarTitle {
  id: string;
  title: string;
  image_url: string;
  score: number;
  anilist_id: number;
}

export const SimilarTitles = ({ titleId, contentType, currentTitle }: SimilarTitlesProps) => {
  const navigate = useNavigate();
  const [similarTitles, setSimilarTitles] = useState<SimilarTitle[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchSimilarTitles = async () => {
    setLoading(true);
    try {
      // First get the current title's genres
      const { data: currentData } = await supabase
        .from('titles')
        .select(`
          *,
          title_genres(genres(id, name))
        `)
        .eq('id', titleId)
        .single();

      if (!currentData) return;

      const genreIds = currentData.title_genres?.map(tg => tg.genres.id) || [];

      // Find similar titles based on genres and content type
      const { data: similar } = await supabase
        .from('titles')
        .select(`
          *,
          ${contentType === 'anime' ? 'anime_details(*)' : 'manga_details(*)'},
          title_genres!inner(genres!inner(id))
        `)
        .eq('content_type', contentType) // IMPORTANT: Filter by content type
        .neq('id', titleId)
        .in('title_genres.genres.id', genreIds)
        .gte('score', 6)
        .order('score', { ascending: false })
        .limit(12);

      setSimilarTitles(similar || []);
    } catch (error) {
      console.error('Error fetching similar titles:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (titleId) {
      fetchSimilarTitles();
    }
  }, [titleId, contentType]);

  const handleTitleClick = (item: SimilarTitle) => {
    // Navigate to the correct detail page
    navigate(`/${contentType}/${item.id}`);
  };

  if (loading) {
    return (
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Similar {contentType === 'anime' ? 'Anime' : 'Manga'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!similarTitles.length) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Similar {contentType === 'anime' ? 'Anime' : 'Manga'}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {similarTitles.map((item) => (
            <div
              key={item.id}
              className="cursor-pointer hover:scale-105 transition-transform"
              onClick={() => handleTitleClick(item)}
            >
              <img
                src={item.image_url || '/placeholder.jpg'}
                alt={item.title}
                className="rounded-lg w-full aspect-[3/4] object-cover"
              />
              <p className="mt-2 text-sm font-medium line-clamp-2">{item.title}</p>
              {item.score && (
                <p className="text-xs text-muted-foreground">★ {item.score}</p>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};