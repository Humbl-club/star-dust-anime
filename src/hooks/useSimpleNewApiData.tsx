import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface UseSimpleNewApiDataOptions {
  contentType: 'anime' | 'manga';
  page?: number;
  limit?: number;
  search?: string;
  genre?: string;
  status?: string;
  type?: string;
  year?: string;
  season?: string;
  sort_by?: string;
  order?: 'asc' | 'desc';
  autoFetch?: boolean;
}

export const useSimpleNewApiData = (options: UseSimpleNewApiDataOptions) => {
  const [data, setData] = useState<any[]>([]);
  const [pagination, setPagination] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    contentType,
    page = 1,
    limit = 20,
    search,
    genre,
    status,
    type,
    year,
    season,
    sort_by = 'score',
    order = 'desc',
    autoFetch = true
  } = options;

  const fetchData = async () => {
    setLoading(true);
    setError(null);

    try {
      console.log('Calling anime-api-new with params:', {
        contentType,
        page,
        limit,
        search,
        genre,
        status,
        type,
        year,
        season,
        sort_by,
        order
      });
      
      const { data: response, error } = await supabase.functions.invoke('anime-api-new', {
        body: {
          contentType,
          page,
          limit,
          search,
          genre,
          status,
          type,
          year,
          season,
          sort_by,
          order
        }
      });

      console.log('API Response:', { response, error });

      if (error) {
        console.error('Edge function error:', error);
        throw error;
      }

      if (response?.data) {
        console.log('Setting data:', response.data.length, 'items');
        setData(response.data);
        setPagination(response.pagination);
      } else {
        console.error('Invalid response format:', response);
        throw new Error('Invalid response format');
      }
    } catch (err: any) {
      console.error(`Error fetching ${contentType}:`, err);
      setError(err.message || 'Failed to fetch data');
      toast.error(`Failed to load ${contentType}`);
    } finally {
      setLoading(false);
    }
  };

  const syncFromExternal = async (pages = 1) => {
    setLoading(true);
    try {
      console.log(`Starting ${contentType} sync using ultra-fast-sync...`);
      
      const { data: response, error } = await supabase.functions.invoke('ultra-fast-sync', {
        body: {
          contentType,
          maxPages: pages
        }
      });

      if (error) {
        console.error(`${contentType} sync error:`, error);
        throw error;
      }

      if (response?.success) {
        const processed = response.results?.processed || 0;
        toast.success(`Successfully synced ${processed} new ${contentType} items`);
        console.log(`${contentType} sync completed:`, response);
      } else {
        throw new Error(`Sync failed: ${response?.message || 'Unknown error'}`);
      }

      // Refresh local data after sync
      await fetchData();
    } catch (err: any) {
      console.error(`Error syncing ${contentType}:`, err);
      toast.error(`Failed to sync ${contentType} data`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (autoFetch) {
      fetchData();
    }
  }, [
    contentType, page, limit, search, genre, status, type, year, season, sort_by, order, autoFetch
  ]);

  return {
    data,
    pagination,
    loading,
    error,
    fetchData,
    syncFromExternal,
    refetch: fetchData
  };
};