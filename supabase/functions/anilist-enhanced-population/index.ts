// supabase/functions/anilist-enhanced-population/index.ts
// PHASE 1: AniList Enhanced Population - Comprehensive metadata without ratings
// This populates detailed taxonomy, relationships, and metadata structure

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)

// AniList GraphQL endpoint
const ANILIST_GRAPHQL_URL = 'https://graphql.anilist.co'

// Helper function to create slug
function createSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
}

// Enhanced AniList query with comprehensive metadata
const ENHANCED_ANILIST_QUERY = `
query ($page: Int, $type: MediaType, $perPage: Int) {
  Page(page: $page, perPage: $perPage) {
    pageInfo {
      hasNextPage
      currentPage
      lastPage
    }
    media(type: $type, sort: [POPULARITY_DESC]) {
      id
      title {
        romaji
        english
        native
      }
      description
      coverImage {
        extraLarge
        color
      }
      bannerImage
      genres
      tags {
        id
        name
        description
        category
        rank
        isGeneralSpoiler
        isMediaSpoiler
        isAdult
      }
      studios(isMain: true) {
        nodes {
          id
          name
          isAnimationStudio
        }
      }
      staff(perPage: 20) {
        edges {
          id
          role
          node {
            id
            name {
              first
              middle
              last
              full
              native
            }
            image {
              large
            }
            description
            dateOfBirth {
              year
              month
              day
            }
            dateOfDeath {
              year
              month
              day
            }
          }
        }
      }
      characters(perPage: 20, sort: [ROLE, RELEVANCE, ID]) {
        edges {
          id
          role
          voiceActors(language: JAPANESE, sort: [RELEVANCE, ID]) {
            id
            name {
              first
              middle
              last
              full
              native
            }
            image {
              large
            }
            language {
              name
            }
          }
          node {
            id
            name {
              first
              middle
              last
              full
              native
            }
            image {
              large
            }
            description
          }
        }
      }
      startDate {
        year
        month
        day
      }
      endDate {
        year
        month
        day
      }
      season
      seasonYear
      format
      status
      episodes
      chapters
      volumes
      duration
      source
      hashtag
      trailer {
        id
        site
        thumbnail
      }
      updatedAt
      nextAiringEpisode {
        airingAt
        timeUntilAiring
        episode
      }
      relations {
        edges {
          id
          relationType
          node {
            id
            title {
              romaji
              english
              native
            }
            type
          }
        }
      }
    }
  }
}
`

// Process AniList genres
async function processAniListGenres(genres: string[], titleId: string) {
  if (!genres || genres.length === 0) return

  for (const genreName of genres) {
    try {
      // Check if genre exists
      let { data: existingGenre } = await supabase
        .from('genres')
        .select('id')
        .eq('name', genreName)
        .maybeSingle()

      if (!existingGenre) {
        // Create new genre
        const { data: newGenre } = await supabase
          .from('genres')
          .insert({
            name: genreName,
            slug: createSlug(genreName),
            type: 'both' // AniList genres work for both anime and manga
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
            genre_id: existingGenre.id,
            relevance_score: 1.0, // AniList genres are highly relevant
            source: 'anilist'
          }, { onConflict: 'title_id,genre_id' })
      }
    } catch (error) {
      console.error(`Error processing AniList genre ${genreName}:`, error)
    }
  }
}

// Process AniList tags
async function processAniListTags(tags: any[], titleId: string) {
  if (!tags || tags.length === 0) return

  for (const tag of tags) {
    try {
      // Check if tag exists
      let { data: existingTag } = await supabase
        .from('content_tags')
        .select('id')
        .eq('anilist_id', tag.id)
        .maybeSingle()

      if (!existingTag) {
        // Create new tag
        const { data: newTag } = await supabase
          .from('content_tags')
          .insert({
            name: tag.name,
            slug: createSlug(tag.name),
            description: tag.description,
            category: tag.category?.toLowerCase() || 'theme',
            rank: tag.rank || 0,
            is_spoiler: tag.isGeneralSpoiler || tag.isMediaSpoiler,
            is_adult: tag.isAdult || false,
            anilist_id: tag.id
          })
          .select()
          .single()
        
        existingTag = newTag
      }

      if (existingTag) {
        // Create title-tag relationship
        await supabase
          .from('title_content_tags')
          .upsert({
            title_id: titleId,
            tag_id: existingTag.id,
            rank: tag.rank || 0,
            source: 'anilist'
          }, { onConflict: 'title_id,tag_id' })
      }
    } catch (error) {
      console.error(`Error processing AniList tag ${tag.name}:`, error)
    }
  }
}

