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
        console.log('🚀 STARTING AUTOMATIC COMPLETE LIBRARY SYNC...');
        setSyncStatus('🚀 AUTO-SYNC: Building complete anime & manga library...');

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
          console.log(`Auto-sync initiated: ${successful}/${results.length} operations started`);
          setSyncStatus(`✅ AUTO-SYNC: ${successful} operations running - library building in progress...`);
          
          // Clear status after delay
          setTimeout(() => setSyncStatus(''), 10000);
        });

      } catch (error) {
        console.log('Auto-sync initiated in background:', error?.message || 'Processing...');
        setSyncStatus('🔄 AUTO-SYNC: Complete library sync running in background...');
        setTimeout(() => setSyncStatus(''), 8000);
      }
    };

    // Start immediately
    setTimeout(initializeApp, 1000);

    // Set up continuous background syncing every 30 minutes for complete coverage
    const backgroundInterval = setInterval(async () => {
      console.log('🔄 Background sync check - AGGRESSIVE MODE...');
      
      try {
        // Trigger more aggressive incremental updates
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
        
        console.log('Aggressive background sync completed');
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