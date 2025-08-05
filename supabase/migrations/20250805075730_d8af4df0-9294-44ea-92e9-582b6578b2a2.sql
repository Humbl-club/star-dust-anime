-- Create trending anime view with improved scoring
CREATE OR REPLACE VIEW v_trending_anime AS
SELECT 
  t.*,
  ad.status,
  ad.next_episode_date,
  ad.episodes as total_episodes,
  ad.season,
  ad.type,
  CASE 
    WHEN ad.status = 'Currently Airing' THEN 1
    WHEN ad.status = 'Not yet aired' AND ad.aired_from <= CURRENT_DATE + INTERVAL '30 days' THEN 2
    ELSE 3
  END as airing_priority,
  (
    (COALESCE(t.popularity, 0) * 0.3) +
    (COALESCE(t.anilist_score, t.score, 0) * 10 * 0.3) +
    (CASE WHEN ad.next_episode_date > NOW() THEN 20 ELSE 0 END) +
    (CASE WHEN t.year = EXTRACT(YEAR FROM NOW()) THEN 10 ELSE 0 END) +
    (CASE WHEN ad.status = 'Currently Airing' THEN 15 ELSE 0 END)
  ) as trending_score
FROM titles t
INNER JOIN anime_details ad ON t.id = ad.title_id
WHERE (ad.status IN ('Currently Airing', 'Not yet aired') 
       OR (ad.status = 'Finished Airing' AND ad.aired_to >= CURRENT_DATE - INTERVAL '30 days'))
ORDER BY airing_priority ASC, trending_score DESC;

-- Create trending manga view with improved scoring
CREATE OR REPLACE VIEW v_trending_manga AS
SELECT 
  t.*,
  md.status,
  md.published_to,
  md.type,
  md.chapters,
  md.volumes,
  (
    (COALESCE(t.popularity, 0) * 0.3) +
    (COALESCE(t.anilist_score, t.score, 0) * 10 * 0.3) +
    (CASE WHEN md.status = 'Publishing' THEN 20 ELSE 0 END) +
    (CASE WHEN t.year = EXTRACT(YEAR FROM NOW()) THEN 10 ELSE 0 END) +
    (CASE WHEN md.status = 'Publishing' THEN 15 ELSE 0 END)
  ) as trending_score
FROM titles t
INNER JOIN manga_details md ON t.id = md.title_id
WHERE md.status IN ('Publishing', 'On Hiatus')
ORDER BY trending_score DESC;