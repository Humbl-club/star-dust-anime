import { useState, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useUserInitialization } from '@/hooks/useUserInitialization';
import { WelcomeAnimation } from '@/components/WelcomeAnimation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, AlertCircle, RefreshCw } from 'lucide-react';

interface InitializationWrapperProps {
  children: React.ReactNode;
}

export const InitializationWrapper = ({ children }: InitializationWrapperProps) => {
  const [showWelcome, setShowWelcome] = useState(false); // Start with false
  const { user } = useAuth();
  
  // Only run initialization logic for authenticated users
  const { 
    initialization, 
    isLoading, 
    isError, 
    isFirstTime,
    needsWelcome, 
    isInitialized,
    repairAccount,
    isRepairing
  } = useUserInitialization();

  // Debug logging for initialization state
  console.log('🔧 InitializationWrapper Debug:', {
    hasUser: !!user,
    showWelcome,
    isFirstTime,
    needsWelcome,
    isInitialized,
    shouldShowAnimation: showWelcome && (isFirstTime || needsWelcome),
    initialization: !!initialization,
    username: initialization?.username,
    tier: initialization?.tier
  });

  // Single welcome animation logic for both authenticated and unauthenticated users
  const handleTestAnimation = useCallback(() => {
    console.log('🎬 Test button clicked, setting showWelcome to true');
    setShowWelcome(true);
  }, []);

  const handleAnimationComplete = useCallback(() => {
    setShowWelcome(false);
  }, []);

  // If no user is authenticated, just render children with test button
  if (!user) {
    return (
      <>
        {children}
        {/* Test Animation Button - Always visible for testing */}
        {!showWelcome && (
          <button
            onClick={handleTestAnimation}
            className="fixed bottom-4 right-4 bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg shadow-lg z-50 text-sm font-semibold transition-colors"
          >
            🎬 Test Welcome Animation
          </button>
        )}
        {/* Single animation instance for unauthenticated users */}
        {showWelcome && (
          <WelcomeAnimation
            key="unauth-welcome"
            isFirstTime={true}
            username="TestUser"
            tier="LEGENDARY"
            onComplete={handleAnimationComplete}
            isVisible={showWelcome}
          />
        )}
      </>
    );
  }

  // Loading state (only for authenticated users)
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/5 flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Setting up your anime profile...</p>
        </div>
      </div>
    );
  }

  // Error state with repair option
  if (isError || !isInitialized) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/5 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center space-y-6">
            <div className="flex items-center justify-center">
              <div className="w-16 h-16 bg-orange-500/10 rounded-full flex items-center justify-center">
                <AlertCircle className="w-8 h-8 text-orange-500" />
              </div>
            </div>
            
            <div className="space-y-2">
              <h2 className="text-2xl font-bold">Setup Incomplete</h2>
              <p className="text-muted-foreground">
                There was an issue setting up your profile. Don't worry, we can fix this!
              </p>
            </div>

            <Button 
              onClick={() => repairAccount()}
              disabled={isRepairing}
              variant="hero"
              className="w-full"
            >
              {isRepairing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Fixing Account...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Fix My Account
                </>
              )}
            </Button>

            <p className="text-xs text-muted-foreground">
              This will assign you a username and set up your gamification profile.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <>
      {children}
      {/* Single animation instance for authenticated users */}
      {showWelcome && (
        <WelcomeAnimation
          key="auth-welcome"
          isFirstTime={isFirstTime || true} // Allow testing without real first-time state
          username={initialization?.username || "TestUser"} // Fallback for testing
          tier={initialization?.tier || "LEGENDARY"} // Fallback tier for testing
          onComplete={handleAnimationComplete}
          isVisible={showWelcome}
        />
      )}
      
      {/* Test Animation Button - Always visible for testing */}
      {!showWelcome && (
        <button
          onClick={handleTestAnimation}
          className="fixed bottom-4 right-4 bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg shadow-lg z-50 text-sm font-semibold transition-colors"
        >
          🎬 Test Welcome Animation
        </button>
      )}
    </>
  );
};