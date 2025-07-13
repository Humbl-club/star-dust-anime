
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.3'
import { corsHeaders } from '../_shared/cors.ts'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)

Deno.serve(async (req) => {
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
        animeId = body.id || body.animeId;
      } catch {
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

    // Execute optimized JOIN query to get all anime data with relationships
    const { data, error } = await supabase.rpc('get_anime_detail', {
      anime_id_param: animeId
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
