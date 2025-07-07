// Create or get genre IDs for relationship linking
export async function ensureGenres(supabase: any, genres: string[], contentType: 'anime' | 'manga'): Promise<{ ids: string[], created: number }> {
  if (!genres.length) return { ids: [], created: 0 }
  
  let created = 0
  const genreIds: string[] = []
  
  for (const genreName of genres) {
    // Check if genre exists
    const { data: existing } = await supabase
      .from('genres')
      .select('id')
      .eq('name', genreName)
      .single()
    
    if (existing) {
      genreIds.push(existing.id)
    } else {
      // Create new genre
      const { data: newGenre, error } = await supabase
        .from('genres')
        .insert({ 
          name: genreName, 
          type: contentType === 'anime' ? 'anime' : 'manga' 
        })
        .select('id')
        .single()
      
      if (newGenre && !error) {
        genreIds.push(newGenre.id)
        created++
      }
    }
  }
  
  return { ids: genreIds, created }
}

// Create or get studio IDs for anime
export async function ensureStudios(supabase: any, studios: string[]): Promise<{ ids: string[], created: number }> {
  if (!studios.length) return { ids: [], created: 0 }
  
  let created = 0
  const studioIds: string[] = []
  
  for (const studioName of studios) {
    const { data: existing } = await supabase
      .from('studios')
      .select('id')
      .eq('name', studioName)
      .single()
    
    if (existing) {
      studioIds.push(existing.id)
    } else {
      const { data: newStudio, error } = await supabase
        .from('studios')
        .insert({ name: studioName })
        .select('id')
        .single()
      
      if (newStudio && !error) {
        studioIds.push(newStudio.id)
        created++
      }
    }
  }
  
  return { ids: studioIds, created }
}

// Create or get author IDs for manga
export async function ensureAuthors(supabase: any, authors: string[]): Promise<{ ids: string[], created: number }> {
  if (!authors.length) return { ids: [], created: 0 }
  
  let created = 0
  const authorIds: string[] = []
  
  for (const authorName of authors) {
    const { data: existing } = await supabase
      .from('authors')
      .select('id')
      .eq('name', authorName)
      .single()
    
    if (existing) {
      authorIds.push(existing.id)
    } else {
      const { data: newAuthor, error } = await supabase
        .from('authors')
        .insert({ name: authorName })
        .select('id')
        .single()
      
      if (newAuthor && !error) {
        authorIds.push(newAuthor.id)
        created++
      }
    }
  }
  
  return { ids: authorIds, created }
}

// Link title to genres through junction table
export async function linkTitleGenres(supabase: any, titleId: string, genreIds: string[]): Promise<number> {
  if (!genreIds.length) return 0
  
  // First remove existing relationships to avoid conflicts
  await supabase
    .from('title_genres')
    .delete()
    .eq('title_id', titleId)
  
  // Then insert new relationships
  const relationships = genreIds.map(genreId => ({
    title_id: titleId,
    genre_id: genreId
  }))
  
  const { data, error } = await supabase
    .from('title_genres')
    .insert(relationships)
    .select()
  
  return error ? 0 : (data?.length || 0)
}

// Link title to studios through junction table
export async function linkTitleStudios(supabase: any, titleId: string, studioIds: string[]): Promise<number> {
  if (!studioIds.length) return 0
  
  // First remove existing relationships to avoid conflicts
  await supabase
    .from('title_studios')
    .delete()
    .eq('title_id', titleId)
  
  // Then insert new relationships
  const relationships = studioIds.map(studioId => ({
    title_id: titleId,
    studio_id: studioId
  }))
  
  const { data, error } = await supabase
    .from('title_studios')
    .insert(relationships)
    .select()
  
  return error ? 0 : (data?.length || 0)
}

// Link title to authors through junction table
export async function linkTitleAuthors(supabase: any, titleId: string, authorIds: string[]): Promise<number> {
  if (!authorIds.length) return 0
  
  // First remove existing relationships to avoid conflicts
  await supabase
    .from('title_authors')
    .delete()
    .eq('title_id', titleId)
  
  // Then insert new relationships
  const relationships = authorIds.map(authorId => ({
    title_id: titleId,
    author_id: authorId
  }))
  
  const { data, error } = await supabase
    .from('title_authors')
    .insert(relationships)
    .select()
  
  return error ? 0 : (data?.length || 0)
}