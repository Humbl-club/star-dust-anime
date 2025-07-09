import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Activity,
  TrendingUp,
  Play,
  BookOpen,
  Clock,
  Zap
} from 'lucide-react';

interface LiveActivity {
  id: string;
  type: 'anime' | 'manga';
  title: string;
  timestamp: Date;
}

interface LiveStats {
  animeAdded: number;
  mangaAdded: number;
  totalAdded: number;
  recentActivity: LiveActivity[];
}

export const LiveTitleViewer = () => {
  const [liveStats, setLiveStats] = useState<LiveStats>({
    animeAdded: 0,
    mangaAdded: 0,
    totalAdded: 0,
    recentActivity: []
  });
  const [isConnected, setIsConnected] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);

  useEffect(() => {
    // Listen to titles table inserts
    const titlesChannel = supabase
      .channel('titles-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'titles'
        },
        (payload) => {
          console.log('New title added:', payload.new);
          
          // We need to check if this is anime or manga by looking at related tables
          // For now, we'll track it as a general title and update counts
          setLiveStats(prev => ({
            ...prev,
            totalAdded: prev.totalAdded + 1,
            recentActivity: [
              {
                id: payload.new.id,
                type: 'anime', // We'll determine this properly in a moment
                title: payload.new.title,
                timestamp: new Date()
              },
              ...prev.recentActivity.slice(0, 9) // Keep only last 10 items
            ]
          }));
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setIsConnected(true);
          console.log('Connected to titles realtime');
        }
      });

    // Listen to anime_details table inserts
    const animeChannel = supabase
      .channel('anime-details-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'anime_details'
        },
        (payload) => {
          console.log('New anime details added:', payload.new);
          setLiveStats(prev => ({
            ...prev,
            animeAdded: prev.animeAdded + 1
          }));
        }
      )
      .subscribe();

    // Listen to manga_details table inserts
    const mangaChannel = supabase
      .channel('manga-details-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'manga_details'
        },
        (payload) => {
          console.log('New manga details added:', payload.new);
          setLiveStats(prev => ({
            ...prev,
            mangaAdded: prev.mangaAdded + 1
          }));
        }
      )
      .subscribe();

    // Listen to cron job logs for sync progress
    const cronChannel = supabase
      .channel('cron-logs-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'cron_job_logs'
        },
        (payload) => {
          console.log('New cron job log:', payload.new);
          if (payload.new.job_name === 'automated-dual-sync') {
            setLastSyncTime(new Date(payload.new.executed_at));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(titlesChannel);
      supabase.removeChannel(animeChannel);
      supabase.removeChannel(mangaChannel);
      supabase.removeChannel(cronChannel);
    };
  }, []);

  const resetStats = () => {
    setLiveStats({
      animeAdded: 0,
      mangaAdded: 0,
      totalAdded: 0,
      recentActivity: []
    });
  };

  return (
    <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-green-500" />
          Live Title Additions
          <div className="flex items-center gap-2 ml-auto">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className="text-xs text-muted-foreground">
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Live Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Play className="w-4 h-4 text-primary" />
                <span className="text-2xl font-bold text-green-500">
                  {liveStats.animeAdded}
                </span>
              </div>
              <div className="text-xs text-muted-foreground">Anime Added</div>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <BookOpen className="w-4 h-4 text-secondary" />
                <span className="text-2xl font-bold text-green-500">
                  {liveStats.mangaAdded}
                </span>
              </div>
              <div className="text-xs text-muted-foreground">Manga Added</div>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <TrendingUp className="w-4 h-4 text-accent" />
                <span className="text-2xl font-bold text-green-500">
                  {liveStats.totalAdded}
                </span>
              </div>
              <div className="text-xs text-muted-foreground">Total Added</div>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">
                  {lastSyncTime ? new Date(lastSyncTime).toLocaleTimeString() : 'No sync'}
                </span>
              </div>
              <div className="text-xs text-muted-foreground">Last Sync</div>
            </div>
          </div>

          {/* Recent Activity */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium">Recent Additions</h4>
              <button
                onClick={resetStats}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Reset
              </button>
            </div>
            
            <ScrollArea className="h-32 w-full">
              {liveStats.recentActivity.length === 0 ? (
                <div className="text-center text-muted-foreground text-sm py-4">
                  <Zap className="w-4 h-4 mx-auto mb-2" />
                  Waiting for new titles...
                </div>
              ) : (
                <div className="space-y-2">
                  {liveStats.recentActivity.map((activity) => (
                    <div
                      key={activity.id}
                      className="flex items-center justify-between p-2 bg-background/50 rounded-lg border border-border/50"
                    >
                      <div className="flex items-center gap-2">
                        {activity.type === 'anime' ? (
                          <Play className="w-3 h-3 text-primary" />
                        ) : (
                          <BookOpen className="w-3 h-3 text-secondary" />
                        )}
                        <span className="text-sm font-medium truncate max-w-[200px]">
                          {activity.title}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {activity.type}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {activity.timestamp.toLocaleTimeString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};