interface TMDBConfiguration {
  images: {
    base_url: string;
    secure_base_url: string;
    backdrop_sizes: string[];
    logo_sizes: string[];
    poster_sizes: string[];
    profile_sizes: string[];
    still_sizes: string[];
  };
}

interface TMDBSearchResult {
  id: number;
  title?: string;
  name?: string;
  original_title?: string;
  original_name?: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date?: string;
  first_air_date?: string;
  vote_average: number;
  vote_count: number;
  popularity: number;
  genre_ids: number[];
  media_type?: 'movie' | 'tv';
  adult?: boolean;
  original_language: string;
}

interface TMDBMovieDetails extends TMDBSearchResult {
  runtime: number;
  budget: number;
  revenue: number;
  status: string;
  tagline: string;
  imdb_id: string;
  production_companies: Array<{
    id: number;
    name: string;
    logo_path: string | null;
    origin_country: string;
  }>;
  production_countries: Array<{
    iso_3166_1: string;
    name: string;
  }>;
  spoken_languages: Array<{
    iso_639_1: string;
    name: string;
  }>;
  genres: Array<{
    id: number;
    name: string;
  }>;
}

interface TMDBTVDetails extends TMDBSearchResult {
  number_of_episodes: number;
  number_of_seasons: number;
  episode_run_time: number[];
  status: string;
  type: string;
  last_air_date: string;
  next_episode_to_air: {
    air_date: string;
    episode_number: number;
    season_number: number;
  } | null;
  genres: Array<{
    id: number;
    name: string;
  }>;
  created_by: Array<{
    id: number;
    name: string;
    profile_path: string | null;
  }>;
  networks: Array<{
    id: number;
    name: string;
    logo_path: string | null;
    origin_country: string;
  }>;
}

interface TMDBCastMember {
  id: number;
  name: string;
  character: string;
  profile_path: string | null;
  order: number;
  known_for_department: string;
  popularity: number;
}

interface TMDBCrewMember {
  id: number;
  name: string;
  job: string;
  department: string;
  profile_path: string | null;
  known_for_department: string;
  popularity: number;
}

interface TMDBCredits {
  cast: TMDBCastMember[];
  crew: TMDBCrewMember[];
}

interface TMDBReview {
  id: string;
  author: string;
  author_details: {
    name: string;
    username: string;
    avatar_path: string | null;
    rating: number | null;
  };
  content: string;
  created_at: string;
  updated_at: string;
  url: string;
}

class TMDBService {
  private baseUrl = 'https://api.themoviedb.org/3';
  private apiKey: string | null = null;
  private configuration: TMDBConfiguration | null = null;

  constructor() {
    // Initialize API key (in production, this would come from environment)
    if (typeof window !== 'undefined') {
      console.warn('TMDB Service should be used server-side for security');
    }
  }

  setApiKey(key: string) {
    this.apiKey = key;
  }

