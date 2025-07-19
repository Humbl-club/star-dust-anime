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

  // Direct database query with optimized filtering
  async fetchAnimeOptimized(options: AnimeQueryOptions): Promise<ServiceResponse<{ data: AnimeContent[], pagination: PaginationInfo }>> {
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

      console.log('Fetching anime with optimized query:', options);

      // Build optimized query with server-side filtering
      let query = this.supabase
        .from('titles')
        .select(`
          *,
          anime_details!inner(*),
          ${genre ? 'title_genres!inner(genres!inner(*))' : 'title_genres(genres(*))'},
          title_studios(studios(*))
        `, { count: 'exact' });

      // Apply anime-specific filters at database level
      if (status) {
        query = query.eq('anime_details.status', status);
      }
      if (type) {
        query = query.eq('anime_details.type', type);
      }
      if (season) {
        query = query.eq('anime_details.season', season);
      }

      // Apply genre filter at database level
      if (genre) {
        query = query.eq('title_genres.genres.name', genre);
      }

      // Apply year filter
      if (year) {
        query = query.eq('year', parseInt(year));
      }

      // Apply text search
      if (search) {
        const searchTerm = search.trim();
        if (searchTerm) {
          query = query.or(`title.ilike.%${searchTerm}%,title_english.ilike.%${searchTerm}%,title_japanese.ilike.%${searchTerm}%`);
        }
      }

      // Apply sorting
      const sortField = sort_by === 'score' ? 'score' : sort_by;
      query = query.order(sortField, { ascending: order === 'asc', nullsFirst: false });

      // Apply pagination
      const from = (page - 1) * limit;
      const to = from + limit - 1;
      query = query.range(from, to);

      const { data: response, error, count } = await query;

      if (error) {
        throw error;
      }

      // Transform data to match expected format
      const transformedData = (response as DatabaseAnimeResponse[])?.map((item) => {
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
        
        return {
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
          genres: item.title_genres?.map((tg) => tg.genres?.name).filter(Boolean) || [],
          members: item.popularity || 0,
          episodes: details?.episodes || 0,
          aired_from: details?.aired_from,
          aired_to: details?.aired_to,
          season: details?.season,
          status: mappedStatus,
          type: details?.type || 'TV',
          trailer_url: details?.trailer_url,
          next_episode_date: details?.next_episode_date,
          studios: item.title_studios?.map((ts) => ts.studios?.name).filter(Boolean) || []
        };
      }) || [];

      // Build pagination info
      const totalPages = count ? Math.ceil(count / limit) : 1;
      const pagination = {
        current_page: page,
        per_page: limit,
        total: count || 0,
        total_pages: totalPages,
        has_next_page: page < totalPages,
        has_prev_page: page > 1
      };

      return this.handleSuccess({ data: transformedData, pagination });
    } catch (err: unknown) {
      return this.handleError(err, 'fetch anime data');
    }
  }

  // Sync anime from external API
  async syncAnime(pages = 1): Promise<ServiceResponse<unknown>> {
    return this.syncFromExternalAPI('anime', pages);
  }

  // Sync anime images
  async syncAnimeImages(limit = 10): Promise<ServiceResponse<unknown>> {
    return this.syncImages('anime', limit);
  }

  // Get single anime by ID
  async getAnimeById(id: string): Promise<ServiceResponse<AnimeContent | null>> {
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
        .maybeSingle();

      if (error) {
        throw error;
      }

      if (!data) {
        return this.handleSuccess(null);
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
        studios: animeData.title_studios?.map((ts) => ts.studios?.name).filter(Boolean) || []
      };

      return this.handleSuccess(transformedAnime);
    } catch (err: unknown) {
      return this.handleError(err, 'fetch anime details');
    }
  }
}

export const animeService = new AnimeApiService();