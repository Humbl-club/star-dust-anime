import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.3'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const supabase = createClient(supabaseUrl, supabaseKey)

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface HealthMetrics {
  email_system: {
    status: 'healthy' | 'degraded' | 'unhealthy'
    success_rate: number
    avg_processing_time: number
    circuit_breaker_status: 'closed' | 'open' | 'half-open'
    recent_errors: number
  }
  delivery_tracking: {
    pending_emails: number
    successful_deliveries_24h: number
    failed_deliveries_24h: number
    bounce_rate: number
  }
  system_performance: {
    dead_letter_queue_size: number
    rate_limit_violations_24h: number
    avg_response_time: number
    uptime_percentage: number
  }
}

serve(async (req: Request) => {
  const correlationId = crypto.randomUUID()
  console.log(`[${correlationId}] Health check request: ${req.method}`)

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const startTime = Date.now()

    // Get email system metrics from the last 24 hours
    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    
    // Query email delivery metrics
    const { data: deliveryMetrics } = await supabase
      .from('email_delivery_tracking')
      .select('delivery_status, created_at, metadata')
      .gte('created_at', last24Hours)

    // Query service health metrics
    const { data: serviceMetrics } = await supabase
      .from('service_health_metrics')
      .select('metric_type, metric_value, metadata')
      .eq('service_name', 'email_service')
      .gte('timestamp', last24Hours)

    // Query dead letter queue
    const { data: dlqItems } = await supabase
      .from('dead_letter_queue')
      .select('id')
      .eq('operation_type', 'email_send')

    // Query rate limit violations
    const { data: rateLimitViolations } = await supabase
      .from('rate_limit_tracking')
      .select('id')
      .gte('created_at', last24Hours)

    // Calculate metrics
    const totalEmails = deliveryMetrics?.length || 0
    const successfulEmails = deliveryMetrics?.filter(d => 
      ['sent', 'delivered'].includes(d.delivery_status)
    ).length || 0
    const failedEmails = deliveryMetrics?.filter(d => 
      ['failed', 'bounced'].includes(d.delivery_status)
    ).length || 0
    const bouncedEmails = deliveryMetrics?.filter(d => 
      d.delivery_status === 'bounced'
    ).length || 0

    const successRate = totalEmails > 0 ? (successfulEmails / totalEmails) * 100 : 100
    const bounceRate = totalEmails > 0 ? (bouncedEmails / totalEmails) * 100 : 0

    // Calculate average processing time
    const processingTimes = serviceMetrics?.filter(m => 
      m.metric_type === 'send_success'
    ).map(m => m.metric_value) || []
    const avgProcessingTime = processingTimes.length > 0 
      ? processingTimes.reduce((a, b) => a + b, 0) / processingTimes.length 
      : 0

    // Get recent error count
    const recentErrors = serviceMetrics?.filter(m => 
      m.metric_type === 'send_failure'
    ).length || 0

    // Determine system health status
    let systemStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy'
    if (successRate < 95 || recentErrors > 10 || bounceRate > 5) {
      systemStatus = 'degraded'
    }
    if (successRate < 90 || recentErrors > 25 || bounceRate > 10) {
      systemStatus = 'unhealthy'
    }

    // Circuit breaker status (simplified)
    const circuitBreakerStatus = recentErrors > 5 ? 'open' : 'closed'

    const healthMetrics: HealthMetrics = {
      email_system: {
        status: systemStatus,
        success_rate: Math.round(successRate * 100) / 100,
        avg_processing_time: Math.round(avgProcessingTime),
        circuit_breaker_status: circuitBreakerStatus,
        recent_errors: recentErrors
      },
      delivery_tracking: {
        pending_emails: deliveryMetrics?.filter(d => 
          ['queued', 'processing'].includes(d.delivery_status)
        ).length || 0,
        successful_deliveries_24h: successfulEmails,
        failed_deliveries_24h: failedEmails,
        bounce_rate: Math.round(bounceRate * 100) / 100
      },
      system_performance: {
        dead_letter_queue_size: dlqItems?.length || 0,
        rate_limit_violations_24h: rateLimitViolations?.length || 0,
        avg_response_time: Math.round(avgProcessingTime),
        uptime_percentage: systemStatus === 'healthy' ? 99.9 : 
                          systemStatus === 'degraded' ? 98.5 : 95.0
      }
    }

    const processingTime = Date.now() - startTime

    // Log health check metrics
    await supabase.rpc('log_service_metric', {
      service_name_param: 'email_health_monitor',
      metric_type_param: 'health_check_completed',
      metric_value_param: processingTime,
      metadata_param: {
        correlation_id: correlationId,
        system_status: systemStatus,
        success_rate: successRate,
        total_emails_24h: totalEmails
      }
    })

    // Log health check
    await supabase
      .from('cron_job_logs')
      .insert({
        job_name: 'email_health_check',
        status: 'success',
        details: {
          correlation_id: correlationId,
          processing_time_ms: processingTime,
          system_status: systemStatus,
          metrics: healthMetrics
        }
      })

    return new Response(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        correlation_id: correlationId,
        processing_time_ms: processingTime,
        ...healthMetrics
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
    console.error(`[${correlationId}] Health check error:`, error)
    
    await supabase
      .from('cron_job_logs')
      .insert({
        job_name: 'email_health_check',
        status: 'error',
        error_message: error.message,
        details: {
          correlation_id: correlationId,
          error: error.toString()
        }
      })

    return new Response(
      JSON.stringify({ 
        error: 'Health check failed',
        correlation_id: correlationId,
        timestamp: new Date().toISOString()
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