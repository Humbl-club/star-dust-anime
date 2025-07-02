import { AniListAnime, AniListSearchResponse, AniListAnimeResponse } from '@/types/anilist';

const ANILIST_API_URL = 'https://graphql.anilist.co';

// GraphQL queries
const SEARCH_ANIME_QUERY = `
  query SearchAnime($page: Int, $perPage: Int, $search: String, $type: MediaType, $genre: String, $status: MediaStatus, $format: MediaFormat, $sort: [MediaSort]) {
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
        duration
        genres
        synonyms
        averageScore
        meanScore
        popularity
        favourites
        countryOfOrigin
        isAdult
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
      }
    }
  }
`;

const GET_ANIME_DETAILS_QUERY = `
  query GetAnimeDetails($id: Int, $malId: Int) {
    Media(id: $id, idMal: $malId, type: ANIME) {
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

  async searchAnime(options: {
    search?: string;
    page?: number;
    perPage?: number;
    genre?: string;
    status?: string;
    format?: string;
    sort?: string[];
  } = {}): Promise<AniListSearchResponse> {
    const {
      search,
      page = 1,
      perPage = 20,
      genre,
      status,
      format,
      sort = ['POPULARITY_DESC']
    } = options;

    const variables: any = {
      page,
      perPage,
      type: 'ANIME',
      sort,
    };

    if (search) variables.search = search;
    if (genre) variables.genre = genre;
    if (status) variables.status = status;
    if (format) variables.format = format;

    return await this.makeRequest(SEARCH_ANIME_QUERY, variables);
  }

  async getAnimeDetails(id?: number, malId?: number): Promise<AniListAnimeResponse> {
    if (!id && !malId) {
      throw new Error('Either AniList ID or MAL ID must be provided');
    }

    const variables: any = {};
    if (id) variables.id = id;
    if (malId) variables.malId = malId;

    return await this.makeRequest(GET_ANIME_DETAILS_QUERY, variables);
  }

  async getAnimeByMalId(malId: number): Promise<AniListAnime | null> {
    try {
      const response = await this.getAnimeDetails(undefined, malId);
      return response.data.Media;
    } catch (error) {
      console.error(`Failed to fetch AniList data for MAL ID ${malId}:`, error);
      return null;
    }
  }

  // Utility function to get the best available image
  getBestImage(anime: AniListAnime): string {
    return anime.coverImage.extraLarge || anime.coverImage.large || anime.coverImage.medium;
  }

  // Utility function to get formatted title
  getTitle(anime: AniListAnime, preferEnglish: boolean = true): string {
    if (preferEnglish && anime.title.english) {
      return anime.title.english;
    }
    return anime.title.romaji;
  }

  // Utility function to format date
  formatDate(date?: { year?: number; month?: number; day?: number }): string | null {
    if (!date?.year) return null;
    
    const year = date.year;
    const month = date.month ? String(date.month).padStart(2, '0') : '01';
    const day = date.day ? String(date.day).padStart(2, '0') : '01';
    
    return `${year}-${month}-${day}`;
  }

  // Convert AniList data to our internal format
  convertToInternalFormat(anilistAnime: AniListAnime): any {
    return {
      id: `anilist-${anilistAnime.id}`,
      mal_id: anilistAnime.malId || null,
      anilist_id: anilistAnime.id,
      title: anilistAnime.title.romaji,
      title_english: anilistAnime.title.english || null,
      title_japanese: anilistAnime.title.native || null,
      type: anilistAnime.format || anilistAnime.type,
      status: anilistAnime.status,
      episodes: anilistAnime.episodes || null,
      aired_from: this.formatDate(anilistAnime.startDate),
      aired_to: this.formatDate(anilistAnime.endDate),
      score: anilistAnime.averageScore ? anilistAnime.averageScore / 10 : null,
      scored_by: null, // AniList doesn't provide this
      rank: null, // We'd need to calculate this
      popularity: anilistAnime.popularity || null,
      members: anilistAnime.favourites || null,
      favorites: anilistAnime.favourites || null,
      synopsis: anilistAnime.description ? anilistAnime.description.replace(/<[^>]*>/g, '') : null,
      image_url: this.getBestImage(anilistAnime),
      banner_image: anilistAnime.bannerImage || null,
      trailer_url: anilistAnime.trailer ? `https://www.youtube.com/watch?v=${anilistAnime.trailer.id}` : null,
      genres: anilistAnime.genres || [],
      studios: anilistAnime.studios?.edges
        .filter(edge => edge.isMain)
        .map(edge => edge.node.name) || [],
      themes: anilistAnime.tags
        ?.filter(tag => !tag.isGeneralSpoiler && !tag.isMediaSpoiler && tag.rank >= 60)
        .map(tag => tag.name) || [],
      demographics: [], // AniList doesn't have this concept
      season: anilistAnime.season || null,
      year: anilistAnime.seasonYear || anilistAnime.startDate?.year || null,
      // AniList-specific fields
      anilist_data: {
        color: anilistAnime.coverImage.color,
        characters: anilistAnime.characters,
        staff: anilistAnime.staff,
        relations: anilistAnime.relations,
        recommendations: anilistAnime.recommendations,
        externalLinks: anilistAnime.externalLinks,
        streamingEpisodes: anilistAnime.streamingEpisodes,
        tags: anilistAnime.tags,
      },
    };
  }
}

export const anilistService = new AniListService();