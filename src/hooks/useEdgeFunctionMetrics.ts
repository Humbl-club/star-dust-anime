import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface EdgeFunctionMetric {
  function_name: string;
  avg_response_time: number;
  total_requests: number;
  success_rate: number;
  last_called: string;
}

export function useEdgeFunctionMetrics() {
  const [metrics, setMetrics] = useState<EdgeFunctionMetric[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      setError(null);

      // Query Supabase analytics for edge function performance
      const { data, error: queryError } = await supabase.functions.invoke('cached-content', {
        body: { 
          action: 'get_function_metrics',
          timeframe: '24h'
        }
      });

      if (queryError) throw queryError;

      // Mock data for demo purposes - in production this would come from actual analytics
      const mockMetrics: EdgeFunctionMetric[] = [
        {
          function_name: 'cached-content',
          avg_response_time: 85,
          total_requests: 1247,
          success_rate: 99.2,
          last_called: new Date(Date.now() - 60000).toISOString()
        },
        {
          function_name: 'cached-home-data',
          avg_response_time: 120,
          total_requests: 856,
          success_rate: 98.8,
          last_called: new Date(Date.now() - 30000).toISOString()
        },
        {
          function_name: 'ultra-fast-sync',
          avg_response_time: 2400,
          total_requests: 24,
          success_rate: 91.7,
          last_called: new Date(Date.now() - 900000).toISOString()
        }
      ];

      setMetrics(mockMetrics);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch edge function metrics');
      console.error('Edge function metrics error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
    
    // Refresh metrics every 30 seconds
    const interval = setInterval(fetchMetrics, 30000);
    return () => clearInterval(interval);
  }, []);

  return {
    metrics,
    loading,
    error,
    refresh: fetchMetrics
  };
}