import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface AniListResponse {
  data: {
    Page: {
      media: any[]
      pageInfo: {
        hasNextPage: boolean
        currentPage: number
      }
    }
  }
}

// Utility function to clean and validate data
function cleanAnimeData(item: any) {
  return {
    mal_id: item.idMal || null,
    anilist_id: item.id || null,
    title: item.title?.romaji || item.title?.english || 'Unknown Title',
    title_english: item.title?.english || null,
    title_japanese: item.title?.native || null,
    synopsis: item.description?.replace(/<[^>]*>/g, '') || null,
    image_url: item.coverImage?.large || item.coverImage?.medium || null,
    banner_image: item.bannerImage || null,
    cover_image_large: item.coverImage?.large || null,
    cover_image_extra_large: item.coverImage?.extraLarge || null,
    // Fix status mapping
    status: mapStatus(item.status),
    type: item.format || 'TV',
    episodes: item.episodes || null,
    score: item.averageScore || null,
    anilist_score: item.averageScore || null,
    popularity: item.popularity || 0,
    favorites: item.favourites || 0,
    members: item.popularity || 0,
    rank: item.meanScore ? Math.floor(item.meanScore * 10) : null,
    // Use safe date casting
    aired_from: item.startDate ? formatDate(item.startDate) : null,
    aired_to: item.endDate ? formatDate(item.endDate) : null,
    year: item.seasonYear || (item.startDate ? item.startDate.year : null),
    season: item.season || null,
    genres: item.genres || [],
    studios: item.studios?.nodes?.map((s: any) => s.name) || [],
    themes: item.tags?.map((t: any) => t.name) || [],
    demographics: [],
    color_theme: item.coverImage?.color || null,
    trailer_url: item.trailer?.site === 'youtube' ? `https://www.youtube.com/watch?v=${item.trailer.id}` : null,
    trailer_id: item.trailer?.site === 'youtube' ? item.trailer.id : null,
    trailer_site: item.trailer?.site || null,
    characters_data: item.characters?.nodes || [],
    staff_data: item.staff?.nodes || [],
    external_links: item.externalLinks || [],
    airing_schedule: item.airingSchedule?.nodes || [],
    next_episode_date: item.nextAiringEpisode ? new Date(item.nextAiringEpisode.airingAt * 1000).toISOString() : null,
    next_episode_number: item.nextAiringEpisode?.episode || null,
    last_sync_check: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
}

function cleanMangaData(item: any) {
  return {
    mal_id: item.idMal || null,
    anilist_id: item.id || null,
    title: item.title?.romaji || item.title?.english || 'Unknown Title',
    title_english: item.title?.english || null,
    title_japanese: item.title?.native || null,
    synopsis: item.description?.replace(/<[^>]*>/g, '') || null,
    image_url: item.coverImage?.large || item.coverImage?.medium || null,
    // Fix status mapping
    status: mapMangaStatus(item.status),
    type: item.format || 'Manga',
    chapters: item.chapters || null,
    volumes: item.volumes || null,
    score: item.averageScore || null,
    popularity: item.popularity || 0,
    favorites: item.favourites || 0,
    members: item.popularity || 0,
    rank: item.meanScore ? Math.floor(item.meanScore * 10) : null,
    // Use safe date casting
    published_from: item.startDate ? formatDate(item.startDate) : null,
    published_to: item.endDate ? formatDate(item.endDate) : null,
    genres: item.genres || [],
    authors: item.staff?.nodes?.filter((s: any) => s.role === 'Story & Art' || s.role === 'Story').map((s: any) => s.name) || [],
    themes: item.tags?.map((t: any) => t.name) || [],
    demographics: [],
    serializations: [],
    last_sync_check: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
}

// Map AniList status to our database values
function mapStatus(status: string): string {
  const statusMap: { [key: string]: string } = {
    'FINISHED': 'Finished Airing',
    'RELEASING': 'Currently Airing',
    'NOT_YET_RELEASED': 'Not yet aired',
    'CANCELLED': 'Cancelled',
    'HIATUS': 'Hiatus'
  }
  return statusMap[status] || status || 'Finished Airing'
}

function mapMangaStatus(status: string): string {
  const statusMap: { [key: string]: string } = {
    'FINISHED': 'Finished',
    'RELEASING': 'Publishing',
    'NOT_YET_RELEASED': 'Not yet published',
    'CANCELLED': 'Cancelled',
    'HIATUS': 'On Hiatus'
  }
  return statusMap[status] || status || 'Finished'
}

// Safe date formatting
function formatDate(dateObj: any): string | null {
  if (!dateObj || !dateObj.year) return null
  
  const year = dateObj.year
  const month = dateObj.month || 1
  const day = dateObj.day || 1
  
  // Validate date components
  if (year < 1900 || year > 2100) return null
  if (month < 1 || month > 12) return null
  if (day < 1 || day > 31) return null
  
  // Check for invalid dates like Feb 31, Jun 31, etc.
  const daysInMonth = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
  if (day > daysInMonth[month - 1]) return null
  
  try {
    const date = new Date(year, month - 1, day)
    if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
      return null
    }
    return date.toISOString().split('T')[0]
  } catch {
    return null
  }
}

async function fetchAniListData(type: 'ANIME' | 'MANGA', page: number = 1) {
  const query = `
    query ($page: Int, $perPage: Int, $type: MediaType) {
      Page(page: $page, perPage: $perPage) {
        pageInfo {
          hasNextPage
          currentPage
        }
        media(type: $type, sort: [POPULARITY_DESC, SCORE_DESC]) {
          id
          idMal
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
          type: format
          status
          episodes
          chapters
          volumes
          coverImage {
            large
            medium
            extraLarge
            color
          }
          bannerImage
          genres
          averageScore
          meanScore
          popularity
          favourites
          tags {
            name
          }
          studios {
            nodes {
              name
            }
          }
          staff {
            nodes {
              name
              role: primaryOccupations
            }
          }
          characters {
            nodes {
              name {
                full
              }
            }
          }
          externalLinks {
            site
            url
          }
          trailer {
            id
            site
          }
          airingSchedule {
            nodes {
              episode
              airingAt
            }
          }
          nextAiringEpisode {
            episode
            airingAt
          }
        }
      }
    }
  `

  const variables = {
    page,
    perPage: 50, // Increased batch size
    type
  }

  try {
    const response = await fetch('https://graphql.anilist.co', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        query,
        variables
      })
    })

    if (!response.ok) {
      throw new Error(`AniList API error: ${response.status}`)
    }

    const data: AniListResponse = await response.json()
    return data
  } catch (error) {
    console.error(`Error fetching ${type} data from AniList:`, error)
    throw error
  }
}

