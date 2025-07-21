
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
    
    console.log('=== ANIME DETAIL FUNCTION DEBUG ===');
    console.log('Method:', req.method);
    console.log('URL:', req.url);
    
    // ONLY get ID from request body for POST requests
    if (req.method === 'POST') {
      try {
        const body = await req.json();
        console.log('Raw request body:', JSON.stringify(body));
        
        // Extract ID from body
        const bodyId = body.id || body.animeId;
        console.log('Extracted bodyId:', bodyId, 'Type:', typeof bodyId);
        
        // Reject literal ":id" string and empty values
        if (bodyId && bodyId !== ':id' && bodyId.toString().trim() !== '') {
          animeId = bodyId.toString();
          console.log('✅ Valid ID accepted from body:', animeId);
        } else {
          console.log('❌ Invalid ID in body:', bodyId, '- literal ":id" or empty');
        }
      } catch (e) {
        console.error('❌ Failed to parse request body as JSON:', e);
      }
    } else {
      console.log('❌ Non-POST request method, ID required in body');
    }
    
    if (!animeId || animeId === ':id' || animeId.trim() === '') {
      console.error('❌ FINAL CHECK FAILED - No valid anime ID provided. Received:', animeId);
      return new Response(
        JSON.stringify({ 
          error: 'Anime ID is required in request body', 
          received_id: animeId,
          debug_info: {
            url: req.url,
            method: req.method,
            issue: 'ID must be provided in POST request body as {id: "actual_id"}'
          }
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
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
