import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

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
    console.log('Testing direct data insertion...');
    
    // Test with a simple anime entry
    const testAnime = {
      mal_id: 1,
      title: 'Cowboy Bebop',
      title_english: 'Cowboy Bebop',
      synopsis: 'In the year 2071, humanity has colonized several of the planets and moons of the solar system...',
      type: 'TV',
      episodes: 26,
      status: 'Finished Airing',
      score: 8.78,
      scored_by: 500000,
      rank: 28,
      popularity: 43,
      members: 1500000,
      favorites: 61000,
      genres: ['Action', 'Space', 'Drama'],
      image_url: 'https://cdn.myanimelist.net/images/anime/4/19644.jpg'
    };

    // Try to insert directly
    const { data, error } = await supabase
      .from('anime')
      .upsert(testAnime, { onConflict: 'mal_id' })
      .select();

    if (error) {
      console.error('Insert error:', error);
      return new Response(JSON.stringify({ 
        success: false, 
        error: error.message,
        details: error 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      });
    }

    console.log('Successfully inserted test anime:', data);

    // Also test manga
    const testManga = {
      mal_id: 1,
      title: 'Monster',
      title_english: 'Monster',
      synopsis: 'Dr. Kenzo Tenma is a renowned Japanese neurosurgeon...',
      type: 'Manga',
      chapters: 162,
      volumes: 18,
      status: 'Finished',
      score: 9.1,
      scored_by: 120000,
      rank: 5,
      popularity: 50,
      members: 200000,
      favorites: 25000,
      genres: ['Drama', 'Mystery', 'Psychological'],
      authors: ['Naoki Urasawa']
    };

    const { data: mangaData, error: mangaError } = await supabase
      .from('manga')
      .upsert(testManga, { onConflict: 'mal_id' })
      .select();

    if (mangaError) {
      console.error('Manga insert error:', mangaError);
    }

    return new Response(JSON.stringify({
      success: true,
      message: 'Direct insert test completed',
      anime_inserted: data?.length || 0,
      manga_inserted: mangaData?.length || 0,
      anime_data: data,
      manga_data: mangaData
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Test error:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    });
  }
});