import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { redis, CACHE_TTL, invalidatePattern } from "../_shared/redis.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, pattern, patterns, keys, limit = 20 } = await req.json();
    
    switch (action) {
      case 'invalidate':
        return await handleInvalidate([pattern || 'cache:*']);
      
      case 'invalidate_patterns':
        const patternsToInvalidate = patterns || [pattern || 'cache:*'];
        return await handleInvalidate(patternsToInvalidate);
      
      case 'warm':
        return await handleCacheWarmup(limit);
      
      case 'stats':
        return await handleCacheStats();
      
      case 'list':
        return await handleListKeys(pattern, limit);
      
      default:
        return new Response(
          JSON.stringify({ 
            success: false,
            error: 'Invalid action. Available actions: invalidate, invalidate_patterns, warm, stats, list',
            availableActions: ['invalidate', 'invalidate_patterns', 'warm', 'stats', 'list']
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        );
    }
  } catch (error) {
    console.error('❌ Cache utils error:', error);
    
    // Log error to database
    await logCachePerformance('error', 0, 'cache-utils', { error: error.message });
    
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});

async function handleInvalidate(patterns: string[]) {
  console.log(`🗑️ Invalidating cache with patterns:`, patterns);
  
  let totalDeleted = 0;
  const results = [];
  
  for (const pattern of patterns) {
    try {
      const deleted = await invalidatePattern(pattern);
      totalDeleted += deleted;
      results.push({ 
        pattern, 
        deleted, 
        success: true 
      });
      console.log(`✅ Deleted ${deleted} keys for pattern: ${pattern}`);
    } catch (error) {
      console.error(`❌ Failed to delete pattern ${pattern}:`, error);
      results.push({ 
        pattern, 
        deleted: 0, 
        success: false, 
        error: error.message 
      });
    }
  }
  
  // Log metrics to database
  await logCachePerformance('invalidate', totalDeleted, 'pattern-invalidation', {
    patterns,
    results
  });
  
  return new Response(
    JSON.stringify({ 
      success: true,
      totalDeleted,
      results,
      timestamp: new Date().toISOString()
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}
        
async function handleCacheWarmup(limit = 20) {
  console.log('🔥 Starting comprehensive cache warmup...');
  
  const warmupTasks = [
    // Trending content
    { type: 'trending', contentType: 'anime', limit },
    { type: 'trending', contentType: 'manga', limit },
    // Popular content
    { type: 'popular', contentType: 'anime', limit },
    { type: 'popular', contentType: 'manga', limit },
    // Recent content
    { type: 'recent', contentType: 'anime', limit },
    { type: 'recent', contentType: 'manga', limit },
    // Homepage aggregated data
    { type: 'homepage' },
    // Site statistics
    { type: 'stats' }
  ];
  
  let warmed = 0;
  const results = [];
  
  for (const task of warmupTasks) {
    try {
      console.log(`Warming: ${task.type} - ${task.contentType || 'all'}`);
      
      // Call the cached-content function to warm the cache
      const response = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/cached-content`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`
        },
        body: JSON.stringify({
          endpoint: task.type,
          contentType: task.contentType,
          limit: task.limit
        }),
      });
      
      if (response.ok) {
        warmed++;
        results.push({ ...task, status: 'success' });
      } else {
        results.push({ ...task, status: 'failed', error: response.statusText });
      }
    } catch (error) {
      console.error(`Failed to warm ${task.type}:`, error);
      results.push({ ...task, status: 'error', error: error.message });
    }
  }
  
  // Log metrics
  await logCachePerformance('warmup', warmed, 'cache-warmup', {
    total: warmupTasks.length,
    results
  });
  
  console.log(`✅ Warmed ${warmed}/${warmupTasks.length} cache entries`);
  return new Response(
    JSON.stringify({ 
      success: true,
      warmed,
      total: warmupTasks.length,
      results,
      timestamp: new Date().toISOString()
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}
        
async function handleCacheStats() {
  console.log('📊 Fetching comprehensive cache statistics');
  try {
    // Get cache keys by pattern
    const patterns = [
      'cache:trending:*',
      'cache:popular:*', 
      'cache:recent:*',
      'cache:search:*',
      'cache:detail:*',
      'cache:homepage:*',
      'cache:stats:*'
    ];
    
    const stats = {
      totalKeys: 0,
      patternStats: [],
      memory: {
        totalSize: 0,
        averageKeySize: 0
      },
      performance: await getCachePerformanceStats()
    };
    
    for (const pattern of patterns) {
      const keys = await redis.keys(pattern);
      const patternName = pattern.replace('cache:', '').replace(':*', '');
      
      // Sample some keys to estimate size
      const sampleKeys = keys.slice(0, 5);
      let sampleSize = 0;
      
      for (const key of sampleKeys) {
        try {
          const value = await redis.get(key);
          if (value) {
            sampleSize += JSON.stringify(value).length;
          }
        } catch (e) {
          // Skip invalid keys
        }
      }
      
      const avgSize = sampleKeys.length > 0 ? Math.round(sampleSize / sampleKeys.length) : 0;
      const estimatedTotalSize = avgSize * keys.length;
      
      stats.patternStats.push({
        pattern: patternName,
        keyCount: keys.length,
        averageSize: avgSize,
        estimatedTotalSize
      });
      
      stats.totalKeys += keys.length;
      stats.memory.totalSize += estimatedTotalSize;
    }
    
    stats.memory.averageKeySize = stats.totalKeys > 0 
      ? Math.round(stats.memory.totalSize / stats.totalKeys) 
      : 0;
    
    return new Response(
      JSON.stringify({ 
        success: true,
        stats,
        timestamp: new Date().toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error getting cache stats:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message,
        stats: null
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
}
        
async function handleListKeys(pattern = 'cache:*', limit = 20) {
  console.log(`📋 Listing cache keys with pattern: ${pattern}`);
  const allKeys = await redis.keys(pattern);
  const limitedKeys = allKeys.slice(0, limit);
  
  return new Response(
    JSON.stringify({ 
      success: true,
      keys: limitedKeys,
      total: allKeys.length,
      showing: limitedKeys.length,
      pattern,
      timestamp: new Date().toISOString()
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function logCachePerformance(
  metricType: string,
  metricValue: number,
  cacheKey: string,
  metadata: Record<string, any> = {}
) {
  try {
    await supabase
      .from('cache_performance_metrics')
      .insert({
        metric_type: metricType,
        metric_value: metricValue,
        cache_key: cacheKey,
        metadata
      });
  } catch (error) {
    console.error('Failed to log cache performance:', error);
  }
}

async function getCachePerformanceStats() {
  try {
    const { data, error } = await supabase
      .from('cache_performance_metrics')
      .select('metric_type, metric_value, timestamp')
      .gte('timestamp', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .order('timestamp', { ascending: false })
      .limit(1000);
      
    if (error) throw error;
    
    // Calculate basic stats
    const hitCount = data?.filter(m => m.metric_type === 'hit').length || 0;
    const missCount = data?.filter(m => m.metric_type === 'miss').length || 0;
    const totalRequests = hitCount + missCount;
    const hitRatio = totalRequests > 0 ? (hitCount / totalRequests) * 100 : 0;
    
    return {
      last24Hours: {
        totalRequests,
        hitCount,
        missCount,
        hitRatio: Math.round(hitRatio * 100) / 100
      }
    };
  } catch (error) {
    console.error('Failed to get performance stats:', error);
    return { last24Hours: { totalRequests: 0, hitCount: 0, missCount: 0, hitRatio: 0 } };
  }
}