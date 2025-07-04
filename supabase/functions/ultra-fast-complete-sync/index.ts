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
    console.log('STARTING ULTRA-FAST COMPLETE LIBRARY SYNC - ALL SOURCES');
    
    const startTime = Date.now();
    let totalProcessed = 0;

    // Log sync start
    const { data: logEntry } = await supabase
      .from('content_sync_status')
      .insert({
        operation_type: 'ultra_fast_complete_sync',
        content_type: 'both',
        status: 'running',
        total_items: 100000, // Estimated total
        processed_items: 0
      })
      .select()
      .single();

    // PHASE 1: AniList GraphQL API - Get EVERYTHING
    console.log('PHASE 1: AniList Complete Sync...');
    
    const anilistQuery = `
      query ($page: Int, $type: MediaType) {
        Page(page: $page, perPage: 50) {
          pageInfo {
            hasNextPage
            currentPage
            lastPage
          }
          media(type: $type, sort: ID) {
            id
            idMal
            title {
              romaji
              english
              native
            }
            description(asHtml: false)
            type
            format
            status
            episodes
            chapters
            volumes
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
            season
            seasonYear
            averageScore
            favourites
            popularity
            trending
            coverImage {
              extraLarge
              large
              medium
            }
            bannerImage
            genres
            tags {
              name
              rank
            }
            studios(isMain: true) {
              nodes {
                name
              }
            }
            staff(sort: RELEVANCE, perPage: 10) {
              nodes {
                name {
                  full
                }
                primaryOccupations
              }
            }
            characters(sort: ROLE, perPage: 10) {
              nodes {
                name {
                  full
                }
              }
            }
            trailer {
              id
              site
            }
            externalLinks {
              url
              site
            }
            nextAiringEpisode {
              airingAt
              episode
            }
          }
        }
      }
    `;

    // Fetch Anime from AniList
    let animeHasNextPage = true;
    let animePage = 1;
    
    while (animeHasNextPage && animePage <= 500) { // Reasonable limit
      try {
        console.log(`Fetching AniList Anime page ${animePage}...`);
        
        const response = await fetch('https://graphql.anilist.co', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            query: anilistQuery,
            variables: {
              page: animePage,
              type: 'ANIME'
            }
          })
        });

        if (!response.ok) {
          if (response.status === 429) {
            console.log('Rate limited, waiting 60 seconds...');
            await new Promise(resolve => setTimeout(resolve, 60000));
            continue;
          }
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        
        if (data.errors) {
          console.error('GraphQL errors:', data.errors);
          break;
        }

        const pageData = data.data?.Page;
        if (!pageData || !pageData.media || pageData.media.length === 0) {
          console.log(`No more anime at page ${animePage}, reached end`);
          break;
        }

        animeHasNextPage = pageData.pageInfo.hasNextPage;
        
        // Process and batch insert
        const processedItems = pageData.media.map((item: any) => ({
          anilist_id: item.id,
          mal_id: item.idMal,
          title: item.title?.romaji || item.title?.english || 'Unknown Title',
          title_english: item.title?.english,
          title_japanese: item.title?.native,
          synopsis: item.description?.substring(0, 2000),
          type: item.format || item.type,
          episodes: item.episodes,
          status: item.status,
          aired_from: item.startDate ? `${item.startDate.year}-${String(item.startDate.month || 1).padStart(2, '0')}-${String(item.startDate.day || 1).padStart(2, '0')}` : null,
          aired_to: item.endDate ? `${item.endDate.year}-${String(item.endDate.month || 1).padStart(2, '0')}-${String(item.endDate.day || 1).padStart(2, '0')}` : null,
          season: item.season,
          year: item.seasonYear || item.startDate?.year,
          anilist_score: item.averageScore,
          popularity: item.popularity,
          favorites: item.favourites,
          cover_image_extra_large: item.coverImage?.extraLarge,
          cover_image_large: item.coverImage?.large,
          image_url: item.coverImage?.large || item.coverImage?.medium,
          banner_image: item.bannerImage,
          trailer_site: item.trailer?.site,
          trailer_id: item.trailer?.id,
          genres: item.genres || [],
          detailed_tags: item.tags || [],
          studios: item.studios?.nodes?.map((s: any) => s.name) || [],
          studios_data: item.studios?.nodes || [],
          staff_data: item.staff?.nodes || [],
          characters_data: item.characters?.nodes || [],
          external_links: item.externalLinks || [],
          next_episode_date: item.nextAiringEpisode ? new Date(item.nextAiringEpisode.airingAt * 1000).toISOString() : null,
          next_episode_number: item.nextAiringEpisode?.episode,
          last_sync_check: new Date().toISOString()
        }));

        const { error } = await supabase
          .from('anime')
          .upsert(processedItems, { 
            onConflict: 'anilist_id',
            ignoreDuplicates: false 
          });

        if (error) {
          console.error('Batch anime insert error:', error);
        } else {
          totalProcessed += pageData.media.length;
          console.log(`Processed ${totalProcessed} anime items so far...`);
        }

        animePage++;
        
        // Rate limiting - AniList allows ~90 requests per minute
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (error) {
        console.error(`Error on anime page ${animePage}:`, error);
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }

    // PHASE 2: Fetch Manga from AniList
    console.log('PHASE 2: AniList Manga Complete Sync...');
    
    let mangaHasNextPage = true;
    let mangaPage = 1;
    
    while (mangaHasNextPage && mangaPage <= 800) { // Higher limit for manga
      try {
        console.log(`Fetching AniList Manga page ${mangaPage}...`);
        
        const response = await fetch('https://graphql.anilist.co', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            query: anilistQuery,
            variables: {
              page: mangaPage,
              type: 'MANGA'
            }
          })
        });

        if (!response.ok) {
          if (response.status === 429) {
            console.log('Rate limited, waiting 60 seconds...');
            await new Promise(resolve => setTimeout(resolve, 60000));
            continue;
          }
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        
        if (data.errors) {
          console.error('GraphQL errors:', data.errors);
          break;
        }

        const pageData = data.data?.Page;
        if (!pageData || !pageData.media || pageData.media.length === 0) {
          console.log(`No more manga at page ${mangaPage}, reached end`);
          break;
        }

        mangaHasNextPage = pageData.pageInfo.hasNextPage;
        
        const processedItems = pageData.media.map((item: any) => ({
          anilist_id: item.id,
          mal_id: item.idMal,
          title: item.title?.romaji || item.title?.english || 'Unknown Title',
          title_english: item.title?.english,
          title_japanese: item.title?.native,
          synopsis: item.description?.substring(0, 2000),
          type: item.format || item.type,
          chapters: item.chapters,
          volumes: item.volumes,
          status: item.status,
          published_from: item.startDate ? `${item.startDate.year}-${String(item.startDate.month || 1).padStart(2, '0')}-${String(item.startDate.day || 1).padStart(2, '0')}` : null,
          published_to: item.endDate ? `${item.endDate.year}-${String(item.endDate.month || 1).padStart(2, '0')}-${String(item.endDate.day || 1).padStart(2, '0')}` : null,
          anilist_score: item.averageScore,
          popularity: item.popularity,
          favorites: item.favourites,
          image_url: item.coverImage?.large || item.coverImage?.medium,
          genres: item.genres || [],
          authors: item.staff?.nodes?.filter((s: any) => s.primaryOccupations?.includes('Story & Art') || s.primaryOccupations?.includes('Story'))?.map((s: any) => s.name?.full) || [],
          last_sync_check: new Date().toISOString()
        }));

        const { error } = await supabase
          .from('manga')
          .upsert(processedItems, { 
            onConflict: 'anilist_id',
            ignoreDuplicates: false 
          });

        if (error) {
          console.error('Batch manga insert error:', error);
        } else {
          totalProcessed += pageData.media.length;
          console.log(`Processed ${totalProcessed} total items so far...`);
        }

        mangaPage++;
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (error) {
        console.error(`Error on manga page ${mangaPage}:`, error);
        await new Promise(resolve => setTimeout(resolve, 5000));
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
        processed_items: totalProcessed
      })
      .eq('id', logEntry.id);

    console.log(`ULTRA-FAST COMPLETE SYNC FINISHED: ${totalProcessed} items in ${duration}s`);

    // Get final counts
    const { data: animeCount } = await supabase
      .from('anime')
      .select('*', { count: 'exact', head: true });

    const { data: mangaCount } = await supabase
      .from('manga')
      .select('*', { count: 'exact', head: true });

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Ultra-fast complete library sync completed!',
        processed: totalProcessed,
        duration: duration,
        final_counts: {
          anime: animeCount,
          manga: mangaCount
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Ultra-fast sync error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});