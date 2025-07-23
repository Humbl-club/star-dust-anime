const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { Redis } from "https://deno.land/x/upstash_redis@v1.22.1/mod.ts"

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)

// Redis cache client
const redis = new Redis({
  url: Deno.env.get('UPSTASH_REDIS_URL')!,
  token: Deno.env.get('UPSTASH_REDIS_TOKEN')!,
})

const CACHE_DURATION = 600 // 10 minutes in seconds

// Cache trending content for faster homepage loading
const TRENDING_CACHE_KEY = 'trending_content'
const POPULAR_CACHE_KEY = 'popular_content' 
const RECENT_CACHE_KEY = 'recent_content'

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { endpoint, contentType, limit = 24, sort_by = 'popularity', filters = {} } = await req.json()
    
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
        return await handleSearchResults(filters.query, contentType, limit)
      default:
        return await handleGenericContent(contentType, limit, sort_by, filters)
    }
  } catch (error) {
    console.error('❌ Cache function error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})

async function handleTrendingContent(contentType: 'anime' | 'manga', limit: number) {
  const cacheKey = `cache:${TRENDING_CACHE_KEY}:${contentType}:${limit}`
  
  // Check Redis cache first
  const cached = await redis.get(cacheKey)
  if (cached) {
    console.log(`✅ Cache HIT: ${cacheKey}`)
    await trackCacheStats('hit', cacheKey)
    return new Response(
      JSON.stringify({ data: cached, cached: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json', 'X-Cache': 'HIT' } }
    )
  }

  console.log(`❌ Cache MISS: ${cacheKey}`)
  await trackCacheStats('miss', cacheKey)

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
      popularity,
      favorites,
      year,
      ${contentType === 'anime' ? `
        anime_details!inner(
          episodes,
          status,
          type,
          season,
          aired_from
        )
      ` : `
        manga_details!inner(
          chapters,
          volumes,
          status,
          type,
          published_from
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
  await redis.setex(cacheKey, CACHE_DURATION, JSON.stringify(transformedData))

  return new Response(
    JSON.stringify({ data: transformedData, cached: false }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json', 'X-Cache': 'MISS' } }
  )
}

async function handlePopularContent(contentType: 'anime' | 'manga', limit: number) {
  const cacheKey = `cache:${POPULAR_CACHE_KEY}:${contentType}:${limit}`
  
  const cached = await redis.get(cacheKey)
  if (cached) {
    await trackCacheStats('hit', cacheKey)
    return new Response(
      JSON.stringify({ data: cached, cached: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json', 'X-Cache': 'HIT' } }
    )
  }
  await trackCacheStats('miss', cacheKey)

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

  await redis.setex(cacheKey, CACHE_DURATION, JSON.stringify(transformedData))

  return new Response(
    JSON.stringify({ data: transformedData, cached: false }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json', 'X-Cache': 'MISS' } }
  )
}

async function handleRecentContent(contentType: 'anime' | 'manga', limit: number) {
  const cacheKey = `cache:${RECENT_CACHE_KEY}:${contentType}:${limit}`
  
  const cached = await redis.get(cacheKey)
  if (cached) {
    await trackCacheStats('hit', cacheKey)
    return new Response(
      JSON.stringify({ data: cached, cached: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json', 'X-Cache': 'HIT' } }
    )
  }
  await trackCacheStats('miss', cacheKey)

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

  await redis.setex(cacheKey, CACHE_DURATION, JSON.stringify(transformedData))

  return new Response(
    JSON.stringify({ data: transformedData, cached: false }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json', 'X-Cache': 'MISS' } }
  )
}

async function handleHomepageData() {
  const cacheKey = 'cache:homepage:aggregated'
  
  const cached = await redis.get(cacheKey)
  if (cached) {
    await trackCacheStats('hit', cacheKey)
    return new Response(
      JSON.stringify({ data: cached, cached: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json', 'X-Cache': 'HIT' } }
    )
  }
  await trackCacheStats('miss', cacheKey)

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

  await redis.setex(cacheKey, CACHE_DURATION, JSON.stringify(aggregatedData))

  return new Response(
    JSON.stringify({ data: aggregatedData, cached: false }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json', 'X-Cache': 'MISS' } }
  )
}

async function handleSearchResults(query: string, contentType: 'anime' | 'manga', limit: number) {
  if (!query || query.length < 2) {
    return new Response(
      JSON.stringify({ data: [], cached: false }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  const cacheKey = `cache:search:${query}:${contentType}:${limit}`
  
  const cached = await redis.get(cacheKey)
  if (cached) {
    await trackCacheStats('hit', cacheKey)
    return new Response(
      JSON.stringify({ data: cached, cached: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json', 'X-Cache': 'HIT' } }
    )
  }
  await trackCacheStats('miss', cacheKey)

  const { data, error } = await supabase
    .from('titles')
    .select(`
      *,
      ${contentType === 'anime' ? 'anime_details!inner(*)' : 'manga_details!inner(*)'},
      title_genres(genres(name))
    `)
    .or(`title.ilike.%${query}%,title_english.ilike.%${query}%,title_japanese.ilike.%${query}%`)
    .order('popularity', { ascending: false })
    .limit(limit)

  if (error) throw error

  const transformedData = data?.map(item => ({
    ...item,
    genres: item.title_genres?.map((tg: any) => tg.genres?.name).filter(Boolean) || []
  })) || []

  // Cache search results for 5 minutes
  await redis.setex(cacheKey, 300, JSON.stringify(transformedData))

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
  
  const cached = await redis.get(cacheKey)
  if (cached) {
    await trackCacheStats('hit', cacheKey)
    return new Response(
      JSON.stringify({ data: cached, cached: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json', 'X-Cache': 'HIT' } }
    )
  }
  await trackCacheStats('miss', cacheKey)

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

  await redis.setex(cacheKey, CACHE_DURATION, JSON.stringify(transformedData))

  return new Response(
    JSON.stringify({ data: transformedData, cached: false }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json', 'X-Cache': 'MISS' } }
  )
}

async function getStats() {
  const cacheKey = 'cache:stats:site'
  
  const cached = await redis.get(cacheKey)
  if (cached) {
    await trackCacheStats('hit', cacheKey)
    return cached
  }
  await trackCacheStats('miss', cacheKey)

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

  // Cache stats for 30 minutes
  await redis.setex(cacheKey, 1800, JSON.stringify(stats))

  return stats
}

function calculateTrendingScore(item: any): number {
  const now = new Date()
  const createdAt = new Date(item.created_at)
  const daysSinceCreated = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24)
  
  // Trending score formula: popularity + favorites + recency bonus
  const recencyBonus = Math.max(0, 30 - daysSinceCreated) * 10
  const scoreBonus = (item.score || 0) * 100
  const popularityScore = (item.popularity || 0) / 1000
  const favoritesScore = (item.favorites || 0) / 10
  
  return popularityScore + favoritesScore + scoreBonus + recencyBonus
}

// Cache statistics tracking
async function trackCacheStats(type: 'hit' | 'miss', cacheKey: string) {
  try {
    const statsKey = `cache:stats:${type}:${new Date().toISOString().substring(0, 10)}`
    await redis.incr(statsKey)
    await redis.expire(statsKey, 86400 * 7) // Keep stats for 7 days
    
    // Track cache key usage
    const keyStatsKey = `cache:key_stats:${cacheKey}`
    await redis.incr(keyStatsKey)
    await redis.expire(keyStatsKey, 86400) // Reset daily
  } catch (error) {
    console.error('Failed to track cache stats:', error)
  }
}

// Cache warming function
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