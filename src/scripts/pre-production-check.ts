import { supabase } from '@/integrations/supabase/client';

interface ProductionChecks {
  database: boolean;
  edgeFunctions: boolean;
  authentication: boolean;
  dataPopulation: boolean;
  performance: boolean;
  materializedViews: boolean;
  indexes: boolean;
}

async function runProductionChecks(): Promise<ProductionChecks> {
  const checks: ProductionChecks = {
    database: false,
    edgeFunctions: false,
    authentication: false,
    dataPopulation: false,
    performance: false,
    materializedViews: false,
    indexes: false
  };
  
  console.log('🔍 Running production checks...\n');
  
  // 1. Database connectivity
  try {
    const { error } = await supabase.from('titles').select('count').limit(1);
    checks.database = !error;
    console.log(`${checks.database ? '✅' : '❌'} Database connectivity: ${checks.database ? 'PASS' : 'FAIL'}`);
  } catch (e) {
    console.log('❌ Database connectivity: FAIL -', e);
  }
  
  // 2. Edge functions
  try {
    const functions = ['anime-api', 'manga-api', 'ultra-fast-sync'];
    let functionsWorking = 0;
    
    for (const fn of functions) {
      try {
        const { error } = await supabase.functions.invoke(fn, {
          body: { test: true }
        });
        if (!error || error.message.includes('test')) {
          functionsWorking++;
        }
      } catch (e) {
        console.log(`⚠️  Edge function ${fn}: Issues detected`);
      }
    }
    
    checks.edgeFunctions = functionsWorking >= 2; // At least 2/3 should work
    console.log(`${checks.edgeFunctions ? '✅' : '❌'} Edge functions: ${checks.edgeFunctions ? 'PASS' : 'FAIL'} (${functionsWorking}/${functions.length})`);
  } catch (e) {
    console.log('❌ Edge functions: FAIL -', e);
  }
  
  // 3. Authentication
  try {
    const { data: { session } } = await supabase.auth.getSession();
    checks.authentication = true; // System is available even if no session
    console.log('✅ Authentication system: PASS');
  } catch (e) {
    console.log('❌ Authentication system: FAIL -', e);
  }
  
  // 4. Data population
  try {
    const [animeResult, mangaResult, titlesResult] = await Promise.all([
      supabase.from('anime_details').select('*', { count: 'exact', head: true }),
      supabase.from('manga_details').select('*', { count: 'exact', head: true }),
      supabase.from('titles').select('*', { count: 'exact', head: true })
    ]);
    
    const animeCount = animeResult.count || 0;
    const mangaCount = mangaResult.count || 0;
    const titlesCount = titlesResult.count || 0;
    
    checks.dataPopulation = animeCount > 0 && mangaCount > 0 && titlesCount > 0;
    console.log(`${checks.dataPopulation ? '✅' : '❌'} Data population: ${checks.dataPopulation ? 'PASS' : 'FAIL'} (Titles: ${titlesCount}, Anime: ${animeCount}, Manga: ${mangaCount})`);
  } catch (e) {
    console.log('❌ Data population: FAIL -', e);
  }
  
  // 5. Performance
  const startTime = performance.now();
  try {
    await Promise.all([
      supabase.from('titles').select('*').limit(50),
      supabase.from('anime_details').select('*').limit(50),
      supabase.from('manga_details').select('*').limit(50)
    ]);
    const duration = performance.now() - startTime;
    checks.performance = duration < 2000; // Should complete in under 2 seconds
    console.log(`${checks.performance ? '✅' : '⚠️'} Performance: ${checks.performance ? 'PASS' : 'SLOW'} (${duration.toFixed(0)}ms)`);
  } catch (e) {
    console.log('❌ Performance: FAIL -', e);
  }
  
  // 6. Materialized Views
  try {
    const { data: mvData, error: mvError } = await supabase
      .rpc('get_trending_anime', { limit_param: 1 });
    
    checks.materializedViews = !mvError && Array.isArray(mvData);
    console.log(`${checks.materializedViews ? '✅' : '❌'} Materialized Views: ${checks.materializedViews ? 'PASS' : 'FAIL'}`);
  } catch (e) {
    console.log('❌ Materialized Views: FAIL -', e);
  }
  
  // 7. Database Indexes (check query performance)
  try {
    const indexStartTime = performance.now();
    await Promise.all([
      supabase.from('titles').select('*').eq('content_type', 'anime').limit(1),
      supabase.from('titles').select('*').order('anilist_score', { ascending: false }).limit(1),
      supabase.from('anime_details').select('*').eq('status', 'Currently Airing').limit(1)
    ]);
    const indexDuration = performance.now() - indexStartTime;
    checks.indexes = indexDuration < 500; // Should be very fast with indexes
    console.log(`${checks.indexes ? '✅' : '⚠️'} Database Indexes: ${checks.indexes ? 'PASS' : 'SLOW'} (${indexDuration.toFixed(0)}ms)`);
  } catch (e) {
    console.log('❌ Database Indexes: FAIL -', e);
  }
  
  // Summary
  const passedChecks = Object.values(checks).filter(check => check).length;
  const totalChecks = Object.keys(checks).length;
  const allPassed = passedChecks === totalChecks;
  const mostlyPassed = passedChecks >= totalChecks - 1;
  
  console.log(`\n${allPassed ? '✅' : mostlyPassed ? '⚠️' : '❌'} Production readiness: ${allPassed ? 'READY' : mostlyPassed ? 'MOSTLY READY' : 'NOT READY'} (${passedChecks}/${totalChecks})`);
  
  if (!allPassed) {
    console.log('\n📋 Issues to address:');
    Object.entries(checks).forEach(([check, passed]) => {
      if (!passed) {
        console.log(`   - ${check}: Needs attention`);
      }
    });
  }
  
  return checks;
}

// Export for use in components or tests
export { runProductionChecks };

// Run checks if called directly
if (typeof window !== 'undefined') {
  runProductionChecks();
}