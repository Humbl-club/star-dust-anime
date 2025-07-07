import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  console.log('🔥 DIRECT DATABASE TEST - Function called!')
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    console.log('📊 Getting count...')
    const { count: beforeCount } = await supabase
      .from('titles')
      .select('id', { count: 'exact' })

    console.log(`Before: ${beforeCount}`)

    // Add 10 simple test entries with unique anilist_ids
    let added = 0
    const baseId = 999000 + Date.now() % 1000 // Generate unique base ID

    for (let i = 0; i < 10; i++) {
      const testId = baseId + i
      console.log(`Adding test entry ${i + 1}/10 with anilist_id: ${testId}`)
      
      const { data, error } = await supabase
        .from('titles')
        .insert({
          anilist_id: testId,
          title: `Test Anime ${i + 1} - ${Date.now()}`,
          title_english: `Test English ${i + 1}`,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select('id')
        .single()

      if (error) {
        console.error(`Error adding ${i + 1}:`, error.message)
      } else {
        console.log(`✅ Added test entry ${i + 1}: ${data.id}`)
        added++
      }
    }

    const { count: afterCount } = await supabase
      .from('titles')
      .select('id', { count: 'exact' })

    const growth = (afterCount || 0) - (beforeCount || 0)
    console.log(`🎉 Results: Before=${beforeCount}, After=${afterCount}, Added=${added}, Growth=${growth}`)

    return new Response(
      JSON.stringify({
        success: true,
        before: beforeCount,
        after: afterCount,
        added,
        growth,
        message: `Direct test: Added ${added} entries, database grew by ${growth}`
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('💥 Error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})