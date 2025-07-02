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

interface JikanManga {
  mal_id: number;
  title: string;
  title_english?: string;
  title_japanese?: string;
  type: string;
  status: string;
  chapters?: number;
  volumes?: number;
  published: {
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
  genres: Array<{ name: string }>;
  authors: Array<{ name: string }>;
  serializations: Array<{ name: string }>;
  themes: Array<{ name: string }>;
  demographics: Array<{ name: string }>;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, page = 1, limit = 25 } = await req.json();
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase configuration missing');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log(`Fetching ${type} data from Jikan API - Page ${page}`);

    // Fetch data from Jikan API
    const jikanUrl = type === 'anime' 
      ? `https://api.jikan.moe/v4/anime?page=${page}&limit=${limit}&order_by=score&sort=desc`
      : `https://api.jikan.moe/v4/manga?page=${page}&limit=${limit}&order_by=score&sort=desc`;

    const response = await fetch(jikanUrl);
    
    if (!response.ok) {
      throw new Error(`Jikan API error: ${response.status}`);
    }

    const data = await response.json();
    const items = data.data;

    console.log(`Retrieved ${items.length} ${type} items from Jikan API`);

    // Process and store data
    const processedItems = [];
    
    for (const item of items) {
      if (type === 'anime') {
        const anime = item as JikanAnime;
        
        // Check if anime already exists
        const { data: existing } = await supabase
          .from('anime')
          .select('id')
          .eq('mal_id', anime.mal_id)
          .single();

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

          const { data: inserted, error } = await supabase
            .from('anime')
            .insert(animeData)
            .select()
            .single();

          if (error) {
            console.error('Error inserting anime:', error);
          } else {
            processedItems.push(inserted);
          }
        }
      } else {
        const manga = item as JikanManga;
        
        // Check if manga already exists
        const { data: existing } = await supabase
          .from('manga')
          .select('id')
          .eq('mal_id', manga.mal_id)
          .single();

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
            published_from: manga.published.from ? new Date(manga.published.from).toISOString().split('T')[0] : null,
            published_to: manga.published.to ? new Date(manga.published.to).toISOString().split('T')[0] : null,
            score: manga.score || null,
            scored_by: manga.scored_by || null,
            rank: manga.rank || null,
            popularity: manga.popularity || null,
            members: manga.members || null,
            favorites: manga.favorites || null,
            synopsis: manga.synopsis || null,
            image_url: manga.images.jpg.large_image_url || manga.images.jpg.image_url,
            genres: manga.genres.map(g => g.name),
            authors: manga.authors.map(a => a.name),
            serializations: manga.serializations.map(s => s.name),
            themes: manga.themes.map(t => t.name),
            demographics: manga.demographics.map(d => d.name)
          };

          const { data: inserted, error } = await supabase
            .from('manga')
            .insert(mangaData)
            .select()
            .single();

          if (error) {
            console.error('Error inserting manga:', error);
          } else {
            processedItems.push(inserted);
          }
        }
      }

      // Rate limiting - Jikan API allows 3 requests per second
      await new Promise(resolve => setTimeout(resolve, 350));
    }

    return new Response(JSON.stringify({
      success: true,
      processed: processedItems.length,
      total_fetched: items.length,
      page,
      has_next_page: data.pagination?.has_next_page || false
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in fetch-anime-data function:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});