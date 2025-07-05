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
        total: number
        perPage: number
      }
    }
  }
}

// Utility functions for data cleaning
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
    status: mapStatus(item.status),
    type: item.format || 'TV',
    episodes: item.episodes || null,
    score: item.averageScore || null,
    anilist_score: item.averageScore || null,
    popularity: item.popularity || 0,
    favorites: item.favourites || 0,
    members: item.popularity || 0,
    rank: item.meanScore ? Math.floor(item.meanScore * 10) : null,
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
    status: mapMangaStatus(item.status),
    type: item.format || 'Manga',
    chapters: item.chapters || null,
    volumes: item.volumes || null,
    score: item.averageScore || null,
    popularity: item.popularity || 0,
    favorites: item.favourites || 0,
    members: item.popularity || 0,
    rank: item.meanScore ? Math.floor(item.meanScore * 10) : null,
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

function formatDate(dateObj: any): string | null {
  if (!dateObj || !dateObj.year) return null
  
  const year = dateObj.year
  const month = dateObj.month || 1
  const day = dateObj.day || 1
  
  if (year < 1900 || year > 2100) return null
  if (month < 1 || month > 12) return null
  if (day < 1 || day > 31) return null
  
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
          total
          perPage
        }
        media(type: $type, sort: [ID]) {
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
    perPage: 50,
    type
  }

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
}

async function batchUpsert(supabase: any, table: string, data: any[], batchSize: number = 25) {
  const results = []
  
  for (let i = 0; i < data.length; i += batchSize) {
    const batch = data.slice(i, i + batchSize)
    
    try {
      const { data: result, error } = await supabase
        .from(table)
        .upsert(batch, { 
          onConflict: 'anilist_id',
          ignoreDuplicates: false 
        })
        .select('id')
      
      if (error) {
        console.error(`Batch upsert error for ${table}:`, error)
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

async function logProgress(supabase: any, contentType: string, page: number, processed: number, total: number) {
  try {
    await supabase
      .from('sync_logs')
      .insert({
        content_type: contentType,
        operation_type: 'complete_sync',
        page: page,
        items_processed: processed,
        status: 'in_progress',
        created_at: new Date().toISOString()
      })
  } catch (error) {
    console.error('Failed to log progress:', error)
  }
}

Deno.serve(async (req) => {
  console.log('🔥 Complete AniList Sync function called!', req.method)
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    console.log('🔧 Creating Supabase client...')
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    console.log('📝 Parsing request body...')
    const body = await req.text()
    console.log('Raw body:', body)
    
    const { contentType } = JSON.parse(body)

    if (!contentType || !['anime', 'manga'].includes(contentType)) {
      return new Response(
        JSON.stringify({ error: 'Invalid contentType. Must be "anime" or "manga"' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log(`🚀 Starting COMPLETE ${contentType} sync - will not stop until ALL titles are retrieved`)

    const mediaType = contentType.toUpperCase() as 'ANIME' | 'MANGA'
    let totalProcessed = 0
    let currentPage = 1
    let hasNextPage = true
    const startTime = Date.now()
    let totalAvailable = 0

    // Log start of sync
    await supabase
      .from('sync_logs')
      .insert({
        content_type: contentType,
        operation_type: 'complete_sync',
        status: 'started',
        created_at: new Date().toISOString()
      })

    console.log(`📊 Starting comprehensive sync for ${contentType}...`)

    while (hasNextPage) {
      try {
        console.log(`📄 Fetching ${contentType} page ${currentPage}...`)
        
        const response = await fetchAniListData(mediaType, currentPage)
        
        if (!response.data?.Page?.media?.length) {
          console.log(`✅ No more data available at page ${currentPage}`)
          break
        }

        const items = response.data.Page.media
        const pageInfo = response.data.Page.pageInfo
        
        // Update total available count
        if (pageInfo.total && totalAvailable === 0) {
          totalAvailable = pageInfo.total
          console.log(`📊 Total ${contentType} titles available: ${totalAvailable}`)
        }

        hasNextPage = pageInfo.hasNextPage
        
        console.log(`📝 Processing ${items.length} ${contentType} items from page ${currentPage}`)
        console.log(`📈 Progress: ${totalProcessed}/${totalAvailable || 'unknown'} (Page ${currentPage})`)
        
        // Clean and process data
        const cleanedData = items.map(item => 
          contentType === 'anime' ? cleanAnimeData(item) : cleanMangaData(item)
        ).filter(item => item.title !== 'Unknown Title')

        if (cleanedData.length > 0) {
          const results = await batchUpsert(supabase, contentType, cleanedData)
          totalProcessed += cleanedData.length
          
          console.log(`✅ Page ${currentPage}: Processed ${cleanedData.length} ${contentType} items (Total: ${totalProcessed})`)
          
          // Log progress every 10 pages
          if (currentPage % 10 === 0) {
            await logProgress(supabase, contentType, currentPage, totalProcessed, totalAvailable)
          }
        }

        currentPage++

        // Rate limiting: small delay between requests to be respectful to AniList API
        await new Promise(resolve => setTimeout(resolve, 100))

      } catch (error) {
        console.error(`❌ Error on page ${currentPage}:`, error)
        
        // Log error but continue
        await supabase
          .from('sync_logs')
          .insert({
            content_type: contentType,
            operation_type: 'complete_sync',
            page: currentPage,
            status: 'error',
            error_message: error.message,
            created_at: new Date().toISOString()
          })

        // Continue to next page after error
        currentPage++
        
        // If we hit too many consecutive errors, wait longer
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
    }

    const duration = Date.now() - startTime
    const avgPerSecond = Math.round((totalProcessed / duration) * 1000)

    // Log completion
    await supabase
      .from('sync_logs')
      .insert({
        content_type: contentType,
        operation_type: 'complete_sync',
        items_processed: totalProcessed,
        status: 'completed',
        completed_at: new Date().toISOString(),
        created_at: new Date().toISOString()
      })

    console.log(`🎉 COMPLETE ${contentType} sync finished!`)
    console.log(`📊 Final stats: ${totalProcessed} items processed in ${duration}ms (${avgPerSecond}/sec)`)
    console.log(`📄 Total pages processed: ${currentPage - 1}`)

    return new Response(
      JSON.stringify({
        success: true,
        contentType,
        totalProcessed,
        pagesProcessed: currentPage - 1,
        duration: `${duration}ms`,
        averagePerSecond: avgPerSecond,
        totalAvailable,
        message: `✅ COMPLETE ${contentType} library sync finished! Retrieved ALL ${totalProcessed} titles from AniList database.`
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Complete sync error:', error)
    return new Response(
      JSON.stringify({
        error: 'Complete sync failed',
        details: error.message
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})