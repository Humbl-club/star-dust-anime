-- Create performance indexes for common queries
CREATE INDEX IF NOT EXISTS idx_titles_score_desc ON titles(score DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_titles_popularity_desc ON titles(popularity DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_titles_anilist_id ON titles(anilist_id);
CREATE INDEX IF NOT EXISTS idx_anime_details_status ON anime_details(status);
CREATE INDEX IF NOT EXISTS idx_manga_details_status ON manga_details(status);
CREATE INDEX IF NOT EXISTS idx_title_genres_composite ON title_genres(title_id, genre_id);

-- Additional indexes for trending/recent queries
CREATE INDEX IF NOT EXISTS idx_titles_year_desc ON titles(year DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_titles_created_at_desc ON titles(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_anime_details_aired_from ON anime_details(aired_from DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_manga_details_published_from ON manga_details(published_from DESC NULLS LAST);