
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
  console.log('🚀 Anime detail function started', req.method, req.url)
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    let animeId: string | null = null;

    // Get ID from request body (this is how the frontend sends it)
    if (req.method === 'POST') {
      try {
        const body = await req.json();
        console.log('Request body received:', body);
        animeId = body.id || body.animeId;
      } catch (e) {
        console.error('Failed to parse request body:', e);
        return new Response(
          JSON.stringify({ 
            error: 'Invalid JSON in request body', 
            details: e.message 
          }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }
    } else {
      return new Response(
        JSON.stringify({ 
          error: 'Method not allowed. Use POST with ID in request body.' 
        }),
        { 
          status: 405, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Validate we got a real ID, not ":id" literal
    if (!animeId || animeId === ':id' || animeId.includes(':')) {
      console.error('Invalid or missing anime ID:', animeId);
      return new Response(
        JSON.stringify({ 
          error: 'Valid anime ID is required', 
          received: animeId,
          expectedFormat: 'UUID or integer string'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('✅ Fetching anime details for ID:', animeId, 'Type:', typeof animeId)

    // Execute RPC function with flexible ID matching
    const { data, error } = await supabase.rpc('get_anime_detail', {
      anime_id_param: animeId
    })
    
    console.log('✅ RPC response:', { 
      hasData: !!data, 
      dataLength: data?.length, 
      error: error?.message || 'none',
      animeId: animeId
    })

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
