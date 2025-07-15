
import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.3'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const supabase = createClient(supabaseUrl, supabaseKey)

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req: Request) => {
  const correlationId = crypto.randomUUID()
  console.log(`[${correlationId}] DLQ processor request: ${req.method}`)

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const startTime = Date.now()
    let processedCount = 0
    let failedCount = 0

    // Get items ready for retry
    const { data: dlqItems, error: fetchError } = await supabase
      .from('dead_letter_queue')
      .select('*')
      .lt('retry_count', supabase.raw('max_retries'))
      .lte('next_retry_at', new Date().toISOString())
      .order('created_at', { ascending: true })
      .limit(50) // Process in batches

    if (fetchError) {
      throw new Error(`Failed to fetch DLQ items: ${fetchError.message}`)
    }

    console.log(`[${correlationId}] Found ${dlqItems?.length || 0} items to process`)

    if (!dlqItems || dlqItems.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'No items to process',
          processed: 0,
          failed: 0,
          processing_time_ms: Date.now() - startTime
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        }
      )
    }

    // Process each item
    for (const item of dlqItems) {
      try {
        console.log(`[${correlationId}] Processing DLQ item ${item.id}`)
        
        if (item.operation_type === 'email_send') {
          // Retry email sending
          const { error: emailError } = await supabase.functions.invoke('send-auth-emails', {
            body: item.payload
          })

          if (emailError) {
            throw new Error(`Email retry failed: ${emailError.message}`)
          }

          // Remove from DLQ on success
          await supabase
            .from('dead_letter_queue')
            .delete()
            .eq('id', item.id)

          processedCount++
          console.log(`[${correlationId}] Successfully processed item ${item.id}`)
        } else {
          // Unknown operation type, mark as failed
          await supabase
            .from('dead_letter_queue')
            .update({
              retry_count: item.max_retries,
              error_message: `Unknown operation type: ${item.operation_type}`,
              updated_at: new Date().toISOString()
            })
            .eq('id', item.id)

          failedCount++
        }
      } catch (error) {
        console.error(`[${correlationId}] Failed to process item ${item.id}:`, error)
        
        const newRetryCount = item.retry_count + 1
        const nextRetryAt = new Date(Date.now() + Math.pow(2, newRetryCount) * 60 * 1000) // Exponential backoff

        if (newRetryCount >= item.max_retries) {
          // Mark as permanently failed
          await supabase
            .from('dead_letter_queue')
            .update({
              retry_count: newRetryCount,
              error_message: error.message,
              updated_at: new Date().toISOString()
            })
            .eq('id', item.id)
        } else {
          // Schedule for retry
          await supabase
            .from('dead_letter_queue')
            .update({
              retry_count: newRetryCount,
              next_retry_at: nextRetryAt.toISOString(),
              error_message: error.message,
              updated_at: new Date().toISOString()
            })
            .eq('id', item.id)
        }

        failedCount++
      }
    }

    const processingTime = Date.now() - startTime

    // Log processing results
    await supabase
      .from('cron_job_logs')
      .insert({
        job_name: 'dlq_processor',
        status: 'success',
        details: {
          correlation_id: correlationId,
          processed_count: processedCount,
          failed_count: failedCount,
          processing_time_ms: processingTime,
          items_found: dlqItems.length
        }
      })

    // Log metrics
    await supabase.rpc('log_service_metric', {
      service_name_param: 'dlq_processor',
      metric_type_param: 'items_processed',
      metric_value_param: processedCount,
      metadata_param: {
        correlation_id: correlationId,
        failed_count: failedCount,
        processing_time_ms: processingTime
      }
    })

    return new Response(
      JSON.stringify({
        success: true,
        processed: processedCount,
        failed: failedCount,
        processing_time_ms: processingTime,
        correlation_id: correlationId
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      }
    )

  } catch (error) {
    console.error(`[${correlationId}] DLQ processor error:`, error)
    
    await supabase
      .from('cron_job_logs')
      .insert({
        job_name: 'dlq_processor',
        status: 'error',
        error_message: error.message,
        details: {
          correlation_id: correlationId,
          error: error.toString()
        }
      })

    return new Response(
      JSON.stringify({
        error: 'DLQ processing failed',
        correlation_id: correlationId
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      }
    )
  }
})
