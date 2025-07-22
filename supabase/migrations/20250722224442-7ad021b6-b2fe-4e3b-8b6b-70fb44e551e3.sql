-- Add critical performance indexes for 65k+ titles

-- Score-based sorting (most common)
CREATE INDEX IF NOT EXISTS idx_titles_score_desc ON titles(score DESC NULLS LAST);

-- Popularity sorting
CREATE INDEX IF NOT EXISTS idx_titles_popularity_desc ON titles(popularity DESC NULLS LAST);

-- Recent additions
CREATE INDEX IF NOT EXISTS idx_titles_created_at_desc ON titles(created_at DESC);

-- Year filtering
CREATE INDEX IF NOT EXISTS idx_titles_year_desc ON titles(year DESC NULLS LAST);

-- Anime status filtering
CREATE INDEX IF NOT EXISTS idx_anime_details_status ON anime_details(status);
CREATE INDEX IF NOT EXISTS idx_anime_details_type ON anime_details(type);

-- Manga status filtering  
CREATE INDEX IF NOT EXISTS idx_manga_details_status ON manga_details(status);
CREATE INDEX IF NOT EXISTS idx_manga_details_type ON manga_details(type);

-- Genre filtering (for title_genres join table)
CREATE INDEX IF NOT EXISTS idx_title_genres_genre_id ON title_genres(genre_id);
CREATE INDEX IF NOT EXISTS idx_title_genres_title_id ON title_genres(title_id);

-- Full-text search index for titles
CREATE INDEX IF NOT EXISTS idx_titles_search 
ON titles USING gin(to_tsvector('english', 
  title || ' ' || 
  COALESCE(title_english, '') || ' ' || 
  COALESCE(title_japanese, '')
));

-- Composite indexes for common filtered queries
CREATE INDEX IF NOT EXISTS idx_titles_score_year ON titles(score DESC NULLS LAST, year DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_titles_popularity_year ON titles(popularity DESC NULLS LAST, year DESC NULLS LAST);

-- Anilist ID for external sync operations
CREATE INDEX IF NOT EXISTS idx_titles_anilist_id ON titles(anilist_id);

-- Foreign key indexes for better join performance
CREATE INDEX IF NOT EXISTS idx_anime_details_title_id ON anime_details(title_id);
CREATE INDEX IF NOT EXISTS idx_manga_details_title_id ON manga_details(title_id);

-- Studio and author relationship indexes
CREATE INDEX IF NOT EXISTS idx_title_studios_studio_id ON title_studios(studio_id);
CREATE INDEX IF NOT EXISTS idx_title_studios_title_id ON title_studios(title_id);
CREATE INDEX IF NOT EXISTS idx_title_authors_author_id ON title_authors(author_id);
CREATE INDEX IF NOT EXISTS idx_title_authors_title_id ON title_authors(title_id);