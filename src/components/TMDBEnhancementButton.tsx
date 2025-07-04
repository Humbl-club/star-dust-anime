import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Film, Sparkles, RefreshCw } from "lucide-react";

export const TMDBEnhancementButton = () => {
  const [enhancing, setEnhancing] = useState(false);
  const [progress, setProgress] = useState("");

  const startTMDBEnhancement = async () => {
    setEnhancing(true);
    setProgress("Starting TMDB enhancement for anime library...");
    
    try {
      const { data, error } = await supabase.functions.invoke('tmdb-enhancement', {
        body: { 
          maxResults: 50, // Process 50 anime at a time
          forceUpdate: false // Only enhance anime without TMDB data
        }
      });

      if (error) throw error;

      const results = data;
      setProgress(`✅ Enhancement completed! Processed: ${results.processed}, Enhanced: ${results.enhanced}`);
      
      toast.success(`TMDB enhancement completed!`, {
        description: `${results.enhanced} anime titles enhanced with movie database information`
      });

    } catch (error: any) {
      console.error('TMDB enhancement failed:', error);
      setProgress(`❌ Enhancement failed: ${error.message}`);
      toast.error("TMDB enhancement failed");
    } finally {
      setEnhancing(false);
    }
  };

  return (
    <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-secondary/5">
      <CardContent className="p-6">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Film className="w-6 h-6 text-primary" />
            <div>
              <h3 className="font-semibold text-lg">Phase 4: TMDB Enhancement</h3>
              <p className="text-sm text-muted-foreground">
                Enhance anime with movie database information, cast details, and additional metadata
              </p>
            </div>
          </div>

          <Button 
            onClick={startTMDBEnhancement}
            disabled={enhancing}
            className="flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            Enhance with TMDB Data
          </Button>

          {progress && (
            <div className="mt-4 p-3 bg-muted/50 rounded-lg">
              <p className="text-sm">{progress}</p>
              {enhancing && (
                <div className="flex items-center gap-2 mt-2">
                  <RefreshCw className="w-4 h-4 text-primary animate-spin" />
                  <span className="text-xs text-muted-foreground">Processing with TMDB API...</span>
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};