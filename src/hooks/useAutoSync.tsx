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

        // Start ultra-fast sync for both anime and manga - PARALLEL PROCESSING
        const syncPromises = [
          // Ultra-fast sync for anime (optimized, faster)
          supabase.functions.invoke('ultra-fast-sync', {
            body: { contentType: 'anime', maxPages: 25 }
          }),
          
          // Ultra-fast sync for manga (optimized, faster)
          supabase.functions.invoke('ultra-fast-sync', {
            body: { contentType: 'manga', maxPages: 20 }
          })
        ];

        console.log('Starting ultra-fast sync operations...');
        
        // Start all syncs in parallel
        Promise.allSettled(syncPromises).then((results) => {
          const successful = results.filter(r => r.status === 'fulfilled').length;
          console.log(`Ultra-fast sync: ${successful}/${results.length} operations completed`);
          setSyncStatus(''); // No UI needed
        });

      } catch (error) {
        console.log('Background sync running silently:', error?.message || 'Processing...');
        setSyncStatus(''); // No UI needed
      }
    };

    // Start immediately
    setTimeout(initializeApp, 1000);

    // Set up continuous background syncing every 20 minutes for ultra-fast updates
    const backgroundInterval = setInterval(async () => {
      console.log('🔄 Ultra-fast background sync running...');
      
      try {
        await Promise.allSettled([
          supabase.functions.invoke('ultra-fast-sync', {
            body: { contentType: 'anime', maxPages: 10 }
          }),
          supabase.functions.invoke('ultra-fast-sync', {
            body: { contentType: 'manga', maxPages: 8 }
          })
        ]);
        
        console.log('Ultra-fast background sync completed');
      } catch (error) {
        console.log('Background sync running silently');
      }
    }, 20 * 60 * 1000); // Every 20 minutes

    return () => {
      clearInterval(backgroundInterval);
    };
  }, []);

  return { syncStatus };
};

export default useAutoSync;