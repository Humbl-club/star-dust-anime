import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface WelcomeAnimationProps {
  isFirstTime: boolean;
  username?: string;
  tier?: string;
  onComplete: () => void;
  isVisible: boolean;
}

// Stick Figure Secret Agent Component
const StickFigureAgent = ({ phase, username }: { phase: number; username?: string }) => {
  return (
    <motion.svg
      viewBox="0 0 800 400"
      className="w-full h-64 max-w-2xl"
      style={{ willChange: 'transform' }}
    >
      {/* Agent Body */}
      <motion.g
        initial={{ x: -100 }}
        animate={{
          x: phase >= 1 ? 350 : -100,
          rotate: phase === 3 ? [0, 10, -10, 0] : 0
        }}
        transition={{
          x: { duration: 2.5, ease: "easeInOut" },
          rotate: { duration: 0.5, repeat: phase === 3 ? 2 : 0 }
        }}
      >
        {/* Head */}
        <circle cx="40" cy="50" r="15" fill="hsl(var(--foreground))" stroke="hsl(var(--primary))" strokeWidth="2" />
        
        {/* Eyes - looking left/right */}
        <motion.g
          animate={{
            x: phase === 3 ? [-2, 2, -2, 0] : 0
          }}
          transition={{ duration: 0.3, repeat: phase === 3 ? 3 : 0 }}
        >
          <circle cx="35" cy="48" r="2" fill="hsl(var(--primary))" />
          <circle cx="45" cy="48" r="2" fill="hsl(var(--primary))" />
        </motion.g>

        {/* Body */}
        <line x1="40" y1="65" x2="40" y2="120" stroke="hsl(var(--foreground))" strokeWidth="3" />
        
        {/* Arms */}
        <motion.line
          x1="40" y1="80" x2="20" y2="100"
          stroke="hsl(var(--foreground))" strokeWidth="3"
          animate={{ rotate: phase === 2 ? [0, -30, 0] : 0 }}
          style={{ transformOrigin: "40px 80px" }}
          transition={{ duration: 0.5 }}
        />
        <motion.line
          x1="40" y1="80" x2="60" y2="100"
          stroke="hsl(var(--foreground))" strokeWidth="3"
          animate={{ rotate: phase === 2 ? [0, 30, 0] : 0 }}
          style={{ transformOrigin: "40px 80px" }}
          transition={{ duration: 0.5, delay: 0.1 }}
        />
        
        {/* Legs - walking animation */}
        <motion.line
          x1="40" y1="120" x2="25" y2="150"
          stroke="hsl(var(--foreground))" strokeWidth="3"
          animate={{
            rotate: phase === 1 ? [0, 15, -15, 0] : phase === 4 ? [0, 45, 0] : 0
          }}
          style={{ transformOrigin: "40px 120px" }}
          transition={{ 
            duration: phase === 1 ? 0.4 : 0.3, 
            repeat: phase === 1 ? Infinity : phase === 4 ? 3 : 0 
          }}
        />
        <motion.line
          x1="40" y1="120" x2="55" y2="150"
          stroke="hsl(var(--foreground))" strokeWidth="3"
          animate={{
            rotate: phase === 1 ? [0, -15, 15, 0] : phase === 4 ? [0, -45, 0] : 0
          }}
          style={{ transformOrigin: "40px 120px" }}
          transition={{ 
            duration: phase === 1 ? 0.4 : 0.3, 
            repeat: phase === 1 ? Infinity : phase === 4 ? 3 : 0,
            delay: phase === 1 ? 0.2 : 0
          }}
        />
        
        {/* Briefcase */}
        {phase < 3 && (
          <motion.g
            initial={{ x: 65, y: 95 }}
            animate={{ 
              x: phase === 2 ? 400 : 65,
              y: phase === 2 ? 200 : 95,
              rotate: phase === 2 ? [0, 360] : 0
            }}
            transition={{ 
              duration: phase === 2 ? 1 : 0,
              ease: phase === 2 ? "easeOut" : "linear"
            }}
          >
            <rect x="0" y="0" width="25" height="15" rx="2" fill="hsl(var(--primary))" stroke="hsl(var(--border))" strokeWidth="1" />
            <line x1="3" y1="7" x2="22" y2="7" stroke="hsl(var(--muted-foreground))" strokeWidth="1" />
            <text x="12" y="4" fontSize="6" fill="hsl(var(--background))" textAnchor="middle">TOP</text>
            <text x="12" y="11" fontSize="6" fill="hsl(var(--background))" textAnchor="middle">SECRET</text>
          </motion.g>
        )}
      </motion.g>

      {/* Exit Animation */}
      {phase === 4 && (
        <motion.g
          initial={{ x: 350 }}
          animate={{ x: 900 }}
          transition={{ duration: 1.5, ease: "easeIn" }}
        >
          {/* Running figure */}
          <circle cx="40" cy="50" r="15" fill="hsl(var(--foreground))" stroke="hsl(var(--primary))" strokeWidth="2" />
          <circle cx="38" cy="48" r="2" fill="hsl(var(--primary))" />
          <circle cx="42" cy="48" r="2" fill="hsl(var(--primary))" />
          <line x1="40" y1="65" x2="35" y2="120" stroke="hsl(var(--foreground))" strokeWidth="3" />
          <line x1="40" y1="80" x2="20" y2="95" stroke="hsl(var(--foreground))" strokeWidth="3" />
          <line x1="40" y1="80" x2="55" y2="95" stroke="hsl(var(--foreground))" strokeWidth="3" />
          <line x1="35" y1="120" x2="15" y2="140" stroke="hsl(var(--foreground))" strokeWidth="3" />
          <line x1="35" y1="120" x2="60" y2="145" stroke="hsl(var(--foreground))" strokeWidth="3" />
        </motion.g>
      )}
    </motion.svg>
  );
};

