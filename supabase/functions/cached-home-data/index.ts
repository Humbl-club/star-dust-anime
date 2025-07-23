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

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Set aggressive cache headers for CDN
    const headers = {
      ...corsHeaders,
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=300, s-maxage=600, stale-while-revalidate=86400',
      'CDN-Cache-Control': 'max-age=600',
      'Surrogate-Control': 'max-age=600',
    };

    // Parse request body for options
    const { contentType = 'anime', sections = ['trending', 'recent', 'topRated'] } = await req.json().catch(() => ({}));

    console.log(`🏠 Fetching aggregated home data for ${contentType}, sections: ${sections.join(', ')}`);

    // Build queries based on requested sections
    const queries = [];
    
    if (sections.includes('trending') && contentType === 'anime') {
      queries.push(
        supabase
          .from('titles')
          .select(`
            id,
            anilist_id,
            title,
            title_english,
            title_japanese,
            image_url,
            score,
            year,
            favorites,
            popularity,
            anime_details!inner(
              episodes,
              status,
              type,
              aired_from,
              aired_to,
              season
            )
          `)
          .eq('anime_details.status', 'RELEASING')
          .order('score', { ascending: false })
          .order('favorites', { ascending: false })
          .limit(12)
      );
    }

    if (sections.includes('recent')) {
      const detailsTable = contentType === 'anime' ? 'anime_details' : 'manga_details';
      const detailsFields = contentType === 'anime' 
        ? 'episodes, status, type, aired_from, aired_to, season'
        : 'chapters, volumes, status, type, published_from, published_to';

      queries.push(
        supabase
          .from('titles')
          .select(`
            id,
            anilist_id,
            title,
            title_english,
            title_japanese,
            image_url,
            score,
            year,
            favorites,
            popularity,
            ${detailsTable}!inner(
              ${detailsFields}
            )
          `)
          .order('created_at', { ascending: false })
          .limit(12)
      );
    }

    if (sections.includes('topRated')) {
      const detailsTable = contentType === 'anime' ? 'anime_details' : 'manga_details';
      const detailsFields = contentType === 'anime' 
        ? 'episodes, status, type, aired_from, aired_to, season'
        : 'chapters, volumes, status, type, published_from, published_to';

      queries.push(
        supabase
          .from('titles')
          .select(`
            id,
            anilist_id,
            title,
            title_english,
            title_japanese,
            image_url,
            score,
            year,
            favorites,
            popularity,
            ${detailsTable}!inner(
              ${detailsFields}
            )
          `)
          .order('score', { ascending: false })
          .limit(12)
      );
    }

    // Execute all queries in parallel
    const results = await Promise.all(queries);
    
    // Map results to section names
    const responseData: any = {
      cached_at: new Date().toISOString(),
      cache_ttl: 600,
      content_type: contentType
    };

    sections.forEach((section, index) => {
      responseData[section] = results[index]?.data || [];
    });

    // Calculate total items
    const totalItems = sections.reduce((sum, section, index) => {
      return sum + (results[index]?.data?.length || 0);
    }, 0);

    console.log(`✅ Home data aggregated: ${totalItems} items`);

    return new Response(JSON.stringify({
      success: true,
      data: responseData
    }), { headers });

  } catch (error) {
    console.error('❌ Error in cached-home-data function:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
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