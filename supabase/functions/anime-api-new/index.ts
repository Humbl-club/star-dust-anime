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

      // Stage 1: Basic query with complete relationships
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
            anilist_score,
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
            ),
            title_genres(
              genres(
                id,
                name
              )
            ),
            title_studios(
              studios(
                id,
                name
              )
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
            anilist_score,
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
            ),
            title_genres(
              genres(
                id,
                name
              )
            ),
            title_authors(
              authors(
                id,
                name
              )
            )
          `, { count: 'exact' });
      }

      console.log('📊 Complex query with relationships created');

      // Stage 2: Apply comprehensive filters
      if (search) {
        console.log(`🔍 Applying search filter: ${search}`);
        query = query.or(`title.ilike.%${search}%,title_english.ilike.%${search}%,title_japanese.ilike.%${search}%,synopsis.ilike.%${search}%`);
      }
      
      // Apply status and type filters to the detail tables
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

      // Stage 3: Advanced genre filtering (simplified approach)
      // Note: Genre filtering requires a more complex approach with the normalized structure
      // For now, we'll handle this in the frontend filtering or add it later

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

      console.log(`✅ Query executed successfully, processing ${data?.length || 0} items`);

      // Stage 4: Enhanced data transformation with error handling
      const transformedData = (data || []).map((item, index) => {
        try {
          const isAnime = contentType === 'anime';
          const details = isAnime ? item.anime_details?.[0] : item.manga_details?.[0];
          
          if (!details) {
            console.warn(`⚠️ Missing details for item ${index}:`, item.id);
          }

          // Stage 5: Comprehensive data flattening
          const transformed = {
            // Core title data
            id: item.id,
            anilist_id: item.anilist_id,
            title: item.title,
            title_english: item.title_english,
            title_japanese: item.title_japanese,
            synopsis: item.synopsis,
            image_url: item.image_url,
            score: item.score,
            anilist_score: item.anilist_score,
            rank: item.rank,
            popularity: item.popularity,
            members: item.members,
            favorites: item.favorites,
            year: item.year,
            color_theme: item.color_theme,
            created_at: item.created_at,
            updated_at: item.updated_at,

            // Flatten detail fields
            ...(details || {}),

            // Rich relationship data
            genres: item.title_genres?.map((tg: any) => tg.genres?.name).filter(Boolean) || [],
            studios: item.title_studios?.map((ts: any) => ts.studios?.name).filter(Boolean) || [],
            authors: item.title_authors?.map((ta: any) => ta.authors?.name).filter(Boolean) || [],

            // Legacy compatibility fields
            mal_id: item.anilist_id, // Use anilist_id as fallback
            scored_by: item.members || 0
          };

          return transformed;
        } catch (transformError) {
          console.error(`❌ Transform error for item ${index}:`, transformError);
          return {
            id: item.id,
            title: item.title || 'Unknown Title',
            error: 'Transform failed'
          };
        }
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