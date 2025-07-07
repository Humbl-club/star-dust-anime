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

interface SyncResults {
  titlesInserted: number
  detailsInserted: number
  genresCreated: number
  studiosCreated: number
  authorsCreated: number
  relationshipsCreated: number
  errors: string[]
}

// Transform AniList data to match our normalized database schema
function transformToTitleData(item: any) {
  return {
    anilist_id: item.id,
    title: item.title?.romaji || item.title?.english || 'Unknown Title',
    title_english: item.title?.english || null,
    title_japanese: item.title?.native || null,
    synopsis: item.description?.replace(/<[^>]*>/g, '') || null,
    image_url: item.coverImage?.large || item.coverImage?.medium || null,
    score: item.averageScore || null,
    anilist_score: item.averageScore || null,
    popularity: item.popularity || 0,
    favorites: item.favourites || 0,
    members: item.popularity || 0,
    rank: item.meanScore ? Math.floor(item.meanScore * 10) : null,
    year: item.seasonYear || (item.startDate ? item.startDate.year : null),
    color_theme: item.coverImage?.color || null,
  }
}

function transformToAnimeDetails(item: any, titleId: string) {
  return {
    title_id: titleId,
    episodes: item.episodes || null,
    aired_from: item.startDate ? formatDate(item.startDate) : null,
    aired_to: item.endDate ? formatDate(item.endDate) : null,
    season: item.season || null,
    status: mapStatus(item.status),
    type: item.format || 'TV',
    trailer_url: item.trailer?.site === 'youtube' ? `https://www.youtube.com/watch?v=${item.trailer.id}` : null,
    trailer_id: item.trailer?.site === 'youtube' ? item.trailer.id : null,
    trailer_site: item.trailer?.site || null,
    next_episode_date: item.nextAiringEpisode ? new Date(item.nextAiringEpisode.airingAt * 1000).toISOString() : null,
    next_episode_number: item.nextAiringEpisode?.episode || null,
    last_sync_check: new Date().toISOString(),
  }
}

