import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface AniListData {
  id: number
  title: {
    romaji?: string
    english?: string
    japanese?: string
  }
  description?: string
  coverImage?: {
    large?: string
    color?: string
  }
  averageScore?: number
  meanScore?: number
  popularity?: number
  favourites?: number
  rankings?: Array<{
    rank: number
    type: string
    context: string
  }>
  startDate?: {
    year?: number
    month?: number
    day?: number
  }
  endDate?: {
    year?: number
    month?: number
    day?: number
  }
  status?: string
  format?: string
  episodes?: number
  chapters?: number
  volumes?: number
  genres?: string[]
  studios?: {
    nodes?: Array<{ name: string }>
  }
  staff?: {
    edges?: Array<{
      role: string
      node: { name: { full: string } }
    }>
  }
  season?: string
  trailer?: {
    id?: string
    site?: string
  }
  nextAiringEpisode?: {
    timeUntilAiring: number
    episode: number
  }
}

const ANILIST_API_URL = 'https://graphql.anilist.co'

const ANIME_QUERY = `
  query ($page: Int, $perPage: Int) {
    Page(page: $page, perPage: $perPage) {
      pageInfo {
        total
        currentPage
        lastPage
        hasNextPage
      }
      media(type: ANIME, sort: POPULARITY_DESC) {
        id
        title {
          romaji
          english
          japanese
        }
        description
        coverImage {
          large
          color
        }
        averageScore
        meanScore
        popularity
        favourites
        rankings {
          rank
          type
          context
        }
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
        status
        format
        episodes
        genres
        studios {
          nodes {
            name
          }
        }
        season
        trailer {
          id
          site
        }
        nextAiringEpisode {
          timeUntilAiring
          episode
        }
      }
    }
  }
`

