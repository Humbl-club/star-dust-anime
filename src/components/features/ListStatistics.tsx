import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Clock, 
  BookOpen, 
  Star, 
  TrendingUp, 
  BarChart3, 
  Trophy,
  Play,
  CheckCircle
} from 'lucide-react';
import { useUserTitleLists } from '@/hooks/useUserTitleLists';
import { type UserTitleListEntry } from '@/types/userLists';

interface ListStatisticsProps {
  contentType: 'anime' | 'manga' | 'both';
}

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: {
    value: number;
    label: string;
    positive?: boolean;
  };
}

function StatCard({ title, value, subtitle, icon, trend }: StatCardProps) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
            {subtitle && (
              <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
            )}
          </div>
          <div className="text-muted-foreground">{icon}</div>
        </div>
        {trend && (
          <div className="mt-3 flex items-center gap-1">
            <TrendingUp className={`w-3 h-3 ${trend.positive ? 'text-green-500' : 'text-red-500'}`} />
            <span className={`text-xs ${trend.positive ? 'text-green-600' : 'text-red-600'}`}>
              {trend.positive ? '+' : ''}{trend.value}
            </span>
            <span className="text-xs text-muted-foreground">{trend.label}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function ListStatistics({ contentType }: ListStatisticsProps) {
  const { titleLists, listStatuses } = useUserTitleLists();

  const stats = useMemo(() => {
    // Filter lists by content type
    const relevantLists = titleLists.filter(item => 
      contentType === 'both' || item.media_type === contentType
    );

    // Basic counts
    const totalEntries = relevantLists.length;
    const animeEntries = relevantLists.filter(item => item.media_type === 'anime');
    const mangaEntries = relevantLists.filter(item => item.media_type === 'manga');

    // Completion stats
    const completedEntries = relevantLists.filter(item => {
      const status = listStatuses.find(s => s.id === item.status_id);
      return status?.name === 'completed';
    });
    
    const completionRate = totalEntries > 0 ? (completedEntries.length / totalEntries) * 100 : 0;

    // Progress stats
    const totalEpisodesWatched = animeEntries.reduce((sum, item) => sum + (item.progress || 0), 0);
    const totalChaptersRead = mangaEntries.reduce((sum, item) => sum + (item.progress || 0), 0);

    // Time calculations (rough estimates)
    const averageEpisodeLength = 24; // minutes
    const averageChapterReadTime = 5; // minutes
    const totalMinutesWatched = totalEpisodesWatched * averageEpisodeLength;
    const totalMinutesReading = totalChaptersRead * averageChapterReadTime;
    const totalHours = (totalMinutesWatched + totalMinutesReading) / 60;

    // Rating stats
    const ratedEntries = relevantLists.filter(item => item.rating && item.rating > 0);
    const averageRating = ratedEntries.length > 0 
      ? ratedEntries.reduce((sum, item) => sum + (item.rating || 0), 0) / ratedEntries.length 
      : 0;

    // Status distribution
    const statusDistribution = listStatuses.reduce((acc, status) => {
      const count = relevantLists.filter(item => item.status_id === status.id).length;
      if (count > 0) {
        acc[status.name] = { count, label: status.label };
      }
      return acc;
    }, {} as Record<string, { count: number; label: string }>);

    // Top rated entries
    const topRated = relevantLists
      .filter(item => item.rating && item.rating > 0)
      .sort((a, b) => (b.rating || 0) - (a.rating || 0))
      .slice(0, 5);

    // Current watching/reading
    const currentlyActive = relevantLists.filter(item => {
      const status = listStatuses.find(s => s.id === item.status_id);
      return status?.name === 'watching' || status?.name === 'reading';
    });

    return {
      totalEntries,
      animeCount: animeEntries.length,
      mangaCount: mangaEntries.length,
      completedCount: completedEntries.length,
      completionRate,
      totalEpisodesWatched,
      totalChaptersRead,
      totalHours,
      averageRating,
      statusDistribution,
      topRated,
      currentlyActive: currentlyActive.length,
      ratedCount: ratedEntries.length
    };
  }, [titleLists, listStatuses, contentType]);

  const formatTime = (hours: number) => {
    if (hours < 24) {
      return `${Math.round(hours)}h`;
    } else {
      const days = Math.floor(hours / 24);
      const remainingHours = Math.round(hours % 24);
      return `${days}d ${remainingHours}h`;
    }
  };

  const getStatusColor = (statusName: string) => {
    const colors = {
      'completed': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100',
      'watching': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100',
      'reading': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100',
      'on_hold': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100',
      'dropped': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100',
      'plan_to_watch': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100',
      'plan_to_read': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100'
    };
    return colors[statusName as keyof typeof colors] || 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100';
  };

  if (stats.totalEntries === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <BarChart3 className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
          <p className="text-muted-foreground">
            No entries found. Start adding {contentType === 'both' ? 'anime and manga' : contentType} to see statistics!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Entries"
          value={stats.totalEntries}
          subtitle={contentType === 'both' ? `${stats.animeCount} anime, ${stats.mangaCount} manga` : undefined}
          icon={<BarChart3 className="w-5 h-5" />}
        />
        
        <StatCard
          title="Completed"
          value={stats.completedCount}
          subtitle={`${stats.completionRate.toFixed(1)}% completion rate`}
          icon={<CheckCircle className="w-5 h-5" />}
        />
        
        <StatCard
          title="Time Spent"
          value={formatTime(stats.totalHours)}
          subtitle={stats.totalEpisodesWatched > 0 ? `${stats.totalEpisodesWatched} episodes` : `${stats.totalChaptersRead} chapters`}
          icon={<Clock className="w-5 h-5" />}
        />
        
        <StatCard
          title="Average Rating"
          value={stats.averageRating > 0 ? stats.averageRating.toFixed(1) : 'N/A'}
          subtitle={stats.ratedCount > 0 ? `${stats.ratedCount} rated entries` : 'No ratings yet'}
          icon={<Star className="w-5 h-5" />}
        />
      </div>

      {/* Detailed Progress */}
      {contentType === 'both' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <StatCard
            title="Episodes Watched"
            value={stats.totalEpisodesWatched}
            subtitle={`${Math.round(stats.totalEpisodesWatched * 24 / 60)} hours`}
            icon={<Play className="w-5 h-5" />}
          />
          
          <StatCard
            title="Chapters Read"
            value={stats.totalChaptersRead}
            subtitle={`${Math.round(stats.totalChaptersRead * 5 / 60)} hours`}
            icon={<BookOpen className="w-5 h-5" />}
          />
        </div>
      )}

      {/* Status Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Status Distribution
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Object.entries(stats.statusDistribution).map(([statusName, { count, label }]) => {
              const percentage = (count / stats.totalEntries) * 100;
              return (
                <div key={statusName} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge className={getStatusColor(statusName)}>
                        {label}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {count} entries
                      </span>
                    </div>
                    <span className="text-sm font-medium">
                      {percentage.toFixed(1)}%
                    </span>
                  </div>
                  <Progress value={percentage} className="h-2" />
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Top Rated */}
      {stats.topRated.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="w-5 h-5" />
              Top Rated
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.topRated.map((item, index) => (
                <div key={item.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium truncate">
                        {(item.title as any)?.title || `Title ${item.title_id}`}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {item.media_type}
                        </Badge>
                        {item.progress && (
                          <span className="text-xs text-muted-foreground">
                            Progress: {item.progress}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <span className="font-bold">{item.rating}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}