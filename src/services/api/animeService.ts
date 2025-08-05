import { BaseApiService, BaseContent, BaseQueryOptions, ServiceResponse } from './baseService';
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

interface AnimeListResponse {
  data: AnimeContent[];
  pagination: PaginationInfo;
}

class AnimeApiService extends BaseApiService {
  async fetchAnime(options: AnimeQueryOptions): Promise<ServiceResponse<AnimeListResponse>> {
    // First try edge function
    const edgeResult = await this.invokeEdgeFunction<AnimeListResponse>('anime-api', {
      contentType: 'anime',
      ...options
    });
    
    // Fallback to direct database query if edge function fails
    if (!edgeResult.success) {
      console.warn('Edge function failed, falling back to direct query');
      return this.fetchAnimeDirect(options);
    }
    
    return edgeResult;
  }
  
  private async fetchAnimeDirect(options: AnimeQueryOptions): Promise<ServiceResponse<AnimeListResponse>> {
    const { page = 1, limit = 20, search, genre, status, sort_by = 'score', order = 'desc' } = options;
    
    return this.handleSupabaseRequest(async () => {
      let query = this.supabase
        .from('titles')
        .select(`
          *,
          anime_details!inner(*),
          title_genres(genres(name)),
          title_studios(studios(name))
        `, { count: 'exact' })
        .eq('content_type', 'anime')
        .range((page - 1) * limit, page * limit - 1);
      
      // Apply filters
      if (search) {
        query = query.ilike('title', `%${search}%`);
      }
      
      if (genre) {
        query = query.contains('title_genres.genres.name', [genre]);
      }
      
      if (status) {
        query = query.eq('anime_details.status', status);
      }
      
      // Apply sorting
      const sortColumn = sort_by === 'score' ? 'anilist_score' : sort_by;
      query = query.order(sortColumn, { ascending: order === 'asc', nullsFirst: false });
      
      const { data, error, count } = await query;
      
      if (error) throw error;
      
      return {
        data: {
          data: this.transformAnimeData(data || []),
          pagination: {
            current_page: page,
            per_page: limit,
            total: count || 0,
            total_pages: Math.ceil((count || 0) / limit),
            has_next_page: page < Math.ceil((count || 0) / limit),
            has_prev_page: page > 1
          }
        },
        error: null
      };
    });
  }
  
  private transformAnimeData(rawData: any[]): AnimeContent[] {
    return rawData.map(item => ({
      id: item.id,
      anilist_id: item.anilist_id,
      title: item.title,
      title_english: item.title_english,
      title_japanese: item.title_japanese,
      synopsis: item.synopsis,
      image_url: item.image_url,
      score: item.anilist_score || item.score,
      anilist_score: item.anilist_score,
      rank: item.rank,
      popularity: item.popularity,
      favorites: item.favorites || 0,
      year: item.year,
      color_theme: item.color_theme,
      genres: item.title_genres?.map((tg: any) => tg.genres.name) || [],
      members: item.popularity || 0,
      episodes: item.anime_details?.episodes || 0,
      aired_from: item.anime_details?.aired_from,
      aired_to: item.anime_details?.aired_to,
      season: item.anime_details?.season,
      status: item.anime_details?.status || 'Unknown',
      type: item.anime_details?.type || 'TV',
      trailer_url: item.anime_details?.trailer_url,
      next_episode_date: item.anime_details?.next_episode_date,
      studios: item.title_studios?.map((ts: any) => ts.studios.name) || [],
      created_at: item.created_at || new Date().toISOString(),
      updated_at: item.updated_at || new Date().toISOString()
    }));
  }

  async getAnimeById(id: string): Promise<ServiceResponse<AnimeContent | null>> {
    return this.invokeEdgeFunction<AnimeContent | null>('anime-detail-single', {
      id
    });
  }

  // Sync anime from external API
  async syncAnime(pages = 1): Promise<ServiceResponse<unknown>> {
    return this.syncFromExternalAPI('anime', pages);
  }

  async syncAnimeImages(limit = 10): Promise<ServiceResponse<unknown>> {
    return this.syncImages('anime', limit);
  }

  // Alias for backwards compatibility
  async fetchAnimeOptimized(options: AnimeQueryOptions): Promise<ServiceResponse<AnimeListResponse>> {
    return this.fetchAnime(options);
  }
}

export const animeService = new AnimeApiService();