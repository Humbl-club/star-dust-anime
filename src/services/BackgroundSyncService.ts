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
    nodes: Array<{ name: { full: string } }>;
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
      console.log(`🌐 Fetching ${mediaType} page ${page} from AniList...`);
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
        const errorText = await response.text();
        console.error(`❌ AniList API error ${response.status} for ${mediaType} page ${page}:`, errorText);
        throw new Error(`AniList API error: ${response.status}`);
      }

      const data = await response.json();
      const items = data.data?.Page?.media || [];
      console.log(`✅ Received ${items.length} ${mediaType} items from page ${page}`);
      return items;
    } catch (error) {
      console.error(`💥 Failed to fetch ${mediaType} data from AniList:`, error);
      throw error;
    }
  }

  private async processTitle(item: AniListTitle, contentType: 'anime' | 'manga') {
    try {
      console.log(`🔍 Processing ${contentType}: ${item.title?.romaji} (ID: ${item.id})`);
      
      // Check if title already exists
      const { data: existingTitle, error: checkError } = await supabase
        .from('titles')
        .select('id')
        .eq('anilist_id', item.id)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        console.error(`❌ Database check error for ${item.id}:`, checkError);
        throw new Error(`Database check failed: ${checkError.message}`);
      }

      if (existingTitle) {
        console.log(`⏭️ ${item.title?.romaji} (${item.id}) already exists - skipping`);
        return false;
      }

      console.log(`➕ ADDING NEW ${contentType}: ${item.title?.romaji} (ID: ${item.id})`);
      
      // Insert title
      const { data: newTitle, error: titleError } = await supabase
        .from('titles')
        .insert({
          anilist_id: item.id,
          title: item.title?.romaji || item.title?.english || 'Unknown Title',
          title_english: item.title?.english,
          title_japanese: item.title?.native,
          synopsis: item.description?.replace(/<[^>]*>/g, ''),
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
        console.error(`❌ Failed to insert title ${item.id}:`, titleError);
        throw new Error(`Title insert failed: ${titleError.message}`);
      }

      console.log(`✅ Inserted title: ${newTitle.id}`);
      
      // Insert specific details
      if (contentType === 'anime') {
        const { error: detailsError } = await supabase
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
        
        if (detailsError) {
          console.error(`❌ Anime details error for ${item.id}:`, detailsError);
        } else {
          console.log(`✅ Added anime details for: ${item.title?.romaji}`);
        }
      } else {
        const { error: detailsError } = await supabase
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
        
        if (detailsError) {
          console.error(`❌ Manga details error for ${item.id}:`, detailsError);
        } else {
          console.log(`✅ Added manga details for: ${item.title?.romaji}`);
        }
      }

      console.log(`🎉 SUCCESSFULLY PROCESSED: ${item.title?.romaji} (ID: ${item.id})`);
      return true;
    } catch (error) {
      console.error(`💥 Processing failed for ${item.id}:`, error);
      throw error;
    }
  }

  private async syncBatch(contentType: 'anime' | 'manga', startPage: number, batchSize: number) {
    const mediaType = contentType.toUpperCase() as 'ANIME' | 'MANGA';
    let processedCount = 0;
    const errors: string[] = [];

    console.log(`🚀 Starting ${contentType} batch: pages ${startPage}-${startPage + batchSize - 1}`);

    for (let page = startPage; page < startPage + batchSize; page++) {
      try {
        const items = await this.fetchAniListData(mediaType, page);
        
        if (!items.length) {
          console.log(`⚠️ No ${contentType} data on page ${page} - stopping batch`);
          break;
        }

        let successInPage = 0;
        for (const item of items) {
          try {
            const wasProcessed = await this.processTitle(item, contentType);
            if (wasProcessed) {
              processedCount++;
              successInPage++;
              this.syncProgress.totalProcessed++;
            }
          } catch (error) {
            const errorMsg = `${contentType} ${item.id}: ${error.message}`;
            errors.push(errorMsg);
            this.syncProgress.errors.push(errorMsg);
            console.error(`❌ ${errorMsg}`);
          }
        }

        console.log(`📄 Page ${page} complete: ${successInPage}/${items.length} new ${contentType} titles`);

        // Update counts and notify
        const { count: animeCount } = await supabase
          .from('anime_details')
          .select('id', { count: 'exact' });
        
        const { count: mangaCount } = await supabase
          .from('manga_details')
          .select('id', { count: 'exact' });

        this.syncProgress.animeCount = animeCount || 0;
        this.syncProgress.mangaCount = mangaCount || 0;
        this.notifyListeners();

        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        const errorMsg = `${contentType} page ${page}: ${error.message}`;
        errors.push(errorMsg);
        this.syncProgress.errors.push(errorMsg);
        console.error(`❌ ${errorMsg}`);
      }
    }

    console.log(`🏁 ${contentType} batch complete: ${processedCount} new titles processed`);
    return { processedCount, errors };
  }

  async startBackgroundSync() {
    if (this.isRunning) {
      console.log('🔄 Sync already running - skipping');
      return;
    }

    this.isRunning = true;
    this.syncProgress.isRunning = true;
    this.syncProgress.errors = [];
    
    console.log('🌙 STARTING AUTOMATED BACKGROUND SYNC...');
    this.notifyListeners();
    
    try {
      // Get initial counts
      const { count: initialAnimeCount } = await supabase
        .from('anime_details')
        .select('id', { count: 'exact' });
      
      const { count: initialMangaCount } = await supabase
        .from('manga_details')
        .select('id', { count: 'exact' });

      this.syncProgress.animeCount = initialAnimeCount || 0;
      this.syncProgress.mangaCount = initialMangaCount || 0;
      this.notifyListeners();

      console.log(`📊 Starting sync with: ${initialAnimeCount} anime, ${initialMangaCount} manga`);

      // Start from higher pages to find NEW titles (pages 1-33 likely already exist)
      // We have 1673 anime (≈33 pages) and 1600 manga (≈32 pages) already
      const animeStartPage = Math.ceil(1673 / 50) + 1; // Start after existing titles
      const mangaStartPage = Math.ceil(1600 / 50) + 1; // Start after existing titles
      
      console.log(`🎯 SMART SYNC: Starting anime from page ${animeStartPage}, manga from page ${mangaStartPage}`);
      
      const [animeResult, mangaResult] = await Promise.allSettled([
        this.syncBatch('anime', animeStartPage, 4), // 4 pages from page ~34
        this.syncBatch('manga', mangaStartPage, 4)  // 4 pages from page ~33
      ]);

      // Log results
      if (animeResult.status === 'fulfilled') {
        console.log(`✅ Anime sync: ${animeResult.value.processedCount} new titles added`);
      } else {
        console.error('❌ Anime sync failed:', animeResult.reason);
      }
      
      if (mangaResult.status === 'fulfilled') {
        console.log(`✅ Manga sync: ${mangaResult.value.processedCount} new titles added`);
      } else {
        console.error('❌ Manga sync failed:', mangaResult.reason);
      }

      const totalProcessed = (animeResult.status === 'fulfilled' ? animeResult.value.processedCount : 0) +
                           (mangaResult.status === 'fulfilled' ? mangaResult.value.processedCount : 0);

      console.log(`🎉 BACKGROUND SYNC COMPLETE! Total new titles: ${totalProcessed}`);

    } catch (error) {
      console.error('💥 Background sync critical error:', error);
      this.syncProgress.errors.push(`Critical error: ${error.message}`);
    } finally {
      this.isRunning = false;
      this.syncProgress.isRunning = false;
      this.notifyListeners();
    }
  }

  startContinuousSync() {
    console.log('🚀 STARTING CONTINUOUS SYNC SYSTEM...');
    
    // Start immediately
    this.startBackgroundSync();

    // Schedule every 5 minutes
    const syncInterval = setInterval(() => {
      if (!this.isRunning) {
        console.log('⏰ Scheduled sync starting...');
        this.startBackgroundSync();
      } else {
        console.log('⏳ Sync in progress - skipping scheduled run');
      }
    }, 5 * 60 * 1000);

    console.log('✅ Continuous sync running every 5 minutes');
    return syncInterval;
  }

  getProgress(): SyncProgress {
    return { ...this.syncProgress };
  }

  isActive(): boolean {
    return this.isRunning;
  }
}

export const backgroundSyncService = new BackgroundSyncService();