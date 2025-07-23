import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { Redis } from "https://deno.land/x/upstash_redis@v1.22.1/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const redis = new Redis({
  url: Deno.env.get('UPSTASH_REDIS_URL')!,
  token: Deno.env.get('UPSTASH_REDIS_TOKEN')!,
});

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { endpoint, contentType, filters, limit = 20 } = await req.json();
    
    // Generate cache key
    const cacheKey = `cache:${endpoint}:${contentType}:${JSON.stringify(filters)}:${limit}`;
    
    // Try to get from cache
    const cached = await redis.get(cacheKey);
    if (cached) {
      console.log(`✅ Cache hit: ${cacheKey}`);
      return new Response(
        JSON.stringify({ data: cached, fromCache: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Cache miss - fetch from database
    console.log(`❌ Cache miss: ${cacheKey}`);
    
    let query;
    let data;
    
    // Handle different content types and endpoints
    if (contentType === 'anime') {
      query = supabase
        .from('titles')
        .select(`
          *,
          anime_details!inner(*),
          title_genres(genres(*)),
          title_studios(studios(*))
        `);
    } else if (contentType === 'manga') {
      query = supabase
        .from('titles')
        .select(`
          *,
          manga_details!inner(*),
          title_genres(genres(*)),
          title_authors(authors(*))
        `);
    } else {
      throw new Error(`Unsupported content type: ${contentType}`);
    }
    
    // Apply filters
    if (filters?.search) {
      query = query.or(`title.ilike.%${filters.search}%,title_english.ilike.%${filters.search}%,title_japanese.ilike.%${filters.search}%`);
    }
    
    if (filters?.genre) {
      query = query.eq('title_genres.genres.name', filters.genre);
    }
    
    if (filters?.year) {
      query = query.eq('year', filters.year);
    }
    
    if (filters?.status && contentType === 'anime') {
      query = query.eq('anime_details.status', filters.status);
    } else if (filters?.status && contentType === 'manga') {
      query = query.eq('manga_details.status', filters.status);
    }
    
    if (filters?.type && contentType === 'anime') {
      query = query.eq('anime_details.type', filters.type);
    } else if (filters?.type && contentType === 'manga') {
      query = query.eq('manga_details.type', filters.type);
    }
    
    if (filters?.season && contentType === 'anime') {
      query = query.eq('anime_details.season', filters.season);
    }
    
    // Apply sorting
    if (filters?.sort_by) {
      const sortOrder = filters.order === 'asc' ? 'asc' : 'desc';
      query = query.order(filters.sort_by, { ascending: sortOrder === 'asc' });
    } else {
      // Default sorting by score
      query = query.order('score', { ascending: false });
    }
    
    const { data: queryData, error } = await query.limit(limit);
    
    if (error) {
      console.error('❌ Database query error:', error);
      throw error;
    }
    
    data = queryData;
    
    // Cache the result with TTL (5 minutes)
    await redis.setex(cacheKey, 300, JSON.stringify(data));
    console.log(`💾 Cached result for key: ${cacheKey}`);
    
    return new Response(
      JSON.stringify({ 
        data, 
        fromCache: false,
        cached_at: new Date().toISOString(),
        cache_key: cacheKey
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('❌ Function error:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});