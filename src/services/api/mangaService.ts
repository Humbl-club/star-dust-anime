
import { BaseApiService, BaseContent, BaseQueryOptions, ServiceResponse, ApiResponse } from './baseService';
import { PaginationInfo } from '@/types/api.types';

export interface MangaContent extends BaseContent {
  chapters: number;
  volumes: number;
  published_from?: string;
  published_to?: string;
  next_chapter_date?: string;
  authors: string[];
}

interface DatabaseMangaResponse {
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
  manga_details?: {
    chapters?: number;
    volumes?: number;
    published_from?: string;
    published_to?: string;
    status?: string;
    type?: string;
    next_chapter_date?: string;
  };
  title_genres?: Array<{ genres: { name: string } }>;
  title_authors?: Array<{ authors: { name: string } }>;
}

export interface MangaQueryOptions extends BaseQueryOptions {
  // Manga-specific options can be added here
}

class MangaApiService extends BaseApiService {
  // Fetch manga data using edge function
  async fetchManga(options: MangaQueryOptions): Promise<ServiceResponse<ApiResponse<MangaContent>>> {
    try {
      const params = this.buildUrlParams(options);
      
      const { data: response, error } = await this.supabase.functions.invoke('anime-api', {
        body: {
          method: 'GET',
          path: `/manga?${params.toString()}`
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
      return this.handleError(err, 'fetch manga data');
    }
  }

  // Direct database query with optimized filtering using new indexes
  async fetchMangaOptimized(options: MangaQueryOptions): Promise<ServiceResponse<{ data: MangaContent[], pagination: PaginationInfo }>> {
    try {
      const {
        page = 1,
        limit = 20,
        search,
        genre,
        status,
        type,
        year,
        sort_by = 'score',
        order = 'desc'
      } = options;

      console.log('📚 MangaService: Fetching manga with optimized query using new indexes:', {
        ...options,
        page,
        limit,
        offset: (page - 1) * limit
      });

      // Build optimized query leveraging the new content_type column and indexes
      let query = this.supabase
        .from('titles')
        .select(`
          *,
          manga_details!inner(*),
          ${genre ? 'title_genres!inner(genres!inner(*))' : 'title_genres(genres(*))'},
          title_authors(authors(*))
        `, { count: 'exact' })
        .eq('content_type', 'manga'); // Use the new indexed content_type column

      // Apply manga-specific filters at database level
      if (status) {
        query = query.eq('manga_details.status', status);
      }
      if (type) {
        query = query.eq('manga_details.type', type);
      }

      // Apply genre filter at database level
      if (genre) {
        query = query.eq('title_genres.genres.name', genre);
      }

      // Apply year filter using the optimized year index
      if (year) {
        query = query.eq('year', parseInt(year));
      }

      // Apply text search using the new full-text search index
      if (search) {
        const searchTerm = search.trim();
        if (searchTerm) {
          // Use the new GIN index for full-text search
          query = query.textSearch('fts', searchTerm, {
            type: 'websearch',
            config: 'english'
          });
        }
      }

      // Apply sorting using the optimized indexes
      if (sort_by === 'score') {
        // Use the new score index for optimal performance
        query = query.order('score', { ascending: order === 'asc', nullsFirst: false });
      } else if (sort_by === 'year') {
        // Use the new year index for optimal performance
        query = query.order('year', { ascending: order === 'asc', nullsFirst: false });
      } else {
        query = query.order(sort_by, { ascending: order === 'asc', nullsFirst: false });
      }

      // Apply pagination
      const from = (page - 1) * limit;
      const to = from + limit - 1;
      query = query.range(from, to);

      console.log('🎯 MangaService: Executing optimized query...');
      const { data: response, error, count } = await query;

      console.log('📊 MangaService: Raw query result:', {
        dataLength: response?.length || 0,
        error: error?.message,
        totalCount: count,
        sampleData: response?.[0],
        fullError: error
      });

      if (error) {
        console.error('❌ MangaService: Query error:', error);
        throw error;
      }

      // Transform data to match expected format
      const transformedData = (response as DatabaseMangaResponse[])?.map((item) => {
        const details = item.manga_details;
        
        // Map database status to frontend expectations
        let mappedStatus = details?.status || 'Unknown';
        switch (mappedStatus) {
          case 'RELEASING':
            mappedStatus = 'Currently Publishing';
            break;
          case 'FINISHED':
            mappedStatus = 'Finished';
            break;
          case 'NOT_YET_RELEASED':
            mappedStatus = 'Not Yet Published';
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
          chapters: details?.chapters || 0,
          volumes: details?.volumes || 0,
          published_from: details?.published_from,
          published_to: details?.published_to,
          status: mappedStatus,
          type: details?.type || 'Manga',
          next_chapter_date: details?.next_chapter_date,
          authors: item.title_authors?.map((ta) => ta.authors?.name).filter(Boolean) || []
        };
      }) || [];

      console.log('🔄 MangaService: Transformed data:', {
        originalLength: response?.length || 0,
        transformedLength: transformedData.length,
        sampleTransformed: transformedData[0]
      });

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
      return this.handleError(err, 'fetch manga data');
    }
  }

  // Sync manga from external API
  async syncManga(pages = 1): Promise<ServiceResponse<unknown>> {
    return this.syncFromExternalAPI('manga', pages);
  }

  async syncMangaImages(limit = 10): Promise<ServiceResponse<unknown>> {
    return this.syncImages('manga', limit);
  }

  async getMangaById(id: string): Promise<ServiceResponse<MangaContent | null>> {
    try {
      const { data, error } = await this.supabase
        .from('titles')
        .select(`
          *,
          manga_details(*),
          title_genres(genres(*)),
          title_authors(authors(*))
        `)
        .eq('id', id)
        .eq('content_type', 'manga') // Use the new content_type column
        .maybeSingle();

      if (error) {
        throw error;
      }

      if (!data) {
        return this.handleSuccess(null);
      }

      // Transform single manga data
      const mangaData = data as DatabaseMangaResponse;
      const details = mangaData.manga_details;
      const transformedManga: MangaContent = {
        id: data.id,
        anilist_id: data.anilist_id,
        title: data.title || 'Unknown Title',
        title_english: data.title_english,
        title_japanese: data.title_japanese,
        synopsis: data.synopsis || '',
        image_url: data.image_url || '',
        score: data.score,
        anilist_score: data.anilist_score,
        rank: data.rank,
        popularity: data.popularity,
        favorites: data.favorites || 0,
        year: data.year,
        color_theme: data.color_theme,
        genres: mangaData.title_genres?.map((tg) => tg.genres?.name).filter(Boolean) || [],
        members: data.popularity || 0,
        chapters: details?.chapters || 0,
        volumes: details?.volumes || 0,
        published_from: details?.published_from,
        published_to: details?.published_to,
        status: details?.status || 'Unknown',
        type: details?.type || 'Manga',
        next_chapter_date: details?.next_chapter_date,
        authors: mangaData.title_authors?.map((ta) => ta.authors?.name).filter(Boolean) || []
      };

      return this.handleSuccess(transformedManga);
    } catch (err: unknown) {
      return this.handleError(err, 'fetch manga details');
    }
  }
}

export const mangaService = new MangaApiService();
