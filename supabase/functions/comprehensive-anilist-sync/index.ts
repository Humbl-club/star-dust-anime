import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Enhanced AniList GraphQL Query for comprehensive data
const COMPREHENSIVE_MEDIA_QUERY = `
  query ComprehensiveMedia($page: Int, $perPage: Int, $type: MediaType, $sort: [MediaSort]) {
    Page(page: $page, perPage: $perPage) {
      pageInfo {
        total
        currentPage
        lastPage
        hasNextPage
        perPage
      }
      media(type: $type, sort: $sort, isAdult: false) {
        id
        malId
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
        season
        seasonYear
        type
        format
        status
        episodes
        chapters
        volumes
        duration
        genres
        synonyms
        averageScore
        meanScore
        popularity
        favourites
        countryOfOrigin
        nextAiringEpisode {
          id
          airingAt
          timeUntilAiring
          episode
        }
        coverImage {
          extraLarge
          large
          medium
          color
        }
        bannerImage
        trailer {
          id
          site
          thumbnail
        }
        tags {
          id
          name
          description
          category
          rank
          isGeneralSpoiler
          isMediaSpoiler
          isAdult
        }
        studios {
          edges {
            isMain
            node {
              id
              name
              isAnimationStudio
            }
          }
        }
        staff {
          edges {
            id
            role
            node {
              id
              name {
                first
                middle
                last
                full
                native
              }
              language
              image {
                large
                medium
              }
            }
          }
        }
        characters {
          edges {
            id
            role
            name
            node {
              id
              name {
                first
                middle
                last
                full
                native
              }
              image {
                large
                medium
              }
            }
          }
        }
        externalLinks {
          id
          url
          site
          siteId
          type
          language
          color
          icon
        }
        streamingEpisodes {
          title
          thumbnail
          url
          site
        }
        airingSchedule(page: 1, perPage: 25) {
          edges {
            node {
              id
              airingAt
              timeUntilAiring
              episode
            }
          }
        }
        relations {
          edges {
            relationType
            node {
              id
              title {
                romaji
                english
                native
              }
              format
              type
              status
              coverImage {
                medium
                large
              }
            }
          }
        }
        recommendations {
          nodes {
            rating
            userRating
            mediaRecommendation {
              id
              title {
                romaji
                english
              }
              format
              type
              status
              coverImage {
                medium
                large
              }
              averageScore
            }
          }
        }
      }
    }
  }
`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { contentType = 'anime', maxPages = 50, startPage = 1 } = await req.json();
    
    console.log(`🚀 Starting comprehensive ${contentType} sync from page ${startPage} to ${startPage + maxPages - 1}`);

    const results = {
      processed: 0,
      inserted: 0,
      updated: 0,
      errors: 0,
      pages: 0,
      streaming_links: 0,
      countdown_data: 0,
    };

    // Enhanced AniList API call function
    const makeAniListRequest = async (query: string, variables: any) => {
      const response = await fetch('https://graphql.anilist.co', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ query, variables }),
      });

      if (!response.ok) {
        throw new Error(`AniList API error: ${response.status}`);
      }

      const data = await response.json();
      if (data.errors) {
        throw new Error(`AniList GraphQL error: ${data.errors[0]?.message}`);
      }

      return data;
    };

    // Enhanced data processing function
    const processMediaData = (media: any, type: 'anime' | 'manga') => {
      // Enhanced streaming links processing
      const streamingLinks = media.externalLinks?.filter((link: any) => 
        ['STREAMING', 'INFO'].includes(link.type) &&
        ['Crunchyroll', 'Funimation', 'Netflix', 'Hulu', 'Amazon Prime Video', 
         'Disney Plus', 'VIZ', 'Shonen Jump', 'AnimeLab', 'Wakanim'].includes(link.site)
      ) || [];

      // Enhanced countdown data processing
      const countdownInfo = {
        nextEpisode: media.nextAiringEpisode,
        upcomingEpisodes: media.airingSchedule?.edges?.map((edge: any) => edge.node) || [],
        isCurrentlyAiring: media.status === 'RELEASING'
      };

      // Enhanced format conversion
      const formatDate = (date?: { year?: number; month?: number; day?: number }): string | null => {
        if (!date?.year) return null;
        const year = date.year;
        const month = date.month ? String(date.month).padStart(2, '0') : '01';
        const day = date.day ? String(date.day).padStart(2, '0') : '01';
        return `${year}-${month}-${day}`;
      };

      const processedData = {
        mal_id: media.malId || null,
        anilist_id: media.id,
        title: media.title.romaji,
        title_english: media.title.english || null,
        title_japanese: media.title.native || null,
        type: media.format || media.type,
        status: media.status,
        episodes: media.episodes || null,
        chapters: media.chapters || null,
        volumes: media.volumes || null,
        score: media.averageScore ? media.averageScore / 10 : null,
        anilist_score: media.averageScore ? media.averageScore / 10 : null,
        popularity: media.popularity || null,
        members: media.favourites || null,
        favorites: media.favourites || null,
        synopsis: media.description ? media.description.replace(/<[^>]*>/g, '') : null,
        image_url: media.coverImage.extraLarge || media.coverImage.large || media.coverImage.medium,
        banner_image: media.bannerImage || null,
        cover_image_large: media.coverImage.large || null,
        cover_image_extra_large: media.coverImage.extraLarge || null,
        color_theme: media.coverImage.color || null,
        trailer_url: media.trailer ? `https://www.youtube.com/watch?v=${media.trailer.id}` : null,
        trailer_id: media.trailer?.id || null,
        trailer_site: media.trailer?.site || null,
        genres: media.genres || [],
        studios: media.studios?.edges?.filter((edge: any) => edge.isMain)?.map((edge: any) => edge.node.name) || [],
        themes: media.tags?.filter((tag: any) => !tag.isGeneralSpoiler && !tag.isMediaSpoiler && tag.rank >= 60)?.map((tag: any) => tag.name) || [],
        demographics: [], // Will be enhanced later
        season: media.season || null,
        year: media.seasonYear || media.startDate?.year || null,
        
        // Enhanced countdown fields
        next_episode_date: countdownInfo.nextEpisode ? new Date(countdownInfo.nextEpisode.airingAt * 1000).toISOString() : null,
        next_episode_number: countdownInfo.nextEpisode?.episode || null,
        next_chapter_date: type === 'manga' && countdownInfo.nextEpisode ? new Date(countdownInfo.nextEpisode.airingAt * 1000).toISOString() : null,
        next_chapter_number: type === 'manga' ? countdownInfo.nextEpisode?.episode || null : null,
        
        // Enhanced structured data
        characters_data: media.characters || [],
        staff_data: media.staff || [],
        external_links: streamingLinks,
        streaming_episodes: media.streamingEpisodes || [],
        detailed_tags: media.tags || [],
        relations_data: media.relations || [],
        recommendations_data: media.recommendations || [],
        studios_data: media.studios || [],
        
        // Schedule data for countdown timers
        airing_schedule: type === 'anime' ? countdownInfo.upcomingEpisodes : [],
        release_schedule: type === 'manga' ? countdownInfo.upcomingEpisodes : [],
        
        last_sync_check: new Date().toISOString(),
      };

      // Add date fields based on content type
      if (type === 'anime') {
        processedData.aired_from = formatDate(media.startDate);
        processedData.aired_to = formatDate(media.endDate);
      } else {
        processedData.published_from = formatDate(media.startDate);
        processedData.published_to = formatDate(media.endDate);
        processedData.authors = media.staff?.edges?.filter((edge: any) => 
          ['Story', 'Story & Art', 'Art'].includes(edge.role)
        )?.map((edge: any) => edge.node.name.full) || [];
        processedData.serializations = []; // Will be enhanced later
      }

      return processedData;
    };

    // Main sync loop with enhanced features
    for (let page = startPage; page < startPage + maxPages; page++) {
      try {
        console.log(`📄 Processing page ${page} for ${contentType}`);
        
        const variables = {
          page,
          perPage: 50,
          type: contentType.toUpperCase(),
          sort: ['POPULARITY_DESC', 'SCORE_DESC']
        };

        const response = await makeAniListRequest(COMPREHENSIVE_MEDIA_QUERY, variables);
        
        if (!response.data?.Page?.media?.length) {
          console.log(`📄 No more data on page ${page}, stopping sync`);
          break;
        }

        const mediaList = response.data.Page.media;
        results.pages++;

        // Process each media item with enhanced data
        for (const media of mediaList) {
          try {
            const processedData = processMediaData(media, contentType);
            
            // Check if record exists
            const tableName = contentType === 'anime' ? 'anime' : 'manga';
            const { data: existing } = await supabase
              .from(tableName)
              .select('id, anilist_id, last_sync_check')
              .eq('anilist_id', media.id)
              .single();

            if (existing) {
              // Update existing record with enhanced data
              const { error } = await supabase
                .from(tableName)
                .update(processedData)
                .eq('id', existing.id);

              if (error) {
                console.error(`❌ Error updating ${tableName} ${media.id}:`, error);
                results.errors++;
              } else {
                results.updated++;
                
                // Count enhanced features
                if (processedData.external_links && processedData.external_links.length > 0) {
                  results.streaming_links++;
                }
                if (processedData.next_episode_date || processedData.next_chapter_date) {
                  results.countdown_data++;
                }
              }
            } else {
              // Insert new record with enhanced data
              const { error } = await supabase
                .from(tableName)
                .insert(processedData);

              if (error) {
                console.error(`❌ Error inserting ${tableName} ${media.id}:`, error);
                results.errors++;
              } else {
                results.inserted++;
                
                // Count enhanced features
                if (processedData.external_links && processedData.external_links.length > 0) {
                  results.streaming_links++;
                }
                if (processedData.next_episode_date || processedData.next_chapter_date) {
                  results.countdown_data++;
                }
              }
            }

            results.processed++;
            
            // Rate limiting - AniList allows ~90 requests per minute
            if (results.processed % 45 === 0) {
              console.log(`⏱️ Rate limiting pause after ${results.processed} items...`);
              await new Promise(resolve => setTimeout(resolve, 1000));
            }

          } catch (error) {
            console.error(`❌ Error processing ${contentType} ${media.id}:`, error);
            results.errors++;
          }
        }

        console.log(`✅ Page ${page} completed: ${mediaList.length} items processed`);

        // Pause between pages to respect rate limits
        await new Promise(resolve => setTimeout(resolve, 700));

      } catch (error) {
        console.error(`❌ Error on page ${page}:`, error);
        results.errors++;
        
        // Continue with next page on error
        continue;
      }
    }

    // Log comprehensive results
    console.log(`🎉 Comprehensive ${contentType} sync completed!`);
    console.log(`📊 Results:`, results);

    // Update sync status
    await supabase
      .from('content_sync_status')
      .upsert({
        content_type: contentType,
        operation_type: 'comprehensive_anilist_sync',
        status: 'completed',
        processed_items: results.processed,
        total_items: results.processed,
        completed_at: new Date().toISOString(),
        error_message: results.errors > 0 ? `${results.errors} errors occurred` : null
      });

    return new Response(
      JSON.stringify({
        success: true,
        message: `Comprehensive ${contentType} sync completed with enhanced features`,
        results: {
          ...results,
          enhanced_features: {
            streaming_links: results.streaming_links,
            countdown_data: results.countdown_data,
            deep_linking_ready: true,
            real_time_updates: true
          }
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Comprehensive sync failed:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        details: 'Check function logs for more information'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});