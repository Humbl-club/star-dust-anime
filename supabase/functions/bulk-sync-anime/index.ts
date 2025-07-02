import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// AniList GraphQL queries
const ANIME_SEARCH_QUERY = `
  query GetAnime($page: Int, $perPage: Int) {
    Page(page: $page, perPage: $perPage) {
      pageInfo {
        total
        currentPage
        lastPage
        hasNextPage
        perPage
      }
      media(type: ANIME, sort: [SCORE_DESC, POPULARITY_DESC]) {
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
        duration
        genres
        synonyms
        averageScore
        meanScore
        popularity
        favourites
        countryOfOrigin
        isAdult
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
        }
        studios {
          edges {
            isMain
            node {
              name
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

const MANGA_SEARCH_QUERY = `
  query GetManga($page: Int, $perPage: Int) {
    Page(page: $page, perPage: $perPage) {
      pageInfo {
        total
        currentPage
        lastPage
        hasNextPage
        perPage
      }
      media(type: MANGA, sort: [SCORE_DESC, POPULARITY_DESC]) {
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
        format
        status
        chapters
        volumes
        genres
        synonyms
        averageScore
        meanScore
        popularity
        favourites
        countryOfOrigin
        isAdult
        coverImage {
          extraLarge
          large
          medium
          color
        }
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

async function fetchAniListData(query: string, variables: any) {
  const response = await fetch('https://graphql.anilist.co', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({
      query,
      variables,
    }),
  });

  if (!response.ok) {
    throw new Error(`AniList API error: ${response.status}`);
  }

  const data = await response.json();
  
  if (data.errors) {
    throw new Error(`AniList GraphQL error: ${data.errors[0]?.message}`);
  }

  return data;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { contentType = 'both' } = await req.json().catch(() => ({}));
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase configuration missing');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    console.log(`Starting AniList sync for ${contentType}...`);

    let animeProcessed = 0;
    let mangaProcessed = 0;
    
    // Sync anime if requested
    if (contentType === 'anime' || contentType === 'both') {
      console.log('Fetching ALL anime from AniList...');
      
      let page = 1;
      let hasNextPage = true;
      
      while (hasNextPage) {
        console.log(`Fetching anime page ${page}...`);

        try {
          const response = await fetchAniListData(ANIME_SEARCH_QUERY, {
            page,
            perPage: 50
          });

          const pageInfo = response.data.Page.pageInfo;
          const animeList = response.data.Page.media;
          
          console.log(`Page ${page}/${pageInfo.lastPage} - Processing ${animeList.length} anime...`);

          for (const anime of animeList) {
            try {
              // Check if exists by AniList ID
              const { data: existing } = await supabase
                .from('anime')
                .select('id')
                .eq('anilist_id', anime.id)
                .maybeSingle();

              if (!existing) {
                const formatDate = (date: any) => {
                  if (!date?.year) return null;
                  const year = date.year;
                  const month = date.month ? String(date.month).padStart(2, '0') : '01';
                  const day = date.day ? String(date.day).padStart(2, '0') : '01';
                  return `${year}-${month}-${day}`;
                };

                const animeData = {
                  anilist_id: anime.id,
                  mal_id: anime.malId || null,
                  title: anime.title.romaji,
                  title_english: anime.title.english || null,
                  title_japanese: anime.title.native || null,
                  type: anime.format || anime.type || 'TV',
                  status: anime.status || 'FINISHED',
                  episodes: anime.episodes || null,
                  aired_from: formatDate(anime.startDate),
                  aired_to: formatDate(anime.endDate),
                  score: anime.averageScore ? anime.averageScore / 10 : null,
                  scored_by: null,
                  rank: null,
                  popularity: anime.popularity || null,
                  members: anime.favourites || null,
                  favorites: anime.favourites || null,
                  synopsis: anime.description ? anime.description.replace(/<[^>]*>/g, '') : null,
                  image_url: anime.coverImage.extraLarge || anime.coverImage.large || anime.coverImage.medium,
                  banner_image: anime.bannerImage || null,
                  color_theme: anime.coverImage.color || null,
                  trailer_url: anime.trailer ? `https://www.youtube.com/watch?v=${anime.trailer.id}` : null,
                  genres: anime.genres || [],
                  studios: anime.studios?.edges?.filter((edge: any) => edge.isMain).map((edge: any) => edge.node.name) || [],
                  themes: anime.tags?.filter((tag: any) => tag.rank >= 60).map((tag: any) => tag.name) || [],
                  demographics: [],
                  season: anime.season || null,
                  year: anime.seasonYear || anime.startDate?.year || null
                };

                const { error } = await supabase
                  .from('anime')
                  .insert(animeData);

                if (!error) {
                  animeProcessed++;
                  if (animeProcessed % 50 === 0) {
                    console.log(`Processed ${animeProcessed} anime so far...`);
                  }
                } else {
                  console.error(`Error inserting anime ${anime.id}:`, error);
                }
              }
            } catch (animeError) {
              console.error(`Error processing anime ${anime.id}:`, animeError);
            }
          }

          hasNextPage = pageInfo.hasNextPage;
          page++;
          
          // Rate limiting - AniList allows ~90 requests per minute
          await new Promise(resolve => setTimeout(resolve, 700));

        } catch (pageError) {
          console.error(`Error fetching anime page ${page}:`, pageError);
          // Continue to next page on error
          page++;
          hasNextPage = page <= 1000; // Safety limit
        }
      }
    }

    // Sync manga if requested  
    if (contentType === 'manga' || contentType === 'both') {
      console.log('Fetching ALL manga from AniList...');
      
      let page = 1;
      let hasNextPage = true;
      
      while (hasNextPage) {
        console.log(`Fetching manga page ${page}...`);

        try {
          const response = await fetchAniListData(MANGA_SEARCH_QUERY, {
            page,
            perPage: 50
          });

          const pageInfo = response.data.Page.pageInfo;
          const mangaList = response.data.Page.media;
          
          console.log(`Page ${page}/${pageInfo.lastPage} - Processing ${mangaList.length} manga...`);

          for (const manga of mangaList) {
            try {
              // Check if exists by AniList ID
              const { data: existing } = await supabase
                .from('manga')
                .select('id')
                .or(`anilist_id.eq.${manga.id},mal_id.eq.${manga.malId}`)
                .maybeSingle();

              if (!existing) {
                const formatDate = (date: any) => {
                  if (!date?.year) return null;
                  const year = date.year;
                  const month = date.month ? String(date.month).padStart(2, '0') : '01';
                  const day = date.day ? String(date.day).padStart(2, '0') : '01';
                  return `${year}-${month}-${day}`;
                };

                const mangaData = {
                  mal_id: manga.malId || null,
                  title: manga.title.romaji,
                  title_english: manga.title.english || null,
                  title_japanese: manga.title.native || null,
                  type: manga.format || 'MANGA',
                  status: manga.status || 'FINISHED',
                  chapters: manga.chapters || null,
                  volumes: manga.volumes || null,
                  published_from: formatDate(manga.startDate),
                  published_to: formatDate(manga.endDate),
                  score: manga.averageScore ? manga.averageScore / 10 : null,
                  scored_by: null,
                  rank: null,
                  popularity: manga.popularity || null,
                  members: manga.favourites || null,
                  favorites: manga.favourites || null,
                  synopsis: manga.description ? manga.description.replace(/<[^>]*>/g, '') : null,
                  image_url: manga.coverImage.extraLarge || manga.coverImage.large || manga.coverImage.medium,
                  genres: manga.genres || [],
                  authors: manga.staff?.edges?.filter((edge: any) => edge.role === 'Story & Art' || edge.role === 'Story').map((edge: any) => edge.node.name.full) || [],
                  serializations: [],
                  themes: manga.tags?.filter((tag: any) => tag.rank >= 60).map((tag: any) => tag.name) || [],
                  demographics: []
                };

                const { error } = await supabase
                  .from('manga')
                  .insert(mangaData);

                if (!error) {
                  mangaProcessed++;
                  if (mangaProcessed % 50 === 0) {
                    console.log(`Processed ${mangaProcessed} manga so far...`);
                  }
                } else {
                  console.error(`Error inserting manga ${manga.id}:`, error);
                }
              }
            } catch (mangaError) {
              console.error(`Error processing manga ${manga.id}:`, mangaError);
            }
          }

          hasNextPage = pageInfo.hasNextPage;
          page++;
          
          // Rate limiting - AniList allows ~90 requests per minute
          await new Promise(resolve => setTimeout(resolve, 700));

        } catch (pageError) {
          console.error(`Error fetching manga page ${page}:`, pageError);
          // Continue to next page on error
          page++;
          hasNextPage = page <= 1000; // Safety limit
        }
      }
    }

    console.log(`AniList sync completed!`);
    console.log(`Anime processed: ${animeProcessed}`);
    console.log(`Manga processed: ${mangaProcessed}`);

    return new Response(JSON.stringify({
      success: true,
      anime_processed: animeProcessed,
      manga_processed: mangaProcessed,
      total_processed: animeProcessed + mangaProcessed,
      message: `Successfully synced ${animeProcessed} anime and ${mangaProcessed} manga from AniList`
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