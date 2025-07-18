
// Transform AniList data to normalized database schema
export function transformToTitleData(item: any) {
  return {
    anilist_id: item.id,
    title: item.title?.romaji || item.title?.english || 'Unknown Title',
    title_english: item.title?.english || null,
    title_japanese: item.title?.native || null,
    synopsis: item.description ? item.description.replace(/<[^>]*>/g, '').substring(0, 5000) : null,
    image_url: item.coverImage?.large || item.coverImage?.medium || null,
    score: item.averageScore ? (item.averageScore / 10) : null,
    anilist_score: item.averageScore ? (item.averageScore / 10) : null,
    rank: null, // Will be calculated later
    popularity: item.popularity || null,
    year: item.seasonYear || item.startDate?.year || null,
    color_theme: item.coverImage?.color || null,
    updated_at: new Date().toISOString()
  }
}

export function transformToAnimeDetails(item: any, titleId: string) {
  return {
    title_id: titleId,
    episodes: item.episodes || null,
    aired_from: formatDate(item.startDate),
    aired_to: formatDate(item.endDate),
    season: item.season || null,
    status: item.status || 'Finished Airing',
    type: item.format || 'TV',
    trailer_url: item.trailer?.id ? `https://www.youtube.com/watch?v=${item.trailer.id}` : null,
    trailer_site: item.trailer?.site || null,
    trailer_id: item.trailer?.id || null,
    next_episode_date: item.nextAiringEpisode ? new Date(item.nextAiringEpisode.airingAt * 1000).toISOString() : null,
    next_episode_number: item.nextAiringEpisode?.episode || null,
    last_sync_check: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
}

export function transformToMangaDetails(item: any, titleId: string) {
  return {
    title_id: titleId,
    chapters: item.chapters || null,
    volumes: item.volumes || null,
    published_from: formatDate(item.startDate),
    published_to: formatDate(item.endDate),
    status: item.status || 'Finished',
    type: item.format || 'Manga',
    next_chapter_date: null, // AniList doesn't provide this for manga
    next_chapter_number: null,
    last_sync_check: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
}

function formatDate(dateObj: any): string | null {
  if (!dateObj?.year) return null
  
  const year = dateObj.year
  const month = dateObj.month ? String(dateObj.month).padStart(2, '0') : '01'
  const day = dateObj.day ? String(dateObj.day).padStart(2, '0') : '01'
  
  return `${year}-${month}-${day}`
}
