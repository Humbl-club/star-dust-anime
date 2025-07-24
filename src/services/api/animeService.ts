
import { BaseApiService, BaseContent, BaseQueryOptions, ServiceResponse, ApiResponse } from './baseService';
import { PaginationInfo } from '@/types/api.types';

export interface AnimeContent extends BaseContent {
  episodes: number;
  aired_from?: string;
  aired_to?: string;
  season?: string;
  trailer_url?: string;
  next_episode_date?: string;
  studios: string[];
  created_at: string;
  updated_at: string;
}

export interface AnimeQueryOptions extends BaseQueryOptions {
  season?: string;
}

interface DatabaseAnimeResponse {
  id: string;
  anilist_id: number;
  title: string;
  title_english?: string;
  title_japanese?: string;
  synopsis?: string;
  image_url?: string;
  score?: number;
  anilist_score?: number;
  rank?: number;
  popularity?: number;
  favorites?: number;
  year?: number;
  color_theme?: string;
  content_type?: string;
  created_at: string;
  updated_at: string;
  anime_details?: {
    episodes?: number;
    aired_from?: string;
    aired_to?: string;
    season?: string;
    status?: string;
    type?: string;
    trailer_url?: string;
    next_episode_date?: string;
  };
  title_genres?: Array<{ genres: { name: string } }>;
  title_studios?: Array<{ studios: { name: string } }>;
}

// Simple response type without complex generics
interface AnimeListResponse {
  data: AnimeContent[];
  pagination: PaginationInfo;
}

// Explicit simple response type to avoid deep instantiation
interface AnimeServiceResponse<T> {
  success: boolean;
  data: T | null;
  error: string | null;
}

class AnimeApiService extends BaseApiService {
  // Fetch anime data using edge function
  async fetchAnime(options: AnimeQueryOptions): Promise<ServiceResponse<ApiResponse<AnimeContent>>> {
    try {
      const params = this.buildUrlParams(options);
      
      const { data: response, error } = await this.supabase.functions.invoke('anime-api', {
        body: {
          method: 'GET',
          path: `/anime?${params.toString()}`
        }
      });

      if (error) {
        throw error;
      }

      if (!response?.data) {
        throw new Error('Invalid response format');
      }

      return this.handleSuccess(response);
    } catch (err: unknown) {
      return this.handleError(err, 'fetch anime data');
    }
  }

