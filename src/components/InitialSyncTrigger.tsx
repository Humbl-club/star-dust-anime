import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Database, TrendingUp, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export const InitialSyncTrigger = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [syncCompleted, setSyncCompleted] = useState(false);
  const { toast } = useToast();

  const triggerInitialSync = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('fetch-trending-data');

      if (error) throw error;

      toast({
        title: "Sync Initiated!",
        description: "Comprehensive anime and manga data sync has started. This will take about 10 minutes.",
      });

      setSyncCompleted(true);
      
      // Auto-hide the component after successful trigger
      setTimeout(() => {
        setSyncCompleted(false);
      }, 30000);

    } catch (error: any) {
      console.error('Initial sync failed:', error);
      toast({
        title: "Sync Failed",
        description: error.message || "Failed to start sync. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (syncCompleted) {
    return (
      <Alert className="border-green-500/20 bg-green-500/5">
        <CheckCircle className="h-4 w-4 text-green-500" />
        <AlertDescription>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium mb-1 text-green-700">Sync Successfully Initiated!</p>
              <p className="text-sm text-green-600">
                Comprehensive data sync is now running in the background. You can monitor progress in the dashboard.
              </p>
            </div>
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-secondary/5">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="w-5 h-5" />
          Initialize Comprehensive Database
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Populate your database with trending anime and manga from AniList and MyAnimeList. 
            This will fetch thousands of titles with AI-enhanced episode schedules and comprehensive metadata.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <h4 className="font-medium">What gets synced:</h4>
              <ul className="text-muted-foreground space-y-1">
                <li>• 5 pages of trending anime (~250 titles)</li>
                <li>• 3 pages of trending manga (~75 titles)</li>
                <li>• AI-enhanced episode schedules</li>
                <li>• Complete metadata from both sources</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">Features enabled:</h4>
              <ul className="text-muted-foreground space-y-1">
                <li>• Real-time countdown timers</li>
                <li>• Automatic 6-hour updates</li>
                <li>• Smart conflict resolution</li>
                <li>• Enhanced search & filtering</li>
              </ul>
            </div>
          </div>

          <Button 
            onClick={triggerInitialSync}
            disabled={isLoading}
            size="lg"
            className="w-full bg-gradient-primary hover:bg-gradient-primary/90"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Initializing Database...
              </>
            ) : (
              <>
                <TrendingUp className="w-4 h-4 mr-2" />
                Start Comprehensive Sync
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};