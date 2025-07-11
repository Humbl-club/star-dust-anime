import React, { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useUserInitialization } from '@/hooks/useUserInitialization';
import { WelcomeAnimation } from '@/components/WelcomeAnimation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface InitializationWrapperProps {
  children: React.ReactNode;
}

export const InitializationWrapper: React.FC<InitializationWrapperProps> = ({ children }) => {
  const { user } = useAuth();
  const { 
    initialization, 
    isLoading, 
    isError, 
    error, 
    isFirstTime, 
    needsWelcome, 
    isInitialized
  } = useUserInitialization();

  const [showWelcomeAnimation, setShowWelcomeAnimation] = useState(false);

  // Trigger welcome animation for new or uninitialized users
  useEffect(() => {
    if (user && needsWelcome && !isLoading && !showWelcomeAnimation) {
      setShowWelcomeAnimation(true);
    }
  }, [user, needsWelcome, isLoading, showWelcomeAnimation]);

  // For unauthenticated users, just render children
  if (!user) {
    return <>{children}</>;
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-96 glass-card">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 p-3 bg-primary/10 rounded-full w-fit">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
            <CardTitle className="text-gradient-primary">Loading...</CardTitle>
          </CardHeader>
        </Card>
      </div>
    );
  }

  // Error state
  if (isError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md glass-card border-destructive/20">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 p-3 bg-destructive/10 rounded-full w-fit">
              <AlertCircle className="w-6 h-6 text-destructive" />
            </div>
            <CardTitle className="text-destructive">Error</CardTitle>
            <CardDescription>
              {error?.message || 'Something went wrong'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => window.location.reload()} className="w-full">
              Refresh Page
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Render children with welcome animation
  return (
    <>
      {children}
      
      <WelcomeAnimation
        isFirstTime={isFirstTime}
        username={initialization?.username}
        tier={initialization?.tier}
        onComplete={() => setShowWelcomeAnimation(false)}
        isVisible={showWelcomeAnimation}
      />
    </>
  );
};