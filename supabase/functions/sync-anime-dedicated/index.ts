import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AniListResponse {
  data?: {
    Page?: {
      pageInfo?: {
        hasNextPage?: boolean;
        currentPage?: number;
      };
      media?: any[];
    };
  };
  errors?: any[];
}

async function fetchAnimeData(page: number = 1): Promise<AniListResponse> {
  const query = `
    query ($page: Int, $perPage: Int) {
      Page(page: $page, perPage: $perPage) {
        pageInfo {
          hasNextPage
          currentPage
        }
        media(type: ANIME, sort: [POPULARITY_DESC, SCORE_DESC]) {
          id
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
          format
          status
          episodes
          coverImage {
            large
            medium
            color
          }
          genres
          averageScore
          popularity
          favourites
          studios {
            nodes {
              name
            }
          }
          trailer {
            id
            site
          }
          nextAiringEpisode {
            episode
            airingAt
          }
        }
      }
    }
  `;

  const variables = {
    page,
    perPage: 25 // Reduced to 25 per page for rate limiting
  };

  const response = await fetch('https://graphql.anilist.co', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({ query, variables })
  });

  if (!response.ok) {
    throw new Error(`AniList API error: ${response.status}`);
  }

  return await response.json();
}

async function processAnimeItem(supabase: any, item: any) {
  const startTime = item.startDate;
  const endTime = item.endDate;
  const airedFrom = (startTime?.year && startTime?.month && startTime?.day) 
    ? `${startTime.year}-${String(startTime.month).padStart(2, '0')}-${String(startTime.day).padStart(2, '0')}`
    : null;
  const airedTo = (endTime?.year && endTime?.month && endTime?.day)
    ? `${endTime.year}-${String(endTime.month).padStart(2, '0')}-${String(endTime.day).padStart(2, '0')}`
    : null;

  // Insert/update title
  const { data: titleData, error: titleError } = await supabase
    .from('titles')
    .upsert({
      anilist_id: item.id,
      title: item.title?.romaji || item.title?.english || 'Unknown',
      title_english: item.title?.english,
      title_japanese: item.title?.native,
      synopsis: item.description,
      image_url: item.coverImage?.large,
      color_theme: item.coverImage?.color,
      year: startTime?.year,
      score: item.averageScore ? item.averageScore / 10 : null,
      anilist_score: item.averageScore,
      popularity: item.popularity,
      favorites: item.favourites
    }, { onConflict: 'anilist_id' })
    .select('id')
    .single();

  if (titleError || !titleData) {
    throw new Error(`Failed to insert title: ${titleError?.message}`);
  }

  // Insert/update anime details
  const { error: detailError } = await supabase
    .from('anime_details')
    .upsert({
      title_id: titleData.id,
      episodes: item.episodes,
      aired_from: airedFrom,
      aired_to: airedTo,
      season: item.season,
      status: item.status || 'Finished Airing',
      type: item.format || 'TV',
      trailer_id: item.trailer?.id,
      trailer_site: item.trailer?.site,
      next_episode_number: item.nextAiringEpisode?.episode,
      next_episode_date: item.nextAiringEpisode?.airingAt 
        ? new Date(item.nextAiringEpisode.airingAt * 1000).toISOString()
        : null
    }, { onConflict: 'title_id' });

  if (detailError) {
    throw new Error(`Failed to insert anime details: ${detailError.message}`);
  }

  // Process genres
  if (item.genres?.length) {
    for (const genreName of item.genres) {
      const { data: genreData, error: genreError } = await supabase
        .from('genres')
        .upsert({ name: genreName, type: 'anime' }, { onConflict: 'name' })
        .select('id')
        .single();

      if (genreData && !genreError) {
        await supabase
          .from('title_genres')
          .upsert({ title_id: titleData.id, genre_id: genreData.id }, { onConflict: 'title_id,genre_id' });
      }
    }
  }

  // Process studios
  if (item.studios?.nodes?.length) {
    for (const studio of item.studios.nodes) {
      if (studio.name) {
        const { data: studioData, error: studioError } = await supabase
          .from('studios')
          .upsert({ name: studio.name }, { onConflict: 'name' })
          .select('id')
          .single();

        if (studioData && !studioError) {
          await supabase
            .from('title_studios')
            .upsert({ title_id: titleData.id, studio_id: studioData.id }, { onConflict: 'title_id,studio_id' });
        }
      }
    }
  }

  return { success: true, titleId: titleData.id };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    console.log('🎬 Starting dedicated anime sync...');
    
    const maxPages = 2; // Small batch to stay within rate limits
    let totalProcessed = 0;
    let errors: string[] = [];

    for (let page = 1; page <= maxPages; page++) {
      try {
        console.log(`📄 Processing anime page ${page}/${maxPages}...`);
        
        const response = await fetchAnimeData(page);
        
        if (!response.data?.Page?.media?.length) {
          console.log(`⚠️ No anime data found on page ${page}`);
          break;
        }

        const items = response.data.Page.media;
        console.log(`📊 Found ${items.length} anime items on page ${page}`);

        for (const item of items) {
          if (!item.id || (!item.title?.romaji && !item.title?.english)) {
            continue;
          }

          try {
            await processAnimeItem(supabase, item);
            totalProcessed++;
          } catch (error) {
            console.error(`❌ Failed to process anime ${item.id}:`, error);
            errors.push(`Anime ${item.id}: ${error.message}`);
          }

          // Rate limiting - longer delay between items
          await new Promise(resolve => setTimeout(resolve, 200));
        }

        // Longer delay between pages for rate limiting
        await new Promise(resolve => setTimeout(resolve, 2000));
        
      } catch (error) {
        console.error(`❌ Error processing anime page ${page}:`, error);
        errors.push(`Page ${page}: ${error.message}`);
      }
    }

    console.log(`✅ Dedicated anime sync completed: ${totalProcessed} items processed`);

    return new Response(JSON.stringify({
      success: true,
      contentType: 'anime',
      totalProcessed,
      errors: errors.slice(0, 5),
      message: `Successfully synced ${totalProcessed} anime items`,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ Dedicated anime sync error:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      contentType: 'anime',
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});