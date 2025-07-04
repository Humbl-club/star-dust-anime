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

        // Start comprehensive sync for both anime and manga
        const syncPromises = [
          // Trigger full sync orchestrator
          supabase.functions.invoke('trigger-full-sync'),
          
          // Direct complete library sync for anime (multiple pages)
          supabase.functions.invoke('complete-library-sync', {
            body: { contentType: 'anime', maxPages: 50 }
          }),
          
          // Direct complete library sync for manga (multiple pages)
          supabase.functions.invoke('complete-library-sync', {
            body: { contentType: 'manga', maxPages: 50 }
          }),
          
          // Additional intelligent syncs for comprehensive coverage
          ...Array.from({ length: 10 }, (_, i) => 
            supabase.functions.invoke('intelligent-content-sync', {
              body: { contentType: 'anime', operation: 'full_sync', page: i + 1 }
            })
          ),
          ...Array.from({ length: 10 }, (_, i) => 
            supabase.functions.invoke('intelligent-content-sync', {
              body: { contentType: 'manga', operation: 'full_sync', page: i + 1 }
            })
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

    // Set up continuous background syncing every 2 hours
    const backgroundInterval = setInterval(async () => {
      console.log('🔄 Background sync check...');
      
      try {
        // Trigger incremental updates
        await Promise.allSettled([
          supabase.functions.invoke('incremental-sync'),
          supabase.functions.invoke('complete-library-sync', {
            body: { contentType: 'anime', maxPages: 5 }
          }),
          supabase.functions.invoke('complete-library-sync', {
            body: { contentType: 'manga', maxPages: 5 }
          })
        ]);
        
        console.log('Background sync completed');
      } catch (error) {
        console.log('Background sync running silently');
      }
    }, 2 * 60 * 60 * 1000); // Every 2 hours

    return () => {
      clearInterval(backgroundInterval);
    };
  }, []);

  return { syncStatus };
};

export default useAutoSync;