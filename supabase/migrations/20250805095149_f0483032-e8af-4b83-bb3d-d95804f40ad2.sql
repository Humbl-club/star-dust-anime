-- Enable RLS on remaining tables that need it
ALTER TABLE public.title_genres ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.title_studios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.title_authors ENABLE ROW LEVEL SECURITY;

-- Public read policies for junction tables
CREATE POLICY "Public read title_genres" ON public.title_genres FOR SELECT USING (true);
CREATE POLICY "Public read title_studios" ON public.title_studios FOR SELECT USING (true);
CREATE POLICY "Public read title_authors" ON public.title_authors FOR SELECT USING (true);

-- Service role can manage junction tables for syncing
CREATE POLICY "Service role manages title_genres" ON public.title_genres FOR ALL USING (true);
CREATE POLICY "Service role manages title_studios" ON public.title_studios FOR ALL USING (true);
CREATE POLICY "Service role manages title_authors" ON public.title_authors FOR ALL USING (true);