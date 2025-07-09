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
    console.log('Automated dual sync triggered - syncing both anime and manga...');

    // Run both anime and manga sync simultaneously using ultra-fast-sync
    const [animeResult, mangaResult] = await Promise.all([
      supabase.functions.invoke('ultra-fast-sync', {
        body: {
          contentType: 'anime',
          maxPages: 3 // Sync 3 pages per run to balance speed vs coverage
        }
      }),
      supabase.functions.invoke('ultra-fast-sync', {
        body: {
          contentType: 'manga',
          maxPages: 3 // Sync 3 pages per run to balance speed vs coverage
        }
      })
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
      const animeProcessed = animeResult.data.results?.processed || 0;
      totalProcessed += animeProcessed;
      console.log(`Anime sync completed: ${animeProcessed} items`);
    } else {
      errors.push('Anime sync failed with unknown error');
      success = false;
    }

    // Handle manga result
    if (mangaResult.error) {
      console.error('Manga sync error:', mangaResult.error);
      errors.push(`Manga sync failed: ${mangaResult.error.message}`);
      success = false;
    } else if (mangaResult.data?.success) {
      const mangaProcessed = mangaResult.data.results?.processed || 0;
      totalProcessed += mangaProcessed;
      console.log(`Manga sync completed: ${mangaProcessed} items`);
    } else {
      errors.push('Manga sync failed with unknown error');
      success = false;
    }

    // Log the execution
    await supabase.from('cron_job_logs').insert({
      job_name: 'automated-dual-sync',
      status: success ? 'success' : 'error',
      details: {
        total_processed: totalProcessed,
        anime_result: animeResult.data,
        manga_result: mangaResult.data,
        errors: errors
      },
      error_message: errors.length > 0 ? errors.join('; ') : null
    });

    console.log(`Automated dual sync completed: ${totalProcessed} total items processed`);

    return new Response(JSON.stringify({
      success: success,
      total_processed: totalProcessed,
      anime_result: animeResult.data,
      manga_result: mangaResult.data,
      errors: errors,
      message: `Automated dual sync completed - ${totalProcessed} items processed`,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Automated dual sync error:', error);

    // Log the error
    await supabase.from('cron_job_logs').insert({
      job_name: 'automated-dual-sync',
      status: 'error',
      error_message: error.message,
      details: { error: error.toString() }
    });

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