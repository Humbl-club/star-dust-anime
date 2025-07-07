import { useEffect, useState } from 'react';
import { backgroundSyncService } from '@/services/BackgroundSyncService';

interface SyncProgress {
  totalProcessed: number;
  errors: string[];
  animeCount: number;
  mangaCount: number;
  isRunning: boolean;
}

export const useBackgroundSync = () => {
  const [syncProgress, setSyncProgress] = useState<SyncProgress>({
    totalProcessed: 0,
    errors: [],
    animeCount: 0,
    mangaCount: 0,
    isRunning: false
  });

  useEffect(() => {
    console.log('🎯 HOOK INITIALIZED - BACKGROUND SYNC READY');
    
    // Subscribe to sync progress updates only
    const unsubscribe = backgroundSyncService.subscribe((progress) => {
      setSyncProgress(progress);
    });

    return unsubscribe;
  }, []);

  return {
    syncProgress,
    isActive: backgroundSyncService.isActive(),
    manualSync: () => backgroundSyncService.startBackgroundSync()
  };
};