async function batchUpsert(supabase: any, table: string, data: any[], batchSize: number = 25) {
  const results = []
  
  for (let i = 0; i < data.length; i += batchSize) {
    const batch = data.slice(i, i + batchSize)
    
    try {
      const { data: result, error } = await supabase
        .from(table)
        .upsert(batch, { 
          onConflict: table === 'anime' ? 'anilist_id' : 'anilist_id',
          ignoreDuplicates: false 
        })
        .select('id')
      
      if (error) {
        console.error(`Batch upsert error for ${table}:`, error)
        // Continue with other batches even if one fails
        continue
      }
      
      results.push(...(result || []))
    } catch (err) {
      console.error(`Batch processing error for ${table}:`, err)
      continue
    }
  }
  
  return results
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { contentType, maxPages = 10 } = await req.json()

    console.log(`Starting ultra-fast sync for ${contentType}, max pages: ${maxPages}`)

    if (!contentType || !['anime', 'manga'].includes(contentType)) {
      return new Response(
        JSON.stringify({ error: 'Invalid contentType. Must be "anime" or "manga"' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const mediaType = contentType.toUpperCase() as 'ANIME' | 'MANGA'
    let totalProcessed = 0
    let currentPage = 1
    const startTime = Date.now()

    // Process pages in parallel batches
    const parallelBatches = 3 // Process 3 pages simultaneously
    
    while (currentPage <= maxPages) {
      const pagePromises = []
      
      // Create batch of parallel requests
      for (let i = 0; i < parallelBatches && currentPage + i <= maxPages; i++) {
        pagePromises.push(
          fetchAniListData(mediaType, currentPage + i)
            .then(async (response) => {
              if (!response.data?.Page?.media?.length) {
                return { processed: 0, page: currentPage + i }
              }

              const items = response.data.Page.media
              const cleanedData = items.map(item => 
                contentType === 'anime' ? cleanAnimeData(item) : cleanMangaData(item)
              ).filter(item => item.title !== 'Unknown Title') // Filter out invalid entries

              if (cleanedData.length > 0) {
                const results = await batchUpsert(supabase, contentType, cleanedData)
                console.log(`Page ${currentPage + i}: Processed ${cleanedData.length} ${contentType} items`)
                return { processed: cleanedData.length, page: currentPage + i }
              }
              
              return { processed: 0, page: currentPage + i }
            })
            .catch(error => {
              console.error(`Error processing page ${currentPage + i}:`, error)
              return { processed: 0, page: currentPage + i, error: error.message }
            })
        )
      }

      // Wait for all parallel requests to complete
      const batchResults = await Promise.all(pagePromises)
      const batchProcessed = batchResults.reduce((sum, result) => sum + result.processed, 0)
      totalProcessed += batchProcessed
      
      console.log(`Completed batch starting at page ${currentPage}, processed ${batchProcessed} items`)
      
      // Check if we should continue
      if (batchProcessed === 0) {
        console.log('No more data to process, stopping')
        break
      }
      
      currentPage += parallelBatches
    }

    const duration = Date.now() - startTime
    const avgPerSecond = Math.round((totalProcessed / duration) * 1000)

    console.log(`Ultra-fast sync completed: ${totalProcessed} ${contentType} items in ${duration}ms (${avgPerSecond}/sec)`)

    return new Response(
      JSON.stringify({
        success: true,
        contentType,
        totalProcessed,
        pagesProcessed: Math.min(currentPage - 1, maxPages),
        duration: `${duration}ms`,
        averagePerSecond: avgPerSecond,
        message: `Successfully synced ${totalProcessed} ${contentType} items at high speed`
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Ultra-fast sync error:', error)
    return new Response(
      JSON.stringify({
        error: 'Ultra-fast sync failed',
        details: error.message
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})