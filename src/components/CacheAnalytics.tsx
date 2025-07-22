import { useEffect, useState } from 'react';
import { CacheManager, BackgroundSync } from '@/utils/cacheManager';
import { useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshCw, TrendingUp, Database, Zap } from 'lucide-react';

export function CacheAnalytics() {
  const queryClient = useQueryClient();
  const [stats, setStats] = useState({
    hits: 0,
    misses: 0,
    ratio: '0%',
    total: 0
  });
  const [cacheSize, setCacheSize] = useState(0);
  const [isBackgroundSyncActive, setIsBackgroundSyncActive] = useState(false);

  const cacheManager = CacheManager.getInstance(queryClient);
  const backgroundSync = BackgroundSync.getInstance(queryClient);

  useEffect(() => {
    const interval = setInterval(() => {
      const currentStats = cacheManager.getCacheStats();
      setStats(currentStats);
      
      // Get cache size
      const cache = queryClient.getQueryCache();
      setCacheSize(cache.getAll().length);
    }, 1000);

    return () => clearInterval(interval);
  }, [cacheManager, queryClient]);

  const handleWarmCache = () => {
    cacheManager.warmCache();
  };

  const handleToggleBackgroundSync = () => {
    if (isBackgroundSyncActive) {
      backgroundSync.stopBackgroundSync();
      setIsBackgroundSyncActive(false);
    } else {
      backgroundSync.startBackgroundSync();
      setIsBackgroundSyncActive(true);
    }
  };

  const handleClearCache = () => {
    queryClient.clear();
    setStats({ hits: 0, misses: 0, ratio: '0%', total: 0 });
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="w-5 h-5" />
          Cache Analytics Dashboard
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Cache Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-green-50 dark:bg-green-950 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{stats.hits}</div>
            <div className="text-sm text-green-600">Cache Hits</div>
          </div>
          
          <div className="text-center p-4 bg-red-50 dark:bg-red-950 rounded-lg">
            <div className="text-2xl font-bold text-red-600">{stats.misses}</div>
            <div className="text-sm text-red-600">Cache Misses</div>
          </div>
          
          <div className="text-center p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{stats.ratio}</div>
            <div className="text-sm text-blue-600">Hit Ratio</div>
          </div>
          
          <div className="text-center p-4 bg-purple-50 dark:bg-purple-950 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">{cacheSize}</div>
            <div className="text-sm text-purple-600">Cached Queries</div>
          </div>
        </div>

        {/* Performance Indicators */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span>Cache Performance</span>
            <Badge variant={parseInt(stats.ratio) > 80 ? 'default' : parseInt(stats.ratio) > 60 ? 'secondary' : 'destructive'}>
              {parseInt(stats.ratio) > 80 ? 'Excellent' : parseInt(stats.ratio) > 60 ? 'Good' : 'Needs Improvement'}
            </Badge>
          </div>
          
          <div className="flex items-center justify-between">
            <span>Background Sync</span>
            <Badge variant={isBackgroundSyncActive ? 'default' : 'secondary'}>
              {isBackgroundSyncActive ? 'Active' : 'Inactive'}
            </Badge>
          </div>
        </div>

        {/* Control Buttons */}
        <div className="flex flex-wrap gap-2">
          <Button onClick={handleWarmCache} variant="outline" size="sm">
            <TrendingUp className="w-4 h-4 mr-2" />
            Warm Cache
          </Button>
          
          <Button 
            onClick={handleToggleBackgroundSync} 
            variant={isBackgroundSyncActive ? 'destructive' : 'default'}
            size="sm"
          >
            <Zap className="w-4 h-4 mr-2" />
            {isBackgroundSyncActive ? 'Stop' : 'Start'} Background Sync
          </Button>
          
          <Button onClick={handleClearCache} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Clear Cache
          </Button>
        </div>

        {/* Cache Effectiveness Visualization */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Cache Effectiveness</span>
            <span>{stats.ratio}</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-green-500 to-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: stats.ratio }}
            />
          </div>
        </div>

        {/* Quick Actions */}
        <div className="text-sm text-muted-foreground space-y-1">
          <p><strong>Tips for better performance:</strong></p>
          <ul className="list-disc list-inside space-y-1 ml-4">
            <li>Cache hit ratio above 80% indicates excellent performance</li>
            <li>Enable background sync for fresh data</li>
            <li>Warm cache improves initial page load times</li>
            <li>Monitor cache size to avoid memory issues</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}