import React from 'npm:react@18.3.1'
import { createClient } from 'npm:@supabase/supabase-js@2.45.0'
import { Resend } from 'npm:resend@4.0.0'
import { renderAsync } from 'npm:@react-email/components@0.0.22'
import { ConfirmationEmail } from './_templates/confirmation-email.tsx'

// Initialize email providers with fallback support
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

// Circuit breaker state
interface CircuitBreakerState {
  failures: number
  lastFailureTime: number
  state: 'CLOSED' | 'OPEN' | 'HALF_OPEN'
}

const circuitBreaker: Map<string, CircuitBreakerState> = new Map()

// Circuit breaker configuration
const CIRCUIT_BREAKER_CONFIG = {
  failureThreshold: 5,
  resetTimeout: 60000, // 1 minute
  halfOpenRetryTimeout: 30000 // 30 seconds
}

// Check circuit breaker state
function checkCircuitBreaker(service: string): boolean {
  const state = circuitBreaker.get(service)
  if (!state) {
    circuitBreaker.set(service, { failures: 0, lastFailureTime: 0, state: 'CLOSED' })
    return true
  }

  const now = Date.now()
  
  switch (state.state) {
    case 'OPEN':
      if (now - state.lastFailureTime > CIRCUIT_BREAKER_CONFIG.resetTimeout) {
        state.state = 'HALF_OPEN'
        return true
      }
      return false
    
    case 'HALF_OPEN':
      return true
    
    case 'CLOSED':
      return true
    
    default:
      return true
  }
}

// Record circuit breaker failure
function recordCircuitBreakerFailure(service: string) {
  const state = circuitBreaker.get(service) || { failures: 0, lastFailureTime: 0, state: 'CLOSED' }
  state.failures++
  state.lastFailureTime = Date.now()
  
  if (state.failures >= CIRCUIT_BREAKER_CONFIG.failureThreshold) {
    state.state = 'OPEN'
  }
  
  circuitBreaker.set(service, state)
}

// Record circuit breaker success
function recordCircuitBreakerSuccess(service: string) {
  const state = circuitBreaker.get(service)
  if (state) {
    state.failures = 0
    state.state = 'CLOSED'
    circuitBreaker.set(service, state)
  }
}

// Enhanced input validation and sanitization
function validateAndSanitizeEmail(email: string): { isValid: boolean; sanitized: string; error?: string } {
  try {
    const sanitized = email.toLowerCase().trim()
    
    // Basic format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(sanitized)) {
      return { isValid: false, sanitized, error: 'Invalid email format' }
    }
    
    // Length validation
    if (sanitized.length > 254) {
      return { isValid: false, sanitized, error: 'Email too long' }
    }
    
    // Additional security checks
    if (sanitized.includes('..') || sanitized.includes('--')) {
      return { isValid: false, sanitized, error: 'Invalid email format' }
    }
    
    return { isValid: true, sanitized }
  } catch (error) {
    return { isValid: false, sanitized: email, error: 'Email validation failed' }
  }
}

// Template caching with security
async function getCachedTemplate(
  templateName: string,
  templateData: any,
  correlationId: string
): Promise<string> {
  const cacheKey = `${templateName}:${JSON.stringify(templateData)}`
  const hashedKey = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(cacheKey))
  const hexKey = Array.from(new Uint8Array(hashedKey)).map(b => b.toString(16).padStart(2, '0')).join('')
  
  try {
    // Check cache first
    const { data: cached } = await supabase
      .from('email_template_cache')
      .select('rendered_html')
      .eq('cache_key', hexKey)
      .gt('expires_at', new Date().toISOString())
      .single()
    
    if (cached) {
      console.log(`[${correlationId}] Template cache hit for ${templateName}`)
      return cached.rendered_html
    }
  } catch (error) {
    console.log(`[${correlationId}] Template cache miss for ${templateName}`)
  }
  
  // Render template
  const rendered = await renderAsync(
    React.createElement(ConfirmationEmail, templateData)
  )
  
  // Cache the result
  try {
    await supabase
      .from('email_template_cache')
      .insert({
        template_name: templateName,
        template_version: '1.0',
        rendered_html: rendered,
        cache_key: hexKey,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      })
  } catch (error) {
    console.log(`[${correlationId}] Failed to cache template: ${error}`)
  }
  
  return rendered
}

// Enhanced rate limiting with database persistence
async function checkRateLimit(userId: string, correlationId: string): Promise<{ allowed: boolean; remainingTime?: number; details?: any }> {
  try {
    const { data, error } = await supabase.rpc('check_rate_limit', {
      user_id_param: userId,
      resource_type_param: 'email_verification',
      max_requests: 3,
      window_minutes: 60
    })
    
    if (error) {
      console.error(`[${correlationId}] Rate limit check failed:`, error)
      // Fallback to allow on database error
      return { allowed: true }
    }
    
    return {
      allowed: data.allowed,
      remainingTime: data.remaining_time_seconds * 1000,
      details: data
    }
  } catch (error) {
    console.error(`[${correlationId}] Rate limit check exception:`, error)
    return { allowed: true }
  }
}

