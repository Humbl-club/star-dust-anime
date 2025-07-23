import { useState, useEffect } from 'react';
import { Wifi, WifiOff, CloudOff, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { usePWA } from '@/hooks/usePWA';
import { useBackgroundSync } from '@/hooks/useBackgroundSync';

export function OfflineIndicator() {
  const { isOnline } = usePWA();
  const { queueSize, isSyncing } = useBackgroundSync();
  const [showDetails, setShowDetails] = useState(false);
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    if (!isOnline && !wasOffline) {
      setWasOffline(true);
      toast.error('You are now offline', {
        icon: <WifiOff className="h-4 w-4" />,
        description: 'You can still browse cached content and make changes offline.'
      });
    } else if (isOnline && wasOffline) {
      setWasOffline(false);
      toast.success('Back online!', {
        icon: <Wifi className="h-4 w-4" />,
        description: 'Syncing your offline changes...'
      });
    }
  }, [isOnline, wasOffline]);

  if (isOnline && queueSize === 0) {
    return null; // Don't show anything when fully online and synced
  }

  return (
    <div className="fixed bottom-4 left-4 z-50">
      <Card 
        className={`cursor-pointer transition-all duration-300 ${
          !isOnline 
            ? 'border-red-500/20 bg-red-500/10' 
            : queueSize > 0 
            ? 'border-yellow-500/20 bg-yellow-500/10'
            : 'border-green-500/20 bg-green-500/10'
        }`}
        onClick={() => setShowDetails(!showDetails)}
      >
        <CardContent className="p-3">
          <div className="flex items-center gap-2">
            {!isOnline ? (
              <WifiOff className="h-4 w-4 text-red-500" />
            ) : isSyncing ? (
              <div className="h-4 w-4">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent" />
              </div>
            ) : queueSize > 0 ? (
              <CloudOff className="h-4 w-4 text-yellow-500" />
            ) : (
              <Wifi className="h-4 w-4 text-green-500" />
            )}
            
            <span className="text-sm font-medium">
              {!isOnline ? 'Offline' : isSyncing ? 'Syncing...' : 'Online'}
            </span>
            
            {queueSize > 0 && (
              <Badge variant="secondary" className="text-xs">
                {queueSize} pending
              </Badge>
            )}
          </div>
          
          {showDetails && (
            <div className="mt-2 pt-2 border-t border-border/20 space-y-2">
              <div className="text-xs text-muted-foreground">
                {!isOnline ? (
                  <div className="space-y-1">
                    <div className="flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      <span>No internet connection</span>
                    </div>
                    <div>You can still browse and edit offline</div>
                  </div>
                ) : queueSize > 0 ? (
                  <div className="space-y-1">
                    <div>{queueSize} changes waiting to sync</div>
                    <div>Changes will sync automatically</div>
                  </div>
                ) : (
                  <div>All changes are synced</div>
                )}
              </div>
              
              {!isOnline && (
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="w-full text-xs h-7"
                  onClick={(e) => {
                    e.stopPropagation();
                    window.location.reload();
                  }}
                >
                  Try to reconnect
                </Button>
              )}
              
              {queueSize > 0 && isOnline && (
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="w-full text-xs h-7"
                  onClick={(e) => {
                    e.stopPropagation();
                    // Force sync
                    if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
                      navigator.serviceWorker.ready.then(registration => {
                        return (registration as any).sync.register('force-sync');
                      });
                    }
                  }}
                >
                  Force sync now
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}