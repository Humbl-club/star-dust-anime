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
  const [currentQuote, setCurrentQuote] = useState(0);
  const [typewriterText, setTypewriterText] = useState('');

  // Legendary anime quotes
  const animeQuotes = [
    "Your anime journey begins now, protagonist!",
    "Every legend starts with a single episode!",
    "Believe in the me that believes in you!",
    "This is your story arc - make it legendary!",
    "The adventure of a lifetime awaits, chosen one!"
  ];

  // Typewriter effect for quotes
  useEffect(() => {
    if (step === 1) {
      const quote = animeQuotes[currentQuote];
      let currentChar = 0;
      setTypewriterText('');
      
      const typeInterval = setInterval(() => {
        if (currentChar <= quote.length) {
          setTypewriterText(quote.slice(0, currentChar));
          currentChar++;
        } else {
          clearInterval(typeInterval);
        }
      }, 50); // 50ms per character for smooth typewriter effect
      
      return () => clearInterval(typeInterval);
    }
  }, [step, currentQuote, animeQuotes]);

  useEffect(() => {
    if (!isVisible) {
      return;
    }

    // Ultra-smooth animation sequence with reliable setTimeout
    const timeouts: NodeJS.Timeout[] = [];
    
    // Step 1: Welcome with quote (1000ms)
    timeouts.push(setTimeout(() => {
      setStep(1);
      setCurrentQuote(Math.floor(Math.random() * animeQuotes.length));
    }, 100));
    
    // Step 2: Username assignment (600ms)  
    timeouts.push(setTimeout(() => setStep(2), 1100));
    
    // Step 3: Complete (400ms)
    timeouts.push(setTimeout(() => setShowComplete(true), 1700));

    return () => timeouts.forEach(clearTimeout);
  }, [isVisible, animeQuotes.length]);

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
          initial={{ opacity: 0, backdropFilter: 'blur(0px)', background: 'hsl(var(--background))' }}
          animate={{ opacity: 1, backdropFilter: 'blur(12px)', background: 'linear-gradient(135deg, hsl(var(--background) / 0.95), hsl(var(--primary) / 0.05), hsl(var(--accent) / 0.05))' }}
          exit={{ opacity: 0, backdropFilter: 'blur(0px)', background: 'hsl(var(--background))' }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="fixed inset-0 z-[200] flex items-start justify-center pt-20 md:pt-24 lg:pt-32 p-4"
          style={{ willChange: 'opacity, backdrop-filter, background' }}
        >
          <AnimatePresence mode="wait">
            {step >= 1 && !showComplete && (
              <motion.div
                key="welcome"
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                transition={{ duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
                className="text-center space-y-6"
                style={{ willChange: 'transform, opacity', background: 'transparent' }}
              >
                <Card className="glass-card border-primary/30 glow-card max-w-md overflow-hidden bg-background/95">
                  <div className="absolute inset-0 bg-gradient-primary opacity-10" />
                  <CardContent className="relative p-8 space-y-6 bg-transparent">
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
                          <h2 className="text-2xl font-bold text-gradient-primary mb-4">
                            Welcome, Protagonist!
                          </h2>
                          <div className="min-h-[60px] flex items-center justify-center">
                            <p className="text-lg text-muted-foreground font-medium leading-relaxed">
                              {typewriterText}
                              <span className="animate-pulse ml-1 text-primary">|</span>
                            </p>
                          </div>
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
                style={{ willChange: 'transform, opacity', background: 'transparent' }}
              >
                <Card className="glass-card border-primary/30 glow-card max-w-md overflow-hidden bg-background/95">
                  <div className="absolute inset-0 bg-gradient-primary opacity-10" />
                  <CardContent className="relative p-8 space-y-6 bg-transparent">
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
                          <motion.h2 
                            className="text-2xl font-bold text-gradient-primary mb-2"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                          >
                            🎉 All Set, Legend!
                          </motion.h2>
                          <motion.p 
                            className="text-muted-foreground mb-6"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 }}
                          >
                            Your anime destiny awaits. Time to become the protagonist of your own story!
                          </motion.p>
                          
                          <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.6, type: "spring", stiffness: 200 }}
                          >
                            <Button 
                              onClick={onComplete}
                              className="w-full glass-button gradient-primary hover:glow-primary transition-all duration-300 transform hover:scale-105 relative overflow-hidden"
                            >
                              <span className="relative z-10">Start Your Legend ✨</span>
                              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                            </Button>
                          </motion.div>
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