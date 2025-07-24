
-- 1. First, add a content_type column if you want to track it directly
ALTER TABLE titles ADD COLUMN IF NOT EXISTS content_type TEXT;

-- 2. Update the content_type based on existing relationships
UPDATE titles 
SET content_type = CASE 
    WHEN EXISTS (SELECT 1 FROM anime_details WHERE title_id = titles.id) THEN 'anime'
    WHEN EXISTS (SELECT 1 FROM manga_details WHERE title_id = titles.id) THEN 'manga'
    ELSE NULL
END;

-- 3. Create index on content_type
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_titles_content_type 
ON titles(content_type) WHERE content_type IS NOT NULL;

-- 4. Better search index (this one is correct)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_titles_search_composite 
ON titles USING gin(
  to_tsvector('english', 
    title || ' ' || 
    COALESCE(title_english, '') || ' ' || 
    COALESCE(synopsis, '')
  )
);

-- 5. Add indexes for foreign keys (more important)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_anime_details_title_id 
ON anime_details(title_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_manga_details_title_id 
ON manga_details(title_id);

-- 6. Add indexes for common queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_titles_score_desc 
ON titles(score DESC NULLS LAST) WHERE score IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_titles_year_desc 
ON titles(year DESC NULLS LAST) WHERE year IS NOT NULL;

-- 7. Clean up orphaned records (these are correct)
DELETE FROM anime_details WHERE title_id NOT IN (SELECT id FROM titles);
DELETE FROM manga_details WHERE title_id NOT IN (SELECT id FROM titles);

-- 8. Add foreign key constraints to prevent future orphans
ALTER TABLE anime_details 
ADD CONSTRAINT fk_anime_details_title 
FOREIGN KEY (title_id) REFERENCES titles(id) ON DELETE CASCADE;

ALTER TABLE manga_details 
ADD CONSTRAINT fk_manga_details_title 
FOREIGN KEY (title_id) REFERENCES titles(id) ON DELETE CASCADE;

-- 9. Update statistics
ANALYZE titles, anime_details, manga_details;

-- 10. Create materialized view for better performance
CREATE MATERIALIZED VIEW IF NOT EXISTS titles_with_type AS
SELECT 
    t.*,
    CASE 
        WHEN ad.title_id IS NOT NULL THEN 'anime'
        WHEN md.title_id IS NOT NULL THEN 'manga'
        ELSE NULL
    END as content_type
FROM titles t
LEFT JOIN anime_details ad ON t.id = ad.title_id
LEFT JOIN manga_details md ON t.id = md.title_id;

-- Create index on the materialized view
CREATE INDEX IF NOT EXISTS idx_titles_with_type_content 
ON titles_with_type(content_type);

-- Create unique index on id for materialized view
CREATE UNIQUE INDEX IF NOT EXISTS idx_titles_with_type_id 
ON titles_with_type(id);

-- Add function to refresh materialized view automatically
CREATE OR REPLACE FUNCTION refresh_titles_with_type()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY titles_with_type;
END;
$$;

-- Add trigger to auto-update content_type when anime/manga details change
CREATE OR REPLACE FUNCTION update_title_content_type()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- Update content_type for the affected title
  UPDATE titles 
  SET content_type = CASE 
      WHEN EXISTS (SELECT 1 FROM anime_details WHERE title_id = COALESCE(NEW.title_id, OLD.title_id)) THEN 'anime'
      WHEN EXISTS (SELECT 1 FROM manga_details WHERE title_id = COALESCE(NEW.title_id, OLD.title_id)) THEN 'manga'
      ELSE NULL
  END
  WHERE id = COALESCE(NEW.title_id, OLD.title_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Create triggers for auto-updating content_type
DROP TRIGGER IF EXISTS trigger_update_content_type_anime ON anime_details;
CREATE TRIGGER trigger_update_content_type_anime
    AFTER INSERT OR UPDATE OR DELETE ON anime_details
    FOR EACH ROW
    EXECUTE FUNCTION update_title_content_type();

DROP TRIGGER IF EXISTS trigger_update_content_type_manga ON manga_details;
CREATE TRIGGER trigger_update_content_type_manga
    AFTER INSERT OR UPDATE OR DELETE ON manga_details
    FOR EACH ROW
    EXECUTE FUNCTION update_title_content_type();
