import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshCw, CheckCircle, AlertCircle, XCircle, Activity } from 'lucide-react';
import { toast } from 'sonner';

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy'
  checks: {
    database: { status: 'pass' | 'fail', responseTime: number }
    emailService: { status: 'pass' | 'fail', responseTime: number }
    rateLimit: { status: 'pass' | 'fail', responseTime: number }
    dlq: { status: 'pass' | 'fail', count: number }
  }
  timestamp: string
}

interface SystemMetrics {
  emailsSent: number
  emailsFailed: number
  rateLimitsHit: number
  dlqItems: number
  avgResponseTime: number
}

export const ProductionMonitoring = () => {
  const [healthStatus, setHealthStatus] = useState<HealthStatus | null>(null);
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchHealthStatus = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('email-health-check');
      
      if (error) {
        throw error;
      }
      
      setHealthStatus(data);
    } catch (error) {
      console.error('Error fetching health status:', error);
      setError('Failed to fetch health status');
    }
  };

  const fetchMetrics = async () => {
    try {
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
      
      // Fetch recent email metrics
      const { data: emailMetrics, error: emailError } = await supabase
        .from('service_health_metrics')
        .select('metric_type, metric_value')
        .eq('service_name', 'email_service')
        .gte('timestamp', oneHourAgo.toISOString())
        .order('timestamp', { ascending: false });
      
      if (emailError) {
        throw emailError;
      }
      
      // Fetch DLQ count
      const { data: dlqData, error: dlqError } = await supabase
        .from('dead_letter_queue')
        .select('id', { count: 'exact' })
        .is('next_retry_at', null);
      
      if (dlqError) {
        throw dlqError;
      }
      
      // Process metrics
      const emailsSent = emailMetrics?.filter(m => m.metric_type === 'send_success').length || 0;
      const emailsFailed = emailMetrics?.filter(m => m.metric_type === 'send_failure').length || 0;
      const rateLimitsHit = emailMetrics?.filter(m => m.metric_type === 'rate_limit_exceeded').length || 0;
      const avgResponseTime = emailMetrics?.filter(m => m.metric_type === 'send_success')
        .reduce((sum, m) => sum + m.metric_value, 0) / Math.max(emailsSent, 1);
      
      setMetrics({
        emailsSent,
        emailsFailed,
        rateLimitsHit,
        dlqItems: dlqData?.length || 0,
        avgResponseTime: avgResponseTime || 0
      });
    } catch (error) {
      console.error('Error fetching metrics:', error);
      setError('Failed to fetch metrics');
    }
  };

  const processDLQ = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('process-dlq');
      
      if (error) {
        throw error;
      }
      
      toast.success(`DLQ processed: ${data.successful} successful, ${data.failed} failed`);
      await fetchMetrics();
    } catch (error) {
      console.error('Error processing DLQ:', error);
      toast.error('Failed to process DLQ');
    } finally {
      setIsLoading(false);
    }
  };

  const runCleanup = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('cleanup-system');
      
      if (error) {
        throw error;
      }
      
      toast.success(`Cleanup completed: ${data.rateLimitRecords + data.healthMetrics + data.templateCache} records cleaned`);
      await fetchMetrics();
    } catch (error) {
      console.error('Error running cleanup:', error);
      toast.error('Failed to run cleanup');
    } finally {
      setIsLoading(false);
    }
  };

  const refreshData = async () => {
    setIsLoading(true);
    setError(null);
    await Promise.all([fetchHealthStatus(), fetchMetrics()]);
    setIsLoading(false);
  };

  useEffect(() => {
    refreshData();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(refreshData, 30000);
    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'pass':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'degraded':
        return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      case 'unhealthy':
      case 'fail':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Activity className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'pass':
        return 'bg-green-500';
      case 'degraded':
        return 'bg-yellow-500';
      case 'unhealthy':
      case 'fail':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  if (error) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <XCircle className="w-5 h-5 text-red-500" />
            Production Monitoring - Error
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-600">{error}</p>
          <Button onClick={refreshData} className="mt-4" disabled={isLoading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Production System Health
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={refreshData} disabled={isLoading} size="sm">
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              </Button>
              {healthStatus && (
                <Badge className={getStatusColor(healthStatus.status)}>
                  {healthStatus.status.toUpperCase()}
                </Badge>
              )}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {healthStatus ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="flex items-center gap-2">
                {getStatusIcon(healthStatus.checks.database.status)}
                <span>Database ({healthStatus.checks.database.responseTime}ms)</span>
              </div>
              <div className="flex items-center gap-2">
                {getStatusIcon(healthStatus.checks.emailService.status)}
                <span>Email Service ({healthStatus.checks.emailService.responseTime}ms)</span>
              </div>
              <div className="flex items-center gap-2">
                {getStatusIcon(healthStatus.checks.rateLimit.status)}
                <span>Rate Limiting ({healthStatus.checks.rateLimit.responseTime}ms)</span>
              </div>
              <div className="flex items-center gap-2">
                {getStatusIcon(healthStatus.checks.dlq.status)}
                <span>DLQ ({healthStatus.checks.dlq.count} items)</span>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2" />
              <p>Loading health status...</p>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>System Metrics (Last Hour)</CardTitle>
          </CardHeader>
          <CardContent>
            {metrics ? (
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span>Emails Sent:</span>
                  <span className="font-semibold text-green-600">{metrics.emailsSent}</span>
                </div>
                <div className="flex justify-between">
                  <span>Emails Failed:</span>
                  <span className="font-semibold text-red-600">{metrics.emailsFailed}</span>
                </div>
                <div className="flex justify-between">
                  <span>Rate Limits Hit:</span>
                  <span className="font-semibold text-yellow-600">{metrics.rateLimitsHit}</span>
                </div>
                <div className="flex justify-between">
                  <span>DLQ Items:</span>
                  <span className="font-semibold text-blue-600">{metrics.dlqItems}</span>
                </div>
                <div className="flex justify-between">
                  <span>Avg Response Time:</span>
                  <span className="font-semibold">{metrics.avgResponseTime.toFixed(2)}ms</span>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2" />
                <p>Loading metrics...</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>System Operations</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              onClick={processDLQ} 
              disabled={isLoading}
              className="w-full"
            >
              Process Dead Letter Queue
            </Button>
            <Button 
              onClick={runCleanup} 
              disabled={isLoading}
              variant="outline"
              className="w-full"
            >
              Run System Cleanup
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};