const MANGA_QUERY = `
  query ($page: Int, $perPage: Int) {
    Page(page: $page, perPage: $perPage) {
      pageInfo {
        total
        currentPage
        lastPage
        hasNextPage
      }
      media(type: MANGA, sort: POPULARITY_DESC) {
        id
        title {
          romaji
          english
          japanese
        }
        description
        coverImage {
          large
          color
        }
        averageScore
        meanScore
        popularity
        favourites
        rankings {
          rank
          type
          context
        }
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
        status
        format
        chapters
        volumes
        genres
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
      }
    }
  }
`

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { contentType = 'anime', maxPages = 10, startPage = 1 } = await req.json()
    
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    console.log(`🚀 Starting AniList bulk import for ${contentType}`)
    console.log(`📊 Processing ${maxPages} pages starting from page ${startPage}`)

    const query = contentType === 'anime' ? ANIME_QUERY : MANGA_QUERY
    let totalProcessed = 0
    let totalCreated = 0
    let totalUpdated = 0
    let errors: string[] = []

    for (let page = startPage; page <= startPage + maxPages - 1; page++) {
      console.log(`📄 Processing page ${page}...`)

      try {
        // Fetch from AniList API with rate limiting
        const response = await fetch(ANILIST_API_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: JSON.stringify({
            query,
            variables: { page, perPage: 50 }
          })
        })

        if (!response.ok) {
          throw new Error(`AniList API error: ${response.status} ${response.statusText}`)
        }

        const data = await response.json()
        
        if (data.errors) {
          throw new Error(`GraphQL errors: ${JSON.stringify(data.errors)}`)
        }

        const mediaItems = data.data.Page.media
        console.log(`📊 Found ${mediaItems.length} items on page ${page}`)

        // Process each item
        for (const item of mediaItems) {
          try {
            const result = await processAniListItem(supabaseClient, item, contentType)
            if (result.created) {
              totalCreated++
            } else {
              totalUpdated++
            }
            totalProcessed++
          } catch (error) {
            const errorMsg = `Failed to process item ${item.id}: ${error.message}`
            console.error(`❌ ${errorMsg}`)
            errors.push(errorMsg)
          }
        }

        // Rate limiting - wait 1 second between requests
        if (page < startPage + maxPages - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000))
        }

      } catch (error) {
        const errorMsg = `Failed to process page ${page}: ${error.message}`
        console.error(`❌ ${errorMsg}`)
        errors.push(errorMsg)
      }
    }

    const result = {
      success: true,
      contentType,
      totalProcessed,
      totalCreated,
      totalUpdated,
      pagesProcessed: maxPages,
      errors: errors.slice(0, 10), // Limit error list
      errorCount: errors.length
    }

    console.log(`✅ Bulk import completed: ${JSON.stringify(result)}`)

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    console.error('❌ Bulk import failed:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})

async function processAniListItem(supabase: any, item: AniListData, contentType: string) {
  // Check if item already exists
  const { data: existingTitle } = await supabase
    .from('titles')
    .select('id')
    .eq('anilist_id', item.id)
    .single()

  // Helper function to format date
  const formatDate = (dateObj: any) => {
    if (!dateObj?.year) return null
    const year = dateObj.year
    const month = dateObj.month || 1
    const day = dateObj.day || 1
    return `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`
  }

  // Prepare title data
  const titleData = {
    anilist_id: item.id,
    title: item.title?.romaji || 'Unknown Title',
    title_english: item.title?.english,
    title_japanese: item.title?.japanese,
    synopsis: item.description?.replace(/<[^>]*>/g, ''), // Strip HTML tags
    image_url: item.coverImage?.large,
    score: item.averageScore ? item.averageScore / 10 : null,
    anilist_score: item.averageScore,
    rank: item.rankings?.find(r => r.type === 'RATED')?.rank,
    popularity: item.popularity,
    year: item.startDate?.year,
    color_theme: item.coverImage?.color,
    num_users_voted: item.favourites || 0
  }

  // Prepare content-specific data
  let animeData = null
  let mangaData = null
  let genreNames: string[] = item.genres || []
  let studioNames: string[] = []
  let authorNames: string[] = []

  if (contentType === 'anime') {
    animeData = {
      episodes: item.episodes,
      aired_from: formatDate(item.startDate),
      aired_to: formatDate(item.endDate),
      season: item.season,
      status: item.status,
      type: item.format,
      trailer_url: item.trailer?.site === 'youtube' ? `https://www.youtube.com/watch?v=${item.trailer.id}` : null,
      trailer_site: item.trailer?.site,
      trailer_id: item.trailer?.id,
      next_episode_date: item.nextAiringEpisode ? 
        new Date(Date.now() + item.nextAiringEpisode.timeUntilAiring * 1000).toISOString() : null,
      next_episode_number: item.nextAiringEpisode?.episode
    }
    studioNames = item.studios?.nodes?.map(s => s.name) || []
  } else {
    mangaData = {
      chapters: item.chapters,
      volumes: item.volumes,
      published_from: formatDate(item.startDate),
      published_to: formatDate(item.endDate),
      status: item.status,
      type: item.format
    }
    authorNames = item.staff?.edges
      ?.filter(edge => edge.role === 'Story & Art' || edge.role === 'Story')
      ?.map(edge => edge.node.name.full) || []
  }

  if (existingTitle) {
    // Update existing title
    const { error: titleError } = await supabase
      .from('titles')
      .update(titleData)
      .eq('id', existingTitle.id)

    if (titleError) throw titleError

    // Update content-specific details
    if (contentType === 'anime' && animeData) {
      const { error: animeError } = await supabase
        .from('anime_details')
        .upsert({ ...animeData, title_id: existingTitle.id })

      if (animeError) throw animeError
    } else if (contentType === 'manga' && mangaData) {
      const { error: mangaError } = await supabase
        .from('manga_details')
        .upsert({ ...mangaData, title_id: existingTitle.id })

      if (mangaError) throw mangaError
    }

    return { created: false, titleId: existingTitle.id }
  } else {
    // Create new title using the helper function
    const { data: newTitleId, error } = await supabase.rpc('insert_title_with_details', {
      title_data: titleData,
      anime_data: animeData,
      manga_data: mangaData,
      genre_names: genreNames,
      studio_names: studioNames,
      author_names: authorNames
    })

    if (error) throw error

    return { created: true, titleId: newTitleId }
  }
}