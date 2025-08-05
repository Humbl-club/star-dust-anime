// supabase/functions/kitsu-sync-engine-enhanced/index.ts
// PERMANENT INFRASTRUCTURE - Enhanced with full metadata support
// This handles ratings AND comprehensive metadata updates from Kitsu

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const KITSU_API_URL = 'https://kitsu.io/api/edge'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)

// Helper function to create slug
function createSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

// Enhanced Kitsu data fetching with relationships
async function fetchKitsuWithRelationships(
  contentType: string, 
  offset: number = 0,
  includeRelationships: boolean = true
): Promise<any> {
  const params = new URLSearchParams({
    'page[limit]': '10', // Reduced due to more data
    'page[offset]': offset.toString(),
    'sort': '-updatedAt',
    'filter[subtype]': contentType === 'anime' ? 'TV,movie,OVA,ONA,special' : 'manga,novel,manhua,manhwa,doujin,oneshot',
  })

  // Base fields
  const baseFields = 'canonicalTitle,titles,averageRating,userCount,favoritesCount,popularityRank,ratingRank,slug,synopsis,startDate,endDate,status,episodeCount,chapterCount,volumeCount,subtype,posterImage,coverImage'
  
  params.set(`fields[${contentType}]`, baseFields)

  // Include relationships if requested
  if (includeRelationships) {
    params.append('include', 'genres,categories,castings,productions,staff,mediaRelationships')
    
    // Genre fields
    params.set('fields[genres]', 'name,slug,description')
    
    // Category fields (similar to tags)
    params.set('fields[categories]', 'title,slug,description,nsfw,childCount')
    
    // Production companies (studios)
    params.set('fields[producers]', 'name,slug')
    
    // Staff relationships
    params.set('fields[anime-staff]', 'role')
    params.set('fields[people]', 'name,slug,image,birthday,description')
    
    // Character relationships
    params.set('fields[characters]', 'name,slug,image,description')
    params.set('fields[castings]', 'role,voiceActor,language')
  }

  const response = await fetch(`${KITSU_API_URL}/${contentType}?${params}`, {
    method: 'GET',
    headers: {
      'Accept': 'application/vnd.api+json',
      'Content-Type': 'application/vnd.api+json'
    }
  })

  if (!response.ok) {
    throw new Error(`Kitsu API error: ${response.status}`)
  }

  return await response.json()
}

// Process Kitsu genres
async function processKitsuGenres(kitsuData: any, titleId: string) {
  if (!kitsuData.relationships?.genres?.data) return

  // Fetch genre details if not included
  const genreIds = kitsuData.relationships.genres.data.map((g: any) => g.id).join(',')
  
  if (genreIds) {
    const genreResponse = await fetch(`${KITSU_API_URL}/genres?filter[id]=${genreIds}`, {
      headers: {
        'Accept': 'application/vnd.api+json',
      }
    })

    if (genreResponse.ok) {
      const genreData = await genreResponse.json()
      
      for (const genre of genreData.data) {
        try {
          // Check if genre exists
          let { data: existingGenre } = await supabase
            .from('genres')
            .select('id')
            .eq('slug', genre.attributes.slug)
            .maybeSingle()

          if (!existingGenre) {
            // Create new genre with proper fields
            const { data: newGenre } = await supabase
              .from('genres')
              .insert({
                name: genre.attributes.name,
                slug: genre.attributes.slug,
                type: 'both' // Kitsu genres work for both anime and manga
              })
              .select()
              .single()
            
            existingGenre = newGenre
          }

          if (existingGenre) {
            // Create title-genre relationship
            await supabase
              .from('title_genres')
              .upsert({
                title_id: titleId,
                genre_id: existingGenre.id
              }, { onConflict: 'title_id,genre_id' })
          }
        } catch (error) {
          console.error(`Error processing Kitsu genre:`, error)
        }
      }
    }
  }
}

