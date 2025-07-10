import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useUserInitialization } from '@/hooks/useUserInitialization';

interface WelcomeAnimationProps {
  isFirstTime: boolean;
  username?: string;
  tier?: string;
  onComplete: () => void;
  isVisible: boolean;
}

// Performance-optimized device capabilities detection
const useDeviceCapabilities = () => {
  const capabilities = useMemo(() => {
    if (typeof window === 'undefined') return {
      isMobile: false,
      isTablet: false,
      isDesktop: true,
      supportsHaptics: false,
      performanceLevel: 'high' as const,
      connectionSpeed: 'fast' as const
    };

    const width = window.innerWidth;
    const isMobile = width < 768;
    const isTablet = width >= 768 && width < 1024;
    const isDesktop = width >= 1024;
    
    // Performance detection with fallbacks
    const cores = navigator.hardwareConcurrency || 2;
    const memory = (navigator as any).deviceMemory || 4;
    let performanceLevel: 'low' | 'medium' | 'high' = 'high';
    
    if (cores < 4 || memory < 2 || isMobile) performanceLevel = 'low';
    else if (cores < 8 || memory < 4) performanceLevel = 'medium';
    
    // Connection speed detection with fallbacks
    const connection = (navigator as any).connection;
    let connectionSpeed: 'slow' | 'medium' | 'fast' = 'fast';
    if (connection?.effectiveType) {
      if (['slow-2g', '2g'].includes(connection.effectiveType)) {
        connectionSpeed = 'slow';
      } else if (connection.effectiveType === '3g') {
        connectionSpeed = 'medium';
      }
    }
    
    const supportsHaptics = 'vibrate' in navigator;
    
    return {
      isMobile,
      isTablet,
      isDesktop,
      supportsHaptics,
      performanceLevel,
      connectionSpeed
    };
  }, []);

  return capabilities;
};

// Optimized swipe gesture detection
const useSwipeGesture = (onSwipeUp: () => void, threshold = 50) => {
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    touchStartRef.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY
    };
  }, []);

  const handleTouchEnd = useCallback((e: TouchEvent) => {
    if (!touchStartRef.current) return;
    
    const touchEnd = {
      x: e.changedTouches[0].clientX,
      y: e.changedTouches[0].clientY
    };
    
    const deltaY = touchStartRef.current.y - touchEnd.y;
    const deltaX = Math.abs(touchStartRef.current.x - touchEnd.x);
    
    if (deltaY > threshold && deltaX < threshold) {
      onSwipeUp();
    }
    
    touchStartRef.current = null;
  }, [threshold, onSwipeUp]);

  useEffect(() => {
    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchend', handleTouchEnd, { passive: true });
    
    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchEnd]);
};

