import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Eye } from 'lucide-react';
import { AnimeCard } from './features/AnimeCard';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useUserTitleLists } from '@/hooks/useUserTitleLists';

interface BecauseYouWatchedProps {
  limit?: number;
}

interface RecommendationSection {
  basedOn: {
    id: string;
    title: string;
    image_url: string;
  };
  recommendations: {
    id: string;
    title: string;
    image_url: string;
    score: number;
    anilist_id: number;
  }[];
}

export const BecauseYouWatched = ({ limit = 3 }: BecauseYouWatchedProps) => {
  const [sections, setSections] = useState<RecommendationSection[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const { user } = useAuth();
  const { titleLists } = useUserTitleLists();

  const generateBecauseYouWatchedSections = async () => {
    if (!user || titleLists.length === 0) return;

    setLoading(true);
    try {
      // Get user's completed/currently watching titles with high scores
      const baseTitles = titleLists
        .filter(item => 
          (item.status as any)?.name?.includes('completed') || 
          (item.status as any)?.name?.includes('watching') ||
          (item.status as any)?.name?.includes('reading')
        )
        .filter(item => item.score && item.score >= 7)
        .sort(() => Math.random() - 0.5) // Randomize
        .slice(0, limit);

      const newSections: RecommendationSection[] = [];

      for (const baseTitle of baseTitles) {
        try {
          const { data: similar } = await supabase.rpc('get_related_titles', {
            title_id_param: baseTitle.title_id,
            content_type: baseTitle.media_type,
            limit_param: 6
          });

          if (similar && similar.length > 0) {
            newSections.push({
              basedOn: {
                id: baseTitle.title_id,
                title: baseTitle.title?.title || 'Unknown Title',
                image_url: baseTitle.title?.image_url || ''
              },
              recommendations: similar
            });
          }
        } catch (error) {
          console.error('Error fetching recommendations for', baseTitle.title?.title, error);
        }
      }

      setSections(newSections);
    } catch (error) {
      console.error('Error generating "Because you watched" sections:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && titleLists.length > 0) {
      generateBecauseYouWatchedSections();
    }
  }, [user, titleLists.length, limit]);

  const nextSection = () => {
    setCurrentSectionIndex((prev) => (prev + 1) % sections.length);
  };

  const prevSection = () => {
    setCurrentSectionIndex((prev) => 
      prev === 0 ? sections.length - 1 : prev - 1
    );
  };

  if (!user || loading) {
    return (
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm shadow-lg">
        <CardContent className="p-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (sections.length === 0) {
    return null;
  }

  const currentSection = sections[currentSectionIndex];

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm shadow-lg animate-fade-in">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Eye className="w-5 h-5 text-primary" />
            Because you watched
            <span className="text-primary truncate max-w-xs">
              {currentSection.basedOn.title}
            </span>
          </CardTitle>
          {sections.length > 1 && (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={prevSection}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-sm text-muted-foreground px-2">
                {currentSectionIndex + 1} of {sections.length}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={nextSection}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4 mb-6 p-4 bg-muted/50 rounded-lg">
          <img
            src={currentSection.basedOn.image_url}
            alt={currentSection.basedOn.title}
            className="w-16 h-20 object-cover rounded"
          />
          <div>
            <p className="font-medium text-sm text-muted-foreground mb-1">Based on</p>
            <p className="font-semibold">{currentSection.basedOn.title}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {currentSection.recommendations.map((rec, index) => (
            <div key={rec.id} className="animate-fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
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
          ))}
        </div>

        {sections.length > 1 && (
          <div className="flex justify-center mt-6">
            <div className="flex gap-1">
              {sections.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentSectionIndex(index)}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    currentSectionIndex === index ? 'bg-primary' : 'bg-muted'
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