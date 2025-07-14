
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { RefreshCw, Database, CheckCircle, AlertCircle, Clock } from 'lucide-react';

export function SyncControl() {
  const [isRunning, setIsRunning] = useState(false);
  const [lastResult, setLastResult] = useState<any>(null);
  const { toast } = useToast();

  const runSync = async () => {
    setIsRunning(true);
    setLastResult(null);
    
    try {
      toast({
        title: "Sync Started",
        description: "Starting voting data sync process...",
      });

      const { data, error } = await supabase.functions.invoke('sync-titles-voting-data', {
        body: {
          batchSize: 50,
          apiBatchSize: 25
        }
      });

      if (error) {
        throw error;
      }

      setLastResult(data);
      
      if (data.success) {
        toast({
          title: "Sync Completed",
          description: `Successfully updated ${data.total_updated} titles with voting data.`,
        });
      } else {
        toast({
          title: "Sync Failed",
          description: data.error || "Unknown error occurred",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error('Sync error:', error);
      toast({
        title: "Sync Error",
        description: error.message || "Failed to run sync process",
        variant: "destructive",
      });
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="w-5 h-5" />
          Voting Data Sync
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Sync voting data from AniList for all titles with scores
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4">
          <Button 
            onClick={runSync}
            disabled={isRunning}
            className="gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${isRunning ? 'animate-spin' : ''}`} />
            {isRunning ? 'Syncing...' : 'Start Sync'}
          </Button>
          
          {lastResult && (
            <Badge variant={lastResult.success ? "default" : "destructive"}>
              {lastResult.success ? (
                <CheckCircle className="w-3 h-3 mr-1" />
              ) : (
                <AlertCircle className="w-3 h-3 mr-1" />
              )}
              {lastResult.success ? 'Success' : 'Failed'}
            </Badge>
          )}
        </div>

        {lastResult && (
          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <h4 className="font-medium flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Last Sync Results
            </h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Updated:</span>
                <span className="ml-2 font-medium">{lastResult.total_updated || 0}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Processed:</span>
                <span className="ml-2 font-medium">{lastResult.total_processed || 0}</span>
              </div>
              <div>
                <span className="text-muted-foreground">API Calls:</span>
                <span className="ml-2 font-medium">{lastResult.total_api_calls || 0}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Duration:</span>
                <span className="ml-2 font-medium">{lastResult.duration || 'N/A'}</span>
              </div>
            </div>
            {lastResult.message && (
              <p className="text-sm text-muted-foreground mt-2">
                {lastResult.message}
              </p>
            )}
            {lastResult.errors && lastResult.errors.length > 0 && (
              <div className="mt-2">
                <p className="text-sm font-medium text-destructive">Errors:</p>
                <ul className="text-xs text-muted-foreground list-disc list-inside">
                  {lastResult.errors.slice(0, 3).map((error: string, index: number) => (
                    <li key={index}>{error}</li>
                  ))}
                  {lastResult.errors.length > 3 && (
                    <li>... and {lastResult.errors.length - 3} more</li>
                  )}
                </ul>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
