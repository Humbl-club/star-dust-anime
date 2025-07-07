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

    console.log('🎯 DIRECT TEST: Running minimal anime sync...')

    // Get count before
    const { count: beforeCount } = await supabase
      .from('titles')
      .select('id', { count: 'exact' })

    console.log(`📊 Before: ${beforeCount} titles`)

    // Direct AniList API call
    const anilistQuery = `
      query {
        Page(page: 1, perPage: 5) {
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

    console.log('🔗 Calling AniList API...')
    const anilistResponse = await fetch('https://graphql.anilist.co', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({ query: anilistQuery })
    })

    if (!anilistResponse.ok) {
      throw new Error(`AniList API failed: ${anilistResponse.status}`)
    }

    const anilistData = await anilistResponse.json()
    console.log(`📦 Got ${anilistData.data?.Page?.media?.length || 0} anime from AniList`)

    if (!anilistData.data?.Page?.media?.length) {
      throw new Error('No data from AniList')
    }

    // Process one item
    const item = anilistData.data.Page.media[0]
    console.log(`🔄 Processing: ${item.title?.romaji} (ID: ${item.id})`)

    // Check if exists
    const { data: existingTitle } = await supabase
      .from('titles')
      .select('id')
      .eq('anilist_id', item.id)
      .single()

    let result = { added: false, updated: false }

    if (existingTitle) {
      console.log('📝 Title exists, updating...')
      const { error } = await supabase
        .from('titles')
        .update({
          title: item.title?.romaji || item.title?.english || 'Unknown',
          title_english: item.title?.english,
          title_japanese: item.title?.native,
          synopsis: item.description?.replace(/<[^>]*>/g, ''),
          image_url: item.coverImage?.large,
          score: item.averageScore,
          popularity: item.popularity,
          favorites: item.favourites,
          year: item.startDate?.year,
          color_theme: item.coverImage?.color,
          updated_at: new Date().toISOString()
        })
        .eq('anilist_id', item.id)

      if (error) throw error
      result.updated = true
    } else {
      console.log('➕ Adding new title...')
      const { data: newTitle, error } = await supabase
        .from('titles')
        .insert({
          anilist_id: item.id,
          title: item.title?.romaji || item.title?.english || 'Unknown',
          title_english: item.title?.english,
          title_japanese: item.title?.native,
          synopsis: item.description?.replace(/<[^>]*>/g, ''),
          image_url: item.coverImage?.large,
          score: item.averageScore,
          popularity: item.popularity,
          favorites: item.favourites,
          year: item.startDate?.year,
          color_theme: item.coverImage?.color
        })
        .select('id')
        .single()

      if (error) throw error
      result.added = true

      // Add anime details
      console.log('📝 Adding anime details...')
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

      if (detailError) console.error('Detail error:', detailError)
    }

    // Get count after
    const { count: afterCount } = await supabase
      .from('titles')
      .select('id', { count: 'exact' })

    const growth = (afterCount || 0) - (beforeCount || 0)
    console.log(`📈 After: ${afterCount} titles (+${growth})`)

    return new Response(
      JSON.stringify({
        success: true,
        before: beforeCount,
        after: afterCount,
        growth,
        result,
        item: {
          id: item.id,
          title: item.title?.romaji,
          status: item.status
        }
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('💥 Test failed:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})