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

export const WelcomeAnimation = ({ 
  isFirstTime, 
  username = "Agent", 
  tier = "COMMON", 
  onComplete, 
  isVisible 
}: WelcomeAnimationProps) => {
  // Performance optimizations
  const shouldReduceMotion = useReducedMotion();
  const reducedMotion = shouldReduceMotion || false;
  const { positioning } = useSearchBarTargeting();
  const capabilities = useDeviceCapabilities();
  
  // Unique instance ID for debugging
  const instanceId = useRef(Math.random().toString(36).substring(2, 11)).current;
  
  // Animation control states
  const [phase, setPhase] = useState(0);
  const [showUsername, setShowUsername] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [skipRequested, setSkipRequested] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const lastPhaseRef = useRef(-1);
  
  // Fast mode for testing (much quicker timing)
  const fastMode = true; // Enable for testing
  
  // Get user data for potential welcome customization
  const { initialization } = useUserInitialization();
  const actualUsername = initialization?.username || username;
  const actualTier = initialization?.tier || tier;
  
  // Only log state changes to reduce spam
  useEffect(() => {
    if (lastPhaseRef.current !== phase) {
      console.log(`🎬 WelcomeAnimation [${instanceId}] Phase Change:`, {
        oldPhase: lastPhaseRef.current,
        newPhase: phase,
        showUsername,
        showWelcome,
        isVisible,
        username: actualUsername,
        tier: actualTier,
        instanceId
      });
      lastPhaseRef.current = phase;
    }
  }, [phase, showUsername, showWelcome, isVisible, actualUsername, actualTier, instanceId]);

  // Timing constants with fast mode support
  const timing = {
    agentEntry: fastMode ? 1000 : 3000,
    agentDeposit: fastMode ? 1000 : 2000,
    agentExit: fastMode ? 800 : 1500, // Fixed: much shorter
    usernameReveal: fastMode ? 1000 : 2000,
    welcomeReveal: fastMode ? 1000 : 3000,
    totalDuration: fastMode ? 5000 : 8000 // Fixed: realistic total duration
  };

  // Main animation sequence controller - simplified to prevent loops
  useEffect(() => {
    if (!isVisible || skipRequested || hasStarted) return;
    
    setHasStarted(true);
    console.log(`🎬 Starting animation sequence [${instanceId}]`);
    
    let timeouts: NodeJS.Timeout[] = [];
    
    // Phase 1: Agent enters and deposits briefcase
    timeouts.push(setTimeout(() => {
      if (!skipRequested) setPhase(1);
    }, 200));
    
    // Phase 2: Briefcase deposited, explosion preparation
    timeouts.push(setTimeout(() => {
      if (!skipRequested) setPhase(2);
    }, timing.agentEntry));
    
    // Phase 3: Explosion and agent exit
    timeouts.push(setTimeout(() => {
      if (!skipRequested) setPhase(3);
    }, timing.agentEntry + timing.agentDeposit));
    
    // Phase 4: Text reveals
    timeouts.push(setTimeout(() => {
      if (!skipRequested) {
        setPhase(4);
        setShowUsername(true);
      }
    }, timing.agentEntry + timing.agentDeposit + 500));
    
    // Show welcome message
    timeouts.push(setTimeout(() => {
      if (!skipRequested) {
        setShowWelcome(true);
      }
    }, timing.agentEntry + timing.agentDeposit + timing.usernameReveal));
    
    // Complete animation
    timeouts.push(setTimeout(() => {
      if (!skipRequested) {
        console.log(`🎬 Animation complete [${instanceId}]`);
        onComplete();
      }
    }, timing.totalDuration));
    
    return () => {
      timeouts.forEach(clearTimeout);
    };
  }, [isVisible, skipRequested, hasStarted, onComplete, instanceId]);

  // Skip functionality
  const handleSkip = useCallback(() => {
    setSkipRequested(true);
    onComplete();
  }, [onComplete]);

  // Early return if not visible
  if (!isVisible) return null;

  // Render the animation portal
  return createPortal(
    <motion.div
      className="fixed inset-0 z-[9999] bg-gradient-to-br from-background via-secondary/20 to-accent/10"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      style={{
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        pointerEvents: 'auto'
      }}
    >
      {/* Skip Button */}
      <Button
        onClick={handleSkip}
        variant="outline"
        size="sm"
        className="absolute top-4 right-4 z-50 bg-background/80 backdrop-blur-sm"
      >
        Skip Animation
      </Button>

      {/* Secret Agent Animation */}
      <SecretAgentWithBriefcase
        phase={phase}
        reducedMotion={reducedMotion}
        performanceLevel={capabilities.performanceLevel}
        positioning={positioning}
      />

      {/* Enhanced Username Display - Always visible when active */}
      <motion.div
        className="absolute inset-0 flex items-center justify-center"
        style={{ 
          zIndex: 9999,
          position: 'fixed',
          top: '40%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 'auto',
          height: 'auto'
        }}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ 
          opacity: showUsername ? 1 : 0,
          scale: showUsername ? 1 : 0.8
        }}
        transition={{ duration: 0.5 }}
      >
        <div className="text-center relative max-w-md mx-auto px-4">
          {/* Strong background for visibility */}
          <div className="absolute inset-0 bg-background/98 backdrop-blur-md rounded-xl border-4 border-primary/50 shadow-2xl" 
               style={{ boxShadow: '0 0 50px rgba(var(--primary-rgb), 0.3)' }} />
          
          <div className="relative z-10 p-8">
            <div className="text-3xl md:text-4xl font-bold text-primary mb-4 drop-shadow-lg">
              {`Codename: ${actualUsername}`}
            </div>
            <div className="text-xl md:text-2xl text-accent font-semibold drop-shadow-md">
              {`Tier: ${actualTier}`}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Enhanced Welcome Message - Always visible when active */}
      <motion.div
        className="absolute inset-0 flex items-center justify-center"
        style={{ 
          zIndex: 9998,
          position: 'fixed',
          top: '60%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 'auto',
          height: 'auto'
        }}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ 
          opacity: showWelcome ? 1 : 0,
          scale: showWelcome ? 1 : 0.8
        }}
        transition={{ duration: 0.5, delay: 0.5 }}
      >
        <div className="text-center relative max-w-lg mx-auto px-4">
          {/* Strong background for visibility */}
          <div className="absolute inset-0 bg-secondary/98 backdrop-blur-md rounded-xl border-4 border-accent/50 shadow-2xl"
               style={{ boxShadow: '0 0 40px rgba(var(--accent-rgb), 0.3)' }} />
          
          <div className="relative z-10 p-8">
            <div className="text-2xl md:text-3xl font-semibold text-foreground mb-3 drop-shadow-lg">
              Welcome to your mission base
            </div>
            <div className="text-lg md:text-xl text-muted-foreground drop-shadow-md">
              Your anime intelligence network awaits...
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>,
    document.body
  );
};