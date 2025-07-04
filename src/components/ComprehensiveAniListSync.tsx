import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Database, Zap, PlayCircle } from "lucide-react";

export const ComprehensiveAniListSync = () => {
  const [syncing, setSyncing] = useState(false);
  const [progress, setProgress] = useState("");

  const startComprehensiveSync = async (contentType: 'anime' | 'manga') => {
    setSyncing(true);
    setProgress(`Starting comprehensive ${contentType} sync with enhanced features...`);
    
    try {
      const { data, error } = await supabase.functions.invoke('comprehensive-anilist-sync', {
        body: { 
          contentType,
          maxPages: 100, // Sync 100 pages for comprehensive coverage
          startPage: 1
        }
      });

      if (error) throw error;

      const results = data.results;
      setProgress(`✅ Sync completed! Processed: ${results.processed}, Streaming Links: ${results.streaming_links}, Countdown Data: ${results.countdown_data}`);
      
      toast.success(`${contentType} sync completed with enhanced features!`, {
        description: `${results.processed} titles synced with streaming links and countdown data`
      });

    } catch (error: any) {
      console.error('Sync failed:', error);
      setProgress(`❌ Sync failed: ${error.message}`);
      toast.error(`${contentType} sync failed`);
    } finally {
      setSyncing(false);
    }
  };

  return (
    <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-secondary/5">
      <CardContent className="p-6">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Database className="w-6 h-6 text-primary" />
            <div>
              <h3 className="font-semibold text-lg">Phase 2: Enhanced AniList Sync</h3>
              <p className="text-sm text-muted-foreground">
                Comprehensive sync with streaming links, countdown timers, and deep linking data
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <Button 
              onClick={() => startComprehensiveSync('anime')}
              disabled={syncing}
              variant="default"
              className="flex items-center gap-2"
            >
              <PlayCircle className="w-4 h-4" />
              Sync All Anime
            </Button>
            
            <Button 
              onClick={() => startComprehensiveSync('manga')}
              disabled={syncing}
              variant="outline"
              className="flex items-center gap-2"
            >
              <PlayCircle className="w-4 h-4" />
              Sync All Manga
            </Button>
          </div>

          {progress && (
            <div className="mt-4 p-3 bg-muted/50 rounded-lg">
              <p className="text-sm">{progress}</p>
              {syncing && (
                <div className="flex items-center gap-2 mt-2">
                  <Zap className="w-4 h-4 text-yellow-500 animate-pulse" />
                  <span className="text-xs text-muted-foreground">Processing with enhanced features...</span>
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};