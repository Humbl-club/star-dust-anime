import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Activity, Database, CheckCircle, AlertTriangle, Zap, Play } from 'lucide-react';
import { backgroundSyncService } from '@/services/BackgroundSyncService';
import { useEffect, useState } from 'react';

interface SyncProgress {
  totalProcessed: number;
  errors: string[];
  animeCount: number;
  mangaCount: number;
  isRunning: boolean;
}

export const AutomatedBackgroundSync = () => {
  const [syncProgress, setSyncProgress] = useState<SyncProgress>({
    totalProcessed: 0,
    errors: [],
    animeCount: 0,
    mangaCount: 0,
    isRunning: false
  });

  useEffect(() => {
    console.log('🎯 COMPONENT MOUNTED - TRIGGERING IMMEDIATE SYNC FOR 100+ TITLES...');
    
    // Subscribe to sync progress updates
    const unsubscribe = backgroundSyncService.subscribe((progress) => {
      setSyncProgress(progress);
      console.log('📊 Sync progress update:', progress);
    });

    // Trigger immediate sync right now - no delays, no buttons
    console.log('🚀 STARTING SYNC IMMEDIATELY FOR 100+ TITLES...');
    backgroundSyncService.startBackgroundSync().then(() => {
      console.log('🎉 Initial sync completed!');
    }).catch((error) => {
      console.error('❌ Initial sync failed:', error);
    });

    // Also start continuous sync for future runs
    setTimeout(() => {
      backgroundSyncService.startContinuousSync();
    }, 10000); // Start continuous after 10 seconds

    return unsubscribe;
  }, []);

  const triggerManualSync = async () => {
    console.log('🎯 MANUAL SYNC TRIGGERED DIRECTLY!');
    console.log('🔍 Current sync state:', syncProgress);
    
    try {
      await backgroundSyncService.startBackgroundSync();
      console.log('✅ Manual sync started successfully');
    } catch (error) {
      console.error('❌ Manual sync failed:', error);
    }
  };

  const formatNumber = (num: number) => {
    return num.toLocaleString();
  };

  return (
    <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-secondary/5">
      <CardHeader>
        <CardTitle className="flex items-center gap-3">
          <div className="relative">
            <Zap className="w-6 h-6 text-primary" />
            {syncProgress.isRunning && (
              <Activity className="w-3 h-3 text-green-500 absolute -top-1 -right-1 animate-pulse" />
            )}
          </div>
          <div>
            <h3 className="text-lg font-bold">Automated Background Sync</h3>
            <p className="text-sm text-muted-foreground font-normal">
              Continuously syncing real AniList data in the background
            </p>
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Status Indicator */}
        <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
          <div className="flex items-center gap-1">
            {syncProgress.isRunning ? (
              <>
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse delay-100"></div>
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse delay-200"></div>
              </>
            ) : syncProgress.errors.length > 0 ? (
              <AlertTriangle className="w-4 h-4 text-yellow-500" />
            ) : (
              <CheckCircle className="w-4 h-4 text-green-500" />
            )}
          </div>
          <div>
            <p className="text-sm font-medium">
              {syncProgress.isRunning ? '🌙 Background Sync Active' : '💤 Monitoring Mode'}
            </p>
            <p className="text-xs text-muted-foreground">
              {syncProgress.totalProcessed > 0 
                ? `Processed ${formatNumber(syncProgress.totalProcessed)} titles this session`
                : 'Ready to sync real AniList data automatically'
              }
            </p>
          </div>
        </div>

        {/* Current Counts */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Activity className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium">Anime</span>
            </div>
            <div className="text-2xl font-bold text-primary">{formatNumber(syncProgress.animeCount)}</div>
            <Badge variant="secondary" className="text-xs">
              Database Count
            </Badge>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Database className="w-4 h-4 text-secondary" />
              <span className="text-sm font-medium">Manga</span>
            </div>
            <div className="text-2xl font-bold text-secondary">{formatNumber(syncProgress.mangaCount)}</div>
            <Badge variant="secondary" className="text-xs">
              Database Count
            </Badge>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Zap className="w-4 h-4 text-accent" />
              <span className="text-sm font-medium">Total</span>
            </div>
            <div className="text-2xl font-bold text-accent">
              {formatNumber(syncProgress.animeCount + syncProgress.mangaCount)}
            </div>
            <Badge variant="outline" className="text-xs">
              All Titles
            </Badge>
          </div>
        </div>

        {/* Errors */}
        {syncProgress.errors.length > 0 && (
          <div className="bg-red-50 dark:bg-red-950/20 p-3 rounded-lg">
            <h5 className="font-medium text-red-800 dark:text-red-400 mb-2">
              Recent Issues ({syncProgress.errors.length})
            </h5>
            <div className="text-sm text-red-700 dark:text-red-300 space-y-1 max-h-24 overflow-y-auto">
              {syncProgress.errors.slice(-3).map((error, index) => (
                <div key={index}>• {error}</div>
              ))}
            </div>
          </div>
        )}

        {/* Live Status */}
        <div className="text-center">
          <Badge 
            variant={syncProgress.isRunning ? "default" : "secondary"}
            className={syncProgress.isRunning ? "animate-pulse" : ""}
          >
            {syncProgress.isRunning 
              ? "🔄 ACTIVELY SYNCING REAL DATA" 
              : `✅ ${formatNumber(syncProgress.totalProcessed)} TITLES PROCESSED`
            }
          </Badge>
        </div>

        {/* Sync Info */}
        <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg">
          <h5 className="font-medium text-blue-800 dark:text-blue-400 mb-2">🤖 Intelligent Background Sync</h5>
          <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
            <li>• <strong>Real AniList Data:</strong> Fetches actual anime/manga with full metadata</li>
            <li>• <strong>Smart Batching:</strong> Small batches every 10 min, larger ones hourly</li>
            <li>• <strong>No Duplicates:</strong> Automatically skips existing titles</li>
            <li>• <strong>Full Relationships:</strong> Processes genres, studios, authors automatically</li>
            <li>• <strong>Zero Maintenance:</strong> Runs continuously without any user intervention</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};