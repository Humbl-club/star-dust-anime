import React from 'npm:react@18.3.1'
import { createClient } from 'npm:@supabase/supabase-js@2.45.0'
import { Resend } from 'npm:resend@4.0.0'
import { renderAsync } from 'npm:@react-email/components@0.0.22'
import { ConfirmationEmail } from './_templates/confirmation-email.tsx'

const resend = new Resend(Deno.env.get('RESEND_API_KEY') as string)

// Initialize Supabase client for internal operations
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

// Rate limiting cache (simple in-memory for this function)
const rateLimitCache = new Map<string, { count: number; resetTime: number }>()

// Check rate limit (max 3 emails per hour per user)
function checkRateLimit(userId: string): { allowed: boolean; remainingTime?: number } {
  const now = Date.now()
  const hourInMs = 60 * 60 * 1000
  const key = `rate_limit:${userId}`
  
  const existing = rateLimitCache.get(key)
  if (!existing) {
    rateLimitCache.set(key, { count: 1, resetTime: now + hourInMs })
    return { allowed: true }
  }
  
  if (now > existing.resetTime) {
    rateLimitCache.set(key, { count: 1, resetTime: now + hourInMs })
    return { allowed: true }
  }
  
  if (existing.count >= 3) {
    return { allowed: false, remainingTime: existing.resetTime - now }
  }
  
  existing.count++
  return { allowed: true }
}

// Background task for sending emails
async function sendEmailBackground(emailData: any) {
  const correlationId = crypto.randomUUID()
  
  try {
    console.log(`[${correlationId}] Starting email send to:`, emailData.email)
    
    // Check rate limiting first
    const rateCheck = checkRateLimit(emailData.user_id)
    if (!rateCheck.allowed) {
      console.log(`[${correlationId}] Rate limit exceeded for user:`, emailData.user_id)
      return
    }
    
    // Render email template
    const html = await renderAsync(
      React.createElement(ConfirmationEmail, {
        supabase_url: Deno.env.get('SUPABASE_URL') ?? '',
        token: emailData.token,
        token_hash: emailData.token_hash,
        redirect_to: emailData.redirect_to,
        email_action_type: emailData.email_action_type,
        user_email: emailData.email,
      })
    )
    
    // Send email with retry logic
    let attempts = 0
    const maxAttempts = 3
    let lastError: any = null
    
    while (attempts < maxAttempts) {
      try {
        attempts++
        console.log(`[${correlationId}] Email send attempt ${attempts}/${maxAttempts}`)
        
        const { data, error } = await resend.emails.send({
          from: 'AniTracker <noreply@anithing.space>',
          to: [emailData.email],
          subject: '🎌 Welcome to AniTracker - Confirm Your Email',
          html,
        })
        
        if (error) {
          throw error
        }
        
        console.log(`[${correlationId}] Email sent successfully:`, data?.id)
        
        // Update verification status in database
        await supabase
          .from('email_verification_status')
          .upsert({
            user_id: emailData.user_id,
            email: emailData.email,
            verification_status: 'pending',
            verification_token: emailData.token,
            verification_sent_at: new Date().toISOString(),
            verification_expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            updated_at: new Date().toISOString()
          })
        
        // Log success
        await supabase
          .from('cron_job_logs')
          .insert({
            job_name: 'send_auth_email',
            status: 'success',
            details: {
              correlation_id: correlationId,
              email_id: data?.id,
              user_id: emailData.user_id,
              email: emailData.email,
              attempts: attempts
            }
          })
        
        return // Success, exit retry loop
        
      } catch (error) {
        lastError = error
        console.error(`[${correlationId}] Email send attempt ${attempts} failed:`, error)
        
        // Exponential backoff: wait 1s, 2s, 4s between retries
        if (attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempts - 1) * 1000))
        }
      }
    }
    
    // All attempts failed
    console.error(`[${correlationId}] All email send attempts failed:`, lastError)
    
    // Log failure
    await supabase
      .from('cron_job_logs')
      .insert({
        job_name: 'send_auth_email',
        status: 'failed',
        error_message: lastError?.message || 'Unknown error',
        details: {
          correlation_id: correlationId,
          user_id: emailData.user_id,
          email: emailData.email,
          attempts: attempts,
          error: lastError?.toString()
        }
      })
    
  } catch (error) {
    console.error(`[${correlationId}] Background email task failed:`, error)
    
    // Log critical error
    await supabase
      .from('cron_job_logs')
      .insert({
        job_name: 'send_auth_email',
        status: 'critical_error',
        error_message: error?.message || 'Unknown critical error',
        details: {
          correlation_id: correlationId,
          error: error?.toString()
        }
      })
  }
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }
  
  const correlationId = crypto.randomUUID()
  const startTime = Date.now()
  
  try {
    console.log(`[${correlationId}] Auth email function triggered`)
    
    // Parse request body
    const body = await req.text()
    const contentType = req.headers.get('content-type')
    
    if (!contentType?.includes('application/json')) {
      throw new Error('Invalid content type - application/json required')
    }
    
    const payload = JSON.parse(body)
    
    // Extract email data from different payload formats
    let emailData: any = {}
    
    if (payload.record || payload.old_record) {
      // Webhook format from database trigger
      const record = payload.record || payload.old_record
      emailData = {
        email: record.email,
        user_id: record.id,
        token: record.confirmation_token || crypto.randomUUID(),
        token_hash: record.confirmation_token || crypto.randomUUID(),
        redirect_to: `${Deno.env.get('SUPABASE_URL')}/auth/callback`,
        email_action_type: 'signup'
      }
    } else {
      // Direct API call format
      emailData = {
        email: payload.email,
        user_id: payload.user_id,
        token: payload.token || crypto.randomUUID(),
        token_hash: payload.token_hash || payload.token || crypto.randomUUID(),
        redirect_to: payload.redirect_to || 'https://7fc28aed-a663-4753-8877-1ca39b8ccf8c.lovableproject.com/',
        email_action_type: payload.email_action_type || 'signup'
      }
    }
    
    // Validate required fields
    if (!emailData.email || !emailData.user_id) {
      throw new Error('Email and user_id are required')
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(emailData.email)) {
      throw new Error('Invalid email format')
    }
    
    console.log(`[${correlationId}] Processing email for user:`, emailData.user_id)
    
    // Start background email sending (non-blocking)
    EdgeRuntime.waitUntil(sendEmailBackground(emailData))
    
    // Return immediate response
    const responseTime = Date.now() - startTime
    console.log(`[${correlationId}] Request processed in ${responseTime}ms`)
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Email queued for sending',
        correlation_id: correlationId,
        processing_time_ms: responseTime
      }),
      {
        status: 202, // Accepted - processing in background
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders 
        },
      }
    )
    
  } catch (error) {
    const responseTime = Date.now() - startTime
    console.error(`[${correlationId}] Error in send-auth-emails function:`, error)
    
    // Log error to database
    try {
      await supabase
        .from('cron_job_logs')
        .insert({
          job_name: 'send_auth_email',
          status: 'request_error',
          error_message: error?.message || 'Unknown request error',
          details: {
            correlation_id: correlationId,
            processing_time_ms: responseTime,
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
          correlation_id: correlationId,
          processing_time_ms: responseTime
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

// Handle graceful shutdown
addEventListener('beforeunload', (event) => {
  console.log('Edge function shutting down:', event.detail?.reason)
  // Clear rate limiting cache on shutdown
  rateLimitCache.clear()
})