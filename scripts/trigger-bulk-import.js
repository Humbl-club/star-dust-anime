// Script to trigger the AniList bulk import
import { supabase } from '../src/integrations/supabase/client.js';

async function triggerBulkImport() {
  try {
    console.log('🚀 Starting AniList bulk import...');
    
    // Start with anime import
    const animeResult = await supabase.functions.invoke('one-time-anilist-bulk-import', {
      body: {
        contentType: 'anime',
        maxPages: 5,
        startPage: 1
      }
    });

    if (animeResult.error) {
      console.error('❌ Anime import failed:', animeResult.error);
      return;
    }

    console.log('✅ Anime import result:', animeResult.data);

    // Wait a moment before starting manga import
    console.log('⏳ Waiting 5 seconds before starting manga import...');
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Start manga import
    const mangaResult = await supabase.functions.invoke('one-time-anilist-bulk-import', {
      body: {
        contentType: 'manga',
        maxPages: 3,
        startPage: 1
      }
    });

    if (mangaResult.error) {
      console.error('❌ Manga import failed:', mangaResult.error);
      return;
    }

    console.log('✅ Manga import result:', mangaResult.data);
    console.log('🎉 Bulk import process completed!');

  } catch (error) {
    console.error('❌ Import process failed:', error);
  }
}

triggerBulkImport();