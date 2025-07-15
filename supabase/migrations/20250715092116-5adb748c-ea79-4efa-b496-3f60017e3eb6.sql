-- Fix RLS policy for manga_details to allow anonymous access for stats
DROP POLICY IF EXISTS "Public content access" ON public.manga_details;

-- Create new policy that explicitly allows anon and authenticated users to read manga_details
CREATE POLICY "Public read manga_details" ON public.manga_details 
FOR SELECT 
TO anon, authenticated 
USING (true);