import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Database, Zap, PlayCircle, RotateCcw } from "lucide-react";

export const ComprehensiveNormalizedSync = () => {
  const [syncing, setSyncing] = useState(false);
  const [progress, setProgress] = useState("");

  const startNormalizedSync = async (contentType: 'anime' | 'manga', maxPages: number = 200) => {
    setSyncing(true);
    setProgress(`Starting comprehensive normalized ${contentType} sync (${maxPages} pages)...`);
    
    try {
      const { data, error } = await supabase.functions.invoke('comprehensive-normalized-sync', {
        body: { 
          contentType,
          maxPages,
          startFromId: null // Will automatically start from highest existing ID + 1
        }
      });

      if (error) throw error;

      const results = data.results;
      setProgress(`✅ Sync completed! 
        📊 Processed: ${results.processed}
        ➕ New titles: ${results.inserted} 
        🏷️ Genres: ${results.genresCreated}
        🏢 Studios: ${results.studiosCreated}
        👤 Authors: ${results.authorsCreated}
        🔗 Relationships: ${results.relationshipsCreated}`);
      
      toast.success(`${contentType} normalized sync completed!`, {
        description: `${results.inserted} new titles synced with full relationships`
      });

    } catch (error: any) {
      console.error('Normalized sync failed:', error);
      setProgress(`❌ Sync failed: ${error.message}`);
      toast.error(`${contentType} normalized sync failed`);
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
              <h3 className="font-semibold text-lg">Phase 3: Comprehensive Normalized Sync</h3>
              <p className="text-sm text-muted-foreground">
                Massive scale sync with normalized database structure, relationship mapping, and duplicate prevention
              </p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-3">
            <Button 
              onClick={() => startNormalizedSync('anime', 500)}
              disabled={syncing}
              variant="default"
              className="flex items-center gap-2"
            >
              <PlayCircle className="w-4 h-4" />
              Sync 25K Anime (500 pages)
            </Button>
            
            <Button 
              onClick={() => startNormalizedSync('manga', 3000)}
              disabled={syncing}
              variant="outline"
              className="flex items-center gap-2"
            >
              <PlayCircle className="w-4 h-4" />
              Sync 150K Manga (3000 pages)
            </Button>
            
            <Button 
              onClick={() => startNormalizedSync('anime', 100)}
              disabled={syncing}
              variant="secondary"
              className="flex items-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              Incremental Anime (100 pages)
            </Button>
            
            <Button 
              onClick={() => startNormalizedSync('manga', 200)}
              disabled={syncing}
              variant="secondary"
              className="flex items-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              Incremental Manga (200 pages)
            </Button>
          </div>

          {progress && (
            <div className="mt-4 p-3 bg-muted/50 rounded-lg">
              <pre className="text-sm whitespace-pre-wrap">{progress}</pre>
              {syncing && (
                <div className="flex items-center gap-2 mt-2">
                  <Zap className="w-4 h-4 text-yellow-500 animate-pulse" />
                  <span className="text-xs text-muted-foreground">Processing with normalized structure and relationships...</span>
                </div>
              )}
            </div>
          )}

          <div className="text-xs text-muted-foreground space-y-1">
            <p>🔹 Respects AniList API limits (90 requests/minute)</p>
            <p>🔹 Prevents duplicates using anilist_id conflict resolution</p>
            <p>🔹 Creates normalized relationships (genres, studios, authors)</p>
            <p>🔹 Starts from highest existing ID to avoid duplicates</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};