// Enhanced Stick Figure Secret Agent Component with Performance Optimization
const StickFigureAgent = ({ 
  phase, 
  reducedMotion, 
  performanceLevel 
}: { 
  phase: number; 
  reducedMotion: boolean;
  performanceLevel: 'low' | 'medium' | 'high';
}) => {
  const optimizedParticles = performanceLevel === 'low' ? 6 : performanceLevel === 'medium' ? 12 : 18;
  
  return (
    <motion.svg
      viewBox="0 0 800 400"
      className="w-full h-32 sm:h-48 lg:h-64 max-w-xs sm:max-w-md lg:max-w-2xl"
      style={{ 
        willChange: 'transform, opacity', 
        transform: 'translate3d(0, 0, 0)',
        contain: 'layout style paint'
      }}
    >
      {/* Agent Body with Enhanced Animations */}
      <motion.g
        initial={{ x: -100 }}
        animate={{
          x: phase >= 1 ? 350 : -100,
          rotate: phase === 3 ? [0, 10, -10, 0] : 0,
          y: phase === 1 && !reducedMotion ? [0, -5, 0] : 0 // Bounce effect
        }}
        transition={{
          x: { duration: reducedMotion ? 1.5 : 2.2, ease: "easeInOut" },
          rotate: { duration: 0.4, repeat: phase === 3 ? 2 : 0 },
          y: { duration: 0.3, repeat: phase === 1 ? Infinity : 0, ease: "easeInOut" }
        }}
      >
        {/* Head with micro-bounce */}
        <motion.circle 
          cx="40" cy="50" r="15" 
          fill="hsl(var(--foreground))" 
          stroke="hsl(var(--primary))" 
          strokeWidth="2"
          animate={{
            y: phase === 1 && !reducedMotion ? [0, -2, 0] : 0
          }}
          transition={{
            duration: 0.6,
            repeat: phase === 1 ? Infinity : 0,
            ease: "easeInOut"
          }}
        />
        
        {/* Enhanced Eyes with Better Tracking */}
        <motion.g
          animate={{
            x: phase === 3 ? [-2, 2, -2, 0] : 0,
            scaleY: phase === 3 && !reducedMotion ? [1, 0.2, 1] : 1 // Blink effect
          }}
          transition={{ 
            duration: 0.3, 
            repeat: phase === 3 ? 3 : 0,
            times: phase === 3 ? [0, 0.1, 0.2, 1] : undefined
          }}
        >
          <circle cx="35" cy="48" r="2" fill="hsl(var(--primary))" />
          <circle cx="45" cy="48" r="2" fill="hsl(var(--primary))" />
        </motion.g>

        {/* Body */}
        <line x1="40" y1="65" x2="40" y2="120" stroke="hsl(var(--foreground))" strokeWidth="3" />
        
        {/* Enhanced Arms with Physics */}
        <motion.line
          x1="40" y1="80" x2="20" y2="100"
          stroke="hsl(var(--foreground))" strokeWidth="3"
          animate={{ 
            rotate: phase === 2 ? [0, -30, -15, 0] : phase === 4 ? [0, -45, -30] : 0,
            scale: phase === 2 ? [1, 1.1, 1] : 1
          }}
          style={{ transformOrigin: "40px 80px" }}
          transition={{ duration: reducedMotion ? 0.3 : 0.5, ease: "easeOut" }}
        />
        <motion.line
          x1="40" y1="80" x2="60" y2="100"
          stroke="hsl(var(--foreground))" strokeWidth="3"
          animate={{ 
            rotate: phase === 2 ? [0, 30, 15, 0] : phase === 4 ? [0, 45, 30] : 0,
            scale: phase === 2 ? [1, 1.1, 1] : 1
          }}
          style={{ transformOrigin: "40px 80px" }}
          transition={{ duration: reducedMotion ? 0.3 : 0.5, delay: 0.1, ease: "easeOut" }}
        />
        
        {/* Enhanced Legs with Better Walking Physics */}
        <motion.line
          x1="40" y1="120" x2="25" y2="150"
          stroke="hsl(var(--foreground))" strokeWidth="3"
          animate={{
            rotate: phase === 1 ? [0, 20, -20, 0] : phase === 4 ? [0, 60, 0] : 0,
            scaleY: phase === 1 && !reducedMotion ? [1, 1.1, 1] : 1
          }}
          style={{ transformOrigin: "40px 120px" }}
          transition={{ 
            duration: phase === 1 ? 0.35 : 0.25, 
            repeat: phase === 1 ? Infinity : phase === 4 ? 4 : 0,
            ease: "easeInOut"
          }}
        />
        <motion.line
          x1="40" y1="120" x2="55" y2="150"
          stroke="hsl(var(--foreground))" strokeWidth="3"
          animate={{
            rotate: phase === 1 ? [0, -20, 20, 0] : phase === 4 ? [0, -60, 0] : 0,
            scaleY: phase === 1 && !reducedMotion ? [1, 1.1, 1] : 1
          }}
          style={{ transformOrigin: "40px 120px" }}
          transition={{ 
            duration: phase === 1 ? 0.35 : 0.25, 
            repeat: phase === 1 ? Infinity : phase === 4 ? 4 : 0,
            delay: phase === 1 ? 0.17 : 0,
            ease: "easeInOut"
          }}
        />
        
        {/* Enhanced Briefcase with Better Physics */}
        {phase < 3 && (
          <motion.g
            initial={{ x: 65, y: 95 }}
            animate={{ 
              x: phase === 2 ? 400 : 65,
              y: phase === 2 ? 200 : 95,
              rotate: phase === 2 ? [0, 180, 360] : 0,
              scale: phase === 2 ? [1, 0.8, 1.2, 1] : 1
            }}
            transition={{ 
              duration: phase === 2 ? (reducedMotion ? 0.8 : 1.2) : 0,
              ease: phase === 2 ? [0.25, 0.46, 0.45, 0.94] : "linear"
            }}
          >
            <rect x="0" y="0" width="25" height="15" rx="2" fill="hsl(var(--primary))" stroke="hsl(var(--border))" strokeWidth="1" />
            <line x1="3" y1="7" x2="22" y2="7" stroke="hsl(var(--muted-foreground))" strokeWidth="1" />
            <text x="12" y="4" fontSize="6" fill="hsl(var(--background))" textAnchor="middle">TOP</text>
            <text x="12" y="11" fontSize="6" fill="hsl(var(--background))" textAnchor="middle">SECRET</text>
            {/* Glow effect */}
            <motion.rect 
              x="-2" y="-2" width="29" height="19" rx="4" 
              fill="none" stroke="hsl(var(--primary))" strokeWidth="0.5" opacity="0.6"
              animate={{ 
                opacity: phase === 2 && !reducedMotion ? [0.6, 1, 0.6] : 0.6,
                scale: phase === 2 && !reducedMotion ? [1, 1.1, 1] : 1
              }}
              transition={{ duration: 0.5, repeat: phase === 2 ? 2 : 0 }}
            />
          </motion.g>
        )}

        {/* Speed Lines for Running */}
        {phase === 4 && !reducedMotion && (
          <motion.g
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 0], x: [-20, 0, 20] }}
            transition={{ duration: 0.4, repeat: Infinity }}
          >
            <line x1="-10" y1="70" x2="-30" y2="75" stroke="hsl(var(--primary))" strokeWidth="2" opacity="0.7" />
            <line x1="-5" y1="90" x2="-25" y2="95" stroke="hsl(var(--primary))" strokeWidth="2" opacity="0.5" />
            <line x1="-8" y1="110" x2="-28" y2="115" stroke="hsl(var(--primary))" strokeWidth="2" opacity="0.6" />
          </motion.g>
        )}
      </motion.g>

      {/* Enhanced Exit Animation with Speed Lines */}
      {phase === 4 && (
        <motion.g
          initial={{ x: 350 }}
          animate={{ x: 900 }}
          transition={{ duration: reducedMotion ? 1 : 1.2, ease: "easeIn" }}
        >
          <circle cx="40" cy="50" r="15" fill="hsl(var(--foreground))" stroke="hsl(var(--primary))" strokeWidth="2" />
          <circle cx="38" cy="48" r="2" fill="hsl(var(--primary))" />
          <circle cx="42" cy="48" r="2" fill="hsl(var(--primary))" />
          <line x1="40" y1="65" x2="35" y2="120" stroke="hsl(var(--foreground))" strokeWidth="3" />
          <line x1="40" y1="80" x2="15" y2="90" stroke="hsl(var(--foreground))" strokeWidth="3" />
          <line x1="40" y1="80" x2="60" y2="85" stroke="hsl(var(--foreground))" strokeWidth="3" />
          <line x1="35" y1="120" x2="10" y2="135" stroke="hsl(var(--foreground))" strokeWidth="3" />
          <line x1="35" y1="120" x2="65" y2="150" stroke="hsl(var(--foreground))" strokeWidth="3" />
          
          {/* Trailing speed lines */}
          {!reducedMotion && (
            <>
              <line x1="0" y1="70" x2="-40" y2="75" stroke="hsl(var(--primary))" strokeWidth="3" opacity="0.4" />
              <line x1="5" y1="90" x2="-35" y2="95" stroke="hsl(var(--primary))" strokeWidth="2" opacity="0.3" />
              <line x1="2" y1="110" x2="-38" y2="115" stroke="hsl(var(--primary))" strokeWidth="3" opacity="0.4" />
            </>
          )}
        </motion.g>
      )}
    </motion.svg>
  );
};