  // Direct database query with simple typing to avoid deep instantiation
  async fetchAnimeOptimized(options: AnimeQueryOptions): Promise<AnimeServiceResponse<AnimeListResponse>> {
    try {
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

      console.log('🎬 AnimeService: Fetching anime with simple query approach:', {
        ...options,
        page,
        limit,
        offset: (page - 1) * limit
      });

      // Use the edge function instead of complex database queries
      const { data: response, error } = await this.supabase.functions.invoke('anime-api', {
        body: {
          contentType: 'anime',
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

      console.log('📊 AnimeService: Edge function result:', {
        hasData: !!response?.data,
        dataLength: response?.data?.length || 0,
        error: error?.message,
        pagination: response?.pagination
      });

      if (error) {
        console.error('❌ AnimeService: Edge function error:', error);
        throw error;
      }

      if (!response?.data) {
        throw new Error('No data received from anime API');
      }

      // Transform data to match expected format
      const animeItems: AnimeContent[] = response.data.map((item: any) => {
        // Map database status to frontend expectations
        let mappedStatus = item.status || 'Unknown';
        switch (mappedStatus) {
          case 'RELEASING':
            mappedStatus = 'Currently Airing';
            break;
          case 'FINISHED':
            mappedStatus = 'Finished Airing';
            break;
          case 'NOT_YET_RELEASED':
            mappedStatus = 'Not Yet Aired';
            break;
          case 'CANCELLED':
            mappedStatus = 'Cancelled';
            break;
        }
        
        return {
          id: item.id,
          anilist_id: item.anilist_id || 0,
          title: item.title || 'Unknown Title',
          title_english: item.title_english,
          title_japanese: item.title_japanese,
          synopsis: item.synopsis || '',
          image_url: item.image_url || '',
          score: item.score,
          anilist_score: item.anilist_score,
          rank: item.rank,
          popularity: item.popularity,
          favorites: item.favorites || 0,
          year: item.year,
          color_theme: item.color_theme,
          genres: [], // Will be populated by edge function
          members: item.popularity || 0,
          episodes: item.episodes || 0,
          aired_from: item.aired_from,
          aired_to: item.aired_to,
          season: item.season,
          status: mappedStatus,
          type: item.type || 'TV',
          trailer_url: item.trailer_url,
          next_episode_date: item.next_episode_date,
          studios: [], // Will be populated by edge function
          created_at: item.created_at || new Date().toISOString(),
          updated_at: item.updated_at || new Date().toISOString()
        };
      });

      console.log('🔄 AnimeService: Transformed data:', {
        originalLength: response.data.length,
        transformedLength: animeItems.length,
        sampleTransformed: animeItems[0]
      });

      // Build pagination info
      const paginationInfo: PaginationInfo = response.pagination || {
        current_page: page,
        per_page: limit,
        total: animeItems.length,
        total_pages: Math.ceil(animeItems.length / limit),
        has_next_page: false,
        has_prev_page: page > 1
      };

      const result_data: AnimeListResponse = {
        data: animeItems,
        pagination: paginationInfo
      };

      return {
        success: true,
        data: result_data,
        error: null
      };
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      console.error('❌ AnimeService: Fetch error:', errorMessage);
      return {
        success: false,
        data: null,
        error: errorMessage
      };
    }
  }

  // Sync anime from external API
  async syncAnime(pages = 1): Promise<ServiceResponse<unknown>> {
    return this.syncFromExternalAPI('anime', pages);
  }

  async syncAnimeImages(limit = 10): Promise<ServiceResponse<unknown>> {
    return this.syncImages('anime', limit);
  }

  async getAnimeById(id: string): Promise<AnimeServiceResponse<AnimeContent>> {
    try {
      // Use edge function for single anime fetch to avoid complex typing
      const { data: response, error } = await this.supabase.functions.invoke('anime-detail-single', {
        method: 'POST',
        body: { id }
      });

      if (error) {
        console.error('❌ AnimeService: Single anime fetch error:', error);
        throw error;
      }

      if (!response?.success || !response?.data) {
        return {
          success: true,
          data: null,
          error: null
        };
      }

      const animeData = response.data;
      
      // Transform single anime data with simple mapping
      const transformedAnime: AnimeContent = {
        id: animeData.id,
        anilist_id: animeData.anilist_id || 0,
        title: animeData.title || 'Unknown Title',
        title_english: animeData.title_english,
        title_japanese: animeData.title_japanese,
        synopsis: animeData.synopsis || '',
        image_url: animeData.image_url || '',
        score: animeData.score,
        anilist_score: animeData.anilist_score,
        rank: animeData.rank,
        popularity: animeData.popularity,
        favorites: animeData.favorites || 0,
        year: animeData.year,
        color_theme: animeData.color_theme,
        genres: animeData.genres || [],
        members: animeData.popularity || 0,
        episodes: animeData.episodes || 0,
        aired_from: animeData.aired_from,
        aired_to: animeData.aired_to,
        season: animeData.season,
        status: animeData.status || 'Unknown',
        type: animeData.type || 'TV',
        trailer_url: animeData.trailer_url,
        next_episode_date: animeData.next_episode_date,
        studios: animeData.studios || [],
        created_at: animeData.created_at || new Date().toISOString(),
        updated_at: animeData.updated_at || new Date().toISOString()
      };

      return {
        success: true,
        data: transformedAnime,
        error: null
      };
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      console.error('❌ AnimeService: Get by ID error:', errorMessage);
      return {
        success: false,
        data: null,
        error: errorMessage
      };
    }
  }
}

export const animeService = new AnimeApiService();
