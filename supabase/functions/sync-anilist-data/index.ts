import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AniListAnime {
  id: number;
  malId?: number;
  title: {
    romaji: string;
    english?: string;
    native: string;
  };
  description?: string;
  startDate?: { year?: number; month?: number; day?: number };
  endDate?: { year?: number; month?: number; day?: number };
  season?: string;
  seasonYear?: number;
  type: string;
  format: string;
  status: string;
  episodes?: number;
  duration?: number;
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
  trailer?: {
    id: string;
    site: string;
    thumbnail: string;
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
    edges: any[];
  };
  staff?: {
    edges: any[];
  };
  studios?: {
    edges: any[];
  };
  relations?: {
    edges: any[];
  };
  recommendations?: {
    nodes: any[];
  };
  externalLinks?: any[];
  streamingEpisodes?: any[];
}

const GET_ANIME_DETAILS_QUERY = `
  query GetAnimeDetails($malId: Int) {
    Media(idMal: $malId, type: ANIME) {
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

async function fetchAniListData(malId: number): Promise<AniListAnime | null> {
  try {
    const response = await fetch('https://graphql.anilist.co', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        query: GET_ANIME_DETAILS_QUERY,
        variables: { malId },
      }),
    });

    if (!response.ok) {
      console.error(`AniList API error: ${response.status}`);
      return null;
    }

    const data = await response.json();
    
    if (data.errors) {
      console.error(`AniList GraphQL error:`, data.errors);
      return null;
    }

    return data.data.Media;
  } catch (error) {
    console.error('Failed to fetch AniList data:', error);
    return null;
  }
}

async function updateAnimeWithAniListData(supabase: any, animeId: string, anilistData: AniListAnime) {
  const updateData = {
    anilist_id: anilistData.id,
    banner_image: anilistData.bannerImage,
    cover_image_large: anilistData.coverImage.large,
    cover_image_extra_large: anilistData.coverImage.extraLarge,
    color_theme: anilistData.coverImage.color,
    anilist_score: anilistData.averageScore ? anilistData.averageScore / 10 : null,
    trailer_id: anilistData.trailer?.id,
    trailer_site: anilistData.trailer?.site,
    characters_data: anilistData.characters?.edges || [],
    staff_data: anilistData.staff?.edges || [],
    external_links: anilistData.externalLinks || [],
    streaming_episodes: anilistData.streamingEpisodes || [],
    detailed_tags: anilistData.tags || [],
    relations_data: anilistData.relations?.edges || [],
    recommendations_data: anilistData.recommendations?.nodes || [],
    studios_data: anilistData.studios?.edges || [],
    // Update main image with better quality
    image_url: anilistData.coverImage.extraLarge || anilistData.coverImage.large,
    // Update trailer URL if available
    trailer_url: anilistData.trailer ? `https://www.youtube.com/watch?v=${anilistData.trailer.id}` : null,
  };

  const { error } = await supabase
    .from('anime')
    .update(updateData)
    .eq('id', animeId);

  if (error) {
    console.error(`Failed to update anime ${animeId}:`, error);
    return false;
  }

  return true;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { batchSize = 50, offset = 0 } = await req.json();
    
    console.log(`Starting AniList sync - batch size: ${batchSize}, offset: ${offset}`);

    // Get anime entries that don't have AniList data yet
    const { data: animeList, error: fetchError } = await supabaseClient
      .from('anime')
      .select('id, mal_id, title, anilist_id')
      .not('mal_id', 'is', null)
      .is('anilist_id', null)
      .range(offset, offset + batchSize - 1)
      .order('popularity', { ascending: false });

    if (fetchError) {
      throw new Error(`Failed to fetch anime: ${fetchError.message}`);
    }

    if (!animeList || animeList.length === 0) {
      return new Response(
        JSON.stringify({ 
          message: 'No more anime to sync',
          processed: 0,
          remaining: 0 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      );
    }

    let processed = 0;
    let errors = 0;

    for (const anime of animeList) {
      try {
        console.log(`Syncing anime: ${anime.title} (MAL ID: ${anime.mal_id})`);
        
        const anilistData = await fetchAniListData(anime.mal_id);
        
        if (anilistData) {
          const success = await updateAnimeWithAniListData(supabaseClient, anime.id, anilistData);
          if (success) {
            processed++;
            console.log(`✓ Successfully synced: ${anime.title}`);
          } else {
            errors++;
            console.error(`✗ Failed to update: ${anime.title}`);
          }
        } else {
          console.log(`⚠ No AniList data found for: ${anime.title}`);
        }
        
        // Rate limiting - wait 1 second between requests
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        console.error(`Error syncing anime ${anime.title}:`, error);
        errors++;
      }
    }

    // Check remaining count
    const { count: remainingCount } = await supabaseClient
      .from('anime')
      .select('*', { count: 'exact', head: true })
      .not('mal_id', 'is', null)
      .is('anilist_id', null);

    console.log(`Sync completed. Processed: ${processed}, Errors: ${errors}, Remaining: ${remainingCount || 0}`);

    return new Response(
      JSON.stringify({
        message: 'AniList sync completed',
        processed,
        errors,
        remaining: remainingCount || 0,
        nextOffset: offset + batchSize
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('AniList sync error:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        message: 'Failed to sync AniList data' 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});