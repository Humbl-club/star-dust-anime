import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { RefreshCw, Database, Activity, TrendingUp, BookOpen } from 'lucide-react';

interface SyncMonitorData {
  animeCount: number;
  mangaCount: number;
  totalTitles: number;
  lastSyncActivity: string;
  syncInProgress: boolean;
}

export const AutoSyncMonitor = () => {
  const [monitorData, setMonitorData] = useState<SyncMonitorData>({
    animeCount: 0,
    mangaCount: 0,
    totalTitles: 0,
    lastSyncActivity: 'Starting...',
    syncInProgress: true
  });
  const [previousCounts, setPreviousCounts] = useState({ anime: 0, manga: 0 });

  useEffect(() => {
    let isActive = true;

    const checkSyncProgress = async () => {
      try {
        // Get current database counts
        const [animeResult, mangaResult, totalResult] = await Promise.all([
          supabase
            .from('titles')
            .select('id', { count: 'exact' })
            .not('anime_details', 'is', null),
          supabase
            .from('titles')
            .select('id', { count: 'exact' })
            .not('manga_details', 'is', null),
          supabase
            .from('titles')
            .select('id', { count: 'exact' })
        ]);

        const animeCount = animeResult.count || 0;
        const mangaCount = mangaResult.count || 0;
        const totalTitles = totalResult.count || 0;

        // Check if sync is actively running by looking for recent changes
        const animeGrowth = animeCount - previousCounts.anime;
        const mangaGrowth = mangaCount - previousCounts.manga;
        const isGrowing = animeGrowth > 0 || mangaGrowth > 0;

        // Update activity message based on growth
        let activityMessage = 'Monitoring...';
        if (isGrowing) {
          activityMessage = `Active sync: +${animeGrowth} anime, +${mangaGrowth} manga in last check`;
        }

        if (isActive) {
          setMonitorData({
            animeCount,
            mangaCount,
            totalTitles,
            lastSyncActivity: activityMessage,
            syncInProgress: isGrowing
          });

          // Update previous counts for next comparison
          if (animeCount > 0 || mangaCount > 0) {
            setPreviousCounts({ anime: animeCount, manga: mangaCount });
          }
        }

        console.log(`📊 Sync Monitor: ${animeCount} anime, ${mangaCount} manga (${totalTitles} total)`);
        if (isGrowing) {
          console.log(`📈 Growth detected: +${animeGrowth} anime, +${mangaGrowth} manga`);
        }

      } catch (error) {
        console.error('Error checking sync progress:', error);
        if (isActive) {
          setMonitorData(prev => ({
            ...prev,
            lastSyncActivity: 'Error checking progress',
            syncInProgress: false
          }));
        }
      }
    };

    // Initial check
    checkSyncProgress();

    // Set up monitoring interval - check every 30 seconds for real-time updates
    const monitorInterval = setInterval(checkSyncProgress, 30000);

    return () => {
      isActive = false;
      clearInterval(monitorInterval);
    };
  }, [previousCounts.anime, previousCounts.manga]);

  const formatNumber = (num: number) => {
    return num.toLocaleString();
  };

  const calculateProgress = () => {
    // Estimate total available content (based on AniList estimates)
    const totalAnimeAvailable = 25000;
    const totalMangaAvailable = 150000;
    
    const animeProgress = Math.min((monitorData.animeCount / totalAnimeAvailable) * 100, 100);
    const mangaProgress = Math.min((monitorData.mangaCount / totalMangaAvailable) * 100, 100);
    
    return { anime: animeProgress, manga: mangaProgress };
  };

  const progress = calculateProgress();

  return (
    <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-secondary/5">
      <CardHeader>
        <CardTitle className="flex items-center gap-3">
          <div className="relative">
            <Database className="w-6 h-6 text-primary" />
            {monitorData.syncInProgress && (
              <Activity className="w-3 h-3 text-green-500 absolute -top-1 -right-1 animate-pulse" />
            )}
          </div>
          <div>
            <h3 className="text-lg font-bold">Overnight Sync Monitor</h3>
            <p className="text-sm text-muted-foreground font-normal">
              Real-time tracking of automated AniList synchronization
            </p>
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Status Indicator */}
        <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
          <div className="flex items-center gap-1">
            {monitorData.syncInProgress ? (
              <>
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse delay-100"></div>
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse delay-200"></div>
              </>
            ) : (
              <RefreshCw className="w-4 h-4 text-muted-foreground" />
            )}
          </div>
          <div>
            <p className="text-sm font-medium">
              {monitorData.syncInProgress ? '🌙 Overnight Sync Active' : '💤 Monitoring Mode'}
            </p>
            <p className="text-xs text-muted-foreground">
              {monitorData.lastSyncActivity}
            </p>
          </div>
        </div>

        {/* Current Counts */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium">Anime</span>
            </div>
            <div className="text-2xl font-bold text-primary">{formatNumber(monitorData.animeCount)}</div>
            <Badge variant="secondary" className="text-xs">
              {progress.anime.toFixed(1)}% complete
            </Badge>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <BookOpen className="w-4 h-4 text-secondary" />
              <span className="text-sm font-medium">Manga</span>
            </div>
            <div className="text-2xl font-bold text-secondary">{formatNumber(monitorData.mangaCount)}</div>
            <Badge variant="secondary" className="text-xs">
              {progress.manga.toFixed(1)}% complete
            </Badge>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Database className="w-4 h-4 text-accent" />
              <span className="text-sm font-medium">Total</span>
            </div>
            <div className="text-2xl font-bold text-accent">{formatNumber(monitorData.totalTitles)}</div>
            <Badge variant="outline" className="text-xs">
              All Content
            </Badge>
          </div>
        </div>

        {/* Progress Bars */}
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between items-center text-sm">
              <span>Anime Library Progress</span>
              <span>{formatNumber(monitorData.animeCount)} / 25,000</span>
            </div>
            <Progress value={progress.anime} className="h-2" />
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between items-center text-sm">
              <span>Manga Library Progress</span>
              <span>{formatNumber(monitorData.mangaCount)} / 150,000</span>
            </div>
            <Progress value={progress.manga} className="h-2" />
          </div>
        </div>

        {/* Sync Info */}
        <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg">
          <h5 className="font-medium text-blue-800 dark:text-blue-400 mb-2">Autonomous Sync Strategy</h5>
          <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
            <li>• Comprehensive parallel sync: 500 pages anime + 3000 pages manga</li>
            <li>• Smart retry logic with error handling and rate limiting</li>
            <li>• Continuous monitoring with aggressive 30-minute intervals</li>
            <li>• Deduplication to prevent database conflicts</li>
            <li>• Real-time progress tracking and database count verification</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};