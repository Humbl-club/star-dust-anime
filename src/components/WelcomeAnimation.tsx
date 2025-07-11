import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useUserInitialization } from '@/hooks/useUserInitialization';

interface WelcomeAnimationProps {
  isFirstTime: boolean;
  username?: string;
  tier?: string;
  onComplete: () => void;
  isVisible: boolean;
}

// Search bar targeting hook
const useSearchBarTargeting = () => {
  const [dimensions, setDimensions] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1024,
    height: typeof window !== 'undefined' ? window.innerHeight : 768,
    isMobile: false,
    isTablet: false,
    isDesktop: true
  });

  const [searchBarPosition, setSearchBarPosition] = useState({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
    found: false
  });

  useEffect(() => {
    const updateDimensions = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const isMobile = width < 768;
      const isTablet = width >= 768 && width < 1024;
      const isDesktop = width >= 1024;

      setDimensions({ width, height, isMobile, isTablet, isDesktop });
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  // Find search bar position with enhanced detection
  useEffect(() => {
    const findSearchBar = () => {
      // Multiple selectors to find the search input
      const selectors = [
        '[contenteditable="true"]', // SearchInput component uses contenteditable
        'input[type="text"]',
        'input[placeholder*="Search"]',
        '[placeholder*="anime"]',
        '.search-input',
        '[data-search="true"]'
      ];

      let searchElement: Element | null = null;
      
      for (const selector of selectors) {
        searchElement = document.querySelector(selector);
        if (searchElement) break;
      }

      if (searchElement) {
        const rect = searchElement.getBoundingClientRect();
        setSearchBarPosition({
          x: rect.left,
          y: rect.top,
          width: rect.width,
          height: rect.height,
          found: true
        });
      } else {
        // Fallback to center if search bar not found
        setSearchBarPosition({
          x: dimensions.width / 2,
          y: dimensions.height / 2,
          width: 300,
          height: 40,
          found: false
        });
      }
    };

    // Initial search
    const initialTimeout = setTimeout(findSearchBar, 100);
    
    // Update on resize
    const resizeTimeout = setTimeout(findSearchBar, 200);
    
    // Retry finding search bar periodically (in case it loads later)
    const retryInterval = setInterval(findSearchBar, 1000);
    
    return () => {
      clearTimeout(initialTimeout);
      clearTimeout(resizeTimeout);
      clearInterval(retryInterval);
    };
  }, [dimensions.width, dimensions.height]);

  // Calculate responsive entry/exit points and figure size relative to search bar
  const positioning = useMemo(() => {
    const { width, height, isMobile, isTablet } = dimensions;
    const { x: searchX, y: searchY, width: searchWidth, height: searchHeight, found } = searchBarPosition;
    
    // Entry point (left side)
    const entryX = -100;
    
    // Target point for briefcase deposit (search bar center)
    const targetX = found ? searchX + (searchWidth / 2) - 50 : width / 2 - 50; // Adjust for figure width
    const targetY = found ? searchY + (searchHeight / 2) : height * 0.6; // Position at search bar center
    
    // Exit point (right side)
    const exitX = width + 100;
    
    // Figure scale based on screen size
    const figureScale = isMobile ? 0.6 : isTablet ? 0.8 : 1;
    
    // Briefcase position (at search bar center)
    const briefcaseX = found ? searchX + (searchWidth / 2) - 15 : width / 2 - 15; // Adjust for briefcase width
    const briefcaseY = found ? searchY + (searchHeight / 2) - 10 : height / 2 - 10; // Adjust for briefcase height

    return {
      entryX,
      centerX: targetX, // Rename for compatibility
      centerY: targetY, // Rename for compatibility
      exitX,
      figureScale,
      briefcaseX,
      briefcaseY,
      screenWidth: width,
      screenHeight: height,
      searchBarFound: found,
      searchBarRect: { x: searchX, y: searchY, width: searchWidth, height: searchHeight }
    };
  }, [dimensions, searchBarPosition]);

  return { dimensions, positioning };
};

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

// Enhanced Secret Agent with Briefcase Deposit Animation
const SecretAgentWithBriefcase = ({ 
  phase, 
  reducedMotion, 
  performanceLevel,
  positioning 
}: { 
  phase: number; 
  reducedMotion: boolean;
  performanceLevel: 'low' | 'medium' | 'high';
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
          x: phase === 1 ? centerX - 50 : // Enter and stop before center
             phase === 2 ? centerX - 50 : // Stay in position during deposit
             phase === 3 ? centerX - 50 : // Head turn position
             phase === 4 ? exitX : entryX  // Exit fast and completely off screen
        }}
        transition={{
          duration: phase === 1 ? 3 : phase === 4 ? 1.5 : 0.5, // Faster exit
          ease: phase === 4 ? "easeIn" : "easeOut"
        }}
      >
        <svg
          viewBox="0 0 100 100"
          className="w-24 h-24"
          style={{ 
            willChange: 'transform, opacity',
            contain: 'layout style paint'
          }}
        >
          {/* Head with spy hat */}
          <motion.g
            animate={{
              y: phase === 1 && !reducedMotion ? [0, -1, 0] : 0,
              // Enhanced head turning sequence for surveillance
              rotateZ: phase === 1 || phase === 2 ? [0, -15, 15, -10, 10, 0] : 
                       phase === 3 ? [0, -25, 25, -15, 15, 0] : 0 // More dramatic in phase 3
            }}
            transition={{
              y: { duration: 0.8, repeat: phase === 1 ? Infinity : 0, ease: "easeInOut" },
              rotateZ: { 
                duration: phase === 3 ? 2 : 2.5, 
                repeat: (phase === 1 || phase === 2 || phase === 3) ? Infinity : 0, 
                ease: "easeInOut" 
              }
            }}
            style={{ transformOrigin: "50px 20px" }}
          >
            {/* Head */}
            <circle 
              cx="50" cy="20" r="8" 
              fill="hsl(var(--foreground))" 
              stroke="hsl(var(--primary))" 
              strokeWidth="1.5"
            />
            
            {/* Spy fedora hat */}
            <ellipse cx="50" cy="16" rx="12" ry="3" fill="hsl(var(--muted-foreground))" />
            <ellipse cx="50" cy="14" rx="8" ry="4" fill="hsl(var(--muted-foreground))" />
            <rect x="47" y="12" width="6" height="2" fill="hsl(var(--foreground))" rx="1" />
          </motion.g>
          
          {/* Sunglasses */}
          <motion.g
            animate={{
              scaleY: phase === 3 && !reducedMotion ? [1, 0.2, 1] : 1
            }}
            transition={{ 
              duration: 0.3, 
              repeat: phase === 3 ? 2 : 0
            }}
          >
            <rect x="45" y="17" width="4" height="3" rx="1.5" fill="hsl(var(--muted-foreground))" opacity="0.8" />
            <rect x="51" y="17" width="4" height="3" rx="1.5" fill="hsl(var(--muted-foreground))" opacity="0.8" />
            <line x1="49" y1="18.5" x2="51" y2="18.5" stroke="hsl(var(--muted-foreground))" strokeWidth="0.5" />
          </motion.g>

          {/* Body with trench coat */}
          <line x1="50" y1="28" x2="50" y2="60" stroke="hsl(var(--foreground))" strokeWidth="3" />
          
          {/* Trench coat outline */}
          <path 
            d="M 42 35 Q 50 33 58 35 L 60 55 Q 58 57 50 58 Q 42 57 40 55 Z" 
            fill="none" 
            stroke="hsl(var(--muted-foreground))" 
            strokeWidth="1.5"
            opacity="0.7"
          />
          
          {/* Coat buttons */}
          <circle cx="48" cy="40" r="0.8" fill="hsl(var(--muted-foreground))" />
          <circle cx="48" cy="45" r="0.8" fill="hsl(var(--muted-foreground))" />
          <circle cx="48" cy="50" r="0.8" fill="hsl(var(--muted-foreground))" />
          
          {/* Arms */}
          <motion.line
            x1="50" y1="35" x2="35" y2="45"
            stroke="hsl(var(--foreground))" strokeWidth="2"
            animate={{ 
              rotate: phase === 2 ? [0, -20, 0] : phase === 3 ? -45 : 0 // Salute gesture
            }}
            style={{ transformOrigin: "50px 35px" }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />
          <motion.line
            x1="50" y1="35" x2="65" y2="45"
            stroke="hsl(var(--foreground))" strokeWidth="2"
            animate={{ 
              rotate: phase === 2 ? [0, 20, 0] : phase === 3 ? 45 : 0 // Salute gesture
            }}
            style={{ transformOrigin: "50px 35px" }}
            transition={{ duration: 0.8, delay: 0.1, ease: "easeOut" }}
          />
          
          {/* Legs with walking animation */}
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

          {/* Briefcase with security chain (carried until phase 2) */}
          {phase < 2 && (
            <motion.g
              initial={{ x: 70, y: 40 }}
              animate={{ 
                y: phase === 1 && !reducedMotion ? [40, 38, 40] : 40
              }}
              transition={{
                duration: 0.6,
                repeat: phase === 1 ? Infinity : 0,
                ease: "easeInOut"
              }}
            >
              {/* Security chain from wrist to briefcase */}
              <path 
                d="M -5 0 Q 0 -2 3 0 Q 6 2 9 0 Q 12 -2 15 0" 
                stroke="hsl(var(--muted-foreground))" 
                strokeWidth="0.8" 
                fill="none"
                opacity="0.6"
              />
              
              <rect x="0" y="0" width="12" height="8" rx="1" fill="hsl(var(--primary))" stroke="hsl(var(--border))" strokeWidth="0.5" />
              <text x="6" y="3" fontSize="2" fill="hsl(var(--background))" textAnchor="middle">TOP</text>
              <text x="6" y="6" fontSize="2" fill="hsl(var(--background))" textAnchor="middle">SECRET</text>
              
              {/* Lock mechanism */}
              <rect x="10" y="3" width="1.5" height="2" rx="0.3" fill="hsl(var(--muted-foreground))" />
            </motion.g>
          )}

          {/* Stealth smoke trails during movement */}
          {(phase === 1 || phase === 4) && !reducedMotion && (
            <motion.g
              initial={{ opacity: 0 }}
              animate={{ 
                opacity: [0, 0.5, 0], 
                x: phase === 4 ? [0, -15] : [0, 15],
                scale: [0.8, 1.2, 0.8]
              }}
              transition={{ duration: 0.8, repeat: Infinity, ease: "easeInOut" }}
            >
              {/* Stealth smoke particles */}
              <circle cx={phase === 4 ? "25" : "75"} cy="35" r="2" fill="hsl(var(--muted-foreground))" opacity="0.3" />
              <circle cx={phase === 4 ? "20" : "80"} cy="50" r="1.5" fill="hsl(var(--muted-foreground))" opacity="0.2" />
              <circle cx={phase === 4 ? "30" : "70"} cy="42" r="1" fill="hsl(var(--muted-foreground))" opacity="0.25" />
              
              {/* Speed lines */}
              <line x1={phase === 4 ? "20" : "80"} y1="30" x2={phase === 4 ? "10" : "90"} y2="32" stroke="hsl(var(--primary))" strokeWidth="1" opacity="0.6" />
              <line x1={phase === 4 ? "25" : "75"} y1="45" x2={phase === 4 ? "15" : "85"} y2="47" stroke="hsl(var(--primary))" strokeWidth="1" opacity="0.4" />
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
            x: centerX - briefcaseX - 50, // Start from agent position
            y: 0
          }}
          animate={{ 
            scale: phase >= 2 ? 1 : 0,
            rotate: phase === 2 ? [0, 360, 720, 360] : 0,
            x: 0, // Move to center
            y: phase === 2 ? [0, -20, 0] : 0 // Bounce effect
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
                opacity: phase >= 2 && !reducedMotion ? [0.4, 0.8, 0.4] : 0.4,
                scale: phase >= 2 && !reducedMotion ? [1, 1.2, 1] : 1
              }}
              transition={{ duration: 1.5, repeat: phase >= 2 ? Infinity : 0 }}
            />
          </div>
        </motion.div>
      )}
    </div>
  );
};