// Process Kitsu categories (similar to tags)
async function processKitsuCategories(kitsuData: any, titleId: string) {
  if (!kitsuData.relationships?.categories?.data) return

  const categoryIds = kitsuData.relationships.categories.data.map((c: any) => c.id).join(',')
  
  if (categoryIds) {
    const categoryResponse = await fetch(`${KITSU_API_URL}/categories?filter[id]=${categoryIds}`, {
      headers: {
        'Accept': 'application/vnd.api+json',
      }
    })

    if (categoryResponse.ok) {
      const categoryData = await categoryResponse.json()
      
      for (const category of categoryData.data) {
        try {
          // Check if tag exists
          let { data: existingTag } = await supabase
            .from('content_tags')
            .select('id')
            .eq('slug', category.attributes.slug)
            .maybeSingle()

          if (!existingTag) {
            // Create new tag
            const { data: newTag } = await supabase
              .from('content_tags')
              .insert({
                name: category.attributes.title,
                slug: category.attributes.slug,
                description: category.attributes.description,
                category: 'theme', // Default category
                is_adult: category.attributes.nsfw || false,
                kitsu_id: parseInt(category.id)
              })
              .select()
              .single()
            
            existingTag = newTag
          }

          if (existingTag) {
            // Skip tag relationships for now - we don't have title_content_tags table
            console.log(`Tag processed: ${category.attributes.title} (table relationship pending)`)
          }
        } catch (error) {
          console.error(`Error processing Kitsu category:`, error)
        }
      }
    }
  }
}

// Process Kitsu production companies (studios)
async function processKitsuProductions(kitsuData: any, titleId: string, contentType: string) {
  if (contentType !== 'anime' || !kitsuData.relationships?.animeProductions?.data) return

  const productionIds = kitsuData.relationships.animeProductions.data.map((p: any) => p.id).join(',')
  
  if (productionIds) {
    // Fetch production details
    const productionResponse = await fetch(
      `${KITSU_API_URL}/anime-productions?filter[id]=${productionIds}&include=producer`,
      {
        headers: {
          'Accept': 'application/vnd.api+json',
        }
      }
    )

    if (productionResponse.ok) {
      const productionData = await productionResponse.json()
      
      // Process included producers
      const producers = productionData.included?.filter((item: any) => item.type === 'producers') || []
      
      for (const producer of producers) {
        try {
          // Check if studio exists
          let { data: existingStudio } = await supabase
            .from('studios')
            .select('id')
            .eq('slug', producer.attributes.slug)
            .maybeSingle()

          if (!existingStudio) {
            // Create new studio
            const { data: newStudio } = await supabase
              .from('studios')
              .insert({
                name: producer.attributes.name,
                slug: producer.attributes.slug
              })
              .select()
              .single()
            
            existingStudio = newStudio
          }

          if (existingStudio) {
            // Find the production relationship
            const production = productionData.data.find((p: any) => 
              p.relationships?.producer?.data?.id === producer.id
            )
            
            // Create title-studio relationship - use upsert to avoid duplicate errors
            await supabase
              .from('title_studios')
              .upsert({
                title_id: titleId,
                studio_id: existingStudio.id
              }, { onConflict: 'title_id,studio_id' })
              .select()
              .single()
              .catch(() => {
                // If duplicate key error, ignore it silently
                console.log(`Studio relationship already exists: ${producer.attributes.name}`)
              })
          }
        } catch (error) {
          console.error(`Error processing Kitsu producer:`, error)
        }
      }
    }
  }
}

