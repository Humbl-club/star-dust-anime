import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('STARTING ULTRA-FAST COMPLETE LIBRARY SYNC - ALL SOURCES');
    
    const startTime = Date.now();
    let totalProcessed = 0;

    // Log sync start
    const { data: logEntry } = await supabase
      .from('content_sync_status')
      .insert({
        operation_type: 'ultra_fast_complete_sync',
        content_type: 'both',
        status: 'running',
        total_items: 100000, // Estimated total
        processed_items: 0
      })
      .select()
      .single();

    // PHASE 1: MyAnimeList via Jikan API - Get EVERYTHING
    console.log('PHASE 1: MyAnimeList Complete Sync...');
    
    // Anime from MyAnimeList - Get ALL pages
    for (let page = 1; page <= 1000; page++) { // Much higher limit
      try {
        console.log(`Fetching MAL Anime page ${page}...`);
        
        const response = await fetch(`https://api.jikan.moe/v4/anime?page=${page}&limit=25&order_by=mal_id&sort=asc`);
        
        if (!response.ok) {
          if (response.status === 429) {
            console.log('Rate limited, waiting 3 seconds...');
            await new Promise(resolve => setTimeout(resolve, 3000));
            continue;
          }
          break;
        }

        const data = await response.json();
        const items = data.data || [];
        
        if (items.length === 0) {
          console.log(`No more anime at page ${page}, reached end`);
          break;
        }

        // Batch insert for better performance
        const processedItems = items.map((item: any) => ({
          mal_id: item.mal_id,
          title: item.title || 'Unknown Title',
          title_english: item.title_english,
          title_japanese: item.title_japanese,
          synopsis: item.synopsis?.substring(0, 2000), // Limit length for Apple compliance
          type: item.type,
          episodes: item.episodes,
          status: item.status,
          aired_from: item.aired?.from?.split('T')[0] || null,
          aired_to: item.aired?.to?.split('T')[0] || null,
          season: item.season,
          year: item.year,
          score: item.score,
          scored_by: item.scored_by,
          rank: item.rank,
          popularity: item.popularity,
          members: item.members,
          favorites: item.favorites,
          image_url: item.images?.jpg?.large_image_url || item.images?.jpg?.image_url,
          trailer_url: item.trailer?.url,
          trailer_site: item.trailer?.site,
          trailer_id: item.trailer?.youtube_id,
          genres: item.genres?.map((g: any) => g.name) || [],
          themes: item.themes?.map((t: any) => t.name) || [],
          demographics: item.demographics?.map((d: any) => d.name) || [],
          studios: item.studios?.map((s: any) => s.name) || [],
          last_sync_check: new Date().toISOString()
        }));

        // Upsert batch
        const { error } = await supabase
          .from('anime')
          .upsert(processedItems, { 
            onConflict: 'mal_id',
            ignoreDuplicates: false 
          });

        if (error) {
          console.error('Batch insert error:', error);
        } else {
          totalProcessed += items.length;
          console.log(`Processed ${totalProcessed} anime items so far...`);
        }

        // Rate limiting - faster but respectful
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (error) {
        console.error(`Error on anime page ${page}:`, error);
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    // Manga from MyAnimeList - Get ALL pages
    console.log('PHASE 2: MyAnimeList Manga Complete Sync...');
    
    for (let page = 1; page <= 1500; page++) { // Even higher for manga
      try {
        console.log(`Fetching MAL Manga page ${page}...`);
        
        const response = await fetch(`https://api.jikan.moe/v4/manga?page=${page}&limit=25&order_by=mal_id&sort=asc`);
        
        if (!response.ok) {
          if (response.status === 429) {
            console.log('Rate limited, waiting 3 seconds...');
            await new Promise(resolve => setTimeout(resolve, 3000));
            continue;
          }
          break;
        }

        const data = await response.json();
        const items = data.data || [];
        
        if (items.length === 0) {
          console.log(`No more manga at page ${page}, reached end`);
          break;
        }

        const processedItems = items.map((item: any) => ({
          mal_id: item.mal_id,
          title: item.title || 'Unknown Title',
          title_english: item.title_english,
          title_japanese: item.title_japanese,
          synopsis: item.synopsis?.substring(0, 2000), // Apple compliance
          type: item.type,
          chapters: item.chapters,
          volumes: item.volumes,
          status: item.status,
          published_from: item.published?.from?.split('T')[0] || null,
          published_to: item.published?.to?.split('T')[0] || null,
          score: item.score,
          scored_by: item.scored_by,
          rank: item.rank,
          popularity: item.popularity,
          members: item.members,
          favorites: item.favorites,
          image_url: item.images?.jpg?.large_image_url || item.images?.jpg?.image_url,
          genres: item.genres?.map((g: any) => g.name) || [],
          themes: item.themes?.map((t: any) => t.name) || [],
          demographics: item.demographics?.map((d: any) => d.name) || [],
          authors: item.authors?.map((a: any) => a.name) || [],
          serializations: item.serializations?.map((s: any) => s.name) || [],
          last_sync_check: new Date().toISOString()
        }));

        const { error } = await supabase
          .from('manga')
          .upsert(processedItems, { 
            onConflict: 'mal_id',
            ignoreDuplicates: false 
          });

        if (error) {
          console.error('Batch manga insert error:', error);
        } else {
          totalProcessed += items.length;
          console.log(`Processed ${totalProcessed} total items so far...`);
        }

        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (error) {
        console.error(`Error on manga page ${page}:`, error);
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000;

    // Update final status
    await supabase
      .from('content_sync_status')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        processed_items: totalProcessed
      })
      .eq('id', logEntry.id);

    console.log(`ULTRA-FAST COMPLETE SYNC FINISHED: ${totalProcessed} items in ${duration}s`);

    // Get final counts
    const { data: animeCount } = await supabase
      .from('anime')
      .select('*', { count: 'exact', head: true });

    const { data: mangaCount } = await supabase
      .from('manga')
      .select('*', { count: 'exact', head: true });

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Ultra-fast complete library sync completed!',
        processed: totalProcessed,
        duration: duration,
        final_counts: {
          anime: animeCount,
          manga: mangaCount
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Ultra-fast sync error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});