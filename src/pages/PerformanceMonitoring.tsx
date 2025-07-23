import { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Activity, 
  Database, 
  Zap, 
  Package, 
  TrendingUp, 
  RefreshCw,
  Monitor,
  Clock,
  AlertTriangle
} from 'lucide-react';
import { CacheManager, BackgroundSync } from '@/utils/cacheManager';
import { useWebVitals } from '@/hooks/useWebVitals';
import { useEdgeFunctionMetrics } from '@/hooks/useEdgeFunctionMetrics';
import { getBundleMetrics, formatBytes, getBundleSizeRating } from '@/utils/bundleAnalytics';

export default function PerformanceMonitoring() {
  const queryClient = useQueryClient();
  const { metrics: webVitals, getScoreRating, isLoading: webVitalsLoading } = useWebVitals();
  const { metrics: edgeMetrics, loading: edgeLoading, refresh: refreshEdgeMetrics } = useEdgeFunctionMetrics();
  
  const [cacheStats, setCacheStats] = useState({
    hits: 0,
    misses: 0,
    ratio: '0%',
    total: 0
  });
  const [bundleMetrics, setBundleMetrics] = useState(getBundleMetrics());
  const [reactQueryStats, setReactQueryStats] = useState({
    queryCount: 0,
    mutationCount: 0,
    staleQueries: 0,
    cachedQueries: 0
  });

  const cacheManager = CacheManager.getInstance(queryClient);

  useEffect(() => {
    const updateStats = () => {
      // Cache stats
      const currentStats = cacheManager.getCacheStats();
      setCacheStats(currentStats);
      
      // React Query stats
      const cache = queryClient.getQueryCache();
      const queries = cache.getAll();
      const mutations = queryClient.getMutationCache().getAll();
      
      setReactQueryStats({
        queryCount: queries.length,
        mutationCount: mutations.length,
        staleQueries: queries.filter(q => q.isStale()).length,
        cachedQueries: queries.filter(q => q.state.data !== undefined).length
      });

      // Update bundle metrics
      setBundleMetrics(getBundleMetrics());
    };

    updateStats();
    const interval = setInterval(updateStats, 2000);
    return () => clearInterval(interval);
  }, [cacheManager, queryClient]);

  const getWebVitalsBadgeVariant = (rating: string) => {
    switch (rating) {
      case 'good': return 'default';
      case 'needs-improvement': return 'secondary';
      default: return 'destructive';
    }
  };

  const formatDuration = (ms: number | null) => {
    if (ms === null) return 'N/A';
    if (ms < 1000) return `${Math.round(ms)}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Performance Monitoring</h1>
          <p className="text-muted-foreground">
            Monitor application performance, cache efficiency, and system metrics
          </p>
        </div>
        <Button onClick={() => window.location.reload()} variant="outline">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh All
        </Button>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="cache">Cache</TabsTrigger>
          <TabsTrigger value="edge-functions">Edge Functions</TabsTrigger>
          <TabsTrigger value="bundle">Bundle</TabsTrigger>
          <TabsTrigger value="web-vitals">Web Vitals</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center space-x-2">
                  <Database className="w-5 h-5 text-blue-500" />
                  <div>
                    <p className="text-sm font-medium">Cache Hit Rate</p>
                    <p className="text-2xl font-bold">{cacheStats.ratio}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center space-x-2">
                  <Zap className="w-5 h-5 text-yellow-500" />
                  <div>
                    <p className="text-sm font-medium">Edge Functions</p>
                    <p className="text-2xl font-bold">{edgeMetrics.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center space-x-2">
                  <Package className="w-5 h-5 text-green-500" />
                  <div>
                    <p className="text-sm font-medium">Bundle Size</p>
                    <p className="text-2xl font-bold">{formatBytes(bundleMetrics.gzippedSize)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center space-x-2">
                  <Activity className="w-5 h-5 text-red-500" />
                  <div>
                    <p className="text-sm font-medium">LCP Score</p>
                    <p className="text-2xl font-bold">
                      {webVitals.lcp ? formatDuration(webVitals.lcp) : 'Loading...'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Performance Alerts */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Performance Alerts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {parseInt(cacheStats.ratio) < 70 && (
                  <div className="flex items-center gap-2 p-3 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg">
                    <AlertTriangle className="w-4 h-4 text-yellow-600" />
                    <span className="text-sm">Cache hit rate is below optimal (70%+)</span>
                  </div>
                )}
                {bundleMetrics.totalSize > 4 * 1024 * 1024 && (
                  <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-950/20 rounded-lg">
                    <AlertTriangle className="w-4 h-4 text-red-600" />
                    <span className="text-sm">Bundle size is quite large ({'>'}4MB)</span>
                  </div>
                )}
                {webVitals.lcp && webVitals.lcp > 4000 && (
                  <div className="flex items-center gap-2 p-3 bg-orange-50 dark:bg-orange-950/20 rounded-lg">
                    <AlertTriangle className="w-4 h-4 text-orange-600" />
                    <span className="text-sm">Largest Contentful Paint is slow ({'>'}4s)</span>
                  </div>
                )}
                {parseInt(cacheStats.ratio) >= 70 && bundleMetrics.totalSize <= 4 * 1024 * 1024 && (!webVitals.lcp || webVitals.lcp <= 4000) && (
                  <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
                    <TrendingUp className="w-4 h-4 text-green-600" />
                    <span className="text-sm">All performance metrics are within optimal ranges</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cache" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Cache Hit Rates */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="w-5 h-5" />
                  Cache Performance
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-green-50 dark:bg-green-950/20 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{cacheStats.hits}</div>
                    <div className="text-sm text-green-600">Cache Hits</div>
                  </div>
                  <div className="text-center p-4 bg-red-50 dark:bg-red-950/20 rounded-lg">
                    <div className="text-2xl font-bold text-red-600">{cacheStats.misses}</div>
                    <div className="text-sm text-red-600">Cache Misses</div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Hit Ratio</span>
                    <span>{cacheStats.ratio}</span>
                  </div>
                  <Progress value={parseInt(cacheStats.ratio)} className="w-full" />
                </div>
              </CardContent>
            </Card>

            {/* React Query Statistics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  React Query Cache
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                    <div className="text-xl font-bold text-blue-600">{reactQueryStats.queryCount}</div>
                    <div className="text-xs text-blue-600">Total Queries</div>
                  </div>
                  <div className="text-center p-3 bg-purple-50 dark:bg-purple-950/20 rounded-lg">
                    <div className="text-xl font-bold text-purple-600">{reactQueryStats.cachedQueries}</div>
                    <div className="text-xs text-purple-600">Cached Queries</div>
                  </div>
                  <div className="text-center p-3 bg-orange-50 dark:bg-orange-950/20 rounded-lg">
                    <div className="text-xl font-bold text-orange-600">{reactQueryStats.staleQueries}</div>
                    <div className="text-xs text-orange-600">Stale Queries</div>
                  </div>
                  <div className="text-center p-3 bg-pink-50 dark:bg-pink-950/20 rounded-lg">
                    <div className="text-xl font-bold text-pink-600">{reactQueryStats.mutationCount}</div>
                    <div className="text-xs text-pink-600">Mutations</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="edge-functions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5" />
                Edge Function Performance
                <Button onClick={refreshEdgeMetrics} variant="outline" size="sm" className="ml-auto">
                  <RefreshCw className="w-4 h-4" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {edgeLoading ? (
                <div className="text-center py-8">Loading edge function metrics...</div>
              ) : (
                <div className="space-y-4">
                  {edgeMetrics.map((metric) => (
                    <div key={metric.function_name} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold">{metric.function_name}</h3>
                        <Badge variant={metric.success_rate > 95 ? 'default' : 'secondary'}>
                          {metric.success_rate.toFixed(1)}% Success
                        </Badge>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Avg Response: </span>
                          <span className="font-medium">{metric.avg_response_time}ms</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Total Requests: </span>
                          <span className="font-medium">{metric.total_requests.toLocaleString()}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Last Called: </span>
                          <span className="font-medium">
                            {new Date(metric.last_called).toLocaleTimeString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bundle" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  Bundle Analysis
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                    <div className="text-xl font-bold text-blue-600">
                      {formatBytes(bundleMetrics.totalSize)}
                    </div>
                    <div className="text-sm text-blue-600">Total Size</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 dark:bg-green-950/20 rounded-lg">
                    <div className="text-xl font-bold text-green-600">
                      {formatBytes(bundleMetrics.gzippedSize)}
                    </div>
                    <div className="text-sm text-green-600">Gzipped</div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Bundle Rating</span>
                    <Badge variant={getBundleSizeRating(bundleMetrics.totalSize) === 'excellent' ? 'default' : 'secondary'}>
                      {getBundleSizeRating(bundleMetrics.totalSize)}
                    </Badge>
                  </div>
                </div>

                {bundleMetrics.memoryUsage && (
                  <div className="space-y-2">
                    <h4 className="font-medium">Memory Usage</h4>
                    <div className="text-sm space-y-1">
                      <div className="flex justify-between">
                        <span>Used:</span>
                        <span>{bundleMetrics.memoryUsage.used}MB</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Allocated:</span>
                        <span>{bundleMetrics.memoryUsage.allocated}MB</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Limit:</span>
                        <span>{bundleMetrics.memoryUsage.limit}MB</span>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Largest Modules</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {bundleMetrics.largestModules.map((module, index) => (
                    <div key={index} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="truncate">{module.name}</span>
                        <span>{formatBytes(module.size)}</span>
                      </div>
                      <Progress value={module.percentage} className="h-2" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="web-vitals" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Monitor className="w-5 h-5" />
                Core Web Vitals
              </CardTitle>
            </CardHeader>
            <CardContent>
              {webVitalsLoading ? (
                <div className="text-center py-8">Measuring Web Vitals...</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Largest Contentful Paint</span>
                      <Badge variant={getWebVitalsBadgeVariant(getScoreRating('lcp', webVitals.lcp))}>
                        {getScoreRating('lcp', webVitals.lcp)}
                      </Badge>
                    </div>
                    <div className="text-2xl font-bold">{formatDuration(webVitals.lcp)}</div>
                    <div className="text-xs text-muted-foreground">Target: {'<2.5s'}</div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">First Input Delay</span>
                      <Badge variant={getWebVitalsBadgeVariant(getScoreRating('fid', webVitals.fid))}>
                        {getScoreRating('fid', webVitals.fid)}
                      </Badge>
                    </div>
                    <div className="text-2xl font-bold">{formatDuration(webVitals.fid)}</div>
                    <div className="text-xs text-muted-foreground">Target: {'<100ms'}</div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Cumulative Layout Shift</span>
                      <Badge variant={getWebVitalsBadgeVariant(getScoreRating('cls', webVitals.cls))}>
                        {getScoreRating('cls', webVitals.cls)}
                      </Badge>
                    </div>
                    <div className="text-2xl font-bold">
                      {webVitals.cls !== null ? webVitals.cls.toFixed(3) : 'N/A'}
                    </div>
                    <div className="text-xs text-muted-foreground">Target: {'<0.1'}</div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">First Contentful Paint</span>
                      <Badge variant={getWebVitalsBadgeVariant(getScoreRating('fcp', webVitals.fcp))}>
                        {getScoreRating('fcp', webVitals.fcp)}
                      </Badge>
                    </div>
                    <div className="text-2xl font-bold">{formatDuration(webVitals.fcp)}</div>
                    <div className="text-xs text-muted-foreground">Target: {'<1.8s'}</div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Time to First Byte</span>
                      <Badge variant={getWebVitalsBadgeVariant(getScoreRating('ttfb', webVitals.ttfb))}>
                        {getScoreRating('ttfb', webVitals.ttfb)}
                      </Badge>
                    </div>
                    <div className="text-2xl font-bold">{formatDuration(webVitals.ttfb)}</div>
                    <div className="text-xs text-muted-foreground">Target: {'<800ms'}</div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Page Load Time</span>
                      <Badge variant="outline">
                        <Clock className="w-3 h-3 mr-1" />
                        Info
                      </Badge>
                    </div>
                    <div className="text-2xl font-bold">{formatDuration(bundleMetrics.loadTime)}</div>
                    <div className="text-xs text-muted-foreground">Total load time</div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}