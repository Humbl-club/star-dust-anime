import React, { useState, useEffect } from 'react';
import { Download, X, Smartphone, Monitor, Chrome } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export const InstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [platform, setPlatform] = useState<'desktop' | 'mobile' | 'unknown'>('unknown');

  useEffect(() => {
    // Check if app is already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    // Detect platform
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    setPlatform(isMobile ? 'mobile' : 'desktop');

    // Handle the beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      
      // Don't show immediately - wait for user engagement
      setTimeout(() => {
        const hasSeenPrompt = localStorage.getItem('pwa-install-prompt-seen');
        const lastPromptTime = localStorage.getItem('pwa-install-prompt-time');
        const now = Date.now();
        
        // Show prompt if:
        // 1. User hasn't seen it before, OR
        // 2. It's been more than 7 days since last prompt
        if (!hasSeenPrompt || (lastPromptTime && now - parseInt(lastPromptTime) > 7 * 24 * 60 * 60 * 1000)) {
          setShowPrompt(true);
        }
      }, 5000); // Show after 5 seconds of usage
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      // For browsers that don't support the prompt
      showManualInstallInstructions();
      return;
    }

    try {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      
      if (choice.outcome === 'accepted') {
        toast.success('App installed successfully!', {
          icon: <Download className="h-4 w-4" />,
        });
        
        // Track installation
        if (typeof (window as any).gtag !== 'undefined') {
          (window as any).gtag('event', 'pwa_install', {
            method: 'browser_prompt',
            platform: platform
          });
        }
      } else {
        toast.info('Installation cancelled');
      }
      
      setDeferredPrompt(null);
      setShowPrompt(false);
      
      localStorage.setItem('pwa-install-prompt-seen', 'true');
      localStorage.setItem('pwa-install-prompt-time', Date.now().toString());
    } catch (error) {
      console.error('Error during installation:', error);
      toast.error('Installation failed. Please try again.');
    }
  };

  const showManualInstallInstructions = () => {
    const isChrome = /Chrome/.test(navigator.userAgent);
    const isSafari = /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent);
    const isFirefox = /Firefox/.test(navigator.userAgent);

    let instructions = '';
    if (platform === 'mobile') {
      if (isSafari) {
        instructions = 'Tap the Share button and select "Add to Home Screen"';
      } else if (isChrome) {
        instructions = 'Tap the menu (⋮) and select "Add to Home screen"';
      } else {
        instructions = 'Look for "Add to Home Screen" or "Install" in your browser menu';
      }
    } else {
      if (isChrome) {
        instructions = 'Click the install icon in the address bar or go to Settings > Install AniThing';
      } else if (isFirefox) {
        instructions = 'Look for the install prompt in the address bar';
      } else {
        instructions = 'Look for "Install" or "Add to Desktop" in your browser menu';
      }
    }

    toast.info(instructions, {
      duration: 8000,
      icon: <Smartphone className="h-4 w-4" />,
    });
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('pwa-install-prompt-seen', 'true');
    localStorage.setItem('pwa-install-prompt-time', Date.now().toString());
    
    // Track dismissal
    if (typeof (window as any).gtag !== 'undefined') {
      (window as any).gtag('event', 'pwa_install_dismissed', {
        platform: platform
      });
    }
  };

  if (isInstalled || !showPrompt) {
    return null;
  }

  return (
    <Card className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50 shadow-lg border-primary/20 bg-gradient-to-r from-background to-primary/5">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            {platform === 'mobile' ? (
              <Smartphone className="h-5 w-5 text-primary" />
            ) : (
              <Monitor className="h-5 w-5 text-primary" />
            )}
            <CardTitle className="text-base">Install AniThing</CardTitle>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDismiss}
            className="h-6 w-6 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <CardDescription className="text-sm">
          Install our app for a better experience with offline access and push notifications.
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex gap-2">
          <Button onClick={handleInstallClick} className="flex-1 gap-2">
            <Download className="h-4 w-4" />
            Install App
          </Button>
          <Button variant="outline" onClick={handleDismiss}>
            Later
          </Button>
        </div>
        
        <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
          <Chrome className="h-3 w-3" />
          <span>Works on Chrome, Edge, Safari & Firefox</span>
        </div>
      </CardContent>
    </Card>
  );
};

// Hook for checking if app is installable
export const useInstallPrompt = () => {
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    const checkInstallStatus = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
      const isInWebAppiOS = (window.navigator as any).standalone === true;
      setIsInstalled(isStandalone || isInWebAppiOS);
    };

    const handleBeforeInstallPrompt = () => {
      setIsInstallable(true);
    };

    checkInstallStatus();
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  return { isInstallable, isInstalled };
};