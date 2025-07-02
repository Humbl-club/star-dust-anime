import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  RefreshCw, 
  Database, 
  CheckCircle, 
  AlertCircle, 
  Clock,
  Zap,
  TrendingUp
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface SyncStatus {
  id: string;
  content_type: string;
  operation_type: string;
  status: string;
  total_items: number;
  processed_items: number;
  current_page: number;
  error_message?: string;
  started_at: string;
  completed_at?: string;
  next_run_at?: string;
}

export const SyncStatus = () => {
  const [syncStatuses, setSyncStatuses] = useState<SyncStatus[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  const fetchSyncStatuses = async () => {
    const { data, error } = await supabase
      .from('content_sync_status')
      .select('*')
      .order('started_at', { ascending: false })
      .limit(5);

    if (!error && data) {
      setSyncStatuses(data);
      setLastUpdate(new Date());
    }
  };

  const triggerSync = async (contentType: 'anime' | 'manga') => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('intelligent-content-sync', {
        body: { 
          contentType,
          operation: 'full_sync',
          page: 1 
        }
      });

      if (error) throw error;
      
      // Refresh status after a short delay
      setTimeout(fetchSyncStatuses, 2000);
    } catch (error) {
      console.error('Sync trigger failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const triggerTrendingSync = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('fetch-trending-data');

      if (error) throw error;
      
      // Refresh status after a short delay
      setTimeout(fetchSyncStatuses, 2000);
    } catch (error) {
      console.error('Trending sync trigger failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSyncStatuses();
    
    // Set up real-time updates
    const channel = supabase
      .channel('sync-status-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'content_sync_status'
        },
        () => fetchSyncStatuses()
      )
      .subscribe();

    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchSyncStatuses, 30000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'running':
        return <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />;
      default:
        return <Clock className="w-4 h-4 text-yellow-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      completed: 'default',
      failed: 'destructive',
      running: 'secondary',
      pending: 'outline'
    } as const;

    return (
      <Badge variant={variants[status as keyof typeof variants] || 'outline'}>
        {status.toUpperCase()}
      </Badge>
    );
  };

  const currentAnimeSync = syncStatuses.find(s => s.content_type === 'anime' && s.status === 'running');
  const currentMangaSync = syncStatuses.find(s => s.content_type === 'manga' && s.status === 'running');

  return (
    <Card className="glass-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5 text-primary" />
            Sync Status & Control
          </CardTitle>
          <div className="flex gap-2 flex-wrap">
            <Button
              variant="default"
              size="sm"
              onClick={triggerTrendingSync}
              disabled={isLoading}
              className="bg-gradient-primary hover:bg-gradient-primary/90"
            >
              <TrendingUp className="w-4 h-4 mr-2" />
              Sync All Trending
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => triggerSync('anime')}
              disabled={isLoading || !!currentAnimeSync}
            >
              <Zap className="w-4 h-4 mr-2" />
              Sync Anime
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => triggerSync('manga')}
              disabled={isLoading || !!currentMangaSync}
            >
              <TrendingUp className="w-4 h-4 mr-2" />
              Sync Manga
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Active Syncs */}
        {(currentAnimeSync || currentMangaSync) && (
          <div className="space-y-3">
            <h3 className="font-medium text-sm text-muted-foreground">Active Syncs</h3>
            {currentAnimeSync && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Anime Sync</span>
                  {getStatusIcon(currentAnimeSync.status)}
                </div>
                <Progress 
                  value={currentAnimeSync.total_items ? 
                    (currentAnimeSync.processed_items / currentAnimeSync.total_items) * 100 : 0
                  } 
                  className="h-2"
                />
                <div className="text-xs text-muted-foreground">
                  {currentAnimeSync.processed_items}/{currentAnimeSync.total_items} items
                  {currentAnimeSync.current_page && ` (Page ${currentAnimeSync.current_page})`}
                </div>
              </div>
            )}
            {currentMangaSync && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Manga Sync</span>
                  {getStatusIcon(currentMangaSync.status)}
                </div>
                <Progress 
                  value={currentMangaSync.total_items ? 
                    (currentMangaSync.processed_items / currentMangaSync.total_items) * 100 : 0
                  } 
                  className="h-2"
                />
                <div className="text-xs text-muted-foreground">
                  {currentMangaSync.processed_items}/{currentMangaSync.total_items} items
                </div>
              </div>
            )}
          </div>
        )}

        {/* Recent Sync History */}
        <div className="space-y-3">
          <h3 className="font-medium text-sm text-muted-foreground">Recent Syncs</h3>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {syncStatuses.map((sync) => (
              <div key={sync.id} className="flex items-center justify-between p-3 bg-muted/20 rounded-lg">
                <div className="flex items-center gap-3">
                  {getStatusIcon(sync.status)}
                  <div>
                    <div className="text-sm font-medium capitalize">
                      {sync.content_type} {sync.operation_type.replace('_', ' ')}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(sync.started_at).toLocaleString()}
                      {sync.completed_at && ` - ${new Date(sync.completed_at).toLocaleString()}`}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  {getStatusBadge(sync.status)}
                  {sync.processed_items > 0 && (
                    <div className="text-xs text-muted-foreground mt-1">
                      {sync.processed_items} items
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Next Scheduled Sync */}
        {syncStatuses.length > 0 && syncStatuses[0].next_run_at && (
          <div className="pt-3 border-t border-border/30">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="w-4 h-4" />
              <span>Next auto-sync: {new Date(syncStatuses[0].next_run_at).toLocaleString()}</span>
            </div>
          </div>
        )}

        {/* Last Update Time */}
        <div className="text-xs text-muted-foreground text-center pt-2 border-t border-border/30">
          Last updated: {lastUpdate.toLocaleTimeString()}
        </div>
      </CardContent>
    </Card>
  );
};