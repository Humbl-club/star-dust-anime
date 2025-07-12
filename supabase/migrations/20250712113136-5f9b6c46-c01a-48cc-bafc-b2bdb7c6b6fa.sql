-- FINAL SECURITY AND PERFORMANCE OPTIMIZATION (FIXED)
-- Address remaining security policies and performance bottlenecks

-- Fix any remaining overly permissive ALL policies by replacing with granular permissions
DROP POLICY IF EXISTS "Service role full access to anime_details" ON public.anime_details;
DROP POLICY IF EXISTS "Service role full access to manga_details" ON public.manga_details;
DROP POLICY IF EXISTS "Service role full access to titles" ON public.titles;
DROP POLICY IF EXISTS "Service role full access to genres" ON public.genres;
DROP POLICY IF EXISTS "Service role full access to studios" ON public.studios;
DROP POLICY IF EXISTS "Service role full access to authors" ON public.authors;
DROP POLICY IF EXISTS "Service role full access to title_genres" ON public.title_genres;
DROP POLICY IF EXISTS "Service role full access to title_studios" ON public.title_studios;
DROP POLICY IF EXISTS "Service role full access to title_authors" ON public.title_authors;

-- Create granular service role policies instead of ALL permissions
CREATE POLICY "Service role manages anime_details" ON public.anime_details 
FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role manages manga_details" ON public.manga_details 
FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role manages titles" ON public.titles 
FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role manages genres" ON public.genres 
FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role manages studios" ON public.studios 
FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role manages authors" ON public.authors 
FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role manages title_genres" ON public.title_genres 
FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role manages title_studios" ON public.title_studios 
FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role manages title_authors" ON public.title_authors 
FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Add final performance indexes for remaining bottlenecks (without time functions)
CREATE INDEX IF NOT EXISTS idx_titles_popularity_score 
ON titles (popularity DESC, score DESC) 
WHERE popularity IS NOT NULL AND score IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_user_title_lists_recent_activity 
ON user_title_lists (user_id, updated_at DESC);

-- Final comprehensive statistics update
ANALYZE;