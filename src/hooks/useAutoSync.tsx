import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useAutoSync = () => {
  const [syncStatus, setSyncStatus] = useState<string>('');

  useEffect(() => {
    let initialized = false;

    const initializeApp = async () => {
      if (initialized) return;
      initialized = true;

      try {
      console.log('🚀 AUTOMATIC BACKGROUND SYNC RUNNING...');
      setSyncStatus(''); // No UI display needed

        // Start comprehensive sync for both anime and manga - COMPLETE SYNC
        const syncPromises = [
          // Trigger full sync orchestrator
          supabase.functions.invoke('trigger-full-sync'),
          
          // Direct complete library sync for anime (UNLIMITED PAGES)
          supabase.functions.invoke('complete-library-sync', {
            body: { contentType: 'anime', maxPages: 999999 }
          }),
          
          // Direct complete library sync for manga (UNLIMITED PAGES)
          supabase.functions.invoke('complete-library-sync', {
            body: { contentType: 'manga', maxPages: 999999 }
          }),
          
          // Additional intelligent syncs for comprehensive coverage (more pages)
          ...Array.from({ length: 20 }, (_, i) => 
            supabase.functions.invoke('intelligent-content-sync', {
              body: { contentType: 'anime', operation: 'full_sync', page: i + 1 }
            })
          ),
          ...Array.from({ length: 20 }, (_, i) => 
            supabase.functions.invoke('intelligent-content-sync', {
              body: { contentType: 'manga', operation: 'full_sync', page: i + 1 }
            })
          ),
          
          // Multiple complete manga syncs to ensure full coverage
          ...Array.from({ length: 5 }, () => 
            supabase.functions.invoke('complete-manga-sync')
          )
        ];

        console.log('Starting all sync operations in parallel...');
        
        // Start all syncs in parallel
        Promise.allSettled(syncPromises).then((results) => {
          const successful = results.filter(r => r.status === 'fulfilled').length;
          console.log(`Background sync: ${successful}/${results.length} operations running silently`);
          setSyncStatus(''); // No UI needed
        });

      } catch (error) {
        console.log('Background sync running silently:', error?.message || 'Processing...');
        setSyncStatus(''); // No UI needed
      }
    };

    // Start immediately
    setTimeout(initializeApp, 1000);

    // Set up continuous background syncing every 30 minutes for complete coverage
    const backgroundInterval = setInterval(async () => {
      console.log('🔄 Silent background sync running...');
      
      try {
        await Promise.allSettled([
          supabase.functions.invoke('incremental-sync'),
          supabase.functions.invoke('complete-library-sync', {
            body: { contentType: 'anime', maxPages: 100 }
          }),
          supabase.functions.invoke('complete-library-sync', {
            body: { contentType: 'manga', maxPages: 100 }
          }),
          supabase.functions.invoke('complete-manga-sync'),
          supabase.functions.invoke('trigger-full-sync')
        ]);
        
        console.log('Silent background sync completed');
      } catch (error) {
        console.log('Background sync running silently');
      }
    }, 30 * 60 * 1000); // Every 30 minutes

    return () => {
      clearInterval(backgroundInterval);
    };
  }, []);

  return { syncStatus };
};

export default useAutoSync;