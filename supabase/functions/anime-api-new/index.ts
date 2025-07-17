import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  console.log('🚀 anime-api-new function called');
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const { method, path } = await req.json();
    
    if (method !== 'GET') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const url = new URL(path, 'http://localhost');
    const pathSegments = url.pathname.split('/').filter(Boolean);
    const contentType = pathSegments[0]; // 'anime' or 'manga'
    
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const search = url.searchParams.get('search');
    const genre = url.searchParams.get('genre');
    const status = url.searchParams.get('status');
    const type = url.searchParams.get('type');
    const year = url.searchParams.get('year');
    const season = url.searchParams.get('season');
    const sort_by = url.searchParams.get('sort_by') || 'score';
    const order = url.searchParams.get('order') || 'desc';

    console.log('Query params:', { contentType, page, limit, search, genre, status, type, year, season, sort_by, order });

    let query;
    let countQuery;

    if (contentType === 'anime') {
      // Query for anime with details
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
          year,
          color_theme,
          created_at,
          updated_at,
          anime_details!inner (
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
        `)
        .not('anime_details', 'is', null);

      countQuery = supabase
        .from('titles')
        .select('id', { count: 'exact', head: true })
        .not('anime_details', 'is', null);
    } else if (contentType === 'manga') {
      // Query for manga with details
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
          year,
          color_theme,
          created_at,
          updated_at,
          manga_details!inner (
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
        `)
        .not('manga_details', 'is', null);

      countQuery = supabase
        .from('titles')
        .select('id', { count: 'exact', head: true })
        .not('manga_details', 'is', null);
    } else {
      return new Response(JSON.stringify({ error: 'Invalid content type' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Apply filters
    if (search) {
      const searchFilter = `title.ilike.%${search}%,title_english.ilike.%${search}%,title_japanese.ilike.%${search}%`;
      query = query.or(searchFilter);
      countQuery = countQuery.or(searchFilter);
    }

    if (status) {
      if (contentType === 'anime') {
        query = query.eq('anime_details.status', status);
        countQuery = countQuery.eq('anime_details.status', status);
      } else {
        query = query.eq('manga_details.status', status);
        countQuery = countQuery.eq('manga_details.status', status);
      }
    }

    if (type) {
      if (contentType === 'anime') {
        query = query.eq('anime_details.type', type);
        countQuery = countQuery.eq('anime_details.type', type);
      } else {
        query = query.eq('manga_details.type', type);
        countQuery = countQuery.eq('manga_details.type', type);
      }
    }

    if (year) {
      query = query.eq('year', parseInt(year));
      countQuery = countQuery.eq('year', parseInt(year));
    }

    if (season && contentType === 'anime') {
      query = query.eq('anime_details.season', season);
      countQuery = countQuery.eq('anime_details.season', season);
    }

    // Apply sorting
    if (sort_by === 'score') {
      query = query.order('score', { ascending: order === 'asc', nullsLast: true });
    } else if (sort_by === 'popularity') {
      query = query.order('popularity', { ascending: order === 'asc', nullsLast: true });
    } else if (sort_by === 'year') {
      query = query.order('year', { ascending: order === 'asc', nullsLast: true });
    } else if (sort_by === 'title') {
      query = query.order('title', { ascending: order === 'asc' });
    } else if (sort_by === 'created_at') {
      query = query.order('created_at', { ascending: order === 'asc' });
    } else {
      query = query.order('score', { ascending: false, nullsLast: true });
    }

    // Apply pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    // Execute queries
    const [{ data, error }, { count, error: countError }] = await Promise.all([
      query,
      countQuery
    ]);

    if (error) {
      console.error('Query error:', error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (countError) {
      console.error('Count error:', countError);
      return new Response(JSON.stringify({ error: countError.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Transform data to flatten the nested structure
    const transformedData = data?.map((item: any) => {
      const details = contentType === 'anime' ? item.anime_details : item.manga_details;
      
      return {
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
        year: item.year,
        color_theme: item.color_theme,
        created_at: item.created_at,
        updated_at: item.updated_at,
        // Add details fields
        ...details
      };
    }) || [];

    // Calculate pagination
    const totalPages = Math.ceil((count || 0) / limit);
    const pagination = {
      current_page: page,
      per_page: limit,
      total: count || 0,
      total_pages: totalPages,
      has_next_page: page < totalPages,
      has_prev_page: page > 1
    };

    const response = {
      data: transformedData,
      pagination,
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

    console.log(`Returning ${transformedData.length} ${contentType} items`);

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Function error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});