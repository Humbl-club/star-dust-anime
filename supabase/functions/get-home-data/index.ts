import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)

Deno.serve(async (req) => {
  console.log('🏠 Home data function started', req.method, req.url)
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { sections, limit = 20 } = await req.json()
    console.log('📊 Requested sections:', sections, 'Limit:', limit)
    
    const results: Record<string, any> = {}
    
    // Fetch trending anime
    if (sections.includes('trending-anime')) {
      console.log('🔥 Fetching trending anime...')
      const { data, error } = await supabase.rpc('get_trending_anime', { 
        limit_param: limit 
      })
      if (error) {
        console.error('❌ Trending anime error:', error)
      } else {
        results.trendingAnime = data || []
        console.log('✅ Trending anime fetched:', data?.length || 0, 'items')
      }
    }
    
    // Fetch trending manga
    if (sections.includes('trending-manga')) {
      console.log('🔥 Fetching trending manga...')
      const { data, error } = await supabase.rpc('get_trending_manga', { 
        limit_param: limit 
      })
      if (error) {
        console.error('❌ Trending manga error:', error)
      } else {
        results.trendingManga = data || []
        console.log('✅ Trending manga fetched:', data?.length || 0, 'items')
      }
    }
    
    // Fetch recent anime
    if (sections.includes('recent-anime')) {
      console.log('🆕 Fetching recent anime...')
      const { data, error } = await supabase.rpc('get_recent_anime', { 
        limit_param: limit 
      })
      if (error) {
        console.error('❌ Recent anime error:', error)
      } else {
        results.recentAnime = data || []
        console.log('✅ Recent anime fetched:', data?.length || 0, 'items')
      }
    }
    
    // Fetch recent manga
    if (sections.includes('recent-manga')) {
      console.log('🆕 Fetching recent manga...')
      const { data, error } = await supabase.rpc('get_recent_manga', { 
        limit_param: limit 
      })
      if (error) {
        console.error('❌ Recent manga error:', error)
      } else {
        results.recentManga = data || []
        console.log('✅ Recent manga fetched:', data?.length || 0, 'items')
      }
    }
    
    console.log('🎯 Home data response prepared with', Object.keys(results).length, 'sections')
    
    return new Response(JSON.stringify({
      success: true,
      data: results,
      cached_at: new Date().toISOString()
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=300' // 5 minute cache
      }
    })
  } catch (error) {
    console.error('💥 Home data function error:', error)
    return new Response(JSON.stringify({
      error: 'Failed to fetch home data',
      details: error.message
    }), { 
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})