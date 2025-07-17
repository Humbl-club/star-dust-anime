
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'
import { Resend } from 'https://esm.sh/resend@4.0.0'

// Initialize email provider
const resend = new Resend(Deno.env.get('RESEND_API_KEY'))

// Initialize Supabase client
const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Validate UUID format
function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }
  
  const correlationId = crypto.randomUUID()
  console.log(`[${correlationId}] Auth email function triggered`)
  
  try {
    // Parse request body
    const body = await req.text()
    console.log(`[${correlationId}] Raw request body:`, body)
    
    let payload: any
    try {
      payload = JSON.parse(body)
    } catch (parseError) {
      console.error(`[${correlationId}] JSON parse error:`, parseError)
      throw new Error('Invalid JSON in request body')
    }
    
    console.log(`[${correlationId}] Parsed payload:`, JSON.stringify(payload, null, 2))
    
    // Extract email data from different payload formats
    let emailData: any = {}
    
    if (payload.record || payload.old_record) {
      // Webhook format from database trigger
      const record = payload.record || payload.old_record
      emailData = {
        email: record.email,
        user_id: record.id,
        email_action_type: 'signup'
      }
    } else {
      // Direct API call format
      emailData = {
        email: payload.email,
        user_id: payload.user_id,
        email_action_type: payload.email_action_type || 'signup'
      }
    }
    
    console.log(`[${correlationId}] Extracted emailData:`, JSON.stringify(emailData, null, 2))
    
    // Validate required fields
    if (!emailData.email || !emailData.user_id) {
      throw new Error(`Missing required fields: email=${emailData.email}, user_id=${emailData.user_id}`)
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(emailData.email)) {
      throw new Error('Invalid email format')
    }
    
    // Validate user_id format (must be a valid UUID)
    if (!isValidUUID(emailData.user_id)) {
      throw new Error(`Invalid user_id format: ${emailData.user_id}. Must be a valid UUID.`)
    }
    
    console.log(`[${correlationId}] Sending email to:`, emailData.email)
    
    // Check if RESEND_API_KEY is set
    if (!Deno.env.get('RESEND_API_KEY')) {
      throw new Error('RESEND_API_KEY is not configured')
    }
    
    // Check if user exists in profiles table first
    const { data: profileExists, error: profileCheckError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', emailData.user_id)
      .single()
    
    if (profileCheckError && profileCheckError.code !== 'PGRST116') {
      console.error(`[${correlationId}] Error checking profile:`, profileCheckError)
      throw new Error(`Failed to verify user profile: ${profileCheckError.message}`)
    }
    
    if (!profileExists) {
      console.log(`[${correlationId}] User profile not found, creating one...`)
      
      // Create a basic profile for the user
      const { error: createProfileError } = await supabase
        .from('profiles')
        .insert({
          id: emailData.user_id,
          full_name: emailData.email,
          verification_status: 'pending',
          verification_required_until: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
        })
      
      if (createProfileError) {
        console.error(`[${correlationId}] Error creating profile:`, createProfileError)
        throw new Error(`Failed to create user profile: ${createProfileError.message}`)
      }
      
      console.log(`[${correlationId}] Profile created successfully`)
    }
    
    // Generate a verification token
    const verificationToken = crypto.randomUUID()
    
    // Store the verification token in the database
    const { error: storeError } = await supabase
      .from('email_verification_status')
      .upsert({
        user_id: emailData.user_id,
        email: emailData.email,
        verification_token: verificationToken,
        verification_status: 'pending',
        verification_expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        verification_sent_at: new Date().toISOString(),
        verification_attempts: 1
      }, {
        onConflict: 'user_id,email'
      })
    
    if (storeError) {
      console.error(`[${correlationId}] Error storing verification token:`, storeError)
      throw new Error(`Failed to store verification token: ${storeError.message}`)
    }
    
    console.log(`[${correlationId}] Verification token stored successfully`)
    
    // Create confirmation URL with our custom verification flow
    const baseUrl = 'https://7fc28aed-a663-4753-8877-1ca39b8ccf8c.lovableproject.com'
    const confirmationUrl = `${baseUrl}/email-confirmation?token=${verificationToken}&type=signup&email=${encodeURIComponent(emailData.email)}&user_id=${emailData.user_id}`
    
    console.log(`[${correlationId}] Generated confirmation URL:`, confirmationUrl)
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Welcome to Anithing - Confirm Your Email</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .logo { color: #8b5cf6; font-size: 24px; font-weight: bold; }
            .content { background: #f9fafb; padding: 30px; border-radius: 8px; }
            .button { display: inline-block; background: #8b5cf6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">🎌 Anithing</div>
            </div>
            <div class="content">
              <h2>Welcome to Anithing!</h2>
              <p>Thank you for signing up! We're excited to have you join our anime and manga tracking community.</p>
              <p>To get started, please confirm your email address by clicking the button below:</p>
              <div style="text-align: center;">
                <a href="${confirmationUrl}" class="button">Confirm Your Email</a>
              </div>
              <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
              <p style="word-break: break-all; color: #8b5cf6;">${confirmationUrl}</p>
              <p>This verification link will expire in 7 days.</p>
              <p>Once confirmed, you'll be able to:</p>
              <ul>
                <li>Track your favorite anime and manga</li>
                <li>Get personalized recommendations</li>
                <li>Connect with other fans</li>
                <li>Discover new series to watch and read</li>
              </ul>
            </div>
            <div class="footer">
              <p>If you didn't create an account with us, you can safely ignore this email.</p>
              <p>Happy watching and reading!</p>
              <p>The Anithing Team</p>
            </div>
          </div>
        </body>
      </html>
    `
    
    console.log(`[${correlationId}] About to send email with Resend...`)
    
    // Send email using Resend
    const { data: emailResult, error: emailError } = await resend.emails.send({
      from: 'Anithing <noreply@anithing.space>',
      to: [emailData.email],
      subject: '🎌 Welcome to Anithing - Confirm Your Email',
      html: htmlContent,
    })
    
    if (emailError) {
      console.error(`[${correlationId}] Email send error:`, emailError)
      throw new Error(`Failed to send email: ${emailError.message}`)
    }
    
    console.log(`[${correlationId}] Email sent successfully:`, emailResult?.id)
    
    // Log success to database
    await supabase
      .from('cron_job_logs')
      .insert({
        job_name: 'send_auth_email',
        status: 'success',
        details: {
          correlation_id: correlationId,
          email_id: emailResult?.id,
          user_id: emailData.user_id,
          email: emailData.email,
          confirmation_url: confirmationUrl,
          verification_token: verificationToken
        }
      })
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Email sent successfully',
        correlation_id: correlationId,
        email_id: emailResult?.id
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
    console.error(`[${correlationId}] Error in send-auth-emails function:`, error)
    
    // Log error to database
    try {
      await supabase
        .from('cron_job_logs')
        .insert({
          job_name: 'send_auth_email',
          status: 'failed',
          error_message: error?.message || 'Unknown error',
          details: {
            correlation_id: correlationId,
            error: error?.toString()
          }
        })
    } catch (logError) {
      console.error(`[${correlationId}] Failed to log error:`, logError)
    }
    
    return new Response(
      JSON.stringify({
        error: {
          message: error?.message || 'Internal server error',
          correlation_id: correlationId
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
