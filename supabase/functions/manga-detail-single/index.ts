
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
  console.log('🚀 Manga detail function started', req.method, req.url)
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    let mangaId: string | null = null;
    
    console.log('=== MANGA DETAIL FUNCTION DEBUG ===');
    console.log('Method:', req.method);
    console.log('URL:', req.url);
    console.log('Headers:', Object.fromEntries(req.headers.entries()));
    
    // ONLY accept POST requests with ID in body
    if (req.method === 'POST') {
      try {
        const body = await req.json();
        console.log('📦 Raw request body:', JSON.stringify(body));
        
        // Extract ID from body - try multiple possible keys
        const bodyId = body.id || body.mangaId || body.manga_id;
        console.log('🔍 Extracted bodyId:', bodyId, 'Type:', typeof bodyId);
        
        // Validate ID - must not be null, empty, or literal ":id"
        if (bodyId && 
            typeof bodyId === 'string' && 
            bodyId.trim() !== '' && 
            bodyId !== ':id' && 
            bodyId !== 'undefined' && 
            bodyId !== 'null') {
          mangaId = bodyId.trim();
          console.log('✅ Valid ID accepted from body:', mangaId);
          
          // Log ID format detection
          const isUUID = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(mangaId);
          const isInteger = /^\d+$/.test(mangaId);
          console.log(`🏷️ ID format - UUID: ${isUUID}, Integer: ${isInteger}, Raw: "${mangaId}"`);
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
    
    if (!mangaId) {
      console.error('❌ FINAL CHECK FAILED - No valid manga ID provided. Received:', mangaId);
      return new Response(
        JSON.stringify({ 
          error: 'Manga ID is required in request body', 
          received_id: mangaId,
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

    console.log('✅ Fetching manga details for ID:', mangaId, 'Type:', typeof mangaId)

    // Execute RPC function with flexible ID matching
    const { data, error } = await supabase.rpc('get_manga_detail', {
      manga_id_param: mangaId
    })
    
    console.log('✅ RPC response:', { 
      hasData: !!data, 
      dataLength: data?.length, 
      error: error?.message || 'none',
      mangaId: mangaId
    })

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
