
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

    // Get ID from request body (this is how the frontend sends it)
    if (req.method === 'POST') {
      try {
        const body = await req.json();
        console.log('Request body received:', body);
        mangaId = body.id || body.mangaId;
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
    if (!mangaId || mangaId === ':id' || mangaId.includes(':')) {
      console.error('Invalid or missing manga ID:', mangaId);
      return new Response(
        JSON.stringify({ 
          error: 'Valid manga ID is required', 
          received: mangaId,
          expectedFormat: 'UUID or integer string'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
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
