import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Database, Zap, PlayCircle, CheckCircle, AlertTriangle, RotateCcw } from "lucide-react";

export const CompleteAniListSync = () => {
  const [syncing, setSyncing] = useState(false);
  const [progress, setProgress] = useState<{
    anime?: { processed: number; total: number; pages: number };
    manga?: { processed: number; total: number; pages: number };
  }>({});
  const [results, setResults] = useState<{
    anime?: any;
    manga?: any;
  }>({});

  const startNormalizedSync = async (contentType: 'anime' | 'manga', maxPages: number) => {
    setSyncing(true);
    setProgress(prev => ({ ...prev, [contentType]: { processed: 0, total: 0, pages: 0 } }));
    
    try {
      console.log(`🚀 Starting comprehensive normalized ${contentType} sync (${maxPages} pages)...`);
      toast.info(`Starting comprehensive normalized ${contentType} sync - this will take several hours!`, {
        duration: 8000
      });

      const { data, error } = await supabase.functions.invoke('comprehensive-normalized-sync', {
        body: { 
          contentType,
          maxPages,
          startFromId: null // Will automatically start from highest existing ID + 1
        }
      });

      if (error) throw error;

      const results = data.results;
      setResults(prev => ({ ...prev, [contentType]: results }));
      setProgress(prev => ({ 
        ...prev, 
        [contentType]: { 
          processed: results.processed, 
          total: results.processed, 
          pages: results.pages 
        } 
      }));
      
      toast.success(`✅ ${contentType} normalized sync completed!`, {
        description: `${results.inserted} new titles synced with full relationships`,
        duration: 15000
      });

    } catch (error: any) {
      console.error('Normalized sync failed:', error);
      toast.error(`❌ ${contentType} normalized sync failed`, {
        description: error.message
      });
    } finally {
      setSyncing(false);
    }
  };

  const startBothSyncs = async () => {
    setSyncing(true);
    
    try {
      console.log('🚀 Starting COMPLETE sync for BOTH anime and manga...');
      toast.info('Starting complete library sync for both anime and manga - this will take 10-15 minutes!', {
        duration: 8000
      });

      // Start both syncs in parallel
      const promises = [
        supabase.functions.invoke('complete-anilist-sync', {
          body: { contentType: 'anime' }
        }),
        supabase.functions.invoke('complete-anilist-sync', {
          body: { contentType: 'manga' }
        })
      ];

      const results = await Promise.allSettled(promises);
      
      const animeResult = results[0];
      const mangaResult = results[1];

      let totalProcessed = 0;
      const newResults: any = {};
      const newProgress: any = {};

      if (animeResult.status === 'fulfilled' && !animeResult.value.error) {
        const animeData = animeResult.value.data;
        totalProcessed += animeData?.totalProcessed || 0;
        newResults.anime = animeData;
        newProgress.anime = {
          processed: animeData?.totalProcessed || 0,
          total: animeData?.totalAvailable || animeData?.totalProcessed || 0,
          pages: animeData?.pagesProcessed || 0
        };
      }

      if (mangaResult.status === 'fulfilled' && !mangaResult.value.error) {
        const mangaData = mangaResult.value.data;
        totalProcessed += mangaData?.totalProcessed || 0;
        newResults.manga = mangaData;
        newProgress.manga = {
          processed: mangaData?.totalProcessed || 0,
          total: mangaData?.totalAvailable || mangaData?.totalProcessed || 0,
          pages: mangaData?.pagesProcessed || 0
        };
      }

      setResults(newResults);
      setProgress(newProgress);
      
      toast.success('🎉 Complete library sync finished!', {
        description: `Total: ${totalProcessed} titles retrieved from entire AniList database`,
        duration: 15000
      });

    } catch (error: any) {
      console.error('Complete sync failed:', error);
      toast.error('❌ Complete sync failed', {
        description: error.message
      });
    } finally {
      setSyncing(false);
    }
  };

  return (
    <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-secondary/5">
      <CardHeader>
        <CardTitle className="flex items-center gap-3">
          <div className="relative">
            <Database className="w-6 h-6 text-primary" />
            <Zap className="w-3 h-3 text-yellow-500 absolute -top-1 -right-1 animate-pulse" />
          </div>
          <div>
            <h3 className="text-xl font-bold">Comprehensive Normalized AniList Sync</h3>
            <p className="text-sm text-muted-foreground font-normal">
              Massive scale sync with normalized database structure, relationship mapping, and duplicate prevention
            </p>
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Action Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <Button 
            onClick={() => startNormalizedSync('anime', 500)}
            disabled={syncing}
            variant="default"
            className="flex items-center gap-2"
          >
            <PlayCircle className="w-4 h-4" />
            🚀 FULL Anime Sync (25K titles)
          </Button>
          
          <Button 
            onClick={() => startNormalizedSync('manga', 3000)}
            disabled={syncing}
            variant="destructive"
            className="flex items-center gap-2"
          >
            <PlayCircle className="w-4 h-4" />
            🚀 FULL Manga Sync (150K titles)
          </Button>

          <Button 
            onClick={() => startNormalizedSync('anime', 100)}
            disabled={syncing}
            variant="secondary"
            className="flex items-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            Test Anime (5K titles)
          </Button>
          
          <Button 
            onClick={async () => {
              try {
                console.log('🧪 Testing database connection...')
                const { data, error, count } = await supabase
                  .from('titles')
                  .select('id', { count: 'exact' })
                  .not('anime_details', 'is', null)
                  .limit(1)
                console.log('Database test result:', { data, error, count })
                if (error) {
                  toast.error('Database connection failed: ' + error.message)
                } else {
                  toast.success(`Database connection working! Current anime count: ${count || 0}`)
                }
              } catch (err) {
                console.error('Database test error:', err)
                toast.error('Database test failed')
              }
            }}
            disabled={syncing}
            variant="outline"
            className="flex items-center gap-2"
          >
            🧪 Test Database
          </Button>
        </div>

        {/* Progress Display */}
        {(progress.anime || progress.manga) && (
          <div className="space-y-4">
            <h4 className="font-semibold">Sync Progress</h4>
            
            {progress.anime && (
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Anime Library</span>
                  <span className="text-sm text-muted-foreground">
                    {progress.anime.processed.toLocaleString()} / {progress.anime.total.toLocaleString()} titles
                  </span>
                </div>
                <Progress 
                  value={progress.anime.total > 0 ? (progress.anime.processed / progress.anime.total) * 100 : 0} 
                  className="h-2"
                />
                <p className="text-xs text-muted-foreground">
                  Pages processed: {progress.anime.pages}
                </p>
              </div>
            )}

            {progress.manga && (
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Manga Library</span>
                  <span className="text-sm text-muted-foreground">
                    {progress.manga.processed.toLocaleString()} / {progress.manga.total.toLocaleString()} titles
                  </span>
                </div>
                <Progress 
                  value={progress.manga.total > 0 ? (progress.manga.processed / progress.manga.total) * 100 : 0} 
                  className="h-2"
                />
                <p className="text-xs text-muted-foreground">
                  Pages processed: {progress.manga.pages}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Results Display */}
        {(results.anime || results.manga) && (
          <div className="space-y-4">
            <h4 className="font-semibold flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              Sync Results
            </h4>
            
            {results.anime && (
              <div className="bg-green-50 dark:bg-green-950/20 p-4 rounded-lg">
                <h5 className="font-medium text-green-800 dark:text-green-400">Anime Library Complete</h5>
                <p className="text-sm text-green-700 dark:text-green-300">
                  ✅ {results.anime.totalProcessed.toLocaleString()} anime titles synced
                </p>
                <p className="text-xs text-green-600 dark:text-green-400">
                  Duration: {results.anime.duration} | Speed: {results.anime.averagePerSecond}/sec
                </p>
              </div>
            )}

            {results.manga && (
              <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg">
                <h5 className="font-medium text-blue-800 dark:text-blue-400">Manga Library Complete</h5>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  ✅ {results.manga.totalProcessed.toLocaleString()} manga titles synced
                </p>
                <p className="text-xs text-blue-600 dark:text-blue-400">
                  Duration: {results.manga.duration} | Speed: {results.manga.averagePerSecond}/sec
                </p>
              </div>
            )}
          </div>
        )}

        {/* Status Indicator */}
        {syncing && (
          <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
              <div className="w-2 h-2 bg-primary rounded-full animate-pulse delay-100"></div>
              <div className="w-2 h-2 bg-primary rounded-full animate-pulse delay-200"></div>
            </div>
            <div>
              <p className="text-sm font-medium">Complete Sync Running...</p>
              <p className="text-xs text-muted-foreground">
                This process will continue until every title is retrieved. Please wait...
              </p>
            </div>
          </div>
        )}

        {/* Warning */}
        <div className="flex items-start gap-3 p-4 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg">
          <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
          <div>
            <h5 className="font-medium text-yellow-800 dark:text-yellow-400">Important</h5>
            <p className="text-sm text-yellow-700 dark:text-yellow-300">
              This will fetch the ENTIRE AniList database (10,000+ anime, 50,000+ manga). 
              The process takes 10-15 minutes and will not stop until complete.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};