// Process Kitsu staff (for manga authors/artists)
async function processKitsuStaff(kitsuData: any, titleId: string, contentType: string) {
  if (contentType !== 'manga' || !kitsuData.relationships?.staff?.data) return

  const staffIds = kitsuData.relationships.staff.data.map((s: any) => s.id).join(',')
  
  if (staffIds) {
    // Fetch staff details
    const staffResponse = await fetch(
      `${KITSU_API_URL}/manga-staff?filter[id]=${staffIds}&include=person`,
      {
        headers: {
          'Accept': 'application/vnd.api+json',
        }
      }
    )

    if (staffResponse.ok) {
      const staffData = await staffResponse.json()
      
      // Process included people
      const people = staffData.included?.filter((item: any) => item.type === 'people') || []
      
      for (const person of people) {
        try {
          // Check if person exists
          let { data: existingPerson } = await supabase
            .from('people')
            .select('id')
            .eq('slug', createSlug(person.attributes.name))
            .maybeSingle()

          if (!existingPerson) {
            // Create new person
            const { data: newPerson } = await supabase
              .from('people')
              .insert({
                name: person.attributes.name,
                slug: createSlug(person.attributes.name),
                biography: person.attributes.description,
                image_url: person.attributes.image?.original,
                birth_date: person.attributes.birthday
              })
              .select()
              .single()
            
            existingPerson = newPerson
          }

          if (existingPerson) {
            // Find the staff relationship
            const staff = staffData.data.find((s: any) => 
              s.relationships?.person?.data?.id === person.id
            )
            
            const role = staff?.attributes?.role?.toLowerCase() || 'author'
            const mappedRole = role === 'story' ? 'author' : role === 'art' ? 'artist' : role
            
            // Create title-author relationship (using title_authors for authors)
            if (mappedRole === 'author' || mappedRole === 'artist') {
              await supabase
                .from('title_authors')
                .upsert({
                  title_id: titleId,
                  author_id: existingPerson.id
                }, { onConflict: 'title_id,author_id' })
            }
          }
        } catch (error) {
          console.error(`Error processing Kitsu staff:`, error)
        }
      }
    }
  }
}

// Enhanced title update with metadata
async function updateTitleWithKitsuDataAndMetadata(
  titleId: string, 
  kitsuData: any, 
  contentType: string,
  trendingRank?: number
) {
  const attrs = kitsuData.attributes

  // Update basic title data with rating
  const updateData: any = {
    id_kitsu: parseInt(kitsuData.id),
    kitsu_rating: attrs.averageRating ? parseFloat(attrs.averageRating) / 10 : null,
    kitsu_user_count: attrs.userCount,
    kitsu_favorites_count: attrs.favoritesCount,
    kitsu_popularity_rank: attrs.popularityRank,
    kitsu_rating_rank: attrs.ratingRank,
    last_kitsu_update: new Date().toISOString()
  }

  if (trendingRank !== undefined) {
    updateData.kitsu_trending_rank = trendingRank
  }

  // Update synopsis if available
  if (attrs.synopsis) {
    updateData.synopsis = attrs.synopsis
  }

  await supabase
    .from('titles')
    .update(updateData)
    .eq('id', titleId)

  // Process all metadata relationships
  console.log(`  📊 Processing metadata for ${attrs.canonicalTitle}...`)
  
  await processKitsuGenres(kitsuData, titleId)
  await processKitsuCategories(kitsuData, titleId)
  await processKitsuProductions(kitsuData, titleId, contentType)
  await processKitsuStaff(kitsuData, titleId, contentType)
  
  console.log(`  ✅ Metadata updated for ${attrs.canonicalTitle}`)
}

// Main sync class
class EnhancedKitsuSyncEngine {
  private logId: string

  constructor() {
    this.logId = crypto.randomUUID()
  }

  async startSync(syncType: 'trending' | 'updates' | 'ratings', contentType: 'anime' | 'manga', limit: number = 100) {
    // Log sync start to cron_job_logs
    await supabase
      .from('cron_job_logs')
      .insert({
        job_name: `kitsu_sync_${syncType}_${contentType}`,
        status: 'running',
        details: { sync_id: this.logId, limit }
      })

    try {
      let results
      switch (syncType) {
        case 'trending':
          results = await this.syncTrending(contentType, limit)
          break
        case 'updates':
          results = await this.syncRecentUpdates(contentType, limit)
          break
        case 'ratings':
          results = await this.syncRatingsWithMetadata(contentType, limit)
          break
      }

      // Log sync completion
      await supabase
        .from('cron_job_logs')
        .insert({
          job_name: `kitsu_sync_${syncType}_${contentType}`,
          status: 'completed',
          details: { sync_id: this.logId, ...results }
        })

      return results
    } catch (error) {
      // Log sync failure
      await supabase
        .from('cron_job_logs')
        .insert({
          job_name: `kitsu_sync_${syncType}_${contentType}`,
          status: 'failed',
          error_message: error.message,
          details: { sync_id: this.logId }
        })

      throw error
    }
  }