  private async request<T>(endpoint: string, params: Record<string, string> = {}): Promise<T> {
    if (!this.apiKey) {
      throw new Error('TMDB API key not set');
    }

    const url = new URL(`${this.baseUrl}${endpoint}`);
    url.searchParams.set('api_key', this.apiKey);
    
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.set(key, value);
    });

    const response = await fetch(url.toString());
    
    if (!response.ok) {
      throw new Error(`TMDB API error: ${response.status} - ${response.statusText}`);
    }

    return response.json();
  }

  async getConfiguration(): Promise<TMDBConfiguration> {
    if (!this.configuration) {
      this.configuration = await this.request<TMDBConfiguration>('/configuration');
    }
    return this.configuration;
  }

  async searchMulti(query: string, page = 1): Promise<{ results: TMDBSearchResult[] }> {
    return this.request('/search/multi', {
      query,
      page: page.toString(),
      include_adult: 'false'
    });
  }

  async searchMovies(query: string, page = 1): Promise<{ results: TMDBSearchResult[] }> {
    return this.request('/search/movie', {
      query,
      page: page.toString(),
      include_adult: 'false'
    });
  }

  async searchTV(query: string, page = 1): Promise<{ results: TMDBSearchResult[] }> {
    return this.request('/search/tv', {
      query,
      page: page.toString(),
      include_adult: 'false'
    });
  }

  async getMovieDetails(movieId: number): Promise<TMDBMovieDetails> {
    return this.request(`/movie/${movieId}`);
  }

  async getTVDetails(tvId: number): Promise<TMDBTVDetails> {
    return this.request(`/tv/${tvId}`);
  }

  async getMovieCredits(movieId: number): Promise<TMDBCredits> {
    return this.request(`/movie/${movieId}/credits`);
  }

  async getTVCredits(tvId: number): Promise<TMDBCredits> {
    return this.request(`/tv/${tvId}/credits`);
  }

  async getMovieReviews(movieId: number, page = 1): Promise<{ results: TMDBReview[] }> {
    return this.request(`/movie/${movieId}/reviews`, { page: page.toString() });
  }

  async getTVReviews(tvId: number, page = 1): Promise<{ results: TMDBReview[] }> {
    return this.request(`/tv/${tvId}/reviews`, { page: page.toString() });
  }

  async getImageUrl(path: string | null, size: 'w500' | 'w780' | 'w1280' | 'original' = 'w500'): Promise<string | null> {
    if (!path) return null;
    
    const config = await this.getConfiguration();
    return `${config.images.secure_base_url}${size}${path}`;
  }

  async getPosterUrl(path: string | null, size: 'w342' | 'w500' | 'w780' | 'original' = 'w500'): Promise<string | null> {
    if (!path) return null;
    
    const config = await this.getConfiguration();
    return `${config.images.secure_base_url}${size}${path}`;
  }

  async getBackdropUrl(path: string | null, size: 'w780' | 'w1280' | 'original' = 'w1280'): Promise<string | null> {
    if (!path) return null;
    
    const config = await this.getConfiguration();
    return `${config.images.secure_base_url}${size}${path}`;
  }

  async getProfileUrl(path: string | null, size: 'w185' | 'w632' | 'original' = 'w185'): Promise<string | null> {
    if (!path) return null;
    
    const config = await this.getConfiguration();
    return `${config.images.secure_base_url}${size}${path}`;
  }

  // Helper method to match anime titles with TMDB entries
  async findBestMatch(animeTitle: string, year?: number): Promise<TMDBSearchResult | null> {
    try {
      // Try different search variations
      const searchQueries = [
        animeTitle,
        `${animeTitle} anime`,
        animeTitle.replace(/[^\w\s]/g, ''), // Remove special characters
      ];

      for (const query of searchQueries) {
        const results = await this.searchMulti(query);
        
        if (results.results.length > 0) {
          // Score results based on similarity and year match
          const scored = results.results.map(result => {
            let score = 0;
            const title = result.title || result.name || '';
            
            // Exact title match
            if (title.toLowerCase() === animeTitle.toLowerCase()) score += 10;
            
            // Contains anime title
            if (title.toLowerCase().includes(animeTitle.toLowerCase())) score += 5;
            
            // Year match (if provided)
            if (year) {
              const releaseYear = new Date(result.release_date || result.first_air_date || '').getFullYear();
              if (releaseYear === year) score += 3;
              else if (Math.abs(releaseYear - year) <= 1) score += 1;
            }
            
            // Prefer TV shows for anime
            if (result.media_type === 'tv') score += 2;
            
            // Consider popularity and vote average
            score += Math.min(result.popularity / 100, 2);
            score += result.vote_average / 10;
            
            return { ...result, score };
          });

          // Return the highest scored result if it's above threshold
          const best = scored.sort((a, b) => b.score - a.score)[0];
          if (best.score > 5) {
            return best;
          }
        }
      }

      return null;
    } catch (error) {
      console.error('TMDB search error:', error);
      return null;
    }
  }
}

export const tmdbService = new TMDBService();
export type {
  TMDBSearchResult,
  TMDBMovieDetails,
  TMDBTVDetails,
  TMDBCastMember,
  TMDBCrewMember,
  TMDBCredits,
  TMDBReview
};