import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Archive } from 'lucide-react';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';

export const ArchivedLogsViewer = () => {
  const [showArchived, setShowArchived] = useState(false);
  
  const { data: archivedLogs, isLoading } = useQuery({
    queryKey: ['archived-cron-logs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cron_job_logs_archive')
        .select('*')
        .order('executed_at', { ascending: false })
        .limit(100);
        
      if (error) throw error;
      return data;
    },
    enabled: showArchived
  });
  
  const { data: archiveStats } = useQuery({
    queryKey: ['archive-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .rpc('get_archive_stats');
        
      if (error) throw error;
      return data?.[0] || { total_archived: 0, jobs_by_status: {} };
    }
  });
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Archive className="w-5 h-5" />
            Archived Logs
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowArchived(!showArchived)}
          >
            {showArchived ? 'Hide' : 'Show'} Archives
          </Button>
        </CardTitle>
      </CardHeader>
      
      {showArchived && (
        <CardContent>
          {isLoading ? (
            <div>Loading archived logs...</div>
          ) : (
            <div className="space-y-2">
              {archiveStats && (
                <div className="text-sm text-muted-foreground mb-4">
                  Total archived: {archiveStats.total_archived} logs
                  {'oldest_log' in archiveStats && archiveStats.oldest_log && (
                    <span className="block">
                      Oldest: {format(new Date(archiveStats.oldest_log), 'MMM d, yyyy')}
                    </span>
                  )}
                </div>
              )}
              
              {archivedLogs?.length === 0 ? (
                <p className="text-sm text-muted-foreground">No archived logs found</p>
              ) : (
                archivedLogs?.map((log) => (
                  <div key={log.id} className="flex items-center justify-between p-2 border rounded">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm">{log.job_name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant={
                          log.status === 'completed' || log.status === 'success' 
                            ? 'default' 
                            : 'destructive'
                        }
                      >
                        {log.status}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(log.executed_at), 'MMM d, yyyy')}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
};