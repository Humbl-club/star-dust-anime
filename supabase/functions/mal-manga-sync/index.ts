import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fetchMangaFromMAL(page = 1) {
  try {
    console.log(`Fetching manga page ${page} from MyAnimeList...`);
    
    const response = await fetch(`https://api.jikan.moe/v4/manga?page=${page}&limit=25&order_by=popularity`, {
      headers: {
        'User-Agent': 'AnimeApp/1.0'
      }
    });

    if (!response.ok) {
      throw new Error(`MAL API error: ${response.status}`);
    }

    const data = await response.json();
    return data.data || [];
  } catch (error) {
    console.error(`Error fetching MAL page ${page}:`, error);
    return [];
  }
}

function processMangaData(malManga: any[]) {
  return malManga.map(manga => ({
    mal_id: manga.mal_id,
    title: manga.title,
    title_english: manga.title_english || null,
    title_japanese: manga.title_japanese || null,
    synopsis: manga.synopsis || null,
    type: manga.type || 'Manga',
    chapters: manga.chapters || null,
    volumes: manga.volumes || null,
    status: manga.status || 'Unknown',
    published_from: manga.published?.from ? manga.published.from.split('T')[0] : null,
    published_to: manga.published?.to ? manga.published.to.split('T')[0] : null,
    score: manga.score || null,
    scored_by: manga.scored_by || null,
    rank: manga.rank || null,
    popularity: manga.popularity || null,
    members: manga.members || null,
    favorites: manga.favorites || null,
    genres: manga.genres?.map((g: any) => g.name) || [],
    authors: manga.authors?.map((a: any) => a.name) || [],
    serializations: manga.serializations?.map((s: any) => s.name) || [],
    themes: manga.themes?.map((t: any) => t.name) || [],
    demographics: manga.demographics?.map((d: any) => d.name) || [],
    image_url: manga.images?.jpg?.large_image_url || manga.images?.jpg?.image_url || null,
    last_sync_check: new Date().toISOString(),
  }));
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting MyAnimeList manga sync...');

    let totalProcessed = 0;
    let totalErrors = 0;
    
    // Fetch 20 pages from MAL (500 manga total)
    for (let page = 1; page <= 20; page++) {
      try {
        const malMangaList = await fetchMangaFromMAL(page);
        
        if (malMangaList.length === 0) {
          console.log(`No more manga found at page ${page}, stopping...`);
          break;
        }

        const processedManga = processMangaData(malMangaList);
        console.log(`Processing ${processedManga.length} manga from page ${page}...`);

        // Insert in batches of 10
        for (let i = 0; i < processedManga.length; i += 10) {
          const batch = processedManga.slice(i, i + 10);
          
          try {
            const { error } = await supabase
              .from('manga')
              .upsert(batch, { 
                onConflict: 'mal_id',
                ignoreDuplicates: false 
              });

            if (error) {
              console.error(`Batch insert error:`, error);
              totalErrors++;
            } else {
              totalProcessed += batch.length;
              console.log(`✅ Processed ${totalProcessed} manga so far`);
            }
          } catch (batchError) {
            console.error(`Batch processing error:`, batchError);
            totalErrors++;
          }
        }

        // Rate limiting - wait 1 second between requests
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (pageError) {
        console.error(`Error processing page ${page}:`, pageError);
        totalErrors++;
      }
    }

    console.log(`✅ MAL manga sync completed! Processed: ${totalProcessed}, Errors: ${totalErrors}`);

    return new Response(JSON.stringify({
      success: true,
      message: `MyAnimeList manga sync completed successfully`,
      totalProcessed,
      totalErrors,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('MAL manga sync error:', error);

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