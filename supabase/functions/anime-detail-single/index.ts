
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)

Deno.serve(async (req) => {
  console.log('Anime detail function started', req.method, req.url)
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    let animeId: string | null = null;
    
    // Parse URL and log details for debugging
    const url = new URL(req.url);
    console.log('Full URL:', req.url);
    console.log('URL pathname:', url.pathname);
    console.log('URL search params:', url.searchParams.toString());
    console.log('Path segments:', url.pathname.split('/'));

    // Try to get anime ID from different sources
    if (req.method === 'POST') {
      // Check request body first
      try {
        const body = await req.json();
        console.log('Request body:', body);
        const bodyId = body.id || body.animeId;
        
        // Only use body ID if it's not the literal ":id" string
        if (bodyId && bodyId !== ':id') {
          animeId = bodyId;
          console.log('Valid ID found in body:', animeId);
        } else if (bodyId === ':id') {
          console.log('Body contains literal ":id", will try other extraction methods');
        }
      } catch (e) {
        console.log('Failed to parse request body:', e);
        // If JSON parsing fails, continue to other methods
      }
    }

    // If no valid ID from body, try URL path extraction
    if (!animeId) {
      console.log('Attempting to extract ID from URL path...');
      const pathSegments = url.pathname.split('/').filter(segment => segment.length > 0);
      console.log('Path segments filtered:', pathSegments);
      
      // Strategy 1: Get last segment that's not ":id" and not the function name
      const lastSegment = pathSegments[pathSegments.length - 1];
      if (lastSegment && lastSegment !== ':id' && lastSegment !== 'anime-detail-single') {
        animeId = lastSegment;
        console.log('Found ID from last path segment:', animeId);
      }
      
      // Strategy 2: Look for segment that looks like a UUID or number
      if (!animeId) {
        for (const segment of pathSegments) {
          // Check if segment looks like a UUID or numeric ID
          if (segment !== ':id' && segment !== 'anime-detail-single' && 
              (segment.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i) || 
               segment.match(/^\d+$/))) {
            animeId = segment;
            console.log('Found UUID/numeric ID in path:', animeId);
            break;
          }
        }
      }
      
      // Strategy 3: Try query parameters
      if (!animeId) {
        animeId = url.searchParams.get('id') || url.searchParams.get('animeId');
        if (animeId && animeId !== ':id') {
          console.log('Found ID from query params:', animeId);
        } else {
          animeId = null;
        }
      }
    }
    
    if (!animeId || animeId === ':id') {
      console.error('No valid anime ID provided. Received:', animeId);
      return new Response(
        JSON.stringify({ 
          error: 'Anime ID is required', 
          received_id: animeId,
          debug_info: {
            url: req.url,
            method: req.method,
            pathname: url.pathname
          }
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('Fetching anime details for ID:', animeId)

    // Test RPC function exists first
    console.log('Testing RPC function...')
    
    // Execute optimized JOIN query to get all anime data with relationships
    const { data, error } = await supabase.rpc('get_anime_detail', {
      anime_id_param: animeId
    })
    
    console.log('RPC response:', { data: data ? 'received' : 'null', error, dataLength: data?.length })

    if (error) {
      console.error('Database error:', error)
      return new Response(
        JSON.stringify({ error: 'Failed to fetch anime details', details: error.message }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    if (!data || data.length === 0) {
      console.log('No anime found for ID:', animeId)
      return new Response(
        JSON.stringify({ error: 'Anime not found' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const animeDetail = data[0]
    console.log('Successfully fetched anime:', animeDetail.title)

    return new Response(
      JSON.stringify({
        success: true,
        data: animeDetail
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (err) {
    console.error('Unexpected error:', err)
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: err.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
