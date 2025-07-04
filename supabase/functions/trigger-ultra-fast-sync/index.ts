import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    console.log('🚀 Triggering ultra-fast sync for both anime and manga...')

    // Start both syncs in parallel for maximum speed
    const promises = [
      supabase.functions.invoke('ultra-fast-sync', {
        body: { contentType: 'anime', maxPages: 30 }
      }),
      supabase.functions.invoke('ultra-fast-sync', {
        body: { contentType: 'manga', maxPages: 25 }
      })
    ]

    const results = await Promise.allSettled(promises)
    
    const animeResult = results[0]
    const mangaResult = results[1]

    let totalProcessed = 0
    const responses = []

    if (animeResult.status === 'fulfilled' && !animeResult.value.error) {
      const animeData = animeResult.value.data
      totalProcessed += animeData?.totalProcessed || 0
      responses.push({
        type: 'anime',
        status: 'success',
        data: animeData
      })
      console.log('✅ Anime sync completed:', animeData)
    } else {
      responses.push({
        type: 'anime',
        status: 'error',
        error: animeResult.status === 'rejected' ? animeResult.reason : animeResult.value.error
      })
      console.error('❌ Anime sync failed:', animeResult)
    }

    if (mangaResult.status === 'fulfilled' && !mangaResult.value.error) {
      const mangaData = mangaResult.value.data
      totalProcessed += mangaData?.totalProcessed || 0
      responses.push({
        type: 'manga',
        status: 'success',
        data: mangaData
      })
      console.log('✅ Manga sync completed:', mangaData)
    } else {
      responses.push({
        type: 'manga',
        status: 'error',
        error: mangaResult.status === 'rejected' ? mangaResult.reason : mangaResult.value.error
      })
      console.error('❌ Manga sync failed:', mangaResult)
    }

    console.log(`🎉 Ultra-fast sync trigger completed! Total items processed: ${totalProcessed}`)

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Ultra-fast sync triggered successfully',
        totalProcessed,
        results: responses,
        timestamp: new Date().toISOString()
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Ultra-fast sync trigger error:', error)
    return new Response(
      JSON.stringify({
        error: 'Failed to trigger ultra-fast sync',
        details: error.message
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})