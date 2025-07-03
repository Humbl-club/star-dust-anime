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
    const { daysBack = 7 } = await req.json().catch(() => ({}));
    
    console.log(`Starting incremental sync for content from last ${daysBack} days...`);
    
    let processedAnime = 0;
    let processedManga = 0;
    let newItems = 0;
    let updatedItems = 0;

    // Calculate date threshold for recent content
    const dateThreshold = new Date();
    dateThreshold.setDate(dateThreshold.getDate() - daysBack);
    const formattedDate = dateThreshold.toISOString().split('T')[0];

    // Get recently updated anime from API
    for (let page = 1; page <= 5; page++) {
      try {
        console.log(`Fetching recent anime page ${page}...`);
        
        const response = await fetch(`https://api.jikan.moe/v4/anime?page=${page}&limit=25&order_by=last_updated&sort=desc`);
        
        if (!response.ok) {
          if (response.status === 429) {
            console.log('Rate limited, waiting...');
            await new Promise(resolve => setTimeout(resolve, 3000));
            continue;
          }
          break;
        }

        const data = await response.json();
        const items = data.data || [];
        
        if (items.length === 0) break;

        for (const item of items) {
          try {
            const processedItem = {
              mal_id: item.mal_id,
              title: item.title || 'Unknown Title',
              title_english: item.title_english,
              title_japanese: item.title_japanese,
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
              genres: item.genres?.map((g: any) => g.name) || [],
              themes: item.themes?.map((t: any) => t.name) || [],
              demographics: item.demographics?.map((d: any) => d.name) || [],
              studios: item.studios?.map((s: any) => s.name) || [],
              last_sync_check: new Date().toISOString()
            };

            // Check if exists
            const { data: existing } = await supabase
              .from('anime')
              .select('id, last_sync_check')
              .eq('mal_id', item.mal_id)
              .single();

            if (existing) {
              // Update existing
              await supabase
                .from('anime')
                .update(processedItem)
                .eq('mal_id', item.mal_id);
              updatedItems++;
            } else {
              // Insert new
              await supabase
                .from('anime')
                .insert(processedItem);
              newItems++;
            }
            
            processedAnime++;
            
          } catch (itemError) {
            console.error(`Error processing anime ${item.mal_id}:`, itemError);
          }
        }

        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 1500));
        
      } catch (pageError) {
        console.error(`Error processing anime page ${page}:`, pageError);
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
    }

    // Get recently updated manga from API
    for (let page = 1; page <= 5; page++) {
      try {
        console.log(`Fetching recent manga page ${page}...`);
        
        const response = await fetch(`https://api.jikan.moe/v4/manga?page=${page}&limit=25&order_by=last_updated&sort=desc`);
        
        if (!response.ok) {
          if (response.status === 429) {
            console.log('Rate limited, waiting...');
            await new Promise(resolve => setTimeout(resolve, 3000));
            continue;
          }
          break;
        }

        const data = await response.json();
        const items = data.data || [];
        
        if (items.length === 0) break;

        for (const item of items) {
          try {
            const processedItem = {
              mal_id: item.mal_id,
              title: item.title || 'Unknown Title',
              title_english: item.title_english,
              title_japanese: item.title_japanese,
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

            // Check if exists
            const { data: existing } = await supabase
              .from('manga')
              .select('id, last_sync_check')
              .eq('mal_id', item.mal_id)
              .single();

            if (existing) {
              // Update existing
              await supabase
                .from('manga')
                .update(processedItem)
                .eq('mal_id', item.mal_id);
              updatedItems++;
            } else {
              // Insert new
              await supabase
                .from('manga')
                .insert(processedItem);
              newItems++;
            }
            
            processedManga++;
            
          } catch (itemError) {
            console.error(`Error processing manga ${item.mal_id}:`, itemError);
          }
        }

        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 1500));
        
      } catch (pageError) {
        console.error(`Error processing manga page ${page}:`, pageError);
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
    }

    console.log(`Incremental sync completed: ${processedAnime} anime, ${processedManga} manga processed. ${newItems} new items, ${updatedItems} updated.`);

    return new Response(
      JSON.stringify({
        success: true,
        processed_anime: processedAnime,
        processed_manga: processedManga,
        new_items: newItems,
        updated_items: updatedItems,
        message: 'Incremental sync completed successfully'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Incremental sync error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});