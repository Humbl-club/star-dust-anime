import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Crown, Gift, CheckCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface WelcomeAnimationProps {
  isFirstTime: boolean;
  username?: string;
  tier?: string;
  onComplete: () => void;
  isVisible: boolean;
}

export const WelcomeAnimation = ({ 
  isFirstTime, 
  username, 
  tier, 
  onComplete, 
  isVisible 
}: WelcomeAnimationProps) => {
  const [step, setStep] = useState(0);
  const [showComplete, setShowComplete] = useState(false);

  useEffect(() => {
    if (!isVisible) {
      return;
    }

    // Ultra-smooth 60fps animation using requestAnimationFrame
    const sequence = [
      () => setStep(1), // Welcome
      () => setStep(2), // Username assignment  
      () => setShowComplete(true) // Complete
    ];

    let animationIds: number[] = [];
    let startTime = performance.now();
    
    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const stepIndex = Math.floor(elapsed / 250); // 250ms per step
      
      if (stepIndex < sequence.length) {
        sequence[stepIndex]();
        startTime = currentTime;
        animationIds.push(requestAnimationFrame(animate));
      }
    };

    // Start immediately with first step
    setStep(1);
    animationIds.push(requestAnimationFrame(animate));

    return () => animationIds.forEach(id => cancelAnimationFrame(id));
  }, [isVisible]);

  const getTierColor = (tier?: string) => {
    switch (tier) {
      case 'GOD': return 'text-yellow-400';
      case 'LEGENDARY': return 'text-purple-400';
      case 'EPIC': return 'text-pink-400';
      case 'RARE': return 'text-blue-400';
      case 'UNCOMMON': return 'text-green-400';
      default: return 'text-gray-400';
    }
  };

  const getTierEmoji = (tier?: string) => {
    switch (tier) {
      case 'GOD': return '👑';
      case 'LEGENDARY': return '⭐';
      case 'EPIC': return '🔥';
      case 'RARE': return '💎';
      case 'UNCOMMON': return '✨';
      default: return '🌟';
    }
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, backdropFilter: 'blur(0px)' }}
          animate={{ opacity: 1, backdropFilter: 'blur(8px)' }}
          exit={{ opacity: 0, backdropFilter: 'blur(0px)' }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="fixed inset-0 z-50 bg-background/40 flex items-center justify-center p-4"
          style={{ willChange: 'opacity, backdrop-filter' }}
        >
          <AnimatePresence mode="wait">
            {step >= 1 && !showComplete && (
              <motion.div
                key="welcome"
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                transition={{ duration: 0.15, ease: [0.25, 0.46, 0.45, 0.94] }}
                className="text-center space-y-6"
                style={{ willChange: 'transform, opacity' }}
              >
                <Card className="glass-card border-primary/30 glow-card max-w-md overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-primary opacity-5" />
                  <CardContent className="relative p-8 space-y-6">
                    {step === 1 && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.15 }}
                        className="space-y-4"
                        style={{ willChange: 'transform, opacity' }}
                      >
                        <div className="flex justify-center">
                          <div className="p-4 gradient-primary rounded-full glow-primary">
                            <Sparkles className="w-8 h-8 text-primary-foreground animate-pulse" />
                          </div>
                        </div>
                        <div>
                          <h2 className="text-2xl font-bold text-gradient-primary mb-2">
                            Welcome to AniTracker!
                          </h2>
                          <p className="text-muted-foreground">
                            Let's set up your legendary anime profile...
                          </p>
                        </div>
                      </motion.div>
                    )}

                    {step === 2 && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.15 }}
                        className="space-y-4"
                        style={{ willChange: 'transform, opacity' }}
                      >
                        <div className="flex justify-center">
                          <div className="p-4 gradient-primary rounded-full glow-primary">
                            <Crown className="w-8 h-8 text-primary-foreground" />
                          </div>
                        </div>
                        <div>
                          <h2 className="text-xl font-bold mb-2 text-gradient-primary">Your Legendary Username</h2>
                          <div className="glass-card p-4 border border-primary/20 bg-gradient-primary/5">
                            <div className="flex items-center justify-center gap-2">
                              <span className="text-2xl">{getTierEmoji(tier)}</span>
                              <span className="text-xl font-bold text-gradient-primary">
                                {username}
                              </span>
                            </div>
                            <p className={`text-sm ${getTierColor(tier)} font-medium mt-1`}>
                              {tier} TIER
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {showComplete && (
              <motion.div
                key="complete"
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
                className="text-center space-y-6"
                style={{ willChange: 'transform, opacity' }}
              >
                <Card className="glass-card border-primary/30 glow-card max-w-md overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-primary opacity-5" />
                  <CardContent className="relative p-8 space-y-6">
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2 }}
                      className="space-y-6"
                      style={{ willChange: 'transform, opacity' }}
                    >
                      <div className="flex justify-center">
                        <div className="p-4 bg-green-500/20 rounded-full">
                          <CheckCircle className="w-8 h-8 text-green-500 animate-bounce-in" />
                        </div>
                      </div>
                      
                      <div>
                        <h2 className="text-2xl font-bold text-gradient-primary mb-2">
                          All Set!
                        </h2>
                        <p className="text-muted-foreground mb-6">
                          Your anime journey begins now. Ready to explore?
                        </p>
                        
                        <Button 
                          onClick={onComplete}
                          className="w-full glass-button gradient-primary hover:glow-primary transition-all duration-300 transform hover:scale-105"
                        >
                          Start Exploring
                        </Button>
                      </div>
                    </motion.div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
};