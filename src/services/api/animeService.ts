
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

// Simple query result type to avoid deep instantiation
interface QueryResult {
  data: any[] | null;
  error: any | null;
  count: number | null;
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

  // Direct database query with optimized filtering using new indexes
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

      console.log('🎬 AnimeService: Fetching anime with optimized query using new indexes:', {
        ...options,
        page,
        limit,
        offset: (page - 1) * limit
      });

      // Build the select query string based on genre filter
      const selectQuery = genre 
        ? `*, anime_details!inner(*), title_genres!inner(genres!inner(*)), title_studios(studios(*))`
        : `*, anime_details!inner(*), title_genres(genres(*)), title_studios(studios(*))`;

      // Execute the query with explicit result typing
      const queryBuilder = this.supabase
        .from('titles')
        .select(selectQuery, { count: 'exact' })
        .eq('content_type', 'anime');

      // Apply anime-specific filters
      if (status) {
        queryBuilder.eq('anime_details.status', status);
      }
      if (type) {
        queryBuilder.eq('anime_details.type', type);
      }
      if (season) {
        queryBuilder.eq('anime_details.season', season);
      }

      // Apply genre filter
      if (genre) {
        queryBuilder.eq('title_genres.genres.name', genre);
      }

      // Apply year filter
      if (year) {
        queryBuilder.eq('year', parseInt(year));
      }

      // Apply text search
      if (search) {
        const searchTerm = search.trim();
        if (searchTerm) {
          queryBuilder.textSearch('fts', searchTerm, {
            type: 'websearch',
            config: 'english'
          });
        }
      }

      // Apply sorting
      if (sort_by === 'score') {
        queryBuilder.order('score', { ascending: order === 'asc', nullsFirst: false });
      } else if (sort_by === 'year') {
        queryBuilder.order('year', { ascending: order === 'asc', nullsFirst: false });
      } else {
        queryBuilder.order(sort_by, { ascending: order === 'asc', nullsFirst: false });
      }

      // Apply pagination
      const from = (page - 1) * limit;
      const to = from + limit - 1;
      queryBuilder.range(from, to);

      console.log('🎯 AnimeService: Executing optimized query...');
      
      // Execute query and cast to simple type
      const queryResult = await queryBuilder as unknown as Promise<QueryResult>;
      const { data: response, error, count } = queryResult;

      console.log('📊 AnimeService: Raw query result:', {
        dataLength: response?.length || 0,
        error: error?.message,
        totalCount: count,
        sampleData: response?.[0],
        fullError: error
      });

      if (error) {
        console.error('❌ AnimeService: Query error:', error);
        throw error;
      }

      // Transform data to match expected format with explicit typing
      const animeItems: AnimeContent[] = [];
      
      if (response && Array.isArray(response)) {
        response.forEach((item: DatabaseAnimeResponse) => {
          const details = item.anime_details;
          
          // Map database status to frontend expectations
          let mappedStatus = details?.status || 'Unknown';
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
          
          const animeItem: AnimeContent = {
            id: item.id,
            anilist_id: item.anilist_id,
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
            genres: item.title_genres?.map((tg: any) => tg.genres?.name).filter(Boolean) || [],
            members: item.popularity || 0,
            episodes: details?.episodes || 0,
            aired_from: details?.aired_from,
            aired_to: details?.aired_to,
            season: details?.season,
            status: mappedStatus,
            type: details?.type || 'TV',
            trailer_url: details?.trailer_url,
            next_episode_date: details?.next_episode_date,
            studios: item.title_studios?.map((ts: any) => ts.studios?.name).filter(Boolean) || [],
            created_at: item.created_at || new Date().toISOString(),
            updated_at: item.updated_at || new Date().toISOString()
          };
          
          animeItems.push(animeItem);
        });
      }

      console.log('🔄 AnimeService: Transformed data:', {
        originalLength: response?.length || 0,
        transformedLength: animeItems.length,
        sampleTransformed: animeItems[0]
      });

      // Build pagination info with explicit typing
      const totalPages = count ? Math.ceil(count / limit) : 1;
      const paginationInfo: PaginationInfo = {
        current_page: page,
        per_page: limit,
        total: count || 0,
        total_pages: totalPages,
        has_next_page: page < totalPages,
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
      const { data, error } = await this.supabase
        .from('titles')
        .select(`
          *,
          anime_details(*),
          title_genres(genres(*)),
          title_studios(studios(*))
        `)
        .eq('id', id)
        .eq('content_type', 'anime') // Use the new content_type column
        .maybeSingle();

      if (error) {
        throw error;
      }

      if (!data) {
        return {
          success: true,
          data: null,
          error: null
        };
      }

      // Transform single anime data
      const animeData = data as DatabaseAnimeResponse;
      const details = animeData.anime_details;
      const transformedAnime: AnimeContent = {
        id: animeData.id,
        anilist_id: animeData.anilist_id,
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
        genres: animeData.title_genres?.map((tg) => tg.genres?.name).filter(Boolean) || [],
        members: animeData.popularity || 0,
        episodes: details?.episodes || 0,
        aired_from: details?.aired_from,
        aired_to: details?.aired_to,
        season: details?.season,
        status: details?.status || 'Unknown',
        type: details?.type || 'TV',
        trailer_url: details?.trailer_url,
        next_episode_date: details?.next_episode_date,
        studios: animeData.title_studios?.map((ts) => ts.studios?.name).filter(Boolean) || [],
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
      return {
        success: false,
        data: null,
        error: errorMessage
      };
    }
  }
}

export const animeService = new AnimeApiService();
