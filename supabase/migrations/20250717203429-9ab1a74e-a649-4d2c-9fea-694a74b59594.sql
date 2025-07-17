-- PERFORMANCE OPTIMIZATION - Critical Database Indexes
-- Add indexes for common sort/filter columns to dramatically improve query performance

-- Primary sort columns (most frequently used)
CREATE INDEX IF NOT EXISTS idx_titles_score_desc ON titles(score DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_titles_popularity_desc ON titles(popularity DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_titles_year_desc ON titles(year DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_titles_rank_desc ON titles(rank DESC NULLS LAST);

-- Full-text search index for title searches
CREATE INDEX IF NOT EXISTS idx_titles_search_gin ON titles USING gin (
  to_tsvector('english', 
    COALESCE(title, '') || ' ' || 
    COALESCE(title_english, '') || ' ' || 
    COALESCE(title_japanese, '')
  )
);

-- Composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_titles_score_year ON titles(score DESC NULLS LAST, year DESC);
CREATE INDEX IF NOT EXISTS idx_titles_popularity_year ON titles(popularity DESC NULLS LAST, year DESC);

-- Content-specific indexes for filtering
CREATE INDEX IF NOT EXISTS idx_anime_details_status ON anime_details(status);
CREATE INDEX IF NOT EXISTS idx_anime_details_type ON anime_details(type);
CREATE INDEX IF NOT EXISTS idx_anime_details_season ON anime_details(season);
CREATE INDEX IF NOT EXISTS idx_anime_details_status_type ON anime_details(status, type);

CREATE INDEX IF NOT EXISTS idx_manga_details_status ON manga_details(status);
CREATE INDEX IF NOT EXISTS idx_manga_details_type ON manga_details(type);
CREATE INDEX IF NOT EXISTS idx_manga_details_status_type ON manga_details(status, type);

-- Junction table indexes for genre filtering
CREATE INDEX IF NOT EXISTS idx_title_genres_genre_id ON title_genres(genre_id);
CREATE INDEX IF NOT EXISTS idx_title_genres_title_genre ON title_genres(title_id, genre_id);

-- Junction table indexes for studio/author filtering
CREATE INDEX IF NOT EXISTS idx_title_studios_studio_id ON title_studios(studio_id);
CREATE INDEX IF NOT EXISTS idx_title_authors_author_id ON title_authors(author_id);

-- Update table statistics for query planner
ANALYZE titles;
ANALYZE anime_details;
ANALYZE manga_details;
ANALYZE title_genres;
ANALYZE title_studios;
ANALYZE title_authors;