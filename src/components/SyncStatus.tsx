import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Wifi, WifiOff, RefreshCw, Check, X } from 'lucide-react';
import { useBackgroundSync } from '@/hooks/useBackgroundSync';
import { useOfflineSync } from '@/hooks/useOfflineSync';

export const SyncStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const { queueSize, isSyncing, syncUserListItems } = useBackgroundSync();
  const { syncPendingActions } = useOfflineSync();

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleManualSync = async () => {
    try {
      await Promise.all([
        syncPendingActions(),
        syncUserListItems()
      ]);
    } catch (error) {
      console.error('Manual sync failed:', error);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            {isOnline ? (
              <Wifi className="w-4 h-4 text-green-500" />
            ) : (
              <WifiOff className="w-4 h-4 text-red-500" />
            )}
            <span className="text-sm font-medium">
              {isOnline ? 'Online' : 'Offline'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {queueSize > 0 && (
              <Badge variant="secondary" className="text-xs">
                {queueSize} pending
              </Badge>
            )}
            
            {isSyncing && (
              <RefreshCw className="w-4 h-4 animate-spin text-primary" />
            )}
            
            {isOnline && queueSize > 0 && (
              <Button
                size="sm"
                variant="outline"
                onClick={handleManualSync}
                disabled={isSyncing}
                className="text-xs"
              >
                Sync Now
              </Button>
            )}
            
            {isOnline && queueSize === 0 && !isSyncing && (
              <Check className="w-4 h-4 text-green-500" />
            )}
            
            {!isOnline && queueSize > 0 && (
              <X className="w-4 h-4 text-orange-500" />
            )}
          </div>
        </div>
        
        {queueSize > 0 && (
          <div className="mt-2 text-xs text-muted-foreground">
            {isOnline ? 
              'Changes will sync automatically' : 
              'Changes will sync when back online'
            }
          </div>
        )}
      </CardContent>
    </Card>
  );
};