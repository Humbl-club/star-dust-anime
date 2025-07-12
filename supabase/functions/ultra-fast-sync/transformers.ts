
// Transform AniList data to match our normalized database schema
export function transformToTitleData(item: any) {
  return {
    anilist_id: item.id,
    title: item.title?.romaji || item.title?.english || 'Unknown Title',
    title_english: item.title?.english || null,
    title_japanese: item.title?.native || null,
    synopsis: item.description?.replace(/<[^>]*>/g, '') || null,
    image_url: item.coverImage?.large || item.coverImage?.medium || null,
    score: item.averageScore || null,
    anilist_score: item.averageScore || null,
    popularity: item.popularity || 0,
    favorites: item.favourites || 0,
    members: item.popularity || 0,
    rank: item.meanScore ? Math.floor(item.meanScore * 10) : null,
    year: item.seasonYear || (item.startDate ? item.startDate.year : null),
    color_theme: item.coverImage?.color || null,
  }
}

export function transformToAnimeDetails(item: any, titleId: string) {
  return {
    title_id: titleId, // Primary key
    episodes: item.episodes || null,
    aired_from: item.startDate ? formatDate(item.startDate) : null,
    aired_to: item.endDate ? formatDate(item.endDate) : null,
    season: item.season || null,
    status: mapStatus(item.status),
    type: item.format || 'TV',
    trailer_url: item.trailer?.site === 'youtube' ? `https://www.youtube.com/watch?v=${item.trailer.id}` : null,
    trailer_id: item.trailer?.site === 'youtube' ? item.trailer.id : null,
    trailer_site: item.trailer?.site || null,
    next_episode_date: item.nextAiringEpisode ? new Date(item.nextAiringEpisode.airingAt * 1000).toISOString() : null,
    next_episode_number: item.nextAiringEpisode?.episode || null,
    last_sync_check: new Date().toISOString(),
  }
}

export function transformToMangaDetails(item: any, titleId: string) {
  return {
    title_id: titleId, // Primary key
    chapters: item.chapters || null,
    volumes: item.volumes || null,
    published_from: item.startDate ? formatDate(item.startDate) : null,
    published_to: item.endDate ? formatDate(item.endDate) : null,
    status: mapMangaStatus(item.status),
    type: item.format || 'Manga',
    last_sync_check: new Date().toISOString(),
  }
}

// Map AniList status to our database values
function mapStatus(status: string): string {
  const statusMap: { [key: string]: string } = {
    'FINISHED': 'Finished Airing',
    'RELEASING': 'Currently Airing',
    'NOT_YET_RELEASED': 'Not yet aired',
    'CANCELLED': 'Cancelled',
    'HIATUS': 'Hiatus'
  }
  return statusMap[status] || status || 'Finished Airing'
}

function mapMangaStatus(status: string): string {
  const statusMap: { [key: string]: string } = {
    'FINISHED': 'Finished',
    'RELEASING': 'Publishing',
    'NOT_YET_RELEASED': 'Not yet published',
    'CANCELLED': 'Cancelled',
    'HIATUS': 'On Hiatus'
  }
  return statusMap[status] || status || 'Finished'
}

// Safe date formatting
function formatDate(dateObj: any): string | null {
  if (!dateObj || !dateObj.year) return null
  
  const year = dateObj.year
  const month = dateObj.month || 1
  const day = dateObj.day || 1
  
  // Validate date components
  if (year < 1900 || year > 2100) return null
  if (month < 1 || month > 12) return null
  if (day < 1 || day > 31) return null
  
  // Check for invalid dates like Feb 31, Jun 31, etc.
  const daysInMonth = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
  if (day > daysInMonth[month - 1]) return null
  
  try {
    const date = new Date(year, month - 1, day)
    if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
      return null
    }
    return date.toISOString().split('T')[0]
  } catch {
    return null
  }
}
