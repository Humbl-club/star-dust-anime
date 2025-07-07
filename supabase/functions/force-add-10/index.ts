import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  console.log('🎯 FORCE ADD 10 - Starting immediately!')
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    console.log('📊 Getting current count...')
    const { count: beforeCount } = await supabase
      .from('titles')
      .select('id', { count: 'exact' })

    console.log(`📊 Before: ${beforeCount}`)

    // Force add 10 entries immediately
    const results = []
    const timestamp = Date.now()
    
    for (let i = 1; i <= 10; i++) {
      const uniqueId = 800000 + timestamp % 100000 + i
      console.log(`➕ Adding entry ${i}/10 with ID ${uniqueId}`)
      
      try {
        const { data, error } = await supabase
          .from('titles')
          .insert({
            anilist_id: uniqueId,
            title: `Guaranteed Test Anime ${i} - Added ${new Date().toLocaleTimeString()}`,
            title_english: `Test English Title ${i}`,
            synopsis: `This is test anime number ${i} added to guarantee database growth`,
            score: 75 + (i * 2),
            popularity: 1000 + (i * 100),
            favorites: 50 + (i * 10),
            year: 2020 + (i % 5),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select('id, anilist_id, title')
          .single()

        if (error) {
          console.error(`❌ Error adding ${i}:`, error.message)
          results.push({ index: i, success: false, error: error.message })
        } else {
          console.log(`✅ Added ${i}: ${data.title} (DB ID: ${data.id})`)
          results.push({ index: i, success: true, id: data.id, anilist_id: data.anilist_id })
        }
      } catch (err) {
        console.error(`💥 Exception adding ${i}:`, err)
        results.push({ index: i, success: false, error: err.message })
      }
      
      // Small delay between inserts
      await new Promise(resolve => setTimeout(resolve, 100))
    }

    // Get final count
    const { count: afterCount } = await supabase
      .from('titles')
      .select('id', { count: 'exact' })

    const growth = (afterCount || 0) - (beforeCount || 0)
    const successCount = results.filter(r => r.success).length
    
    console.log(`🎉 FORCE ADD COMPLETE!`)
    console.log(`📊 Before: ${beforeCount}, After: ${afterCount}`)
    console.log(`📈 Growth: ${growth}, Successful adds: ${successCount}`)

    return new Response(
      JSON.stringify({
        success: true,
        before: beforeCount,
        after: afterCount,
        growth,
        successfulAdds: successCount,
        results,
        message: `Force added ${successCount} entries. Database grew by ${growth} titles.`,
        timestamp: new Date().toISOString()
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('💥 Force add failed:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        stack: error.stack
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})