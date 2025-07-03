import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, Database, Zap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const MangaSyncButton = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);

  const triggerAniListSync = async () => {
    setIsLoading(true);
    setSyncStatus("Starting AniList sync...");
    
    try {
      // Trigger multiple pages of AniList manga sync for comprehensive coverage
      const syncPromises = [];
      
      for (let page = 1; page <= 10; page++) {
        syncPromises.push(
          supabase.functions.invoke('intelligent-content-sync', {
            body: { 
              contentType: 'manga',
              operation: 'full_sync',
              page 
            }
          })
        );
      }
      
      // Execute syncs in parallel but with some staggering
      const results = await Promise.allSettled(syncPromises);
      
      const successful = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;
      
      setSyncStatus(`AniList sync completed! ${successful} pages processed successfully`);
      toast.success(`AniList manga sync started! Processing ${successful} pages from AniList database`);
      
      if (failed > 0) {
        toast.warning(`${failed} sync requests failed, but the process is still running`);
      }
      
      // Refresh the page after a short delay
      setTimeout(() => {
        window.location.reload();
      }, 3000);
      
    } catch (error: any) {
      console.error('AniList manga sync error:', error);
      setSyncStatus("Sync failed");
      toast.error(`AniList sync failed: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const triggerMALSync = async () => {
    setIsLoading(true);
    setSyncStatus("Starting MAL sync...");
    
    try {
      const { data, error } = await supabase.functions.invoke('mal-manga-sync');
      
      if (error) {
        throw error;
      }
      
      setSyncStatus("MAL sync completed!");
      toast.success(`MAL sync completed! ${data?.totalProcessed || 0} titles processed`);
      
      setTimeout(() => {
        window.location.reload();
      }, 2000);
      
    } catch (error: any) {
      console.error('MAL sync error:', error);
      setSyncStatus("MAL sync failed");
      toast.error(`MAL sync failed: ${error.message}`);

    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-4 p-4 bg-card rounded-lg border">
      <div className="flex items-center gap-2">
        <Database className="w-5 h-5 text-primary" />
        <span className="font-medium">Manga Library Sync</span>
      </div>
      
      <div className="flex gap-2">
        <Button 
          onClick={triggerAniListSync}
          disabled={isLoading}
          variant="default"
          size="sm"
          className="gap-2 bg-gradient-primary hover:bg-gradient-primary/90"
        >
          <Zap className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          {isLoading ? 'Syncing...' : 'Sync AniList'}
        </Button>
        
        <Button 
          onClick={triggerMALSync}
          disabled={isLoading}
          variant="outline"
          size="sm"
          className="gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          Sync MAL
        </Button>
      </div>
      
      {syncStatus && (
        <Badge variant="secondary">
          {syncStatus}
        </Badge>
      )}
    </div>
  );
};