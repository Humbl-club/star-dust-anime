
import { BaseApiService, ServiceResponse } from './baseService';
import { AnimeContent } from './animeService';
import { MangaContent } from './mangaService';

// Database response interfaces for search with proper typing
interface DatabaseSearchAnimeResponse {
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
    last_sync_check?: string;
  };
  title_genres?: Array<{ genres: { name: string } }>;
  title_studios?: Array<{ studios: { name: string } }>;
}

interface DatabaseSearchMangaResponse {
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
  manga_details?: {
    chapters?: number;
    volumes?: number;
    published_from?: string;
    published_to?: string;
    status?: string;
    type?: string;
    next_chapter_date?: string;
    last_sync_check?: string;
  };
  title_genres?: Array<{ genres: { name: string } }>;
  title_authors?: Array<{ authors: { name: string } }>;
}

export interface SearchResult {
  anime: AnimeContent[];
  manga: MangaContent[];
  totalResults: number;
}

export interface SearchOptions {
  query: string;
  type?: 'anime' | 'manga' | 'both';
  limit?: number;
  genres?: string[];
  year?: string;
  status?: string;
  sort_by?: string;
  order?: 'asc' | 'desc';
}

class SearchApiService extends BaseApiService {
  // Global search across anime and manga using optimized indexes
  async globalSearch(options: SearchOptions): Promise<ServiceResponse<SearchResult>> {
    try {
      const {
        query,
        type = 'both',
        limit = 20,
        genres,
        year,
        status,
        sort_by = 'score',
        order = 'desc'
      } = options;

      if (!query.trim()) {
        return this.handleSuccess({
          anime: [],
          manga: [],
          totalResults: 0
        });
      }

      const searchTerm = query.trim();
      const results: SearchResult = {
        anime: [],
        manga: [],
        totalResults: 0
      };

      // Search anime if requested using optimized content_type filter
      if (type === 'anime' || type === 'both') {
        let animeQuery = this.supabase
          .from('titles')
          .select(`
            *,
            anime_details!inner(*),
            title_genres(genres(*)),
            title_studios(studios(*))
          `) as any;
        
        animeQuery = animeQuery.eq('content_type', 'anime') // Use the new indexed content_type column
          .textSearch('fts', searchTerm, {
            type: 'websearch',
            config: 'english'
          }); // Use the new full-text search index

        // Apply filters
        if (genres && genres.length > 0) {
          animeQuery = animeQuery.in('title_genres.genres.name', genres);
        }
        if (year) {
          animeQuery = animeQuery.eq('year', parseInt(year));
        }
        if (status) {
          animeQuery = animeQuery.eq('anime_details.status', status);
        }

        // Apply sorting and limit using optimized indexes
        if (sort_by === 'score') {
          animeQuery = animeQuery.order('score', { ascending: order === 'asc', nullsFirst: false });
        } else if (sort_by === 'year') {
          animeQuery = animeQuery.order('year', { ascending: order === 'asc', nullsFirst: false });
        } else {
          animeQuery = animeQuery.order(sort_by, { ascending: order === 'asc', nullsFirst: false });
        }
        
        animeQuery = animeQuery.limit(type === 'both' ? Math.floor(limit / 2) : limit);

        const { data: animeData, error: animeError } = await animeQuery;

        if (animeError) {
          console.error('Anime search error:', animeError);
        } else {
          results.anime = (animeData as any[])?.map((item: any) => {
            const details = item.anime_details;
            return {
              id: item.id,
              anilist_id: item.anilist_id,
              title: item.title || 'Unknown Title',
              title_english: item.title_english || '',
              title_japanese: item.title_japanese || '',
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
              status: details?.status || 'Unknown',
              type: details?.type || 'TV',
              trailer_url: details?.trailer_url,
              next_episode_date: details?.next_episode_date,
              studios: item.title_studios?.map((ts: any) => ts.studios?.name).filter(Boolean) || [],
              created_at: item.created_at || new Date().toISOString(),
              updated_at: item.updated_at || new Date().toISOString()
            };
          }) || [];
        }
      }

      // Search manga if requested using optimized content_type filter
      if (type === 'manga' || type === 'both') {
        let mangaQuery = this.supabase
          .from('titles')
          .select(`
            *,
            manga_details!inner(*),
            title_genres(genres(*)),
            title_authors(authors(*))
          `) as any;
        
        mangaQuery = mangaQuery.eq('content_type', 'manga') // Use the new indexed content_type column
          .textSearch('fts', searchTerm, {
            type: 'websearch',
            config: 'english'
          }); // Use the new full-text search index

        // Apply filters
        if (genres && genres.length > 0) {
          mangaQuery = mangaQuery.in('title_genres.genres.name', genres);
        }
        if (year) {
          mangaQuery = mangaQuery.eq('year', parseInt(year));
        }
        if (status) {
          mangaQuery = mangaQuery.eq('manga_details.status', status);
        }

        // Apply sorting and limit using optimized indexes
        if (sort_by === 'score') {
          mangaQuery = mangaQuery.order('score', { ascending: order === 'asc', nullsFirst: false });
        } else if (sort_by === 'year') {
          mangaQuery = mangaQuery.order('year', { ascending: order === 'asc', nullsFirst: false });
        } else {
          mangaQuery = mangaQuery.order(sort_by, { ascending: order === 'asc', nullsFirst: false });
        }
        
        mangaQuery = mangaQuery.limit(type === 'both' ? Math.floor(limit / 2) : limit);

        const { data: mangaData, error: mangaError } = await mangaQuery;

        if (mangaError) {
          console.error('Manga search error:', mangaError);
        } else {
          results.manga = (mangaData as any[])?.map((item: any) => {
            const details = item.manga_details;
            return {
              id: item.id,
              anilist_id: item.anilist_id,
              title: item.title || 'Unknown Title',
              title_english: item.title_english || '',
              title_japanese: item.title_japanese || '',
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
              chapters: details?.chapters || 0,
              volumes: details?.volumes || 0,
              published_from: details?.published_from,
              published_to: details?.published_to,
              status: details?.status || 'Unknown',
              type: details?.type || 'Manga',
              next_chapter_date: details?.next_chapter_date,
              authors: item.title_authors?.map((ta: any) => ta.authors?.name).filter(Boolean) || [],
              created_at: item.created_at || new Date().toISOString(),
              updated_at: item.updated_at || new Date().toISOString()
            };
          }) || [];
        }
      }

      results.totalResults = results.anime.length + results.manga.length;

      return this.handleSuccess(results);
    } catch (err: unknown) {
      return this.handleError(err, 'perform search');
    }
  }

