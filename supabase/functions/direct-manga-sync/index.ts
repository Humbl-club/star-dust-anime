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

// Fetch manga from AniList
async function fetchMangaFromAniList(page = 1, perPage = 50) {
  const query = `
    query ($page: Int, $perPage: Int) {
      Page(page: $page, perPage: $perPage) {
        media(type: MANGA, sort: POPULARITY_DESC) {
          id
          title {
            romaji
            english
            native
          }
          description
          chapters
          volumes
          status
          startDate { year month day }
          endDate { year month day }
          genres
          averageScore
          popularity
          favourites
          coverImage {
            extraLarge
            large
          }
        }
      }
    }
  `;

  const response = await fetch('https://graphql.anilist.co', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query,
      variables: { page, perPage }
    }),
  });

  const data = await response.json();
  return data.data.Page.media;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting DIRECT manga sync bypassing stuck system...');

    let totalProcessed = 0;
    
    // Sync 10 pages of manga directly
    for (let page = 1; page <= 10; page++) {
      console.log(`Processing manga page ${page}...`);
      
      try {
        const mangaList = await fetchMangaFromAniList(page, 50);
        
        for (const manga of mangaList) {
          try {
            const processedItem = {
              anilist_id: manga.id,
              title: manga.title.romaji,
              title_english: manga.title.english || null,
              title_japanese: manga.title.native || null,
              synopsis: manga.description?.replace(/<[^>]*>/g, '') || null,
              chapters: manga.chapters || null,
              volumes: manga.volumes || null,
              status: manga.status || 'Unknown',
              published_from: manga.startDate ? 
                `${manga.startDate.year || 2000}-${String(manga.startDate.month || 1).padStart(2, '0')}-${String(manga.startDate.day || 1).padStart(2, '0')}` : null,
              published_to: manga.endDate ? 
                `${manga.endDate.year || 2025}-${String(manga.endDate.month || 12).padStart(2, '0')}-${String(manga.endDate.day || 31).padStart(2, '0')}` : null,
              score: manga.averageScore ? manga.averageScore / 10 : null,
              popularity: manga.popularity || null,
              favorites: manga.favourites || null,
              genres: manga.genres || [],
              image_url: manga.coverImage?.extraLarge || manga.coverImage?.large || null,
              type: 'Manga',
              last_sync_check: new Date().toISOString(),
            };

            const { error } = await supabase
              .from('manga')
              .upsert(processedItem, { 
                onConflict: 'anilist_id',
                ignoreDuplicates: false 
              });

            if (!error) {
              totalProcessed++;
            } else {
              console.error(`Error inserting manga ${manga.id}:`, error);
            }
          } catch (itemError) {
            console.error(`Error processing manga ${manga.id}:`, itemError);
          }
        }

        console.log(`Page ${page} completed. Total processed: ${totalProcessed}`);
        
        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (pageError) {
        console.error(`Error fetching page ${page}:`, pageError);
      }
    }

    console.log(`Direct manga sync completed! Processed ${totalProcessed} manga`);

    return new Response(JSON.stringify({
      success: true,
      message: `Direct manga sync completed successfully`,
      totalProcessed,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Direct manga sync error:', error);

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