import { BaseApiService, BaseContent, BaseQueryOptions, ServiceResponse } from './baseService';
import { PaginationInfo } from '@/types/api.types';

export interface MangaContent extends BaseContent {
  chapters: number;
  volumes: number;
  published_from?: string;
  published_to?: string;
  next_chapter_date?: string;
  authors: string[];
}

export interface MangaQueryOptions extends BaseQueryOptions {
  // Manga-specific options can be added here
}

interface MangaListResponse {
  data: MangaContent[];
  pagination: PaginationInfo;
}

class MangaApiService extends BaseApiService {
  async fetchManga(options: MangaQueryOptions): Promise<ServiceResponse<MangaListResponse>> {
    // First try edge function
    const edgeResult = await this.invokeEdgeFunction<MangaListResponse>('anime-api', {
      contentType: 'manga',
      ...options
    });
    
    // Fallback to direct database query if edge function fails
    if (!edgeResult.success) {
      console.warn('Edge function failed, falling back to direct query');
      return this.fetchMangaDirect(options);
    }
    
    return edgeResult;
  }
  
  private async fetchMangaDirect(options: MangaQueryOptions): Promise<ServiceResponse<MangaListResponse>> {
    const { page = 1, limit = 20, search, genre, status, sort_by = 'score', order = 'desc' } = options;
    
    return this.handleSupabaseRequest(async () => {
      let query = this.supabase
        .from('titles')
        .select(`
          *,
          manga_details!inner(*),
          title_genres(genres(name)),
          title_authors(authors(name))
        `, { count: 'exact' })
        .eq('content_type', 'manga')
        .range((page - 1) * limit, page * limit - 1);
      
      // Apply filters
      if (search) {
        query = query.ilike('title', `%${search}%`);
      }
      
      if (genre) {
        query = query.contains('title_genres.genres.name', [genre]);
      }
      
      if (status) {
        query = query.eq('manga_details.status', status);
      }
      
      // Apply sorting
      const sortColumn = sort_by === 'score' ? 'anilist_score' : sort_by;
      query = query.order(sortColumn, { ascending: order === 'asc', nullsFirst: false });
      
      const { data, error, count } = await query;
      
      if (error) throw error;
      
      return {
        data: {
          data: this.transformMangaData(data || []),
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
  
  private transformMangaData(rawData: any[]): MangaContent[] {
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
      chapters: item.manga_details?.chapters || 0,
      volumes: item.manga_details?.volumes || 0,
      published_from: item.manga_details?.published_from,
      published_to: item.manga_details?.published_to,
      status: item.manga_details?.status || 'Unknown',
      type: item.manga_details?.type || 'Manga',
      next_chapter_date: item.manga_details?.next_chapter_date,
      authors: item.title_authors?.map((ta: any) => ta.authors.name) || []
    }));
  }

  // Alias for backwards compatibility
  async fetchMangaOptimized(options: MangaQueryOptions): Promise<ServiceResponse<MangaListResponse>> {
    return this.fetchManga(options);
  }

  async getMangaById(id: string): Promise<ServiceResponse<MangaContent | null>> {
    return this.invokeEdgeFunction<MangaContent | null>('manga-detail-single', {
      id
    });
  }

  // Sync manga from external API
  async syncManga(pages = 1): Promise<ServiceResponse<unknown>> {
    return this.syncFromExternalAPI('manga', pages);
  }

  async syncMangaImages(limit = 10): Promise<ServiceResponse<unknown>> {
    return this.syncImages('manga', limit);
  }
}

export const mangaService = new MangaApiService();