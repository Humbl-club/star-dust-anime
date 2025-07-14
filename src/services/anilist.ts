import { AniListAnime, AniListSearchResponse, AniListAnimeResponse } from '@/types/anilist';

const ANILIST_API_URL = 'https://graphql.anilist.co';

// Enhanced GraphQL query for comprehensive media data (anime & manga)
const SEARCH_MEDIA_QUERY = `
  query SearchMedia($page: Int, $perPage: Int, $search: String, $type: MediaType, $genre: String, $status: MediaStatus, $format: MediaFormat, $sort: [MediaSort]) {
    Page(page: $page, perPage: $perPage) {
      pageInfo {
        total
        currentPage
        lastPage
        hasNextPage
        perPage
      }
      media(search: $search, type: $type, genre: $genre, status: $status, format: $format, sort: $sort) {
        id
        malId
        title {
          romaji
          english
          native
        }
        description
        startDate {
          year
          month
          day
        }
        endDate {
          year
          month
          day
        }
        season
        seasonYear
        type
        format
        status
        episodes
        chapters
        volumes
        duration
        genres
        synonyms
        averageScore
        meanScore
        popularity
        favourites
        countryOfOrigin
        isAdult
        stats {
          scoreDistribution {
            amount
          }
        }
        nextAiringEpisode {
          id
          airingAt
          timeUntilAiring
          episode
        }
        coverImage {
          extraLarge
          large
          medium
          color
        }
        bannerImage
        trailer {
          id
          site
          thumbnail
        }
        tags {
          id
          name
          description
          category
          rank
          isGeneralSpoiler
          isMediaSpoiler
          isAdult
        }
        studios {
          edges {
            isMain
            node {
              id
              name
              isAnimationStudio
            }
          }
        }
        externalLinks {
          id
          url
          site
          siteId
          type
          language
          color
          icon
        }
        streamingEpisodes {
          title
          thumbnail
          url
          site
        }
        airingSchedule(page: 1, perPage: 25) {
          edges {
            node {
              id
              airingAt
              timeUntilAiring
              episode
            }
          }
        }
      }
    }
  }
`;

// Enhanced details query with all streaming and countdown data
const GET_MEDIA_DETAILS_QUERY = `
  query GetMediaDetails($id: Int, $malId: Int, $type: MediaType) {
    Media(id: $id, idMal: $malId, type: $type) {
      id
      malId
      title {
        romaji
        english
        native
      }
      description
      startDate {
        year
        month
        day
      }
      endDate {
        year
        month
        day
      }
      season
      seasonYear
      type
      format
      status
      episodes
      chapters
      volumes
      duration
      genres
      synonyms
      averageScore
      meanScore
      popularity
      favourites
      hashtag
      countryOfOrigin
      isAdult
      stats {
        scoreDistribution {
          amount
        }
      }
      nextAiringEpisode {
        id
        airingAt
        timeUntilAiring
        episode
      }
      coverImage {
        extraLarge
        large
        medium
        color
      }
      bannerImage
      trailer {
        id
        site
        thumbnail
      }
      tags {
        id
        name
        description
        category
        rank
        isGeneralSpoiler
        isMediaSpoiler
        isAdult
      }
      characters(sort: [ROLE, RELEVANCE], page: 1, perPage: 12) {
        edges {
          id
          role
          name
          voiceActors(language: JAPANESE, sort: [RELEVANCE]) {
            id
            name {
              first
              middle
              last
              full
              native
            }
            language
            image {
              large
              medium
            }
          }
          node {
            id
            name {
              first
              middle
              last
              full
              native
            }
            image {
              large
              medium
            }
            description
          }
        }
      }
      staff(sort: [RELEVANCE], page: 1, perPage: 8) {
        edges {
          id
          role
          node {
            id
            name {
              first
              middle
              last
              full
              native
            }
            language
            image {
              large
              medium
            }
            description
          }
        }
      }
      studios {
        edges {
          isMain
          node {
            id
            name
            isAnimationStudio
          }
        }
      }
      relations {
        edges {
          relationType
          node {
            id
            title {
              romaji
              english
              native
            }
            format
            type
            status
            coverImage {
              medium
              large
            }
          }
        }
      }
      recommendations(sort: [RATING_DESC], page: 1, perPage: 6) {
        nodes {
          rating
          userRating
          mediaRecommendation {
            id
            title {
              romaji
              english
            }
            format
            type
            status
            coverImage {
              medium
              large
            }
            averageScore
          }
        }
      }
      externalLinks {
        id
        url
        site
        siteId
        type
        language
        color
        icon
      }
      streamingEpisodes {
        title
        thumbnail
        url
        site
      }
      airingSchedule(page: 1, perPage: 25) {
        edges {
          node {
            id
            airingAt
            timeUntilAiring
            episode
          }
        }
      }
    }
  }
`;