function transformToMangaDetails(item: any, titleId: string) {
  return {
    title_id: titleId,
    chapters: item.chapters || null,
    volumes: item.volumes || null,
    published_from: item.startDate ? formatDate(item.startDate) : null,
    published_to: item.endDate ? formatDate(item.endDate) : null,
    status: mapMangaStatus(item.status),
    type: item.format || 'Manga',
    last_sync_check: new Date().toISOString(),
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

// Create or get genre IDs for relationship linking
async function ensureGenres(supabase: any, genres: string[], contentType: 'anime' | 'manga'): Promise<{ ids: string[], created: number }> {
  if (!genres.length) return { ids: [], created: 0 }
  
  let created = 0
  const genreIds: string[] = []
  
  for (const genreName of genres) {
    // Check if genre exists
    const { data: existing } = await supabase
      .from('genres')
      .select('id')
      .eq('name', genreName)
      .single()
    
    if (existing) {
      genreIds.push(existing.id)
    } else {
      // Create new genre
      const { data: newGenre, error } = await supabase
        .from('genres')
        .insert({ 
          name: genreName, 
          type: contentType === 'anime' ? 'anime' : 'manga' 
        })
        .select('id')
        .single()
      
      if (newGenre && !error) {
        genreIds.push(newGenre.id)
        created++
      }
    }
  }
  
  return { ids: genreIds, created }
}

// Create or get studio IDs for anime
async function ensureStudios(supabase: any, studios: string[]): Promise<{ ids: string[], created: number }> {
  if (!studios.length) return { ids: [], created: 0 }
  
  let created = 0
  const studioIds: string[] = []
  
  for (const studioName of studios) {
    const { data: existing } = await supabase
      .from('studios')
      .select('id')
      .eq('name', studioName)
      .single()
    
    if (existing) {
      studioIds.push(existing.id)
    } else {
      const { data: newStudio, error } = await supabase
        .from('studios')
        .insert({ name: studioName })
        .select('id')
        .single()
      
      if (newStudio && !error) {
        studioIds.push(newStudio.id)
        created++
      }
    }
  }
  
  return { ids: studioIds, created }
}

// Create or get author IDs for manga
async function ensureAuthors(supabase: any, authors: string[]): Promise<{ ids: string[], created: number }> {
  if (!authors.length) return { ids: [], created: 0 }
  
  let created = 0
  const authorIds: string[] = []
  
  for (const authorName of authors) {
    const { data: existing } = await supabase
      .from('authors')
      .select('id')
      .eq('name', authorName)
      .single()
    
    if (existing) {
      authorIds.push(existing.id)
    } else {
      const { data: newAuthor, error } = await supabase
        .from('authors')
        .insert({ name: authorName })
        .select('id')
        .single()
      
      if (newAuthor && !error) {
        authorIds.push(newAuthor.id)
        created++
      }
    }
  }
  
  return { ids: authorIds, created }
}

// Link title to genres through junction table
async function linkTitleGenres(supabase: any, titleId: string, genreIds: string[]): Promise<number> {
  if (!genreIds.length) return 0
  
  const relationships = genreIds.map(genreId => ({
    title_id: titleId,
    genre_id: genreId
  }))
  
  const { data, error } = await supabase
    .from('title_genres')
    .upsert(relationships, { onConflict: 'title_id,genre_id' })
    .select()
  
  return error ? 0 : (data?.length || 0)
}

// Link title to studios through junction table
async function linkTitleStudios(supabase: any, titleId: string, studioIds: string[]): Promise<number> {
  if (!studioIds.length) return 0
  
  const relationships = studioIds.map(studioId => ({
    title_id: titleId,
    studio_id: studioId
  }))
  
  const { data, error } = await supabase
    .from('title_studios')
    .upsert(relationships, { onConflict: 'title_id,studio_id' })
    .select()
  
  return error ? 0 : (data?.length || 0)
}

// Link title to authors through junction table
async function linkTitleAuthors(supabase: any, titleId: string, authorIds: string[]): Promise<number> {
  if (!authorIds.length) return 0
  
  const relationships = authorIds.map(authorId => ({
    title_id: titleId,
    author_id: authorId
  }))
  
  const { data, error } = await supabase
    .from('title_authors')
    .upsert(relationships, { onConflict: 'title_id,author_id' })
    .select()
  
  return error ? 0 : (data?.length || 0)
}

// Process a single item with proper database operations
async function processSingleItem(supabase: any, item: any, contentType: 'anime' | 'manga'): Promise<{
  success: boolean
  titleProcessed: boolean
  detailProcessed: boolean
  genresCreated: number
  studiosCreated: number
  authorsCreated: number
  relationshipsCreated: number
  error?: string
}> {
  try {
    console.log(`🔄 Processing ${contentType} item: ${item.id} - ${item.title?.romaji || item.title?.english}`)
    
    // Step 1: Insert/update title - check if it exists first
    const titleData = transformToTitleData(item)
    console.log(`📊 Title data for ${item.id}:`, { 
      anilist_id: titleData.anilist_id, 
      title: titleData.title,
      hasImage: !!titleData.image_url,
      hasScore: !!titleData.score 
    })
    
    // Check if title already exists
    const { data: existingTitle } = await supabase
      .from('titles')
      .select('id')
      .eq('anilist_id', titleData.anilist_id)
      .single()
    
    let titleId: string
    let titleProcessed = false
    
    if (existingTitle) {
      // Update existing title
      console.log(`📝 Updating existing title ${item.id}`)
      const { data: updatedTitle, error: updateError } = await supabase
        .from('titles')
        .update(titleData)
        .eq('anilist_id', titleData.anilist_id)
        .select('id')
        .single()
      
      if (updateError) {
        console.error(`❌ Title update failed for ${item.id}:`, updateError)
        return {
          success: false,
          titleProcessed: false,
          detailProcessed: false,
          genresCreated: 0,
          studiosCreated: 0,
          authorsCreated: 0,
          relationshipsCreated: 0,
          error: `Title update failed: ${updateError.message}`
        }
      }
      titleId = updatedTitle.id
      titleProcessed = true
    } else {
      // Insert new title
      console.log(`➕ Inserting new title ${item.id}`)
      const { data: newTitle, error: insertError } = await supabase
        .from('titles')
        .insert(titleData)
        .select('id')
        .single()
      
      if (insertError) {
        console.error(`❌ Title insertion failed for ${item.id}:`, insertError)
        return {
          success: false,
          titleProcessed: false,
          detailProcessed: false,
          genresCreated: 0,
          studiosCreated: 0,
          authorsCreated: 0,
          relationshipsCreated: 0,
          error: `Title insertion failed: ${insertError.message}`
        }
      }
      titleId = newTitle.id
      titleProcessed = true
    }
    
    // Step 2: Insert/update details
    let detailProcessed = false
    if (contentType === 'anime') {
      console.log(`📝 Processing anime details for ${item.id}`)
      const animeDetails = transformToAnimeDetails(item, titleId)
      const { data: detailResult, error: detailError } = await supabase
        .from('anime_details')
        .upsert(animeDetails, { onConflict: 'title_id' })
        .select('id')
        .single()
      
      if (detailError) {
        console.error(`❌ Anime details failed for ${item.id}:`, detailError)
      } else {
        console.log(`✅ Anime details processed for ${item.id}`)
        detailProcessed = true
      }
    } else {
      console.log(`📝 Processing manga details for ${item.id}`)
      const mangaDetails = transformToMangaDetails(item, titleId)
      const { data: detailResult, error: detailError } = await supabase
        .from('manga_details')
        .upsert(mangaDetails, { onConflict: 'title_id' })
        .select('id')
        .single()
      
      if (detailError) {
        console.error(`❌ Manga details failed for ${item.id}:`, detailError)
      } else {
        console.log(`✅ Manga details processed for ${item.id}`)
        detailProcessed = true
      }
    }
    
    // Step 3: Handle relationships
    const genres = item.genres || []
    const studios = contentType === 'anime' ? (item.studios?.nodes?.map((s: any) => s.name) || []) : []
    const authors = contentType === 'manga' ? (item.staff?.nodes?.filter((s: any) => 
      s.primaryOccupations?.includes('Story & Art') || s.primaryOccupations?.includes('Story')
    ).map((s: any) => s.name) || []) : []
    
    const { ids: genreIds, created: genresCreated } = await ensureGenres(supabase, genres, contentType)
    const { ids: studioIds, created: studiosCreated } = contentType === 'anime' ? 
      await ensureStudios(supabase, studios) : { ids: [], created: 0 }
    const { ids: authorIds, created: authorsCreated } = contentType === 'manga' ? 
      await ensureAuthors(supabase, authors) : { ids: [], created: 0 }
    
    // Link relationships
    let relationshipsCreated = 0
    relationshipsCreated += await linkTitleGenres(supabase, titleId, genreIds)
    if (contentType === 'anime') {
      relationshipsCreated += await linkTitleStudios(supabase, titleId, studioIds)
    } else {
      relationshipsCreated += await linkTitleAuthors(supabase, titleId, authorIds)
    }
    
    return {
      success: true,
      titleProcessed: titleProcessed,
      detailProcessed: detailProcessed,
      genresCreated,
      studiosCreated,
      authorsCreated,
      relationshipsCreated
    }
    
  } catch (error) {
    return {
      success: false,
      titleProcessed: false,
      detailProcessed: false,
      genresCreated: 0,
      studiosCreated: 0,
      authorsCreated: 0,
      relationshipsCreated: 0,
      error: error.message
    }
  }
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

    console.log(`🚀 Starting comprehensive ${contentType} sync with normalized database schema`)

    if (!contentType || !['anime', 'manga'].includes(contentType)) {
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Invalid contentType. Must be "anime" or "manga"' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const mediaType = contentType.toUpperCase() as 'ANIME' | 'MANGA'
    const startTime = Date.now()
    
    // Initialize comprehensive results tracking
    const results: SyncResults = {
      titlesInserted: 0,
      detailsInserted: 0,
      genresCreated: 0,
      studiosCreated: 0,
      authorsCreated: 0,
      relationshipsCreated: 0,
      errors: []
    }

    let currentPage = 1
    let totalProcessed = 0
    let consecutiveEmptyPages = 0

    console.log(`Processing up to ${maxPages} pages of ${contentType} data...`)

    // Process pages sequentially to avoid overwhelming the database
    while (currentPage <= maxPages && consecutiveEmptyPages < 3) {
      try {
        console.log(`📄 Processing page ${currentPage}/${maxPages}...`)
        
        const response = await fetchAniListData(mediaType, currentPage)
        
        if (!response.data?.Page?.media?.length) {
          console.log(`⚠️ No data found on page ${currentPage}`)
          consecutiveEmptyPages++
          currentPage++
          continue
        }

        const items = response.data.Page.media
        console.log(`📊 Found ${items.length} items on page ${currentPage}`)
        
        let pageProcessed = 0
        consecutiveEmptyPages = 0

        // Process each item individually for better error handling and tracking
        for (const item of items) {
          if (!item.id || !item.title?.romaji && !item.title?.english) {
            console.log(`⚠️ Skipping invalid item: ${item.id}`)
            continue
          }

          const itemResult = await processSingleItem(supabase, item, contentType)
          
          if (itemResult.success) {
            if (itemResult.titleProcessed) results.titlesInserted++
            if (itemResult.detailProcessed) results.detailsInserted++
            results.genresCreated += itemResult.genresCreated
            results.studiosCreated += itemResult.studiosCreated
            results.authorsCreated += itemResult.authorsCreated
            results.relationshipsCreated += itemResult.relationshipsCreated
            pageProcessed++
            totalProcessed++
          } else {
            results.errors.push(`Page ${currentPage}, Item ${item.id}: ${itemResult.error}`)
            console.error(`❌ Failed to process item ${item.id}:`, itemResult.error)
          }

          // Add small delay to respect rate limits
          await new Promise(resolve => setTimeout(resolve, 100))
        }

        console.log(`✅ Page ${currentPage} completed: ${pageProcessed}/${items.length} items processed successfully`)
        
        // Add delay between pages to respect AniList rate limits
        await new Promise(resolve => setTimeout(resolve, 1000))
        
      } catch (error) {
        console.error(`❌ Error processing page ${currentPage}:`, error)
        results.errors.push(`Page ${currentPage}: ${error.message}`)
        consecutiveEmptyPages++
      }

      currentPage++
    }

    const duration = Date.now() - startTime
    const avgPerSecond = duration > 0 ? Math.round((totalProcessed / duration) * 1000) : 0

    console.log(`🎉 Sync completed in ${duration}ms:`)
    console.log(`   📊 Total processed: ${totalProcessed}`)
    console.log(`   📖 Titles: ${results.titlesInserted}`)
    console.log(`   📝 Details: ${results.detailsInserted}`)
    console.log(`   🎭 Genres: ${results.genresCreated}`)
    console.log(`   🏢 Studios: ${results.studiosCreated}`)
    console.log(`   ✍️ Authors: ${results.authorsCreated}`)
    console.log(`   🔗 Relationships: ${results.relationshipsCreated}`)
    console.log(`   ❌ Errors: ${results.errors.length}`)

    // Return comprehensive results
    return new Response(
      JSON.stringify({
        success: true,
        contentType,
        totalProcessed,
        pagesProcessed: currentPage - 1,
        duration: `${duration}ms`,
        averagePerSecond: avgPerSecond,
        results: {
          titlesInserted: results.titlesInserted,
          detailsInserted: results.detailsInserted,
          genresCreated: results.genresCreated,
          studiosCreated: results.studiosCreated,
          authorsCreated: results.authorsCreated,
          relationshipsCreated: results.relationshipsCreated,
          errors: results.errors.slice(0, 10) // Limit error details
        },
        message: `Successfully synced ${totalProcessed} ${contentType} items with ${results.relationshipsCreated} relationships`
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('❌ Ultra-fast sync critical error:', error)
    return new Response(
      JSON.stringify({
        success: false,
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