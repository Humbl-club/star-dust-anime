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
    console.log('6-hour sync trigger activated');

    // Check if any syncs are currently running
    const { data: runningSyncs } = await supabase
      .from('content_sync_status')
      .select('*')
      .eq('status', 'running');

    if (runningSyncs && runningSyncs.length > 0) {
      console.log('Sync already running, skipping...');
      return new Response(JSON.stringify({
        success: true,
        message: 'Sync already in progress, skipping this run'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Trigger anime sync
    const animeResponse = await supabase.functions.invoke('intelligent-content-sync', {
      body: { 
        contentType: 'anime', 
        operation: 'schedule_update',
        page: 1 
      }
    });

    // TODO: Add manga sync when implemented
    // const mangaResponse = await supabase.functions.invoke('intelligent-content-sync', {
    //   body: { 
    //     contentType: 'manga', 
    //     operation: 'schedule_update',
    //     page: 1 
    //   }
    // });

    console.log('Triggered 6-hour sync update');

    return new Response(JSON.stringify({
      success: true,
      message: '6-hour sync triggered successfully',
      animeSync: animeResponse.data,
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