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

    console.log('🧪 Starting simple sync test...')

    // Get initial count
    const { count: initialCount } = await supabase
      .from('titles')
      .select('id', { count: 'exact' })

    console.log(`📊 Initial count: ${initialCount}`)

    // Test ultra-fast-sync with 1 page
    const { data, error } = await supabase.functions.invoke('ultra-fast-sync', {
      body: { contentType: 'anime', maxPages: 1 }
    })

    console.log('🔧 Function invocation result:', { data, error })

    if (error) {
      console.error('❌ Function error:', error)
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: error.message,
          initialCount 
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get final count
    const { count: finalCount } = await supabase
      .from('titles')
      .select('id', { count: 'exact' })

    const growth = (finalCount || 0) - (initialCount || 0)

    console.log(`📈 Final count: ${finalCount}, Growth: ${growth}`)

    return new Response(
      JSON.stringify({
        success: true,
        initialCount,
        finalCount,
        growth,
        functionResult: data,
        message: `Test completed: ${growth} new titles added`
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('💥 Test sync error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})