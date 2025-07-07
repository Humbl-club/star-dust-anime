import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ApiRequest {
  method: string;
  path: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { method, path }: ApiRequest = await req.json();
    const url = new URL(`http://localhost${path}`);
    const pathSegments = url.pathname.split('/').filter(Boolean);
    const contentType = pathSegments[0]; // 'anime' or 'manga'

    if (!['anime', 'manga'].includes(contentType)) {
      return new Response(
        JSON.stringify({ error: 'Invalid content type' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    if (method === 'GET') {
      // Parse query parameters
      const page = parseInt(url.searchParams.get('page') || '1');
      const limit = Math.min(parseInt(url.searchParams.get('limit') || '20'), 100);
      const search = url.searchParams.get('search');
      const genre = url.searchParams.get('genre');
      const status = url.searchParams.get('status');
      const type = url.searchParams.get('type');
      const year = url.searchParams.get('year');
      const season = url.searchParams.get('season');
      const sort_by = url.searchParams.get('sort_by') || 'score';
      const order = (url.searchParams.get('order') || 'desc') as 'asc' | 'desc';

      // Build query using the new view
      const viewName = contentType === 'anime' ? 'anime_view' : 'manga_view';
      let query = supabase
        .from(viewName)
        .select('*', { count: 'exact' });

      // Apply filters
      if (search) {
        query = query.or(`title.ilike.%${search}%,title_english.ilike.%${search}%,synopsis.ilike.%${search}%`);
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
      let sortField = 'score';
      switch (sort_by) {
        case 'title':
          sortField = 'title';
          break;
        case 'year':
          sortField = 'year';
          break;
        case 'popularity':
          sortField = 'popularity';
          break;
        case 'members':
          sortField = 'members';
          break;
        case 'favorites':
          sortField = 'favorites';
          break;
        case 'rank':
          sortField = 'rank';
          break;
        default:
          sortField = 'score';
      }

      query = query.order(sortField, { ascending: order === 'asc', nullsFirst: false });

      // Apply pagination
      const from = (page - 1) * limit;
      const to = from + limit - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;

      if (error) {
        console.error('Database error:', error);
        return new Response(
          JSON.stringify({ error: 'Database query failed', details: error.message }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      const totalPages = count ? Math.ceil(count / limit) : 0;

      const response = {
        data: data || [],
        pagination: {
          current_page: page,
          per_page: limit,
          total: count || 0,
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
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { 
        status: 405, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('API Error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
})