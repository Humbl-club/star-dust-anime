
// AniList API Types
export interface AniListAnime {
  id: number;
  malId?: number;
  title: {
    romaji: string;
    english?: string;
    native: string;
  };
  description?: string;
  startDate?: {
    year?: number;
    month?: number;
    day?: number;
  };
  endDate?: {
    year?: number;
    month?: number;
    day?: number;
  };
  season?: string;
  seasonYear?: number;
  type: string;
  format: string;
  status: string;
  episodes?: number;
  duration?: number;
  chapters?: number;
  volumes?: number;
  genres: string[];
  synonyms: string[];
  averageScore?: number;
  meanScore?: number;
  popularity: number;
  favourites: number;
  hashtag?: string;
  countryOfOrigin: string;
  isAdult: boolean;
  coverImage: {
    extraLarge: string;
    large: string;
    medium: string;
    color?: string;
  };
  bannerImage?: string;
  stats?: {
    scoreDistribution?: Array<{
      amount: number;
    }>;
  };
  nextAiringEpisode?: {
    id: number;
    airingAt: number;
    timeUntilAiring: number;
    episode: number;
  };
  trailer?: {
    id: string;
    site: string;
    thumbnail: string;
  };
  airingSchedule?: {
    edges: Array<{
      node: {
        id: number;
        airingAt: number;
        timeUntilAiring: number;
        episode: number;
      };
    }>;
  };
  tags: Array<{
    id: number;
    name: string;
    description?: string;
    category: string;
    rank: number;
    isGeneralSpoiler: boolean;
    isMediaSpoiler: boolean;
    isAdult: boolean;
  }>;
  characters?: {
    edges: Array<{
      id: number;
      role: string;
      name?: string;
      voiceActors: Array<{
        id: number;
        name: {
          first: string;
          middle?: string;
          last: string;
          full: string;
          native?: string;
        };
        language: string;
        image: {
          large: string;
          medium: string;
        };
      }>;
      node: {
        id: number;
        name: {
          first?: string;
          middle?: string;
          last?: string;
          full: string;
          native?: string;
        };
        image: {
          large: string;
          medium: string;
        };
        description?: string;
      };
    }>;
  };
  staff?: {
    edges: Array<{
      id: number;
      role: string;
      node: {
        id: number;
        name: {
          first?: string;
          middle?: string;
          last?: string;
          full: string;
          native?: string;
        };
        language?: string;
        image: {
          large: string;
          medium: string;
        };
        description?: string;
      };
    }>;
  };
  studios?: {
    edges: Array<{
      isMain: boolean;
      node: {
        id: number;
        name: string;
        isAnimationStudio: boolean;
      };
    }>;
  };
  relations?: {
    edges: Array<{
      relationType: string;
      node: {
        id: number;
        title: {
          romaji: string;
          english?: string;
          native: string;
        };
        format: string;
        type: string;
        status: string;
        coverImage: {
          medium: string;
          large: string;
        };
      };
    }>;
  };
  recommendations?: {
    nodes: Array<{
      rating: number;
      userRating?: string;
      mediaRecommendation: {
        id: number;
        title: {
          romaji: string;
          english?: string;
        };
        format: string;
        type: string;
        status: string;
        coverImage: {
          medium: string;
          large: string;
        };
        averageScore?: number;
      };
    }>;
  };
  externalLinks?: Array<{
    id: number;
    url: string;
    site: string;
    siteId?: number;
    type: string;
    language?: string;
    color?: string;
    icon?: string;
  }>;
  streamingEpisodes?: Array<{
    title?: string;
    thumbnail?: string;
    url?: string;
    site?: string;
  }>;
}

export interface AniListSearchResponse {
  data: {
    Page: {
      pageInfo: {
        total: number;
        currentPage: number;
        lastPage: number;
        hasNextPage: boolean;
        perPage: number;
      };
      media: AniListAnime[];
    };
  };
}

export interface AniListAnimeResponse {
  data: {
    Media: AniListAnime;
  };
}
