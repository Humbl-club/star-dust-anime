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

    console.log('🎯 BULK SYNC: Adding 10 anime titles...')

    // Get current count
    const { count: beforeCount } = await supabase
      .from('titles')
      .select('id', { count: 'exact' })

    console.log(`📊 Before: ${beforeCount} titles`)

    let addedCount = 0
    let page = 1
    const maxPages = 5

    while (addedCount < 10 && page <= maxPages) {
      console.log(`📄 Processing page ${page}...`)

      // Get anime from AniList
      const anilistQuery = `
        query($page: Int) {
          Page(page: $page, perPage: 20) {
            media(type: ANIME, sort: [POPULARITY_DESC]) {
              id
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
              season
              format
              status
              episodes
              coverImage {
                large
                color
              }
              genres
              averageScore
              popularity
              favourites
              studios {
                nodes {
                  name
                }
              }
            }
          }
        }
      `

      const anilistResponse = await fetch('https://graphql.anilist.co', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ 
          query: anilistQuery,
          variables: { page }
        })
      })

      if (!anilistResponse.ok) {
        throw new Error(`AniList API failed: ${anilistResponse.status}`)
      }

      const anilistData = await anilistResponse.json()
      const items = anilistData.data?.Page?.media || []
      
      console.log(`📦 Got ${items.length} anime from page ${page}`)

      for (const item of items) {
        if (addedCount >= 10) break

        // Check if already exists
        const { data: exists } = await supabase
          .from('titles')
          .select('id')
          .eq('anilist_id', item.id)
          .single()

        if (!exists) {
          console.log(`➕ Adding: ${item.title?.romaji} (ID: ${item.id})`)
          
          // Insert title
          const { data: newTitle, error: titleError } = await supabase
            .from('titles')
            .insert({
              anilist_id: item.id,
              title: item.title?.romaji || item.title?.english || 'Unknown',
              title_english: item.title?.english,
              title_japanese: item.title?.native,
              synopsis: item.description?.replace(/<[^>]*>/g, '')?.slice(0, 2000), // Limit synopsis length
              image_url: item.coverImage?.large,
              score: item.averageScore,
              popularity: item.popularity,
              favorites: item.favourites,
              year: item.startDate?.year,
              color_theme: item.coverImage?.color
            })
            .select('id')
            .single()

          if (titleError) {
            console.error(`❌ Title error for ${item.id}:`, titleError.message)
            continue
          }

          // Insert anime details
          const { error: detailError } = await supabase
            .from('anime_details')
            .insert({
              title_id: newTitle.id,
              episodes: item.episodes,
              season: item.season,
              status: item.status === 'FINISHED' ? 'Finished Airing' : 
                      item.status === 'RELEASING' ? 'Currently Airing' : 'Not yet aired',
              type: item.format || 'TV',
              last_sync_check: new Date().toISOString()
            })

          if (detailError) {
            console.error(`⚠️ Detail error for ${item.id}:`, detailError.message)
          }

          // Add genres if any
          if (item.genres && item.genres.length > 0) {
            for (const genreName of item.genres.slice(0, 5)) { // Limit to 5 genres
              // Get or create genre
              let { data: genre } = await supabase
                .from('genres')
                .select('id')
                .eq('name', genreName)
                .single()

              if (!genre) {
                const { data: newGenre } = await supabase
                  .from('genres')
                  .insert({ name: genreName, type: 'anime' })
                  .select('id')
                  .single()
                genre = newGenre
              }

              if (genre) {
                // Link title to genre
                await supabase
                  .from('title_genres')
                  .insert({
                    title_id: newTitle.id,
                    genre_id: genre.id
                  })
                  .on('conflict', 'do nothing') // Ignore if already exists
              }
            }
          }

          addedCount++
          console.log(`✅ Added ${addedCount}/10: ${item.title?.romaji}`)

          // Small delay to avoid rate limits
          await new Promise(resolve => setTimeout(resolve, 500))
        } else {
          console.log(`⏭️ Skipping existing: ${item.title?.romaji}`)
        }
      }

      page++
      
      // Delay between pages
      await new Promise(resolve => setTimeout(resolve, 1000))
    }

    // Get final count
    const { count: afterCount } = await supabase
      .from('titles')
      .select('id', { count: 'exact' })

    const totalGrowth = (afterCount || 0) - (beforeCount || 0)
    
    console.log(`🎉 BULK SYNC COMPLETE: Added ${addedCount} new titles (total growth: ${totalGrowth})`)

    return new Response(
      JSON.stringify({
        success: true,
        before: beforeCount,
        after: afterCount,
        added: addedCount,
        totalGrowth,
        targetReached: addedCount >= 10
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('💥 Bulk sync failed:', error)
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