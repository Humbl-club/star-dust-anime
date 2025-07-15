import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.3'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const webhookSecret = Deno.env.get('RESEND_WEBHOOK_SECRET')! // Add this secret

const supabase = createClient(supabaseUrl, supabaseKey)

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-webhook-signature',
}

interface ResendWebhookEvent {
  type: 'email.sent' | 'email.delivered' | 'email.delivery_delayed' | 'email.complained' | 'email.bounced'
  created_at: string
  data: {
    created_at: string
    email_id: string
    from: string
    to: string[]
    subject: string
  }
}

// Verify webhook signature
async function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): Promise<boolean> {
  try {
    const encoder = new TextEncoder()
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    )
    
    const signatureBytes = new Uint8Array(
      signature.match(/.{1,2}/g)?.map(byte => parseInt(byte, 16)) || []
    )
    
    const isValid = await crypto.subtle.verify(
      'HMAC',
      key,
      signatureBytes,
      encoder.encode(payload)
    )
    
    return isValid
  } catch (error) {
    console.error('Signature verification error:', error)
    return false
  }
}

serve(async (req: Request) => {
  const correlationId = crypto.randomUUID()
  console.log(`[${correlationId}] Webhook request received: ${req.method}`)

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { 
      status: 405, 
      headers: corsHeaders 
    })
  }

  try {
    const payload = await req.text()
    const signature = req.headers.get('x-webhook-signature')
    
    if (!signature) {
      console.error(`[${correlationId}] Missing webhook signature`)
      return new Response('Missing signature', { 
        status: 401, 
        headers: corsHeaders 
      })
    }

    // Verify webhook signature
    const isValidSignature = await verifyWebhookSignature(
      payload, 
      signature.replace('sha256=', ''), 
      webhookSecret
    )
    
    if (!isValidSignature) {
      console.error(`[${correlationId}] Invalid webhook signature`)
      return new Response('Invalid signature', { 
        status: 401, 
        headers: corsHeaders 
      })
    }

    const event: ResendWebhookEvent = JSON.parse(payload)
    console.log(`[${correlationId}] Processing webhook event:`, event.type)

    // Update email delivery tracking
    const deliveryStatus = mapEventToStatus(event.type)
    const updateData: any = {
      delivery_status: deliveryStatus,
      updated_at: new Date().toISOString(),
      external_id: event.data.email_id,
      metadata: {
        webhook_event: event.type,
        webhook_timestamp: event.created_at,
        from: event.data.from,
        to: event.data.to,
        subject: event.data.subject
      }
    }

    // Set specific timestamp fields based on event type
    switch (event.type) {
      case 'email.sent':
        updateData.sent_at = new Date(event.created_at).toISOString()
        break
      case 'email.delivered':
        updateData.delivered_at = new Date(event.created_at).toISOString()
        break
      case 'email.bounced':
      case 'email.complained':
        updateData.failed_at = new Date(event.created_at).toISOString()
        updateData.error_message = `Email ${event.type.split('.')[1]}`
        break
    }

    // Update tracking record
    const { error: updateError } = await supabase
      .from('email_delivery_tracking')
      .update(updateData)
      .eq('external_id', event.data.email_id)

    if (updateError) {
      console.error(`[${correlationId}] Failed to update tracking:`, updateError)
      // Don't fail the webhook, just log the error
    } else {
      console.log(`[${correlationId}] Successfully updated email tracking for ${event.data.email_id}`)
    }

    // Log webhook event for monitoring
    await supabase
      .from('cron_job_logs')
      .insert({
        job_name: 'email_webhook_received',
        status: 'success',
        details: {
          correlation_id: correlationId,
          event_type: event.type,
          email_id: event.data.email_id,
          delivery_status: deliveryStatus,
          webhook_timestamp: event.created_at
        }
      })

    // Update service metrics
    await supabase.rpc('log_service_metric', {
      service_name_param: 'email_webhook',
      metric_type_param: `webhook_${event.type.replace('.', '_')}`,
      metric_value_param: 1,
      metadata_param: {
        correlation_id: correlationId,
        email_id: event.data.email_id,
        processing_time_ms: Date.now()
      }
    })

    return new Response(
      JSON.stringify({ 
        success: true, 
        correlation_id: correlationId,
        processed_event: event.type 
      }),
      {
        status: 200,
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders 
        }
      }
    )

  } catch (error) {
    console.error(`[${correlationId}] Webhook processing error:`, error)
    
    // Log error
    await supabase
      .from('cron_job_logs')
      .insert({
        job_name: 'email_webhook_received',
        status: 'error',
        error_message: error.message,
        details: {
          correlation_id: correlationId,
          error: error.toString()
        }
      })

    return new Response(
      JSON.stringify({ 
        error: 'Webhook processing failed',
        correlation_id: correlationId 
      }),
      {
        status: 500,
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders 
        }
      }
    )
  }
})

function mapEventToStatus(eventType: string): string {
  switch (eventType) {
    case 'email.sent':
      return 'sent'
    case 'email.delivered':
      return 'delivered'
    case 'email.delivery_delayed':
      return 'delayed'
    case 'email.bounced':
      return 'bounced'
    case 'email.complained':
      return 'complained'
    default:
      return 'unknown'
  }
}