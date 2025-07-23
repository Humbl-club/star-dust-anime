import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Redis } from "https://deno.land/x/upstash_redis@v1.22.1/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const redis = new Redis({
  url: Deno.env.get('UPSTASH_REDIS_URL')!,
  token: Deno.env.get('UPSTASH_REDIS_TOKEN')!,
});

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action = 'get', dateRange = 7 } = await req.json();
    
    switch (action) {
      case 'get':
        return await getCacheStatistics(dateRange);
      case 'clear':
        return await clearCacheStatistics();
      case 'warmup':
        return await performCacheWarmup();
      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        );
    }
  } catch (error) {
    console.error('Cache stats error:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});

async function getCacheStatistics(dateRange: number) {
  const today = new Date();
  const stats = {
    daily: [],
    total: { hits: 0, misses: 0, hitRatio: 0 },
    topKeys: [],
    cacheSize: 0,
    keyCount: 0
  };

  // Get daily stats for the specified range
  for (let i = 0; i < dateRange; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().substring(0, 10);
    
    const [hits, misses] = await Promise.all([
      redis.get(`cache:stats:hit:${dateStr}`) || 0,
      redis.get(`cache:stats:miss:${dateStr}`) || 0
    ]);
    
    const totalRequests = Number(hits) + Number(misses);
    const hitRatio = totalRequests > 0 ? (Number(hits) / totalRequests) * 100 : 0;
    
    stats.daily.push({
      date: dateStr,
      hits: Number(hits),
      misses: Number(misses),
      total: totalRequests,
      hitRatio: Math.round(hitRatio * 100) / 100
    });
    
    stats.total.hits += Number(hits);
    stats.total.misses += Number(misses);
  }

  // Calculate overall hit ratio
  const totalRequests = stats.total.hits + stats.total.misses;
  stats.total.hitRatio = totalRequests > 0 
    ? Math.round((stats.total.hits / totalRequests) * 10000) / 100 
    : 0;

  // Get top cache keys
  const keys = await redis.keys('cache:key_stats:*');
  const keyStats = [];
  
  for (const key of keys.slice(0, 20)) { // Limit to top 20
    const count = await redis.get(key);
    if (count && Number(count) > 0) {
      keyStats.push({
        key: key.replace('cache:key_stats:', ''),
        count: Number(count)
      });
    }
  }
  
  stats.topKeys = keyStats
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // Get cache size estimation
  const allKeys = await redis.keys('cache:*');
  stats.keyCount = allKeys.length;
  
  // Estimate cache size (simplified)
  stats.cacheSize = Math.round(stats.keyCount * 2.5); // Rough estimate in KB

  return new Response(
    JSON.stringify({ 
      success: true,
      data: stats,
      timestamp: new Date().toISOString()
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function clearCacheStatistics() {
  const statsKeys = await redis.keys('cache:stats:*');
  const keyStatsKeys = await redis.keys('cache:key_stats:*');
  
  const keysToDelete = [...statsKeys, ...keyStatsKeys];
  
  if (keysToDelete.length > 0) {
    await redis.del(...keysToDelete);
  }
  
  return new Response(
    JSON.stringify({ 
      success: true,
      message: `Cleared ${keysToDelete.length} statistics keys`,
      timestamp: new Date().toISOString()
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function performCacheWarmup() {
  console.log('🔥 Starting manual cache warmup...');
  
  const warmupEndpoints = [
    { endpoint: 'trending', contentType: 'anime', limit: 20 },
    { endpoint: 'trending', contentType: 'manga', limit: 20 },
    { endpoint: 'popular', contentType: 'anime', limit: 20 },
    { endpoint: 'popular', contentType: 'manga', limit: 20 },
    { endpoint: 'recent', contentType: 'anime', limit: 20 },
    { endpoint: 'homepage' }
  ];
  
  const results = [];
  
  for (const config of warmupEndpoints) {
    try {
      const response = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/cached-content`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`
        },
        body: JSON.stringify(config)
      });
      
      if (response.ok) {
        results.push({ ...config, status: 'success' });
      } else {
        results.push({ ...config, status: 'failed', error: response.statusText });
      }
    } catch (error) {
      results.push({ ...config, status: 'error', error: error.message });
    }
  }
  
  console.log('✅ Cache warmup completed');
  
  return new Response(
    JSON.stringify({ 
      success: true,
      message: 'Cache warmup completed',
      results,
      timestamp: new Date().toISOString()
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}