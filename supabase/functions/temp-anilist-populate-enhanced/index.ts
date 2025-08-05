// supabase/functions/temp-anilist-populate-enhanced/index.ts
// ⚠️ TEMPORARY FUNCTION - DELETE AFTER INITIAL POPULATION ⚠️
// Enhanced version with comprehensive metadata extraction

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

// Comprehensive AniList query for all metadata
const ANILIST_COMPREHENSIVE_QUERY = `
  query GetMediaWithMetadata($page: Int, $perPage: Int, $type: MediaType, $sort: [MediaSort]) {
    Page(page: $page, perPage: $perPage) {
      pageInfo {
        total
        currentPage
        lastPage
        hasNextPage
      }
      media(type: $type, sort: $sort, isAdult: false) {
        id
        idMal
        title {
          romaji
          english
          native
        }
        description
        coverImage {
          extraLarge
          large
          color
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
        type
        format
        status
        episodes
        chapters
        volumes
        genres
        popularity
        favourites
        averageScore
        
        # Comprehensive tag data
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
        
        # Studio data (for anime)
        studios {
          edges {
            isMain
            node {
              id
              name
              isAnimationStudio
            }
          }
        }
        
        # Staff data (directors, writers, etc.)
        staff(sort: [RELEVANCE, ID]) {
          edges {
            role
            node {
              id
              name {
                full
                native
              }
              image {
                large
              }
              dateOfBirth {
                year
                month
                day
              }
              description
            }
          }
        }
        
        # Character data
        characters(sort: [ROLE, RELEVANCE, ID]) {
          edges {
            role
            voiceActors(language: JAPANESE) {
              id
              name {
                full
                native
              }
              image {
                large
              }
            }
            node {
              id
              name {
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
      }
    }
  }
`

// Helper function to create slug from text
function createSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .trim();
}

// Helper function to determine tag category
function getTagCategory(tagCategory: string): string {
  const categoryMap: Record<string, string> = {
    'THEME': 'theme',
    'TECHNICAL': 'technical',
    'SETTING': 'setting',
    'DEMOGRAPHIC': 'demographic',
    'CONTENT': 'content_warning',
    'STYLE': 'aesthetic',
    'NARRATIVE': 'narrative'
  };
  return categoryMap[tagCategory] || 'theme';
}

// Process genres
async function processGenres(genres: string[], titleId: string) {
  for (const genreName of genres) {
    try {
      // Check if genre exists
      let { data: genre } = await supabase
        .from('genres')
        .select('id')
        .eq('name', genreName)
        .single();

      if (!genre) {
        // Create new genre
        const { data: newGenre } = await supabase
          .from('genres')
          .insert({
            name: genreName,
            slug: createSlug(genreName),
            type: 'both'
          })
          .select()
          .single();
        
        genre = newGenre;
      }

      if (genre) {
        // Create title-genre relationship
        await supabase
          .from('title_genres')
          .upsert({
            title_id: titleId,
            genre_id: genre.id
          }, { onConflict: 'title_id,genre_id' });
      }
    } catch (error) {
      console.error(`Error processing genre ${genreName}:`, error);
    }
  }
}

// Process tags
async function processTags(tags: any[], titleId: string) {
  for (const tag of tags) {
    try {
      // Check if tag exists
      let { data: existingTag } = await supabase
        .from('content_tags')
        .select('id')
        .eq('anilist_id', tag.id)
        .single();

      if (!existingTag) {
        // Create new tag
        const { data: newTag } = await supabase
          .from('content_tags')
          .insert({
            name: tag.name,
            slug: createSlug(tag.name),
            description: tag.description,
            category: getTagCategory(tag.category),
            rank: tag.rank || 0,
            is_spoiler: tag.isGeneralSpoiler || tag.isMediaSpoiler,
            is_adult: tag.isAdult,
            anilist_id: tag.id
          })
          .select()
          .single();
        
        existingTag = newTag;
      }

      if (existingTag) {
        // Create title-tag relationship
        await supabase
          .from('title_content_tags')
          .upsert({
            title_id: titleId,
            tag_id: existingTag.id,
            rank: tag.rank || 0,
            is_spoiler: tag.isMediaSpoiler || false,
            source: 'anilist'
          }, { onConflict: 'title_id,tag_id' });
      }
    } catch (error) {
      console.error(`Error processing tag ${tag.name}:`, error);
    }
  }
}

