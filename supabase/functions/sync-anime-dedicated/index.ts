
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
    console.log('Dedicated anime sync triggered...');

    // Call ultra-fast-sync for anime content
    const { data, error } = await supabase.functions.invoke('ultra-fast-sync', {
      body: {
        contentType: 'anime',
        maxPages: 5 // Sync 5 pages for dedicated anime sync
      }
    });

    if (error) {
      console.error('Anime sync error:', error);
      throw error;
    }

    // Log the execution
    await supabase.from('cron_job_logs').insert({
      job_name: 'sync-anime-dedicated',
      status: 'success',
      details: {
        processed: data?.results?.processed || 0,
        sync_result: data
      }
    });

    console.log(`Dedicated anime sync completed: ${data?.results?.processed || 0} items processed`);

    return new Response(JSON.stringify({
      success: true,
      totalProcessed: data?.results?.processed || 0,
      message: 'Dedicated anime sync completed successfully',
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Dedicated anime sync error:', error);

    // Log the error
    await supabase.from('cron_job_logs').insert({
      job_name: 'sync-anime-dedicated',
      status: 'error',
      error_message: error.message
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
