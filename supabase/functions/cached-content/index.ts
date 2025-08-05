const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { redis, CACHE_TTL, CACHE_KEYS, getCacheWithStats, setCacheWithStats } from "../_shared/redis.ts"

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)

// Cache trending content for faster homepage loading
const TRENDING_CACHE_KEY = 'trending_content'
const POPULAR_CACHE_KEY = 'popular_content' 
const RECENT_CACHE_KEY = 'recent_content'

// Comprehensive error handling wrapper
const withErrorHandling = async (
  handler: () => Promise<Response>,
  fallbackData: any = { data: [], cached: false }
): Promise<Response> => {
  try {
    return await handler();
  } catch (error) {
    console.error('Edge function error:', error);
    
    // Check if Redis is down
    if (error.message?.includes('Redis') || error.message?.includes('ECONNREFUSED')) {
      console.warn('Redis unavailable, continuing without cache');
      // Try to execute handler without cache
      try {
        return await handler();
      } catch (secondError) {
        console.error('Handler failed even without cache:', secondError);
      }
    }
    
    // Check if Supabase is down
    if (error.message?.includes('PGRST') || error.message?.includes('Failed to fetch')) {
      return new Response(
        JSON.stringify({ 
          error: 'Database temporarily unavailable', 
          fallback: true,
          ...fallbackData 
        }),
        { 
          status: 503, 
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json',
            'Retry-After': '60'
          }
        }
      );
    }
    
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Internal server error',
        ...fallbackData 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
};

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  return await withErrorHandling(async () => {
    const { endpoint, contentType, limit = 24, sort_by = 'popularity', filters = {}, query } = await req.json()
    
    console.log(`📡 Cache request: ${endpoint} for ${contentType}`)

    switch (endpoint) {
      case 'trending':
        return await handleTrendingContent(contentType, limit)
      case 'popular':
        return await handlePopularContent(contentType, limit)
      case 'recent':
        return await handleRecentContent(contentType, limit)
      case 'homepage':
        return await handleHomepageData()
      case 'search':
        return await handleSearchResults(query || filters?.query, contentType, limit, filters)
      default:
        return await handleGenericContent(contentType, limit, sort_by, filters)
    }
  })
})

