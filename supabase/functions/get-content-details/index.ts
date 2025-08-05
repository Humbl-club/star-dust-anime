import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ContentDetailsRequest {
  content_id: string;
  type: 'anime' | 'manga';
  user_id?: string;
}

interface ContentDetailsResponse {
  content: any;
  recommendations: any[];
  streaming_availability: any;
  user_list_status: any;
  related_titles: any[];
  error?: string;
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

    const { content_id, type, user_id }: ContentDetailsRequest = await req.json();

    console.log(`🚀 Fetching content details for ${type} ${content_id}`);

    if (!content_id || !type) {
      throw new Error('Missing content_id or type parameter');
    }

    // First get the main content to extract the UUID
    const mainContent = await fetchMainContent(supabase, content_id, type);
    const actualTitleId = mainContent?.id || content_id;

    // Parallel data fetching using Promise.all with the actual UUID
    const [
      contentResult,
      recommendationsResult,
      streamingResult,
      userListResult,
      relatedTitlesResult
    ] = await Promise.allSettled([
      // 1. Main content details (already fetched)
      Promise.resolve(mainContent),
      
      // 2. Recommendations
      fetchRecommendations(supabase, actualTitleId, type),
      
      // 3. Streaming availability
      fetchStreamingAvailability(supabase, actualTitleId),
      
      // 4. User list status (if user authenticated)
      user_id ? fetchUserListStatus(supabase, user_id, actualTitleId, type) : Promise.resolve(null),
      
      // 5. Related titles
      fetchRelatedTitles(supabase, actualTitleId, type)
    ]);

    const response: ContentDetailsResponse = {
      content: contentResult.status === 'fulfilled' ? contentResult.value : null,
      recommendations: recommendationsResult.status === 'fulfilled' ? recommendationsResult.value : [],
      streaming_availability: streamingResult.status === 'fulfilled' ? streamingResult.value : null,
      user_list_status: userListResult.status === 'fulfilled' ? userListResult.value : null,
      related_titles: relatedTitlesResult.status === 'fulfilled' ? relatedTitlesResult.value : []
    };

    // Log any errors but don't fail the request
    [contentResult, recommendationsResult, streamingResult, userListResult, relatedTitlesResult]
      .forEach((result, index) => {
        if (result.status === 'rejected') {
          console.error(`Query ${index} failed:`, result.reason);
        }
      });

    console.log(`✅ Content details fetched successfully for ${type} ${content_id}`);

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in get-content-details:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        content: null,
        recommendations: [],
        streaming_availability: null,
        user_list_status: null,
        related_titles: []
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

async function fetchMainContent(supabase: any, content_id: string, type: 'anime' | 'manga') {
  const isAnime = type === 'anime';
  const detailsTable = isAnime ? 'anime_details' : 'manga_details';
  const relatedTable = isAnime ? 'title_studios' : 'title_authors';
  const relatedJoin = isAnime ? 'studios' : 'authors';

  // First try to find by UUID, then by anilist_id, then by title slug
  let query = supabase
    .from('titles')
    .select(`
      *,
      ${detailsTable}!inner(*),
      title_genres(genres(*)),
      ${relatedTable}(${relatedJoin}(*))
    `);

  // Check if content_id is a UUID format
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(content_id);
  const isNumeric = /^\d+$/.test(content_id);

  if (isUuid) {
    query = query.eq('id', content_id);
  } else if (isNumeric) {
    query = query.eq('anilist_id', parseInt(content_id));
  } else {
    // Treat as slug/title - search in title, title_english, or title_japanese
    query = query.or(`title.ilike.%${content_id}%,title_english.ilike.%${content_id}%,title_japanese.ilike.%${content_id}%`);
  }

  const { data, error } = await query.single();

  if (error) throw error;
  return data;
}

async function fetchRecommendations(supabase: any, content_id: string, type: 'anime' | 'manga') {
  // Get similar titles based on genre matching
  const { data, error } = await supabase.rpc('get_related_titles', {
    title_id_param: content_id,
    content_type: type,
    limit_param: 6
  });

  if (error) {
    console.warn('Recommendations fetch failed:', error);
    return [];
  }
  return data || [];
}

async function fetchStreamingAvailability(supabase: any, content_id: string) {
  const { data, error } = await supabase
    .from('streaming_availability_cache')
    .select('*')
    .eq('title_id', content_id)
    .gt('expires_at', new Date().toISOString())
    .single();

  if (error) {
    console.warn('Streaming availability fetch failed:', error);
    return null;
  }
  return data;
}

async function fetchUserListStatus(supabase: any, user_id: string, content_id: string, type: 'anime' | 'manga') {
  const table = type === 'anime' ? 'user_anime_list' : 'user_manga_list';
  
  const { data, error } = await supabase
    .from(table)
    .select('*')
    .eq('user_id', user_id)
    .eq('title_id', content_id)
    .single();

  if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
    console.warn('User list status fetch failed:', error);
    return null;
  }
  return data;
}

async function fetchRelatedTitles(supabase: any, content_id: string, type: 'anime' | 'manga') {
  try {
    const { data, error } = await supabase.rpc('get_related_titles', {
      title_id_param: content_id,
      content_type: type,
      limit_param: 8
    });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.warn('Related titles fetch failed:', error);
    return [];
  }
}