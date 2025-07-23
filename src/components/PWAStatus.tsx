import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { 
  Wifi, 
  WifiOff, 
  Bell, 
  BellOff, 
  Download, 
  RotateCcw as Sync, 
  Smartphone,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { usePWA } from '@/hooks/usePWA';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { useBackgroundSync } from '@/hooks/useBackgroundSync';
import { toast } from 'sonner';

export function PWAStatus() {
  const { isOnline, isInstalled, isInstallable, installApp } = usePWA();
  const { 
    isSupported, 
    permission, 
    isSubscribed, 
    requestPermission, 
    subscribe, 
    unsubscribe,
    showNotification 
  } = usePushNotifications();
  const { queueSize, isSyncing } = useBackgroundSync();
  
  const [notificationsEnabled, setNotificationsEnabled] = useState(isSubscribed);

  const handleInstallApp = async () => {
    const success = await installApp();
    if (success) {
      toast.success('App installed successfully!');
    }
  };

  const handleNotificationToggle = async (enabled: boolean) => {
    if (enabled) {
      const hasPermission = await requestPermission();
      if (hasPermission) {
        const subscription = await subscribe();
        setNotificationsEnabled(!!subscription);
        if (subscription) {
          toast.success('Push notifications enabled!');
          // Test notification
          showNotification({
            title: 'Notifications Enabled!',
            body: 'You\'ll now receive updates about new episodes and chapters.',
            tag: 'welcome'
          });
        }
      } else {
        toast.error('Notification permission denied');
      }
    } else {
      const success = await unsubscribe();
      setNotificationsEnabled(!success);
      if (success) {
        toast.success('Push notifications disabled');
      }
    }
  };

  const testNotification = () => {
    showNotification({
      title: 'Test Notification',
      body: 'This is a test notification to verify everything is working!',
      tag: 'test'
    });
  };

  return (
    <Card className="w-full max-w-md">
      <CardContent className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold flex items-center gap-2">
            <Smartphone className="w-4 h-4" />
            PWA Status
          </h3>
        </div>

        {/* Connection Status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isOnline ? (
              <Wifi className="w-4 h-4 text-green-500" />
            ) : (
              <WifiOff className="w-4 h-4 text-red-500" />
            )}
            <span className="text-sm">Connection</span>
          </div>
          <Badge variant={isOnline ? 'default' : 'destructive'}>
            {isOnline ? 'Online' : 'Offline'}
          </Badge>
        </div>

        {/* Installation Status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Download className="w-4 h-4" />
            <span className="text-sm">App Installation</span>
          </div>
          {isInstalled ? (
            <Badge variant="default">
              <CheckCircle className="w-3 h-3 mr-1" />
              Installed
            </Badge>
          ) : isInstallable ? (
            <Button onClick={handleInstallApp} size="sm" variant="outline">
              Install
            </Button>
          ) : (
            <Badge variant="secondary">Not Available</Badge>
          )}
        </div>

        {/* Push Notifications */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {notificationsEnabled ? (
              <Bell className="w-4 h-4 text-blue-500" />
            ) : (
              <BellOff className="w-4 h-4 text-gray-400" />
            )}
            <span className="text-sm">Push Notifications</span>
          </div>
          <div className="flex items-center gap-2">
            {isSupported ? (
              <Switch
                checked={notificationsEnabled}
                onCheckedChange={handleNotificationToggle}
                disabled={permission === 'denied'}
              />
            ) : (
              <Badge variant="secondary">Not Supported</Badge>
            )}
          </div>
        </div>

        {/* Background Sync */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sync className={`w-4 h-4 ${isSyncing ? 'animate-spin text-blue-500' : 'text-gray-400'}`} />
            <span className="text-sm">Background Sync</span>
          </div>
          <div className="flex items-center gap-2">
            {queueSize > 0 && (
              <Badge variant="outline">{queueSize} pending</Badge>
            )}
            <Badge variant={isSyncing ? 'default' : 'secondary'}>
              {isSyncing ? 'Syncing' : 'Ready'}
            </Badge>
          </div>
        </div>

        {/* Test Notification Button */}
        {notificationsEnabled && (
          <Button 
            onClick={testNotification} 
            variant="outline" 
            size="sm" 
            className="w-full"
          >
            Test Notification
          </Button>
        )}

        {/* PWA Features Info */}
        <div className="pt-2 border-t">
          <div className="text-xs text-muted-foreground space-y-1">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-3 h-3 text-green-500" />
              <span>Offline browsing</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-3 h-3 text-green-500" />
              <span>Fast loading</span>
            </div>
            <div className="flex items-center gap-2">
              {isSupported ? (
                <CheckCircle className="w-3 h-3 text-green-500" />
              ) : (
                <AlertCircle className="w-3 h-3 text-yellow-500" />
              )}
              <span>Push notifications</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-3 h-3 text-green-500" />
              <span>Background sync</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}