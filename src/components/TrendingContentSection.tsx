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
    limit: limit * 3, // Get more data to filter properly
    sort_by: 'popularity',
    order: 'desc'
  });

  // Group content by season and status with proper filtering
  const groupedContent = React.useMemo(() => {
    if (!trendingData) return {};
    
    console.log('Raw trending data:', trendingData.slice(0, 3)); // Debug first 3 items
    
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentSeason = getCurrentSeason();
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    
    const groups: Record<string, TrendingContent[]> = {
      currentSeason: [],
      upcoming: [],
      recentlyCompleted: [],
      topRated: [],
    };

    trendingData.forEach((item: any) => {
      // Debug each item
      console.log('Processing item:', {
        title: item.title,
        type: contentType,
        status: contentType === 'anime' ? item.anime_details?.status : item.manga_details?.status,
        score: item.score,
        aired_to: item.anime_details?.aired_to,
        published_to: item.manga_details?.published_to
      });

      if (contentType === 'anime' && item.anime_details) {
        const status = item.anime_details.status;
        const airedToStr = item.anime_details.aired_to;
        const airedTo = airedToStr ? new Date(airedToStr) : null;
        
        // Check actual status values in our data
        if (status && (status.includes('Airing') || status === 'RELEASING' || status === 'Currently Airing')) {
          groups.currentSeason.push(item);
        } 
        else if (status && (status.includes('Not yet') || status === 'NOT_YET_RELEASED' || status === 'Not Yet Released')) {
          groups.upcoming.push(item);
        } 
        else if (status && (status.includes('Finished') || status === 'FINISHED') && airedTo && airedTo > oneMonthAgo) {
          groups.recentlyCompleted.push(item);
        }
        
        // Top rated with higher threshold
        if (item.score && item.score >= 8.5) {
          groups.topRated.push(item);
        }
      } else if (contentType === 'manga' && item.manga_details) {
        const status = item.manga_details.status;
        const publishedToStr = item.manga_details.published_to;
        const publishedTo = publishedToStr ? new Date(publishedToStr) : null;
        
        if (status && (status.includes('Publishing') || status === 'RELEASING')) {
          groups.currentSeason.push(item);
        } 
        else if (status && (status.includes('Finished') || status === 'FINISHED') && publishedTo && publishedTo > oneMonthAgo) {
          groups.recentlyCompleted.push(item);
        }
        
        // Top rated with higher threshold
        if (item.score && item.score >= 8.5) {
          groups.topRated.push(item);
        }
      }
    });

    console.log('Grouped results:', {
      currentSeason: groups.currentSeason.length,
      upcoming: groups.upcoming.length,
      recentlyCompleted: groups.recentlyCompleted.length,
      topRated: groups.topRated.length
    });

    // Sort each group properly
    groups.currentSeason.sort((a, b) => (b.popularity || 0) - (a.popularity || 0));
    groups.upcoming.sort((a, b) => (b.popularity || 0) - (a.popularity || 0));
    groups.recentlyCompleted.sort((a, b) => (b.popularity || 0) - (a.popularity || 0));
    groups.topRated.sort((a, b) => (b.score || 0) - (a.score || 0));

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
              {contentType === 'anime' ? `${getCurrentSeason()} ${currentYear}` : 'Currently Publishing'}
            </h3>
            <Badge variant="secondary" className="ml-2">
              {groupedContent.currentSeason.length}
            </Badge>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            {groupedContent.currentSeason.slice(0, limit).map((item: any) => (
              <TrendingAnimeCard key={item.id} content={{
                ...item,
                status: contentType === 'anime' ? item.anime_details?.status : item.manga_details?.status,
                trending_score: item.popularity || item.score || 0
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
            {groupedContent.upcoming.slice(0, Math.floor(limit / 2)).map((item: any) => (
              <TrendingAnimeCard key={item.id} content={{
                ...item,
                status: contentType === 'anime' ? item.anime_details?.status : item.manga_details?.status,
                trending_score: item.popularity || item.score || 0
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
            <h3 className="text-xl font-semibold">Recently Completed (Last 3 Months)</h3>
            <Badge variant="outline" className="ml-2">
              {groupedContent.recentlyCompleted.length}
            </Badge>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            {groupedContent.recentlyCompleted.slice(0, Math.floor(limit / 2)).map((item: any) => (
              <TrendingAnimeCard key={item.id} content={{
                ...item,
                status: contentType === 'anime' ? item.anime_details?.status : item.manga_details?.status,
                trending_score: item.popularity || item.score || 0
              }} contentType={contentType} />
            ))}
          </div>
        </div>
      )}

      {/* Top Rated Section */}
      {groupedContent.topRated?.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <TrendingUp className="h-5 w-5 text-primary" />
            <h3 className="text-xl font-semibold">Top Rated</h3>
            <Badge variant="outline" className="ml-2">
              {groupedContent.topRated.length}
            </Badge>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            {groupedContent.topRated.slice(0, Math.floor(limit / 2)).map((item: any) => (
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