  async syncTrending(contentType: 'anime' | 'manga', limit: number) {
    console.log(`📈 Syncing trending ${contentType} with metadata from Kitsu`)
    
    const results = { processed: 0, updated: 0 }
    let offset = 0

    while (results.processed < limit) {
      const data = await fetchKitsuWithRelationships(contentType, offset, true)
      
      if (!data.data || data.data.length === 0) break

      for (const item of data.data) {
        if (results.processed >= limit) break
        
        results.processed++
        
        // Check if we have this title
        const { data: existing } = await supabase
          .from('titles')
          .select('id')
          .or(`id_kitsu.eq.${parseInt(item.id)},title.eq.${item.attributes.canonicalTitle}`)
          .maybeSingle()

        if (existing) {
          await updateTitleWithKitsuDataAndMetadata(
            existing.id, 
            item, 
            contentType,
            results.processed
          )
          results.updated++
        }
      }

      offset += 10
      await new Promise(resolve => setTimeout(resolve, 1000)) // Rate limit
    }

    return results
  }

  async syncRecentUpdates(contentType: 'anime' | 'manga', limit: number) {
    console.log(`🔄 Syncing recent updates with metadata for ${contentType}`)
    
    const results = { processed: 0, updated: 0 }
    let offset = 0

    while (results.processed < limit) {
      const data = await fetchKitsuWithRelationships(contentType, offset, true)
      
      if (!data.data || data.data.length === 0) break

      for (const item of data.data) {
        if (results.processed >= limit) break
        
        results.processed++
        
        // Check if we have this title
        const { data: existing } = await supabase
          .from('titles')
          .select('id')
          .or(`id_kitsu.eq.${parseInt(item.id)},title.eq.${item.attributes.canonicalTitle}`)
          .maybeSingle()

        if (existing) {
          await updateTitleWithKitsuDataAndMetadata(existing.id, item, contentType)
          results.updated++
        }
      }

      offset += 10
      await new Promise(resolve => setTimeout(resolve, 1000)) // Rate limit
    }

    return results
  }

  async syncRatingsWithMetadata(contentType: 'anime' | 'manga', limit: number) {
    console.log(`⭐ Syncing ratings and metadata for existing ${contentType}`)
    
    const results = { processed: 0, updated: 0 }

    // Get titles that need updates (only check existing Kitsu fields)
    const { data: titles } = await supabase
      .from('titles')
      .select('id, title, title_english, title_japanese')
      .limit(limit)

    if (!titles || titles.length === 0) {
      console.log('No titles found for rating/metadata updates')
      return results
    }

    for (const title of titles) {
      results.processed++
      
      // Search for this title in Kitsu
      const searchQuery = encodeURIComponent(title.title)
      const searchResponse = await fetch(
        `${KITSU_API_URL}/${contentType}?filter[text]=${searchQuery}&page[limit]=5&include=genres,categories`,
        {
          headers: {
            'Accept': 'application/vnd.api+json',
          }
        }
      )

      if (searchResponse.ok) {
        const searchData = await searchResponse.json()
        
        if (searchData.data && searchData.data.length > 0) {
          // Find best match
          const match = searchData.data[0] // TODO: Implement better matching
          
          await updateTitleWithKitsuDataAndMetadata(title.id, match, contentType)
          results.updated++
          console.log(`✅ Updated rating and metadata for: ${title.title}`)
        }
      }

      await new Promise(resolve => setTimeout(resolve, 1000)) // Rate limit
    }

    return results
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { 
      syncType = 'trending',
      contentType = 'anime',
      limit = 100
    } = await req.json()

    console.log(`🚀 Starting enhanced Kitsu sync: ${syncType} for ${contentType}`)

    const engine = new EnhancedKitsuSyncEngine()
    const results = await engine.startSync(syncType as any, contentType, limit)

    return new Response(
      JSON.stringify({ 
        success: true,
        ...results,
        syncType,
        contentType
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('❌ Enhanced Kitsu sync failed:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})