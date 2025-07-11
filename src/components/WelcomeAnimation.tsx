import { useState, useEffect, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';

interface WelcomeAnimationProps {
  isFirstTime: boolean;
  username?: string;
  tier?: string;
  onComplete: () => void;
  isVisible: boolean;
}

// Simple positioning hook
const usePositioning = () => {
  return useMemo(() => {
    const width = typeof window !== 'undefined' ? window.innerWidth : 1024;
    const height = typeof window !== 'undefined' ? window.innerHeight : 768;
    
    return {
      entryX: -100,
      centerX: width / 2 - 50,
      centerY: height / 2,
      exitX: width + 100,
      briefcaseX: width / 2 - 15,
      briefcaseY: height / 2 - 10,
      figureScale: width < 768 ? 0.6 : 1
    };
  }, []);
};

// Secret Agent Animation Component
const SecretAgentWithBriefcase = ({ 
  phase, 
  positioning 
}: { 
  phase: number; 
  positioning: any;
}) => {
  const { entryX, centerX, centerY, exitX, figureScale, briefcaseX, briefcaseY } = positioning;
  
  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Secret Agent Figure */}
      <motion.div
        className="absolute"
        style={{
          left: 0,
          top: centerY,
          transform: `scale(${figureScale})`,
          zIndex: 10
        }}
        initial={{ x: entryX }}
        animate={{
          x: phase === 1 ? centerX - 50 : 
             phase === 2 ? centerX - 50 : 
             phase === 3 ? centerX - 50 : 
             phase === 4 ? exitX : entryX
        }}
        transition={{
          duration: phase === 1 ? 2 : phase === 4 ? 1.5 : 0.5,
          ease: phase === 4 ? "easeIn" : "easeOut"
        }}
      >
        <svg viewBox="0 0 100 100" className="w-24 h-24">
          {/* Head */}
          <circle 
            cx="50" cy="20" r="8" 
            fill="hsl(var(--foreground))" 
            stroke="hsl(var(--primary))" 
            strokeWidth="1.5"
          />
          
          {/* Hat */}
          <ellipse cx="50" cy="16" rx="12" ry="3" fill="hsl(var(--muted-foreground))" />
          <ellipse cx="50" cy="14" rx="8" ry="4" fill="hsl(var(--muted-foreground))" />
          
          {/* Sunglasses */}
          <rect x="45" y="17" width="4" height="3" rx="1.5" fill="hsl(var(--muted-foreground))" opacity="0.8" />
          <rect x="51" y="17" width="4" height="3" rx="1.5" fill="hsl(var(--muted-foreground))" opacity="0.8" />
          <line x1="49" y1="18.5" x2="51" y2="18.5" stroke="hsl(var(--muted-foreground))" strokeWidth="0.5" />

          {/* Body */}
          <line x1="50" y1="28" x2="50" y2="60" stroke="hsl(var(--foreground))" strokeWidth="3" />
          
          {/* Arms */}
          <line x1="50" y1="35" x2="35" y2="45" stroke="hsl(var(--foreground))" strokeWidth="2" />
          <line x1="50" y1="35" x2="65" y2="45" stroke="hsl(var(--foreground))" strokeWidth="2" />
          
          {/* Legs */}
          <motion.line
            x1="50" y1="60" x2="40" y2="80"
            stroke="hsl(var(--foreground))" strokeWidth="2"
            animate={{
              rotate: phase === 1 || phase === 4 ? [0, 15, -15, 0] : 0
            }}
            style={{ transformOrigin: "50px 60px" }}
            transition={{ 
              duration: 0.4, 
              repeat: (phase === 1 || phase === 4) ? Infinity : 0,
              ease: "easeInOut"
            }}
          />
          <motion.line
            x1="50" y1="60" x2="60" y2="80"
            stroke="hsl(var(--foreground))" strokeWidth="2"
            animate={{
              rotate: phase === 1 || phase === 4 ? [0, -15, 15, 0] : 0
            }}
            style={{ transformOrigin: "50px 60px" }}
            transition={{ 
              duration: 0.4, 
              repeat: (phase === 1 || phase === 4) ? Infinity : 0,
              delay: 0.2,
              ease: "easeInOut"
            }}
          />

          {/* Briefcase (carried until phase 2) */}
          {phase < 2 && (
            <motion.g
              initial={{ x: 70, y: 40 }}
              animate={{ 
                y: phase === 1 ? [40, 38, 40] : 40
              }}
              transition={{
                duration: 0.6,
                repeat: phase === 1 ? Infinity : 0,
                ease: "easeInOut"
              }}
            >
              <rect x="0" y="0" width="12" height="8" rx="1" fill="hsl(var(--primary))" stroke="hsl(var(--border))" strokeWidth="0.5" />
              <text x="6" y="3" fontSize="2" fill="hsl(var(--background))" textAnchor="middle">TOP</text>
              <text x="6" y="6" fontSize="2" fill="hsl(var(--background))" textAnchor="middle">SECRET</text>
            </motion.g>
          )}
        </svg>
      </motion.div>

      {/* Briefcase Deposit Animation */}
      {phase >= 2 && (
        <motion.div
          className="absolute"
          style={{
            left: briefcaseX,
            top: briefcaseY,
            zIndex: 5
          }}
          initial={{ 
            scale: 0, 
            rotate: 0,
            x: centerX - briefcaseX - 50,
            y: 0
          }}
          animate={{ 
            scale: phase >= 2 ? 1 : 0,
            rotate: phase === 2 ? [0, 360, 720, 360] : 0,
            x: 0,
            y: phase === 2 ? [0, -20, 0] : 0
          }}
          transition={{ 
            duration: phase === 2 ? 2 : 0.5,
            ease: "easeOut",
            scale: { delay: phase === 2 ? 0.5 : 0 }
          }}
        >
          <div className="relative">
            <svg viewBox="0 0 30 20" className="w-8 h-6">
              <rect x="0" y="0" width="30" height="20" rx="2" fill="hsl(var(--primary))" stroke="hsl(var(--border))" strokeWidth="1" />
              <line x1="3" y1="10" x2="27" y2="10" stroke="hsl(var(--muted-foreground))" strokeWidth="0.5" />
              <text x="15" y="7" fontSize="4" fill="hsl(var(--background))" textAnchor="middle">TOP</text>
              <text x="15" y="15" fontSize="4" fill="hsl(var(--background))" textAnchor="middle">SECRET</text>
            </svg>
            
            {/* Glow effect */}
            <motion.div
              className="absolute inset-0 bg-primary/20 rounded blur-sm"
              animate={{ 
                opacity: phase >= 2 ? [0.4, 0.8, 0.4] : 0.4,
                scale: phase >= 2 ? [1, 1.2, 1] : 1
              }}
              transition={{ duration: 1.5, repeat: phase >= 2 ? Infinity : 0 }}
            />
          </div>
        </motion.div>
      )}
    </div>
  );
};

