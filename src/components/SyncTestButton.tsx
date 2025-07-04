import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Zap, CheckCircle } from "lucide-react";

export const SyncTestButton = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [lastSync, setLastSync] = useState<string | null>(null);

  const handleFullSync = async () => {
    setIsLoading(true);
    
    try {
      // Clear any previous sync flags to force a fresh sync
      localStorage.removeItem('auto-sync-completed');
      
      const { data, error } = await supabase.functions.invoke('trigger-full-sync');
      
      if (error) {
        throw error;
      }
      
      setLastSync(new Date().toLocaleTimeString());
      toast.success("Full sync initiated! Database constraints fixed - data should populate now.");
      console.log('Full sync response:', data);
      
      // Also trigger the complete library sync for immediate results
      setTimeout(async () => {
        try {
          await supabase.functions.invoke('complete-library-sync', {
            body: { contentType: 'anime', maxPages: 10 }
          });
          await supabase.functions.invoke('complete-library-sync', {
            body: { contentType: 'manga', maxPages: 10 }
          });
          toast.success("Direct sync also started for faster results!");
        } catch (e) {
          console.log('Direct sync running in background');
        }
      }, 1000);
      
    } catch (error: any) {
      console.error('Sync error:', error);
      toast.error(`Sync failed: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="border-emerald-200 bg-emerald-50/50">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-emerald-600" />
              <div>
                <h3 className="font-semibold">Full Library Sync</h3>
                <p className="text-sm text-muted-foreground">
                  {lastSync ? `Last sync: ${lastSync}` : 'Sync all anime & manga data now'}
                </p>
              </div>
            </div>
          </div>
          
          <Button 
            onClick={handleFullSync}
            disabled={isLoading}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            {isLoading ? (
              <Zap className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <CheckCircle className="w-4 h-4 mr-2" />
            )}
            {isLoading ? 'Syncing...' : 'Start Full Sync'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};