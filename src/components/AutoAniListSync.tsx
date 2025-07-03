import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Database, Zap } from "lucide-react";

export const AutoAniListSync = () => {
  const [syncStatus, setSyncStatus] = useState<string>("Initializing...");
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    const startAniListSync = async () => {
      try {
        setSyncStatus("Starting comprehensive AniList manga sync...");
        
        // Trigger multiple pages of AniList sync for full library coverage
        const syncPromises = [];
        
        // Sync 20 pages to get a comprehensive manga library
        for (let page = 1; page <= 20; page++) {
          syncPromises.push(
            supabase.functions.invoke('intelligent-content-sync', {
              body: { 
                contentType: 'manga',
                operation: 'full_sync',
                page,
                source: 'anilist' // Prefer AniList data
              }
            })
          );
        }

        // Also trigger the trending sync for popular titles
        syncPromises.push(
          supabase.functions.invoke('fetch-trending-data', {
            body: { contentType: 'manga' }
          })
        );

        setSyncStatus("Processing 20 pages of AniList manga data...");
        
        // Execute all syncs
        const results = await Promise.allSettled(syncPromises);
        
        const successful = results.filter(r => r.status === 'fulfilled').length;
        const failed = results.filter(r => r.status === 'rejected').length;
        
        setSyncStatus(`AniList sync completed! ${successful}/${results.length} requests successful`);
        
        toast.success(
          `AniList manga library sync completed! Processing ${successful} pages of manga data.`,
          { duration: 5000 }
        );
        
        if (failed > 0) {
          console.warn(`${failed} sync requests failed`);
        }
        
        setIsComplete(true);
        
        // Refresh the page after sync completes
        setTimeout(() => {
          window.location.reload();
        }, 3000);
        
      } catch (error: any) {
        console.error('Auto AniList sync error:', error);
        setSyncStatus("Sync failed - check console for details");
        toast.error("Failed to sync AniList manga library");
      }
    };

    startAniListSync();
  }, []);

  if (isComplete) {
    return null; // Don't show anything once complete
  }

  return (
    <Card className="mb-8 border-primary/20 bg-gradient-to-r from-primary/5 to-secondary/5">
      <CardContent className="p-6">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="relative">
              <Database className="w-6 h-6 text-primary" />
              <Zap className="w-3 h-3 text-yellow-500 absolute -top-1 -right-1 animate-pulse" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">Building AniList Manga Library</h3>
              <p className="text-sm text-muted-foreground">{syncStatus}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-1 ml-auto">
            <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
            <div className="w-2 h-2 bg-primary rounded-full animate-pulse delay-100"></div>
            <div className="w-2 h-2 bg-primary rounded-full animate-pulse delay-200"></div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};