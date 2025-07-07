import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Enhanced AniList GraphQL Query for normalized database structure
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
        genres
        averageScore
        meanScore
        popularity
        favourites
        coverImage {
          extraLarge
          large
          medium
          color
        }
        trailer {
          id
          site
          thumbnail
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
            }
          }
        }
        nextAiringEpisode {
          id
          airingAt
          timeUntilAiring
          episode
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

    const { contentType = 'anime', maxPages = 100, startFromId = null } = await req.json();
    
    console.log(`🚀 Starting comprehensive normalized ${contentType} sync - maxPages: ${maxPages}`);

    const results = {
      processed: 0,
      inserted: 0,
      updated: 0,
      errors: 0,
      pages: 0,
      genresCreated: 0,
      studiosCreated: 0,
      authorsCreated: 0,
      relationshipsCreated: 0
    };

    // Get current max anilist_id to avoid duplicates
    let startPage = 1;
    if (!startFromId) {
      const { data: maxRecord } = await supabase
        .from('titles')
        .select('anilist_id')
        .order('anilist_id', { ascending: false })
        .limit(1)
        .single();
      
      if (maxRecord?.anilist_id) {
        console.log(`📊 Current max anilist_id: ${maxRecord.anilist_id}`);
      }
    }

    // AniList API call function
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

    // Helper functions for relationship management
    const ensureGenre = async (genreName: string) => {
      const { data: existing } = await supabase
        .from('genres')
        .select('id')
        .eq('name', genreName)
        .single();

      if (existing) return existing.id;

      const { data: newGenre, error } = await supabase
        .from('genres')
        .insert({ name: genreName, type: contentType === 'anime' ? 'anime' : 'manga' })
        .select('id')
        .single();

      if (!error) {
        results.genresCreated++;
        return newGenre.id;
      }
      return null;
    };

    const ensureStudio = async (studioName: string) => {
      const { data: existing } = await supabase
        .from('studios')
        .select('id')
        .eq('name', studioName)
        .single();

      if (existing) return existing.id;

      const { data: newStudio, error } = await supabase
        .from('studios')
        .insert({ name: studioName })
        .select('id')
        .single();

      if (!error) {
        results.studiosCreated++;
        return newStudio.id;
      }
      return null;
    };

    const ensureAuthor = async (authorName: string) => {
      const { data: existing } = await supabase
        .from('authors')
        .select('id')
        .eq('name', authorName)
        .single();

      if (existing) return existing.id;

      const { data: newAuthor, error } = await supabase
        .from('authors')
        .insert({ name: authorName })
        .select('id')
        .single();

      if (!error) {
        results.authorsCreated++;
        return newAuthor.id;
      }
      return null;
    };

    // Process media data for normalized structure
    const processMediaData = async (media: any) => {
      // Format dates
      const formatDate = (date?: { year?: number; month?: number; day?: number }): string | null => {
        if (!date?.year) return null;
        const year = date.year;
        const month = date.month ? String(date.month).padStart(2, '0') : '01';
        const day = date.day ? String(date.day).padStart(2, '0') : '01';
        return `${year}-${month}-${day}`;
      };

      // Check if title already exists
      const { data: existingTitle } = await supabase
        .from('titles')
        .select('id')
        .eq('anilist_id', media.id)
        .single();

      if (existingTitle) {
        console.log(`⏩ Skipping existing title: ${media.title.romaji} (AniList ID: ${media.id})`);
        return false; // Skip existing
      }

      // Prepare title data
      const titleData = {
        anilist_id: media.id,
        title: media.title.romaji,
        title_english: media.title.english || null,
        title_japanese: media.title.native || null,
        synopsis: media.description ? media.description.replace(/<[^>]*>/g, '') : null,
        image_url: media.coverImage.extraLarge || media.coverImage.large || media.coverImage.medium,
        score: media.averageScore ? media.averageScore / 10 : null,
        anilist_score: media.averageScore ? media.averageScore / 10 : null,
        popularity: media.popularity || null,
        members: media.favourites || null,
        favorites: media.favourites || null,
        year: media.seasonYear || media.startDate?.year || null,
        color_theme: media.coverImage.color || null
      };

      // Insert title
      const { data: newTitle, error: titleError } = await supabase
        .from('titles')
        .insert(titleData)
        .select('id')
        .single();

      if (titleError) {
        console.error(`❌ Error inserting title ${media.id}:`, titleError);
        return false;
      }

      const titleId = newTitle.id;

      // Insert content-specific details
      if (contentType === 'anime') {
        const animeDetailData = {
          title_id: titleId,
          episodes: media.episodes || null,
          aired_from: formatDate(media.startDate),
          aired_to: formatDate(media.endDate),
          season: media.season || null,
          status: media.status || 'FINISHED',
          type: media.format || media.type || 'TV',
          trailer_url: media.trailer ? `https://www.youtube.com/watch?v=${media.trailer.id}` : null,
          trailer_id: media.trailer?.id || null,
          trailer_site: media.trailer?.site || null,
          next_episode_date: media.nextAiringEpisode ? new Date(media.nextAiringEpisode.airingAt * 1000).toISOString() : null,
          next_episode_number: media.nextAiringEpisode?.episode || null,
          last_sync_check: new Date().toISOString()
        };

        const { error: detailError } = await supabase
          .from('anime_details')
          .insert(animeDetailData);

        if (detailError) {
          console.error(`❌ Error inserting anime details for ${media.id}:`, detailError);
        }
      } else {
        const mangaDetailData = {
          title_id: titleId,
          chapters: media.chapters || null,
          volumes: media.volumes || null,
          published_from: formatDate(media.startDate),
          published_to: formatDate(media.endDate),
          status: media.status || 'FINISHED',
          type: media.format || media.type || 'MANGA',
          last_sync_check: new Date().toISOString()
        };

        const { error: detailError } = await supabase
          .from('manga_details')
          .insert(mangaDetailData);

        if (detailError) {
          console.error(`❌ Error inserting manga details for ${media.id}:`, detailError);
        }
      }

      // Process genres
      if (media.genres && media.genres.length > 0) {
        for (const genreName of media.genres) {
          const genreId = await ensureGenre(genreName);
          if (genreId) {
            const { error } = await supabase
              .from('title_genres')
              .insert({ title_id: titleId, genre_id: genreId });
            
            if (!error) results.relationshipsCreated++;
          }
        }
      }

      // Process studios (anime only)
      if (contentType === 'anime' && media.studios?.edges) {
        for (const studioEdge of media.studios.edges) {
          if (studioEdge.isMain && studioEdge.node?.name) {
            const studioId = await ensureStudio(studioEdge.node.name);
            if (studioId) {
              const { error } = await supabase
                .from('title_studios')
                .insert({ title_id: titleId, studio_id: studioId });
              
              if (!error) results.relationshipsCreated++;
            }
          }
        }
      }

      // Process authors (manga only)
      if (contentType === 'manga' && media.staff?.edges) {
        for (const staffEdge of media.staff.edges) {
          if (['Story', 'Story & Art', 'Art'].includes(staffEdge.role) && staffEdge.node?.name?.full) {
            const authorId = await ensureAuthor(staffEdge.node.name.full);
            if (authorId) {
              const { error } = await supabase
                .from('title_authors')
                .insert({ title_id: titleId, author_id: authorId });
              
              if (!error) results.relationshipsCreated++;
            }
          }
        }
      }

      return true;
    };

    // Main sync loop
    for (let page = startPage; page < startPage + maxPages; page++) {
      try {
        console.log(`📄 Processing page ${page} for ${contentType}`);
        
        const variables = {
          page,
          perPage: 50,
          type: contentType.toUpperCase(),
          sort: ['POPULARITY_DESC']
        };

        const response = await makeAniListRequest(COMPREHENSIVE_MEDIA_QUERY, variables);
        
        if (!response.data?.Page?.media?.length) {
          console.log(`📄 No more data on page ${page}, stopping sync`);
          break;
        }

        const mediaList = response.data.Page.media;
        results.pages++;

        // Process each media item
        for (const media of mediaList) {
          try {
            const processed = await processMediaData(media);
            if (processed) {
              results.inserted++;
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
        continue;
      }
    }

    // Update sync status
    await supabase
      .from('content_sync_status')
      .upsert({
        content_type: contentType,
        operation_type: 'comprehensive_normalized_sync',
        status: 'completed',
        processed_items: results.processed,
        total_items: results.processed,
        completed_at: new Date().toISOString(),
        error_message: results.errors > 0 ? `${results.errors} errors occurred` : null
      });

    console.log(`🎉 Comprehensive normalized ${contentType} sync completed!`);
    console.log(`📊 Results:`, results);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Comprehensive normalized ${contentType} sync completed`,
        results: {
          ...results,
          features: {
            normalized_structure: true,
            relationship_mapping: true,
            duplicate_prevention: true,
            api_rate_limiting: true
          }
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Comprehensive normalized sync failed:', error);
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