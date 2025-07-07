import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Navigation } from "@/components/Navigation";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useStats } from "@/hooks/useStats";
import { AutoSyncMonitor } from "@/components/AutoSyncMonitor";
import { AutonomousSync } from "@/components/AutonomousSync";
import { DirectSyncTest } from "@/components/DirectSyncTest";
import { WorkingSync } from "@/components/WorkingSync";
import { 
  Database, 
  Download, 
  RefreshCw, 
  CheckCircle, 
  AlertTriangle,
  TrendingUp,
  BookOpen,
  TestTube,
  Activity,
  BarChart3
} from "lucide-react";

interface SyncProgress {
  processed: number;
  total: number;
  pages: number;
  titlesProcessed?: number;
  detailsProcessed?: number;
  genresCreated?: number;
  studiosCreated?: number;
  authorsCreated?: number;
  relationshipsCreated?: number;
  errors?: string[];
}

interface SyncResults {
  anime?: SyncProgress;
  manga?: SyncProgress;
}

const SyncDashboard = () => {
  const [syncing, setSyncing] = useState(false);
  const [syncResults, setSyncResults] = useState<SyncResults>({});
  const [syncStatus, setSyncStatus] = useState<string>('');
  const [currentOperation, setCurrentOperation] = useState<string>('');
  const { toast } = useToast();
  const { stats, loading: statsLoading, formatCount } = useStats();

  // Poll sync status during active sync
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (syncing) {
      interval = setInterval(async () => {
        try {
          const { data } = await supabase
            .from('content_sync_status')
            .select('*')
            .eq('status', 'running')
            .order('started_at', { ascending: false })
            .limit(1)
            .single();
          
          if (data) {
            setSyncStatus(`Processing ${data.content_type}: ${data.processed_items || 0} items processed...`);
            setCurrentOperation(`${data.operation_type} - Page ${data.current_page || 1}`);
          }
        } catch (err) {
          // No active sync found, which is normal
        }
      }, 2000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [syncing]);

  const handleComprehensiveSync = async (contentType: 'anime' | 'manga', maxPages: number, syncType: string) => {
    setSyncing(true);
    setSyncResults({});
    setSyncStatus(`Starting ${syncType} ${contentType} sync...`);
    setCurrentOperation('Initializing...');

    try {
      console.log(`🚀 Starting ${syncType} ${contentType} sync with maxPages: ${maxPages}`);
      
      // Phase 1: Use existing working ultra-fast-sync function
      const { data, error } = await supabase.functions.invoke('ultra-fast-sync', {
        body: { 
          contentType,
          maxPages
        }
      });

      console.log('Function response:', { data, error });

      if (error) {
        console.error('Function invocation error:', error);
        throw new Error(`Function error: ${error.message || error}`);
      }

      if (!data) {
        throw new Error('No response data received from sync function');
      }

      if (!data.success) {
        throw new Error(`Sync failed: ${data.error || 'Unknown error'}`);
      }

      const results = data;
      console.log('Sync results:', results);
      
      // Handle the new comprehensive response format
      const syncResults = results.results || {};
      const transformedResults = {
        processed: results.totalProcessed || 0,
        titlesProcessed: syncResults.titlesInserted || 0,
        detailsProcessed: syncResults.detailsInserted || 0,
        pages: results.pagesProcessed || 0,
        genresCreated: syncResults.genresCreated || 0,
        studiosCreated: syncResults.studiosCreated || 0,
        authorsCreated: syncResults.authorsCreated || 0,
        relationshipsCreated: syncResults.relationshipsCreated || 0,
        errors: syncResults.errors || []
      };
      
      setSyncResults(prev => ({ ...prev, [contentType]: transformedResults }));
      setSyncStatus(`${syncType} ${contentType} sync completed!`);
      setCurrentOperation('');

      // Show comprehensive results in toast
      const resultSummary = `${transformedResults.titlesProcessed} ${contentType} titles processed, ${transformedResults.genresCreated} genres, ${transformedResults.relationshipsCreated} relationships`;
      
      toast({
        title: "Sync Completed Successfully!",
        description: `${resultSummary} synced in ${results.duration}`,
      });

    } catch (error: any) {
      console.error('Comprehensive sync error:', error);
      const errorMessage = error.message || error.toString() || 'Unknown error occurred';
      setSyncStatus(`${syncType} ${contentType} sync failed: ${errorMessage}`);
      setCurrentOperation('');
      
      toast({
        title: "Sync Failed",
        description: errorMessage,
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
              AniList Sync Dashboard
            </h1>
          </div>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Ultra-fast AniList sync using existing working infrastructure with realistic page estimates
          </p>
        </div>

        {/* Working Sync Test - Use proven function */}
        <WorkingSync />
        
        {/* Direct Function Test - Debug the issue */}
        <div className="mt-6">
          <DirectSyncTest />
        </div>

        {/* Database Statistics */}
        <Card className="mt-8 mb-8 border-border/50 bg-card/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary" />
              Current Database Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <RefreshCw className="w-4 h-4 animate-spin" />
                Loading statistics...
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">{formatCount(stats.animeCount)}</div>
                  <div className="text-sm text-muted-foreground">Anime Titles</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-secondary">{formatCount(stats.mangaCount)}</div>
                  <div className="text-sm text-muted-foreground">Manga Titles</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-accent">{formatCount(stats.animeCount + stats.mangaCount)}</div>
                  <div className="text-sm text-muted-foreground">Total Titles</div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Current Sync Status */}
        {syncing && (
          <Alert className="mb-8 border-primary/20 bg-primary/5">
            <Activity className="h-4 w-4 animate-pulse" />
            <AlertDescription>
              <div className="space-y-2">
                <p className="font-medium">{syncStatus}</p>
                {currentOperation && (
                  <p className="text-sm text-muted-foreground">{currentOperation}</p>
                )}
                <div className="flex items-center gap-2">
                  <RefreshCw className="w-3 h-3 animate-spin" />
                  <span className="text-xs">Syncing with AniList API (rate limited to 85 req/min)</span>
                </div>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Sync Options Grid */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Anime Sync Options */}
          <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                Anime Library Sync
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Comprehensive AniList anime sync with full metadata, relationships, and normalized database structure.
              </p>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Available on AniList:</span>
                  <Badge variant="secondary">~25,000 Anime</Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Current Database:</span>
                  <Badge variant="outline">{formatCount(stats.animeCount)} Anime</Badge>
                </div>
              </div>

              <div className="space-y-2">
                <Button 
                  onClick={async () => {
                    try {
                      console.log('🧪 Testing ultra-fast-sync function...')
                      const { data, error } = await supabase.functions.invoke('ultra-fast-sync', {
                        body: { contentType: 'anime', maxPages: 1 }
                      });
                      console.log('Test result:', { data, error });
                      if (error) {
                        toast({
                          title: "Function Test Failed", 
                          description: error.message,
                          variant: "destructive"
                        });
                      } else {
                        const syncResults = data.results || {};
                        const testSummary = `${syncResults.titlesInserted || 0} titles, ${syncResults.genresCreated || 0} genres, ${syncResults.relationshipsCreated || 0} relationships`;
                        toast({
                          title: "Function Test Successful!",
                          description: `ultra-fast-sync working: ${testSummary} created (${data?.duration})`
                        });
                      }
                    } catch (err: any) {
                      console.error('Test error:', err);
                      toast({
                        title: "Test Failed",
                        description: err.message,
                        variant: "destructive"
                      });
                    }
                  }}
                  disabled={syncing}
                  className="w-full"
                  variant="outline"
                  size="sm"
                >
                  <TestTube className="w-4 h-4 mr-2" />
                  Test Function (1 page, ~30 seconds)
                </Button>
                
                <Button 
                  onClick={() => handleComprehensiveSync('anime', 5, 'Small')}
                  disabled={syncing}
                  className="w-full"
                  variant="secondary"
                  size="sm"
                >
                  <Activity className="w-4 h-4 mr-2" />
                  Small Sync (5 pages, ~2 minutes)
                </Button>
                
                <Button 
                  onClick={() => handleComprehensiveSync('anime', 25, 'Medium')}
                  disabled={syncing}
                  className="w-full"
                  size="lg"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Medium Sync (25 pages, ~10 minutes)
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Manga Sync Options */}
          <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-secondary" />
                Manga Library Sync
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Comprehensive AniList manga sync with author relationships, publication data, and normalized structure.
              </p>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Available on AniList:</span>
                  <Badge variant="secondary">~150,000 Manga</Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Current Database:</span>
                  <Badge variant="outline">{formatCount(stats.mangaCount)} Manga</Badge>
                </div>
              </div>

              <div className="space-y-2">
                <Button 
                  onClick={async () => {
                    try {
                      console.log('🧪 Testing ultra-fast-sync function for manga...')
                      const { data, error } = await supabase.functions.invoke('ultra-fast-sync', {
                        body: { contentType: 'manga', maxPages: 1 }
                      });
                      console.log('Manga test result:', { data, error });
                      if (error) {
                        toast({
                          title: "Manga Function Test Failed", 
                          description: error.message,
                          variant: "destructive"
                        });
                      } else {
                        const syncResults = data.results || {};
                        const testSummary = `${syncResults.titlesInserted || 0} titles, ${syncResults.genresCreated || 0} genres, ${syncResults.relationshipsCreated || 0} relationships`;
                        toast({
                          title: "Manga Function Test Successful!",
                          description: `ultra-fast-sync working: ${testSummary} created (${data?.duration})`
                        });
                      }
                    } catch (err: any) {
                      console.error('Manga test error:', err);
                      toast({
                        title: "Manga Test Failed",
                        description: err.message,
                        variant: "destructive"
                      });
                    }
                  }}
                  disabled={syncing}
                  className="w-full"
                  variant="outline"
                  size="sm"
                >
                  <TestTube className="w-4 h-4 mr-2" />
                  Test Function (1 page, ~30 seconds)
                </Button>
                
                <Button 
                  onClick={() => handleComprehensiveSync('manga', 8, 'Small')}
                  disabled={syncing}
                  className="w-full"
                  variant="secondary"
                  size="sm"
                >
                  <Activity className="w-4 h-4 mr-2" />
                  Small Sync (8 pages, ~3 minutes)
                </Button>
                
                <Button 
                  onClick={() => handleComprehensiveSync('manga', 40, 'Medium')}
                  disabled={syncing}
                  className="w-full"
                  variant="secondary"
                  size="lg"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Medium Sync (40 pages, ~15 minutes)
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sync Results Display */}
        {(syncResults.anime || syncResults.manga) && (
          <Card className="mb-8 border-border/50 bg-card/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                Recent Sync Results
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {syncResults.anime && (
                <div className="bg-green-50 dark:bg-green-950/20 p-4 rounded-lg">
                  <h5 className="font-medium text-green-800 dark:text-green-400 mb-2">Anime Sync Completed</h5>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <div className="font-semibold">{syncResults.anime.titlesProcessed}</div>
                      <div className="text-green-600 dark:text-green-400">Titles Processed</div>
                    </div>
                    <div>
                      <div className="font-semibold">{syncResults.anime.genresCreated}</div>
                      <div className="text-green-600 dark:text-green-400">Genres Created</div>
                    </div>
                    <div>
                      <div className="font-semibold">{syncResults.anime.studiosCreated}</div>
                      <div className="text-green-600 dark:text-green-400">Studios Created</div>
                    </div>
                    <div>
                      <div className="font-semibold">{syncResults.anime.relationshipsCreated}</div>
                      <div className="text-green-600 dark:text-green-400">Relationships</div>
                    </div>
                  </div>
                  {syncResults.anime.errors && syncResults.anime.errors.length > 0 && (
                    <div className="mt-2 text-xs text-orange-600 dark:text-orange-400">
                      {syncResults.anime.errors.length} errors occurred during sync
                    </div>
                  )}
                </div>
              )}
              
              {syncResults.manga && (
                <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg">
                  <h5 className="font-medium text-blue-800 dark:text-blue-400 mb-2">Manga Sync Completed</h5>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <div className="font-semibold">{syncResults.manga.titlesProcessed}</div>
                      <div className="text-blue-600 dark:text-blue-400">Titles Processed</div>
                    </div>
                    <div>
                      <div className="font-semibold">{syncResults.manga.genresCreated}</div>
                      <div className="text-blue-600 dark:text-blue-400">Genres Created</div>
                    </div>
                    <div>
                      <div className="font-semibold">{syncResults.manga.authorsCreated}</div>
                      <div className="text-blue-600 dark:text-blue-400">Authors Created</div>
                    </div>
                    <div>
                      <div className="font-semibold">{syncResults.manga.relationshipsCreated}</div>
                      <div className="text-blue-600 dark:text-blue-400">Relationships</div>
                    </div>
                  </div>
                  {syncResults.manga.errors && syncResults.manga.errors.length > 0 && (
                    <div className="mt-2 text-xs text-orange-600 dark:text-orange-400">
                      {syncResults.manga.errors.length} errors occurred during sync
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Important Information */}
        <Alert className="border-primary/20 bg-primary/5">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-2">
              <p><strong>AniList API Compliance:</strong> All syncs respect AniList's 90 requests/minute rate limit with built-in delays.</p>
              <p><strong>Normalized Database:</strong> Creates proper relationships between titles, genres, studios, and authors.</p>
              <p><strong>Duplicate Prevention:</strong> Automatically skips existing titles based on AniList ID.</p>
              <p><strong>Safe Operation:</strong> Syncs can be safely interrupted and resumed from where they left off.</p>
            </div>
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );
};

export default SyncDashboard;