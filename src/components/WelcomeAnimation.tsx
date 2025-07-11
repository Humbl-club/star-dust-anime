import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { X, Sparkles } from 'lucide-react';

interface WelcomeAnimationProps {
  isFirstTime: boolean;
  username?: string;
  tier?: string;
  onComplete: () => void;
  isVisible: boolean;
}

export const WelcomeAnimation = ({ isFirstTime, username, tier, onComplete, isVisible }: WelcomeAnimationProps) => {
  const [step, setStep] = useState(0);
  const [searchBarPosition, setSearchBarPosition] = useState<{ top: number; height: number } | null>(null);

  useEffect(() => {
    if (!isVisible) {
      setStep(0);
      return;
    }

    // Find search bar position
    const findSearchBar = () => {
      // Look for the search container in hero section
      const heroSection = document.querySelector('section');
      const searchContainer = heroSection?.querySelector('[class*="glass-card"]');
      
      if (searchContainer) {
        const rect = searchContainer.getBoundingClientRect();
        setSearchBarPosition({
          top: rect.top + window.scrollY,
          height: rect.height
        });
      } else {
        // Fallback positioning
        setSearchBarPosition({ top: window.innerHeight * 0.5, height: 60 });
      }
    };

    findSearchBar();

    // Simple animation sequence
    const timeouts = [
      setTimeout(() => setStep(1), 300),  // Show popup
      setTimeout(() => setStep(2), 800),  // Show username
      setTimeout(() => setStep(3), 1300), // Show tier
      setTimeout(() => setStep(4), 1800), // Show thank you
      setTimeout(() => onComplete(), 4500) // Auto close
    ];

    return () => timeouts.forEach(clearTimeout);
  }, [isVisible, onComplete]);

  if (!isVisible || !searchBarPosition) return null;

  // Anime quotes for thank you message
  const animeQuotes = [
    "The journey of a thousand miles begins with a single step!",
    "Believe in yourself and create your own destiny!",
    "Every adventure starts with courage!",
    "Your story begins now!"
  ];
  
  const randomQuote = animeQuotes[Math.floor(Math.random() * animeQuotes.length)];

  // Calculate popup position to center it on the search bar
  const searchBarCenter = searchBarPosition.top + (searchBarPosition.height / 2);
  const popupTop = searchBarCenter - 200; // Center the popup (assuming popup height ~400px)

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
    >
      {/* Skip Button */}
      <Button
        onClick={onComplete}
        variant="ghost"
        size="sm"
        className="absolute top-6 right-6 text-white/70 hover:text-white hover:bg-white/10 z-60"
      >
        <X className="w-4 h-4" />
      </Button>

      {/* Main Popup - Positioned relative to search bar */}
      <AnimatePresence mode="wait">
        {step >= 1 && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0, y: -50 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: -50 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="absolute bg-gradient-to-br from-primary/20 to-secondary/20 backdrop-blur-md border border-white/20 rounded-2xl p-8 w-[90%] md:w-96 text-center shadow-2xl"
            style={{ 
              top: `${popupTop}px`,
              left: '50%',
              transform: 'translateX(-50%)'
            }}
          >
            {/* Welcome Header */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="mb-6"
            >
              <h1 className="text-3xl font-bold text-white mb-2">
                Welcome!
              </h1>
              <div className="flex justify-center">
                <Sparkles className="w-6 h-6 text-yellow-400 animate-pulse" />
              </div>
            </motion.div>

            {/* Username Reveal */}
            <AnimatePresence>
              {step >= 2 && username && (
                <motion.div
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", damping: 20, stiffness: 300 }}
                  className="mb-6"
                >
                  <p className="text-white/70 mb-2">Agent</p>
                  <div className="text-2xl font-bold text-white bg-white/10 rounded-lg py-3 px-4 border border-white/20">
                    {username}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Tier Badge */}
            <AnimatePresence>
              {step >= 3 && tier && (
                <motion.div
                  initial={{ rotate: -180, scale: 0, opacity: 0 }}
                  animate={{ rotate: 0, scale: 1, opacity: 1 }}
                  transition={{ type: "spring", damping: 15, stiffness: 200 }}
                  className="mb-6"
                >
                  <div className="inline-flex items-center gap-2 bg-gradient-to-r from-yellow-400/20 to-orange-400/20 border border-yellow-400/30 rounded-full px-4 py-2">
                    <Sparkles className="w-4 h-4 text-yellow-400" />
                    <span className="text-yellow-400 font-semibold">
                      {tier} Tier
                    </span>
                    <Sparkles className="w-4 h-4 text-yellow-400" />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Thank You Message */}
            <AnimatePresence>
              {step >= 4 && (
                <motion.div
                  initial={{ y: 30, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ type: "spring", damping: 25, stiffness: 300 }}
                  className="space-y-3"
                >
                  <p className="text-white font-medium">
                    {isFirstTime ? "Your adventure begins!" : "Welcome back!"}
                  </p>
                  <div className="text-sm text-white/70 italic border-l-2 border-white/20 pl-3">
                    "{randomQuote}"
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};