// Process studios
async function processStudios(studios: any, titleId: string) {
  if (!studios?.edges) return;

  for (const studioEdge of studios.edges) {
    const studio = studioEdge.node;
    try {
      // Check if studio exists
      let { data: existingStudio } = await supabase
        .from('studios')
        .select('id')
        .eq('name', studio.name)
        .single();

      if (!existingStudio) {
        // Create new studio
        const { data: newStudio } = await supabase
          .from('studios')
          .insert({
            name: studio.name,
            slug: createSlug(studio.name)
          })
          .select()
          .single();
        
        existingStudio = newStudio;
      }

      if (existingStudio) {
        // Create title-studio relationship
        await supabase
          .from('title_studios')
          .upsert({
            title_id: titleId,
            studio_id: existingStudio.id
          }, { onConflict: 'title_id,studio_id' });
      }
    } catch (error) {
      console.error(`Error processing studio ${studio.name}:`, error);
    }
  }
}

// Process authors/staff (for manga only - map staff to authors)
async function processAuthors(staff: any, titleId: string, contentType: string) {
  if (!staff?.edges || contentType !== 'manga') return;

  // For manga, we only care about creators/authors
  const authorRoles = ['Original Creator', 'Story', 'Story & Art', 'Art'];

  for (const staffEdge of staff.edges.slice(0, 10)) { // Limit to 10 authors
    if (!authorRoles.includes(staffEdge.role)) continue;

    const person = staffEdge.node;
    
    try {
      // Check if author exists
      let { data: existingAuthor } = await supabase
        .from('authors')
        .select('id')
        .eq('name', person.name.full)
        .single();

      if (!existingAuthor) {
        // Create new author
        const { data: newAuthor } = await supabase
          .from('authors')
          .insert({
            name: person.name.full,
            slug: createSlug(person.name.full)
          })
          .select()
          .single();
        
        existingAuthor = newAuthor;
      }

      if (existingAuthor) {
        // Create title-author relationship
        await supabase
          .from('title_authors')
          .upsert({
            title_id: titleId,
            author_id: existingAuthor.id
          }, { onConflict: 'title_id,author_id' });
      }
    } catch (error) {
      console.error(`Error processing author ${person.name.full}:`, error);
    }
  }
}

// Process staff/people (create people records)
async function processStaff(staff: any, titleId: string) {
  if (!staff?.edges) return;

  // Limit to important roles
  const importantRoles = ['Director', 'Original Creator', 'Story', 'Story & Art', 'Art', 'Character Design', 'Music'];

  for (const staffEdge of staff.edges.slice(0, 10)) { // Limit to 10 staff members
    if (!importantRoles.includes(staffEdge.role)) continue;

    const person = staffEdge.node;
    
    try {
      // Check if person exists
      let { data: existingPerson } = await supabase
        .from('people')
        .select('id')
        .eq('anilist_id', person.id)
        .single();

      if (!existingPerson) {
        // Create new person
        const birthDate = person.dateOfBirth ? 
          `${person.dateOfBirth.year || 1900}-${String(person.dateOfBirth.month || 1).padStart(2, '0')}-${String(person.dateOfBirth.day || 1).padStart(2, '0')}` : null;

        const { data: newPerson } = await supabase
          .from('people')
          .insert({
            name: person.name.full,
            name_japanese: person.name.native,
            slug: createSlug(person.name.full),
            birth_date: birthDate,
            biography: person.description?.replace(/<[^>]*>/g, ''),
            image_url: person.image?.large,
            anilist_id: person.id
          })
          .select()
          .single();
        
        existingPerson = newPerson;
      }

      console.log(`  👤 Processed staff: ${person.name.full} (${staffEdge.role})`);
    } catch (error) {
      console.error(`Error processing staff ${person.name.full}:`, error);
    }
  }
}

