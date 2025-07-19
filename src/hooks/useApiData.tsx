import { useState, useEffect } from 'react';
import { animeService, mangaService, ApiResponse } from '@/services/api';

interface UseApiDataOptions {
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

export const useApiData = <T,>(options: UseApiDataOptions) => {
  const [data, setData] = useState<T[]>([]);
  const [pagination, setPagination] = useState<ApiResponse<T>['pagination'] | null>(null);
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
      const queryOptions = {
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
      };

      const response = contentType === 'anime' 
        ? await animeService.fetchAnime(queryOptions)
        : await mangaService.fetchManga(queryOptions);

      if (response.success && response.data) {
        setData(response.data.data as T[]);
        setPagination(response.data.pagination);
      } else {
        throw new Error(response.error || 'Failed to fetch data');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const syncFromExternal = async (pages = 1) => {
    setLoading(true);
    try {
      const response = contentType === 'anime'
        ? await animeService.syncAnime(pages)
        : await mangaService.syncManga(pages);

      if (response.success) {
        // Refresh local data after sync
        await fetchData();
      } else {
        throw new Error(response.error || 'Sync failed');
      }
    } catch (err: any) {
      setError(err.message || 'Sync failed');
    } finally {
      setLoading(false);
    }
  };

  const syncImages = async (limit = 10) => {
    setLoading(true);
    try {
      const response = contentType === 'anime'
        ? await animeService.syncAnimeImages(limit)
        : await mangaService.syncMangaImages(limit);

      if (response.success) {
        // Refresh local data after image sync
        await fetchData();
      } else {
        throw new Error(response.error || 'Image sync failed');
      }
    } catch (err: any) {
      setError(err.message || 'Image sync failed');
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
    syncImages,
    refetch: fetchData
  };
};