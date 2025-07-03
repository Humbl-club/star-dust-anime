import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Navigation } from "@/components/Navigation";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { 
  Database, 
  Download, 
  RefreshCw, 
  CheckCircle, 
  AlertTriangle,
  TrendingUp,
  BookOpen,
  Zap
} from "lucide-react";

const SyncDashboard = () => {
  const [syncing, setSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState(0);
  const [syncStatus, setSyncStatus] = useState<string>('');
  const { toast } = useToast();

  const handleCompleteSync = async (contentType: 'anime' | 'manga') => {
    setSyncing(true);
    setSyncProgress(0);
    setSyncStatus(`Starting ${contentType} library sync...`);

    try {
      const { data, error } = await supabase.functions.invoke('complete-library-sync', {
        body: {
          contentType,
          maxPages: 100, // Sync up to 100 pages (2500 items)
          itemsPerPage: 25
        }
      });

      if (error) {
        throw error;
      }

      setSyncStatus(`Sync completed! Processed ${data.processed} ${contentType} items with ${data.errors} errors.`);
      setSyncProgress(100);

      toast({
        title: "Sync Completed!",
        description: `Successfully synced ${data.processed} ${contentType} items in ${Math.round(data.duration)}s`,
      });

    } catch (error: any) {
      console.error('Sync error:', error);
      setSyncStatus(`Sync failed: ${error.message}`);
      toast({
        title: "Sync Failed",
        description: error.message || "An error occurred during sync",
        variant: "destructive",
      });
    } finally {
      setSyncing(false);
    }
  };

  const handleAniListEnhancement = async () => {
    setSyncing(true);
    setSyncStatus('Enhancing database with AniList data...');

    try {
      const { data, error } = await supabase.functions.invoke('sync-anilist-data', {
        body: { batchSize: 100, offset: 0 }
      });

      if (error) {
        throw error;
      }

      toast({
        title: "AniList Enhancement Complete!",
        description: `Enhanced ${data.processed} items with AniList data`,
      });

      setSyncStatus(`AniList enhancement completed! Enhanced ${data.processed} items.`);

    } catch (error: any) {
      console.error('AniList enhancement error:', error);
      setSyncStatus(`Enhancement failed: ${error.message}`);
      toast({
        title: "Enhancement Failed",
        description: error.message || "Failed to enhance with AniList data",
        variant: "destructive",
      });
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/5">
      <Navigation />
      
      <div className="container mx-auto px-4 pt-24 pb-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Database className="w-8 h-8 text-primary" />
            <h1 className="text-4xl font-bold text-gradient-primary">
              Sync Dashboard
            </h1>
          </div>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Manage and sync your complete anime and manga library with AI-powered enhancements.
          </p>
        </div>

        {/* Current Status */}
        {syncing && (
          <Alert className="mb-8 border-primary/20 bg-primary/5">
            <RefreshCw className="h-4 w-4 animate-spin" />
            <AlertDescription>
              <div className="space-y-2">
                <p className="font-medium">{syncStatus}</p>
                <Progress value={syncProgress} className="w-full" />
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Sync Options */}
        <div className="grid md:grid-cols-2 gap-8 mb-8">
          {/* Anime Complete Sync */}
          <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                Complete Anime Library
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Sync the complete anime library from MyAnimeList. This will fetch thousands of anime titles with scores, rankings, and metadata.
              </p>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Estimated Items:</span>
                  <Badge variant="secondary">~2,500 Anime</Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Estimated Time:</span>
                  <Badge variant="secondary">~15 minutes</Badge>
                </div>
              </div>

              <Button 
                onClick={() => handleCompleteSync('anime')}
                disabled={syncing}
                className="w-full"
                size="lg"
              >
                <Download className="w-4 h-4 mr-2" />
                Sync Complete Anime Library
              </Button>
            </CardContent>
          </Card>

          {/* Manga Complete Sync */}
          <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-secondary" />
                Complete Manga Library
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Sync the complete manga library from MyAnimeList. This will fetch thousands of manga titles with scores, rankings, and metadata.
              </p>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Estimated Items:</span>
                  <Badge variant="secondary">~2,500 Manga</Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Estimated Time:</span>
                  <Badge variant="secondary">~15 minutes</Badge>
                </div>
              </div>

              <Button 
                onClick={() => handleCompleteSync('manga')}
                disabled={syncing}
                className="w-full"
                size="lg"
                variant="secondary"
              >
                <Download className="w-4 h-4 mr-2" />
                Sync Complete Manga Library
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Enhancement Options */}
        <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-accent" />
              AniList Data Enhancement
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Enhance your existing database with additional AniList data including popularity metrics, character information, and advanced metadata for better trending calculations.
            </p>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-lg font-bold text-accent">Popularity</div>
                <div className="text-xs text-muted-foreground">AniList Rankings</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-accent">Characters</div>
                <div className="text-xs text-muted-foreground">Character Data</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-accent">Relations</div>
                <div className="text-xs text-muted-foreground">Related Content</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-accent">Studios</div>
                <div className="text-xs text-muted-foreground">Production Info</div>
              </div>
            </div>

            <Button 
              onClick={handleAniListEnhancement}
              disabled={syncing}
              className="w-full"
              size="lg"
              variant="accent"
            >
              <Zap className="w-4 h-4 mr-2" />
              Enhance with AniList Data
            </Button>
          </CardContent>
        </Card>

        {/* Warning */}
        <Alert className="mt-8 border-warning/20 bg-warning/5">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Important:</strong> Complete library syncs will take several minutes and consume API rate limits. 
            Make sure you have a stable internet connection and avoid running multiple syncs simultaneously.
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );
};

export default SyncDashboard;