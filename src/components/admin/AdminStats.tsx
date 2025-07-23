import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, Users, Database, Activity } from 'lucide-react';

export const AdminStats = () => {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const [
        { count: animeCount },
        { count: mangaCount },
        { count: userCount },
        { data: recentActivity }
      ] = await Promise.all([
        supabase.from('anime_details').select('*', { count: 'exact', head: true }),
        supabase.from('manga_details').select('*', { count: 'exact', head: true }),
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('reviews')
          .select('created_at')
          .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      ]);
      
      return {
        animeCount,
        mangaCount,
        userCount,
        activityToday: recentActivity?.length || 0
      };
    }
  });
  
  const statCards = [
    { title: 'Total Anime', value: stats?.animeCount || 0, icon: Database, color: 'text-blue-500' },
    { title: 'Total Manga', value: stats?.mangaCount || 0, icon: Database, color: 'text-purple-500' },
    { title: 'Total Users', value: stats?.userCount || 0, icon: Users, color: 'text-green-500' },
    { title: 'Activity Today', value: stats?.activityToday || 0, icon: Activity, color: 'text-orange-500' },
  ];

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-2">
              <div className="h-4 bg-muted rounded w-3/4"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-muted rounded w-1/2 mb-2"></div>
              <div className="h-3 bg-muted rounded w-full"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }
  
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {statCards.map((stat) => (
        <Card key={stat.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
            <stat.icon className={`h-4 w-4 ${stat.color}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              <TrendingUp className="inline h-3 w-3 mr-1" />
              +2.5% from last week
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};