import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { redis, CACHE_KEYS, CACHE_TTL } from "../_shared/redis.ts";

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
    const url = new URL(req.url);
    const action = url.pathname.split('/').pop() || 'info';
    
    switch (action) {
      case 'info':
        return await getCacheInfo();
      case 'performance':
        return await getCachePerformance();
      case 'warmup':
        return await triggerCacheWarmup();
      default:
        return await handlePostAction(req);
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

async function handlePostAction(req: Request) {
  const { action } = await req.json();
  
  switch (action) {
    case 'warmup':
      return await triggerCacheWarmup();
    case 'clear':
      return await clearCacheStats();
    default:
      return await getCacheInfo();
  }
}

async function getCacheInfo() {
  try {
    const patterns = [
      { name: 'trending', pattern: 'cache:trending:*' },
      { name: 'popular', pattern: 'cache:popular:*' },
      { name: 'recent', pattern: 'cache:recent:*' },
      { name: 'search', pattern: 'cache:search:*' },
      { name: 'homepage', pattern: 'cache:homepage:*' },
      { name: 'stats', pattern: 'cache:stats:*' }
    ];
    
    const patternStats = [];
    let totalKeys = 0;
    
    for (const { name, pattern } of patterns) {
      const keys = await redis.keys(pattern);
      patternStats.push({
        pattern: name,
        keyCount: keys.length
      });
      totalKeys += keys.length;
    }
    
    return new Response(
      JSON.stringify({ 
        success: true,
        data: {
          redisInfo: { totalKeys },
          patternStats,
          timestamp: new Date().toISOString()
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
}

async function getCachePerformance() {
  try {
    const { data: metrics, error } = await supabase
      .from('cache_performance_metrics')
      .select('*')
      .gte('timestamp', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());
      
    if (error) throw error;
    
    const hitCount = metrics?.filter(m => m.metric_type === 'hit').length || 0;
    const missCount = metrics?.filter(m => m.metric_type === 'miss').length || 0;
    const totalRequests = hitCount + missCount;
    const hitRatio = totalRequests > 0 ? (hitCount / totalRequests) * 100 : 0;
    
    return new Response(
      JSON.stringify({ 
        success: true,
        data: {
          overall: {
            hitCount,
            missCount,
            totalRequests,
            hitRatio: Math.round(hitRatio * 100) / 100
          },
          timestamp: new Date().toISOString()
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
}

async function triggerCacheWarmup() {
  try {
    const response = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/cache-utils`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`
      },
      body: JSON.stringify({ action: 'warm', limit: 25 })
    });
    
    const warmupResult = await response.json();
    
    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Cache warmup completed',
        data: warmupResult,
        timestamp: new Date().toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
}

async function clearCacheStats() {
  try {
    const { error } = await supabase
      .from('cache_performance_metrics')
      .delete()
      .lt('timestamp', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());
      
    if (error) throw error;
    
    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Cache statistics cleared',
        timestamp: new Date().toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
}