// Process AniList studios
async function processAniListStudios(studios: any[], titleId: string) {
  if (!studios || studios.length === 0) return

  for (const studio of studios) {
    try {
      // Check if studio exists
      let { data: existingStudio } = await supabase
        .from('studios')
        .select('id')
        .eq('name', studio.name)
        .maybeSingle()

      if (!existingStudio) {
        // Create new studio
        const { data: newStudio } = await supabase
          .from('studios')
          .insert({
            name: studio.name,
            slug: createSlug(studio.name),
            is_animation_studio: studio.isAnimationStudio || false,
            anilist_id: studio.id
          })
          .select()
          .single()
        
        existingStudio = newStudio
      }

      if (existingStudio) {
        // Create title-studio relationship
        await supabase
          .from('title_studios')
          .insert({
            title_id: titleId,
            studio_id: existingStudio.id,
            is_main_studio: true, // AniList studios query is for main studios
            role: 'animation'
          })
          .select()
          .single()
          .catch(() => {
            // If duplicate, ignore silently
            console.log(`Studio relationship already exists: ${studio.name}`)
          })
      }
    } catch (error) {
      console.error(`Error processing AniList studio ${studio.name}:`, error)
    }
  }
}

// Process AniList staff
async function processAniListStaff(staff: any[], titleId: string, contentType: string) {
  if (!staff || staff.length === 0) return

  for (const staffEdge of staff) {
    const person = staffEdge.node
    const role = staffEdge.role
    
    try {
      // Check if person exists
      let { data: existingPerson } = await supabase
        .from('people')
        .select('id')
        .eq('anilist_id', person.id)
        .maybeSingle()

      if (!existingPerson) {
        // Create new person
        const { data: newPerson } = await supabase
          .from('people')
          .insert({
            name: person.name.full || person.name.first || 'Unknown',
            name_japanese: person.name.native,
            slug: createSlug(person.name.full || person.name.first || 'unknown'),
            biography: person.description,
            image_url: person.image?.large,
            birth_date: person.dateOfBirth ? 
              `${person.dateOfBirth.year}-${String(person.dateOfBirth.month || 1).padStart(2, '0')}-${String(person.dateOfBirth.day || 1).padStart(2, '0')}` : 
              null,
            death_date: person.dateOfDeath ? 
              `${person.dateOfDeath.year}-${String(person.dateOfDeath.month || 1).padStart(2, '0')}-${String(person.dateOfDeath.day || 1).padStart(2, '0')}` : 
              null,
            anilist_id: person.id
          })
          .select()
          .single()
        
        existingPerson = newPerson
      }

      if (existingPerson) {
        // For manga, use title_authors table for authors/artists
        if (contentType === 'manga' && (role.toLowerCase().includes('author') || role.toLowerCase().includes('artist'))) {
          const mappedRole = role.toLowerCase().includes('author') ? 'author' : 'artist'
          
          await supabase
            .from('title_authors')
            .upsert({
              title_id: titleId,
              author_id: existingPerson.id,
              role: mappedRole
            }, { onConflict: 'title_id,author_id' })
        }
        
        // Also create a general title-people relationship for all staff
        await supabase
          .from('title_people')
          .insert({
            title_id: titleId,
            person_id: existingPerson.id,
            role: role.toLowerCase(),
            is_main_creator: ['director', 'original creator', 'story & art'].some(r => 
              role.toLowerCase().includes(r)
            )
          })
          .select()
          .single()
          .catch(() => {
            // If duplicate, ignore silently
            console.log(`Staff relationship already exists: ${person.name.full} - ${role}`)
          })
      }
    } catch (error) {
      console.error(`Error processing AniList staff ${person.name.full}:`, error)
    }
  }
}

