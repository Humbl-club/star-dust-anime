import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const openAIApiKey = Deno.env.get('OPENAI_API_KEY')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface AniListAnime {
  id: number;
  title: {
    romaji: string;
    english?: string;
    native?: string;
  };
  description?: string;
  episodes?: number;
  status: string;
  startDate?: { year?: number; month?: number; day?: number };
  endDate?: { year?: number; month?: number; day?: number };
  season?: string;
  seasonYear?: number;
  genres?: string[];
  studios?: { nodes: Array<{ name: string }> };
  nextAiringEpisode?: {
    airingAt: number;
    episode: number;
  };
  averageScore?: number;
  popularity?: number;
  favourites?: number;
  coverImage?: {
    extraLarge?: string;
    large?: string;
  };
  bannerImage?: string;
}

interface MALAnime {
  mal_id: number;
  title: string;
  title_english?: string;
  title_japanese?: string;
  synopsis?: string;
  episodes?: number;
  status: string;
  aired?: {
    from?: string;
    to?: string;
  };
  season?: string;
  year?: number;
  score?: number;
  scored_by?: number;
  rank?: number;
  popularity?: number;
  members?: number;
  favorites?: number;
  genres?: Array<{ name: string }>;
  studios?: Array<{ name: string }>;
  images?: {
    jpg?: { large_image_url?: string };
  };
}

