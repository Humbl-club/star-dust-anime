-- Add performance indexes for materialized views

-- Composite indexes for better query performance on trending data
CREATE INDEX IF NOT EXISTS idx_mv_currently_airing_trending ON mv_currently_airing(trending_score DESC, status);
CREATE INDEX IF NOT EXISTS idx_mv_currently_airing_status ON mv_currently_airing(status, aired_from);
CREATE INDEX IF NOT EXISTS idx_mv_currently_publishing_trending ON mv_currently_publishing(trending_score DESC, status);
CREATE INDEX IF NOT EXISTS idx_mv_currently_publishing_status ON mv_currently_publishing(status, published_from);

-- Partial indexes for specific status queries to improve performance
CREATE INDEX IF NOT EXISTS idx_mv_airing_active ON mv_currently_airing(id) 
WHERE status IN ('Currently Airing', 'Not yet aired');

CREATE INDEX IF NOT EXISTS idx_mv_publishing_active ON mv_currently_publishing(id) 
WHERE status = 'Publishing';

-- Additional performance indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_mv_currently_airing_score ON mv_currently_airing(score DESC) WHERE score IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_mv_currently_airing_popularity ON mv_currently_airing(popularity DESC) WHERE popularity IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_mv_currently_airing_year ON mv_currently_airing(year DESC) WHERE year IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_mv_currently_publishing_score ON mv_currently_publishing(score DESC) WHERE score IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_mv_currently_publishing_popularity ON mv_currently_publishing(popularity DESC) WHERE popularity IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_mv_currently_publishing_year ON mv_currently_publishing(year DESC) WHERE year IS NOT NULL;

-- Indexes for date-based queries
CREATE INDEX IF NOT EXISTS idx_mv_currently_airing_aired_from ON mv_currently_airing(aired_from DESC) WHERE aired_from IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_mv_currently_publishing_published_from ON mv_currently_publishing(published_from DESC) WHERE published_from IS NOT NULL;

-- Indexes for next episode/chapter date queries
CREATE INDEX IF NOT EXISTS idx_mv_currently_airing_next_episode ON mv_currently_airing(next_episode_date) WHERE next_episode_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_mv_currently_publishing_next_chapter ON mv_currently_publishing(next_chapter_date) WHERE next_chapter_date IS NOT NULL;