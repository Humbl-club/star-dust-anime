export const createMockAnime = (overrides: any = {}) => ({
  id: 'test-anime-id',
  anilist_id: 12345,
  title: 'Test Anime',
  title_english: 'Test Anime (English)',
  title_japanese: 'テストアニメ',
  synopsis: 'This is a test anime synopsis',
  image_url: 'https://example.com/anime.jpg',
  score: 8.5,
  anilist_score: 85,
  rank: 100,
  popularity: 5000,
  year: 2024,
  color_theme: '#FF6B6B',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  episodes: 24,
  aired_from: '2024-01-01',
  aired_to: '2024-06-01',
  season: 'Winter',
  status: 'Finished Airing',
  type: 'TV',
  trailer_url: 'https://youtube.com/watch?v=test',
  trailer_site: 'youtube',
  trailer_id: 'test',
  next_episode_date: null,
  next_episode_number: null,
  last_sync_check: new Date().toISOString(),
  genres: [
    { id: 'genre-1', name: 'Action', type: 'anime' },
    { id: 'genre-2', name: 'Adventure', type: 'anime' },
  ],
  studios: [
    { id: 'studio-1', name: 'Test Studio' },
  ],
  ...overrides,
});

export const createMockManga = (overrides: any = {}) => ({
  id: 'test-manga-id',
  anilist_id: 54321,
  title: 'Test Manga',
  title_english: 'Test Manga (English)',
  title_japanese: 'テストマンガ',
  synopsis: 'This is a test manga synopsis',
  image_url: 'https://example.com/manga.jpg',
  score: 9.0,
  anilist_score: 90,
  rank: 50,
  popularity: 8000,
  year: 2023,
  color_theme: '#4ECDC4',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  chapters: 150,
  volumes: 15,
  published_from: '2023-01-01',
  published_to: null,
  status: 'Publishing',
  type: 'Manga',
  next_chapter_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  next_chapter_number: 151,
  last_sync_check: new Date().toISOString(),
  genres: [
    { id: 'genre-3', name: 'Drama', type: 'manga' },
    { id: 'genre-4', name: 'Romance', type: 'manga' },
  ],
  authors: [
    { id: 'author-1', name: 'Test Author' },
  ],
  ...overrides,
});

export const createMockTitleList = (count: number = 5, type: 'anime' | 'manga' = 'anime') => {
  return Array.from({ length: count }, (_, i) => 
    type === 'anime' 
      ? createMockAnime({ id: `test-${type}-${i}`, title: `Test ${type} ${i + 1}` })
      : createMockManga({ id: `test-${type}-${i}`, title: `Test ${type} ${i + 1}` })
  );
};