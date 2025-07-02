import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Auto-sync everything on startup
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('Starting comprehensive data sync...');

    // Step 1: Sync anime and manga from MAL
    const bulkResponse = await fetch('https://axtpbgsjbmhbuqomarcr.supabase.co/functions/v1/bulk-sync-anime', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contentType: 'both', maxItems: 2000 })
    });

    const bulkResult = await bulkResponse.json();
    console.log('Bulk sync result:', bulkResult);

    // Step 2: Enhance with AniList data
    let anilistProcessed = 0;
    let offset = 0;
    const batchSize = 50;

    while (true) {
      const anilistResponse = await fetch('https://axtpbgsjbmhbuqomarcr.supabase.co/functions/v1/sync-anilist-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ batchSize, offset })
      });

      const anilistResult = await anilistResponse.json();
      
      if (anilistResult.processed === 0 || anilistResult.remaining === 0) {
        break;
      }

      anilistProcessed += anilistResult.processed;
      offset += batchSize;

      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    console.log(`Auto-sync completed: ${bulkResult.anime_processed || 0} anime, ${bulkResult.manga_processed || 0} manga, ${anilistProcessed} AniList enhancements`);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Complete data sync finished',
        anime_processed: bulkResult.anime_processed || 0,
        manga_processed: bulkResult.manga_processed || 0,
        anilist_enhanced: anilistProcessed
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('Auto-sync error:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        message: 'Auto-sync failed' 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});