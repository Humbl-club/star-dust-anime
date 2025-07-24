import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';
import { AnimeCard } from './features/AnimeCard';
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
  const [similarTitles, setSimilarTitles] = useState<SimilarTitle[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const { getDisplayName } = useNamePreference();

  const fetchSimilarTitles = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('get_related_titles', {
        title_id_param: titleId,
        content_type: contentType,
        limit_param: 12
      });

      if (error) throw error;

      setSimilarTitles(data || []);
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

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 4) % Math.max(1, similarTitles.length));
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => 
      prev === 0 ? Math.max(0, similarTitles.length - 4) : prev - 4
    );
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

  const visibleTitles = similarTitles.slice(currentIndex, currentIndex + 4);
  const canNavigate = similarTitles.length > 4;

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm shadow-lg animate-fade-in">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            Similar {contentType === 'anime' ? 'Anime' : 'Manga'}
          </CardTitle>
          <div className="flex items-center gap-2">
            {canNavigate && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={prevSlide}
                  disabled={currentIndex === 0}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={nextSlide}
                  disabled={currentIndex + 4 >= similarTitles.length}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={fetchSimilarTitles}
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {visibleTitles.map((title, index) => (
            <div key={title.id} className="animate-fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
              <AnimeCard
                anime={{
                  id: title.id,
                  title: title.title,
                  image_url: title.image_url,
                  score: title.score,
                  anilist_id: title.anilist_id,
                  genres: [],
                  studios: [],
                  synopsis: '',
                  episodes: 0,
                  status: '',
                  type: 'TV',
                  year: null,
                  mal_id: title.anilist_id,
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
          ))}
        </div>
        {similarTitles.length > 4 && (
          <div className="flex justify-center mt-4">
            <div className="flex gap-1">
              {Array.from({ length: Math.ceil(similarTitles.length / 4) }).map((_, index) => (
                <div
                  key={index}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    Math.floor(currentIndex / 4) === index ? 'bg-primary' : 'bg-muted'
                  }`}
                />
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};