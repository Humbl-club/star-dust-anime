import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  console.log('🧪 Test function called!')
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Test basic functionality
    console.log('Testing complete-anilist-sync function...')
    
    const { data, error } = await supabase.functions.invoke('complete-anilist-sync', {
      body: { contentType: 'anime' }
    })

    console.log('Result:', { data, error })

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Test complete',
        result: { data, error }
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Test error:', error)
    return new Response(
      JSON.stringify({
        error: 'Test failed',
        details: error.message
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})