export const WelcomeAnimation = ({ 
  isFirstTime, 
  username = "Agent", 
  tier = "COMMON", 
  onComplete, 
  isVisible 
}: WelcomeAnimationProps) => {
  // Simplified state management
  const [phase, setPhase] = useState(0);
  const [showText, setShowText] = useState(false);
  const [skipRequested, setSkipRequested] = useState(false);
  
  const positioning = usePositioning();

  // Simple effect to start animation when visible
  useEffect(() => {
    if (!isVisible) {
      setPhase(0);
      setShowText(false);
      setSkipRequested(false);
      return;
    }

    if (skipRequested) {
      onComplete();
      return;
    }

    // Start animation sequence immediately
    const timeouts: NodeJS.Timeout[] = [];
    
    // Fast timing for testing
    timeouts.push(setTimeout(() => setPhase(1), 500));      // Agent entry
    timeouts.push(setTimeout(() => setPhase(2), 1000));     // Briefcase deposit  
    timeouts.push(setTimeout(() => setPhase(3), 1500));     // Surveillance
    timeouts.push(setTimeout(() => setPhase(4), 2000));     // Agent exit
    timeouts.push(setTimeout(() => setShowText(true), 2500)); // Show text
    timeouts.push(setTimeout(() => onComplete(), 4000));    // Complete

    return () => timeouts.forEach(clearTimeout);
  }, [isVisible, skipRequested, onComplete]);

  // Skip animation handler
  const handleSkipAnimation = useCallback(() => {
    setSkipRequested(true);
  }, []);

  // Early return if not visible
  if (!isVisible) return null;

  return createPortal(
    <AnimatePresence mode="wait">
      {isVisible && (
        <motion.div
          className="fixed inset-0 bg-black/90 backdrop-blur-lg z-[100] overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Skip Button */}
          <Button
            onClick={handleSkipAnimation}
            variant="ghost"
            className="absolute top-6 right-6 z-[110] bg-white/10 hover:bg-white/20 text-white border border-white/20"
          >
            Skip Animation
          </Button>

          {/* Phase Debug */}
          <div className="absolute top-6 left-6 z-[110] bg-black/70 text-white p-4 rounded-lg text-sm">
            <div>Phase: {phase}</div>
            <div>Show Text: {showText ? '✓' : '✗'}</div>
            <div>Visible: {isVisible ? '✓' : '✗'}</div>
          </div>

          {/* Secret Agent Animation */}
          <SecretAgentWithBriefcase 
            phase={phase}
            positioning={positioning}
          />

          {/* Text Display */}
          <AnimatePresence>
            {showText && (
              <motion.div
                className="absolute inset-0 flex flex-col items-center justify-center z-[105]"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.6 }}
              >
                <div className="text-center space-y-6 bg-black/80 backdrop-blur-sm p-8 rounded-2xl border border-white/20 max-w-lg">
                  <motion.div
                    className="text-5xl font-bold bg-gradient-to-r from-orange-400 to-orange-600 bg-clip-text text-transparent"
                    initial={{ y: 20 }}
                    animate={{ y: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    {username}
                  </motion.div>
                  <motion.div
                    className="text-xl text-orange-300 uppercase tracking-wider"
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.4 }}
                  >
                    {tier} Agent
                  </motion.div>
                  <motion.div
                    className="text-lg text-white"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6 }}
                  >
                    Welcome to Your Secret Mission
                  </motion.div>
                  <motion.div
                    className="text-base text-orange-300/80"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8 }}
                  >
                    {isFirstTime ? "Your briefing has been delivered." : "Mission briefing updated."}
                  </motion.div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
};