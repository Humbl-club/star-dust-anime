import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useAutoSync = () => {
  const [syncStatus, setSyncStatus] = useState<string>('');

  useEffect(() => {
    let initialized = false;

    const comprehensiveNightSync = async () => {
      if (initialized) return;
      initialized = true;

      console.log('🌙 STARTING COMPREHENSIVE OVERNIGHT SYNC...');
      setSyncStatus('🌙 Overnight sync active');

      // First, run diagnostics to check current state and auto-heal any issues
      console.log('🔍 Running comprehensive diagnostics...');
      try {
        const diagnosticsResult = await supabase.functions.invoke('sync-diagnostics');
        console.log('🔍 Diagnostics complete:', diagnosticsResult.data);
        
        if (diagnosticsResult.data?.recommendations) {
          console.log('💡 Recommendations:', diagnosticsResult.data.recommendations);
        }
      } catch (diagError) {
        console.log('⚠️ Diagnostics warning:', diagError.message);
      }

      // Function to check database counts and log progress
      const checkProgress = async () => {
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

          console.log(`📊 Current DB state: ${animeCount.count || 0} anime, ${mangaCount.count || 0} manga`);
          return { anime: animeCount.count || 0, manga: mangaCount.count || 0 };
        } catch (error) {
          console.error('Error checking progress:', error);
          return { anime: 0, manga: 0 };
        }
      };

      // Check initial state
      const initialCounts = await checkProgress();
      console.log('🏁 Starting with:', initialCounts);

      // Comprehensive sync strategy with retry logic and progress monitoring
      const performComprehensiveSync = async (contentType: 'anime' | 'manga', totalPages: number) => {
        console.log(`🚀 Starting COMPREHENSIVE ${contentType} sync (${totalPages} pages)...`);
        
        let currentPage = 1;
        let totalProcessed = 0;
        let consecutiveErrors = 0;
        const maxErrors = 5;

        while (currentPage <= totalPages && consecutiveErrors < maxErrors) {
          try {
            console.log(`📄 Processing ${contentType} page ${currentPage}/${totalPages}...`);
            
            const { data, error } = await supabase.functions.invoke('ultra-fast-sync', {
              body: { 
                contentType, 
                maxPages: Math.min(10, totalPages - currentPage + 1) // Batch 10 pages at a time
              }
            });

            if (error) {
              console.error(`❌ Error on ${contentType} page ${currentPage}:`, error);
              consecutiveErrors++;
              await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5s before retry
              continue;
            }

            if (data?.success) {
              const processed = data.totalProcessed || 0;
              totalProcessed += processed;
              consecutiveErrors = 0; // Reset error counter on success
              
              console.log(`✅ ${contentType} batch complete: +${processed} items (total: ${totalProcessed})`);
              
              // Check database progress
              const currentCounts = await checkProgress();
              const progress = contentType === 'anime' 
                ? currentCounts.anime - initialCounts.anime
                : currentCounts.manga - initialCounts.manga;
              
              console.log(`📈 ${contentType} progress: +${progress} new titles in database`);
              
              currentPage += 10;
              
              // Brief pause to respect API rate limits
              await new Promise(resolve => setTimeout(resolve, 2000));
            } else {
              console.error(`❌ Sync failed for ${contentType} page ${currentPage}:`, data?.error);
              consecutiveErrors++;
              await new Promise(resolve => setTimeout(resolve, 5000));
            }
          } catch (error) {
            console.error(`💥 Exception during ${contentType} sync page ${currentPage}:`, error);
            consecutiveErrors++;
            await new Promise(resolve => setTimeout(resolve, 5000));
          }
        }

        console.log(`🏁 ${contentType} sync complete: ${totalProcessed} items processed total`);
        return totalProcessed;
      };

      // Start massive parallel sync operations
      const syncPromises = [
        performComprehensiveSync('anime', 500),  // Full anime catalog
        performComprehensiveSync('manga', 3000)  // Full manga catalog
      ];

      try {
        console.log('🌟 Starting MASSIVE PARALLEL SYNC...');
        const results = await Promise.allSettled(syncPromises);
        
        results.forEach((result, index) => {
          const type = index === 0 ? 'anime' : 'manga';
          if (result.status === 'fulfilled') {
            console.log(`✅ ${type} sync completed: ${result.value} items processed`);
          } else {
            console.error(`❌ ${type} sync failed:`, result.reason);
          }
        });

        // Final progress check
        const finalCounts = await checkProgress();
        const animeGain = finalCounts.anime - initialCounts.anime;
        const mangaGain = finalCounts.manga - initialCounts.manga;
        
        console.log('🎉 OVERNIGHT SYNC COMPLETE!');
        console.log(`📊 Final results: +${animeGain} anime, +${mangaGain} manga`);
        console.log(`🏁 Total in DB: ${finalCounts.anime} anime, ${finalCounts.manga} manga`);
        
        setSyncStatus(`✅ Overnight sync complete: +${animeGain} anime, +${mangaGain} manga`);

      } catch (error) {
        console.error('💥 Overnight sync encountered issues:', error);
        setSyncStatus('⚠️ Overnight sync encountered issues - check logs');
      }
    };

    // Start comprehensive sync immediately
    setTimeout(comprehensiveNightSync, 1000);

    // Set up aggressive continuous syncing every 30 minutes to catch any gaps
    const aggressiveInterval = setInterval(async () => {
      console.log('🔄 Aggressive continuous sync running...');
      
      try {
        // Quick incremental sync to catch new content
        await Promise.allSettled([
          supabase.functions.invoke('ultra-fast-sync', {
            body: { contentType: 'anime', maxPages: 20 }
          }),
          supabase.functions.invoke('ultra-fast-sync', {
            body: { contentType: 'manga', maxPages: 30 }
          })
        ]);
        
        console.log('🔄 Aggressive sync wave completed');
      } catch (error) {
        console.log('⚠️ Aggressive sync wave encountered issues');
      }
    }, 30 * 60 * 1000); // Every 30 minutes

    return () => {
      clearInterval(aggressiveInterval);
    };
  }, []);

  return { syncStatus };
};

export default useAutoSync;