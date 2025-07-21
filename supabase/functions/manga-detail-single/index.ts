
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
  console.log('Manga detail function started', req.method, req.url)
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    let mangaId: string | null = null;
    
    // Parse URL and log details for debugging
    const url = new URL(req.url);
    console.log('Full URL:', req.url);
    console.log('URL pathname:', url.pathname);
    console.log('URL search params:', url.searchParams.toString());
    console.log('Path segments:', url.pathname.split('/'));

    // Try to get manga ID from different sources
    if (req.method === 'POST') {
      // Check request body first
      try {
        const body = await req.json();
        console.log('Request body:', body);
        const bodyId = body.id || body.mangaId;
        
        // Only use body ID if it's not the literal ":id" string
        if (bodyId && bodyId !== ':id') {
          mangaId = bodyId;
          console.log('Valid ID found in body:', mangaId);
        } else if (bodyId === ':id') {
          console.log('Body contains literal ":id", will try other extraction methods');
        }
      } catch (e) {
        console.log('Failed to parse request body:', e);
        // If JSON parsing fails, continue to other methods
      }
    }

    // If no valid ID from body, try URL path extraction
    if (!mangaId) {
      console.log('Attempting to extract ID from URL path...');
      const pathSegments = url.pathname.split('/').filter(segment => segment.length > 0);
      console.log('Path segments filtered:', pathSegments);
      
      // Strategy 1: Get last segment that's not ":id" and not the function name
      const lastSegment = pathSegments[pathSegments.length - 1];
      if (lastSegment && lastSegment !== ':id' && lastSegment !== 'manga-detail-single') {
        mangaId = lastSegment;
        console.log('Found ID from last path segment:', mangaId);
      }
      
      // Strategy 2: Look for segment that looks like a UUID or number
      if (!mangaId) {
        for (const segment of pathSegments) {
          // Check if segment looks like a UUID or numeric ID
          if (segment !== ':id' && segment !== 'manga-detail-single' && 
              (segment.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i) || 
               segment.match(/^\d+$/))) {
            mangaId = segment;
            console.log('Found UUID/numeric ID in path:', mangaId);
            break;
          }
        }
      }
      
      // Strategy 3: Try query parameters
      if (!mangaId) {
        mangaId = url.searchParams.get('id') || url.searchParams.get('mangaId');
        if (mangaId && mangaId !== ':id') {
          console.log('Found ID from query params:', mangaId);
        } else {
          mangaId = null;
        }
      }
    }
    
    if (!mangaId || mangaId === ':id') {
      console.error('No valid manga ID provided. Received:', mangaId);
      return new Response(
        JSON.stringify({ 
          error: 'Manga ID is required', 
          received_id: mangaId,
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

    console.log('Fetching manga details for ID:', mangaId)

    // Test RPC function exists first
    console.log('Testing RPC function...')
    
    // Execute optimized JOIN query to get all manga data with relationships
    const { data, error } = await supabase.rpc('get_manga_detail', {
      manga_id_param: mangaId
    })
    
    console.log('RPC response:', { data: data ? 'received' : 'null', error, dataLength: data?.length })

    if (error) {
      console.error('Database error:', error)
      return new Response(
        JSON.stringify({ error: 'Failed to fetch manga details', details: error.message }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    if (!data || data.length === 0) {
      console.log('No manga found for ID:', mangaId)
      return new Response(
        JSON.stringify({ error: 'Manga not found' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const mangaDetail = data[0]
    console.log('Successfully fetched manga:', mangaDetail.title)

    return new Response(
      JSON.stringify({
        success: true,
        data: mangaDetail
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
