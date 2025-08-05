import React from 'react';
import { useSimpleNewApiData } from '@/hooks/useSimpleNewApiData';
import { TrendingAnimeCard } from './TrendingAnimeCard';
import { LoadingSpinner } from './ui/LoadingSpinner';
import { Badge } from './ui/badge';
import { TrendingUp, Calendar, Clock } from 'lucide-react';

// Use the actual data types from the API
interface TrendingContent {
  id: string;
  title: string;
  title_english?: string;
  title_japanese?: string;
  image_url?: string;
  score?: number;
  popularity?: number;
  year?: number;
  status?: string; // Add fallback status
  trending_score?: number; // Add fallback trending score
  anime_details?: {
    status: string;
    season?: string;
    episodes?: number;
    next_episode_date?: string;
    next_episode_number?: number;
  };
  manga_details?: {
    status: string;
    chapters?: number;
    next_chapter_date?: string;
    next_chapter_number?: number;
  };
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
  const { data: trendingData, loading: isLoading, error } = useSimpleNewApiData({
    contentType,
    limit,
    sort_by: 'score',
    order: 'desc'
  });

  // Group content by season and status
  const groupedContent = React.useMemo(() => {
    if (!trendingData) return {};
    
    const groups: Record<string, TrendingContent[]> = {
      currentSeason: [],
      upcoming: [],
      recentlyCompleted: [],
    };

    trendingData.forEach((item: any) => {
      if (contentType === 'anime' && item.anime_details) {
        const status = item.anime_details.status;
        if (status === 'Currently Airing' || status === 'RELEASING') {
          groups.currentSeason.push(item);
        } else if (status === 'Not yet aired' || status === 'NOT_YET_RELEASED') {
          groups.upcoming.push(item);
        } else if (status === 'Finished Airing' || status === 'FINISHED') {
          groups.recentlyCompleted.push(item);
        }
      } else if (contentType === 'manga' && item.manga_details) {
        const status = item.manga_details.status;
        if (status === 'Publishing' || status === 'RELEASING') {
          groups.currentSeason.push(item);
        } else if (status === 'Finished' || status === 'FINISHED') {
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
            {groupedContent.currentSeason.slice(0, 12).map((item: any) => (
              <TrendingAnimeCard key={item.id} content={{
                ...item,
                status: contentType === 'anime' ? item.anime_details?.status : item.manga_details?.status,
                trending_score: item.score || 0
              }} contentType={contentType} />
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
            {groupedContent.upcoming.slice(0, 6).map((item: any) => (
              <TrendingAnimeCard key={item.id} content={{
                ...item,
                status: contentType === 'anime' ? item.anime_details?.status : item.manga_details?.status,
                trending_score: item.score || 0
              }} contentType={contentType} />
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
            {groupedContent.recentlyCompleted.slice(0, 6).map((item: any) => (
              <TrendingAnimeCard key={item.id} content={{
                ...item,
                status: contentType === 'anime' ? item.anime_details?.status : item.manga_details?.status,
                trending_score: item.score || 0
              }} contentType={contentType} />
            ))}
          </div>
        </div>
      )}
    </section>
  );
};