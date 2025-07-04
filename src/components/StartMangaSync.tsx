import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Database, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const StartMangaSync = () => {
  const [isLoading, setIsLoading] = useState(false);

  const handleStartSync = async () => {
    setIsLoading(true);
    
    try {
      console.log('Starting complete manga sync...');
      
      const { data, error } = await supabase.functions.invoke('complete-manga-sync');
      
      if (error) {
        throw error;
      }
      
      toast.success("Complete manga sync started! This will fetch ALL manga from AniList.", {
        duration: 10000
      });
      
      console.log('Sync result:', data);
      
    } catch (error: any) {
      console.error('Manga sync error:', error);
      toast.error(`Failed to start manga sync: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="mb-8 border-primary/20 bg-gradient-to-r from-primary/5 to-secondary/5">
      <CardContent className="p-6">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Database className="w-6 h-6 text-primary" />
            <div>
              <h3 className="font-semibold text-lg">Complete Manga Library Sync</h3>
              <p className="text-sm text-muted-foreground">
                Fetch ALL manga from AniList database (estimated 50,000+ titles)
              </p>
            </div>
          </div>
          
          <Button 
            onClick={handleStartSync}
            disabled={isLoading}
            className="ml-auto gap-2"
            size="lg"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Database className="w-4 h-4" />
            )}
            {isLoading ? 'Starting Sync...' : 'Start Complete Sync'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};