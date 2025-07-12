
import { ProcessItemResult } from './types.ts'
import { transformToTitleData, transformToAnimeDetails, transformToMangaDetails } from './transformers.ts'
import { ensureGenres, ensureStudios, ensureAuthors, linkTitleGenres, linkTitleStudios, linkTitleAuthors } from './database-operations.ts'

// Process a single item with proper database operations
export async function processSingleItem(supabase: any, item: any, contentType: 'anime' | 'manga'): Promise<ProcessItemResult> {
  try {
    console.log(`🔄 Processing ${contentType} item: ${item.id} - ${item.title?.romaji || item.title?.english}`)
    
    // Step 1: Insert/update title - check if it exists first
    const titleData = transformToTitleData(item)
    console.log(`📊 Title data for ${item.id}:`, { 
      anilist_id: titleData.anilist_id, 
      title: titleData.title,
      hasImage: !!titleData.image_url,
      hasScore: !!titleData.score 
    })
    
    // Check if title already exists
    const { data: existingTitle } = await supabase
      .from('titles')
      .select('id')
      .eq('anilist_id', titleData.anilist_id)
      .single()
    
    let titleId: string
    let titleProcessed = false
    
    if (existingTitle) {
      // Update existing title
      console.log(`📝 Updating existing title ${item.id}`)
      const { data: updatedTitle, error: updateError } = await supabase
        .from('titles')
        .update(titleData)
        .eq('anilist_id', titleData.anilist_id)
        .select('id')
        .single()
      
      if (updateError) {
        console.error(`❌ Title update failed for ${item.id}:`, updateError)
        return {
          success: false,
          titleProcessed: false,
          detailProcessed: false,
          genresCreated: 0,
          studiosCreated: 0,
          authorsCreated: 0,
          relationshipsCreated: 0,
          error: `Title update failed: ${updateError.message}`
        }
      }
      titleId = updatedTitle.id
      titleProcessed = true
    } else {
      // Insert new title
      console.log(`➕ Inserting new title ${item.id}`)
      const { data: newTitle, error: insertError } = await supabase
        .from('titles')
        .insert(titleData)
        .select('id')
        .single()
      
      if (insertError) {
        console.error(`❌ Title insertion failed for ${item.id}:`, insertError)
        return {
          success: false,
          titleProcessed: false,
          detailProcessed: false,
          genresCreated: 0,
          studiosCreated: 0,
          authorsCreated: 0,
          relationshipsCreated: 0,
          error: `Title insertion failed: ${insertError.message}`
        }
      }
      titleId = newTitle.id
      titleProcessed = true
    }
    
    // Step 2: Insert/update details using title_id as primary key
    let detailProcessed = false
    if (contentType === 'anime') {
      console.log(`📝 Processing anime details for ${item.id}`)
      const animeDetails = transformToAnimeDetails(item, titleId)
      const { data: detailResult, error: detailError } = await supabase
        .from('anime_details')
        .upsert(animeDetails, { onConflict: 'title_id' }) // Now using title_id as primary key
        .select('title_id')
        .single()
      
      if (detailError) {
        console.error(`❌ Anime details failed for ${item.id}:`, detailError)
      } else {
        console.log(`✅ Anime details processed for ${item.id}`)
        detailProcessed = true
      }
    } else {
      console.log(`📝 Processing manga details for ${item.id}`)
      const mangaDetails = transformToMangaDetails(item, titleId)
      const { data: detailResult, error: detailError } = await supabase
        .from('manga_details')
        .upsert(mangaDetails, { onConflict: 'title_id' }) // Now using title_id as primary key
        .select('title_id')
        .single()
      
      if (detailError) {
        console.error(`❌ Manga details failed for ${item.id}:`, detailError)
      } else {
        console.log(`✅ Manga details processed for ${item.id}`)
        detailProcessed = true
      }
    }
    
    // Step 3: Handle relationships
    const genres = item.genres || []
    const studios = contentType === 'anime' ? (item.studios?.nodes?.map((s: any) => s.name) || []) : []
    const authors = contentType === 'manga' ? (item.staff?.nodes?.filter((s: any) => 
      s.primaryOccupations?.includes('Story & Art') || s.primaryOccupations?.includes('Story')
    ).map((s: any) => s.name) || []) : []
    
    const { ids: genreIds, created: genresCreated } = await ensureGenres(supabase, genres, contentType)
    const { ids: studioIds, created: studiosCreated } = contentType === 'anime' ? 
      await ensureStudios(supabase, studios) : { ids: [], created: 0 }
    const { ids: authorIds, created: authorsCreated } = contentType === 'manga' ? 
      await ensureAuthors(supabase, authors) : { ids: [], created: 0 }
    
    // Link relationships
    let relationshipsCreated = 0
    relationshipsCreated += await linkTitleGenres(supabase, titleId, genreIds)
    if (contentType === 'anime') {
      relationshipsCreated += await linkTitleStudios(supabase, titleId, studioIds)
    } else {
      relationshipsCreated += await linkTitleAuthors(supabase, titleId, authorIds)
    }
    
    return {
      success: true,
      titleProcessed: titleProcessed,
      detailProcessed: detailProcessed,
      genresCreated,
      studiosCreated,
      authorsCreated,
      relationshipsCreated
    }
    
  } catch (error) {
    return {
      success: false,
      titleProcessed: false,
      detailProcessed: false,
      genresCreated: 0,
      studiosCreated: 0,
      authorsCreated: 0,
      relationshipsCreated: 0,
      error: error.message
    }
  }
}
