import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { TrendingAnimeCard } from './TrendingAnimeCard';
import { LoadingSpinner } from './ui/LoadingSpinner';
import { Badge } from './ui/badge';
import { TrendingUp, Calendar, Clock } from 'lucide-react';

interface TrendingAnime {
  id: string;
  title: string;
  title_english?: string;
  image_url?: string;
  score?: number;
  popularity?: number;
  status: string;
  season?: string;
  next_episode_date?: string;
  next_episode_number?: number;
  episodes?: number;
  current_season: string;
  status_indicator?: 'NEW' | 'FINALE_SOON';
  trending_score: number;
}

interface TrendingManga {
  id: string;
  title: string;
  title_english?: string;
  image_url?: string;
  score?: number;
  popularity?: number;
  status: string;
  next_chapter_date?: string;
  next_chapter_number?: number;
  chapters?: number;
  status_indicator?: 'NEW' | 'ENDING_SOON';
  trending_score: number;
}

interface TrendingContentSectionProps {
  contentType: 'anime' | 'manga';
  title: string;
  limit?: number;
}

export const TrendingContentSection: React.FC<TrendingContentSectionProps> = ({
  contentType,
  title,
  limit = 12,
}) => {
  const { data: trendingData, isLoading, error } = useQuery({
    queryKey: ['trending', contentType, limit],
    queryFn: async () => {
      const tableName = contentType === 'anime' ? 'mv_currently_airing' : 'mv_currently_publishing';
      
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .order('trending_score', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  // Group content by season and status
  const groupedContent = React.useMemo(() => {
    if (!trendingData) return {};
    
    const groups: Record<string, any[]> = {
      currentSeason: [],
      upcoming: [],
      recentlyCompleted: [],
    };

    trendingData.forEach((item: any) => {
      if (contentType === 'anime') {
        if (item.status === 'Currently Airing') {
          groups.currentSeason.push(item);
        } else if (item.status === 'Not yet aired') {
          groups.upcoming.push(item);
        } else if (item.status === 'Finished Airing') {
          groups.recentlyCompleted.push(item);
        }
      } else {
        if (item.status === 'Publishing') {
          groups.currentSeason.push(item);
        } else if (item.status === 'Finished') {
          groups.recentlyCompleted.push(item);
        }
      }
    });

    return groups;
  }, [trendingData, contentType]);

  if (isLoading) {
    return (
      <section className="w-full py-8">
        <div className="flex items-center gap-2 mb-6">
          <TrendingUp className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-bold">{title}</h2>
        </div>
        <LoadingSpinner />
      </section>
    );
  }

  if (error || !trendingData?.length) {
    return (
      <section className="w-full py-8">
        <div className="flex items-center gap-2 mb-6">
          <TrendingUp className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-bold">{title}</h2>
        </div>
        <div className="text-center py-8 text-muted-foreground">
          No trending content available at the moment.
        </div>
      </section>
    );
  }

  const getCurrentSeason = () => {
    const month = new Date().getMonth() + 1;
    if (month >= 12 || month <= 2) return 'Winter';
    if (month >= 3 && month <= 5) return 'Spring';
    if (month >= 6 && month <= 8) return 'Summer';
    return 'Fall';
  };

  const currentYear = new Date().getFullYear();

  return (
    <section className="w-full py-8">
      <div className="flex items-center gap-2 mb-6">
        <TrendingUp className="h-6 w-6 text-primary" />
        <h2 className="text-2xl font-bold">{title}</h2>
      </div>

      {/* Current Season Section */}
      {groupedContent.currentSeason?.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Calendar className="h-5 w-5 text-primary" />
            <h3 className="text-xl font-semibold">
              {getCurrentSeason()} {currentYear} - Currently {contentType === 'anime' ? 'Airing' : 'Publishing'}
            </h3>
            <Badge variant="secondary" className="ml-2">
              {groupedContent.currentSeason.length}
            </Badge>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            {groupedContent.currentSeason.slice(0, 12).map((item: TrendingAnime | TrendingManga) => (
              <TrendingAnimeCard key={item.id} content={item} contentType={contentType} />
            ))}
          </div>
        </div>
      )}

      {/* Upcoming Section */}
      {groupedContent.upcoming?.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Clock className="h-5 w-5 text-primary" />
            <h3 className="text-xl font-semibold">Coming Soon</h3>
            <Badge variant="outline" className="ml-2">
              {groupedContent.upcoming.length}
            </Badge>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            {groupedContent.upcoming.slice(0, 6).map((item: TrendingAnime | TrendingManga) => (
              <TrendingAnimeCard key={item.id} content={item} contentType={contentType} />
            ))}
          </div>
        </div>
      )}

      {/* Recently Completed Section */}
      {groupedContent.recentlyCompleted?.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Badge variant="secondary" className="h-5 w-5 rounded-full" />
            <h3 className="text-xl font-semibold">Recently Completed</h3>
            <Badge variant="outline" className="ml-2">
              {groupedContent.recentlyCompleted.length}
            </Badge>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            {groupedContent.recentlyCompleted.slice(0, 6).map((item: TrendingAnime | TrendingManga) => (
              <TrendingAnimeCard key={item.id} content={item} contentType={contentType} />
            ))}
          </div>
        </div>
      )}
    </section>
  );
};