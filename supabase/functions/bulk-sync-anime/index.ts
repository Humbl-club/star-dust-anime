import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.2';

const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface JikanAnime {
  mal_id: number;
  title: string;
  title_english?: string;
  title_japanese?: string;
  type: string;
  status: string;
  episodes?: number;
  aired: {
    from?: string;
    to?: string;
  };
  score?: number;
  scored_by?: number;
  rank?: number;
  popularity?: number;
  members?: number;
  favorites?: number;
  synopsis?: string;
  images: {
    jpg: {
      image_url: string;
      large_image_url: string;
    };
  };
  trailer?: {
    url?: string;
  };
  genres: Array<{ name: string }>;
  studios: Array<{ name: string }>;
  themes: Array<{ name: string }>;
  demographics: Array<{ name: string }>;
  season?: string;
  year?: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase configuration missing');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Starting bulk anime sync...');

    // Check current anime count
    const { count: currentCount } = await supabase
      .from('anime')
      .select('*', { count: 'exact', head: true });

    console.log(`Current anime count: ${currentCount}`);

    // If we already have 500+ anime, skip sync
    if (currentCount && currentCount >= 500) {
      return new Response(JSON.stringify({
        success: true,
        message: 'Database already populated',
        current_count: currentCount
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let totalProcessed = 0;
    const maxPages = 20; // Fetch 20 pages = ~500 anime
    const batchSize = 25;

    // Fetch anime in batches
    for (let page = 1; page <= maxPages; page++) {
      console.log(`Fetching page ${page}/${maxPages}...`);

      try {
        const jikanUrl = `https://api.jikan.moe/v4/anime?page=${page}&limit=${batchSize}&order_by=score&sort=desc`;
        const response = await fetch(jikanUrl);
        
        if (!response.ok) {
          console.error(`Jikan API error on page ${page}: ${response.status}`);
          // Skip this page and continue
          continue;
        }

        const data = await response.json();
        const animeList = data.data;

        console.log(`Processing ${animeList.length} anime from page ${page}...`);

        // Process each anime
        for (const anime of animeList) {
          try {
            // Check if anime already exists
            const { data: existing } = await supabase
              .from('anime')
              .select('id')
              .eq('mal_id', anime.mal_id)
              .maybeSingle();

            if (!existing) {
              const animeData = {
                mal_id: anime.mal_id,
                title: anime.title,
                title_english: anime.title_english || null,
                title_japanese: anime.title_japanese || null,
                type: anime.type || 'TV',
                status: anime.status || 'Finished Airing',
                episodes: anime.episodes || null,
                aired_from: anime.aired.from ? new Date(anime.aired.from).toISOString().split('T')[0] : null,
                aired_to: anime.aired.to ? new Date(anime.aired.to).toISOString().split('T')[0] : null,
                score: anime.score || null,
                scored_by: anime.scored_by || null,
                rank: anime.rank || null,
                popularity: anime.popularity || null,
                members: anime.members || null,
                favorites: anime.favorites || null,
                synopsis: anime.synopsis || null,
                image_url: anime.images.jpg.large_image_url || anime.images.jpg.image_url,
                trailer_url: anime.trailer?.url || null,
                genres: anime.genres.map(g => g.name),
                studios: anime.studios.map(s => s.name),
                themes: anime.themes.map(t => t.name),
                demographics: anime.demographics.map(d => d.name),
                season: anime.season || null,
                year: anime.year || null
              };

              const { error } = await supabase
                .from('anime')
                .insert(animeData);

              if (error) {
                console.error('Error inserting anime:', error);
              } else {
                totalProcessed++;
              }
            }
          } catch (animeError) {
            console.error(`Error processing anime ${anime.mal_id}:`, animeError);
            // Continue with next anime
          }
        }

        // Rate limiting - Jikan API allows 3 requests per second
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (pageError) {
        console.error(`Error fetching page ${page}:`, pageError);
        // Continue with next page
      }
    }

    console.log(`Bulk sync completed. Total processed: ${totalProcessed}`);

    return new Response(JSON.stringify({
      success: true,
      total_processed: totalProcessed,
      pages_fetched: maxPages,
      message: `Successfully populated database with ${totalProcessed} anime`
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in bulk-sync-anime function:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});