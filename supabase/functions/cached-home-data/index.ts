import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  // Set aggressive cache headers for CDN and browser caching
  const headers = {
    ...corsHeaders,
    'Content-Type': 'application/json',
    'Cache-Control': 'public, max-age=300, s-maxage=600, stale-while-revalidate=86400',
    'X-Cache-Version': '1.0',
    'X-Cache-Source': 'edge-function',
  };

  try {
    console.log('🏠 Fetching aggregated home data...');
    
    // Fetch all home sections in parallel for maximum performance
    const [trending, recent, topRated, currentSeason] = await Promise.all([
      // Trending anime (currently releasing with high scores)
      supabase
        .from('titles')
        .select(`
          id, anilist_id, title, title_english, image_url, 
          score, year, favorites, popularity,
          anime_details!inner(episodes, status, type, season)
        `)
        .eq('anime_details.status', 'RELEASING')
        .not('score', 'is', null)
        .order('score', { ascending: false })
        .limit(12),
      
      // Recently added anime
      supabase
        .from('titles')
        .select(`
          id, anilist_id, title, title_english, image_url,
          score, year, favorites, popularity,
          anime_details!inner(episodes, status, type, season)
        `)
        .order('created_at', { ascending: false })
        .limit(12),
      
      // Top rated anime of all time
      supabase
        .from('titles')
        .select(`
          id, anilist_id, title, title_english, image_url,
          score, year, favorites, popularity,
          anime_details!inner(episodes, status, type, season)
        `)
        .not('score', 'is', null)
        .gte('score', 80)
        .order('score', { ascending: false })
        .limit(12),

      // Current season anime
      supabase
        .from('titles')
        .select(`
          id, anilist_id, title, title_english, image_url,
          score, year, favorites, popularity,
          anime_details!inner(episodes, status, type, season)
        `)
        .eq('anime_details.season', getCurrentSeason())
        .eq('year', new Date().getFullYear())
        .order('popularity', { ascending: false })
        .limit(12),
    ]);

    // Check for errors
    if (trending.error) throw trending.error;
    if (recent.error) throw recent.error;
    if (topRated.error) throw topRated.error;
    if (currentSeason.error) throw currentSeason.error;

    const responseData = {
      sections: {
        trending: {
          title: 'Trending Now',
          data: trending.data || [],
          count: trending.data?.length || 0,
        },
        recent: {
          title: 'Recently Added',
          data: recent.data || [],
          count: recent.data?.length || 0,
        },
        topRated: {
          title: 'Top Rated',
          data: topRated.data || [],
          count: topRated.data?.length || 0,
        },
        currentSeason: {
          title: `${getCurrentSeason()} ${new Date().getFullYear()}`,
          data: currentSeason.data || [],
          count: currentSeason.data?.length || 0,
        },
      },
      metadata: {
        cached_at: new Date().toISOString(),
        total_items: (trending.data?.length || 0) + (recent.data?.length || 0) + 
                    (topRated.data?.length || 0) + (currentSeason.data?.length || 0),
        cache_duration: 300, // 5 minutes
      },
    };

    console.log(`✅ Home data aggregated: ${responseData.metadata.total_items} items`);

    return new Response(JSON.stringify(responseData), { headers });
  } catch (error) {
    console.error('❌ Error fetching home data:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        sections: {
          trending: { title: 'Trending Now', data: [], count: 0 },
          recent: { title: 'Recently Added', data: [], count: 0 },
          topRated: { title: 'Top Rated', data: [], count: 0 },
          currentSeason: { title: 'Current Season', data: [], count: 0 },
        },
        metadata: {
          cached_at: new Date().toISOString(),
          total_items: 0,
          error: true,
        }
      }),
      { 
        status: 500, 
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        }
      }
    );
  }
});

function getCurrentSeason(): string {
  const month = new Date().getMonth();
  if (month >= 11 || month <= 1) return 'WINTER';
  if (month >= 2 && month <= 4) return 'SPRING';
  if (month >= 5 && month <= 7) return 'SUMMER';
  return 'FALL';
}