// Ultra-Cinematic Multi-Layered Explosion Effect
const ExplosionEffect = ({ 
  trigger, 
  reducedMotion, 
  performanceLevel,
  onScreenShake 
}: { 
  trigger: boolean; 
  reducedMotion: boolean;
  performanceLevel: 'low' | 'medium' | 'high';
  onScreenShake: () => void;
}) => {
  const particleCount = 
    performanceLevel === 'low' ? 8 : 
    performanceLevel === 'medium' ? 16 : 
    reducedMotion ? 12 : 32;
  
  const particles = Array.from({ length: particleCount }, (_, i) => i);
  const debris = Array.from({ length: performanceLevel === 'low' ? 2 : 4 }, (_, i) => i);
  
  useEffect(() => {
    if (trigger && !reducedMotion) {
      onScreenShake();
    }
  }, [trigger, reducedMotion, onScreenShake]);
  
  return (
    <AnimatePresence>
      {trigger && (
        <motion.div 
          className="absolute inset-0 pointer-events-none"
          style={{ 
            willChange: 'transform, opacity',
            transform: 'translate3d(0, 0, 0)',
            contain: 'layout style paint'
          }}
        >
          {/* Inner White-Hot Core */}
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ 
              opacity: [0, 1, 0.9, 0],
              scale: [0, 0.3, 1.5, 3]
            }}
            transition={{ duration: reducedMotion ? 0.6 : 1, times: [0, 0.1, 0.4, 1] }}
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-white rounded-full blur-sm"
            style={{ transform: 'translate3d(-50%, -50%, 0)' }}
          />
          
          {/* Yellow Burst Layer */}
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ 
              opacity: [0, 0.9, 0.7, 0],
              scale: [0, 0.5, 2, 4]
            }}
            transition={{ duration: reducedMotion ? 0.8 : 1.2, times: [0, 0.15, 0.5, 1], delay: 0.05 }}
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-24 h-24 bg-gradient-radial from-yellow-300 via-yellow-500 to-transparent rounded-full"
            style={{ transform: 'translate3d(-50%, -50%, 0)' }}
          />
          
          {/* Orange Shockwave */}
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ 
              opacity: [0, 0.8, 0.4, 0],
              scale: [0, 1, 3, 5]
            }}
            transition={{ duration: reducedMotion ? 0.9 : 1.4, times: [0, 0.2, 0.6, 1], delay: 0.1 }}
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-gradient-radial from-orange-400 via-orange-600 to-transparent rounded-full"
            style={{ transform: 'translate3d(-50%, -50%, 0)' }}
          />
          
          {/* Purple Sparkle Ring */}
          {performanceLevel !== 'low' && (
            <motion.div
              initial={{ opacity: 0, scale: 0, rotate: 0 }}
              animate={{ 
                opacity: [0, 0.7, 0],
                scale: [0, 2, 4],
                rotate: 360
              }}
              transition={{ duration: reducedMotion ? 1 : 1.6, delay: 0.15 }}
              className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-gradient-conic from-purple-400 via-pink-500 to-purple-400 rounded-full opacity-30"
              style={{ transform: 'translate3d(-50%, -50%, 0)' }}
            />
          )}
          
          {/* Multiple Shockwave Rings */}
          {[0, 1, 2].map(i => (
            <motion.div
              key={`shockwave-${i}`}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ 
                opacity: [0, 0.6 - i * 0.2, 0],
                scale: [0, 2 + i, 4 + i * 2]
              }}
              transition={{ 
                duration: reducedMotion ? 0.8 : 1.2, 
                delay: 0.1 + i * 0.1,
                ease: "easeOut"
              }}
              className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-20 h-20 border-2 rounded-full ${
                i === 0 ? 'border-orange-400' : 
                i === 1 ? 'border-red-400' : 
                'border-purple-400'
              }`}
              style={{ transform: 'translate3d(-50%, -50%, 0)' }}
            />
          ))}
          
          {/* Intense Screen Flash */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.7, 0.3, 0] }}
            transition={{ duration: 0.4, times: [0, 0.1, 0.3, 1] }}
            className="absolute inset-0 bg-white/50 rounded-lg backdrop-blur-sm"
          />
          
          {/* Enhanced Particles */}
          {particles.map((i) => {
            const angle = (i * 360 / particles.length) * Math.PI / 180;
            const distance = 100 + Math.random() * 80;
            return (
              <motion.div
                key={i}
                initial={{ 
                  x: "50%", 
                  y: "50%", 
                  scale: 0,
                  opacity: 1,
                  rotate: 0
                }}
                animate={{
                  x: `calc(50% + ${Math.cos(angle) * distance}px)`,
                  y: `calc(50% + ${Math.sin(angle) * distance}px)`,
                  scale: [0, 1.5, 0.5, 0],
                  opacity: [1, 0.9, 0.3, 0],
                  rotate: 360
                }}
                transition={{
                  duration: reducedMotion ? 1 : 1.8,
                  ease: "easeOut",
                  delay: i * 0.03
                }}
                className={`absolute w-2 h-2 sm:w-3 sm:h-3 ${
                  i % 3 === 0 ? 'bg-gradient-to-r from-yellow-400 to-orange-500' :
                  i % 3 === 1 ? 'bg-gradient-to-r from-orange-500 to-red-500' :
                  'bg-gradient-to-r from-purple-400 to-pink-500'
                } rounded-full`}
                style={{ transformOrigin: 'center' }}
              />
            );
          })}
          
          {/* Realistic Briefcase Debris with Physics */}
          {!reducedMotion && debris.map((i) => {
            const angle = (i * 90 + Math.random() * 45) * Math.PI / 180;
            const velocity = 80 + Math.random() * 40;
            const gravity = 0.5;
            
            return (
              <motion.div
                key={`debris-${i}`}
                initial={{ 
                  x: "50%", 
                  y: "50%", 
                  scale: 1,
                  opacity: 1,
                  rotate: 0
                }}
                animate={{
                  x: `calc(50% + ${Math.cos(angle) * velocity}px)`,
                  y: `calc(50% + ${Math.sin(angle) * velocity + gravity * 50}px)`,
                  scale: [1, 0.9, 0.7, 0],
                  opacity: [1, 0.8, 0.4, 0],
                  rotate: [0, 180 + i * 90, 360 + i * 180]
                }}
                transition={{
                  duration: reducedMotion ? 1 : 2,
                  ease: [0.25, 0.46, 0.45, 0.94],
                  delay: 0.15 + i * 0.05
                }}
                className={`absolute rounded-sm ${
                  i % 2 === 0 ? 'w-5 h-3 bg-gradient-to-r from-gray-700 to-gray-900' :
                  'w-3 h-4 bg-gradient-to-br from-primary/80 to-primary/40'
                }`}
                style={{ transform: 'translate3d(-50%, -50%, 0)' }}
              />
            );
          })}
          
          {/* Floating Sparkles */}
          {performanceLevel === 'high' && !reducedMotion && Array.from({ length: 8 }, (_, i) => (
            <motion.div
              key={`sparkle-${i}`}
              initial={{ 
                x: "50%", 
                y: "50%", 
                scale: 0,
                opacity: 0
              }}
              animate={{
                x: `calc(50% + ${(Math.random() - 0.5) * 200}px)`,
                y: `calc(50% + ${(Math.random() - 0.5) * 200}px)`,
                scale: [0, 1, 0],
                opacity: [0, 1, 0],
                rotate: [0, 180]
              }}
              transition={{
                duration: 1.5,
                ease: "easeOut",
                delay: 0.3 + i * 0.1
              }}
              className="absolute w-1 h-1 bg-yellow-400 rounded-full"
              style={{ transform: 'translate3d(-50%, -50%, 0)' }}
            />
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// Character-by-character reveal component
const CharacterReveal = ({ 
  text, 
  isVisible, 
  tier,
  delay = 0 
}: { 
  text: string; 
  isVisible: boolean; 
  tier?: string;
  delay?: number;
}) => {
  const [visibleChars, setVisibleChars] = useState(0);
  const reducedMotion = useReducedMotion();
  
  useEffect(() => {
    if (!isVisible) {
      setVisibleChars(0);
      return;
    }
    
    const timeout = setTimeout(() => {
      let current = 0;
      const interval = setInterval(() => {
        current++;
        setVisibleChars(current);
        
        if (current >= text.length) {
          clearInterval(interval);
        }
      }, reducedMotion ? 20 : 30);
      
      return () => clearInterval(interval);
    }, delay);
    
    return () => clearTimeout(timeout);
  }, [isVisible, text.length, delay, reducedMotion]);
  
  const getTierGradient = (tier?: string) => {
    switch (tier) {
      case 'GOD': return 'bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 bg-clip-text text-transparent';
      case 'LEGENDARY': return 'bg-gradient-to-r from-purple-400 via-purple-500 to-purple-600 bg-clip-text text-transparent';
      case 'EPIC': return 'bg-gradient-to-r from-pink-400 via-pink-500 to-pink-600 bg-clip-text text-transparent';
      case 'RARE': return 'bg-gradient-to-r from-blue-400 via-blue-500 to-blue-600 bg-clip-text text-transparent';
      case 'UNCOMMON': return 'bg-gradient-to-r from-green-400 via-green-500 to-green-600 bg-clip-text text-transparent';
      default: return 'text-foreground';
    }
  };
  
  return (
    <span className={getTierGradient(tier)}>
      {text.split('').map((char, index) => (
        <motion.span
          key={index}
          initial={{ opacity: 0, y: 20 }}
          animate={{
            opacity: index < visibleChars ? 1 : 0,
            y: index < visibleChars ? 0 : 20
          }}
          transition={{
            duration: 0.1,
            ease: "easeOut"
          }}
          style={{ display: 'inline-block' }}
        >
          {char === ' ' ? '\u00A0' : char}
        </motion.span>
      ))}
    </span>
  );
};

export const WelcomeAnimation = ({ 
  isFirstTime, 
  username: propUsername, 
  tier: propTier, 
  onComplete, 
  isVisible 
}: WelcomeAnimationProps) => {
  // Backend integration
  const { initialization, isInitialized } = useUserInitialization();
  
  // Use backend data if available, fall back to props
  const username = initialization?.username || propUsername || 'Unknown';
  const tier = initialization?.tier || propTier || 'COMMON';
  
  const [phase, setPhase] = useState(0);
  const [showExplosion, setShowExplosion] = useState(false);
  const [showUsername, setShowUsername] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [screenShake, setScreenShake] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showSkipHint, setShowSkipHint] = useState(false);
  const [animationStarted, setAnimationStarted] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number>();
  
  const reducedMotion = useReducedMotion();
  const capabilities = useDeviceCapabilities();
  
  // Performance-optimized timing calculation with slower, more cinematic timing
  const timingConfig = useMemo(() => {
    const baseScale = reducedMotion ? 0.3 : 
                     capabilities.performanceLevel === 'low' ? 0.5 : 
                     capabilities.connectionSpeed === 'slow' ? 0.6 : 1;
    
    // Slower, more cinematic timing (2-3x slower)
    const cinematicMultiplier = 2.5;
    
    return {
      scale: baseScale,
      totalDuration: reducedMotion ? 8 : capabilities.isMobile ? 15 : 18,
      baseTimings: {
        arrival: 500 * cinematicMultiplier,
        mission: 2200 * cinematicMultiplier,
        looking: 4500 * cinematicMultiplier,
        exit: 6800 * cinematicMultiplier,
        explosion: 8500 * cinematicMultiplier,
        username: 10500 * cinematicMultiplier,
        welcome: 12800 * cinematicMultiplier
      }
    };
  }, [reducedMotion, capabilities]);

  const journeyQuote = "The start of your anime journey begins now, chosen one!";

  // Enhanced skip functionality
  const handleSkip = useCallback(() => {
    if (capabilities.supportsHaptics) {
      navigator.vibrate?.(50);
    }
    onComplete();
  }, [capabilities.supportsHaptics, onComplete]);

  // Swipe to skip
  useSwipeGesture(handleSkip);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'Enter' || e.key === 'Escape') {
        e.preventDefault();
        handleSkip();
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [handleSkip]);

  // Screen shake handler
  const handleScreenShake = useCallback(() => {
    setScreenShake(true);
    setTimeout(() => setScreenShake(false), 400);
  }, []);

  // Optimized progress tracking with RAF
  useEffect(() => {
    if (!isVisible || !animationStarted) return;

    const updateProgress = () => {
      setProgress(prev => {
        const increment = 100 / (timingConfig.totalDuration * 60); // 60fps
        const newProgress = Math.min(prev + increment, 100);
        
        if (newProgress < 100) {
          animationFrameRef.current = requestAnimationFrame(updateProgress);
        }
        
        return newProgress;
      });
    };

    animationFrameRef.current = requestAnimationFrame(updateProgress);
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isVisible, animationStarted, timingConfig.totalDuration]);

  // Show skip hint after 2 seconds
  useEffect(() => {
    if (!isVisible) return;
    
    const timeout = setTimeout(() => {
      setShowSkipHint(true);
    }, 2000);

    return () => clearTimeout(timeout);
  }, [isVisible]);

  // Main animation sequence with cleanup
  useEffect(() => {
    if (!isVisible) {
      // Reset state when not visible
      setPhase(0);
      setShowExplosion(false);
      setShowUsername(false);
      setShowWelcome(false);
      setScreenShake(false);
      setProgress(0);
      setShowSkipHint(false);
      setAnimationStarted(false);
      return;
    }

    setAnimationStarted(true);
    const timeouts: NodeJS.Timeout[] = [];
    const { scale, baseTimings } = timingConfig;
    
    // Optimized animation sequence
    timeouts.push(setTimeout(() => setPhase(1), baseTimings.arrival));
    timeouts.push(setTimeout(() => setPhase(2), baseTimings.mission * scale));
    timeouts.push(setTimeout(() => setPhase(3), baseTimings.looking * scale));
    timeouts.push(setTimeout(() => setPhase(4), baseTimings.exit * scale));
    timeouts.push(setTimeout(() => setShowExplosion(true), baseTimings.explosion * scale));
    timeouts.push(setTimeout(() => setShowUsername(true), baseTimings.username * scale));
    timeouts.push(setTimeout(() => setShowWelcome(true), baseTimings.welcome * scale));

    return () => {
      timeouts.forEach(clearTimeout);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isVisible, timingConfig]);

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
        <>
          {/* Full-screen backdrop with blur and darkening */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="fixed inset-0 bg-background/90 backdrop-blur-lg z-[9998]"
            style={{
              backdropFilter: 'blur(12px) saturate(180%)',
              WebkitBackdropFilter: 'blur(12px) saturate(180%)'
            }}
            onClick={(e) => e.stopPropagation()}
          />
          
          {/* Main animation container - Fixed overlay positioned at top */}
          <motion.div
            ref={containerRef}
            initial={{ opacity: 0, y: -30, scale: 0.95 }}
            animate={{ 
              opacity: 1, 
              y: 0,
              scale: 1,
              x: screenShake && !reducedMotion ? [0, -4, 4, -2, 2, 0] : 0
            }}
            exit={{ opacity: 0, y: -30, scale: 0.95 }}
            transition={{ 
              duration: 0.8, 
              ease: 'easeOut',
              x: { duration: 0.4, times: [0, 0.15, 0.3, 0.6, 0.8, 1] }
            }}
            className="fixed inset-0 z-[9999] flex flex-col items-center justify-center px-4 overflow-hidden"
            style={{ 
              willChange: 'transform, opacity',
              transform: 'translate3d(0, 0, 0)',
              contain: 'layout style paint',
              isolation: 'isolate',
              overscrollBehavior: 'none'
            }}
            onWheel={(e) => e.preventDefault()}
            onTouchMove={(e) => e.preventDefault()}
          >
          {/* Performance-Optimized Progress Indicator */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: showSkipHint ? 1 : 0, y: showSkipHint ? 0 : -10 }}
            className="absolute top-2 left-4 right-4 z-10 backdrop-blur-sm"
          >
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
              <span>Animation Progress</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress 
              value={progress} 
              className="h-1 bg-background/50" 
              style={{ contain: 'layout style' }}
            />
          </motion.div>

          {/* Enhanced Skip Hints with Backend Integration */}
          <AnimatePresence>
            {showSkipHint && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="absolute top-8 right-8 z-10"
              >
                <Card className="bg-background/95 backdrop-blur-sm border-primary/20 shadow-lg">
                  <CardContent className="p-3 text-center">
                    <p className="text-xs text-muted-foreground mb-1">Skip animation:</p>
                    <div className="flex flex-wrap gap-1 text-xs">
                      <span className="px-2 py-1 bg-muted rounded transition-colors hover:bg-muted/80">Space</span>
                      <span className="px-2 py-1 bg-muted rounded transition-colors hover:bg-muted/80">Enter</span>
                      {capabilities.isMobile && (
                        <span className="px-2 py-1 bg-muted rounded transition-colors hover:bg-muted/80">Swipe up</span>
                      )}
                    </div>
                    {isInitialized && (
                      <p className="text-xs text-primary/80 mt-1">Welcome back, {username}!</p>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* Main Animation Container with Perfect Centering */}
          <div className="relative w-full max-w-xs sm:max-w-md lg:max-w-2xl h-48 sm:h-64 lg:h-80 flex items-center justify-center mb-8"
               style={{ contain: 'layout style' }}>
            {/* Enhanced Stick Figure Animation */}
            {phase >= 1 && phase <= 4 && (
              <StickFigureAgent 
                phase={phase} 
                reducedMotion={reducedMotion} 
                performanceLevel={capabilities.performanceLevel}
              />
            )}
            
            {/* Ultra-Cinematic Explosion Effect */}
            <ExplosionEffect 
              trigger={showExplosion} 
              reducedMotion={reducedMotion}
              performanceLevel={capabilities.performanceLevel}
              onScreenShake={handleScreenShake}
            />
            
            {/* Username Reveal */}
            <AnimatePresence>
              {showUsername && (
                <motion.div
                  initial={{ opacity: 0, scale: 0, y: 50 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ 
                    type: "spring", 
                    stiffness: 200, 
                    damping: 15,
                    delay: 0.5 
                  }}
                  className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
                >
                  <Card className="glass-card border-primary/30 glow-card bg-background/95 backdrop-blur-lg">
                    <CardContent className="p-6 text-center">
                      <motion.div 
                        className="flex items-center justify-center gap-3 mb-2"
                        animate={{
                          y: capabilities.performanceLevel === 'high' && !reducedMotion ? [0, -2, 0] : 0
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          ease: "easeInOut"
                        }}
                      >
                        <motion.span 
                          className="text-4xl"
                          animate={{
                            scale: capabilities.performanceLevel === 'high' && !reducedMotion ? [1, 1.1, 1] : 1,
                            rotate: capabilities.performanceLevel === 'high' && !reducedMotion ? [0, 5, -5, 0] : 0
                          }}
                          transition={{
                            duration: 3,
                            repeat: Infinity,
                            ease: "easeInOut"
                          }}
                        >
                          {getTierEmoji(tier)}
                        </motion.span>
                        <div className="text-2xl font-bold">
                          <CharacterReveal 
                            text={username}
                            isVisible={showUsername}
                            tier={tier}
                          />
                        </div>
                      </motion.div>
                      <div className={`text-sm ${getTierColor(tier)} font-medium`}>
                        <CharacterReveal 
                          text={`${tier} TIER`}
                          isVisible={showUsername}
                          delay={500}
                        />
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>
            
          </div>
          
          {/* Enhanced Welcome Message */}
          <AnimatePresence>
            {showWelcome && (
              <motion.div
                initial={{ opacity: 0, y: 30, scale: 0.9 }}
                animate={{ 
                  opacity: 1, 
                  y: 0, 
                  scale: 1,
                  rotateX: capabilities.performanceLevel === 'high' && !reducedMotion ? [0, 2, -2, 0] : 0
                }}
                transition={{ 
                  type: "spring", 
                  stiffness: 150, 
                  damping: 12,
                  delay: 0.8,
                  rotateX: {
                    duration: 4,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }
                }}
                className="mt-8 text-center max-w-lg"
                style={{ perspective: '1000px' }}
              >
                <Card className="glass-card border-primary/20 bg-background/95 backdrop-blur-lg shadow-2xl">
                  <CardContent className="p-6">
                    <motion.h2 
                      className="text-xl font-semibold mb-4"
                      animate={{
                        backgroundPosition: capabilities.performanceLevel === 'high' && !reducedMotion ? ['0%', '100%'] : ['0%']
                      }}
                      transition={{
                        duration: 3,
                        repeat: Infinity,
                        ease: "linear"
                      }}
                      style={{
                        background: 'linear-gradient(90deg, hsl(var(--primary)), hsl(var(--primary-foreground)), hsl(var(--primary)))',
                        backgroundSize: '200% 100%',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text'
                      }}
                    >
                      <CharacterReveal 
                        text={`Welcome to your anime adventure, ${username}!`}
                        isVisible={showWelcome}
                        tier={tier}
                      />
                    </motion.h2>
                    
                    <div className="text-lg leading-relaxed text-foreground mb-6 font-medium">
                      <CharacterReveal 
                        text={journeyQuote}
                        isVisible={showWelcome}
                        delay={1000}
                      />
                    </div>
                    
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 2.5, type: "spring", stiffness: 200 }}
                    >
                      <Button 
                        onClick={handleSkip}
                        className="w-full sm:w-auto px-8 py-3 text-lg font-medium bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl"
                        style={{ willChange: 'transform' }}
                      >
                        Begin Your Journey! 🚀
                      </Button>
                    </motion.div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};