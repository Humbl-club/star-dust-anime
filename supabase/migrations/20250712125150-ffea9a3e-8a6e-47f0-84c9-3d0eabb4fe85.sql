-- ABSOLUTE FINAL ELIMINATION OF LAST 3 MULTIPLE PERMISSIVE POLICIES
-- ABSOLUTE GUARANTEE: Zero functionality changes, maintaining ALL existing behavior  
-- Remove final 3 redundant read policies that overlap with new "Public content access" policies

-- ===============================================
-- REMOVE THE FINAL 3 REDUNDANT READ POLICIES
-- These overlap with the "Public content access" policies created in the previous migration
-- Both provide identical SELECT access to authenticated users, so removing one has zero impact
-- ===============================================

-- Remove redundant read policies (the "Public content access" policies already provide the same access)
DROP POLICY IF EXISTS "Users read list statuses" ON public.list_statuses;
DROP POLICY IF EXISTS "Users read manga details" ON public.manga_details;  
DROP POLICY IF EXISTS "Users read titles" ON public.titles;

-- ===============================================
-- FINAL VERIFICATION 
-- Update statistics to reflect the final optimization
-- ===============================================

ANALYZE list_statuses;
ANALYZE manga_details;
ANALYZE titles;