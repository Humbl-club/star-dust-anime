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
    console.log('Auto-initialization service started');

    // Check if database is already populated
    const [animeCount, mangaCount] = await Promise.all([
      supabase.from('anime').select('id', { count: 'exact', head: true }),
      supabase.from('manga').select('id', { count: 'exact', head: true })
    ]);

    const animeTotal = animeCount.count || 0;
    const mangaTotal = mangaCount.count || 0;

    console.log(`Current database state: ${animeTotal} anime, ${mangaTotal} manga`);

    // Check if any sync is currently running
    const { data: runningSyncs } = await supabase
      .from('content_sync_status')
      .select('*')
      .eq('status', 'running');

    if (runningSyncs && runningSyncs.length > 0) {
      console.log('Sync already in progress, skipping auto-init');
      return new Response(JSON.stringify({
        success: true,
        message: 'Auto-init skipped - sync already running',
        status: 'sync_in_progress'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Initialize if databases are empty or have minimal data
    const needsAnimeInit = animeTotal < 100;
    const needsMangaInit = mangaTotal < 25;

    if (!needsAnimeInit && !needsMangaInit) {
      console.log('Database already well-populated, running maintenance sync');
      
      // Run light maintenance sync
      await Promise.all([
        supabase.functions.invoke('intelligent-content-sync', {
          body: { 
            contentType: 'anime', 
            operation: 'maintenance_sync',
            page: 1 
          }
        }),
        supabase.functions.invoke('intelligent-content-sync', {
          body: { 
            contentType: 'manga', 
            operation: 'maintenance_sync',
            page: 1 
          }
        })
      ]);

      return new Response(JSON.stringify({
        success: true,
        message: 'Maintenance sync completed',
        status: 'maintenance',
        animeCount: animeTotal,
        mangaCount: mangaTotal
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Initializing database - needs anime: ${needsAnimeInit}, needs manga: ${needsMangaInit}`);

    // Background initialization
    const initPromises = [];

    if (needsAnimeInit) {
      console.log('Starting anime initialization...');
      // Initialize with 5 pages of anime
      for (let page = 1; page <= 5; page++) {
        initPromises.push(
          supabase.functions.invoke('intelligent-content-sync', {
            body: { 
              contentType: 'anime', 
              operation: 'auto_init',
              page 
            }
          })
        );
      }
    }

    if (needsMangaInit) {
      console.log('Starting manga initialization...');
      // Initialize with 3 pages of manga
      for (let page = 1; page <= 3; page++) {
        initPromises.push(
          supabase.functions.invoke('intelligent-content-sync', {
            body: { 
              contentType: 'manga', 
              operation: 'auto_init',
              page 
            }
          })
        );
      }
    }

    // Trigger all initializations (don't wait for completion)
    Promise.allSettled(initPromises).then(() => {
      console.log('Auto-initialization batch completed');
    });

    return new Response(JSON.stringify({
      success: true,
      message: 'Auto-initialization started in background',
      status: 'initializing',
      animeInit: needsAnimeInit,
      mangaInit: needsMangaInit,
      estimatedCompletion: new Date(Date.now() + 15 * 60 * 1000).toISOString() // 15 minutes
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Auto-initialization error:', error);

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