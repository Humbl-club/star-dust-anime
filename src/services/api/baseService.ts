import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Common interfaces
export interface ApiResponse<T> {
  data: T[];
  pagination: {
    current_page: number;
    per_page: number;
    total: number;
    total_pages: number;
    has_next_page: boolean;
    has_prev_page: boolean;
  };
  filters?: {
    search?: string;
    genre?: string;
    status?: string;
    type?: string;
    year?: string;
    season?: string;
    sort_by: string;
    order: string;
  };
}

export interface ServiceResponse<T> {
  data: T;
  error: string | null;
  success: boolean;
}

export interface BaseQueryOptions {
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
}

export interface BaseContent {
  id: string;
  anilist_id: number;
  title: string;
  title_english?: string;
  title_japanese?: string;
  synopsis: string;
  image_url: string;
  score?: number;
  anilist_score?: number;
  rank?: number;
  popularity?: number;
  favorites: number;
  year?: number;
  color_theme?: string;
  genres: string[];
  members: number;
  status: string;
  type: string;
}

// Base service class with shared functionality
export abstract class BaseApiService {
  protected supabase = supabase;

  protected async handleSupabaseRequest<T>(
    request: () => Promise<{ data: T | null; error: any }>
  ): Promise<ServiceResponse<T>> {
    try {
      const { data, error } = await request();
      
      if (error) {
        // Handle specific Supabase errors
        if (error.code === 'PGRST301') {
          // Edge function not found
          return {
            success: false,
            data: null,
            error: 'Service temporarily unavailable. Please try again later.'
          };
        }
        
        throw error;
      }
      
      if (!data) {
        return {
          success: false,
          data: null,
          error: 'No data received from server'
        };
      }
      
      return {
        success: true,
        data,
        error: null
      };
    } catch (error) {
      console.error('API request failed:', error);
      return {
        success: false,
        data: null,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  // Unified method for edge function calls
  protected async invokeEdgeFunction<T>(
    functionName: string,
    payload: any
  ): Promise<ServiceResponse<T>> {
    return this.handleSupabaseRequest(async () => {
      const response = await this.supabase.functions.invoke(functionName, {
        body: payload
      });
      
      // Edge functions return data wrapped in response
      return {
        data: response.data as T,
        error: response.error
      };
    });
  }

  protected handleError(error: Error | unknown, operation: string): ServiceResponse<null> {
    console.error(`Error in ${operation}:`, error);
    toast.error(`Failed to ${operation.toLowerCase()}`);
    
    const errorMessage = error instanceof Error 
      ? error.message 
      : `Failed to ${operation.toLowerCase()}`;
    
    return {
      data: null,
      error: errorMessage,
      success: false
    };
  }

  protected handleSuccess<T>(data: T, message?: string): ServiceResponse<T> {
    if (message) {
      toast.success(message);
    }
    return {
      data,
      error: null,
      success: true
    };
  }

  // Sync from external API
  protected async syncFromExternalAPI(contentType: 'anime' | 'manga', pages = 1): Promise<ServiceResponse<unknown>> {
    try {
      console.log(`Starting ${contentType} sync using ultra-fast-sync...`);
      
      const { data: response, error } = await this.supabase.functions.invoke('ultra-fast-sync', {
        body: {
          contentType,
          maxPages: pages
        }
      });

      if (error) {
        throw error;
      }

      if (response?.success) {
        const processed = response.results?.processed || 0;
        return this.handleSuccess(response, `Successfully synced ${processed} new ${contentType} items`);
      } else {
        throw new Error(`Sync failed: ${response?.message || 'Unknown error'}`);
      }
    } catch (err: unknown) {
      return this.handleError(err, `sync ${contentType} data`);
    }
  }

  // Sync images
  protected async syncImages(contentType: 'anime' | 'manga', limit = 10): Promise<ServiceResponse<unknown>> {
    try {
      const { data: response, error } = await this.supabase.functions.invoke('sync-images', {
        body: {
          type: contentType,
          limit
        }
      });

      if (error) {
        throw error;
      }

      return this.handleSuccess(response, `Cached ${response.processed} ${contentType} images`);
    } catch (err: unknown) {
      return this.handleError(err, `sync ${contentType} images`);
    }
  }

  // Build URL parameters for API calls
  protected buildUrlParams(options: BaseQueryOptions): URLSearchParams {
    const {
      page = 1,
      limit = 20,
      search,
      genre,
      status,
      type,
      year,
      season,
      sort_by = 'score',
      order = 'desc'
    } = options;

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
    if (season) params.append('season', season);

    return params;
  }
}