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
    // Subscribe to sync progress updates
    const unsubscribe = backgroundSyncService.subscribe((progress) => {
      setSyncProgress(progress);
    });

    // Start continuous background sync after a short delay to let the app initialize
    console.log('🌙 Initializing automated background sync system...');
    setTimeout(() => {
      backgroundSyncService.startContinuousSync();
    }, 3000); // 3 second delay

    return unsubscribe;
  }, []);

  return {
    syncProgress,
    isActive: backgroundSyncService.isActive(),
    manualSync: () => backgroundSyncService.startBackgroundSync()
  };
};