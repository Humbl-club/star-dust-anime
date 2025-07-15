import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.3'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const supabase = createClient(supabaseUrl, supabaseKey)

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface AnalyticsData {
  performance: {
    total_emails_sent: number
    success_rate: number
    avg_delivery_time: number
    bounce_rate: number
    complaint_rate: number
  }
  delivery_stats: {
    sent: number
    delivered: number
    failed: number
    bounced: number
    complained: number
    pending: number
  }
  trends: {
    hourly_volume: Array<{
      hour: string
      count: number
      success_rate: number
    }>
    daily_stats: Array<{
      date: string
      total: number
      success_rate: number
      avg_processing_time: number
    }>
  }
  system_health: {
    circuit_breaker_events: number
    rate_limit_hits: number
    dlq_items: number
    avg_processing_time: number
  }
}

serve(async (req: Request) => {
  const correlationId = crypto.randomUUID()
  console.log(`[${correlationId}] Analytics request: ${req.method}`)

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const startTime = Date.now()
    const url = new URL(req.url)
    const timeRange = url.searchParams.get('range') || '24h'
    
    // Calculate time range
    let startDate: Date
    switch (timeRange) {
      case '1h':
        startDate = new Date(Date.now() - 60 * 60 * 1000)
        break
      case '6h':
        startDate = new Date(Date.now() - 6 * 60 * 60 * 1000)
        break
      case '7d':
        startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        break
      case '30d':
        startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        break
      default: // 24h
        startDate = new Date(Date.now() - 24 * 60 * 60 * 1000)
        break
    }

    const startISOString = startDate.toISOString()

    // Get email delivery data
    const { data: emailData } = await supabase
      .from('email_delivery_tracking')
      .select('*')
      .gte('created_at', startISOString)
      .order('created_at', { ascending: false })

    // Get service metrics
    const { data: serviceMetrics } = await supabase
      .from('service_health_metrics')
      .select('*')
      .eq('service_name', 'email_service')
      .gte('timestamp', startISOString)
      .order('timestamp', { ascending: false })

    // Get DLQ stats
    const { data: dlqData } = await supabase
      .from('dead_letter_queue')
      .select('*')
      .eq('operation_type', 'email_send')
      .gte('created_at', startISOString)

    // Get rate limiting data
    const { data: rateLimitData } = await supabase
      .from('rate_limit_tracking')
      .select('*')
      .eq('resource_type', 'email_send')
      .gte('created_at', startISOString)

    // Calculate performance metrics
    const totalEmails = emailData?.length || 0
    const deliveredEmails = emailData?.filter(e => e.delivery_status === 'delivered').length || 0
    const sentEmails = emailData?.filter(e => e.delivery_status === 'sent').length || 0
    const failedEmails = emailData?.filter(e => e.delivery_status === 'failed').length || 0
    const bouncedEmails = emailData?.filter(e => e.delivery_status === 'bounced').length || 0
    const complainedEmails = emailData?.filter(e => e.delivery_status === 'complained').length || 0
    const pendingEmails = emailData?.filter(e => ['queued', 'processing'].includes(e.delivery_status)).length || 0

    const successfulEmails = deliveredEmails + sentEmails
    const successRate = totalEmails > 0 ? (successfulEmails / totalEmails) * 100 : 100
    const bounceRate = totalEmails > 0 ? (bouncedEmails / totalEmails) * 100 : 0
    const complaintRate = totalEmails > 0 ? (complainedEmails / totalEmails) * 100 : 0

    // Calculate average delivery time
    const deliveryTimes = emailData?.filter(e => e.sent_at && e.delivered_at)
      .map(e => new Date(e.delivered_at!).getTime() - new Date(e.sent_at!).getTime())
      .filter(time => time > 0) || []
    const avgDeliveryTime = deliveryTimes.length > 0 
      ? deliveryTimes.reduce((a, b) => a + b, 0) / deliveryTimes.length 
      : 0

    // Calculate processing time from service metrics
    const processingTimes = serviceMetrics?.filter(m => m.metric_type === 'send_success')
      .map(m => m.metric_value) || []
    const avgProcessingTime = processingTimes.length > 0 
      ? processingTimes.reduce((a, b) => a + b, 0) / processingTimes.length 
      : 0

    // Generate hourly trends
    const hourlyData = new Map<string, { count: number; successful: number }>()
    emailData?.forEach(email => {
      const hour = new Date(email.created_at).toISOString().substring(0, 13) + ':00:00Z'
      const existing = hourlyData.get(hour) || { count: 0, successful: 0 }
      existing.count++
      if (['sent', 'delivered'].includes(email.delivery_status)) {
        existing.successful++
      }
      hourlyData.set(hour, existing)
    })

    const hourlyVolume = Array.from(hourlyData.entries())
      .map(([hour, data]) => ({
        hour,
        count: data.count,
        success_rate: data.count > 0 ? (data.successful / data.count) * 100 : 100
      }))
      .sort((a, b) => a.hour.localeCompare(b.hour))

    // Generate daily trends (for longer time ranges)
    const dailyData = new Map<string, { count: number; successful: number; processingTimes: number[] }>()
    emailData?.forEach(email => {
      const date = new Date(email.created_at).toISOString().substring(0, 10)
      const existing = dailyData.get(date) || { count: 0, successful: 0, processingTimes: [] }
      existing.count++
      if (['sent', 'delivered'].includes(email.delivery_status)) {
        existing.successful++
      }
      dailyData.set(date, existing)
    })

    // Add processing times from service metrics
    serviceMetrics?.forEach(metric => {
      if (metric.metric_type === 'send_success') {
        const date = new Date(metric.timestamp).toISOString().substring(0, 10)
        const existing = dailyData.get(date) || { count: 0, successful: 0, processingTimes: [] }
        existing.processingTimes.push(metric.metric_value)
        dailyData.set(date, existing)
      }
    })

    const dailyStats = Array.from(dailyData.entries())
      .map(([date, data]) => ({
        date,
        total: data.count,
        success_rate: data.count > 0 ? (data.successful / data.count) * 100 : 100,
        avg_processing_time: data.processingTimes.length > 0 
          ? data.processingTimes.reduce((a, b) => a + b, 0) / data.processingTimes.length 
          : 0
      }))
      .sort((a, b) => a.date.localeCompare(b.date))

    // System health metrics
    const circuitBreakerEvents = serviceMetrics?.filter(m => 
      m.metric_type === 'circuit_breaker_opened'
    ).length || 0

    const rateLimitHits = rateLimitData?.filter(r => r.request_count >= 3).length || 0

    const analyticsData: AnalyticsData = {
      performance: {
        total_emails_sent: totalEmails,
        success_rate: Math.round(successRate * 100) / 100,
        avg_delivery_time: Math.round(avgDeliveryTime / 1000), // Convert to seconds
        bounce_rate: Math.round(bounceRate * 100) / 100,
        complaint_rate: Math.round(complaintRate * 100) / 100
      },
      delivery_stats: {
        sent: sentEmails,
        delivered: deliveredEmails,
        failed: failedEmails,
        bounced: bouncedEmails,
        complained: complainedEmails,
        pending: pendingEmails
      },
      trends: {
        hourly_volume: hourlyVolume,
        daily_stats: dailyStats
      },
      system_health: {
        circuit_breaker_events: circuitBreakerEvents,
        rate_limit_hits: rateLimitHits,
        dlq_items: dlqData?.length || 0,
        avg_processing_time: Math.round(avgProcessingTime)
      }
    }

    const processingTime = Date.now() - startTime

    // Log analytics request
    await supabase.rpc('log_service_metric', {
      service_name_param: 'email_analytics',
      metric_type_param: 'analytics_request',
      metric_value_param: processingTime,
      metadata_param: {
        correlation_id: correlationId,
        time_range: timeRange,
        total_emails: totalEmails
      }
    })

    return new Response(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        correlation_id: correlationId,
        processing_time_ms: processingTime,
        time_range: timeRange,
        ...analyticsData
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
    console.error(`[${correlationId}] Analytics error:`, error)
    
    await supabase
      .from('cron_job_logs')
      .insert({
        job_name: 'email_analytics',
        status: 'error',
        error_message: error.message,
        details: {
          correlation_id: correlationId,
          error: error.toString()
        }
      })

    return new Response(
      JSON.stringify({ 
        error: 'Analytics request failed',
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