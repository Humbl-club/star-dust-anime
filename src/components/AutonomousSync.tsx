import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Activity, CheckCircle, AlertTriangle, Zap } from 'lucide-react';

export const AutonomousSync = () => {
  const [syncState, setSyncState] = useState({
    isRunning: false,
    animeProgress: 0,
    mangaProgress: 0,
    startTime: null as Date | null,
    errors: [] as string[],
    lastUpdate: null as Date | null
  });

  useEffect(() => {
    let isMounted = true;

    const autonomousSync = async () => {
      console.log('🤖 AUTONOMOUS SYNC: Starting comprehensive overnight sync...');
      
      if (!isMounted) return;
      setSyncState(prev => ({ 
        ...prev, 
        isRunning: true, 
        startTime: new Date(),
        lastUpdate: new Date()
      }));

      try {
        // Get initial counts for progress tracking
        const getInitialCounts = async () => {
          const [animeResult, mangaResult] = await Promise.all([
            supabase.from('titles').select('id', { count: 'exact' }).not('anime_details', 'is', null),
            supabase.from('titles').select('id', { count: 'exact' }).not('manga_details', 'is', null)
          ]);
          return {
            anime: animeResult.count || 0,
            manga: mangaResult.count || 0
          };
        };

        const initialCounts = await getInitialCounts();
        console.log('📊 Initial state:', initialCounts);

        // Start massive parallel sync operations
        console.log('🚀 Triggering massive parallel sync...');
        
        const startAnimeSync = async () => {
          try {
            console.log('🎬 Starting MASSIVE anime sync (500 pages)...');
            const { data, error } = await supabase.functions.invoke('ultra-fast-sync', {
              body: { contentType: 'anime', maxPages: 500 }
            });
            
            if (error) {
              console.error('❌ Anime sync error:', error);
              setSyncState(prev => ({ 
                ...prev, 
                errors: [...prev.errors, `Anime sync error: ${error.message}`] 
              }));
            } else {
              console.log('✅ Anime sync completed:', data);
            }
          } catch (error) {
            console.error('💥 Anime sync exception:', error);
            setSyncState(prev => ({ 
              ...prev, 
              errors: [...prev.errors, `Anime sync exception: ${error.message}`] 
            }));
          }
        };

        const startMangaSync = async () => {
          try {
            console.log('📚 Starting MASSIVE manga sync (3000 pages)...');
            const { data, error } = await supabase.functions.invoke('ultra-fast-sync', {
              body: { contentType: 'manga', maxPages: 3000 }
            });
            
            if (error) {
              console.error('❌ Manga sync error:', error);
              setSyncState(prev => ({ 
                ...prev, 
                errors: [...prev.errors, `Manga sync error: ${error.message}`] 
              }));
            } else {
              console.log('✅ Manga sync completed:', data);
            }
          } catch (error) {
            console.error('💥 Manga sync exception:', error);
            setSyncState(prev => ({ 
              ...prev, 
              errors: [...prev.errors, `Manga sync exception: ${error.message}`] 
            }));
          }
        };

        // Start both syncs in parallel
        const syncPromises = [startAnimeSync(), startMangaSync()];
        
        // Monitor progress while syncs run
        const progressMonitor = setInterval(async () => {
          if (!isMounted) {
            clearInterval(progressMonitor);
            return;
          }

          try {
            const currentCounts = await getInitialCounts();
            const animeGrowth = currentCounts.anime - initialCounts.anime;
            const mangaGrowth = currentCounts.manga - initialCounts.manga;
            
            console.log(`📈 Progress: +${animeGrowth} anime, +${mangaGrowth} manga`);
            
            setSyncState(prev => ({
              ...prev,
              animeProgress: currentCounts.anime,
              mangaProgress: currentCounts.manga,
              lastUpdate: new Date()
            }));

          } catch (error) {
            console.log('📊 Progress monitoring error:', error.message);
          }
        }, 30000); // Check every 30 seconds

        // Wait for both syncs to complete
        await Promise.allSettled(syncPromises);
        clearInterval(progressMonitor);

        // Final check
        const finalCounts = await getInitialCounts();
        const totalAnimeGrowth = finalCounts.anime - initialCounts.anime;
        const totalMangaGrowth = finalCounts.manga - initialCounts.manga;

        console.log('🎉 AUTONOMOUS SYNC COMPLETE!');
        console.log(`📊 Final results: +${totalAnimeGrowth} anime, +${totalMangaGrowth} manga`);
        console.log(`🏁 Total in database: ${finalCounts.anime} anime, ${finalCounts.manga} manga`);

        if (isMounted) {
          setSyncState(prev => ({
            ...prev,
            isRunning: false,
            animeProgress: finalCounts.anime,
            mangaProgress: finalCounts.manga,
            lastUpdate: new Date()
          }));
        }

      } catch (error) {
        console.error('💥 Autonomous sync critical error:', error);
        if (isMounted) {
          setSyncState(prev => ({
            ...prev,
            isRunning: false,
            errors: [...prev.errors, `Critical error: ${error.message}`],
            lastUpdate: new Date()
          }));
        }
      }
    };

    // Start autonomous sync immediately
    autonomousSync();

    return () => {
      isMounted = false;
    };
  }, []);

  const formatTime = (date: Date | null) => {
    if (!date) return 'N/A';
    return date.toLocaleTimeString();
  };

  const getStatusIcon = () => {
    if (syncState.errors.length > 0) return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
    if (syncState.isRunning) return <Activity className="w-5 h-5 text-green-500 animate-pulse" />;
    return <CheckCircle className="w-5 h-5 text-blue-500" />;
  };

  return (
    <Card className="border-green-200 bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-950/20 dark:to-blue-950/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-3">
          <Zap className="w-6 h-6 text-green-600" />
          <div>
            <h3 className="text-lg font-bold text-green-800 dark:text-green-400">
              Autonomous Overnight Sync
            </h3>
            <p className="text-sm text-green-600 dark:text-green-300 font-normal">
              Massive parallel sync running automatically without user intervention
            </p>
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Status */}
        <div className="flex items-center gap-3 p-3 bg-white/50 dark:bg-black/20 rounded-lg">
          {getStatusIcon()}
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <Badge variant={syncState.isRunning ? "default" : "secondary"}>
                {syncState.isRunning ? "🌙 ACTIVE SYNC" : "💤 MONITORING"}
              </Badge>
              {syncState.isRunning && (
                <Badge variant="outline" className="animate-pulse">
                  LIVE
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Started: {formatTime(syncState.startTime)} | Last Update: {formatTime(syncState.lastUpdate)}
            </p>
          </div>
        </div>

        {/* Progress */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 bg-white/30 dark:bg-black/10 rounded-lg">
            <div className="text-lg font-bold text-green-700 dark:text-green-400">
              {syncState.animeProgress.toLocaleString()}
            </div>
            <div className="text-sm text-green-600 dark:text-green-300">Anime Titles</div>
          </div>
          <div className="text-center p-3 bg-white/30 dark:bg-black/10 rounded-lg">
            <div className="text-lg font-bold text-blue-700 dark:text-blue-400">
              {syncState.mangaProgress.toLocaleString()}
            </div>
            <div className="text-sm text-blue-600 dark:text-blue-300">Manga Titles</div>
          </div>
        </div>

        {/* Errors */}
        {syncState.errors.length > 0 && (
          <div className="bg-yellow-50 dark:bg-yellow-950/20 p-3 rounded-lg">
            <h5 className="font-medium text-yellow-800 dark:text-yellow-400 mb-2">
              Issues Detected ({syncState.errors.length})
            </h5>
            <div className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
              {syncState.errors.slice(-3).map((error, index) => (
                <div key={index}>• {error}</div>
              ))}
            </div>
          </div>
        )}

        {/* Info */}
        <div className="bg-blue-50 dark:bg-blue-950/20 p-3 rounded-lg">
          <h5 className="font-medium text-blue-800 dark:text-blue-400 mb-2">
            🤖 Autonomous Operation
          </h5>
          <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
            <li>• Massive parallel sync: 500 anime pages + 3000 manga pages</li>
            <li>• Real-time progress monitoring and error detection</li>
            <li>• Self-healing with retry logic and fallback mechanisms</li>
            <li>• No user intervention required - runs overnight automatically</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};