// Process characters
async function processCharacters(characters: any, titleId: string) {
  if (!characters?.edges) return;

  let orderIndex = 0;
  for (const charEdge of characters.edges.slice(0, 20)) { // Limit to 20 characters
    const character = charEdge.node;
    orderIndex++;

    try {
      // Check if character exists
      let { data: existingCharacter } = await supabase
        .from('content_characters')
        .select('id')
        .eq('anilist_id', character.id)
        .single();

      if (!existingCharacter) {
        // Create new character
        const { data: newCharacter } = await supabase
          .from('content_characters')
          .insert({
            name: character.name.full,
            name_japanese: character.name.native,
            slug: createSlug(character.name.full),
            description: character.description?.replace(/<[^>]*>/g, ''),
            image_url: character.image?.large,
            role: charEdge.role?.toLowerCase() || 'supporting',
            anilist_id: character.id
          })
          .select()
          .single();
        
        existingCharacter = newCharacter;
      }

      if (existingCharacter) {
        // Create title-character relationship
        await supabase
          .from('title_content_characters')
          .upsert({
            title_id: titleId,
            character_id: existingCharacter.id,
            role: charEdge.role?.toLowerCase() || 'supporting',
            order_index: orderIndex
          }, { onConflict: 'title_id,character_id' });

        // Process voice actors if they exist
        if (charEdge.voiceActors && charEdge.voiceActors.length > 0) {
          for (const va of charEdge.voiceActors.slice(0, 1)) { // Only main voice actor
            try {
              // Check if voice actor person exists
              let { data: existingVA } = await supabase
                .from('people')
                .select('id')
                .eq('anilist_id', va.id)
                .single();

              if (!existingVA) {
                // Create new voice actor person
                const { data: newVA } = await supabase
                  .from('people')
                  .insert({
                    name: va.name.full,
                    name_japanese: va.name.native,
                    slug: createSlug(va.name.full),
                    image_url: va.image?.large,
                    anilist_id: va.id
                  })
                  .select()
                  .single();
                
                existingVA = newVA;
              }

              if (existingVA) {
                // Create character-voice actor relationship
                await supabase
                  .from('character_voice_actors')
                  .upsert({
                    title_id: titleId,
                    character_id: existingCharacter.id,
                    person_id: existingVA.id,
                    language: 'Japanese',
                    is_main: true
                  }, { onConflict: 'title_id,character_id,person_id,language' });
              }
            } catch (vaError) {
              console.warn(`Could not process voice actor for ${character.name.full}:`, vaError);
            }
          }
        }
      }
    } catch (error) {
      console.error(`Error processing character ${character.name.full}:`, error);
    }
  }
}

