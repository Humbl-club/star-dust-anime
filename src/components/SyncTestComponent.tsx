import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Database, Zap, AlertCircle, CheckCircle } from "lucide-react";

export const SyncTestComponent = () => {
  const [syncStatus, setSyncStatus] = useState<string>("Ready to test sync");
  const [isLoading, setIsLoading] = useState(false);
  const [mangaCount, setMangaCount] = useState(0);

  const checkMangaCount = async () => {
    const { data } = await supabase
      .from('manga')
      .select('id', { count: 'exact' });
    setMangaCount(data?.length || 0);
  };

  useEffect(() => {
    checkMangaCount();
  }, []);

  const testSync = async () => {
    setIsLoading(true);
    setSyncStatus("Running direct manga sync...");
    
    try {
      console.log("Using direct-manga-sync to bypass stuck system...");
      
      const { data, error } = await supabase.functions.invoke('direct-manga-sync');

      console.log("Direct sync response:", { data, error });
      
      if (error) {
        throw error;
      }
      
      setSyncStatus(`Direct manga sync completed: ${data.totalProcessed} manga processed`);
      toast.success(`Successfully synced ${data.totalProcessed} manga!`);
      
      // Check manga count after sync
      setTimeout(checkMangaCount, 2000);
      
    } catch (error: any) {
      console.error('Direct sync error:', error);
      setSyncStatus(`Direct sync failed: ${error.message}`);
      toast.error(`Direct sync failed: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="mb-8 border-orange-200 bg-orange-50/50">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-6 h-6 text-orange-500" />
              <div>
                <h3 className="font-semibold text-lg">Sync Debug Tool</h3>
                <p className="text-sm text-muted-foreground">
                  Current manga count: {mangaCount} | Status: {syncStatus}
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button 
              onClick={testSync}
              disabled={isLoading}
              variant="outline"
              size="sm"
            >
              <Zap className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Test Sync
            </Button>
            <Button 
              onClick={checkMangaCount}
              variant="ghost"
              size="sm"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Check Count
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};