  // Get search suggestions using the new full-text search index
  async getSearchSuggestions(query: string, limit = 5): Promise<ServiceResponse<string[]>> {
    try {
      if (!query.trim() || query.length < 2) {
        return this.handleSuccess([]);
      }

      const searchTerm = query.trim();
      
      const { data, error } = await this.supabase
        .from('titles')
        .select('title, title_english')
        .textSearch('fts', searchTerm, {
          type: 'websearch',
          config: 'english'
        })
        .limit(limit);

      if (error) {
        throw error;
      }

      const suggestions = data?.map(item => item.title_english || item.title).filter(Boolean) || [];
      
      return this.handleSuccess(suggestions);
    } catch (err: unknown) {
      return this.handleError(err, 'fetch search suggestions');
    }
  }

  // Advanced search with multiple filters using optimized indexes
  async advancedSearch(options: {
    query?: string;
    genres?: string[];
    year?: string;
    status?: string;
    type?: string;
    score_min?: number;
    score_max?: number;
    content_type: 'anime' | 'manga';
    sort_by?: string;
    order?: 'asc' | 'desc';
    limit?: number;
    page?: number;
  }): Promise<ServiceResponse<{ data: any[], pagination: any }>> {
    try {
      const {
        query,
        genres,
        year,
        status,
        type,
        score_min,
        score_max,
        content_type,
        sort_by = 'score',
        order = 'desc',
        limit = 20,
        page = 1
      } = options;

      let dbQuery = this.supabase
        .from('titles')
        .select(`
          *,
          ${content_type === 'anime' ? 'anime_details!inner(*)' : 'manga_details!inner(*)'},
          title_genres(genres(*)),
          ${content_type === 'anime' ? 'title_studios(studios(*))' : 'title_authors(authors(*))'}
        `, { count: 'exact' }) as any;
      
      dbQuery = dbQuery.eq('content_type', content_type); // Use the new indexed content_type column

      // Apply text search using the new full-text search index
      if (query && query.trim()) {
        const searchTerm = query.trim();
        dbQuery = dbQuery.textSearch('fts', searchTerm, {
          type: 'websearch',
          config: 'english'
        });
      }

      // Apply genre filter
      if (genres && genres.length > 0) {
        dbQuery = dbQuery.in('title_genres.genres.name', genres);
      }

      // Apply year filter using optimized year index
      if (year) {
        dbQuery = dbQuery.eq('year', parseInt(year));
      }

      // Apply status filter
      if (status) {
        dbQuery = dbQuery.eq(`${content_type}_details.status`, status);
      }

      // Apply type filter
      if (type) {
        dbQuery = dbQuery.eq(`${content_type}_details.type`, type);
      }

      // Apply score range filter
      if (score_min !== undefined) {
        dbQuery = dbQuery.gte('score', score_min);
      }
      if (score_max !== undefined) {
        dbQuery = dbQuery.lte('score', score_max);
      }

      // Apply sorting using optimized indexes
      if (sort_by === 'score') {
        dbQuery = dbQuery.order('score', { ascending: order === 'asc', nullsFirst: false });
      } else if (sort_by === 'year') {
        dbQuery = dbQuery.order('year', { ascending: order === 'asc', nullsFirst: false });
      } else {
        dbQuery = dbQuery.order(sort_by, { ascending: order === 'asc', nullsFirst: false });
      }

      // Apply pagination
      const from = (page - 1) * limit;
      const to = from + limit - 1;
      dbQuery = dbQuery.range(from, to);

      const { data, error, count } = await dbQuery;

      if (error) {
        throw error;
      }

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

      return this.handleSuccess({ data: data || [], pagination });
    } catch (err: any) {
      return this.handleError(err, 'perform advanced search');
    }
  }
}

export const searchService = new SearchApiService();
