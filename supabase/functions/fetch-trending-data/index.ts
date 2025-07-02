import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Fetching trending data from AniList and MAL...');

    // Trigger both anime and manga sync
    const [animeResponse, mangaResponse] = await Promise.all([
      supabase.functions.invoke('intelligent-content-sync', {
        body: { 
          contentType: 'anime', 
          operation: 'trending_sync',
          page: 1 
        }
      }),
      supabase.functions.invoke('intelligent-content-sync', {
        body: { 
          contentType: 'manga', 
          operation: 'trending_sync',
          page: 1 
        }
      })
    ]);

    // Fetch multiple pages for comprehensive data
    const additionalSyncs = [];
    
    // Fetch 5 pages of trending anime
    for (let page = 2; page <= 5; page++) {
      additionalSyncs.push(
        supabase.functions.invoke('intelligent-content-sync', {
          body: { 
            contentType: 'anime', 
            operation: 'trending_sync',
            page 
          }
        })
      );
    }

    // Fetch 3 pages of trending manga
    for (let page = 2; page <= 3; page++) {
      additionalSyncs.push(
        supabase.functions.invoke('intelligent-content-sync', {
          body: { 
            contentType: 'manga', 
            operation: 'trending_sync',
            page 
          }
        })
      );
    }

    // Wait for additional syncs
    await Promise.allSettled(additionalSyncs);

    console.log('All trending data sync initiated');

    return new Response(JSON.stringify({
      success: true,
      message: 'Trending data sync initiated for anime and manga',
      animeSync: animeResponse.data,
      mangaSync: mangaResponse.data,
      timestamp: new Date().toISOString(),
      estimatedCompletion: new Date(Date.now() + 10 * 60 * 1000).toISOString() // 10 minutes
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Trending data fetch error:', error);

    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});