import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { X, Download, Smartphone, Monitor, Wifi, WifiOff, Bell } from 'lucide-react';
import { usePWA } from '@/hooks/usePWA';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { toast } from 'sonner';

export function PWAFeatures() {
  const { isInstallable, isInstalled, installApp, isOnline } = usePWA();
  const { isSupported, permission, requestPermission, subscribe } = usePushNotifications();
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);

  useEffect(() => {
    // Show install prompt for installable apps
    if (isInstallable && !isInstalled) {
      const lastDismissed = localStorage.getItem('pwa-install-dismissed');
      const daysSinceDismissed = lastDismissed 
        ? (Date.now() - parseInt(lastDismissed)) / (1000 * 60 * 60 * 24)
        : 7;
      
      if (daysSinceDismissed >= 7) {
        setShowInstallPrompt(true);
      }
    }
  }, [isInstallable, isInstalled]);

  const handleInstall = async () => {
    const success = await installApp();
    if (success) {
      toast.success('App installed successfully!');
      setShowInstallPrompt(false);
    }
  };

  const handleDismissInstall = () => {
    setShowInstallPrompt(false);
    localStorage.setItem('pwa-install-dismissed', Date.now().toString());
  };

  const handleEnableNotifications = async () => {
    if (permission !== 'granted') {
      const granted = await requestPermission();
      if (granted) {
        await subscribe();
        toast.success('Push notifications enabled!');
      } else {
        toast.error('Notification permission denied');
      }
    }
  };

  // Install prompt
  if (showInstallPrompt) {
    return (
      <div className="fixed bottom-4 left-4 right-4 z-modal md:left-auto md:right-4 md:w-96">
        <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-secondary/5 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 p-2 bg-primary/10 rounded-lg">
                <Download className="w-5 h-5 text-primary" />
              </div>
              
              <div className="flex-1 space-y-2">
                <h3 className="font-semibold text-sm">Install Anithing App</h3>
                <p className="text-xs text-muted-foreground">
                  Get the full experience with offline access, push notifications, and faster loading.
                </p>
                
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Smartphone className="w-3 h-3" />
                  <span>Mobile</span>
                  <Monitor className="w-3 h-3 ml-2" />
                  <span>Desktop</span>
                </div>
                
                <div className="flex gap-2 pt-2">
                  <Button onClick={handleInstall} size="sm" className="flex-1">
                    Install App
                  </Button>
                  <Button onClick={handleDismissInstall} variant="ghost" size="sm">
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Status indicator
  return (
    <div className="fixed bottom-4 right-4 z-sticky">
      <div className="flex flex-col gap-2">
        {/* Connection status */}
        <div className="flex items-center gap-1 px-2 py-1 bg-background/80 backdrop-blur-sm rounded-md border text-xs">
          {isOnline ? (
            <Wifi className="w-3 h-3 text-green-500" />
          ) : (
            <WifiOff className="w-3 h-3 text-red-500" />
          )}
          <span>{isOnline ? 'Online' : 'Offline'}</span>
        </div>

        {/* Notification prompt */}
        {isSupported && permission === 'default' && (
          <Button 
            onClick={handleEnableNotifications}
            size="sm"
            variant="outline"
            className="text-xs h-8"
          >
            <Bell className="w-3 h-3 mr-1" />
            Enable Notifications
          </Button>
        )}
      </div>
    </div>
  );
}