import { supabase } from '@/integrations/supabase/client';

interface AniListTitle {
  id: number;
  title: {
    romaji: string;
    english?: string;
    native?: string;
  };
  description?: string;
  coverImage?: {
    large?: string;
  };
  genres?: string[];
  studios?: {
    nodes: Array<{ name: string }>;
  };
  staff?: {
    nodes: Array<{ name: { full: string }; role?: string }>;
  };
  averageScore?: number;
  popularity?: number;
  favourites?: number;
  startDate?: {
    year?: number;
  };
  episodes?: number;
  chapters?: number;
  volumes?: number;
  status?: string;
  format?: string;
  season?: string;
  seasonYear?: number;
}

interface SyncProgress {
  totalProcessed: number;
  errors: string[];
  animeCount: number;
  mangaCount: number;
  isRunning: boolean;
}

class BackgroundSyncService {
  private isRunning = false;
  private syncProgress: SyncProgress = {
    totalProcessed: 0,
    errors: [],
    animeCount: 0,
    mangaCount: 0,
    isRunning: false
  };
  private listeners: Array<(progress: SyncProgress) => void> = [];

  subscribe(listener: (progress: SyncProgress) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener({ ...this.syncProgress }));
  }

  private async fetchAniListData(mediaType: 'ANIME' | 'MANGA', page: number): Promise<AniListTitle[]> {
    const query = `
      query ($page: Int, $type: MediaType) {
        Page(page: $page, perPage: 50) {
          media(type: $type, sort: [POPULARITY_DESC]) {
            id
            title {
              romaji
              english
              native
            }
            description
            coverImage {
              large
            }
            genres
            studios {
              nodes {
                name
              }
            }
            staff(perPage: 5) {
              nodes {
                name {
                  full
                }
                role
              }
            }
            averageScore
            popularity
            favourites
            startDate {
              year
            }
            episodes
            chapters
            volumes
            status
            format
            season
            seasonYear
          }
        }
      }
    `;

    try {
      const response = await fetch('https://graphql.anilist.co', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query,
          variables: { page, type: mediaType }
        })
      });

      if (!response.ok) {
        throw new Error(`AniList API error: ${response.status}`);
      }

      const data = await response.json();
      return data.data?.Page?.media || [];
    } catch (error) {
      console.error(`Failed to fetch ${mediaType} data from AniList:`, error);
      throw error;
    }
  }

  private async processTitle(item: AniListTitle, contentType: 'anime' | 'manga') {
    try {
      // Check if title already exists
      const { data: existingTitle } = await supabase
        .from('titles')
        .select('id')
        .eq('anilist_id', item.id)
        .single();

      if (existingTitle) {
        console.log(`⏭️ Title ${item.id} already exists, skipping`);
        return false;
      }

      // Insert title
      const { data: newTitle, error: titleError } = await supabase
        .from('titles')
        .insert({
          anilist_id: item.id,
          title: item.title?.romaji || item.title?.english || 'Unknown Title',
          title_english: item.title?.english,
          title_japanese: item.title?.native,
          synopsis: item.description?.replace(/<[^>]*>/g, ''), // Remove HTML tags
          score: item.averageScore,
          popularity: item.popularity,
          favorites: item.favourites,
          year: item.startDate?.year,
          image_url: item.coverImage?.large,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select('id')
        .single();

      if (titleError) {
        throw new Error(`Failed to insert title: ${titleError.message}`);
      }

      // Insert anime/manga details
      if (contentType === 'anime') {
        await supabase
          .from('anime_details')
          .insert({
            title_id: newTitle.id,
            episodes: item.episodes,
            status: item.status,
            type: item.format,
            season: item.season,
            aired_from: item.startDate?.year ? `${item.startDate.year}-01-01` : null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
      } else {
        await supabase
          .from('manga_details')
          .insert({
            title_id: newTitle.id,
            chapters: item.chapters,
            volumes: item.volumes,
            status: item.status,
            type: item.format,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
      }

      // Process genres
      if (item.genres?.length) {
        for (const genreName of item.genres) {
          // Find or create genre
          let { data: genre } = await supabase
            .from('genres')
            .select('id')
            .eq('name', genreName)
            .single();

          if (!genre) {
            const { data: newGenre } = await supabase
              .from('genres')
              .insert({ name: genreName, type: 'both' })
              .select('id')
              .single();
            genre = newGenre;
          }

          if (genre) {
            await supabase
              .from('title_genres')
              .insert({
                title_id: newTitle.id,
                genre_id: genre.id
              })
              .select()
              .single();
          }
        }
      }

      // Process studios (for anime)
      if (contentType === 'anime' && item.studios?.nodes?.length) {
        for (const studioNode of item.studios.nodes) {
          if (!studioNode.name) continue;

          // Find or create studio
          let { data: studio } = await supabase
            .from('studios')
            .select('id')
            .eq('name', studioNode.name)
            .single();

          if (!studio) {
            const { data: newStudio } = await supabase
              .from('studios')
              .insert({ name: studioNode.name })
              .select('id')
              .single();
            studio = newStudio;
          }

          if (studio) {
            await supabase
              .from('title_studios')
              .insert({
                title_id: newTitle.id,
                studio_id: studio.id
              })
              .select()
              .single();
          }
        }
      }

      console.log(`✅ Successfully processed: ${item.title?.romaji} (ID: ${item.id})`);
      return true;
    } catch (error) {
      console.error(`❌ Failed to process title ${item.id}:`, error);
      throw error;
    }
  }

  private async syncBatch(contentType: 'anime' | 'manga', startPage: number, batchSize: number) {
    const mediaType = contentType.toUpperCase() as 'ANIME' | 'MANGA';
    let processedCount = 0;
    const errors: string[] = [];

    for (let page = startPage; page < startPage + batchSize; page++) {
      try {
        console.log(`📄 Fetching ${contentType} page ${page}...`);
        
        const items = await this.fetchAniListData(mediaType, page);
        
        if (!items.length) {
          console.log(`⚠️ No more ${contentType} data available at page ${page}`);
          break;
        }

        for (const item of items) {
          try {
            const wasProcessed = await this.processTitle(item, contentType);
            if (wasProcessed) {
              processedCount++;
              this.syncProgress.totalProcessed++;
            }
          } catch (error) {
            const errorMsg = `Failed to process ${contentType} ${item.id}: ${error.message}`;
            errors.push(errorMsg);
            this.syncProgress.errors.push(errorMsg);
          }
        }

        // Update progress and notify listeners
        const { count: animeCount } = await supabase
          .from('titles')
          .select('id', { count: 'exact' })
          .not('anime_details', 'is', null);
        
        const { count: mangaCount } = await supabase
          .from('titles')
          .select('id', { count: 'exact' })
          .not('manga_details', 'is', null);

        this.syncProgress.animeCount = animeCount || 0;
        this.syncProgress.mangaCount = mangaCount || 0;
        this.notifyListeners();

        // Rate limiting - small delay between pages
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        const errorMsg = `Failed to sync ${contentType} page ${page}: ${error.message}`;
        errors.push(errorMsg);
        this.syncProgress.errors.push(errorMsg);
        console.error(`❌ ${errorMsg}`);
      }
    }

    return { processedCount, errors };
  }

  async startBackgroundSync() {
    if (this.isRunning) {
      console.log('🔄 Background sync already running');
      return;
    }

    this.isRunning = true;
    this.syncProgress.isRunning = true;
    this.syncProgress.errors = [];
    
    console.log('🌙 Starting automated background sync...');
    
    try {
      // Get initial counts
      const { count: initialAnimeCount } = await supabase
        .from('titles')
        .select('id', { count: 'exact' })
        .not('anime_details', 'is', null);
      
      const { count: initialMangaCount } = await supabase
        .from('titles')
        .select('id', { count: 'exact' })
        .not('manga_details', 'is', null);

      this.syncProgress.animeCount = initialAnimeCount || 0;
      this.syncProgress.mangaCount = initialMangaCount || 0;
      this.notifyListeners();

      // Start with small batches - 5 pages each (250 items total)
      const animePage = Math.floor(Math.random() * 50) + 1; // Random starting point
      const mangaPage = Math.floor(Math.random() * 100) + 1;
      
      console.log(`🎬 Processing anime starting from page ${animePage}`);
      console.log(`📚 Processing manga starting from page ${mangaPage}`);

      // Process in parallel but with smaller batches
      const [animeResult, mangaResult] = await Promise.allSettled([
        this.syncBatch('anime', animePage, 5),
        this.syncBatch('manga', mangaPage, 5)
      ]);

      console.log('🎉 Background sync batch completed!');
      
      if (animeResult.status === 'fulfilled') {
        console.log(`✅ Anime: ${animeResult.value.processedCount} new titles`);
      } else {
        console.error('❌ Anime sync failed:', animeResult.reason);
      }
      
      if (mangaResult.status === 'fulfilled') {
        console.log(`✅ Manga: ${mangaResult.value.processedCount} new titles`);
      } else {
        console.error('❌ Manga sync failed:', mangaResult.reason);
      }

    } catch (error) {
      console.error('💥 Background sync critical error:', error);
      this.syncProgress.errors.push(`Critical error: ${error.message}`);
    } finally {
      this.isRunning = false;
      this.syncProgress.isRunning = false;
      this.notifyListeners();
    }
  }

  // Start continuous background sync with intelligent scheduling
  startContinuousSync() {
    // Initial sync
    this.startBackgroundSync();

    // Schedule regular syncs - every 10 minutes for small batches
    setInterval(() => {
      if (!this.isRunning) {
        console.log('⏰ Scheduled background sync starting...');
        this.startBackgroundSync();
      }
    }, 10 * 60 * 1000); // 10 minutes

    // Larger sync every hour during off-peak times
    setInterval(() => {
      if (!this.isRunning) {
        console.log('🌙 Large background sync starting...');
        // This could sync larger batches during off-peak hours
        this.startBackgroundSync();
      }
    }, 60 * 60 * 1000); // 1 hour
  }

  getProgress(): SyncProgress {
    return { ...this.syncProgress };
  }

  isActive(): boolean {
    return this.isRunning;
  }
}

export const backgroundSyncService = new BackgroundSyncService();