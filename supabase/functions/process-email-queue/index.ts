import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7'

// Initialize Supabase client with error handling
const supabaseUrl = Deno.env.get('SUPABASE_URL')
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

console.log('🔧 Environment check:', {
  hasUrl: !!supabaseUrl,
  hasServiceKey: !!supabaseServiceKey,
  urlPrefix: supabaseUrl?.substring(0, 20) + '...'
})

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing required environment variables: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const processEmail = async (email: any) => {
  try {
    // Call send-auth-emails function
    const { error } = await supabase.functions.invoke('send-auth-emails', {
      body: {
        email: email.email,
        email_type: email.email_type,
        user_id: email.user_id,
        metadata: email.metadata
      }
    })

    if (error) {
      throw error
    }

    // On success, move to sent table and update status
    const { error: insertError } = await supabase
      .from('email_sent')
      .insert({
        email: email.email,
        user_id: email.user_id,
        email_type: email.email_type,
        metadata: email.metadata,
        correlation_id: email.correlation_id
      })

    if (insertError) {
      console.error('Error inserting to email_sent:', insertError)
    }

    await supabase
      .from('email_queue')
      .delete()
      .eq('id', email.id)

    console.log(`Successfully processed email ${email.correlation_id}`)
    return true
  } catch (error) {
    console.error(`Error processing email ${email.correlation_id}:`, error)

    // Calculate next retry with exponential backoff
    const retries = (email.retries || 0) + 1
    let next_retry_at = new Date()

    if (retries >= 4) {
      // Mark as permanently failed after 4 retries
      await supabase
        .from('email_queue')
        .update({ 
          status: 'failed',
          error_message: error.message,
          updated_at: new Date().toISOString()
        })
        .eq('id', email.id)
    } else {
      // Exponential backoff: 5min, 15min, 45min, 2hr
      const backoffMinutes = Math.pow(3, retries) * 5
      next_retry_at.setMinutes(next_retry_at.getMinutes() + backoffMinutes)

      await supabase
        .from('email_queue')
        .update({ 
          retries,
          next_retry_at: next_retry_at.toISOString(),
          error_message: error.message,
          updated_at: new Date().toISOString()
        })
        .eq('id', email.id)
    }

    return false
  }
}

const handler = async (_req: Request) => {
  console.log('🚀 process-email-queue handler called:', {
    method: _req.method,
    url: _req.url,
    timestamp: new Date().toISOString()
  })
  
  try {
    // Handle CORS preflight requests
    if (_req.method === 'OPTIONS') {
      console.log('📋 Handling CORS preflight request')
      return new Response(null, { headers: corsHeaders })
    }

    console.log('📧 Fetching pending emails from queue...')
    
    // Fetch pending emails
    const { data: emails, error } = await supabase
      .from('email_queue')
      .select()
      .eq('status', 'pending')
      .lte('next_retry_at', new Date().toISOString())
      .order('created_at')
      .limit(10)

    console.log('📊 Query result:', { 
      emailCount: emails?.length || 0, 
      error: error?.message,
      hasEmails: !!emails 
    })

    if (error) throw error

    if (!emails || emails.length === 0) {
      console.log('✅ No pending emails to process')
      return new Response(JSON.stringify({ processed: 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    // Process emails in parallel
    const results = await Promise.all(emails.map(processEmail))
    const processed = results.filter(Boolean).length

    return new Response(
      JSON.stringify({ 
        processed,
        total: emails.length
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (err) {
    console.error('Error in process-email-queue:', err)
    return new Response(
      JSON.stringify({ error: err.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
}

Deno.serve(handler)