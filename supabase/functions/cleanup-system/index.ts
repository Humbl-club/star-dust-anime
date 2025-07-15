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

interface CleanupResult {
  rateLimitRecords: number
  healthMetrics: number
  templateCache: number
  permanentFailures: number
  completedJobs: number
  processingTime: number
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  const startTime = Date.now()
  const correlationId = crypto.randomUUID()
  
  try {
    console.log(`[${correlationId}] Starting system cleanup`)
    
    const result: CleanupResult = {
      rateLimitRecords: 0,
      healthMetrics: 0,
      templateCache: 0,
      permanentFailures: 0,
      completedJobs: 0,
      processingTime: 0
    }
    
    // Clean up old rate limit records (older than 24 hours)
    const { count: rateLimitCount, error: rateLimitError } = await supabase
      .from('rate_limit_tracking')
      .delete({ count: 'exact' })
      .lt('window_end', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
    
    if (rateLimitError) {
      console.error(`[${correlationId}] Error cleaning rate limit records:`, rateLimitError)
    } else {
      result.rateLimitRecords = rateLimitCount || 0
      console.log(`[${correlationId}] Cleaned ${result.rateLimitRecords} rate limit records`)
    }
    
    // Clean up old health metrics (older than 7 days)
    const { count: healthCount, error: healthError } = await supabase
      .from('service_health_metrics')
      .delete({ count: 'exact' })
      .lt('timestamp', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
    
    if (healthError) {
      console.error(`[${correlationId}] Error cleaning health metrics:`, healthError)
    } else {
      result.healthMetrics = healthCount || 0
      console.log(`[${correlationId}] Cleaned ${result.healthMetrics} health metrics`)
    }
    
    // Clean up expired template cache
    const { count: cacheCount, error: cacheError } = await supabase
      .from('email_template_cache')
      .delete({ count: 'exact' })
      .lt('expires_at', new Date().toISOString())
    
    if (cacheError) {
      console.error(`[${correlationId}] Error cleaning template cache:`, cacheError)
    } else {
      result.templateCache = cacheCount || 0
      console.log(`[${correlationId}] Cleaned ${result.templateCache} cached templates`)
    }
    
    // Clean up permanent failures from DLQ (older than 30 days)
    const { count: dlqCount, error: dlqError } = await supabase
      .from('dead_letter_queue')
      .delete({ count: 'exact' })
      .is('next_retry_at', null)
      .lt('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
    
    if (dlqError) {
      console.error(`[${correlationId}] Error cleaning DLQ permanent failures:`, dlqError)
    } else {
      result.permanentFailures = dlqCount || 0
      console.log(`[${correlationId}] Cleaned ${result.permanentFailures} permanent failures`)
    }
    
    // Clean up old cron job logs (older than 30 days)
    const { count: jobCount, error: jobError } = await supabase
      .from('cron_job_logs')
      .delete({ count: 'exact' })
      .lt('executed_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
    
    if (jobError) {
      console.error(`[${correlationId}] Error cleaning cron job logs:`, jobError)
    } else {
      result.completedJobs = jobCount || 0
      console.log(`[${correlationId}] Cleaned ${result.completedJobs} cron job logs`)
    }
    
    result.processingTime = Date.now() - startTime
    
    // Log cleanup metrics
    await supabase.rpc('log_service_metric', {
      service_name_param: 'cleanup_system',
      metric_type_param: 'cleanup_completed',
      metric_value_param: result.processingTime,
      metadata_param: {
        ...result,
        correlation_id: correlationId
      }
    })
    
    console.log(`[${correlationId}] System cleanup completed in ${result.processingTime}ms`)
    
    return new Response(
      JSON.stringify({
        success: true,
        ...result,
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
    console.error(`[${correlationId}] System cleanup failed:`, error)
    
    // Log error metric
    await supabase.rpc('log_service_metric', {
      service_name_param: 'cleanup_system',
      metric_type_param: 'cleanup_error',
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