-- Fix RLS policies to allow service role access
-- Drop existing conflicting policies first
DROP POLICY IF EXISTS "Service role can manage manga data" ON public.manga;
DROP POLICY IF EXISTS "Service role can manage anime data" ON public.anime;

-- Create proper service role policies that actually work
CREATE POLICY "Service role full access to anime" ON public.anime 
FOR ALL 
TO service_role 
USING (true) 
WITH CHECK (true);

CREATE POLICY "Service role full access to manga" ON public.manga 
FOR ALL 
TO service_role 
USING (true) 
WITH CHECK (true);

-- Also ensure anon role can still read
CREATE POLICY "Public read access to anime" ON public.anime 
FOR SELECT 
TO anon 
USING (true);

CREATE POLICY "Public read access to manga" ON public.manga 
FOR SELECT 
TO anon 
USING (true);