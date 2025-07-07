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
  console.log('🚀 anime-api-new function called with method:', req.method);
  console.log('🌐 Request URL:', req.url);
  console.log('📍 Headers:', Object.fromEntries(req.headers.entries()));
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('✅ Handling CORS preflight');
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseKey) {
      console.error('❌ Missing Supabase environment variables');
      throw new Error('Missing Supabase configuration');
    }

    console.log('✅ Supabase config found');
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Parse request body
    const requestBody = await req.json();
    console.log('📦 Request body:', requestBody);
    
    const { method, path }: ApiRequest = requestBody;
    
    if (!method || !path) {
      console.error('❌ Missing method or path in request');
      throw new Error('Invalid request format');
    }

    // Parse the path to extract content type and query parameters
    const url = new URL(`http://localhost${path}`);
    const pathSegments = url.pathname.split('/').filter(Boolean);
    const contentType = pathSegments[0];
    
    console.log('🎯 Content type:', contentType);
    console.log('🔍 Query params:', Object.fromEntries(url.searchParams));

    if (!['anime', 'manga'].includes(contentType)) {
      console.error('❌ Invalid content type:', contentType);
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

      console.log('📊 Query params:', { page, limit, search, sort_by, order });

      // **STEP 1: Test basic title query first**
      console.log('🔍 Testing basic titles query...');
      
      let basicQuery = supabase
        .from('titles')
        .select('id, title, image_url, score, popularity, anilist_id', { count: 'exact' });

      // Test if basic query works
      const { data: basicTest, error: basicError } = await basicQuery.limit(5);
      
      if (basicError) {
        console.error('❌ Basic query failed:', basicError);
        throw new Error(`Basic query failed: ${basicError.message}`);
      }
      
      console.log('✅ Basic query works, found', basicTest?.length, 'titles');

      // **STEP 2: Add content type filtering**
      let query;
      
      if (contentType === 'anime') {
        console.log('🎬 Building anime query with relationships...');
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
              trailer_id
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
        console.log('📚 Building manga query with relationships...');
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
              type
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

      console.log('🔍 Testing content-specific query...');

      // **STEP 3: Add filters step by step**
      if (search) {
        console.log('🔍 Adding search filter:', search);
        query = query.or(`title.ilike.%${search}%,title_english.ilike.%${search}%,title_japanese.ilike.%${search}%`);
      }
      
      // Apply detail table filters
      if (status && contentType === 'anime') {
        console.log('📊 Adding anime status filter:', status);
        query = query.eq('anime_details.status', status);
      } else if (status && contentType === 'manga') {
        console.log('📊 Adding manga status filter:', status);
        query = query.eq('manga_details.status', status);
      }
      
      if (type && contentType === 'anime') {
        console.log('📊 Adding anime type filter:', type);
        query = query.eq('anime_details.type', type);
      } else if (type && contentType === 'manga') {
        console.log('📊 Adding manga type filter:', type);
        query = query.eq('manga_details.type', type);
      }
      
      if (year) {
        console.log('📊 Adding year filter:', year);
        query = query.eq('year', parseInt(year));
      }
      
      if (season && contentType === 'anime') {
        console.log('📊 Adding season filter:', season);
        query = query.eq('anime_details.season', season);
      }

      // **STEP 4: Apply sorting**
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

      console.log('📊 Applying sort:', sortField, order);
      query = query.order(sortField, { ascending: order === 'asc', nullsFirst: false });

      // **STEP 5: Apply pagination**
      const from = (page - 1) * limit;
      const to = from + limit - 1;
      console.log('📄 Applying pagination:', { from, to });
      query = query.range(from, to);

      // **STEP 6: Execute the query**
      console.log('🚀 Executing final query...');
      const { data, error, count } = await query;

      if (error) {
        console.error('❌ Query execution failed:', error);
        return new Response(
          JSON.stringify({ error: 'Database query failed', details: error.message }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      console.log('✅ Query executed successfully!');
      console.log('📊 Results:', { count: data?.length, total: count });

      // **STEP 7: Transform data with relationships**
      const transformedData = (data || []).map((item, index) => {
        try {
          const isAnime = contentType === 'anime';
          const details = isAnime ? item.anime_details?.[0] : item.manga_details?.[0];
          
          // Extract relationship data
          const genres = item.title_genres?.map((tg: any) => tg.genres?.name).filter(Boolean) || [];
          const studios = item.title_studios?.map((ts: any) => ts.studios?.name).filter(Boolean) || [];
          const authors = item.title_authors?.map((ta: any) => ta.authors?.name).filter(Boolean) || [];
          
          console.log(`🔗 Item ${index} relationships:`, { 
            genres: genres.length, 
            studios: studios.length, 
            authors: authors.length 
          });
          
          return {
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
            genres,
            studios,
            authors,

            // Legacy compatibility fields
            mal_id: item.anilist_id,
            scored_by: item.members || 0
          };
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

      console.log('✅ Sending response with', transformedData.length, 'items');

      return new Response(
        JSON.stringify(response),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('❌ Method not allowed:', method);
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { 
        status: 405, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('💥 Edge function error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
})