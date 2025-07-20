
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

    // Try to get anime ID from different sources
    if (req.method === 'POST') {
      // Check request body first
      try {
        const body = await req.json();
        console.log('Request body:', body);
        animeId = body.id || body.animeId;
      } catch (e) {
        console.log('Failed to parse request body:', e);
        // If JSON parsing fails, continue to other methods
      }
    }

    // If not found in body, try URL path and query parameters
    if (!animeId) {
      const url = new URL(req.url);
      animeId = url.pathname.split('/').pop() || url.searchParams.get('id');
    }
    
    if (!animeId) {
      console.error('No anime ID provided');
      return new Response(
        JSON.stringify({ error: 'Anime ID is required' }),
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
