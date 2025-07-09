import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AniListResponse {
  data?: {
    Page?: {
      pageInfo?: {
        hasNextPage?: boolean;
        currentPage?: number;
      };
      media?: any[];
    };
  };
  errors?: any[];
}

async function fetchMangaData(page: number = 1): Promise<AniListResponse> {
  const query = `
    query ($page: Int, $perPage: Int) {
      Page(page: $page, perPage: $perPage) {
        pageInfo {
          hasNextPage
          currentPage
        }
        media(type: MANGA, sort: [POPULARITY_DESC, SCORE_DESC]) {
          id
          title {
            romaji
            english
            native
          }
          description
          startDate {
            year
            month
            day
          }
          endDate {
            year
            month
            day
          }
          format
          status
          chapters
          volumes
          coverImage {
            large
            medium
            color
          }
          genres
          averageScore
          popularity
          favourites
          staff {
            nodes {
              name {
                full
              }
            }
          }
        }
      }
    }
  `;

  const variables = {
    page,
    perPage: 25 // Reduced to 25 per page for rate limiting
  };

  const response = await fetch('https://graphql.anilist.co', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({ query, variables })
  });

  if (!response.ok) {
    throw new Error(`AniList API error: ${response.status}`);
  }

  return await response.json();
}

async function processMangaItem(supabase: any, item: any) {
  const startTime = item.startDate;
  const endTime = item.endDate;
  const publishedFrom = (startTime?.year && startTime?.month && startTime?.day) 
    ? `${startTime.year}-${String(startTime.month).padStart(2, '0')}-${String(startTime.day).padStart(2, '0')}`
    : null;
  const publishedTo = (endTime?.year && endTime?.month && endTime?.day)
    ? `${endTime.year}-${String(endTime.month).padStart(2, '0')}-${String(endTime.day).padStart(2, '0')}`
    : null;

  // Insert/update title
  const { data: titleData, error: titleError } = await supabase
    .from('titles')
    .upsert({
      anilist_id: item.id,
      title: item.title?.romaji || item.title?.english || 'Unknown',
      title_english: item.title?.english,
      title_japanese: item.title?.native,
      synopsis: item.description,
      image_url: item.coverImage?.large,
      color_theme: item.coverImage?.color,
      year: startTime?.year,
      score: item.averageScore ? item.averageScore / 10 : null,
      anilist_score: item.averageScore,
      popularity: item.popularity,
      favorites: item.favourites
    }, { onConflict: 'anilist_id' })
    .select('id')
    .single();

  if (titleError || !titleData) {
    throw new Error(`Failed to insert title: ${titleError?.message}`);
  }

  // Insert/update manga details
  const { error: detailError } = await supabase
    .from('manga_details')
    .upsert({
      title_id: titleData.id,
      chapters: item.chapters,
      volumes: item.volumes,
      published_from: publishedFrom,
      published_to: publishedTo,
      status: item.status || 'Finished',
      type: item.format || 'Manga'
    }, { onConflict: 'title_id' });

  if (detailError) {
    throw new Error(`Failed to insert manga details: ${detailError.message}`);
  }

  // Process genres
  if (item.genres?.length) {
    for (const genreName of item.genres) {
      const { data: genreData, error: genreError } = await supabase
        .from('genres')
        .upsert({ name: genreName, type: 'manga' }, { onConflict: 'name' })
        .select('id')
        .single();

      if (genreData && !genreError) {
        await supabase
          .from('title_genres')
          .upsert({ title_id: titleData.id, genre_id: genreData.id }, { onConflict: 'title_id,genre_id' });
      }
    }
  }

  // Process authors
  if (item.staff?.nodes?.length) {
    for (const staff of item.staff.nodes) {
      if (staff.name?.full) {
        const { data: authorData, error: authorError } = await supabase
          .from('authors')
          .upsert({ name: staff.name.full }, { onConflict: 'name' })
          .select('id')
          .single();

        if (authorData && !authorError) {
          await supabase
            .from('title_authors')
            .upsert({ title_id: titleData.id, author_id: authorData.id }, { onConflict: 'title_id,author_id' });
        }
      }
    }
  }

  return { success: true, titleId: titleData.id };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  let newSyncStatus: any = null;
  
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    console.log('📚 Starting dedicated manga sync...');
    
    // Get the last processed page from content_sync_status
    const { data: syncStatus } = await supabase
      .from('content_sync_status')
      .select('*')
      .eq('operation_type', 'manga_progressive_sync')
      .eq('content_type', 'manga')
      .order('started_at', { ascending: false })
      .limit(1)
      .single();

    let startPage = 1;
    if (syncStatus?.current_page) {
      startPage = syncStatus.current_page + 1;
    }

    console.log(`📄 Starting from page ${startPage}...`);
    
    const pagesPerSync = 5; // Process 5 pages per sync (125 items)
    let totalProcessed = 0;
    let errors: string[] = [];
    let hasMorePages = true;
    let currentPage = startPage;

    // Create new sync status entry
    const { data: syncStatusData } = await supabase
      .from('content_sync_status')
      .insert({
        operation_type: 'manga_progressive_sync',
        content_type: 'manga',
        status: 'running',
        current_page: startPage,
        started_at: new Date().toISOString()
      })
      .select('id')
      .single();
    
    newSyncStatus = syncStatusData;

    for (let i = 0; i < pagesPerSync && hasMorePages; i++) {
      try {
        console.log(`📄 Processing manga page ${currentPage}...`);
        
        const response = await fetchMangaData(currentPage);
        
        // Check if we've reached the end
        if (!response.data?.Page?.media?.length || !response.data?.Page?.pageInfo?.hasNextPage) {
          console.log(`⚠️ No more manga data found, resetting to page 1`);
          hasMorePages = false;
          
          // Reset to page 1 for next sync
          if (newSyncStatus?.id) {
            await supabase
              .from('content_sync_status')
              .update({ current_page: 1 })
              .eq('id', newSyncStatus.id);
          }
          
          if (!response.data?.Page?.media?.length) {
            break;
          }
        }

        const items = response.data.Page.media;
        console.log(`📊 Found ${items.length} manga items on page ${currentPage}`);

        for (const item of items) {
          if (!item.id || (!item.title?.romaji && !item.title?.english)) {
            continue;
          }

          try {
            await processMangaItem(supabase, item);
            totalProcessed++;
          } catch (error) {
            console.error(`❌ Failed to process manga ${item.id}:`, error);
            errors.push(`Manga ${item.id}: ${error.message}`);
          }

          // Rate limiting - longer delay between items
          await new Promise(resolve => setTimeout(resolve, 200));
        }

        // Update current page in sync status
        if (newSyncStatus?.id) {
          await supabase
            .from('content_sync_status')
            .update({ current_page: currentPage })
            .eq('id', newSyncStatus.id);
        }

        currentPage++;
        
        // Longer delay between pages for rate limiting
        await new Promise(resolve => setTimeout(resolve, 2000));
        
      } catch (error) {
        console.error(`❌ Error processing manga page ${currentPage}:`, error);
        errors.push(`Page ${currentPage}: ${error.message}`);
        currentPage++;
      }
    }

    // Mark sync as completed
    if (newSyncStatus?.id) {
      await supabase
        .from('content_sync_status')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          processed_items: totalProcessed,
          error_message: errors.length > 0 ? errors.join('; ') : null
        })
        .eq('id', newSyncStatus.id);
    }

    console.log(`✅ Dedicated manga sync completed: ${totalProcessed} items processed`);

    return new Response(JSON.stringify({
      success: true,
      contentType: 'manga',
      totalProcessed,
      errors: errors.slice(0, 5),
      message: `Successfully synced ${totalProcessed} manga items (pages ${startPage}-${currentPage-1})`,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ Dedicated manga sync error:', error);
    
    // Mark sync as failed if we created a sync status entry
    if (newSyncStatus?.id) {
      try {
        const supabase = createClient(
          Deno.env.get('SUPABASE_URL')!,
          Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
        );
        
        await supabase
          .from('content_sync_status')
          .update({
            status: 'failed',
            completed_at: new Date().toISOString(),
            error_message: error.message
          })
          .eq('id', newSyncStatus.id);
      } catch (updateError) {
        console.error('Failed to update sync status:', updateError);
      }
    }
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      contentType: 'manga',
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});