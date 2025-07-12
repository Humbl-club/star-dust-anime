-- SECURITY AND PERFORMANCE RESOLUTION (Transaction-Safe)
-- Target all 16 security issues and 113 performance issues

-- SECURITY: Remove ALL existing policies and create secure ones
DROP POLICY IF EXISTS "Authenticated read anime_details" ON public.anime_details;
DROP POLICY IF EXISTS "Authenticated read manga_details" ON public.manga_details;
DROP POLICY IF EXISTS "Authenticated read titles" ON public.titles;
DROP POLICY IF EXISTS "Authenticated read genres" ON public.genres;
DROP POLICY IF EXISTS "Authenticated read studios" ON public.studios;
DROP POLICY IF EXISTS "Authenticated read authors" ON public.authors;
DROP POLICY IF EXISTS "Authenticated read title_genres" ON public.title_genres;
DROP POLICY IF EXISTS "Authenticated read title_studios" ON public.title_studios;
DROP POLICY IF EXISTS "Authenticated read title_authors" ON public.title_authors;
DROP POLICY IF EXISTS "Service role manages anime_details" ON public.anime_details;
DROP POLICY IF EXISTS "Service role manages manga_details" ON public.manga_details;
DROP POLICY IF EXISTS "Service role manages titles" ON public.titles;
DROP POLICY IF EXISTS "Service role manages genres" ON public.genres;
DROP POLICY IF EXISTS "Service role manages studios" ON public.studios;
DROP POLICY IF EXISTS "Service role manages authors" ON public.authors;
DROP POLICY IF EXISTS "Service role manages title_genres" ON public.title_genres;
DROP POLICY IF EXISTS "Service role manages title_studios" ON public.title_studios;
DROP POLICY IF EXISTS "Service role manages title_authors" ON public.title_authors;

-- Create secure READ-ONLY policies for authenticated users
CREATE POLICY "Auth read anime_details" ON public.anime_details 
FOR SELECT TO authenticated USING (true);

CREATE POLICY "Auth read manga_details" ON public.manga_details 
FOR SELECT TO authenticated USING (true);

CREATE POLICY "Auth read titles" ON public.titles 
FOR SELECT TO authenticated USING (true);

CREATE POLICY "Auth read genres" ON public.genres 
FOR SELECT TO authenticated USING (true);

CREATE POLICY "Auth read studios" ON public.studios 
FOR SELECT TO authenticated USING (true);

CREATE POLICY "Auth read authors" ON public.authors 
FOR SELECT TO authenticated USING (true);

CREATE POLICY "Auth read title_genres" ON public.title_genres 
FOR SELECT TO authenticated USING (true);

CREATE POLICY "Auth read title_studios" ON public.title_studios 
FOR SELECT TO authenticated USING (true);

CREATE POLICY "Auth read title_authors" ON public.title_authors 
FOR SELECT TO authenticated USING (true);

-- Service role specific WRITE policies
CREATE POLICY "Service insert anime_details" ON public.anime_details 
FOR INSERT TO service_role WITH CHECK (true);

CREATE POLICY "Service update anime_details" ON public.anime_details 
FOR UPDATE TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service delete anime_details" ON public.anime_details 
FOR DELETE TO service_role USING (true);

CREATE POLICY "Service insert manga_details" ON public.manga_details 
FOR INSERT TO service_role WITH CHECK (true);

CREATE POLICY "Service update manga_details" ON public.manga_details 
FOR UPDATE TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service delete manga_details" ON public.manga_details 
FOR DELETE TO service_role USING (true);

CREATE POLICY "Service insert titles" ON public.titles 
FOR INSERT TO service_role WITH CHECK (true);

CREATE POLICY "Service update titles" ON public.titles 
FOR UPDATE TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service delete titles" ON public.titles 
FOR DELETE TO service_role USING (true);

CREATE POLICY "Service insert genres" ON public.genres 
FOR INSERT TO service_role WITH CHECK (true);

CREATE POLICY "Service update genres" ON public.genres 
FOR UPDATE TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service delete genres" ON public.genres 
FOR DELETE TO service_role USING (true);

CREATE POLICY "Service insert studios" ON public.studios 
FOR INSERT TO service_role WITH CHECK (true);

CREATE POLICY "Service update studios" ON public.studios 
FOR UPDATE TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service delete studios" ON public.studios 
FOR DELETE TO service_role USING (true);

CREATE POLICY "Service insert authors" ON public.authors 
FOR INSERT TO service_role WITH CHECK (true);

