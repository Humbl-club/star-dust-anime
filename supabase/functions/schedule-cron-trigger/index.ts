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
    console.log('Automated sync triggered - calling dedicated sync functions...');

    // Call both dedicated sync functions simultaneously
    const [animeResult, mangaResult] = await Promise.all([
      supabase.functions.invoke('sync-anime-dedicated'),
      supabase.functions.invoke('sync-manga-dedicated')
    ]);

    // Process results
    let totalProcessed = 0;
    let errors: string[] = [];
    let success = true;

    // Handle anime result
    if (animeResult.error) {
      console.error('Anime sync error:', animeResult.error);
      errors.push(`Anime sync failed: ${animeResult.error.message}`);
      success = false;
    } else if (animeResult.data?.success) {
      totalProcessed += animeResult.data.totalProcessed || 0;
      console.log(`Anime sync completed: ${animeResult.data.totalProcessed} items`);
    }

    // Handle manga result
    if (mangaResult.error) {
      console.error('Manga sync error:', mangaResult.error);
      errors.push(`Manga sync failed: ${mangaResult.error.message}`);
      success = false;
    } else if (mangaResult.data?.success) {
      totalProcessed += mangaResult.data.totalProcessed || 0;
      console.log(`Manga sync completed: ${mangaResult.data.totalProcessed} items`);
    }

    // Log the execution
    await supabase.from('cron_job_logs').insert({
      job_name: 'dedicated-dual-sync',
      status: success ? 'success' : 'error',
      details: {
        total_processed: totalProcessed,
        anime_result: animeResult.data,
        manga_result: mangaResult.data,
        errors: errors
      },
      error_message: errors.length > 0 ? errors.join('; ') : null
    });

    console.log(`Dedicated dual sync completed: ${totalProcessed} total items processed`);

    return new Response(JSON.stringify({
      success: success,
      message: 'Dedicated dual sync completed successfully',
      totalProcessed: totalProcessed,
      animeResult: animeResult.data,
      mangaResult: mangaResult.data,
      errors: errors,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Cron trigger error:', error);

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