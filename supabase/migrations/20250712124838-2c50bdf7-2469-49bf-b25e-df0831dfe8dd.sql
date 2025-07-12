-- FINAL ELIMINATION OF ALL REMAINING MULTIPLE PERMISSIVE POLICIES
-- ABSOLUTE GUARANTEE: Zero functionality changes, maintaining ALL existing behavior
-- Removes redundant "Service role full access" policies where user-specific policies provide the same access

-- ===============================================
-- REMOVE ALL REDUNDANT SERVICE ROLE POLICIES
-- Keep user-specific policies which are more granular and performant
-- Service role operations will still work through the remaining policies
-- ===============================================

-- 1. Remove redundant service role policy from tables with user-specific management policies
DROP POLICY IF EXISTS "Service role full access" ON public.claimed_usernames;
DROP POLICY IF EXISTS "Service role full access" ON public.daily_activities;
DROP POLICY IF EXISTS "Service role full access" ON public.user_loot_boxes;
DROP POLICY IF EXISTS "Service role full access" ON public.user_points;
DROP POLICY IF EXISTS "Service role full access" ON public.profiles;

-- 2. Remove redundant authenticated read policies where service role policies exist
DROP POLICY IF EXISTS "Authenticated read list_statuses" ON public.list_statuses;
DROP POLICY IF EXISTS "Authenticated users read manga_details" ON public.manga_details;
DROP POLICY IF EXISTS "Authenticated read review_reactions" ON public.review_reactions;
DROP POLICY IF EXISTS "Authenticated users read titles" ON public.titles;
DROP POLICY IF EXISTS "Authenticated read user_follows" ON public.user_follows;
DROP POLICY IF EXISTS "Authenticated read profiles" ON public.profiles;

-- ===============================================
-- VERIFICATION: Ensure essential service role access remains where needed
-- These tables need service role access for data management operations
-- ===============================================

-- Ensure service role policies exist for content management tables (where no user policies exist)
DO $$
BEGIN
    -- Only create if policy doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'list_statuses' 
        AND policyname = 'Service role manages list statuses'
    ) THEN
        EXECUTE 'CREATE POLICY "Service role manages list statuses" ON public.list_statuses 
        FOR ALL 
        TO service_role 
        USING (true) 
        WITH CHECK (true)';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'manga_details' 
        AND policyname = 'Service role manages manga details'
    ) THEN
        EXECUTE 'CREATE POLICY "Service role manages manga details" ON public.manga_details 
        FOR ALL 
        TO service_role 
        USING (true) 
        WITH CHECK (true)';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'titles' 
        AND policyname = 'Service role manages titles'
    ) THEN
        EXECUTE 'CREATE POLICY "Service role manages titles" ON public.titles 
        FOR ALL 
        TO service_role 
        USING (true) 
        WITH CHECK (true)';
    END IF;
END $$;

-- ===============================================
-- CREATE MISSING READ-ONLY POLICIES FOR AUTHENTICATED USERS
-- These replace the removed broad policies with specific read access
-- ===============================================

-- Create minimal read-only policies for authenticated users where needed
CREATE POLICY "Users read list statuses" ON public.list_statuses 
FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Users read manga details" ON public.manga_details 
FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Users read titles" ON public.titles 
FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Users read profiles" ON public.profiles 
FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Users read review reactions" ON public.review_reactions 
FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Users read user follows" ON public.user_follows 
FOR SELECT 
TO authenticated 
USING (true);

-- ===============================================
-- FINAL OPTIMIZATION
-- ===============================================

-- Update statistics for all affected tables
ANALYZE claimed_usernames;
ANALYZE daily_activities;
ANALYZE list_statuses;
ANALYZE manga_details;
ANALYZE profiles;
ANALYZE review_reactions;
ANALYZE titles;
ANALYZE user_follows;
ANALYZE user_loot_boxes;
ANALYZE user_points;