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

      console.log(`🔍 Building query for ${contentType} with filters:`, { search, genre, status, type, year, season });

      // Stage 1: Basic query with proper joins
      let query;
      
      if (contentType === 'anime') {
        query = supabase
          .from('titles')
          .select(`
            id,
            anilist_id,
            title,
            title_english,
            title_japanese,
            synopsis,
            image_url,
            score,
            rank,
            popularity,
            members,
            favorites,
            year,
            color_theme,
            created_at,
            updated_at,
            anime_details!inner(
              episodes,
              aired_from,
              aired_to,
              season,
              status,
              type,
              trailer_url,
              trailer_site,
              trailer_id,
              next_episode_date,
              next_episode_number,
              last_sync_check
            )
          `, { count: 'exact' });
      } else {
        query = supabase
          .from('titles')
          .select(`
            id,
            anilist_id,
            title,
            title_english,
            title_japanese,
            synopsis,
            image_url,
            score,
            rank,
            popularity,
            members,
            favorites,
            year,
            color_theme,
            created_at,
            updated_at,
            manga_details!inner(
              chapters,
              volumes,
              published_from,
              published_to,
              status,
              type,
              next_chapter_date,
              next_chapter_number,
              last_sync_check
            )
          `, { count: 'exact' });
      }

      console.log('📊 Base query created successfully');

      // Stage 2: Apply filters with proper field mapping
      if (search) {
        console.log(`🔍 Applying search filter: ${search}`);
        query = query.or(`title.ilike.%${search}%,title_english.ilike.%${search}%,synopsis.ilike.%${search}%`);
      }
      
      // Fix: Apply status and type filters to the detail tables through the join
      if (status && contentType === 'anime') {
        console.log(`📊 Applying anime status filter: ${status}`);
        query = query.eq('anime_details.status', status);
      } else if (status && contentType === 'manga') {
        console.log(`📊 Applying manga status filter: ${status}`);
        query = query.eq('manga_details.status', status);
      }
      
      if (type && contentType === 'anime') {
        console.log(`📊 Applying anime type filter: ${type}`);
        query = query.eq('anime_details.type', type);
      } else if (type && contentType === 'manga') {
        console.log(`📊 Applying manga type filter: ${type}`);
        query = query.eq('manga_details.type', type);
      }
      
      if (year) {
        console.log(`📊 Applying year filter: ${year}`);
        query = query.eq('year', parseInt(year));
      }
      
      if (season && contentType === 'anime') {
        console.log(`📊 Applying season filter: ${season}`);
        query = query.eq('anime_details.season', season);
      }

      // Note: Genre filtering will be added in Stage 3 after we verify basic functionality

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

      // Transform the normalized data to the format expected by frontend
      const transformedData = (data || []).map(item => {
        const isAnime = contentType === 'anime';
        const details = isAnime ? item.anime_details?.[0] : item.manga_details?.[0];
        
        // Flatten the structure to match the old format
        return {
          ...item,
          // Include specific fields from details
          ...(details || {}),
          // Extract genres and studios from relationships
          genres: item.title_genres?.map((tg: any) => tg.genres?.name).filter(Boolean) || [],
          studios: item.title_studios?.map((ts: any) => ts.studios?.name).filter(Boolean) || [],
          authors: item.title_authors?.map((ta: any) => ta.authors?.name).filter(Boolean) || []
        };
      });

      const totalPages = count ? Math.ceil(count / limit) : 0;

      const response = {
        data: transformedData,
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