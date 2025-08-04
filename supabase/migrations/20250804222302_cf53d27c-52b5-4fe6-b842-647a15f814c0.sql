-- Add external_links column to titles table to store AniList external links data
ALTER TABLE public.titles 
ADD COLUMN external_links JSONB DEFAULT '[]'::jsonb;

-- Add an index for better performance when querying external links
CREATE INDEX idx_titles_external_links_gin ON public.titles USING GIN(external_links);

-- Add a comment to document the column
COMMENT ON COLUMN public.titles.external_links IS 'JSONB array containing external links from AniList API (streaming platforms, social media, etc.)';