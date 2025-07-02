import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// REST API for anime and manga data
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { method, path } = await req.json();
    
    if (method !== 'GET') {
      throw new Error('Only GET method is supported');
    }

    const url = new URL(`http://localhost${path}`);
    const pathname = url.pathname;
    const searchParams = url.searchParams;

    // Parse parameters
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search');
    const genre = searchParams.get('genre');
    const status = searchParams.get('status');
    const type = searchParams.get('type');
    const year = searchParams.get('year');
    const season = searchParams.get('season');
    const sort_by = searchParams.get('sort_by') || 'score';
    const order = searchParams.get('order') || 'desc';

    const offset = (page - 1) * limit;

    let query;
    let tableName = '';

    // Determine which table to query
    if (pathname.includes('/anime')) {
      tableName = 'anime';
      query = supabaseClient.from('anime').select('*');
    } else if (pathname.includes('/manga')) {
      tableName = 'manga';
      query = supabaseClient.from('manga').select('*');
    } else {
      throw new Error('Invalid endpoint');
    }

    // Apply filters
    if (search) {
      query = query.or(`title.ilike.%${search}%, title_english.ilike.%${search}%, synopsis.ilike.%${search}%`);
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

    if (season && tableName === 'anime') {
      query = query.eq('season', season);
    }

    // Apply sorting
    const ascending = order === 'asc';
    
    if (sort_by === 'score') {
      query = query.order('score', { ascending, nullsLast: true });
    } else if (sort_by === 'popularity') {
      query = query.order('popularity', { ascending, nullsLast: true });
    } else if (sort_by === 'title') {
      query = query.order('title', { ascending });
    } else if (sort_by === 'year' && tableName === 'anime') {
      query = query.order('year', { ascending, nullsLast: true });
    } else if (sort_by === 'chapters' && tableName === 'manga') {
      query = query.order('chapters', { ascending, nullsLast: true });
    } else {
      query = query.order('created_at', { ascending: false });
    }

    // Get total count for pagination
    const { count } = await supabaseClient
      .from(tableName)
      .select('*', { count: 'exact', head: true });

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data, error } = await query;

    if (error) {
      console.error(`Database error:`, error);
      throw new Error(error.message);
    }

    const total = count || 0;
    const totalPages = Math.ceil(total / limit);

    const response = {
      data: data || [],
      pagination: {
        current_page: page,
        per_page: limit,
        total,
        total_pages: totalPages,
        has_next_page: page < totalPages,
        has_prev_page: page > 1
      },
      filters: {
        search,
        genre,
        status,
        type,
        year,
        season,
        sort_by,
        order
      }
    };

    return new Response(
      JSON.stringify(response),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('API error:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        data: [],
        pagination: null
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});