// Enhanced background task for sending emails with production features
async function sendEmailBackground(emailData: any) {
  const correlationId = crypto.randomUUID()
  const startTime = Date.now()
  
  // Initialize tracking record
  let trackingId: string | null = null
  
  try {
    console.log(`[${correlationId}] Starting email send to:`, emailData.email)
    
    // Enhanced input validation
    const emailValidation = validateAndSanitizeEmail(emailData.email)
    if (!emailValidation.isValid) {
      throw new Error(`Invalid email: ${emailValidation.error}`)
    }
    
    // Check persistent rate limiting
    const rateCheck = await checkRateLimit(emailData.user_id, correlationId)
    if (!rateCheck.allowed) {
      console.log(`[${correlationId}] Rate limit exceeded for user:`, emailData.user_id)
      
      // Log rate limit exceeded
      await supabase.rpc('log_service_metric', {
        service_name_param: 'email_service',
        metric_type_param: 'rate_limit_exceeded',
        metric_value_param: 1,
        metadata_param: {
          user_id: emailData.user_id,
          correlation_id: correlationId,
          remaining_time: rateCheck.remainingTime
        }
      })
      
      return
    }
    
    // Check circuit breaker for email service
    if (!checkCircuitBreaker('resend')) {
      console.log(`[${correlationId}] Circuit breaker OPEN for resend service`)
      
      // Add to dead letter queue for retry later
      await supabase.rpc('add_to_dead_letter_queue', {
        operation_type_param: 'email_send',
        payload_param: emailData,
        error_message_param: 'Circuit breaker open for email service'
      })
      
      return
    }
    
    // Create delivery tracking record
    const { data: trackingData, error: trackingError } = await supabase
      .from('email_delivery_tracking')
      .insert({
        user_id: emailData.user_id,
        email: emailValidation.sanitized,
        correlation_id: correlationId,
        provider: 'resend',
        email_type: 'verification',
        delivery_status: 'queued',
        metadata: {
          original_request: emailData,
          circuit_breaker_state: circuitBreaker.get('resend')?.state || 'CLOSED'
        }
      })
      .select('id')
      .single()
    
    if (trackingError) {
      console.error(`[${correlationId}] Failed to create tracking record:`, trackingError)
    } else {
      trackingId = trackingData.id
    }
    
    // Prepare template data
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const token = emailData.token || emailData.token_hash
    const redirectTo = emailData.redirect_to || 'https://7fc28aed-a663-4753-8877-1ca39b8ccf8c.lovableproject.com/'
    
    const templateData = {
      supabase_url: supabaseUrl,
      token: token,
      token_hash: token,
      redirect_to: redirectTo,
      email_action_type: 'signup',
      user_email: emailValidation.sanitized,
    }
    
    // Get cached template or render new one
    const html = await getCachedTemplate('confirmation-email', templateData, correlationId)
    
    // Update tracking status
    if (trackingId) {
      await supabase
        .from('email_delivery_tracking')
        .update({ delivery_status: 'processing' })
        .eq('id', trackingId)
    }
    
    // Send email with enhanced retry logic
    let attempts = 0
    const maxAttempts = 3
    let lastError: any = null
    let emailId: string | null = null
    
    while (attempts < maxAttempts) {
      try {
        attempts++
        console.log(`[${correlationId}] Email send attempt ${attempts}/${maxAttempts}`)
        
        const sendStartTime = Date.now()
        // Custom domain email configuration
        const customDomain = 'anithing.space' // Your custom domain
        const supportEmail = 'support@anithing.space' // Configure email forwarding to your Gmail
        
        const { data, error } = await resend.emails.send({
          from: `AniTracker <noreply@${customDomain}>`,
          to: [emailValidation.sanitized],
          reply_to: supportEmail, // Replies will go to your Gmail via forwarding
          subject: '🎌 Welcome to AniTracker - Confirm Your Email',
          html,
        })
        const sendTime = Date.now() - sendStartTime
        
        if (error) {
          throw error
        }
        
        emailId = data?.id
        console.log(`[${correlationId}] Email sent successfully:`, emailId)
        
        // Record circuit breaker success
        recordCircuitBreakerSuccess('resend')
        
        // Update tracking with success
        if (trackingId) {
          await supabase
            .from('email_delivery_tracking')
            .update({
              delivery_status: 'sent',
              external_id: emailId,
              sent_at: new Date().toISOString(),
              retry_count: attempts,
              metadata: {
                ...templateData,
                send_time_ms: sendTime,
                attempts: attempts
              }
            })
            .eq('id', trackingId)
        }
        
        // Update verification status in database
        await supabase
          .from('email_verification_status')
          .upsert({
            user_id: emailData.user_id,
            email: emailValidation.sanitized,
            verification_status: 'pending',
            verification_token: emailData.token,
            verification_sent_at: new Date().toISOString(),
            verification_expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            updated_at: new Date().toISOString()
          })
        
        // Log performance metrics
        await supabase.rpc('log_service_metric', {
          service_name_param: 'email_service',
          metric_type_param: 'send_success',
          metric_value_param: sendTime,
          metadata_param: {
            correlation_id: correlationId,
            user_id: emailData.user_id,
            email_id: emailId,
            attempts: attempts,
            provider: 'resend'
          }
        })
        
        // Log success
        await supabase
          .from('cron_job_logs')
          .insert({
            job_name: 'send_auth_email',
            status: 'success',
            details: {
              correlation_id: correlationId,
              email_id: emailId,
              user_id: emailData.user_id,
              email: emailValidation.sanitized,
              attempts: attempts,
              processing_time_ms: Date.now() - startTime,
              tracking_id: trackingId
            }
          })
        
        return // Success, exit retry loop
        
      } catch (error) {
        lastError = error
        console.error(`[${correlationId}] Email send attempt ${attempts} failed:`, error)
        
        // Record circuit breaker failure
        recordCircuitBreakerFailure('resend')
        
        // Exponential backoff: wait 1s, 2s, 4s between retries
        if (attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempts - 1) * 1000))
        }
      }
    }
    
    // All attempts failed
    console.error(`[${correlationId}] All email send attempts failed:`, lastError)
    
    // Update tracking with failure
    if (trackingId) {
      await supabase
        .from('email_delivery_tracking')
        .update({
          delivery_status: 'failed',
          failed_at: new Date().toISOString(),
          error_message: lastError?.message || 'Unknown error',
          retry_count: attempts,
          metadata: {
            ...templateData,
            error: lastError?.toString(),
            attempts: attempts
          }
        })
        .eq('id', trackingId)
    }
    
    // Add to dead letter queue for future retry
    await supabase.rpc('add_to_dead_letter_queue', {
      operation_type_param: 'email_send',
      payload_param: emailData,
      error_message_param: lastError?.message || 'Email send failed after all retries'
    })
    
    // Log performance metrics for failure
    await supabase.rpc('log_service_metric', {
      service_name_param: 'email_service',
      metric_type_param: 'send_failure',
      metric_value_param: Date.now() - startTime,
      metadata_param: {
        correlation_id: correlationId,
        user_id: emailData.user_id,
        error: lastError?.message,
        attempts: attempts
      }
    })
    
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
          email: emailValidation.sanitized,
          attempts: attempts,
          error: lastError?.toString(),
          processing_time_ms: Date.now() - startTime,
          tracking_id: trackingId
        }
      })
    
  } catch (error) {
    console.error(`[${correlationId}] Background email task failed:`, error)
    
    // Update tracking with critical error
    if (trackingId) {
      await supabase
        .from('email_delivery_tracking')
        .update({
          delivery_status: 'failed',
          failed_at: new Date().toISOString(),
          error_message: error?.message || 'Critical error'
        })
        .eq('id', trackingId)
    }
    
    // Log critical error metric
    await supabase.rpc('log_service_metric', {
      service_name_param: 'email_service',
      metric_type_param: 'critical_error',
      metric_value_param: Date.now() - startTime,
      metadata_param: {
        correlation_id: correlationId,
        error: error?.message
      }
    })
    
    // Log critical error
    await supabase
      .from('cron_job_logs')
      .insert({
        job_name: 'send_auth_email',
        status: 'critical_error',
        error_message: error?.message || 'Unknown critical error',
        details: {
          correlation_id: correlationId,
          error: error?.toString(),
          processing_time_ms: Date.now() - startTime,
          tracking_id: trackingId
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
    
    console.log(`[${correlationId}] Raw payload:`, JSON.stringify(payload, null, 2))
    
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
      // Direct API call format (from database trigger http_post)
      emailData = {
        email: payload.email,
        user_id: payload.user_id,
        token: payload.token || crypto.randomUUID(),
        token_hash: payload.token_hash || payload.token || crypto.randomUUID(),
        redirect_to: payload.redirect_to || 'https://7fc28aed-a663-4753-8877-1ca39b8ccf8c.lovableproject.com/',
        email_action_type: payload.email_action_type || 'signup'
      }
    }
    
    console.log(`[${correlationId}] Extracted emailData:`, JSON.stringify(emailData, null, 2))
    
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
  // Clear circuit breaker cache on shutdown
  circuitBreaker.clear()
})