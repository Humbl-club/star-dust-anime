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
    const { contentType = 'anime', maxPages = 50, itemsPerPage = 25 } = await req.json();
    
    console.log(`Starting complete ${contentType} library sync...`);
    
    let processedItems = 0;
    let totalErrors = 0;
    const startTime = Date.now();

    // Log sync start
    const { data: logEntry } = await supabase
      .from('content_sync_status')
      .insert({
        operation_type: 'complete_library_sync',
        content_type: contentType,
        status: 'running',
        total_items: maxPages * itemsPerPage,
        processed_items: 0
      })
      .select()
      .single();

    for (let page = 1; page <= maxPages; page++) {
      try {
        console.log(`Processing page ${page}/${maxPages} for ${contentType}...`);
        
        // Fetch data from external API
        const apiUrl = contentType === 'anime' 
          ? `https://api.jikan.moe/v4/anime?page=${page}&limit=${itemsPerPage}&order_by=score&sort=desc`
          : `https://api.jikan.moe/v4/manga?page=${page}&limit=${itemsPerPage}&order_by=score&sort=desc`;
        
        const response = await fetch(apiUrl);
        
        if (!response.ok) {
          console.error(`API request failed for page ${page}: ${response.status}`);
          totalErrors++;
          
          // Rate limit handling
          if (response.status === 429) {
            console.log('Rate limited, waiting 5 seconds...');
            await new Promise(resolve => setTimeout(resolve, 5000));
            continue;
          }
          
          // Skip this page on other errors
          continue;
        }

        const data = await response.json();
        const items = data.data || [];
        
        if (items.length === 0) {
          console.log(`No more items found at page ${page}, stopping sync`);
          break;
        }

        // Process each item
        for (const item of items) {
          try {
            const processedItem = contentType === 'anime' ? processAnimeItem(item) : processMangaItem(item);
            
            // Check if item already exists
            const { data: existing } = await supabase
              .from(contentType)
              .select('id')
              .eq('mal_id', item.mal_id)
              .single();

            if (existing) {
              // Update existing item
              await supabase
                .from(contentType)
                .update(processedItem)
                .eq('mal_id', item.mal_id);
            } else {
              // Insert new item
              await supabase
                .from(contentType)
                .insert(processedItem);
            }
            
            processedItems++;
            
          } catch (itemError) {
            console.error(`Error processing item ${item.mal_id}:`, itemError);
            totalErrors++;
          }
        }

        // Update progress
        await supabase
          .from('content_sync_status')
          .update({
            processed_items: processedItems,
            current_page: page
          })
          .eq('id', logEntry.id);

        // Rate limiting between pages
        await new Promise(resolve => setTimeout(resolve, 1500));
        
      } catch (pageError) {
        console.error(`Error processing page ${page}:`, pageError);
        totalErrors++;
        
        // Wait longer on errors
        await new Promise(resolve => setTimeout(resolve, 3000));
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
        processed_items: processedItems,
        error_message: totalErrors > 0 ? `${totalErrors} errors occurred during sync` : null
      })
      .eq('id', logEntry.id);

    console.log(`Complete sync finished: ${processedItems} items processed in ${duration}s with ${totalErrors} errors`);

    return new Response(
      JSON.stringify({
        success: true,
        processed: processedItems,
        errors: totalErrors,
        duration: duration,
        pages_processed: Math.min(maxPages, page - 1)
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Complete sync error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});

function processAnimeItem(item: any) {
  return {
    mal_id: item.mal_id,
    title: item.title || item.titles?.[0]?.title || 'Unknown Title',
    title_english: item.title_english || item.titles?.find((t: any) => t.type === 'English')?.title,
    title_japanese: item.title_japanese || item.titles?.find((t: any) => t.type === 'Japanese')?.title,
    synopsis: item.synopsis,
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
  };
}

function processMangaItem(item: any) {
  return {
    mal_id: item.mal_id,
    title: item.title || item.titles?.[0]?.title || 'Unknown Title',
    title_english: item.title_english || item.titles?.find((t: any) => t.type === 'English')?.title,
    title_japanese: item.title_japanese || item.titles?.find((t: any) => t.type === 'Japanese')?.title,
    synopsis: item.synopsis,
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
  };
}