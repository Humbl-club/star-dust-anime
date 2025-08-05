import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface KitsuData {
  id: string
  attributes: {
    canonicalTitle?: string
    titles?: {
      en?: string
      en_jp?: string
      ja_jp?: string
    }
    synopsis?: string
    posterImage?: {
      large?: string
    }
    averageRating?: string
    popularityRank?: number
    ratingRank?: number
    startDate?: string
    endDate?: string
    status?: string
    subtype?: string
    episodeCount?: number
    chapterCount?: number
    volumeCount?: number
  }
  relationships?: {
    genres?: {
      data?: Array<{ id: string }>
    }
    animeProductions?: {
      data?: Array<{ id: string }>
    }
    characters?: {
      data?: Array<{ id: string }>
    }
  }
}

const KITSU_API_BASE = 'https://kitsu.io/api/edge'

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { contentType = 'anime', limit = 20, daysBack = 7 } = await req.json()
    
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    console.log(`🔄 Starting Kitsu reconciliation for ${contentType}`)
    console.log(`📊 Processing ${limit} items updated in last ${daysBack} days`)

    // Calculate date filter
    const sinceDate = new Date()
    sinceDate.setDate(sinceDate.getDate() - daysBack)
    const sinceISOString = sinceDate.toISOString()

    // Fetch recent updates from Kitsu
    const kitsuEndpoint = contentType === 'anime' ? 'anime' : 'manga'
    const kitsuUrl = `${KITSU_API_BASE}/${kitsuEndpoint}?page[limit]=${limit}&sort=-updatedAt&filter[updatedAt]=${sinceISOString}&include=genres`

    console.log(`🌐 Fetching from Kitsu: ${kitsuUrl}`)

    const response = await fetch(kitsuUrl, {
      headers: {
        'Accept': 'application/vnd.api+json',
        'Content-Type': 'application/vnd.api+json'
      }
    })

    if (!response.ok) {
      throw new Error(`Kitsu API error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    
    if (!data.data || !Array.isArray(data.data)) {
      throw new Error('Invalid response from Kitsu API')
    }

    console.log(`📊 Received ${data.data.length} items from Kitsu`)

    let processedCount = 0
    let confidentMatches = 0
    let uncertainMatches = 0
    let newItems = 0
    let errors: string[] = []

    for (const item of data.data) {
      try {
        const result = await processKitsuItem(supabaseClient, item, contentType)
        
        switch (result.action) {
          case 'confident_match':
            confidentMatches++
            break
          case 'uncertain_match':
            uncertainMatches++
            break
          case 'new_item':
            newItems++
            break
        }
        
        processedCount++
        console.log(`✅ Processed Kitsu item ${item.id}: ${result.action}`)
        
      } catch (error) {
        const errorMsg = `Failed to process Kitsu item ${item.id}: ${error.message}`
        console.error(`❌ ${errorMsg}`)
        errors.push(errorMsg)
      }
    }

    const result = {
      success: true,
      contentType,
      processedCount,
      confidentMatches,
      uncertainMatches,
      newItems,
      errors: errors.slice(0, 5),
      errorCount: errors.length
    }

    console.log(`✅ Kitsu reconciliation completed: ${JSON.stringify(result)}`)

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    console.error('❌ Kitsu reconciliation failed:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})

async function processKitsuItem(supabase: any, item: KitsuData, contentType: string) {
  const attrs = item.attributes
  
  // Extract title information
  const titles = {
    main: attrs.canonicalTitle || 'Unknown Title',
    english: attrs.titles?.en || attrs.titles?.en_jp,
    japanese: attrs.titles?.ja_jp
  }

  console.log(`🔍 Processing: ${titles.main}`)

  // Check if we already have this Kitsu item
  const { data: existingByKitsu } = await supabase
    .from('titles')
    .select('id')
    .eq('id_kitsu', parseInt(item.id))
    .single()

  if (existingByKitsu) {
    console.log(`📝 Updating existing Kitsu item ${item.id}`)
    await updateExistingTitle(supabase, existingByKitsu.id, item, contentType)
    return { action: 'confident_match', titleId: existingByKitsu.id }
  }

  // Use fuzzy search to find potential matches
  const { data: potentialMatches, error: searchError } = await supabase.rpc('find_fuzzy_title_matches', {
    search_title: titles.main,
    search_title_english: titles.english,
    search_title_japanese: titles.japanese,
    content_type_filter: contentType,
    limit_results: 5,
    min_similarity: 0.3
  })

  if (searchError) {
    throw new Error(`Fuzzy search failed: ${searchError.message}`)
  }

  console.log(`🎯 Found ${potentialMatches?.length || 0} potential matches`)

  // Decision logic based on match confidence
  if (potentialMatches && potentialMatches.length > 0) {
    const bestMatch = potentialMatches[0]
    
    if (bestMatch.similarity_score >= 0.8) {
      // High confidence match - update existing record
      console.log(`🎯 High confidence match (${bestMatch.similarity_score}): ${bestMatch.title}`)
      
      await updateExistingTitle(supabase, bestMatch.title_id, item, contentType)
      
      // Update the Kitsu ID for future reference
      const { error: updateError } = await supabase
        .from('titles')
        .update({ id_kitsu: parseInt(item.id) })
        .eq('id', bestMatch.title_id)
      
      if (updateError) {
        throw new Error(`Failed to update Kitsu ID: ${updateError.message}`)
      }

      return { action: 'confident_match', titleId: bestMatch.title_id }
      
    } else if (bestMatch.similarity_score >= 0.5) {
      // Uncertain match - add to pending review
      console.log(`❓ Uncertain match (${bestMatch.similarity_score}): ${bestMatch.title}`)
      
      await addToPendingMatches(supabase, item, potentialMatches, contentType)
      return { action: 'uncertain_match', pendingId: item.id }
    }
  }

  // No good matches found - create new item
  console.log(`✨ Creating new item: ${titles.main}`)
  const titleId = await createNewTitle(supabase, item, contentType)
  return { action: 'new_item', titleId }
}

async function updateExistingTitle(supabase: any, titleId: string, item: KitsuData, contentType: string) {
  const attrs = item.attributes
  
  // Prepare updated data
  const titleUpdates = {
    id_kitsu: parseInt(item.id),
    // Only update fields that might be more current from Kitsu
    score: attrs.averageRating ? parseFloat(attrs.averageRating) / 10 : null,
    rank: attrs.ratingRank,
    popularity: attrs.popularityRank,
    updated_at: new Date().toISOString()
  }

  // Update the title
  const { error: titleError } = await supabase
    .from('titles')
    .update(titleUpdates)
    .eq('id', titleId)

  if (titleError) {
    throw new Error(`Failed to update title: ${titleError.message}`)
  }

  // Update content-specific details
  if (contentType === 'anime') {
    const animeUpdates = {
      episodes: attrs.episodeCount,
      status: attrs.status,
      type: attrs.subtype,
      updated_at: new Date().toISOString()
    }

    const { error: animeError } = await supabase
      .from('anime_details')
      .update(animeUpdates)
      .eq('title_id', titleId)

    if (animeError) {
      throw new Error(`Failed to update anime details: ${animeError.message}`)
    }
  } else {
    const mangaUpdates = {
      chapters: attrs.chapterCount,
      volumes: attrs.volumeCount,
      status: attrs.status,
      type: attrs.subtype,
      updated_at: new Date().toISOString()
    }

    const { error: mangaError } = await supabase
      .from('manga_details')
      .update(mangaUpdates)
      .eq('title_id', titleId)

    if (mangaError) {
      throw new Error(`Failed to update manga details: ${mangaError.message}`)
    }
  }
}

async function addToPendingMatches(supabase: any, item: KitsuData, matches: any[], contentType: string) {
  const attrs = item.attributes
  
  const pendingData = {
    kitsu_id: parseInt(item.id),
    title: attrs.canonicalTitle || 'Unknown Title',
    title_english: attrs.titles?.en || attrs.titles?.en_jp,
    title_japanese: attrs.titles?.ja_jp,
    synopsis: attrs.synopsis,
    image_url: attrs.posterImage?.large,
    score: attrs.averageRating ? parseFloat(attrs.averageRating) / 10 : null,
    year: attrs.startDate ? new Date(attrs.startDate).getFullYear() : null,
    content_type: contentType,
    potential_matches: matches,
    confidence_score: matches[0]?.similarity_score || 0
  }

  const { error } = await supabase
    .from('pending_matches')
    .insert(pendingData)

  if (error) {
    throw new Error(`Failed to create pending match: ${error.message}`)
  }
}

async function createNewTitle(supabase: any, item: KitsuData, contentType: string) {
  const attrs = item.attributes
  
  // Prepare title data
  const titleData = {
    id_kitsu: parseInt(item.id),
    title: attrs.canonicalTitle || 'Unknown Title',
    title_english: attrs.titles?.en || attrs.titles?.en_jp,
    title_japanese: attrs.titles?.ja_jp,
    synopsis: attrs.synopsis,
    image_url: attrs.posterImage?.large,
    score: attrs.averageRating ? parseFloat(attrs.averageRating) / 10 : null,
    rank: attrs.ratingRank,
    popularity: attrs.popularityRank,
    year: attrs.startDate ? new Date(attrs.startDate).getFullYear() : null
  }

  // Prepare content-specific data
  let animeData = null
  let mangaData = null

  if (contentType === 'anime') {
    animeData = {
      episodes: attrs.episodeCount,
      aired_from: attrs.startDate,
      aired_to: attrs.endDate,
      status: attrs.status,
      type: attrs.subtype
    }
  } else {
    mangaData = {
      chapters: attrs.chapterCount,
      volumes: attrs.volumeCount,
      published_from: attrs.startDate,
      published_to: attrs.endDate,
      status: attrs.status,
      type: attrs.subtype
    }
  }

  // Use the helper function to create the new title
  const { data: newTitleId, error } = await supabase.rpc('insert_title_with_details', {
    title_data: titleData,
    anime_data: animeData,
    manga_data: mangaData,
    genre_names: [], // Kitsu genres would need separate API calls
    studio_names: [],
    author_names: []
  })

  if (error) {
    throw new Error(`Failed to create new title: ${error.message}`)
  }

  return newTitleId
}