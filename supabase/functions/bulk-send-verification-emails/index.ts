import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    console.log('Starting bulk verification email send...')

    // Get all users with pending verification status
    const { data: pendingUsers, error: fetchError } = await supabase
      .from('profiles')
      .select(`
        id,
        verification_status,
        verification_required_until
      `)
      .eq('verification_status', 'pending')

    if (fetchError) {
      console.error('Error fetching pending users:', fetchError)
      throw fetchError
    }

    console.log(`Found ${pendingUsers?.length || 0} users with pending verification`)

    if (!pendingUsers || pendingUsers.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No pending users found',
          emails_sent: 0
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        }
      )
    }

    // Get auth user data for each pending user
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers()
    
    if (authError) {
      console.error('Error fetching auth users:', authError)
      throw authError
    }

    const emailsSent = []
    const emailsErrors = []

    // Send verification email to each pending user
    for (const profile of pendingUsers) {
      try {
        // Find the corresponding auth user
        const authUser = authUsers.users.find(u => u.id === profile.id)
        
        if (!authUser || !authUser.email) {
          console.log(`Skipping user ${profile.id} - no email found`)
          continue
        }

        console.log(`Sending verification email to: ${authUser.email}`)

        // Call the send-auth-emails function
        const { error: emailError } = await supabase.functions.invoke('send-auth-emails', {
          body: {
            email: authUser.email,
            token: 'BULK_VERIFICATION',
            token_hash: 'BULK_VERIFICATION',
            redirect_to: `${Deno.env.get('SUPABASE_URL')}/auth/callback`,
            email_action_type: 'verification_reminder'
          }
        })

        if (emailError) {
          console.error(`Failed to send email to ${authUser.email}:`, emailError)
          emailsErrors.push({
            email: authUser.email,
            error: emailError.message
          })
        } else {
          console.log(`Successfully sent email to ${authUser.email}`)
          emailsSent.push(authUser.email)
        }

        // Add small delay to avoid overwhelming the email service
        await new Promise(resolve => setTimeout(resolve, 100))

      } catch (error) {
        console.error(`Error processing user ${profile.id}:`, error)
        emailsErrors.push({
          user_id: profile.id,
          error: error.message
        })
      }
    }

    console.log(`Bulk email send completed. Sent: ${emailsSent.length}, Errors: ${emailsErrors.length}`)

    return new Response(
      JSON.stringify({
        success: true,
        message: `Bulk verification emails sent`,
        emails_sent: emailsSent.length,
        emails_with_errors: emailsErrors.length,
        sent_to: emailsSent,
        errors: emailsErrors
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    )

  } catch (error) {
    console.error('Error in bulk-send-verification-emails function:', error)
    return new Response(
      JSON.stringify({
        error: {
          message: error.message,
          details: error.toString()
        },
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    )
  }
})