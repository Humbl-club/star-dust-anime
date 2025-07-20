
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

    // Try to get manga ID from different sources
    if (req.method === 'POST') {
      // Check request body first
      try {
        const body = await req.json();
        console.log('Request body:', body);
        mangaId = body.id || body.mangaId;
      } catch (e) {
        console.log('Failed to parse request body:', e);
        // If JSON parsing fails, continue to other methods
      }
    }

    // If not found in body, try URL path and query parameters
    if (!mangaId) {
      const url = new URL(req.url);
      mangaId = url.pathname.split('/').pop() || url.searchParams.get('id');
    }
    
    if (!mangaId) {
      console.error('No manga ID provided');
      return new Response(
        JSON.stringify({ error: 'Manga ID is required' }),
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