// Process AniList characters
async function processAniListCharacters(characters: any[], titleId: string) {
  if (!characters || characters.length === 0) return

  for (const charEdge of characters) {
    const character = charEdge.node
    const role = charEdge.role
    const voiceActors = charEdge.voiceActors || []
    
    try {
      // Check if character exists
      let { data: existingCharacter } = await supabase
        .from('characters')
        .select('id')
        .eq('anilist_id', character.id)
        .maybeSingle()

      if (!existingCharacter) {
        // Create new character
        const { data: newCharacter } = await supabase
          .from('characters')
          .insert({
            name: character.name.full || character.name.first || 'Unknown',
            name_japanese: character.name.native,
            slug: createSlug(character.name.full || character.name.first || 'unknown'),
            description: character.description,
            image_url: character.image?.large,
            role: role?.toLowerCase(),
            anilist_id: character.id
          })
          .select()
          .single()
        
        existingCharacter = newCharacter
      }

      // Process voice actors for this character
      for (const voiceActor of voiceActors) {
        try {
          // Check if voice actor (person) exists
          let { data: existingVA } = await supabase
            .from('people')
            .select('id')
            .eq('anilist_id', voiceActor.id)
            .maybeSingle()

          if (!existingVA) {
            // Create new voice actor
            const { data: newVA } = await supabase
              .from('people')
              .insert({
                name: voiceActor.name.full || voiceActor.name.first || 'Unknown',
                name_japanese: voiceActor.name.native,
                slug: createSlug(voiceActor.name.full || voiceActor.name.first || 'unknown'),
                image_url: voiceActor.image?.large,
                anilist_id: voiceActor.id
              })
              .select()
              .single()
            
            existingVA = newVA
          }

          if (existingVA && existingCharacter) {
            // Create character-voice actor relationship
            await supabase
              .from('character_voice_actors')
              .insert({
                title_id: titleId,
                character_id: existingCharacter.id,
                person_id: existingVA.id,
                language: voiceActor.language?.name || 'Japanese',
                is_main: role === 'MAIN'
              })
              .select()
              .single()
              .catch(() => {
                // If duplicate, ignore silently
                console.log(`Voice actor relationship already exists: ${character.name.full} - ${voiceActor.name.full}`)
              })
          }
        } catch (error) {
          console.error(`Error processing voice actor ${voiceActor.name.full}:`, error)
        }
      }
    } catch (error) {
      console.error(`Error processing AniList character ${character.name.full}:`, error)
    }
  }
}

