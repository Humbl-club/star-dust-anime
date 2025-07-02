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

// AniList GraphQL query for ALL manga
const MANGA_QUERY = `
  query ($page: Int, $perPage: Int) {
    Page(page: $page, perPage: $perPage) {
      pageInfo {
        total
        currentPage
        lastPage
        hasNextPage
        perPage
      }
      media(type: MANGA, sort: [POPULARITY_DESC]) {
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
          medium
        }
        bannerImage
        staff {
          edges {
            role
            node {
              name {
                full
              }
            }
          }
        }
        tags {
          name
          rank
        }
      }
    }
  }
`;

async function fetchAllMangaFromAniList() {
  const allManga = [];
  let page = 1;
  let hasNextPage = true;
  
  while (hasNextPage && page <= 1000) { // Safety limit
    console.log(`Fetching manga page ${page}...`);
    
    try {
      const response = await fetch('https://graphql.anilist.co', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: MANGA_QUERY,
          variables: { page, perPage: 50 }
        }),
      });

      const data = await response.json();
      
      if (data.errors) {
        console.error('AniList GraphQL error:', data.errors);
        break;
      }

      const pageInfo = data.data.Page.pageInfo;
      const mangaList = data.data.Page.media;
      
      console.log(`Page ${page}/${pageInfo.lastPage} - Got ${mangaList.length} manga`);
      
      for (const manga of mangaList) {
        allManga.push({
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
          authors: manga.staff?.edges?.filter(edge => edge.role === 'Story & Art' || edge.role === 'Story').map(edge => edge.node.name.full) || [],
          themes: manga.tags?.filter(tag => tag.rank >= 60).map(tag => tag.name) || [],
          image_url: manga.coverImage?.extraLarge || manga.coverImage?.large || manga.coverImage?.medium || null,
          type: 'Manga',
          last_sync_check: new Date().toISOString(),
        });
      }

      hasNextPage = pageInfo.hasNextPage;
      page++;
      
      // Rate limiting - AniList allows ~90 requests per minute
      await new Promise(resolve => setTimeout(resolve, 700));
      
    } catch (error) {
      console.error(`Error fetching page ${page}:`, error);
      break;
    }
  }
  
  return allManga;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting COMPLETE manga sync - fetching ALL titles from AniList...');
    
    const allManga = await fetchAllMangaFromAniList();
    console.log(`Fetched ${allManga.length} total manga from AniList`);

    let processed = 0;
    let errors = 0;

    // Insert in batches of 100
    for (let i = 0; i < allManga.length; i += 100) {
      const batch = allManga.slice(i, i + 100);
      
      try {
        const { error } = await supabase
          .from('manga')
          .upsert(batch, { 
            onConflict: 'anilist_id',
            ignoreDuplicates: false 
          });

        if (error) {
          console.error(`Batch ${Math.floor(i/100) + 1} error:`, error);
          errors++;
        } else {
          processed += batch.length;
          console.log(`Processed ${processed}/${allManga.length} manga`);
        }
      } catch (batchError) {
        console.error(`Batch ${Math.floor(i/100) + 1} failed:`, batchError);
        errors++;
      }
    }

    console.log(`Complete manga sync finished! Processed: ${processed}, Errors: ${errors}`);

    return new Response(JSON.stringify({
      success: true,
      message: `Complete manga library sync completed`,
      totalFetched: allManga.length,
      totalProcessed: processed,
      errors: errors,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Complete manga sync error:', error);

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