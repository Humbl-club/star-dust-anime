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

interface HealthCheckResult {
  status: 'healthy' | 'degraded' | 'unhealthy'
  checks: {
    database: { status: 'pass' | 'fail', responseTime: number }
    emailService: { status: 'pass' | 'fail', responseTime: number }
    rateLimit: { status: 'pass' | 'fail', responseTime: number }
    dlq: { status: 'pass' | 'fail', count: number }
  }
  timestamp: string
  uptime: number
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  const startTime = Date.now()
  const result: HealthCheckResult = {
    status: 'healthy',
    checks: {
      database: { status: 'pass', responseTime: 0 },
      emailService: { status: 'pass', responseTime: 0 },
      rateLimit: { status: 'pass', responseTime: 0 },
      dlq: { status: 'pass', count: 0 }
    },
    timestamp: new Date().toISOString(),
    uptime: Date.now() - startTime
  }

  try {
    // Check database connection
    const dbStart = Date.now()
    const { error: dbError } = await supabase.from('service_health_metrics').select('id').limit(1)
    result.checks.database.responseTime = Date.now() - dbStart
    
    if (dbError) {
      result.checks.database.status = 'fail'
      result.status = 'unhealthy'
    }

    // Check rate limiting system
    const rateLimitStart = Date.now()
    const { error: rateLimitError } = await supabase.rpc('check_rate_limit', {
      user_id_param: '00000000-0000-0000-0000-000000000000',
      resource_type_param: 'health_check',
      max_requests: 100,
      window_minutes: 1
    })
    result.checks.rateLimit.responseTime = Date.now() - rateLimitStart
    
    if (rateLimitError) {
      result.checks.rateLimit.status = 'fail'
      result.status = 'degraded'
    }

    // Check dead letter queue
    const dlqStart = Date.now()
    const { data: dlqData, error: dlqError } = await supabase
      .from('dead_letter_queue')
      .select('id', { count: 'exact' })
      .lt('next_retry_at', new Date().toISOString())
    
    if (dlqError) {
      result.checks.dlq.status = 'fail'
      result.status = 'degraded'
    } else {
      result.checks.dlq.count = dlqData?.length || 0
      if (result.checks.dlq.count > 100) {
        result.status = 'degraded'
      }
    }

    // Check email service metrics (recent failures)
    const { data: recentFailures } = await supabase
      .from('service_health_metrics')
      .select('metric_value')
      .eq('service_name', 'email_service')
      .eq('metric_type', 'send_failure')
      .gte('timestamp', new Date(Date.now() - 5 * 60 * 1000).toISOString())
    
    const failureCount = recentFailures?.length || 0
    if (failureCount > 10) {
      result.checks.emailService.status = 'fail'
      result.status = 'unhealthy'
    } else if (failureCount > 5) {
      result.status = 'degraded'
    }

    // Log health check metric
    await supabase.rpc('log_service_metric', {
      service_name_param: 'health_check',
      metric_type_param: 'status',
      metric_value_param: result.status === 'healthy' ? 1 : (result.status === 'degraded' ? 0.5 : 0),
      metadata_param: {
        checks: result.checks,
        response_time: Date.now() - startTime
      }
    })

    return new Response(
      JSON.stringify(result),
      {
        status: result.status === 'healthy' ? 200 : (result.status === 'degraded' ? 200 : 503),
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders 
        }
      }
    )

  } catch (error) {
    console.error('Health check failed:', error)
    
    return new Response(
      JSON.stringify({
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      {
        status: 503,
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders 
        }
      }
    )
  }
})