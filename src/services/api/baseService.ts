import { supabase } from '@/integrations/supabase/client';
import { connectionManager } from '@/lib/supabaseConnection';
import { AppError } from '@/lib/errorHandling';
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
      // Use connection manager for retry logic
      const result = await connectionManager.executeWithRetry(
        request,
        'API Request'
      );
      
      const { data, error } = result;
      
      if (error) {
        // Map Supabase errors to app errors
        if (error.code === 'PGRST301') {
          throw new AppError(
            'Service temporarily unavailable',
            'SERVICE_UNAVAILABLE',
            503
          );
        }
        
        if (error.code === '42501') {
          throw new AppError(
            'Insufficient permissions',
            'FORBIDDEN',
            403
          );
        }
        
        if (error.code === 'PGRST116') {
          throw new AppError(
            'No data found',
            'NOT_FOUND',
            404
          );
        }
        
        if (error.code === '23505') {
          throw new AppError(
            'Duplicate entry',
            'CONFLICT',
            409
          );
        }
        
        throw new AppError(error.message, 'API_ERROR', 400);
      }
      
      if (!data) {
        throw new AppError('No data received', 'NO_DATA', 204);
      }
      
      return {
        success: true,
        data,
        error: null
      };
    } catch (error) {
      if (error instanceof AppError) {
        return {
          success: false,
          data: null,
          error: error.message
        };
      }
      
      console.error('API request failed:', error);
      return {
        success: false,
        data: null,
        error: 'An unexpected error occurred'
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
        body: payload,
        headers: {
          'x-request-id': crypto.randomUUID(),
          'x-client-info': `BaseApiService/${functionName}`
        }
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