import { createClient } from 'npm:@supabase/supabase-js@2.45.0'

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

interface DLQItem {
  id: string
  operation_type: string
  payload: any
  error_message: string
  retry_count: number
  max_retries: number
  next_retry_at: string
}

async function processEmailSendRetry(item: DLQItem): Promise<boolean> {
  try {
    console.log(`Processing DLQ email retry for item ${item.id}`)
    
    // Call the send-auth-emails function
    const response = await fetch(
      `${Deno.env.get('SUPABASE_URL')}/functions/v1/send-auth-emails`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
        },
        body: JSON.stringify(item.payload)
      }
    )
    
    if (response.ok) {
      console.log(`DLQ email retry successful for item ${item.id}`)
      return true
    } else {
      console.error(`DLQ email retry failed for item ${item.id}:`, await response.text())
      return false
    }
  } catch (error) {
    console.error(`DLQ email retry exception for item ${item.id}:`, error)
    return false
  }
}

async function processDLQItem(item: DLQItem): Promise<boolean> {
  switch (item.operation_type) {
    case 'email_send':
      return await processEmailSendRetry(item)
    default:
      console.warn(`Unknown DLQ operation type: ${item.operation_type}`)
      return false
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  const startTime = Date.now()
  const correlationId = crypto.randomUUID()
  
  try {
    console.log(`[${correlationId}] Processing DLQ items`)
    
    // Get items ready for retry
    const { data: dlqItems, error: fetchError } = await supabase
      .from('dead_letter_queue')
      .select('*')
      .lte('next_retry_at', new Date().toISOString())
      .lt('retry_count', supabase.from('dead_letter_queue').select('max_retries'))
      .order('created_at', { ascending: true })
      .limit(50) // Process up to 50 items at a time
    
    if (fetchError) {
      throw new Error(`Failed to fetch DLQ items: ${fetchError.message}`)
    }
    
    if (!dlqItems || dlqItems.length === 0) {
      console.log(`[${correlationId}] No DLQ items to process`)
      return new Response(
        JSON.stringify({
          processed: 0,
          successful: 0,
          failed: 0,
          processing_time_ms: Date.now() - startTime
        }),
        {
          status: 200,
          headers: { 
            'Content-Type': 'application/json',
            ...corsHeaders 
          }
        }
      )
    }
    
    console.log(`[${correlationId}] Found ${dlqItems.length} DLQ items to process`)
    
    let successCount = 0
    let failureCount = 0
    
    // Process each item
    for (const item of dlqItems) {
      try {
        const success = await processDLQItem(item)
        
        if (success) {
          // Remove from DLQ on success
          await supabase
            .from('dead_letter_queue')
            .delete()
            .eq('id', item.id)
          
          successCount++
          
          // Log success metric
          await supabase.rpc('log_service_metric', {
            service_name_param: 'dlq_processor',
            metric_type_param: 'retry_success',
            metric_value_param: 1,
            metadata_param: {
              item_id: item.id,
              operation_type: item.operation_type,
              retry_count: item.retry_count,
              correlation_id: correlationId
            }
          })
        } else {
          // Update retry count and next retry time
          const nextRetryAt = new Date(Date.now() + Math.pow(2, item.retry_count) * 5 * 60 * 1000) // Exponential backoff: 5min, 10min, 20min, etc.
          
          if (item.retry_count + 1 >= item.max_retries) {
            // Max retries reached, mark as permanently failed
            await supabase
              .from('dead_letter_queue')
              .update({
                retry_count: item.retry_count + 1,
                next_retry_at: null,
                updated_at: new Date().toISOString()
              })
              .eq('id', item.id)
            
            // Log permanent failure
            await supabase.rpc('log_service_metric', {
              service_name_param: 'dlq_processor',
              metric_type_param: 'permanent_failure',
              metric_value_param: 1,
              metadata_param: {
                item_id: item.id,
                operation_type: item.operation_type,
                retry_count: item.retry_count + 1,
                correlation_id: correlationId
              }
            })
          } else {
            // Schedule next retry
            await supabase
              .from('dead_letter_queue')
              .update({
                retry_count: item.retry_count + 1,
                next_retry_at: nextRetryAt.toISOString(),
                updated_at: new Date().toISOString()
              })
              .eq('id', item.id)
            
            // Log retry failure
            await supabase.rpc('log_service_metric', {
              service_name_param: 'dlq_processor',
              metric_type_param: 'retry_failure',
              metric_value_param: 1,
              metadata_param: {
                item_id: item.id,
                operation_type: item.operation_type,
                retry_count: item.retry_count + 1,
                next_retry_at: nextRetryAt.toISOString(),
                correlation_id: correlationId
              }
            })
          }
          
          failureCount++
        }
      } catch (error) {
        console.error(`[${correlationId}] Error processing DLQ item ${item.id}:`, error)
        failureCount++
      }
    }
    
    const processingTime = Date.now() - startTime
    console.log(`[${correlationId}] DLQ processing completed: ${successCount} successful, ${failureCount} failed, ${processingTime}ms`)
    
    // Log overall processing metrics
    await supabase.rpc('log_service_metric', {
      service_name_param: 'dlq_processor',
      metric_type_param: 'processing_time',
      metric_value_param: processingTime,
      metadata_param: {
        processed: dlqItems.length,
        successful: successCount,
        failed: failureCount,
        correlation_id: correlationId
      }
    })
    
    return new Response(
      JSON.stringify({
        processed: dlqItems.length,
        successful: successCount,
        failed: failureCount,
        processing_time_ms: processingTime,
        correlation_id: correlationId
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
    console.error(`[${correlationId}] DLQ processing failed:`, error)
    
    // Log error metric
    await supabase.rpc('log_service_metric', {
      service_name_param: 'dlq_processor',
      metric_type_param: 'processing_error',
      metric_value_param: 1,
      metadata_param: {
        error: error.message,
        correlation_id: correlationId
      }
    })
    
    return new Response(
      JSON.stringify({
        error: error.message,
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