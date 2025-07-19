import { BaseApiService, ServiceResponse } from './baseService';
import { AnimeContent } from './animeService';
import { MangaContent } from './mangaService';

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
  // Global search across anime and manga
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

      // Search anime if requested
      if (type === 'anime' || type === 'both') {
        let animeQuery = this.supabase
          .from('titles')
          .select(`
            *,
            anime_details!inner(*),
            title_genres(genres(*)),
            title_studios(studios(*))
          `)
          .or(`title.ilike.%${searchTerm}%,title_english.ilike.%${searchTerm}%,title_japanese.ilike.%${searchTerm}%`);

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

        // Apply sorting and limit
        animeQuery = animeQuery
          .order(sort_by, { ascending: order === 'asc', nullsFirst: false })
          .limit(type === 'both' ? Math.floor(limit / 2) : limit);

        const { data: animeData, error: animeError } = await animeQuery;

        if (animeError) {
          console.error('Anime search error:', animeError);
        } else {
          results.anime = animeData?.map((item: any) => ({
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
            episodes: item.anime_details?.episodes || 0,
            aired_from: item.anime_details?.aired_from,
            aired_to: item.anime_details?.aired_to,
            season: item.anime_details?.season,
            status: item.anime_details?.status || 'Unknown',
            type: item.anime_details?.type || 'TV',
            trailer_url: item.anime_details?.trailer_url,
            next_episode_date: item.anime_details?.next_episode_date,
            studios: item.title_studios?.map((ts: any) => ts.studios?.name).filter(Boolean) || []
          })) || [];
        }
      }

      // Search manga if requested
      if (type === 'manga' || type === 'both') {
        let mangaQuery = this.supabase
          .from('titles')
          .select(`
            *,
            manga_details!inner(*),
            title_genres(genres(*)),
            title_authors(authors(*))
          `)
          .or(`title.ilike.%${searchTerm}%,title_english.ilike.%${searchTerm}%,title_japanese.ilike.%${searchTerm}%`);

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

        // Apply sorting and limit
        mangaQuery = mangaQuery
          .order(sort_by, { ascending: order === 'asc', nullsFirst: false })
          .limit(type === 'both' ? Math.floor(limit / 2) : limit);

        const { data: mangaData, error: mangaError } = await mangaQuery;

        if (mangaError) {
          console.error('Manga search error:', mangaError);
        } else {
          results.manga = mangaData?.map((item: any) => ({
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
            chapters: item.manga_details?.chapters || 0,
            volumes: item.manga_details?.volumes || 0,
            published_from: item.manga_details?.published_from,
            published_to: item.manga_details?.published_to,
            status: item.manga_details?.status || 'Unknown',
            type: item.manga_details?.type || 'Manga',
            next_chapter_date: item.manga_details?.next_chapter_date,
            authors: item.title_authors?.map((ta: any) => ta.authors?.name).filter(Boolean) || []
          })) || [];
        }
      }

      results.totalResults = results.anime.length + results.manga.length;

      return this.handleSuccess(results);
    } catch (err: any) {
      return this.handleError(err, 'perform search');
    }
  }

  // Get search suggestions
  async getSearchSuggestions(query: string, limit = 5): Promise<ServiceResponse<string[]>> {
    try {
      if (!query.trim() || query.length < 2) {
        return this.handleSuccess([]);
      }

      const searchTerm = query.trim();
      
      const { data, error } = await this.supabase
        .from('titles')
        .select('title, title_english')
        .or(`title.ilike.%${searchTerm}%,title_english.ilike.%${searchTerm}%`)
        .limit(limit);

      if (error) {
        throw error;
      }

      const suggestions = data?.map(item => item.title_english || item.title).filter(Boolean) || [];
      
      return this.handleSuccess(suggestions);
    } catch (err: any) {
      return this.handleError(err, 'fetch search suggestions');
    }
  }

  // Advanced search with multiple filters
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
        `, { count: 'exact' });

      // Apply text search
      if (query && query.trim()) {
        const searchTerm = query.trim();
        dbQuery = dbQuery.or(`title.ilike.%${searchTerm}%,title_english.ilike.%${searchTerm}%,title_japanese.ilike.%${searchTerm}%`);
      }

      // Apply genre filter
      if (genres && genres.length > 0) {
        dbQuery = dbQuery.in('title_genres.genres.name', genres);
      }

      // Apply year filter
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

      // Apply sorting
      dbQuery = dbQuery.order(sort_by, { ascending: order === 'asc', nullsFirst: false });

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