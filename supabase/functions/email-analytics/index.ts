
import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.3'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const supabase = createClient(supabaseUrl, supabaseKey)

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface AnalyticsParams {
  timeframe?: '1h' | '24h' | '7d' | '30d'
  metrics?: string[]
}

serve(async (req: Request) => {
  const correlationId = crypto.randomUUID()
  console.log(`[${correlationId}] Analytics request: ${req.method}`)

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const url = new URL(req.url)
    const timeframe = url.searchParams.get('timeframe') || '24h'
    const metricsParam = url.searchParams.get('metrics')
    const requestedMetrics = metricsParam ? metricsParam.split(',') : ['all']

    // Calculate time range
    const timeRanges = {
      '1h': new Date(Date.now() - 60 * 60 * 1000),
      '24h': new Date(Date.now() - 24 * 60 * 60 * 1000),
      '7d': new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      '30d': new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    }

    const startTime = timeRanges[timeframe as keyof typeof timeRanges] || timeRanges['24h']
    const startTimeISO = startTime.toISOString()

    const analytics: any = {
      timeframe,
      generated_at: new Date().toISOString(),
      correlation_id: correlationId
    }

    // Email delivery metrics
    if (requestedMetrics.includes('all') || requestedMetrics.includes('delivery')) {
      const { data: deliveryData } = await supabase
        .from('email_delivery_tracking')
        .select('delivery_status, created_at, sent_at, delivered_at, failed_at')
        .gte('created_at', startTimeISO)

      const totalEmails = deliveryData?.length || 0
      const sentEmails = deliveryData?.filter(d => d.delivery_status === 'sent').length || 0
      const deliveredEmails = deliveryData?.filter(d => d.delivery_status === 'delivered').length || 0
      const failedEmails = deliveryData?.filter(d => d.delivery_status === 'failed').length || 0
      const bouncedEmails = deliveryData?.filter(d => d.delivery_status === 'bounced').length || 0

      analytics.delivery_metrics = {
        total_emails: totalEmails,
        sent_emails: sentEmails,
        delivered_emails: deliveredEmails,
        failed_emails: failedEmails,
        bounced_emails: bouncedEmails,
        success_rate: totalEmails > 0 ? ((sentEmails + deliveredEmails) / totalEmails * 100).toFixed(2) : 0,
        bounce_rate: totalEmails > 0 ? (bouncedEmails / totalEmails * 100).toFixed(2) : 0,
        failure_rate: totalEmails > 0 ? (failedEmails / totalEmails * 100).toFixed(2) : 0
      }
    }

    // Performance metrics
    if (requestedMetrics.includes('all') || requestedMetrics.includes('performance')) {
      const { data: performanceData } = await supabase
        .from('service_health_metrics')
        .select('metric_type, metric_value, timestamp')
        .eq('service_name', 'email_service')
        .gte('timestamp', startTimeISO)

      const successMetrics = performanceData?.filter(m => m.metric_type === 'send_success') || []
      const failureMetrics = performanceData?.filter(m => m.metric_type === 'send_failure') || []

      const avgProcessingTime = successMetrics.length > 0 
        ? successMetrics.reduce((sum, m) => sum + m.metric_value, 0) / successMetrics.length 
        : 0

      analytics.performance_metrics = {
        avg_processing_time_ms: Math.round(avgProcessingTime),
        total_successes: successMetrics.length,
        total_failures: failureMetrics.length,
        reliability_score: successMetrics.length + failureMetrics.length > 0 
          ? ((successMetrics.length / (successMetrics.length + failureMetrics.length)) * 100).toFixed(2)
          : 100
      }
    }

    // DLQ metrics
    if (requestedMetrics.includes('all') || requestedMetrics.includes('dlq')) {
      const { data: dlqData } = await supabase
        .from('dead_letter_queue')
        .select('operation_type, retry_count, max_retries, created_at')
        .gte('created_at', startTimeISO)

      const totalDlqItems = dlqData?.length || 0
      const pendingRetries = dlqData?.filter(d => d.retry_count < d.max_retries).length || 0
      const permanentFailures = dlqData?.filter(d => d.retry_count >= d.max_retries).length || 0

      analytics.dlq_metrics = {
        total_items: totalDlqItems,
        pending_retries: pendingRetries,
        permanent_failures: permanentFailures,
        retry_success_rate: totalDlqItems > 0 ? ((totalDlqItems - permanentFailures) / totalDlqItems * 100).toFixed(2) : 100
      }
    }

    // Hourly trends (for 24h+ timeframes)
    if ((timeframe === '24h' || timeframe === '7d' || timeframe === '30d') && 
        (requestedMetrics.includes('all') || requestedMetrics.includes('trends'))) {
      
      const { data: hourlyData } = await supabase
        .from('email_delivery_tracking')
        .select('delivery_status, created_at')
        .gte('created_at', startTimeISO)

      // Group by hour
      const hourlyStats: Record<string, any> = {}
      
      hourlyData?.forEach(item => {
        const hour = new Date(item.created_at).toISOString().slice(0, 13) + ':00:00.000Z'
        if (!hourlyStats[hour]) {
          hourlyStats[hour] = { sent: 0, delivered: 0, failed: 0, bounced: 0 }
        }
        
        if (item.delivery_status === 'sent') hourlyStats[hour].sent++
        else if (item.delivery_status === 'delivered') hourlyStats[hour].delivered++
        else if (item.delivery_status === 'failed') hourlyStats[hour].failed++
        else if (item.delivery_status === 'bounced') hourlyStats[hour].bounced++
      })

      analytics.hourly_trends = Object.entries(hourlyStats)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([hour, stats]) => ({
          hour,
          ...stats,
          total: stats.sent + stats.delivered + stats.failed + stats.bounced
        }))
    }

    // Rate limiting metrics
    if (requestedMetrics.includes('all') || requestedMetrics.includes('rate_limiting')) {
      const { data: rateLimitData } = await supabase
        .from('rate_limit_tracking')
        .select('resource_type, request_count, created_at')
        .gte('created_at', startTimeISO)

      const totalRequests = rateLimitData?.reduce((sum, r) => sum + r.request_count, 0) || 0
      const uniqueUsers = new Set(rateLimitData?.map(r => r.resource_type)).size

      analytics.rate_limiting_metrics = {
        total_requests: totalRequests,
        unique_users: uniqueUsers,
        avg_requests_per_user: uniqueUsers > 0 ? (totalRequests / uniqueUsers).toFixed(2) : 0
      }
    }

    // System health overview
    analytics.system_health = {
      overall_status: analytics.delivery_metrics?.success_rate > 95 ? 'healthy' : 
                     analytics.delivery_metrics?.success_rate > 90 ? 'degraded' : 'unhealthy',
      last_updated: new Date().toISOString()
    }

    // Log analytics request
    await supabase
      .from('cron_job_logs')
      .insert({
        job_name: 'email_analytics_request',
        status: 'success',
        details: {
          correlation_id: correlationId,
          timeframe,
          metrics_requested: requestedMetrics,
          processing_time_ms: Date.now() - Date.now()
        }
      })

    return new Response(
      JSON.stringify(analytics),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      }
    )

  } catch (error) {
    console.error(`[${correlationId}] Analytics error:`, error)
    
    await supabase
      .from('cron_job_logs')
      .insert({
        job_name: 'email_analytics_request',
        status: 'error',
        error_message: error.message,
        details: {
          correlation_id: correlationId,
          error: error.toString()
        }
      })

    return new Response(
      JSON.stringify({
        error: 'Analytics generation failed',
        correlation_id: correlationId
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      }
    )
  }
})
