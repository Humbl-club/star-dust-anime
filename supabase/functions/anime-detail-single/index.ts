
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
    
    console.log('=== ANIME DETAIL FUNCTION DEBUG ===');
    console.log('Method:', req.method);
    console.log('URL:', req.url);
    console.log('Headers:', Object.fromEntries(req.headers.entries()));
    
    // ONLY accept POST requests with ID in body
    if (req.method === 'POST') {
      try {
        const body = await req.json();
        console.log('📦 Raw request body:', JSON.stringify(body));
        
        // Extract ID from body - try multiple possible keys
        const bodyId = body.id || body.animeId || body.anime_id;
        console.log('🔍 Extracted bodyId:', bodyId, 'Type:', typeof bodyId);
        
        // Validate ID - must not be null, empty, or literal ":id"
        if (bodyId && 
            typeof bodyId === 'string' && 
            bodyId.trim() !== '' && 
            bodyId !== ':id' && 
            bodyId !== 'undefined' && 
            bodyId !== 'null') {
          animeId = bodyId.trim();
          console.log('✅ Valid ID accepted from body:', animeId);
          
          // Log ID format detection
          const isUUID = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(animeId);
          const isInteger = /^\d+$/.test(animeId);
          console.log(`🏷️ ID format - UUID: ${isUUID}, Integer: ${isInteger}, Raw: "${animeId}"`);
        } else {
          console.log('❌ Invalid ID in body:', bodyId, '- rejected (empty, :id, or invalid type)');
        }
      } catch (e) {
        console.error('❌ Failed to parse request body as JSON:', e);
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
      console.log('❌ Non-POST request method, ID required in POST body');
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
    
    if (!animeId) {
      console.error('❌ FINAL CHECK FAILED - No valid anime ID provided. Received:', animeId);
      return new Response(
        JSON.stringify({ 
          error: 'Anime ID is required in request body', 
          received_id: animeId,
          debug_info: {
            url: req.url,
            method: req.method,
            issue: 'ID must be provided in POST request body as {id: "actual_id"}',
            example: { id: "123e4567-e89b-12d3-a456-426614174000" }
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