async function handleTrendingContent(contentType: 'anime' | 'manga', limit: number) {
  const cacheKey = CACHE_KEYS.TRENDING(contentType, limit)
  
  // Check Redis cache first
  const cached = await getCacheWithStats(cacheKey)
  if (cached) {
    console.log(`✅ Cache HIT: ${cacheKey}`)
    return new Response(
      JSON.stringify({ data: cached, cached: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json', 'X-Cache': 'HIT' } }
    )
  }

  console.log(`❌ Cache MISS: ${cacheKey}`)

  // Fetch trending data with complex scoring
  const query = supabase
    .from('titles')
    .select(`
      id,
      anilist_id,
      title,
      title_english,
      image_url,
      score,
      anilist_score,
      popularity,
      favorites,
      year,
      created_at,
      ${contentType === 'anime' ? `
        anime_details!inner(
          episodes,
          status,
          type,
          season,
          aired_from,
          next_episode_date
        )
      ` : `
        manga_details!inner(
          chapters,
          volumes,
          status,
          type,
          published_from,
          next_chapter_date
        )
      `},
      title_genres(genres(name))
    `)
    .order('popularity', { ascending: false })
    .order('score', { ascending: false })
    .limit(limit)

  const { data, error } = await query

  if (error) throw error

  // Transform and cache the data
  const transformedData = data?.map(item => ({
    ...item,
    genres: item.title_genres?.map((tg: any) => tg.genres?.name).filter(Boolean) || [],
    trending_score: calculateTrendingScore(item)
  })).sort((a, b) => b.trending_score - a.trending_score) || []

  // Cache the result in Redis
  await setCacheWithStats(cacheKey, transformedData, CACHE_TTL.TRENDING)

  return new Response(
    JSON.stringify({ data: transformedData, cached: false }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json', 'X-Cache': 'MISS' } }
  )
}

async function handlePopularContent(contentType: 'anime' | 'manga', limit: number) {
  const cacheKey = CACHE_KEYS.POPULAR(contentType, limit)
  
  const cached = await getCacheWithStats(cacheKey)
  if (cached) {
    return new Response(
      JSON.stringify({ data: cached, cached: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json', 'X-Cache': 'HIT' } }
    )
  }

  const { data, error } = await supabase
    .from('titles')
    .select(`
      *,
      ${contentType === 'anime' ? 'anime_details!inner(*)' : 'manga_details!inner(*)'},
      title_genres(genres(name))
    `)
    .order('favorites', { ascending: false })
    .order('popularity', { ascending: false })
    .limit(limit)

  if (error) throw error

  const transformedData = data?.map(item => ({
    ...item,
    genres: item.title_genres?.map((tg: any) => tg.genres?.name).filter(Boolean) || []
  })) || []

  await setCacheWithStats(cacheKey, transformedData, CACHE_TTL.POPULAR)

  return new Response(
    JSON.stringify({ data: transformedData, cached: false }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json', 'X-Cache': 'MISS' } }
  )
}

async function handleRecentContent(contentType: 'anime' | 'manga', limit: number) {
  const cacheKey = CACHE_KEYS.RECENT(contentType, limit)
  
  const cached = await getCacheWithStats(cacheKey)
  if (cached) {
    return new Response(
      JSON.stringify({ data: cached, cached: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json', 'X-Cache': 'HIT' } }
    )
  }

  const { data, error } = await supabase
    .from('titles')
    .select(`
      *,
      ${contentType === 'anime' ? 'anime_details!inner(*)' : 'manga_details!inner(*)'},
      title_genres(genres(name))
    `)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw error

  const transformedData = data?.map(item => ({
    ...item,
    genres: item.title_genres?.map((tg: any) => tg.genres?.name).filter(Boolean) || []
  })) || []

  await setCacheWithStats(cacheKey, transformedData, CACHE_TTL.RECENT)

  return new Response(
    JSON.stringify({ data: transformedData, cached: false }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json', 'X-Cache': 'MISS' } }
  )
}

async function handleHomepageData() {
  const cacheKey = CACHE_KEYS.HOMEPAGE()
  
  const cached = await getCacheWithStats(cacheKey)
  if (cached) {
    return new Response(
      JSON.stringify({ data: cached, cached: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json', 'X-Cache': 'HIT' } }
    )
  }

  // Fetch all homepage data in parallel
  const [
    trendingAnime,
    popularAnime,
    recentAnime,
    trendingManga,
    popularManga,
    stats
  ] = await Promise.all([
    handleTrendingContent('anime', 10).then(r => r.json()),
    handlePopularContent('anime', 10).then(r => r.json()),
    handleRecentContent('anime', 10).then(r => r.json()),
    handleTrendingContent('manga', 10).then(r => r.json()),
    handlePopularContent('manga', 10).then(r => r.json()),
    getStats()
  ])

  const aggregatedData = {
    trending: {
      anime: trendingAnime.data,
      manga: trendingManga.data
    },
    popular: {
      anime: popularAnime.data,
      manga: popularManga.data
    },
    recent: {
      anime: recentAnime.data
    },
    stats
  }

  await setCacheWithStats(cacheKey, aggregatedData, CACHE_TTL.HOMEPAGE)

  return new Response(
    JSON.stringify({ data: aggregatedData, cached: false }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json', 'X-Cache': 'MISS' } }
  )
}

async function handleSearchResults(query: string, contentType: 'anime' | 'manga' | 'all', limit: number, filters?: any) {
  console.log(`🔍 Search request: "${query}" for contentType: ${contentType}, limit: ${limit}, filters:`, filters)
  
  if (!query || query.length < 2) {
    console.log('⚠️ Query too short or empty')
    return new Response(
      JSON.stringify({ data: [], cached: false }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  const cacheKey = `${CACHE_KEYS.SEARCH(query, contentType, limit)}:${JSON.stringify(filters || {})}`
  
  const cached = await getCacheWithStats(cacheKey)
  if (cached) {
    return new Response(
      JSON.stringify({ data: cached, cached: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json', 'X-Cache': 'HIT' } }
    )
  }

  let data: any[] = []
  let error: any = null

  if (contentType === 'all') {
    // Search both anime and manga
    let animeQuery = supabase
      .from('titles')
      .select(`
        *,
        anime_details!inner(*),
        title_genres(genres(name))
      `)
      .or(`title.ilike.%${query}%,title_english.ilike.%${query}%,title_japanese.ilike.%${query}%`)
    
    let mangaQuery = supabase
      .from('titles')
      .select(`
        *,
        manga_details!inner(*),
        title_genres(genres(name))
      `)
      .or(`title.ilike.%${query}%,title_english.ilike.%${query}%,title_japanese.ilike.%${query}%`)
    
    // Apply streaming platform filter if specified
    if (filters?.streaming_platform) {
      animeQuery = animeQuery.contains('external_links', [{ site: filters.streaming_platform }])
      mangaQuery = mangaQuery.contains('external_links', [{ site: filters.streaming_platform }])
    }
    
    const [animeResult, mangaResult] = await Promise.all([
      animeQuery.order('popularity', { ascending: false }).limit(Math.ceil(limit / 2)),
      mangaQuery.order('popularity', { ascending: false }).limit(Math.ceil(limit / 2))
    ])

    if (animeResult.error || mangaResult.error) {
      error = animeResult.error || mangaResult.error
    } else {
      // Combine and sort results by popularity
      const combinedData = [
        ...((animeResult.data || []).map(item => ({ ...item, type: 'anime' }))),
        ...((mangaResult.data || []).map(item => ({ ...item, type: 'manga' })))
      ]
      
      data = combinedData
        .sort((a, b) => (b.popularity || 0) - (a.popularity || 0))
        .slice(0, limit)
    }
  } else {
    // Search single content type
    let searchQuery = supabase
      .from('titles')
      .select(`
        *,
        ${contentType === 'anime' ? 'anime_details!inner(*)' : 'manga_details!inner(*)'},
        title_genres(genres(name))
      `)
      .or(`title.ilike.%${query}%,title_english.ilike.%${query}%,title_japanese.ilike.%${query}%`)
    
    // Apply streaming platform filter if specified
    if (filters?.streaming_platform) {
      searchQuery = searchQuery.contains('external_links', [{ site: filters.streaming_platform }])
    }
    
    const result = await searchQuery
      .order('popularity', { ascending: false })
      .limit(limit)

    data = result.data || []
    error = result.error
  }

  if (error) throw error

  const transformedData = data.map(item => ({
    ...item,
    genres: item.title_genres?.map((tg: any) => tg.genres?.name).filter(Boolean) || [],
    // Add type for mixed results if not already present
    type: item.type || (item.anime_details ? 'anime' : 'manga')
  }))

  // Cache search results for 3 minutes
  await setCacheWithStats(cacheKey, transformedData, CACHE_TTL.SEARCH)

  return new Response(
    JSON.stringify({ data: transformedData, cached: false }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json', 'X-Cache': 'MISS' } }
  )
}

async function handleGenericContent(
  contentType: 'anime' | 'manga',
  limit: number,
  sort_by: string,
  filters: any
) {
  const cacheKey = `cache:generic:${contentType}:${limit}:${sort_by}:${JSON.stringify(filters)}`
  
  const cached = await getCacheWithStats(cacheKey)
  if (cached) {
    return new Response(
      JSON.stringify({ data: cached, cached: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json', 'X-Cache': 'HIT' } }
    )
  }

  let query = supabase
    .from('titles')
    .select(`
      *,
      ${contentType === 'anime' ? 'anime_details!inner(*)' : 'manga_details!inner(*)'},
      title_genres(genres(name))
    `)

  // Apply filters
  if (filters.search) {
    query = query.or(`title.ilike.%${filters.search}%,title_english.ilike.%${filters.search}%`)
  }
  if (filters.genre) {
    // This would need a more complex join for genre filtering
  }
  if (filters.status) {
    const detailsTable = contentType === 'anime' ? 'anime_details' : 'manga_details'
    query = query.eq(`${detailsTable}.status`, filters.status)
  }

  const { data, error } = await query
    .order(sort_by, { ascending: false })
    .limit(limit)

  if (error) throw error

  const transformedData = data?.map(item => ({
    ...item,
    genres: item.title_genres?.map((tg: any) => tg.genres?.name).filter(Boolean) || []
  })) || []

  await setCacheWithStats(cacheKey, transformedData, CACHE_TTL.POPULAR)

  return new Response(
    JSON.stringify({ data: transformedData, cached: false }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json', 'X-Cache': 'MISS' } }
  )
}

async function getStats() {
  const cacheKey = CACHE_KEYS.STATS()
  
  const cached = await getCacheWithStats(cacheKey)
  if (cached) {
    return cached
  }

  const [animeCount, mangaCount] = await Promise.all([
    supabase.from('titles').select('*', { count: 'exact', head: true }).inner('anime_details'),
    supabase.from('titles').select('*', { count: 'exact', head: true }).inner('manga_details')
  ])

  const stats = {
    animeCount: animeCount.count || 0,
    mangaCount: mangaCount.count || 0,
    userCount: 1250, // This could be fetched from profiles table
    lastUpdated: new Date().toISOString()
  }

  // Cache stats for 1 hour
  await setCacheWithStats(cacheKey, stats, CACHE_TTL.STATS)

  return stats
}

function calculateTrendingScore(item: any): number {
  const now = new Date()
  const createdAt = new Date(item.created_at)
  const daysSinceCreated = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24)
  
  // Enhanced trending score formula
  const recencyBonus = Math.max(0, 30 - daysSinceCreated) * 10
  const scoreBonus = (item.score || 0) * 100
  const anilistScoreBonus = (item.anilist_score || 0) * 80
  const popularityScore = (item.popularity || 0) / 1000
  const favoritesScore = (item.favorites || 0) / 10
  
  // Add bonus for currently airing/publishing
  let statusBonus = 0
  if (item.anime_details) {
    if (item.anime_details.status === 'Currently Airing') statusBonus = 50
    if (item.anime_details.next_episode_date && 
        new Date(item.anime_details.next_episode_date) > now) statusBonus += 30
  } else if (item.manga_details) {
    if (item.manga_details.status === 'Publishing') statusBonus = 40
    if (item.manga_details.next_chapter_date && 
        new Date(item.manga_details.next_chapter_date) > now) statusBonus += 25
  }
  
  return popularityScore + favoritesScore + scoreBonus + anilistScoreBonus + recencyBonus + statusBonus
}

// Cache warming function - automatically called on startup
async function warmCache() {
  console.log('🔥 Starting cache warming...')
  
  const warmingTasks = [
    handleTrendingContent('anime', 20),
    handleTrendingContent('manga', 20),
    handlePopularContent('anime', 20),
    handlePopularContent('manga', 20),
    handleRecentContent('anime', 20),
    handleHomepageData(),
    getStats()
  ]
  
  try {
    await Promise.all(warmingTasks)
    console.log('✅ Cache warming completed')
  } catch (error) {
    console.error('❌ Cache warming failed:', error)
  }
}

// Warm cache on startup
warmCache()