-- Enable RLS on tables that need it
ALTER TABLE public.titles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.genres ENABLE ROW LEVEL SECURITY;  
ALTER TABLE public.studios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.authors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.title_genres ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.title_studios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.title_authors ENABLE ROW LEVEL SECURITY;

-- Public read policies for content tables (these are public content catalogs)
CREATE POLICY "Public read titles" ON public.titles FOR SELECT USING (true);
CREATE POLICY "Public read genres" ON public.genres FOR SELECT USING (true);
CREATE POLICY "Public read studios" ON public.studios FOR SELECT USING (true);
CREATE POLICY "Public read authors" ON public.authors FOR SELECT USING (true);
CREATE POLICY "Public read title_genres" ON public.title_genres FOR SELECT USING (true);
CREATE POLICY "Public read title_studios" ON public.title_studios FOR SELECT USING (true);
CREATE POLICY "Public read title_authors" ON public.title_authors FOR SELECT USING (true);

-- Service role can manage all content data for syncing
CREATE POLICY "Service role manages titles" ON public.titles FOR ALL USING (true);
CREATE POLICY "Service role manages genres" ON public.genres FOR ALL USING (true);
CREATE POLICY "Service role manages studios" ON public.studios FOR ALL USING (true);
CREATE POLICY "Service role manages authors" ON public.authors FOR ALL USING (true);
CREATE POLICY "Service role manages title_genres" ON public.title_genres FOR ALL USING (true);
CREATE POLICY "Service role manages title_studios" ON public.title_studios FOR ALL USING (true);
CREATE POLICY "Service role manages title_authors" ON public.title_authors FOR ALL USING (true);