class AniListService {
  private async makeRequest(query: string, variables?: any): Promise<any> {
    try {
      const response = await fetch(ANILIST_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          query,
          variables,
        }),
      });

      if (!response.ok) {
        throw new Error(`AniList API error: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.errors) {
        throw new Error(`AniList GraphQL error: ${data.errors[0]?.message}`);
      }

      return data;
    } catch (error) {
      console.error('AniList API request failed:', error);
      throw error;
    }
  }

  // Enhanced search supporting both anime and manga
  async searchMedia(options: {
    search?: string;
    page?: number;
    perPage?: number;
    type?: 'ANIME' | 'MANGA';
    genre?: string;
    status?: string;
    format?: string;
    sort?: string[];
  } = {}): Promise<AniListSearchResponse> {
    const {
      search,
      page = 1,
      perPage = 20,
      type = 'ANIME',
      genre,
      status,
      format,
      sort = ['POPULARITY_DESC']
    } = options;

    const variables: any = {
      page,
      perPage,
      type,
      sort,
    };

    if (search) variables.search = search;
    if (genre) variables.genre = genre;
    if (status) variables.status = status;
    if (format) variables.format = format;

    return await this.makeRequest(SEARCH_MEDIA_QUERY, variables);
  }

  // Backward compatibility - search anime only
  async searchAnime(options: {
    search?: string;
    page?: number;
    perPage?: number;
    genre?: string;
    status?: string;
    format?: string;
    sort?: string[];
  } = {}): Promise<AniListSearchResponse> {
    return this.searchMedia({ ...options, type: 'ANIME' });
  }

  // Search manga specifically
  async searchManga(options: {
    search?: string;
    page?: number;
    perPage?: number;
    genre?: string;
    status?: string;
    format?: string;
    sort?: string[];
  } = {}): Promise<AniListSearchResponse> {
    return this.searchMedia({ ...options, type: 'MANGA' });
  }

  // Enhanced details method supporting both anime and manga
  async getMediaDetails(id?: number, malId?: number, type: 'ANIME' | 'MANGA' = 'ANIME'): Promise<AniListAnimeResponse> {
    if (!id && !malId) {
      throw new Error('Either AniList ID or MAL ID must be provided');
    }

    const variables: any = { type };
    if (id) variables.id = id;
    if (malId) variables.malId = malId;

    return await this.makeRequest(GET_MEDIA_DETAILS_QUERY, variables);
  }

  // Backward compatibility methods
  async getAnimeDetails(id?: number, malId?: number): Promise<AniListAnimeResponse> {
    return this.getMediaDetails(id, malId, 'ANIME');
  }

  async getMangaDetails(id?: number, malId?: number): Promise<AniListAnimeResponse> {
    return this.getMediaDetails(id, malId, 'MANGA');
  }

  async getAnimeByMalId(malId: number): Promise<AniListAnime | null> {
    try {
      const response = await this.getAnimeDetails(undefined, malId);
      return response.data.Media;
    } catch (error) {
      console.error(`Failed to fetch AniList anime data for MAL ID ${malId}:`, error);
      return null;
    }
  }

  async getMangaByMalId(malId: number): Promise<AniListAnime | null> {
    try {
      const response = await this.getMangaDetails(undefined, malId);
      return response.data.Media;
    } catch (error) {
      console.error(`Failed to fetch AniList manga data for MAL ID ${malId}:`, error);
      return null;
    }
  }

  // Enhanced utility functions
  getBestImage(media: AniListAnime): string {
    return media.coverImage.extraLarge || media.coverImage.large || media.coverImage.medium;
  }

  getTitle(media: AniListAnime, preferEnglish: boolean = true): string {
    if (preferEnglish && media.title.english) {
      return media.title.english;
    }
    return media.title.romaji;
  }

  formatDate(date?: { year?: number; month?: number; day?: number }): string | null {
    if (!date?.year) return null;
    
    const year = date.year;
    const month = date.month ? String(date.month).padStart(2, '0') : '01';
    const day = date.day ? String(date.day).padStart(2, '0') : '01';
    
    return `${year}-${month}-${day}`;
  }

  // Enhanced streaming links detection
  getStreamingLinks(media: AniListAnime): Array<{
    platform: string;
    url: string;
    type: 'streaming' | 'info' | 'social';
  }> {
    if (!media.externalLinks) return [];

    return media.externalLinks.map(link => ({
      platform: link.site,
      url: link.url,
      type: this.categorizeExternalLink(link.site, link.type)
    }));
  }

  private categorizeExternalLink(site: string, type: string): 'streaming' | 'info' | 'social' {
    const streamingPlatforms = [
      'Crunchyroll', 'Funimation', 'Netflix', 'Hulu', 'Amazon Prime Video',
      'Disney Plus', 'AnimeLab', 'Wakanim', 'VIZ', 'Shonen Jump'
    ];
    
    if (streamingPlatforms.includes(site)) {
      return 'streaming';
    }
    
    if (type === 'SOCIAL' || ['Twitter', 'YouTube', 'Instagram', 'TikTok'].includes(site)) {
      return 'social';
    }
    
    return 'info';
  }

  // Get countdown information
  getCountdownInfo(media: AniListAnime): {
    nextEpisode?: {
      episode: number;
      airingAt: number;
      timeUntilAiring: number;
    };
    isAiring: boolean;
    upcomingEpisodes: Array<{
      episode: number;
      airingAt: number;
      timeUntilAiring: number;
    }>;
  } {
    const result = {
      nextEpisode: undefined as any,
      isAiring: media.status === 'RELEASING',
      upcomingEpisodes: [] as any[]
    };

    if (media.nextAiringEpisode) {
      result.nextEpisode = {
        episode: media.nextAiringEpisode.episode,
        airingAt: media.nextAiringEpisode.airingAt,
        timeUntilAiring: media.nextAiringEpisode.timeUntilAiring
      };
    }

    if (media.airingSchedule?.edges) {
      result.upcomingEpisodes = media.airingSchedule.edges
        .map(edge => ({
          episode: edge.node.episode,
          airingAt: edge.node.airingAt,
          timeUntilAiring: edge.node.timeUntilAiring
        }))
        .filter(ep => ep.timeUntilAiring > 0)
        .sort((a, b) => a.airingAt - b.airingAt);
    }

    return result;
  }

  // Convert AniList data to our internal format
  convertToInternalFormat(media: AniListAnime, contentType: 'anime' | 'manga' = 'anime'): any {
    const countdownInfo = this.getCountdownInfo(media);
    const streamingLinks = this.getStreamingLinks(media);

    return {
      id: `anilist-${media.id}`,
      mal_id: media.malId || null,
      anilist_id: media.id,
      title: media.title.romaji,
      title_english: media.title.english || null,
      title_japanese: media.title.native || null,
      type: media.format || media.type,
      status: media.status,
      episodes: media.episodes || null,
      chapters: media.chapters || null,
      volumes: media.volumes || null,
      aired_from: this.formatDate(media.startDate),
      aired_to: this.formatDate(media.endDate),
      published_from: contentType === 'manga' ? this.formatDate(media.startDate) : null,
      published_to: contentType === 'manga' ? this.formatDate(media.endDate) : null,
      score: media.averageScore ? media.averageScore / 10 : null,
      anilist_score: media.averageScore ? media.averageScore / 10 : null,
      scored_by: null,
      rank: null,
      popularity: media.popularity || null,
      members: media.favourites || null,
      favorites: media.favourites || null,
      num_users_voted: media.stats?.scoreDistribution?.reduce((total, dist) => total + dist.amount, 0) || 0,
      synopsis: media.description ? media.description.replace(/<[^>]*>/g, '') : null,
      image_url: this.getBestImage(media),
      banner_image: media.bannerImage || null,
      cover_image_large: media.coverImage.large || null,
      cover_image_extra_large: media.coverImage.extraLarge || null,
      color_theme: media.coverImage.color || null,
      trailer_url: media.trailer ? `https://www.youtube.com/watch?v=${media.trailer.id}` : null,
      trailer_id: media.trailer?.id || null,
      trailer_site: media.trailer?.site || null,
      genres: media.genres || [],
      studios: media.studios?.edges
        .filter(edge => edge.isMain)
        .map(edge => edge.node.name) || [],
      authors: contentType === 'manga' ? [] : undefined, // Will be populated from staff data
      themes: media.tags
        ?.filter(tag => !tag.isGeneralSpoiler && !tag.isMediaSpoiler && tag.rank >= 60)
        .map(tag => tag.name) || [],
      demographics: [],
      season: media.season || null,
      year: media.seasonYear || media.startDate?.year || null,
      
      // Enhanced fields for countdown and streaming
      next_episode_date: countdownInfo.nextEpisode ? new Date(countdownInfo.nextEpisode.airingAt * 1000).toISOString() : null,
      next_episode_number: countdownInfo.nextEpisode?.episode || null,
      next_chapter_date: contentType === 'manga' && countdownInfo.nextEpisode ? new Date(countdownInfo.nextEpisode.airingAt * 1000).toISOString() : null,
      next_chapter_number: contentType === 'manga' ? countdownInfo.nextEpisode?.episode || null : null,
      
      // AniList-specific structured data
      characters_data: media.characters || [],
      staff_data: media.staff || [],
      external_links: streamingLinks,
      streaming_episodes: media.streamingEpisodes || [],
      detailed_tags: media.tags || [],
      relations_data: media.relations || [],
      recommendations_data: media.recommendations || [],
      studios_data: media.studios || [],
      
      // Airing schedule for countdown timers
      airing_schedule: contentType === 'anime' ? countdownInfo.upcomingEpisodes : [],
      release_schedule: contentType === 'manga' ? countdownInfo.upcomingEpisodes : [],
      
      last_sync_check: new Date().toISOString(),
    };
  }
}

export const anilistService = new AniListService();