// Explosion Effect Component
const ExplosionEffect = ({ trigger }: { trigger: boolean }) => {
  const particles = Array.from({ length: 20 }, (_, i) => i);
  
  return (
    <AnimatePresence>
      {trigger && (
        <motion.div className="absolute inset-0 pointer-events-none">
          {/* Bright Flash */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 0] }}
            transition={{ duration: 0.5 }}
            className="absolute inset-0 bg-yellow-300/90 rounded-lg"
          />
          
          {/* Particles */}
          {particles.map((i) => (
            <motion.div
              key={i}
              initial={{ 
                x: 400, 
                y: 200, 
                scale: 0,
                opacity: 1
              }}
              animate={{
                x: 400 + (Math.cos((i * 18) * Math.PI / 180) * 150),
                y: 200 + (Math.sin((i * 18) * Math.PI / 180) * 150),
                scale: [0, 1.5, 0],
                opacity: [1, 0.8, 0]
              }}
              transition={{
                duration: 1.5,
                ease: "easeOut",
                delay: i * 0.05
              }}
              className="absolute w-3 h-3 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full"
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
    
    // Phase 1: Agent arrival (0-3s)
    timeouts.push(setTimeout(() => setPhase(1), 100));
    
    // Phase 2: Mission execution - deposit briefcase (3-4s)
    timeouts.push(setTimeout(() => setPhase(2), 3000));
    
    // Phase 3: Looking around (4-5s)
    timeouts.push(setTimeout(() => setPhase(3), 4000));
    
    // Phase 4: Exit running (5-6s)
    timeouts.push(setTimeout(() => setPhase(4), 5000));
    
    // Phase 5: Explosion (6-7s)
    timeouts.push(setTimeout(() => setShowExplosion(true), 6000));
    
    // Phase 6: Username reveal (7-8s)
    timeouts.push(setTimeout(() => setShowUsername(true), 7000));
    
    // Phase 7: Welcome message (8-10s)
    timeouts.push(setTimeout(() => setShowWelcome(true), 8000));

    return () => timeouts.forEach(clearTimeout);
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
          initial={{ opacity: 0, backdropFilter: 'blur(0px)', background: 'hsl(var(--background))' }}
          animate={{ opacity: 1, backdropFilter: 'blur(12px)', background: 'linear-gradient(135deg, hsl(var(--background) / 0.95), hsl(var(--primary) / 0.05), hsl(var(--accent) / 0.05))' }}
          exit={{ opacity: 0, backdropFilter: 'blur(0px)', background: 'hsl(var(--background))' }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="fixed inset-0 z-[200] flex flex-col items-center justify-center p-4"
          style={{ willChange: 'opacity, backdrop-filter, background' }}
        >
          <div className="relative w-full max-w-4xl h-96 flex items-center justify-center">
            {/* Stick Figure Animation */}
            {phase >= 1 && phase <= 4 && (
              <StickFigureAgent phase={phase} username={username} />
            )}
            
            {/* Explosion Effect */}
            <ExplosionEffect trigger={showExplosion} />
            
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