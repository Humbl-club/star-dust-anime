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
    console.log('Starting COMPLETE library sync for all anime and manga...');

    // Trigger comprehensive sync of ALL anime and manga from AniList
    const bulkSyncResponse = await supabase.functions.invoke('bulk-sync-anime', {
      body: { contentType: 'both' }
    });

    console.log('Bulk sync triggered:', bulkSyncResponse);

    // Also trigger intelligent sync for additional data enhancement
    const intelligentSyncs = [];
    
    // Sync 20 pages of anime to get comprehensive coverage
    for (let page = 1; page <= 20; page++) {
      intelligentSyncs.push(
        supabase.functions.invoke('intelligent-content-sync', {
          body: { 
            contentType: 'anime', 
            operation: 'full_sync',
            page 
          }
        })
      );
    }

    // Sync 15 pages of manga to get comprehensive coverage
    for (let page = 1; page <= 15; page++) {
      intelligentSyncs.push(
        supabase.functions.invoke('intelligent-content-sync', {
          body: { 
            contentType: 'manga', 
            operation: 'full_sync',
            page 
          }
        })
      );
    }

    // Trigger all additional syncs in parallel
    await Promise.allSettled(intelligentSyncs);

    console.log('Complete library sync initiated - this will take 30-60 minutes to complete');

    return new Response(JSON.stringify({
      success: true,
      message: 'Complete anime and manga library sync initiated',
      estimatedCompletion: new Date(Date.now() + 60 * 60 * 1000).toISOString(), // 1 hour
      bulkSync: bulkSyncResponse.data,
      additionalSyncs: intelligentSyncs.length,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Full sync error:', error);

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