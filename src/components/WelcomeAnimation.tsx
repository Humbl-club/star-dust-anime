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
    if (!isVisible || !isFirstTime) {
      onComplete();
      return;
    }

    const sequence = [
      () => setStep(1), // Welcome
      () => setStep(2), // Username assignment
      () => setStep(3), // Starter bonus
      () => setShowComplete(true) // Complete
    ];

    let timeouts: NodeJS.Timeout[] = [];
    
    sequence.forEach((fn, index) => {
      const timeout = setTimeout(fn, (index + 1) * 2000);
      timeouts.push(timeout);
    });

    return () => timeouts.forEach(clearTimeout);
  }, [isVisible, isFirstTime, onComplete]);

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

  if (!isVisible || !isFirstTime) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <AnimatePresence mode="wait">
        {step >= 1 && !showComplete && (
          <motion.div
            key="welcome"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="text-center space-y-6"
          >
            <Card className="glass-card border border-primary/20 glow-card max-w-md">
              <CardContent className="p-8 space-y-6">
                {step === 1 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-4"
                  >
                    <div className="flex justify-center">
                      <div className="p-4 bg-gradient-primary rounded-full glow-primary">
                        <Sparkles className="w-8 h-8 text-primary-foreground" />
                      </div>
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-gradient-primary mb-2">
                        Welcome to Anithing!
                      </h2>
                      <p className="text-muted-foreground">
                        Let's set up your legendary anime profile...
                      </p>
                    </div>
                  </motion.div>
                )}

                {step === 2 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-4"
                  >
                    <div className="flex justify-center">
                      <div className="p-4 bg-gradient-primary rounded-full glow-primary">
                        <Crown className="w-8 h-8 text-primary-foreground" />
                      </div>
                    </div>
                    <div>
                      <h2 className="text-xl font-bold mb-2">Your Legendary Username</h2>
                      <div className="glass-card p-4 border border-primary/20">
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

                {step === 3 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-4"
                  >
                    <div className="flex justify-center">
                      <div className="p-4 bg-gradient-primary rounded-full glow-primary">
                        <Gift className="w-8 h-8 text-primary-foreground" />
                      </div>
                    </div>
                    <div>
                      <h2 className="text-xl font-bold mb-2">Starter Bonus!</h2>
                      <div className="space-y-2">
                        <div className="glass-card p-3 border border-primary/20">
                          <p className="text-sm text-muted-foreground">Starting Points</p>
                          <p className="text-lg font-bold text-gradient-primary">+100 Points</p>
                        </div>
                        <div className="glass-card p-3 border border-primary/20">
                          <p className="text-sm text-muted-foreground">Free Loot Box</p>
                          <p className="text-lg font-bold text-gradient-primary">Standard Box</p>
                        </div>
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
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="text-center space-y-6"
          >
            <Card className="glass-card border border-primary/20 glow-card max-w-md">
              <CardContent className="p-8 space-y-6">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6"
                >
                  <div className="flex justify-center">
                    <div className="p-4 bg-green-500/20 rounded-full">
                      <CheckCircle className="w-8 h-8 text-green-500" />
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
                      variant="hero"
                      className="w-full"
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
    </div>
  );
};