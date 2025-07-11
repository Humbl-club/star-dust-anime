import React from 'npm:react@18.3.1'
import { Webhook } from 'https://esm.sh/standardwebhooks@1.0.0'
import { Resend } from 'npm:resend@4.0.0'
import { renderAsync } from 'npm:@react-email/components@0.0.22'
import { ConfirmationEmail } from './_templates/confirmation-email.tsx'

const resend = new Resend(Deno.env.get('RESEND_API_KEY') as string)

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
    console.log('Auth email function triggered')
    
    // Handle both webhook and direct API calls
    let userData
    let emailData
    
    const body = await req.text()
    const contentType = req.headers.get('content-type')
    
    if (contentType?.includes('application/json')) {
      const payload = JSON.parse(body)
      
      // Check if this is a webhook from Supabase
      if (payload.record || payload.old_record) {
        // Webhook format
        userData = {
          email: payload.record?.email || payload.record?.raw_user_meta_data?.email
        }
        emailData = {
          token: payload.record?.email_confirm_token,
          token_hash: payload.record?.confirmation_token,
          redirect_to: `${Deno.env.get('SUPABASE_URL')}/auth/callback`,
          email_action_type: 'signup'
        }
      } else {
        // Direct API call format
        userData = { email: payload.email }
        emailData = {
          token: payload.token || 'XXXXXX',
          token_hash: payload.token_hash || payload.token,
          redirect_to: payload.redirect_to || `${req.headers.get('origin') || 'http://localhost:3000'}/`,
          email_action_type: payload.email_action_type || 'signup'
        }
      }
    } else {
      throw new Error('Invalid content type')
    }

    if (!userData?.email) {
      throw new Error('Email is required')
    }

    console.log('Sending confirmation email to:', userData.email)

    // Render the email template
    const html = await renderAsync(
      React.createElement(ConfirmationEmail, {
        supabase_url: Deno.env.get('SUPABASE_URL') ?? '',
        token: emailData.token,
        token_hash: emailData.token_hash,
        redirect_to: emailData.redirect_to,
        email_action_type: emailData.email_action_type,
        user_email: userData.email,
      })
    )

    // Send email via Resend
    const { data, error } = await resend.emails.send({
      from: 'AniTracker <onboarding@resend.dev>',
      to: [userData.email],
      subject: '🎌 Welcome to AniTracker - Confirm Your Email',
      html,
    })

    if (error) {
      console.error('Resend error:', error)
      throw error
    }

    console.log('Email sent successfully:', data)

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Email sent successfully',
        email_id: data?.id
      }),
      {
        status: 200,
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders 
        },
      }
    )
  } catch (error) {
    console.error('Error in send-auth-emails function:', error)
    return new Response(
      JSON.stringify({
        error: {
          message: error.message,
          details: error.toString()
        },
      }),
      {
        status: 500,
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders 
        },
      }
    )
  }
})