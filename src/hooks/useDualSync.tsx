import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface SyncResult {
  contentType: string;
  success: boolean;
  processed?: number;
  errors?: string[];
  message?: string;
}

export const useDualSync = () => {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SyncResult[]>([]);

  const syncBothTypes = async (maxPages = 2) => {
    setLoading(true);
    setResults([]);

    try {
      console.log('Starting simultaneous anime and manga sync...');
      
      // Run both syncs simultaneously using Promise.all
      const [animeResult, mangaResult] = await Promise.all([
        supabase.functions.invoke('ultra-fast-sync', {
          body: {
            contentType: 'anime',
            maxPages
          }
        }),
        supabase.functions.invoke('ultra-fast-sync', {
          body: {
            contentType: 'manga', 
            maxPages
          }
        })
      ]);

      const syncResults: SyncResult[] = [];

      // Process anime result
      if (animeResult.error) {
        console.error('Anime sync error:', animeResult.error);
        syncResults.push({
          contentType: 'anime',
          success: false,
          message: animeResult.error.message
        });
      } else {
        const animeData = animeResult.data;
        syncResults.push({
          contentType: 'anime',
          success: animeData.success,
          processed: animeData.results?.processed || 0,
          errors: animeData.errors || []
        });
        console.log('Anime sync completed:', animeData);
      }

      // Process manga result
      if (mangaResult.error) {
        console.error('Manga sync error:', mangaResult.error);
        syncResults.push({
          contentType: 'manga',
          success: false,
          message: mangaResult.error.message
        });
      } else {
        const mangaData = mangaResult.data;
        syncResults.push({
          contentType: 'manga',
          success: mangaData.success,
          processed: mangaData.results?.processed || 0,
          errors: mangaData.errors || []
        });
        console.log('Manga sync completed:', mangaData);
      }

      setResults(syncResults);

      // Show combined results
      const totalProcessed = syncResults.reduce((sum, result) => 
        sum + (result.processed || 0), 0);
      const successfulSyncs = syncResults.filter(r => r.success).length;
      
      if (successfulSyncs === 2) {
        toast.success(`Successfully synced ${totalProcessed} items (anime + manga)`);
      } else if (successfulSyncs === 1) {
        toast.warning(`Partial sync completed - ${totalProcessed} items synced`);
      } else {
        toast.error('Sync failed for both anime and manga');
      }

    } catch (err: any) {
      console.error('Dual sync error:', err);
      toast.error('Failed to start dual sync process');
      setResults([
        {
          contentType: 'anime',
          success: false,
          message: err.message
        },
        {
          contentType: 'manga', 
          success: false,
          message: err.message
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return {
    syncBothTypes,
    loading,
    results
  };
};