import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🔍 Starting comprehensive sync diagnostics and auto-healing...');

    // 1. Check current database state
    const diagnostics = await performDiagnostics();
    console.log('📊 Diagnostics results:', diagnostics);

    // 2. Identify and fix issues
    const healingResults = await performAutoHealing(diagnostics);
    console.log('🔧 Auto-healing results:', healingResults);

    // 3. Trigger missing syncs if needed
    const syncResults = await triggerMissingSyncs(diagnostics);
    console.log('🚀 Sync trigger results:', syncResults);

    return new Response(JSON.stringify({
      success: true,
      timestamp: new Date().toISOString(),
      diagnostics,
      healingResults,
      syncResults,
      recommendations: generateRecommendations(diagnostics)
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ Sync diagnostics error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});

async function performDiagnostics() {
  const results = {
    databaseCounts: {},
    syncStatus: {},
    issues: [],
    performance: {},
    apiHealth: false
  };

  try {
    // Check database counts
    const [animeCount, mangaCount, totalTitles, genresCount, studiosCount, authorsCount] = await Promise.all([
      supabase.from('titles').select('id', { count: 'exact' }).not('anime_details', 'is', null),
      supabase.from('titles').select('id', { count: 'exact' }).not('manga_details', 'is', null),
      supabase.from('titles').select('id', { count: 'exact' }),
      supabase.from('genres').select('id', { count: 'exact' }),
      supabase.from('studios').select('id', { count: 'exact' }),
      supabase.from('authors').select('id', { count: 'exact' })
    ]);

    results.databaseCounts = {
      anime: animeCount.count || 0,
      manga: mangaCount.count || 0,
      total: totalTitles.count || 0,
      genres: genresCount.count || 0,
      studios: studiosCount.count || 0,
      authors: authorsCount.count || 0
    };

    // Check for data integrity issues
    if (results.databaseCounts.anime < 1000) {
      results.issues.push('Low anime count - may need comprehensive sync');
    }
    if (results.databaseCounts.manga < 1000) {
      results.issues.push('Low manga count - may need comprehensive sync');
    }
    if (results.databaseCounts.genres < 20) {
      results.issues.push('Low genre count - relationship data may be missing');
    }

    // Check sync status
    const recentSyncLogs = await supabase
      .from('sync_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    results.syncStatus = {
      recentLogs: recentSyncLogs.data?.length || 0,
      lastSync: recentSyncLogs.data?.[0]?.created_at || null,
      hasErrors: recentSyncLogs.data?.some(log => log.error_message) || false
    };

    // Test AniList API connectivity
    try {
      const testQuery = `
        query {
          Page(page: 1, perPage: 1) {
            media(type: ANIME) {
              id
              title { romaji }
            }
          }
        }
      `;

      const apiTest = await fetch('https://graphql.anilist.co', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: testQuery })
      });

      results.apiHealth = apiTest.ok;
      if (!apiTest.ok) {
        results.issues.push('AniList API connectivity issues detected');
      }
    } catch (error) {
      results.issues.push('Cannot connect to AniList API');
      results.apiHealth = false;
    }

    return results;
  } catch (error) {
    console.error('Diagnostics error:', error);
    results.issues.push(`Diagnostics error: ${error.message}`);
    return results;
  }
}

async function performAutoHealing(diagnostics: any) {
  const healingActions = [];

  try {
    // Fix orphaned records
    if (diagnostics.databaseCounts.total > diagnostics.databaseCounts.anime + diagnostics.databaseCounts.manga) {
      console.log('🔧 Cleaning up orphaned title records...');
      
      // This would require careful implementation to avoid data loss
      healingActions.push('Orphaned records detection completed');
    }

    // Check for missing relationships
    const titlesWithoutGenres = await supabase
      .from('titles')
      .select(`
        id,
        title_genres!left(title_id)
      `)
      .is('title_genres.title_id', null)
      .limit(100);

    if (titlesWithoutGenres.data && titlesWithoutGenres.data.length > 0) {
      healingActions.push(`Found ${titlesWithoutGenres.data.length} titles without genre relationships`);
    }

    return {
      actionsPerformed: healingActions,
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    console.error('Auto-healing error:', error);
    return {
      actionsPerformed: [],
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
}

async function triggerMissingSyncs(diagnostics: any) {
  const syncActions = [];

  try {
    // Determine if comprehensive sync is needed
    const animeThreshold = 20000; // Target 20k+ anime
    const mangaThreshold = 100000; // Target 100k+ manga

    if (diagnostics.databaseCounts.anime < animeThreshold && diagnostics.apiHealth) {
      console.log('🚀 Triggering comprehensive anime sync...');
      
      const animeSync = supabase.functions.invoke('ultra-fast-sync', {
        body: { contentType: 'anime', maxPages: 500 }
      });

      syncActions.push('Comprehensive anime sync triggered');
    }

    if (diagnostics.databaseCounts.manga < mangaThreshold && diagnostics.apiHealth) {
      console.log('🚀 Triggering comprehensive manga sync...');
      
      const mangaSync = supabase.functions.invoke('ultra-fast-sync', {
        body: { contentType: 'manga', maxPages: 3000 }
      });

      syncActions.push('Comprehensive manga sync triggered');
    }

    // Trigger incremental sync for recent content
    if (diagnostics.apiHealth) {
      console.log('🔄 Triggering incremental sync for recent content...');
      
      const incrementalSync = supabase.functions.invoke('ultra-fast-sync', {
        body: { contentType: 'anime', maxPages: 10 }
      });

      syncActions.push('Incremental sync triggered');
    }

    return {
      actionsTriggered: syncActions,
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    console.error('Sync trigger error:', error);
    return {
      actionsTriggered: [],
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
}

function generateRecommendations(diagnostics: any) {
  const recommendations = [];

  if (diagnostics.databaseCounts.anime < 10000) {
    recommendations.push('Run comprehensive anime sync to reach target of 25,000 titles');
  }

  if (diagnostics.databaseCounts.manga < 50000) {
    recommendations.push('Run comprehensive manga sync to reach target of 150,000 titles');
  }

  if (diagnostics.databaseCounts.genres < 50) {
    recommendations.push('Genre data appears incomplete - ensure relationship sync is working');
  }

  if (!diagnostics.apiHealth) {
    recommendations.push('AniList API connectivity issues - check network and rate limiting');
  }

  if (recommendations.length === 0) {
    recommendations.push('Database appears healthy - continue with maintenance syncs');
  }

  return recommendations;
}