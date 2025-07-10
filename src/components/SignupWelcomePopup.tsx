import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Heart, Star } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface SignupWelcomePopupProps {
  isVisible: boolean;
  onComplete: () => void;
}

const ANIME_QUOTES = [
  "Welcome to your anime journey! Every great adventure begins with a single step.",
  "Thank you for joining us! Like Goku's power level, your anime list is about to grow!",
  "Your anime adventure starts now! Remember, even Naruto started as a nobody.",
  "Welcome aboard! Time to discover your next favorite anime, dattebayo!",
  "Thank you for signing up! Your anime journey will be... PLUS ULTRA!",
  "Welcome to the anime universe! May your journey be as epic as a Studio Ghibli film.",
  "Thank you for joining! Together we'll explore worlds beyond imagination.",
  "Your anime adventure begins! Like Luffy's dream, reach for the impossible!",
  "Welcome! Time to catch 'em all... anime series, that is!",
  "Thank you for signing up! Your otaku journey starts with a single click."
];

export const SignupWelcomePopup = ({ isVisible, onComplete }: SignupWelcomePopupProps) => {
  const [quote] = useState(() => ANIME_QUOTES[Math.floor(Math.random() * ANIME_QUOTES.length)]);

  console.log('SignupWelcomePopup rendered with isVisible:', isVisible);

  useEffect(() => {
    if (isVisible) {
      console.log('Welcome popup is visible, setting 3 second timer');
      const timer = setTimeout(() => {
        console.log('Timer completed, calling onComplete');
        onComplete();
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [isVisible, onComplete]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 50 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: -50 }}
          transition={{ 
            type: "spring", 
            damping: 25, 
            stiffness: 300,
            duration: 0.5 
          }}
          className="relative"
        >
          {/* Animated background glow */}
          <motion.div
            className="absolute -inset-4 bg-gradient-to-r from-primary/20 via-secondary/20 to-accent/20 rounded-2xl blur-xl"
            animate={{ 
              opacity: [0.5, 0.8, 0.5],
              scale: [1, 1.05, 1]
            }}
            transition={{ 
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
          
          <Card className="relative glass-card border border-primary/30 shadow-2xl max-w-md w-full">
            <CardContent className="p-8 text-center space-y-6">
              {/* Animated icon */}
              <motion.div
                className="flex justify-center"
                animate={{ 
                  rotate: [0, 360],
                  scale: [1, 1.1, 1]
                }}
                transition={{ 
                  rotate: { duration: 3, repeat: Infinity, ease: "linear" },
                  scale: { duration: 2, repeat: Infinity, ease: "easeInOut" }
                }}
              >
                <div className="relative p-4 bg-gradient-to-r from-primary to-secondary rounded-full">
                  <Sparkles className="w-8 h-8 text-primary-foreground" />
                  
                  {/* Floating sparkles */}
                  <motion.div
                    className="absolute -top-2 -right-2"
                    animate={{ 
                      y: [-5, -15, -5],
                      opacity: [0, 1, 0]
                    }}
                    transition={{ 
                      duration: 1.5,
                      repeat: Infinity,
                      delay: 0.5
                    }}
                  >
                    <Star className="w-4 h-4 text-yellow-400" />
                  </motion.div>
                  
                  <motion.div
                    className="absolute -bottom-2 -left-2"
                    animate={{ 
                      y: [5, 15, 5],
                      opacity: [0, 1, 0]
                    }}
                    transition={{ 
                      duration: 1.5,
                      repeat: Infinity,
                      delay: 1
                    }}
                  >
                    <Heart className="w-4 h-4 text-pink-400" />
                  </motion.div>
                </div>
              </motion.div>

              {/* Welcome text */}
              <motion.div
                className="space-y-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <h2 className="text-2xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
                  Thank You for Joining!
                </h2>
                
                <motion.p 
                  className="text-muted-foreground leading-relaxed"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                >
                  {quote}
                </motion.p>
                
                <motion.div
                  className="text-sm text-muted-foreground/80"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                >
                  Please check your email to verify your account
                </motion.div>
              </motion.div>

              {/* Progress indicator */}
              <motion.div
                className="w-full bg-muted/30 rounded-full h-1 overflow-hidden"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
              >
                <motion.div
                  className="h-full bg-gradient-to-r from-primary to-secondary"
                  initial={{ width: "0%" }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 3, ease: "easeInOut" }}
                />
              </motion.div>
            </CardContent>
          </Card>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};