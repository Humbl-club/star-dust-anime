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
    const { action, pattern, patterns, keys, limit = 20 } = await req.json();
    
    switch (action) {
      case 'invalidate':
        // Invalidate cache by single pattern
        console.log(`🗑️ Invalidating cache with pattern: ${pattern || '*'}`);
      
      case 'invalidate_patterns':
        // Invalidate cache by multiple patterns  
        const patternsToInvalidate = patterns || [pattern || 'cache:*'];
        console.log(`🗑️ Invalidating cache with patterns:`, patternsToInvalidate);
        let totalDeleted = 0;
        const results = [];
        
        for (const patternToDelete of patternsToInvalidate) {
          try {
            const keysToDelete = await redis.keys(patternToDelete);
            let deleted = 0;
            
            if (keysToDelete.length > 0) {
              // Delete in batches to avoid timeout
              const batchSize = 100;
              for (let i = 0; i < keysToDelete.length; i += batchSize) {
                const batch = keysToDelete.slice(i, i + batchSize);
                await redis.del(...batch);
                deleted += batch.length;
              }
            }
            
            totalDeleted += deleted;
            results.push({ 
              pattern: patternToDelete, 
              deleted, 
              success: true 
            });
            console.log(`✅ Deleted ${deleted} keys for pattern: ${patternToDelete}`);
          } catch (error) {
            console.error(`❌ Failed to delete pattern ${patternToDelete}:`, error);
            results.push({ 
              pattern: patternToDelete, 
              deleted: 0, 
              success: false, 
              error: error.message 
            });
          }
        }
        
        return new Response(
          JSON.stringify({ 
            success: true,
            totalDeleted,
            results,
            action: action,
            timestamp: new Date().toISOString()
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
        
      case 'warm':
        // Pre-warm cache with common queries
        console.log('🔥 Warming up cache with common queries');
        const warmupQueries = [
          { endpoint: 'trending', contentType: 'anime', limit },
          { endpoint: 'trending', contentType: 'manga', limit },
          { endpoint: 'recent', contentType: 'anime', limit },
          { endpoint: 'recent', contentType: 'manga', limit },
          { endpoint: 'top-rated', contentType: 'anime', limit },
          { endpoint: 'top-rated', contentType: 'manga', limit },
        ];
        
        let warmed = 0;
        const results = [];
        
        for (const query of warmupQueries) {
          try {
            console.log(`Warming: ${query.endpoint} - ${query.contentType}`);
            const response = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/cached-content-v2`, {
              method: 'POST',
              headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`
              },
              body: JSON.stringify(query),
            });
            
            if (response.ok) {
              warmed++;
              results.push({ ...query, status: 'success' });
            } else {
              results.push({ ...query, status: 'failed', error: response.statusText });
            }
          } catch (error) {
            console.error(`Failed to warm ${query.endpoint}:`, error);
            results.push({ ...query, status: 'error', error: error.message });
          }
        }
        
        console.log(`✅ Warmed ${warmed}/${warmupQueries.length} cache entries`);
        return new Response(
          JSON.stringify({ 
            success: true,
            warmed,
            total: warmupQueries.length,
            results,
            timestamp: new Date().toISOString()
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
        
      case 'stats':
        // Get cache statistics
        console.log('📊 Fetching cache statistics');
        try {
          const cacheKeys = await redis.keys('cache:*');
          const totalKeys = cacheKeys.length;
          
          // Sample a few keys to get size estimates
          const sampleKeys = cacheKeys.slice(0, 10);
          let totalSize = 0;
          
          for (const key of sampleKeys) {
            try {
              const value = await redis.get(key);
              if (value) {
                totalSize += JSON.stringify(value).length;
              }
            } catch (e) {
              // Skip invalid keys
            }
          }
          
          const avgSize = sampleKeys.length > 0 ? Math.round(totalSize / sampleKeys.length) : 0;
          const estimatedTotalSize = avgSize * totalKeys;
          
          return new Response(
            JSON.stringify({ 
              success: true,
              stats: {
                totalKeys,
                cacheKeys: totalKeys,
                averageKeySize: avgSize,
                estimatedTotalSize,
                estimatedTotalSizeMB: Math.round(estimatedTotalSize / 1024 / 1024 * 100) / 100,
                sampleSize: sampleKeys.length,
              },
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
        
      case 'list':
        // List cache keys
        console.log(`📋 Listing cache keys with pattern: ${pattern || 'cache:*'}`);
        const allKeys = await redis.keys(pattern || 'cache:*');
        const limitedKeys = allKeys.slice(0, limit);
        
        return new Response(
          JSON.stringify({ 
            success: true,
            keys: limitedKeys,
            total: allKeys.length,
            showing: limitedKeys.length,
            pattern: pattern || 'cache:*',
            timestamp: new Date().toISOString()
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
        
      default:
        return new Response(
          JSON.stringify({ 
            success: false,
            error: 'Invalid action. Available actions: invalidate, warm, stats, list',
            availableActions: ['invalidate', 'warm', 'stats', 'list']
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        );
    }
  } catch (error) {
    console.error('❌ Cache utils error:', error);
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