// Enhanced AI-powered schedule detection
async function getAIEnhancedSchedule(title: string, status: string, currentEpisode?: number): Promise<{
  nextEpisodeDate?: string;
  nextEpisodeNumber?: number;
  confidence: number;
}> {
  try {
    const prompt = `Analyze the anime "${title}" with current status "${status}" ${currentEpisode ? `and current episode ${currentEpisode}` : ''}.
    
Find the most accurate information about:
1. Next episode release date (if ongoing)
2. Next episode number
3. Typical release schedule (weekly, biweekly, etc.)

Please return ONLY a JSON object with this exact format:
{
  "nextEpisodeDate": "YYYY-MM-DD HH:MM:SS" or null,
  "nextEpisodeNumber": number or null,
  "confidence": number between 0-1,
  "reasoning": "brief explanation"
}

Consider: Japanese broadcast times (JST), seasonal patterns, production schedules, and current date context. If the anime is completed, on hiatus, or cancelled, return null for dates.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.1,
        max_tokens: 500,
      }),
    });

    const aiData = await response.json();
    const result = JSON.parse(aiData.choices[0].message.content);
    
    console.log(`AI analysis for "${title}":`, result);
    return result;
  } catch (error) {
    console.error('AI schedule analysis failed:', error);
    return { confidence: 0 };
  }
}

// Fetch from AniList with schedule data
async function fetchFromAniList(page = 1, perPage = 50): Promise<AniListAnime[]> {
  const query = `
    query ($page: Int, $perPage: Int) {
      Page(page: $page, perPage: $perPage) {
        media(type: ANIME, sort: POPULARITY_DESC) {
          id
          title {
            romaji
            english
            native
          }
          description
          episodes
          status
          startDate { year month day }
          endDate { year month day }
          season
          seasonYear
          genres
          studios { nodes { name } }
          nextAiringEpisode {
            airingAt
            episode
          }
          averageScore
          popularity
          favourites
          coverImage {
            extraLarge
            large
          }
          bannerImage
        }
      }
    }
  `;

  const response = await fetch('https://graphql.anilist.co', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query,
      variables: { page, perPage }
    }),
  });

  const data = await response.json();
  return data.data.Page.media;
}

// Fetch from MyAnimeList (Jikan API)
async function fetchFromMAL(page = 1): Promise<MALAnime[]> {
  const response = await fetch(`https://api.jikan.moe/v4/anime?page=${page}&limit=25&order_by=popularity`);
  const data = await response.json();
  return data.data || [];
}

// Process and merge anime data with AI enhancement
async function processAnimeData(anilistData: AniListAnime[], malData: MALAnime[]) {
  const processedAnime = [];

  for (const anime of anilistData) {
    // Find corresponding MAL data
    const malMatch = malData.find(mal => 
      mal.title.toLowerCase().includes(anime.title.romaji.toLowerCase()) ||
      (anime.title.english && mal.title_english?.toLowerCase().includes(anime.title.english.toLowerCase()))
    );

    // Get AI-enhanced schedule information
    const aiSchedule = await getAIEnhancedSchedule(
      anime.title.english || anime.title.romaji,
      anime.status,
      anime.nextAiringEpisode?.episode
    );

    const processedItem = {
      anilist_id: anime.id,
      mal_id: malMatch?.mal_id || null,
      title: anime.title.romaji,
      title_english: anime.title.english || malMatch?.title_english || null,
      title_japanese: anime.title.native || malMatch?.title_japanese || null,
      synopsis: anime.description?.replace(/<[^>]*>/g, '') || malMatch?.synopsis || null,
      episodes: anime.episodes || malMatch?.episodes || null,
      status: anime.status || malMatch?.status || 'Unknown',
      aired_from: anime.startDate ? 
        `${anime.startDate.year}-${String(anime.startDate.month || 1).padStart(2, '0')}-${String(anime.startDate.day || 1).padStart(2, '0')}` : 
        malMatch?.aired?.from || null,
      aired_to: anime.endDate ? 
        `${anime.endDate.year}-${String(anime.endDate.month || 12).padStart(2, '0')}-${String(anime.endDate.day || 31).padStart(2, '0')}` : 
        malMatch?.aired?.to || null,
      season: anime.season || malMatch?.season || null,
      year: anime.seasonYear || malMatch?.year || null,
      score: anime.averageScore ? anime.averageScore / 10 : malMatch?.score || null,
      scored_by: malMatch?.scored_by || null,
      rank: malMatch?.rank || null,
      popularity: anime.popularity || malMatch?.popularity || null,
      members: malMatch?.members || null,
      favorites: anime.favourites || malMatch?.favorites || null,
      genres: anime.genres || malMatch?.genres?.map(g => g.name) || [],
      studios: anime.studios?.nodes?.map(s => s.name) || malMatch?.studios?.map(s => s.name) || [],
      image_url: anime.coverImage?.extraLarge || anime.coverImage?.large || malMatch?.images?.jpg?.large_image_url || null,
      banner_image: anime.bannerImage || null,
      cover_image_large: anime.coverImage?.large || null,
      cover_image_extra_large: anime.coverImage?.extraLarge || null,
      
      // AI-Enhanced Schedule Data
      next_episode_date: aiSchedule.nextEpisodeDate || 
        (anime.nextAiringEpisode ? new Date(anime.nextAiringEpisode.airingAt * 1000).toISOString() : null),
      next_episode_number: aiSchedule.nextEpisodeNumber || anime.nextAiringEpisode?.episode || null,
      airing_schedule: anime.nextAiringEpisode ? [{
        episode: anime.nextAiringEpisode.episode,
        airingAt: anime.nextAiringEpisode.airingAt,
        confidence: aiSchedule.confidence || 0.8
      }] : [],
      last_sync_check: new Date().toISOString(),
    };

    processedAnime.push(processedItem);
    
    // Add delay to respect rate limits and AI API
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  return processedAnime;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { contentType = 'anime', operation = 'full_sync', page = 1 } = await req.json().catch(() => ({}));

    // Create sync status record
    const { data: syncStatus } = await supabase
      .from('content_sync_status')
      .insert({
        content_type: contentType,
        operation_type: operation,
        status: 'running',
        current_page: page,
        started_at: new Date().toISOString(),
        next_run_at: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString() // 6 hours from now
      })
      .select()
      .single();

    console.log(`Starting ${operation} for ${contentType}, page ${page}`);

    if (contentType === 'anime') {
      // Fetch from multiple sources
      const [anilistData, malData] = await Promise.all([
        fetchFromAniList(page, 50),
        fetchFromMAL(page)
      ]);

      console.log(`Fetched ${anilistData.length} anime from AniList, ${malData.length} from MAL`);

      // Process with AI enhancement
      const processedAnime = await processAnimeData(anilistData, malData);

      // Update sync status
      await supabase
        .from('content_sync_status')
        .update({
          total_items: anilistData.length,
          processed_items: 0
        })
        .eq('id', syncStatus.id);

      // Batch upsert anime data
      for (let i = 0; i < processedAnime.length; i += 10) {
        const batch = processedAnime.slice(i, i + 10);
        
        const { error } = await supabase
          .from('anime')
          .upsert(batch, { 
            onConflict: 'anilist_id',
            ignoreDuplicates: false 
          });

        if (error) {
          console.error('Batch upsert error:', error);
          continue;
        }

        // Update progress
        await supabase
          .from('content_sync_status')
          .update({ processed_items: i + batch.length })
          .eq('id', syncStatus.id);

        console.log(`Processed ${i + batch.length}/${processedAnime.length} anime`);
      }

      // Complete sync status
      await supabase
        .from('content_sync_status')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          processed_items: processedAnime.length
        })
        .eq('id', syncStatus.id);

      return new Response(JSON.stringify({
        success: true,
        message: `Successfully synced ${processedAnime.length} anime with AI-enhanced schedules`,
        syncId: syncStatus.id,
        nextSyncAt: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString()
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // TODO: Add manga sync logic here
    return new Response(JSON.stringify({
      success: false,
      message: 'Manga sync not implemented yet'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 501
    });

  } catch (error) {
    console.error('Sync error:', error);

    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});