import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const SyncTrigger = () => {
  useEffect(() => {
    const triggerComprehensiveSync = async () => {
      console.log('🎯 SyncTrigger: Starting autonomous comprehensive sync...');

      try {
        // Step 1: Run diagnostics
        console.log('🔍 Step 1: Running diagnostics...');
        const diagnosticsResult = await supabase.functions.invoke('sync-diagnostics');
        console.log('🔍 Diagnostics result:', diagnosticsResult);

        // Step 2: Start massive parallel sync
        console.log('🚀 Step 2: Starting comprehensive parallel sync...');
        
        const animeSync = supabase.functions.invoke('ultra-fast-sync', {
          body: { contentType: 'anime', maxPages: 500 }
        });

        const mangaSync = supabase.functions.invoke('ultra-fast-sync', {
          body: { contentType: 'manga', maxPages: 3000 }
        });

        console.log('🌟 Both massive sync operations triggered!');
        
        // Start monitoring progress
        const monitorProgress = async () => {
          try {
            const { data } = await supabase
              .from('titles')
              .select(`
                id,
                anime_details!inner(id),
                manga_details!inner(id)
              `, { count: 'exact' });
            
            const animeCount = await supabase
              .from('titles')
              .select('id', { count: 'exact' })
              .not('anime_details', 'is', null);
            
            const mangaCount = await supabase
              .from('titles')
              .select('id', { count: 'exact' })
              .not('manga_details', 'is', null);

            console.log(`📊 Current progress: ${animeCount.count || 0} anime, ${mangaCount.count || 0} manga`);
            
            // Continue monitoring
            setTimeout(monitorProgress, 60000); // Check every minute
          } catch (error) {
            console.log('📊 Progress check error:', error.message);
            setTimeout(monitorProgress, 60000); // Keep trying
          }
        };

        // Start monitoring immediately
        monitorProgress();

        // Wait for sync results (but don't block)
        Promise.allSettled([animeSync, mangaSync]).then((results) => {
          results.forEach((result, index) => {
            const type = index === 0 ? 'anime' : 'manga';
            if (result.status === 'fulfilled') {
              console.log(`✅ ${type} sync completed:`, result.value.data);
            } else {
              console.log(`❌ ${type} sync issue:`, result.reason);
            }
          });
        });

      } catch (error) {
        console.error('💥 SyncTrigger error:', error);
        
        // Fallback: Try direct ultra-fast-sync without diagnostics
        console.log('🔄 Fallback: Direct sync trigger...');
        try {
          await supabase.functions.invoke('ultra-fast-sync', {
            body: { contentType: 'anime', maxPages: 100 }
          });
          await supabase.functions.invoke('ultra-fast-sync', {
            body: { contentType: 'manga', maxPages: 200 }
          });
          console.log('🔄 Fallback sync triggered successfully');
        } catch (fallbackError) {
          console.error('💥 Fallback sync also failed:', fallbackError);
        }
      }
    };

    // Trigger immediately
    triggerComprehensiveSync();
  }, []);

  return null; // This component just triggers sync, no UI
};