import { useState, useEffect } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface WelcomeAnimationProps {
  isFirstTime: boolean;
  username?: string;
  tier?: string;
  onComplete: () => void;
  isVisible: boolean;
}

// Enhanced Stick Figure Secret Agent Component
const StickFigureAgent = ({ phase, reducedMotion }: { phase: number; reducedMotion: boolean }) => {
  return (
    <motion.svg
      viewBox="0 0 800 400"
      className="w-full h-32 sm:h-48 lg:h-64 max-w-xs sm:max-w-md lg:max-w-2xl"
      style={{ willChange: 'transform' }}
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

// Enhanced Cinematic Explosion Effect
const ExplosionEffect = ({ trigger, reducedMotion }: { trigger: boolean; reducedMotion: boolean }) => {
  const particles = Array.from({ length: reducedMotion ? 12 : 24 }, (_, i) => i);
  
  return (
    <AnimatePresence>
      {trigger && (
        <motion.div className="absolute inset-0 pointer-events-none">
          {/* Multi-layered Explosion Core */}
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ 
              opacity: [0, 1, 0.8, 0],
              scale: [0, 0.5, 2, 4]
            }}
            transition={{ duration: reducedMotion ? 0.8 : 1.2, times: [0, 0.2, 0.6, 1] }}
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-gradient-radial from-white via-yellow-300 to-transparent rounded-full"
          />
          
          {/* Shockwave Ring */}
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ 
              opacity: [0, 0.8, 0],
              scale: [0, 3]
            }}
            transition={{ duration: reducedMotion ? 0.6 : 1, delay: 0.1 }}
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-16 h-16 border-4 border-orange-400 rounded-full"
          />
          
          {/* Screen Flash */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.4, 0] }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 bg-white/30 rounded-lg"
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
          
          {/* Briefcase Debris */}
          {!reducedMotion && [0, 1, 2].map((i) => (
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
                x: `calc(50% + ${(i - 1) * 60}px)`,
                y: `calc(50% + ${Math.random() * 40 - 20}px)`,
                scale: [1, 0.8, 0],
                opacity: [1, 0.7, 0],
                rotate: [0, 180 + i * 120]
              }}
              transition={{
                duration: 1.5,
                ease: "easeOut",
                delay: 0.2
              }}
              className="absolute w-4 h-2 bg-gradient-to-r from-gray-600 to-gray-800 rounded-sm"
            />
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export const WelcomeAnimation = ({ 
  isFirstTime, 
  username, 
  tier, 
  onComplete, 
  isVisible 
}: WelcomeAnimationProps) => {
  const [phase, setPhase] = useState(0);
  const [showExplosion, setShowExplosion] = useState(false);
  const [showUsername, setShowUsername] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [typewriterText, setTypewriterText] = useState('');
  const [screenShake, setScreenShake] = useState(false);
  
  const reducedMotion = useReducedMotion();
  const isMobile = window.innerWidth < 768;
  const animationDuration = reducedMotion ? 4 : isMobile ? 6 : 8;

  const journeyQuote = "The start of your anime journey begins now, chosen one!";

  // Typewriter effect for the journey quote
  useEffect(() => {
    if (showWelcome) {
      let currentChar = 0;
      setTypewriterText('');
      
      const typeInterval = setInterval(() => {
        if (currentChar <= journeyQuote.length) {
          setTypewriterText(journeyQuote.slice(0, currentChar));
          currentChar++;
        } else {
          clearInterval(typeInterval);
        }
      }, 40);
      
      return () => clearInterval(typeInterval);
    }
  }, [showWelcome]);

  useEffect(() => {
    if (!isVisible) return;

    const timeouts: NodeJS.Timeout[] = [];
    
    // Dynamic timing based on device and preferences
    const timingScale = reducedMotion ? 0.6 : isMobile ? 0.75 : 1;
    
    // Phase 1: Agent arrival
    timeouts.push(setTimeout(() => setPhase(1), 100));
    
    // Phase 2: Mission execution - deposit briefcase
    timeouts.push(setTimeout(() => setPhase(2), 2200 * timingScale));
    
    // Phase 3: Looking around
    timeouts.push(setTimeout(() => setPhase(3), 3200 * timingScale));
    
    // Phase 4: Exit running
    timeouts.push(setTimeout(() => setPhase(4), 4000 * timingScale));
    
    // Phase 5: Explosion with screen shake
    timeouts.push(setTimeout(() => {
      setShowExplosion(true);
      if (!reducedMotion) setScreenShake(true);
    }, 4800 * timingScale));
    
    // Phase 6: Username reveal
    timeouts.push(setTimeout(() => setShowUsername(true), 5400 * timingScale));
    
    // Phase 7: Welcome message
    timeouts.push(setTimeout(() => setShowWelcome(true), 6200 * timingScale));
    
    // Stop screen shake
    timeouts.push(setTimeout(() => setScreenShake(false), 5200 * timingScale));

    return () => timeouts.forEach(clearTimeout);
  }, [isVisible, reducedMotion, isMobile]);

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
          initial={{ opacity: 0, y: -20 }}
          animate={{ 
            opacity: 1, 
            y: 0,
            x: screenShake && !reducedMotion ? [0, -2, 2, -1, 1, 0] : 0
          }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ 
            duration: 0.4, 
            ease: 'easeOut',
            x: { duration: 0.4, times: [0, 0.2, 0.4, 0.6, 0.8, 1] }
          }}
          className="relative w-full flex flex-col items-center justify-start pt-16 pb-8 px-4 min-h-screen"
          style={{ willChange: 'transform, opacity' }}
        >
          <div className="relative w-full max-w-xs sm:max-w-md lg:max-w-2xl h-32 sm:h-48 lg:h-64 flex items-center justify-center mb-8">
            {/* Stick Figure Animation */}
            {phase >= 1 && phase <= 4 && (
              <StickFigureAgent phase={phase} reducedMotion={reducedMotion} />
            )}
            
            {/* Explosion Effect */}
            <ExplosionEffect trigger={showExplosion} reducedMotion={reducedMotion} />
            
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
                  <Card className="glass-card border-primary/30 glow-card bg-background/95">
                    <CardContent className="p-6 text-center">
                      <div className="flex items-center justify-center gap-3 mb-2">
                        <span className="text-4xl">{getTierEmoji(tier)}</span>
                        <span className="text-2xl font-bold text-gradient-primary">
                          {username}
                        </span>
                      </div>
                      <p className={`text-sm ${getTierColor(tier)} font-medium`}>
                        {tier} TIER
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>
            
            {/* Welcome Message from Above */}
            <AnimatePresence>
              {showWelcome && (
                <motion.div
                  initial={{ opacity: 0, y: -100 }}
                  animate={{ opacity: 1, y: -120 }}
                  transition={{ 
                    type: "spring", 
                    stiffness: 150, 
                    damping: 20 
                  }}
                  className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
                >
                  <Card className="glass-card border-primary/20 bg-background/90">
                    <CardContent className="p-4 text-center">
                      <h2 className="text-xl font-bold text-gradient-primary mb-2">
                        Welcome, Protagonist! 🌟
                      </h2>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>
            
            {/* Anime Journey Quote Below */}
            <AnimatePresence>
              {showWelcome && (
                <motion.div
                  initial={{ opacity: 0, y: 100 }}
                  animate={{ opacity: 1, y: 120 }}
                  transition={{ 
                    type: "spring", 
                    stiffness: 150, 
                    damping: 20,
                    delay: 0.3 
                  }}
                  className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
                >
                  <Card className="glass-card border-accent/20 bg-background/90 max-w-md">
                    <CardContent className="p-4 text-center">
                      <p className="text-muted-foreground font-medium">
                        {typewriterText}
                        <span className="animate-pulse ml-1 text-primary">|</span>
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          
          {/* Completion Button */}
          <AnimatePresence>
            {showWelcome && typewriterText.length >= journeyQuote.length - 5 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ 
                  delay: 1.5, 
                  type: "spring", 
                  stiffness: 200 
                }}
                className="mt-8"
              >
                <Button 
                  onClick={onComplete}
                  className="glass-button gradient-primary hover:glow-primary transition-all duration-300 transform hover:scale-105 relative overflow-hidden px-8 py-3"
                >
                  <span className="relative z-10">Begin Your Anime Journey ✨</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
};