// Format date from AniList date object
function formatDate(dateObj: any): string | null {
  if (!dateObj || !dateObj.year) return null
  
  const year = dateObj.year
  const month = dateObj.month || 1
  const day = dateObj.day || 1
  
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

// Enhanced population with comprehensive metadata
async function populateFromAniList(contentType: 'anime' | 'manga', limit: number = 100) {
  console.log(`🚀 Starting AniList enhanced population for ${contentType}`)
  
  const results = { processed: 0, updated: 0, created: 0 }
  let page = 1
  let hasNextPage = true
  const perPage = 50

  while (hasNextPage && results.processed < limit) {
    try {
      console.log(`📄 Fetching page ${page} for ${contentType}...`)
      
      const response = await fetch(ANILIST_GRAPHQL_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          query: ENHANCED_ANILIST_QUERY,
          variables: {
            page,
            type: contentType.toUpperCase(),
            perPage
          }
        })
      })

      if (!response.ok) {
        throw new Error(`AniList API error: ${response.status}`)
      }

      const data = await response.json()
      
      if (data.errors) {
        console.error('AniList GraphQL errors:', data.errors)
        break
      }

      const media = data.data?.Page?.media || []
      hasNextPage = data.data?.Page?.pageInfo?.hasNextPage || false

      for (const item of media) {
        if (results.processed >= limit) break
        
        results.processed++
        console.log(`🔄 Processing ${contentType}: ${item.title.romaji || item.title.english}`)

        // Check if title exists
        const { data: existingTitle } = await supabase
          .from('titles')
          .select('id')
          .eq('anilist_id', item.id)
          .maybeSingle()

        let titleId: string

        if (existingTitle) {
          titleId = existingTitle.id
          results.updated++
          
          // Update existing title (without ratings)
          await supabase
            .from('titles')
            .update({
              title: item.title.romaji || item.title.english || 'Unknown',
              title_english: item.title.english,
              title_japanese: item.title.native,
              synopsis: item.description,
              image_url: item.coverImage?.extraLarge,
              color_theme: item.coverImage?.color,
              year: item.seasonYear || item.startDate?.year,
              last_anilist_update: new Date().toISOString()
            })
            .eq('id', titleId)
        } else {
          // Create new title (without ratings)
          const { data: newTitle } = await supabase
            .from('titles')
            .insert({
              anilist_id: item.id,
              title: item.title.romaji || item.title.english || 'Unknown',
              title_english: item.title.english,
              title_japanese: item.title.native,
              synopsis: item.description,
              image_url: item.coverImage?.extraLarge,
              color_theme: item.coverImage?.color,
              year: item.seasonYear || item.startDate?.year,
              last_anilist_update: new Date().toISOString()
            })
            .select()
            .single()
          
          titleId = newTitle.id
          results.created++

          // Create content-specific details
          if (contentType === 'anime') {
            await supabase
              .from('anime_details')
              .insert({
                title_id: titleId,
                episodes: item.episodes,
                aired_from: formatDate(item.startDate),
                aired_to: formatDate(item.endDate),
                season: item.season?.toLowerCase(),
                status: item.status,
                type: item.format,
                trailer_url: item.trailer?.id ? `https://www.youtube.com/watch?v=${item.trailer.id}` : null,
                trailer_site: item.trailer?.site,
                trailer_id: item.trailer?.id,
                next_episode_date: item.nextAiringEpisode ? 
                  new Date(item.nextAiringEpisode.airingAt * 1000).toISOString() : null,
                next_episode_number: item.nextAiringEpisode?.episode
              })
          } else {
            await supabase
              .from('manga_details')
              .insert({
                title_id: titleId,
                chapters: item.chapters,
                volumes: item.volumes,
                published_from: formatDate(item.startDate),
                published_to: formatDate(item.endDate),
                status: item.status,
                type: item.format
              })
          }
        }

        // Process all metadata relationships
        console.log(`  📊 Processing metadata for ${item.title.romaji}...`)
        
        await processAniListGenres(item.genres, titleId)
        await processAniListTags(item.tags, titleId)
        await processAniListStudios(item.studios?.nodes, titleId)
        await processAniListStaff(item.staff?.edges, titleId, contentType)
        await processAniListCharacters(item.characters?.edges, titleId)
        
        console.log(`  ✅ Metadata processed for ${item.title.romaji}`)

        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 100))
      }

      page++
      
      // Rate limiting between pages
      await new Promise(resolve => setTimeout(resolve, 1000))
      
    } catch (error) {
      console.error(`Error processing page ${page}:`, error)
      break
    }
  }

  return results
}

// Main population class
class AniListEnhancedPopulation {
  private logId: string

  constructor() {
    this.logId = crypto.randomUUID()
  }

  async startPopulation(contentType: 'anime' | 'manga', limit: number = 100) {
    // Log start to cron_job_logs
    await supabase
      .from('cron_job_logs')
      .insert({
        job_name: `anilist_enhanced_population_${contentType}`,
        status: 'running',
        details: { population_id: this.logId, limit }
      })

    try {
      const results = await populateFromAniList(contentType, limit)

      // Log completion
      await supabase
        .from('cron_job_logs')
        .insert({
          job_name: `anilist_enhanced_population_${contentType}`,
          status: 'completed',
          details: { population_id: this.logId, ...results }
        })

      return results
    } catch (error) {
      // Log failure
      await supabase
        .from('cron_job_logs')
        .insert({
          job_name: `anilist_enhanced_population_${contentType}`,
          status: 'failed',
          error_message: error.message,
          details: { population_id: this.logId }
        })

      throw error
    }
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { 
      contentType = 'anime',
      limit = 100
    } = await req.json()

    console.log(`🚀 Starting AniList enhanced population: ${contentType}`)

    const population = new AniListEnhancedPopulation()
    const results = await population.startPopulation(contentType as any, limit)

    return new Response(
      JSON.stringify({ 
        success: true,
        phase: 'Phase 1 - AniList Enhanced Population',
        message: 'Comprehensive metadata populated (excluding ratings)',
        ...results,
        contentType
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('❌ AniList enhanced population failed:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})