export const mockAnimeList = [
  {
    id: '1',
    title: 'Test Anime',
    image_url: '/placeholder.jpg',
    score: 8.5,
    type: 'TV',
    episodes: 24
  }
];

export const mockMangaList = [
  {
    id: '1',
    title: 'Test Manga',
    image_url: '/placeholder.jpg',
    score: 9.0,
    type: 'Manga',
    chapters: 100,
    volumes: 10
  }
];

export const mockAnimeDetail = {
  id: '1',
  title: 'Test Anime',
  title_english: 'Test Anime English',
  synopsis: 'This is a test anime for testing purposes.',
  image_url: '/placeholder.jpg',
  score: 8.5,
  type: 'TV',
  episodes: 24,
  status: 'Finished Airing',
  aired_from: '2023-01-01',
  aired_to: '2023-06-30',
  genres: [
    { id: 1, name: 'Action' },
    { id: 2, name: 'Adventure' }
  ],
  studios: [
    { id: 1, name: 'Test Studio' }
  ]
};

export const mockMangaDetail = {
  id: '1',
  title: 'Test Manga',
  title_english: 'Test Manga English',
  synopsis: 'This is a test manga for testing purposes.',
  image_url: '/placeholder.jpg',
  score: 9.0,
  type: 'Manga',
  chapters: 100,
  volumes: 10,
  status: 'Finished',
  published_from: '2020-01-01',
  published_to: '2023-12-31',
  genres: [
    { id: 1, name: 'Action' },
    { id: 3, name: 'Drama' }
  ],
  authors: [
    { id: 1, name: 'Test Author' }
  ]
};

export const mockSearchResults = [
  {
    id: '1',
    title: 'Naruto',
    image_url: '/placeholder.jpg',
    score: 8.3,
    type: 'anime'
  },
  {
    id: '2',
    title: 'Naruto Shippuden',
    image_url: '/placeholder.jpg',
    score: 8.7,
    type: 'anime'
  }
];

export const mockUserProfile = {
  id: 'user-1',
  username: 'testuser',
  email: 'test@example.com',
  avatar_url: '/avatar.jpg'
};

export async function mockAPI(page: any) {
  // Mock anime list
  await page.route('**/supabase.co/rest/v1/titles*anime*', async (route: any) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(mockAnimeList)
    });
  });

  // Mock manga list
  await page.route('**/supabase.co/rest/v1/titles*manga*', async (route: any) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(mockMangaList)
    });
  });

  // Mock anime detail
  await page.route('**/supabase.co/rest/v1/titles*id=eq.1*', async (route: any) => {
    const url = route.request().url();
    const isManga = url.includes('manga');
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([isManga ? mockMangaDetail : mockAnimeDetail])
    });
  });

  // Mock search results
  await page.route('**/supabase.co/rest/v1/titles*search*', async (route: any) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(mockSearchResults)
    });
  });

  // Mock user profile
  await page.route('**/supabase.co/rest/v1/profiles*', async (route: any) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([mockUserProfile])
    });
  });

  // Mock authentication
  await page.route('**/supabase.co/auth/v1/token*', async (route: any) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        access_token: 'mock-token',
        user: mockUserProfile
      })
    });
  });
}

export async function mockAPIError(page: any, statusCode: number = 500) {
  await page.route('**/supabase.co/rest/v1/**', async (route: any) => {
    await route.fulfill({
      status: statusCode,
      contentType: 'application/json',
      body: JSON.stringify({
        error: 'Mock API Error',
        message: 'This is a mock error for testing'
      })
    });
  });
}

export async function mockSlowAPI(page: any, delay: number = 2000) {
  await page.route('**/supabase.co/rest/v1/**', async (route: any) => {
    await new Promise(resolve => setTimeout(resolve, delay));
    await route.continue();
  });
}