// Main population function
async function populateFromAniListWithMetadata(type: 'ANIME' | 'MANGA', startPage: number, totalPages: number) {
  const results = {
    processed: 0,
    created: 0,
    errors: 0,
    metadata: {
      genres: 0,
      tags: 0,
      studios: 0,
      authors: 0,
      people: 0,
      characters: 0
    }
  }

  for (let page = startPage; page <= startPage + totalPages - 1; page++) {
    console.log(`📄 Processing ${type} page ${page} with full metadata`)
    
    try {
      const response = await fetch('https://graphql.anilist.co', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          query: ANILIST_COMPREHENSIVE_QUERY,
          variables: {
            page,
            perPage: 15, // Reduced because we're getting more data
            type,
            sort: ['POPULARITY_DESC']
          }
        })
      })

      if (!response.ok) {
        throw new Error(`AniList API error: ${response.status}`)
      }

      const data = await response.json()
      
      if (data.errors) {
        console.error('GraphQL errors:', data.errors)
        throw new Error(`GraphQL error: ${data.errors[0]?.message}`)
      }

      const mediaList = data.data.Page.media

      for (const media of mediaList) {
        results.processed++
        
        try {
          // Check if title already exists
          const { data: existingTitle } = await supabase
            .from('titles')
            .select('id')
            .eq('anilist_id', media.id)
            .single()

          if (existingTitle) {
            console.log(`⏭️  Skipping existing title: ${media.title.romaji}`)
            continue
          }

          // Create title entry
          const titleData = {
            anilist_id: media.id,
            title: media.title.romaji || media.title.english || media.title.native,
            title_english: media.title.english,
            title_japanese: media.title.native,
            synopsis: media.description?.replace(/<[^>]*>/g, '')?.substring(0, 2000) || null,
            image_url: media.coverImage.extraLarge || media.coverImage.large,
            popularity: media.popularity,
            year: media.seasonYear || media.startDate?.year,
            color_theme: media.coverImage.color
          }

          const { data: newTitle, error: titleError } = await supabase
            .from('titles')
            .insert(titleData)
            .select()
            .single()

          if (titleError) {
            console.error(`Failed to insert ${media.title.romaji}:`, titleError)
            results.errors++
            continue
          }

          results.created++
          console.log(`✅ Created: ${media.title.romaji}`)

          // Insert type-specific details
          if (type === 'ANIME') {
            await supabase
              .from('anime_details')
              .insert({
                title_id: newTitle.id,
                episodes: media.episodes,
                status: media.status || 'FINISHED',
                type: media.format || 'TV',
                season: media.season,
                aired_from: media.startDate ? 
                  `${media.startDate.year}-${String(media.startDate.month || 1).padStart(2, '0')}-${String(media.startDate.day || 1).padStart(2, '0')}` : null,
                aired_to: media.endDate ? 
                  `${media.endDate.year}-${String(media.endDate.month || 1).padStart(2, '0')}-${String(media.endDate.day || 1).padStart(2, '0')}` : null
              })
          } else {
            await supabase
              .from('manga_details')
              .insert({
                title_id: newTitle.id,
                chapters: media.chapters,
                volumes: media.volumes,
                status: media.status || 'FINISHED',
                type: media.format || 'MANGA',
                published_from: media.startDate ? 
                  `${media.startDate.year}-${String(media.startDate.month || 1).padStart(2, '0')}-${String(media.startDate.day || 1).padStart(2, '0')}` : null,
                published_to: media.endDate ? 
                  `${media.endDate.year}-${String(media.endDate.month || 1).padStart(2, '0')}-${String(media.endDate.day || 1).padStart(2, '0')}` : null
              })
          }

          // Process all metadata
          console.log(`  📁 Processing metadata for ${media.title.romaji}...`)
          
          // Process genres
          if (media.genres && media.genres.length > 0) {
            await processGenres(media.genres, newTitle.id)
            results.metadata.genres += media.genres.length
          }

          // Process tags
          if (media.tags && media.tags.length > 0) {
            await processTags(media.tags.slice(0, 10), newTitle.id) // Limit to 10 tags
            results.metadata.tags += Math.min(media.tags.length, 10)
          }

          // Process studios (anime only)
          if (type === 'ANIME' && media.studios) {
            await processStudios(media.studios, newTitle.id)
            results.metadata.studios += media.studios.edges?.length || 0
          }

          // Process authors (manga only)
          if (type === 'MANGA' && media.staff) {
            await processAuthors(media.staff, newTitle.id, 'manga')
            results.metadata.authors += 1
          }

          // Process staff/people
          if (media.staff) {
            await processStaff(media.staff, newTitle.id)
            results.metadata.people += Math.min(media.staff.edges?.length || 0, 10)
          }

          // Process characters
          if (media.characters) {
            await processCharacters(media.characters, newTitle.id)
            results.metadata.characters += Math.min(media.characters.edges?.length || 0, 20)
          }

          console.log(`  ✅ Metadata complete for ${media.title.romaji}`)

        } catch (error) {
          console.error(`Error processing ${media.title.romaji}:`, error)
          results.errors++
        }
      }

      // Respect rate limits
      await new Promise(resolve => setTimeout(resolve, 2000)) // 2 second delay
      
    } catch (error) {
      console.error(`Error on page ${page}:`, error)
      results.errors++
    }
  }

  return results
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { 
      contentType = 'anime',
      startPage = 1,
      totalPages = 10
    } = await req.json()

    console.log(`🚀 Starting enhanced AniList population: ${contentType}, pages ${startPage}-${startPage + totalPages - 1}`)

    const results = await populateFromAniListWithMetadata(
      contentType.toUpperCase() as 'ANIME' | 'MANGA',
      startPage,
      totalPages
    )

    console.log(`✅ Enhanced population complete:`, results)

    return new Response(
      JSON.stringify({ 
        success: true,
        ...results,
        message: 'Enhanced population complete with full metadata. This function can now be deleted.'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('❌ Enhanced population failed:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})

// ⚠️ DEPLOYMENT NOTES:
// 1. Deploy: supabase functions deploy temp-anilist-populate-enhanced
// 2. Run for anime: invoke with {"contentType": "anime", "totalPages": 20}
// 3. Run for manga: invoke with {"contentType": "manga", "totalPages": 20}
// 4. DELETE THIS ENTIRE FUNCTION after population is complete
// 5. Remove deployment: supabase functions delete temp-anilist-populate-enhanced