// Enhanced Explosion Effect
const BriefcaseExplosion = ({ 
  trigger, 
  reducedMotion, 
  performanceLevel,
  positioning,
  onScreenShake 
}: { 
  trigger: boolean; 
  reducedMotion: boolean;
  performanceLevel: 'low' | 'medium' | 'high';
  positioning: any;
  onScreenShake: () => void;
}) => {
  const { briefcaseX, briefcaseY } = positioning;
  const particleCount = performanceLevel === 'low' ? 12 : performanceLevel === 'medium' ? 24 : 36;
  const particles = Array.from({ length: particleCount }, (_, i) => i);
  
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
          style={{ zIndex: 20 }}
        >
          {/* Core explosion centered on briefcase */}
          <motion.div
            className="absolute"
            style={{
              left: briefcaseX + 15,
              top: briefcaseY + 10,
              transform: 'translate(-50%, -50%)'
            }}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ 
              opacity: [0, 1, 0.8, 0],
              scale: [0, 0.5, 2, 4]
            }}
            transition={{ duration: reducedMotion ? 1 : 1.8, times: [0, 0.1, 0.5, 1] }}
          >
            <div className="w-20 h-20 bg-gradient-radial from-white via-yellow-400 to-orange-500 rounded-full" />
          </motion.div>
          
          {/* Shockwave rings */}
          {[0, 1, 2].map(i => (
            <motion.div
              key={`ring-${i}`}
              className="absolute border-2 border-orange-400 rounded-full"
              style={{
                left: briefcaseX + 15,
                top: briefcaseY + 10,
                transform: 'translate(-50%, -50%)'
              }}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ 
                opacity: [0, 0.8 - i * 0.2, 0],
                scale: [0, 3 + i * 2, 6 + i * 3]
              }}
              transition={{ 
                duration: reducedMotion ? 1 : 1.5, 
                delay: i * 0.1,
                ease: "easeOut"
              }}
            />
          ))}
          
          {/* Particles */}
          {particles.map((i) => {
            const angle = (i * 360 / particles.length) * Math.PI / 180;
            const distance = 80 + Math.random() * 60;
            return (
              <motion.div
                key={i}
                className="absolute w-2 h-2 rounded-full"
                style={{
                  left: briefcaseX + 15,
                  top: briefcaseY + 10,
                  backgroundColor: i % 3 === 0 ? 'hsl(var(--primary))' : 
                                   i % 3 === 1 ? '#f59e0b' : '#ef4444'
                }}
                initial={{ 
                  scale: 0,
                  opacity: 1
                }}
                animate={{
                  x: Math.cos(angle) * distance,
                  y: Math.sin(angle) * distance,
                  scale: [0, 1.5, 0],
                  opacity: [1, 0.8, 0]
                }}
                transition={{
                  duration: reducedMotion ? 1.2 : 2,
                  ease: "easeOut",
                  delay: i * 0.02
                }}
              />
            );
          })}
          
          {/* Screen flash */}
          <motion.div
            className="absolute inset-0 bg-white/40"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.6, 0] }}
            transition={{ duration: 0.3, times: [0, 0.1, 1] }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// Character reveal component
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
      }, reducedMotion ? 30 : 50);
      
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
  
  // Debug logging for animation triggering
  useEffect(() => {
    console.log('🎬 WelcomeAnimation Debug:', {
      isVisible,
      isFirstTime,
      initialization: !!initialization,
      isInitialized,
      justSignedUp: sessionStorage.getItem('justSignedUp'),
      propUsername,
      propTier
    });
  }, [isVisible, isFirstTime, initialization, isInitialized, propUsername, propTier]);
  
  // Use backend data if available, fall back to props
  const username = initialization?.username || propUsername || 'Agent';
  const tier = initialization?.tier || propTier || 'COMMON';
  
  const [phase, setPhase] = useState(0);
  const [showExplosion, setShowExplosion] = useState(false);
  const [showUsername, setShowUsername] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  
  // Generate unique instance ID for debugging
  const instanceId = useRef(Math.random().toString(36).substr(2, 9));
  
  // Debug logging for text visibility
  console.log(`🎬 WelcomeAnimation [${instanceId.current}] Debug:`, {
    showUsername,
    showWelcome,
    isVisible,
    phase,
    username,
    tier,
    instanceId: instanceId.current
  });
  const [screenShake, setScreenShake] = useState(false);
  const [showSkipHint, setShowSkipHint] = useState(false);
  
  const reducedMotion = useReducedMotion();
  const capabilities = useDeviceCapabilities();
  const { dimensions, positioning } = useSearchBarTargeting();
  
  // Fast timing configuration for testing and debugging
  const timingConfig = useMemo(() => {
    // Use fast timing for testing - much shorter delays
    const fastMode = true; // Set to true for debugging
    
    if (fastMode) {
      console.log(`🎬 WelcomeAnimation [${instanceId.current}]: Using FAST MODE for testing`);
      return {
        totalDuration: 8, // 8 seconds total for testing
        phases: {
          entry: 500,      // Agent enters from left
          deposit: 1000,   // Agent deposits briefcase
          salute: 1500,    // Agent turns head and surveys
          exit: 2000,      // Agent exits completely off screen
          explosion: 2500, // 0.5s after agent exits: Briefcase explodes
          username: 3000,  // 0.5s after explosion: Username emerges
          welcome: 3500    // 0.5s after username: Welcome message
        }
      };
    }
    
    // Normal cinematic timing
    const cinematicMultiplier = capabilities.performanceLevel === 'high' ? 1.5 : 
                               capabilities.performanceLevel === 'medium' ? 1.3 : 1.2;
    
    const agentExitTime = 3500 * cinematicMultiplier;
    console.log(`🎬 WelcomeAnimation [${instanceId.current}]: Agent exit time calculated: ${agentExitTime}ms (multiplier: ${cinematicMultiplier})`);
    
    return {
      totalDuration: 12, // 12 seconds total for better UX
      phases: {
        entry: 1000 * cinematicMultiplier,     // Agent enters from left
        deposit: 2000 * cinematicMultiplier,   // Agent deposits briefcase
        salute: 3000 * cinematicMultiplier,    // Agent turns head and surveys
        exit: agentExitTime,                   // Agent exits completely off screen
        explosion: agentExitTime + 750,        // 0.75s after agent exits: Briefcase explodes
        username: agentExitTime + 1750,        // 1s after explosion: Username emerges
        welcome: agentExitTime + 3250          // 1.5s after username: Welcome message
      }
    };
  }, [capabilities.performanceLevel, instanceId]);

  // Enhanced skip functionality
  const handleSkip = useCallback(() => {
    if (capabilities.supportsHaptics) {
      navigator.vibrate?.(50);
    }
    onComplete();
  }, [capabilities.supportsHaptics, onComplete]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'Enter' || e.key === 'Escape') {
        e.preventDefault();
        handleSkip();
      }
    };

    if (isVisible) {
      document.addEventListener('keydown', handleKeyPress);
      // Prevent scrolling during animation
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyPress);
      document.body.style.overflow = '';
    };
  }, [handleSkip, isVisible]);

  // Screen shake handler
  const handleScreenShake = useCallback(() => {
    setScreenShake(true);
    setTimeout(() => setScreenShake(false), 500);
  }, []);

  // Show skip hint after 3 seconds
  useEffect(() => {
    if (!isVisible) return;
    
    const timeout = setTimeout(() => {
      setShowSkipHint(true);
    }, 3000);

    return () => clearTimeout(timeout);
  }, [isVisible]);

  // Main animation sequence
  useEffect(() => {
    if (!isVisible) {
      // Reset all states
      setPhase(0);
      setShowExplosion(false);
      setShowUsername(false);
      setShowWelcome(false);
      setScreenShake(false);
      setShowSkipHint(false);
      return;
    }

    const timeouts: NodeJS.Timeout[] = [];
    const { phases } = timingConfig;
    
    // Animation sequence with debug logging
    timeouts.push(setTimeout(() => {
      console.log(`🎬 Phase 1: Agent enters (${phases.entry}ms)`);
      setPhase(1);
    }, phases.entry));
    
    timeouts.push(setTimeout(() => {
      console.log(`🎬 Phase 2: Agent deposits briefcase (${phases.deposit}ms)`);
      setPhase(2);
    }, phases.deposit));
    
    timeouts.push(setTimeout(() => {
      console.log(`🎬 Phase 3: Agent surveys area (${phases.salute}ms)`);
      setPhase(3);
    }, phases.salute));
    
    timeouts.push(setTimeout(() => {
      console.log(`🎬 Phase 4: Agent exits (${phases.exit}ms)`);
      setPhase(4);
    }, phases.exit));
    
    timeouts.push(setTimeout(() => {
      console.log(`🎬 💥 EXPLOSION! (${phases.explosion}ms - ${phases.explosion - phases.exit}ms after agent exit)`);
      setShowExplosion(true);
    }, phases.explosion));
    
    timeouts.push(setTimeout(() => {
      console.log(`🎬 Username reveal (${phases.username}ms)`);
      setShowUsername(true);
    }, phases.username));
    
    timeouts.push(setTimeout(() => {
      console.log(`🎬 Welcome message (${phases.welcome}ms)`);
      setShowWelcome(true);
    }, phases.welcome));

    return () => {
      timeouts.forEach(clearTimeout);
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

  // Render via Portal to ensure top-level positioning
  if (typeof window === 'undefined') return null;

  const animationContent = (
    <AnimatePresence>
      {isVisible && (
        <>
          {/* Full-screen backdrop with maximum z-index */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="fixed inset-0 bg-background/95 backdrop-blur-xl"
            style={{
              zIndex: 2147483647, // Maximum safe z-index
              backdropFilter: 'blur(16px) saturate(180%)',
              WebkitBackdropFilter: 'blur(16px) saturate(180%)',
              position: 'fixed !important' as any,
              top: '0 !important' as any,
              left: '0 !important' as any,
              right: '0 !important' as any,
              bottom: '0 !important' as any,
              width: '100vw !important' as any,
              height: '100vh !important' as any
            }}
          />
          
          {/* Main animation container with Portal positioning */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ 
              opacity: 1, 
              scale: 1,
              x: screenShake && !reducedMotion ? [0, -5, 5, -3, 3, 0] : 0
            }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ 
              duration: 1, 
              ease: 'easeOut',
              x: { duration: 0.5, times: [0, 0.15, 0.3, 0.6, 0.8, 1] }
            }}
            className="fixed inset-0 overflow-hidden"
            style={{ 
              zIndex: 2147483647, // Maximum safe z-index
              willChange: 'transform, opacity',
              transform: 'translate3d(0, 0, 0)',
              contain: 'layout style paint',
              position: 'fixed !important' as any,
              top: '0 !important' as any,
              left: '0 !important' as any,
              right: '0 !important' as any,
              bottom: '0 !important' as any,
              width: '100vw !important' as any,
              height: '100vh !important' as any,
              pointerEvents: 'auto' as any
            }}
          >
            {/* Skip hints */}
            <AnimatePresence>
              {showSkipHint && (
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="absolute top-6 right-6 z-10 bg-background/90 backdrop-blur-sm rounded-lg border border-primary/20 p-3"
                >
                  <p className="text-sm text-muted-foreground mb-2">Skip animation:</p>
                  <div className="flex gap-2 text-xs">
                    <span className="px-2 py-1 bg-muted rounded">Space</span>
                    <span className="px-2 py-1 bg-muted rounded">Enter</span>
                    <span className="px-2 py-1 bg-muted rounded">ESC</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            
            {/* Search Bar Highlight Effect */}
            {positioning.searchBarFound && phase >= 2 && phase <= 3 && (
              <motion.div
                className="absolute border-2 border-primary/60 rounded-lg pointer-events-none"
                style={{
                  left: positioning.searchBarRect.x - 4,
                  top: positioning.searchBarRect.y - 4,
                  width: positioning.searchBarRect.width + 8,
                  height: positioning.searchBarRect.height + 8,
                  zIndex: 15
                }}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ 
                  opacity: [0, 0.8, 0.4, 0.8, 0],
                  scale: [0.9, 1.02, 1, 1.02, 0.9]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
                <div className="absolute inset-0 bg-primary/10 rounded-lg animate-pulse" />
              </motion.div>
            )}

            {/* Secret Agent Animation */}
            <SecretAgentWithBriefcase 
              phase={phase} 
              reducedMotion={reducedMotion} 
              performanceLevel={capabilities.performanceLevel}
              positioning={positioning}
            />
            
            {/* Briefcase Explosion */}
            <BriefcaseExplosion 
              trigger={showExplosion} 
              reducedMotion={reducedMotion}
              performanceLevel={capabilities.performanceLevel}
              positioning={positioning}
              onScreenShake={handleScreenShake}
            />
            
            {/* Username Reveal */}
            <AnimatePresence>
              {showUsername && (
                <motion.div
                  initial={{ opacity: 0, scale: 0, y: 100 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ 
                    type: "spring", 
                    stiffness: 200, 
                    damping: 15,
                    delay: 0.2 
                  }}
                  className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
                  style={{ 
                    zIndex: 50,
                    position: 'fixed' as any,
                    backgroundColor: 'hsl(var(--background))',
                    padding: '2rem',
                    border: '2px solid hsl(var(--primary))',
                    borderRadius: '0.75rem'
                  }}
                >
                  <div className="bg-background/95 backdrop-blur-lg border-2 border-primary/60 rounded-xl p-8 text-center shadow-2xl">
                    <motion.div 
                      className="flex items-center justify-center gap-4 mb-4"
                      animate={{
                        y: capabilities.performanceLevel === 'high' && !reducedMotion ? [0, -3, 0] : 0
                      }}
                      transition={{
                        duration: 2.5,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                    >
                      <motion.span 
                        className="text-5xl"
                        animate={{
                          scale: capabilities.performanceLevel === 'high' && !reducedMotion ? [1, 1.2, 1] : 1,
                          rotate: capabilities.performanceLevel === 'high' && !reducedMotion ? [0, 10, -10, 0] : 0
                        }}
                        transition={{
                          duration: 3,
                          repeat: Infinity,
                          ease: "easeInOut"
                        }}
                      >
                        {getTierEmoji(tier)}
                      </motion.span>
                      <div className="text-4xl font-bold text-primary">
                        <CharacterReveal 
                          text={username}
                          isVisible={showUsername}
                          tier={tier}
                        />
                      </div>
                    </motion.div>
                    <div className={`text-xl ${getTierColor(tier)} font-semibold`}>
                      <CharacterReveal 
                        text={`${tier} AGENT`}
                        isVisible={showUsername}
                        delay={300}
                      />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            
            {/* Welcome Message */}
            <AnimatePresence>
              {showWelcome && (
                  <motion.div
                    initial={{ opacity: 0, y: 50, scale: 0.8 }}
                    animate={{ 
                      opacity: 1, 
                      y: 0, 
                      scale: 1
                    }}
                    transition={{ 
                      type: "spring", 
                      stiffness: 150, 
                      damping: 12,
                      delay: 0.1
                    }}
                  className="absolute bottom-20 left-1/2 transform -translate-x-1/2 max-w-2xl w-full px-6"
                  style={{ 
                    zIndex: 50,
                    position: 'fixed' as any,
                    backgroundColor: 'hsl(var(--background))',
                    padding: '2rem',
                    border: '2px solid hsl(var(--primary))',
                    borderRadius: '0.75rem'
                  }}
                >
                  <div className="bg-background/95 backdrop-blur-lg border-2 border-primary/60 rounded-xl p-8 text-center shadow-2xl">
                    <motion.h2 
                      className="text-3xl font-bold mb-6 text-primary"
                    >
                      <CharacterReveal 
                        text={`Mission Complete, ${username}!`}
                        isVisible={showWelcome}
                      />
                    </motion.h2>
                    
                    <div className="text-xl text-foreground/90 mb-8 leading-relaxed">
                      <CharacterReveal 
                        text="Your anime adventure awaits. Prepare for epic journeys ahead!"
                        isVisible={showWelcome}
                        delay={500}
                      />
                    </div>
                    
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 1.5, type: "spring", stiffness: 200 }}
                    >
                      <Button 
                        onClick={handleSkip}
                        className="px-8 py-4 text-lg font-semibold bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl"
                      >
                        Begin Your Journey! 🚀
                      </Button>
                    </motion.div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );

  return createPortal(animationContent, document.body);
};