CREATE POLICY "Service update authors" ON public.authors 
FOR UPDATE TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service delete authors" ON public.authors 
FOR DELETE TO service_role USING (true);

CREATE POLICY "Service insert title_genres" ON public.title_genres 
FOR INSERT TO service_role WITH CHECK (true);

CREATE POLICY "Service update title_genres" ON public.title_genres 
FOR UPDATE TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service delete title_genres" ON public.title_genres 
FOR DELETE TO service_role USING (true);

CREATE POLICY "Service insert title_studios" ON public.title_studios 
FOR INSERT TO service_role WITH CHECK (true);

CREATE POLICY "Service update title_studios" ON public.title_studios 
FOR UPDATE TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service delete title_studios" ON public.title_studios 
FOR DELETE TO service_role USING (true);

CREATE POLICY "Service insert title_authors" ON public.title_authors 
FOR INSERT TO service_role WITH CHECK (true);

CREATE POLICY "Service update title_authors" ON public.title_authors 
FOR UPDATE TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service delete title_authors" ON public.title_authors 
FOR DELETE TO service_role USING (true);

-- PERFORMANCE: Create optimized indexes
-- Anime/Manga details performance
CREATE INDEX IF NOT EXISTS idx_anime_details_fast_lookup 
ON anime_details (title_id, status, type) 
WHERE status IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_manga_details_fast_lookup 
ON manga_details (title_id, status, type) 
WHERE status IS NOT NULL;

-- Titles performance
CREATE INDEX IF NOT EXISTS idx_titles_search_optimized 
ON titles (popularity DESC, score DESC) 
WHERE popularity IS NOT NULL AND score IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_titles_year_lookup 
ON titles (year DESC) 
WHERE year IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_titles_anilist_fast 
ON titles (anilist_id) 
WHERE anilist_id IS NOT NULL;

-- Junction tables performance
CREATE INDEX IF NOT EXISTS idx_title_genres_fast 
ON title_genres (title_id);

CREATE INDEX IF NOT EXISTS idx_genres_title_fast 
ON title_genres (genre_id);

CREATE INDEX IF NOT EXISTS idx_title_studios_fast 
ON title_studios (title_id);

CREATE INDEX IF NOT EXISTS idx_studios_title_fast 
ON title_studios (studio_id);

CREATE INDEX IF NOT EXISTS idx_title_authors_fast 
ON title_authors (title_id);

CREATE INDEX IF NOT EXISTS idx_authors_title_fast 
ON title_authors (author_id);

-- User activity performance
CREATE INDEX IF NOT EXISTS idx_user_lists_fast_query 
ON user_title_lists (user_id, media_type, status_id);

CREATE INDEX IF NOT EXISTS idx_user_lists_score_filter 
ON user_title_lists (score DESC) 
WHERE score IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_user_lists_updated 
ON user_title_lists (updated_at DESC);

-- Reviews performance
CREATE INDEX IF NOT EXISTS idx_reviews_title_lookup 
ON reviews (title_id, rating DESC) 
WHERE rating IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_reviews_user_lookup 
ON reviews (user_id, created_at DESC);

-- Activity feed performance
CREATE INDEX IF NOT EXISTS idx_activity_user_type 
ON activity_feed (user_id, activity_type);

CREATE INDEX IF NOT EXISTS idx_activity_created 
ON activity_feed (created_at DESC);

-- Table optimizations
ALTER TABLE titles SET (fillfactor = 90);
ALTER TABLE user_title_lists SET (fillfactor = 85);

-- Ultra-aggressive autovacuum
ALTER TABLE titles SET (
  autovacuum_vacuum_scale_factor = 0.01,
  autovacuum_analyze_scale_factor = 0.005,
  autovacuum_vacuum_threshold = 10,
  autovacuum_analyze_threshold = 5
);

ALTER TABLE user_title_lists SET (
  autovacuum_vacuum_scale_factor = 0.02,
  autovacuum_analyze_scale_factor = 0.01,
  autovacuum_vacuum_threshold = 25,
  autovacuum_analyze_threshold = 10
);

-- Statistics optimization
ALTER TABLE titles ALTER COLUMN popularity SET STATISTICS 1000;
ALTER TABLE titles ALTER COLUMN score SET STATISTICS 1000;
ALTER TABLE user_title_lists ALTER COLUMN status_id SET STATISTICS 500;

-- Final analyze
ANALYZE;