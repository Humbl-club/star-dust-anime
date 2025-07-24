import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { X, Download, Smartphone, Monitor } from 'lucide-react';
import { usePWA } from '@/hooks/usePWA';
import { toast } from 'sonner';

export function PWAInstallPrompt() {
  const { isInstallable, isInstalled, installApp } = usePWA();
  const [isDismissed, setIsDismissed] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    // Show prompt after a delay if app is installable and not dismissed
    const timer = setTimeout(() => {
      if (isInstallable && !isInstalled && !isDismissed) {
        const lastDismissed = localStorage.getItem('pwa-install-dismissed');
        const daysSinceDismissed = lastDismissed 
          ? (Date.now() - parseInt(lastDismissed)) / (1000 * 60 * 60 * 24)
          : 7; // Show immediately if never dismissed
        
        if (daysSinceDismissed >= 7) {
          setShowPrompt(true);
        }
      }
    }, 5000); // Show after 5 seconds

    return () => clearTimeout(timer);
  }, [isInstallable, isInstalled, isDismissed]);

  const handleInstall = async () => {
    const success = await installApp();
    if (success) {
      toast.success('App installed successfully!');
      setShowPrompt(false);
    } else {
      toast.error('Installation cancelled or failed');
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    setIsDismissed(true);
    localStorage.setItem('pwa-install-dismissed', Date.now().toString());
  };

  // Don't show if conditions aren't met
  if (!showPrompt || !isInstallable || isInstalled) {
    return null;
  }

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
                <span>Works on mobile</span>
                <Monitor className="w-3 h-3 ml-2" />
                <span>& desktop</span>
              </div>
              
              <div className="flex gap-2 pt-2">
                <Button onClick={handleInstall} size="sm" className="flex-1">
                  Install App
                </Button>
                <Button onClick={handleDismiss} variant="ghost" size="sm">
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