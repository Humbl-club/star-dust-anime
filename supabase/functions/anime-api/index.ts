import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.2';

const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase configuration missing');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Parse request body
    const body = await req.json();
    const requestPath = body.path || '';
    
    // Extract content type and query parameters from the path
    const [pathPart, queryPart] = requestPath.split('?');
    const contentType = pathPart.replace('/', ''); // Remove leading slash
    
    // Parse query parameters from the path
    const searchParams = new URLSearchParams(queryPart || '');
    const params = Object.fromEntries(searchParams.entries());
    const {
      page = '1',
      limit = '20',
      search,
      genre,
      status,
      type,
      year,
      season,
      sort_by = 'score',
      order = 'desc'
    } = params;

    const pageNum = parseInt(page);
    const limitNum = Math.min(parseInt(limit), 100); // Max 100 per request
    const offset = (pageNum - 1) * limitNum;

    
    if (!['anime', 'manga'].includes(contentType)) {
      return new Response(JSON.stringify({ 
        error: 'Invalid content type. Use /anime or /manga' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`API request for ${contentType} - Page ${page}, Limit ${limit}`);

    // Build query
    let query = supabase
      .from(contentType)
      .select('*', { count: 'exact' });

    // Apply filters
    if (search) {
      query = query.or(`title.ilike.%${search}%, title_english.ilike.%${search}%, title_japanese.ilike.%${search}%`);
    }

    if (genre) {
      query = query.contains('genres', [genre]);
    }

    if (status) {
      query = query.eq('status', status);
    }

    if (type) {
      query = query.eq('type', type);
    }

    if (year) {
      query = query.eq('year', parseInt(year));
    }

    if (season && contentType === 'anime') {
      query = query.eq('season', season);
    }

    // Apply sorting
    const validSortFields = ['score', 'popularity', 'members', 'favorites', 'year', 'title', 'created_at'];
    const sortField = validSortFields.includes(sort_by) ? sort_by : 'score';
    const sortOrder = ['asc', 'desc'].includes(order) ? order : 'desc';
    
    query = query.order(sortField, { ascending: sortOrder === 'asc' });

    // Apply pagination
    query = query.range(offset, offset + limitNum - 1);

    const { data, error, count } = await query;

    if (error) {
      throw error;
    }

    // Calculate pagination info
    const totalPages = Math.ceil((count || 0) / limitNum);
    const hasNextPage = pageNum < totalPages;
    const hasPrevPage = pageNum > 1;

    return new Response(JSON.stringify({
      data: data || [],
      pagination: {
        current_page: pageNum,
        per_page: limitNum,
        total: count || 0,
        total_pages: totalPages,
        has_next_page: hasNextPage,
        has_prev_page: hasPrevPage
      },
      filters: {
        search,
        genre,
        status,
        type,
        year,
        season,
        sort_by: sortField,
        order: sortOrder
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in anime-api function:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});