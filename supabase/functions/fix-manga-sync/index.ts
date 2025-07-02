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
    console.log('Fixing stuck manga sync and starting fresh...');

    // Clear stuck manga syncs
    await supabase
      .from('content_sync_status')
      .update({ 
        status: 'failed', 
        error_message: 'Stuck sync cleared - restarting fresh',
        completed_at: new Date().toISOString()
      })
      .eq('content_type', 'manga')
      .eq('status', 'running');

    console.log('Cleared stuck manga syncs');

    // Start fresh manga sync with 20 pages
    const freshSyncs = [];
    for (let page = 1; page <= 20; page++) {
      freshSyncs.push(
        supabase.functions.invoke('intelligent-content-sync', {
          body: { 
            contentType: 'manga', 
            operation: 'fresh_sync',
            page 
          }
        })
      );
    }

    // Wait for all to start
    const results = await Promise.allSettled(freshSyncs);
    console.log('Started fresh manga sync for 20 pages');

    return new Response(JSON.stringify({
      success: true,
      message: 'Fixed stuck manga sync and started fresh sync',
      pagesStarted: 20,
      results: results.length,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Fix manga sync error:', error);

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