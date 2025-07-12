-- COMPREHENSIVE SECURITY HARDENING - Phase 1
-- Fix all remaining overly permissive policies

-- Drop all remaining "public" role policies that are security risks
DROP POLICY IF EXISTS "Public read access to title_genres" ON public.title_genres;
DROP POLICY IF EXISTS "Public read access to title_studios" ON public.title_studios;
DROP POLICY IF EXISTS "Public read access to title_authors" ON public.title_authors;
DROP POLICY IF EXISTS "Public read list statuses" ON public.list_statuses;
DROP POLICY IF EXISTS "Public read claimed usernames" ON public.claimed_usernames;
DROP POLICY IF EXISTS "Public read generated characters" ON public.generated_characters;
DROP POLICY IF EXISTS "Public read access to username_pool" ON public.username_pool;
DROP POLICY IF EXISTS "Public read legal pages" ON public.legal_pages;
DROP POLICY IF EXISTS "Public read reviews" ON public.reviews;
DROP POLICY IF EXISTS "Public read review reactions" ON public.review_reactions;
DROP POLICY IF EXISTS "Public read follows" ON public.user_follows;
DROP POLICY IF EXISTS "Public read attributions" ON public.api_attributions;

-- Replace with authenticated-only policies for better security
CREATE POLICY "Authenticated read title_genres" ON public.title_genres 
FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated read title_studios" ON public.title_studios 
FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated read title_authors" ON public.title_authors 
FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated read list_statuses" ON public.list_statuses 
FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated read claimed_usernames" ON public.claimed_usernames 
FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated read generated_characters" ON public.generated_characters 
FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated read username_pool" ON public.username_pool 
FOR SELECT TO authenticated USING (true);

-- Public content that can remain public but with restrictions
CREATE POLICY "Public read legal_pages" ON public.legal_pages 
FOR SELECT TO anon USING (true);

CREATE POLICY "Authenticated read reviews" ON public.reviews 
FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated read review_reactions" ON public.review_reactions 
FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated read user_follows" ON public.user_follows 
FOR SELECT TO authenticated USING (true);

CREATE POLICY "Public read api_attributions" ON public.api_attributions 
FOR SELECT TO anon USING (is_active = true);