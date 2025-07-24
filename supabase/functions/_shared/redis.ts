import { Redis } from "https://deno.land/x/upstash_redis@v1.22.1/mod.ts";

// Check if Redis environment variables are available
const REDIS_URL = Deno.env.get("UPSTASH_REDIS_REST_URL");
const REDIS_TOKEN = Deno.env.get("UPSTASH_REDIS_REST_TOKEN");

let redis: Redis | null = null;

// Only initialize Redis if environment variables are available
if (REDIS_URL && REDIS_TOKEN) {
  try {
    redis = new Redis({
      url: REDIS_URL,
      token: REDIS_TOKEN,
    });
    console.log("✅ Redis initialized successfully");
  } catch (error) {
    console.warn("⚠️ Redis initialization failed:", error);
    redis = null;
  }
} else {
  console.warn("⚠️ Redis environment variables not found - caching disabled");
}

export { redis };

export const CACHE_TTL = {
  TRENDING: 300, // 5 minutes
  POPULAR: 600, // 10 minutes  
  RECENT: 300, // 5 minutes
  SEARCH: 180, // 3 minutes
  DETAIL: 1800, // 30 minutes
  STATS: 3600, // 1 hour
  HOMEPAGE: 600, // 10 minutes
  GENRES: 7200, // 2 hours
};

export const CACHE_KEYS = {
  TRENDING: (contentType: string, limit: number) => `cache:trending:${contentType}:${limit}`,
  POPULAR: (contentType: string, limit: number) => `cache:popular:${contentType}:${limit}`,
  RECENT: (contentType: string, limit: number) => `cache:recent:${contentType}:${limit}`,
  SEARCH: (query: string, contentType: string, limit: number) => `cache:search:${query}:${contentType}:${limit}`,
  DETAIL: (contentType: string, id: string) => `cache:detail:${contentType}:${id}`,
  STATS: () => `cache:stats:site`,
  HOMEPAGE: () => `cache:homepage:aggregated`,
  GENRES: (contentType: string) => `cache:genres:${contentType}`,
};

// Cache utility functions
export async function getCacheWithStats(key: string): Promise<any> {
  // If Redis is not available, return null (cache miss)
  if (!redis) {
    await logCacheMetric('disabled', 0, key);
    return null;
  }

  try {
    const start = Date.now();
    const cached = await redis.get(key);
    const duration = Date.now() - start;
    
    // Log performance metric
    await logCacheMetric(cached ? 'hit' : 'miss', duration, key);
    
    return cached;
  } catch (error) {
    console.error('Redis get error:', error);
    await logCacheMetric('error', 0, key, { error: error.message });
    return null;
  }
}

export async function setCacheWithStats(key: string, value: any, ttl: number): Promise<void> {
  // If Redis is not available, skip caching
  if (!redis) {
    await logCacheMetric('disabled', 0, key);
    return;
  }

  try {
    const start = Date.now();
    await redis.setex(key, ttl, JSON.stringify(value));
    const duration = Date.now() - start;
    
    await logCacheMetric('set', duration, key);
  } catch (error) {
    console.error('Redis set error:', error);
    await logCacheMetric('error', 0, key, { error: error.message });
  }
}

export async function invalidatePattern(pattern: string): Promise<number> {
  // If Redis is not available, return 0
  if (!redis) {
    await logCacheMetric('disabled', 0, pattern);
    return 0;
  }

  try {
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      // Delete in batches
      const batchSize = 100;
      let deleted = 0;
      
      for (let i = 0; i < keys.length; i += batchSize) {
        const batch = keys.slice(i, i + batchSize);
        await redis.del(...batch);
        deleted += batch.length;
      }
      
      await logCacheMetric('invalidate', deleted, pattern);
      return deleted;
    }
    return 0;
  } catch (error) {
    console.error('Redis invalidate error:', error);
    await logCacheMetric('error', 0, pattern, { error: error.message });
    return 0;
  }
}

async function logCacheMetric(
  metricType: string, 
  metricValue: number, 
  cacheKey: string, 
  metadata: Record<string, any> = {}
): Promise<void> {
  try {
    // This would normally call a Supabase function to log metrics
    // For now, just log to console
    console.log(`📊 Cache metric: ${metricType} - ${cacheKey} - ${metricValue}ms`, metadata);
  } catch (error) {
    console.error('Failed to log cache metric:', error);
  }
}