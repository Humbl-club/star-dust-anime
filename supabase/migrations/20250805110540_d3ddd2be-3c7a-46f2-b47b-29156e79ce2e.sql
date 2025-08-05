-- Enable RLS and add policies for the enhanced metadata tables
-- This fixes the critical security issues identified by the linter

-- Enable RLS on all new tables
ALTER TABLE public.genres_new ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.studios_enhanced ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.people ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.characters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.title_genres_enhanced ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.title_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.title_studios_enhanced ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.title_people ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.title_characters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.character_voice_actors ENABLE ROW LEVEL SECURITY;

-- Public read access for all metadata
CREATE POLICY "Public read genres_new" ON genres_new FOR SELECT USING (true);
CREATE POLICY "Public read studios_enhanced" ON studios_enhanced FOR SELECT USING (true);
CREATE POLICY "Public read tags" ON tags FOR SELECT USING (true);
CREATE POLICY "Public read people" ON people FOR SELECT USING (true);
CREATE POLICY "Public read characters" ON characters FOR SELECT USING (true);
CREATE POLICY "Public read title_genres_enhanced" ON title_genres_enhanced FOR SELECT USING (true);
CREATE POLICY "Public read title_tags" ON title_tags FOR SELECT USING (true);
CREATE POLICY "Public read title_studios_enhanced" ON title_studios_enhanced FOR SELECT USING (true);
CREATE POLICY "Public read title_people" ON title_people FOR SELECT USING (true);
CREATE POLICY "Public read title_characters" ON title_characters FOR SELECT USING (true);
CREATE POLICY "Public read character_voice_actors" ON character_voice_actors FOR SELECT USING (true);

-- Service role write access
CREATE POLICY "Service write genres_new" ON genres_new FOR ALL USING (true);
CREATE POLICY "Service write studios_enhanced" ON studios_enhanced FOR ALL USING (true);
CREATE POLICY "Service write tags" ON tags FOR ALL USING (true);
CREATE POLICY "Service write people" ON people FOR ALL USING (true);
CREATE POLICY "Service write characters" ON characters FOR ALL USING (true);
CREATE POLICY "Service write title_genres_enhanced" ON title_genres_enhanced FOR ALL USING (true);
CREATE POLICY "Service write title_tags" ON title_tags FOR ALL USING (true);
CREATE POLICY "Service write title_studios_enhanced" ON title_studios_enhanced FOR ALL USING (true);
CREATE POLICY "Service write title_people" ON title_people FOR ALL USING (true);
CREATE POLICY "Service write title_characters" ON title_characters FOR ALL USING (true);
CREATE POLICY "Service write character_voice_actors" ON character_voice_actors FOR ALL USING (true);

-- Add the rest of the original schema - materialized views
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_popular_genres AS
SELECT 
  g.id,
  g.name,
  g.slug,
  g.category,
  COUNT(DISTINCT tg.title_id) as title_count,
  AVG(tg.relevance_score) as avg_relevance
FROM genres_new g
LEFT JOIN title_genres_enhanced tg ON g.id = tg.genre_id
GROUP BY g.id
ORDER BY title_count DESC;

CREATE INDEX ON mv_popular_genres(slug);
CREATE INDEX ON mv_popular_genres(title_count DESC);

-- Popular tags view
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_popular_tags AS
SELECT 
  t.id,
  t.name,
  t.slug,
  t.category,
  COUNT(DISTINCT tt.title_id) as usage_count,
  AVG(tt.rank) as avg_rank,
  SUM(tt.votes) as total_votes
FROM tags t
LEFT JOIN title_tags tt ON t.id = tt.tag_id
GROUP BY t.id
ORDER BY usage_count DESC;

CREATE INDEX ON mv_popular_tags(slug);
CREATE INDEX ON mv_popular_tags(usage_count DESC);

-- Utility functions
CREATE OR REPLACE FUNCTION get_title_metadata(title_id_param UUID)
RETURNS TABLE(
  genres JSONB,
  tags JSONB,
  studios JSONB,
  creators JSONB,
  characters JSONB
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    (
      SELECT jsonb_agg(jsonb_build_object(
        'id', g.id,
        'name', g.name,
        'slug', g.slug,
        'category', g.category,
        'relevance', tg.relevance_score
      ) ORDER BY tg.relevance_score DESC)
      FROM title_genres_enhanced tg
      JOIN genres_new g ON tg.genre_id = g.id
      WHERE tg.title_id = title_id_param
    ) as genres,
    (
      SELECT jsonb_agg(jsonb_build_object(
        'id', t.id,
        'name', t.name,
        'slug', t.slug,
        'category', t.category,
        'rank', tt.rank,
        'votes', tt.votes,
        'is_spoiler', tt.is_spoiler
      ) ORDER BY tt.rank DESC)
      FROM title_tags tt
      JOIN tags t ON tt.tag_id = t.id
      WHERE tt.title_id = title_id_param
    ) as tags,
    (
      SELECT jsonb_agg(jsonb_build_object(
        'id', s.id,
        'name', s.name,
        'slug', s.slug,
        'is_main', ts.is_main_studio,
        'role', ts.role
      ) ORDER BY ts.is_main_studio DESC, s.name)
      FROM title_studios_enhanced ts
      JOIN studios_enhanced s ON ts.studio_id = s.id
      WHERE ts.title_id = title_id_param
    ) as studios,
    (
      SELECT jsonb_agg(jsonb_build_object(
        'id', p.id,
        'name', p.name,
        'slug', p.slug,
        'role', tp.role,
        'is_main', tp.is_main_creator
      ) ORDER BY tp.is_main_creator DESC, tp.role)
      FROM title_people tp
      JOIN people p ON tp.person_id = p.id
      WHERE tp.title_id = title_id_param
    ) as creators,
    (
      SELECT jsonb_agg(jsonb_build_object(
        'id', c.id,
        'name', c.name,
        'slug', c.slug,
        'role', tc.role,
        'order', tc.order_index,
        'voice_actors', (
          SELECT jsonb_agg(jsonb_build_object(
            'id', p.id,
            'name', p.name,
            'language', cva.language
          ))
          FROM character_voice_actors cva
          JOIN people p ON cva.person_id = p.id
          WHERE cva.character_id = c.id AND cva.title_id = title_id_param
        )
      ) ORDER BY tc.order_index, tc.role)
      FROM title_characters tc
      JOIN characters c ON tc.character_id = c.id
      WHERE tc.title_id = title_id_param
    ) as characters;
END;
$$;