import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  console.log('🚀 Function invoked!')
  
  if (req.method === 'OPTIONS') {
    console.log('✅ OPTIONS request handled')
    return new Response(null, { headers: corsHeaders })
  }

  try {
    console.log('🔧 Initializing Supabase client...')
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    console.log('📊 Getting current count...')
    const { count: beforeCount, error: countError } = await supabase
      .from('titles')
      .select('id', { count: 'exact' })

    if (countError) {
      console.error('❌ Count query error:', countError)
      throw new Error(`Count query failed: ${countError.message}`)
    }

    console.log(`📊 Current count: ${beforeCount}`)

    console.log('🌐 Testing AniList API...')
    const testResponse = await fetch('https://graphql.anilist.co', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        query: `
          query {
            Page(page: 1, perPage: 3) {
              media(type: ANIME, sort: [POPULARITY_DESC]) {
                id
                title {
                  romaji
                  english
                }
              }
            }
          }
        `
      })
    })

    if (!testResponse.ok) {
      throw new Error(`AniList API test failed: ${testResponse.status}`)
    }

    const testData = await testResponse.json()
    console.log(`✅ AniList API working. Got ${testData.data?.Page?.media?.length} test items`)

    // Try to add just ONE new anime to prove it works
    const items = testData.data?.Page?.media || []
    let addedCount = 0

    for (const item of items) {
      console.log(`🔍 Checking anime ID ${item.id}: ${item.title?.romaji}`)
      
      const { data: exists, error: checkError } = await supabase
        .from('titles')
        .select('id')
        .eq('anilist_id', item.id)
        .single()

      if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows found
        console.error('❌ Check error:', checkError)
        continue
      }

      if (!exists) {
        console.log(`➕ Adding new anime: ${item.title?.romaji}`)
        
        const { data: newTitle, error: insertError } = await supabase
          .from('titles')
          .insert({
            anilist_id: item.id,
            title: item.title?.romaji || item.title?.english || 'Unknown Title',
            title_english: item.title?.english,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select('id')
          .single()

        if (insertError) {
          console.error(`❌ Insert error for ${item.id}:`, insertError)
          continue
        }

        console.log(`✅ Successfully added: ${item.title?.romaji} with ID ${newTitle.id}`)
        addedCount++
        break // Just add one for this test
      } else {
        console.log(`⏭️ Already exists: ${item.title?.romaji}`)
      }
    }

    // Get new count
    const { count: afterCount } = await supabase
      .from('titles')
      .select('id', { count: 'exact' })

    const growth = (afterCount || 0) - (beforeCount || 0)
    
    console.log(`🎉 Test complete! Before: ${beforeCount}, After: ${afterCount}, Growth: ${growth}`)

    return new Response(
      JSON.stringify({
        success: true,
        before: beforeCount,
        after: afterCount,
        growth,
        added: addedCount,
        message: `Successfully processed. Database grew by ${growth} titles.`
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('💥 Function error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        stack: error.stack
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})