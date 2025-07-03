import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, Database } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const MangaSyncButton = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);

  const triggerMangaSync = async () => {
    setIsLoading(true);
    setSyncStatus("Starting sync...");
    
    try {
      const { data, error } = await supabase.functions.invoke('mal-manga-sync');
      
      if (error) {
        throw error;
      }
      
      setSyncStatus("Sync completed successfully!");
      toast.success(`Manga sync completed! ${data?.totalProcessed || 0} titles processed`);
      
      // Refresh the page after a short delay
      setTimeout(() => {
        window.location.reload();
      }, 2000);
      
    } catch (error: any) {
      console.error('Manga sync error:', error);
      setSyncStatus("Sync failed");
      toast.error(`Manga sync failed: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-4 p-4 bg-card rounded-lg border">
      <div className="flex items-center gap-2">
        <Database className="w-5 h-5 text-primary" />
        <span className="font-medium">MyAnimeList Sync</span>
      </div>
      
      <Button 
        onClick={triggerMangaSync}
        disabled={isLoading}
        variant="outline"
        size="sm"
        className="gap-2"
      >
        <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        {isLoading ? 'Syncing...' : 'Sync All Manga'}
      </Button>
      
      {syncStatus && (
        <Badge variant="secondary">
          {syncStatus}
        </Badge>
      )}
    </div>
  );
};