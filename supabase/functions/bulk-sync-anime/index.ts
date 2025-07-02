import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.2';

const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { contentType = 'both' } = await req.json().catch(() => ({}));
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase configuration missing');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    console.log(`Starting comprehensive ${contentType} sync...`);

    let animeProcessed = 0;
    let mangaProcessed = 0;
    
    // Sync anime if requested
    if (contentType === 'anime' || contentType === 'both') {
      console.log('Fetching comprehensive anime database...');
      
      const maxAnimePages = 80; // Fetch ~2000 anime (80 pages x 25 each)
      
      for (let page = 1; page <= maxAnimePages; page++) {
        console.log(`Fetching anime page ${page}/${maxAnimePages}...`);

        try {
          const jikanUrl = `https://api.jikan.moe/v4/anime?page=${page}&limit=25&order_by=score&sort=desc`;
          const response = await fetch(jikanUrl);
          
          if (!response.ok) {
            console.error(`Jikan API error on anime page ${page}: ${response.status}`);
            continue;
          }

          const data = await response.json();
          const animeList = data.data;

          for (const anime of animeList) {
            try {
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
                  aired_from: anime.aired?.from ? new Date(anime.aired.from).toISOString().split('T')[0] : null,
                  aired_to: anime.aired?.to ? new Date(anime.aired.to).toISOString().split('T')[0] : null,
                  score: anime.score || null,
                  scored_by: anime.scored_by || null,
                  rank: anime.rank || null,
                  popularity: anime.popularity || null,
                  members: anime.members || null,
                  favorites: anime.favorites || null,
                  synopsis: anime.synopsis || null,
                  image_url: anime.images?.jpg?.large_image_url || anime.images?.jpg?.image_url || null,
                  trailer_url: anime.trailer?.url || null,
                  genres: anime.genres?.map((g: any) => g.name) || [],
                  studios: anime.studios?.map((s: any) => s.name) || [],
                  themes: anime.themes?.map((t: any) => t.name) || [],
                  demographics: anime.demographics?.map((d: any) => d.name) || [],
                  season: anime.season || null,
                  year: anime.year || null
                };

                const { error } = await supabase
                  .from('anime')
                  .insert(animeData);

                if (!error) {
                  animeProcessed++;
                }
              }
            } catch (animeError) {
              console.error(`Error processing anime ${anime.mal_id}:`, animeError);
            }
          }

          // Rate limiting
          await new Promise(resolve => setTimeout(resolve, 1000));

        } catch (pageError) {
          console.error(`Error fetching anime page ${page}:`, pageError);
        }
      }
    }

    // Sync manga if requested  
    if (contentType === 'manga' || contentType === 'both') {
      console.log('Fetching comprehensive manga database...');
      
      const maxMangaPages = 60; // Fetch ~1500 manga (60 pages x 25 each)
      
      for (let page = 1; page <= maxMangaPages; page++) {
        console.log(`Fetching manga page ${page}/${maxMangaPages}...`);

        try {
          const jikanUrl = `https://api.jikan.moe/v4/manga?page=${page}&limit=25&order_by=score&sort=desc`;
          const response = await fetch(jikanUrl);
          
          if (!response.ok) {
            console.error(`Jikan API error on manga page ${page}: ${response.status}`);
            continue;
          }

          const data = await response.json();
          const mangaList = data.data;

          for (const manga of mangaList) {
            try {
              const { data: existing } = await supabase
                .from('manga')
                .select('id')
                .eq('mal_id', manga.mal_id)
                .maybeSingle();

              if (!existing) {
                const mangaData = {
                  mal_id: manga.mal_id,
                  title: manga.title,
                  title_english: manga.title_english || null,
                  title_japanese: manga.title_japanese || null,
                  type: manga.type || 'Manga',
                  status: manga.status || 'Finished',
                  chapters: manga.chapters || null,
                  volumes: manga.volumes || null,
                  published_from: manga.published?.from ? new Date(manga.published.from).toISOString().split('T')[0] : null,
                  published_to: manga.published?.to ? new Date(manga.published.to).toISOString().split('T')[0] : null,
                  score: manga.score || null,
                  scored_by: manga.scored_by || null,
                  rank: manga.rank || null,
                  popularity: manga.popularity || null,
                  members: manga.members || null,
                  favorites: manga.favorites || null,
                  synopsis: manga.synopsis || null,
                  image_url: manga.images?.jpg?.large_image_url || manga.images?.jpg?.image_url || null,
                  genres: manga.genres?.map((g: any) => g.name) || [],
                  authors: manga.authors?.map((a: any) => a.name) || [],
                  serializations: manga.serializations?.map((s: any) => s.name) || [],
                  themes: manga.themes?.map((t: any) => t.name) || [],
                  demographics: manga.demographics?.map((d: any) => d.name) || []
                };

                const { error } = await supabase
                  .from('manga')
                  .insert(mangaData);

                if (!error) {
                  mangaProcessed++;
                }
              }
            } catch (mangaError) {
              console.error(`Error processing manga ${manga.mal_id}:`, mangaError);
            }
          }

          // Rate limiting
          await new Promise(resolve => setTimeout(resolve, 1000));

        } catch (pageError) {
          console.error(`Error fetching manga page ${page}:`, pageError);
        }
      }
    }

    console.log(`Comprehensive sync completed!`);
    console.log(`Anime processed: ${animeProcessed}`);
    console.log(`Manga processed: ${mangaProcessed}`);

    return new Response(JSON.stringify({
      success: true,
      anime_processed: animeProcessed,
      manga_processed: mangaProcessed,
      total_processed: animeProcessed + mangaProcessed,
      message: `Successfully populated database with ${animeProcessed} anime and ${mangaProcessed} manga`
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