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
      // Use the new edge function instead of direct Supabase queries
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        sort_by,
        order
      });

      if (search) params.append('search', search);
      if (genre) params.append('genre', genre);
      if (status) params.append('status', status);
      if (type) params.append('type', type);
      if (year) params.append('year', year);
      if (season && contentType === 'anime') params.append('season', season);

      const { data: response, error } = await supabase.functions.invoke('anime-api-new', {
        body: {
          method: 'GET',
          path: `/${contentType}?${params.toString()}`
        }
      });

      if (error) throw error;

      if (response?.data) {
        setData(response.data);
        setPagination(response.pagination);
      } else {
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
      for (let i = 1; i <= pages; i++) {
        const { data: response, error } = await supabase.functions.invoke('fetch-anime-data', {
          body: {
            type: contentType,
            page: i,
            limit: 25
          }
        });

        if (error) throw error;

        toast.success(`Synced page ${i}/${pages} - ${response.processed} new ${contentType} items`);
        
        // Rate limiting between pages
        if (i < pages) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
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