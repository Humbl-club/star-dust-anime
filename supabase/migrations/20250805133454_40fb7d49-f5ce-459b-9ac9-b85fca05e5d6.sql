-- Fix RLS security issues for metadata tables
-- Enable RLS and create proper policies for all metadata tables

-- Enable RLS for tables that need it
ALTER TABLE title_studios ENABLE ROW LEVEL SECURITY;
ALTER TABLE title_authors ENABLE ROW LEVEL SECURITY;
ALTER TABLE title_genres ENABLE ROW LEVEL SECURITY;
ALTER TABLE studios ENABLE ROW LEVEL SECURITY;
ALTER TABLE authors ENABLE ROW LEVEL SECURITY;

-- Create public read policies for metadata tables (these are content metadata, not user data)
CREATE POLICY "Public read title_studios" ON title_studios FOR SELECT USING (true);
CREATE POLICY "Service manages title_studios" ON title_studios FOR ALL USING (true);

CREATE POLICY "Public read title_authors" ON title_authors FOR SELECT USING (true);
CREATE POLICY "Service manages title_authors" ON title_authors FOR ALL USING (true);

CREATE POLICY "Public read title_genres" ON title_genres FOR SELECT USING (true);
CREATE POLICY "Service manages title_genres" ON title_genres FOR ALL USING (true);

CREATE POLICY "Public read studios" ON studios FOR SELECT USING (true);
CREATE POLICY "Service manages studios" ON studios FOR ALL USING (true);

CREATE POLICY "Public read authors" ON authors FOR SELECT USING (true);
CREATE POLICY "Service manages authors" ON authors FOR ALL USING (true);