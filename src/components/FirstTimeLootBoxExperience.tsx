import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { EnhancedCharacterFigurine } from '@/components/EnhancedCharacterFigurine';
import { EnhancedLootBoxAnimation } from '@/components/EnhancedLootBoxAnimation';
import { ParticleEffect } from '@/components/ParticleEffect';
import { useGameification } from '@/hooks/useGameification';
import { useAuth } from '@/hooks/useAuth';
import { Gift, Sparkles, Star, Crown, Play, Volume2, VolumeX } from 'lucide-react';

interface FirstTimeLootBoxExperienceProps {
  isOpen: boolean;
  onClose: () => void;
  result?: {
    username: string;
    tier: 'GOD' | 'LEGENDARY' | 'EPIC' | 'RARE' | 'UNCOMMON' | 'COMMON';
    sourceAnime?: string;
    description?: string;
  } | null;
}

type AnimationPhase = 'intro' | 'buildup' | 'mystery' | 'opening' | 'revealing' | 'character-intro' | 'celebration' | 'collection';

const phaseData = {
  intro: {
    title: "Welcome to the Username Universe",
    subtitle: "Your legendary journey begins now...",
    duration: 4000
  },
  buildup: {
    title: "A Mysterious Loot Box Appears",
    subtitle: "Something incredible awaits inside...",
    duration: 3000
  },
  mystery: {
    title: "The Box Trembles with Power",
    subtitle: "Legendary energy radiates from within...",
    duration: 4000
  },
  opening: {
    title: "The Seal is Breaking!",
    subtitle: "Prepare for something extraordinary...",
    duration: 3000
  },
  revealing: {
    title: "A Legend is Born!",
    subtitle: "Your new identity emerges...",
    duration: 2000
  },
  'character-intro': {
    title: "Meet Your Character",
    subtitle: "A legendary anime persona...",
    duration: 5000
  },
  celebration: {
    title: "You Are Now Legend!",
    subtitle: "Your epic journey begins...",
    duration: 4000
  },
  collection: {
    title: "Added to Collection",
    subtitle: "Continue collecting legendary usernames!",
    duration: 3000
  }
};

export const FirstTimeLootBoxExperience = ({ isOpen, onClose, result: propResult }: FirstTimeLootBoxExperienceProps) => {
  const { openLootBox, stats, lastGeneratedCharacter } = useGameification();
  const { user } = useAuth();
  const [currentPhase, setCurrentPhase] = useState<AnimationPhase>('intro');
  const [showSkipButton, setShowSkipButton] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showParticles, setShowParticles] = useState(false);
  const [lootBoxResult, setLootBoxResult] = useState<any>(null);
  const [showEnhancedAnimation, setShowEnhancedAnimation] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    console.log('FirstTimeLootBoxExperience: Starting experience');

    const phaseSequence: AnimationPhase[] = [
      'intro', 'buildup', 'mystery', 'opening', 'revealing', 'character-intro', 'celebration', 'collection'
    ];

    let currentIndex = 0;
    setCurrentPhase(phaseSequence[0]);

    const progressToNextPhase = async () => {
      if (currentIndex < phaseSequence.length - 1) {
        currentIndex++;
        const nextPhase = phaseSequence[currentIndex];
        setCurrentPhase(nextPhase);
        
        // Auto-open loot box when we reach the opening phase
        if (nextPhase === 'opening' && !lootBoxResult && user?.id) {
          console.log('FirstTimeLootBoxExperience: Auto-opening first loot box for user:', user.id);
          try {
            const result = await openLootBox('standard');
            console.log('FirstTimeLootBoxExperience: Got loot box result:', result);
            setLootBoxResult(result);
            
            // Show enhanced animation if we have a generated character
            if (lastGeneratedCharacter) {
              setShowEnhancedAnimation(true);
            }
          } catch (error) {
            console.error('FirstTimeLootBoxExperience: Error opening loot box:', error);
            // Show error message but continue the experience
            setLootBoxResult({ 
              username: 'AnimeHero', 
              tier: 'COMMON',
              description: 'A brave anime character ready for adventure!'
            });
          }
        } else if (nextPhase === 'opening' && !user?.id) {
          console.log('FirstTimeLootBoxExperience: No user authenticated, skipping loot box opening');
          // Provide fallback result
          setLootBoxResult({ 
            username: 'AnimeExplorer', 
            tier: 'COMMON',
            description: 'An adventurous anime character!'
          });
        }
        
        // Show particles during key moments
        if (['revealing', 'character-intro', 'celebration'].includes(nextPhase)) {
          setShowParticles(true);
        }
        
        setTimeout(progressToNextPhase, phaseData[nextPhase].duration);
      } else {
        // Experience complete
        setTimeout(onClose, 3000);
      }
    };

    const firstTimer = setTimeout(progressToNextPhase, phaseData[phaseSequence[0]].duration);

    return () => clearTimeout(firstTimer);
  }, [isOpen, onClose, openLootBox, lootBoxResult]);

  // Enable skip button after 10 seconds (but only for testing - real users can't skip)
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => setShowSkipButton(true), 10000);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const handleSkip = () => {
    setCurrentPhase('collection');
    setTimeout(onClose, 1000);
  };

  if (!isOpen) return null;

  const currentPhaseData = phaseData[currentPhase];
  const displayResult = lootBoxResult || propResult || { 
    username: stats?.currentUsername || 'Unknown',
    tier: stats?.usernameTier || 'COMMON'
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black flex items-center justify-center overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-blue-900/20 to-indigo-900/20 animate-pulse" />
      
      {/* Particle Effects */}
      <ParticleEffect
        trigger={showParticles}
        type={displayResult?.tier === 'GOD' ? 'achievement' : displayResult?.tier === 'LEGENDARY' ? 'celebration' : 'points'}
        intensity={displayResult?.tier === 'GOD' ? 'high' : 'medium'}
        onComplete={() => setShowParticles(false)}
      />

      {/* Main Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentPhase}
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.5 }}
          transition={{ duration: 0.8, type: "spring" }}
          className="relative w-full max-w-4xl mx-auto px-4"
        >
          {/* Phase Content */}
          {currentPhase === 'intro' && (
            <div className="text-center space-y-8">
              <motion.div
                initial={{ y: -50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                <h1 className="text-6xl font-bold text-gradient-primary mb-4">
                  Welcome to Anithing
                </h1>
                <p className="text-2xl text-muted-foreground">
                  Your legendary journey begins now...
                </p>
              </motion.div>
              
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 1, duration: 1 }}
                className="flex justify-center"
              >
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center glow-primary">
                  <Sparkles className="w-12 h-12 text-primary-foreground animate-pulse" />
                </div>
              </motion.div>
            </div>
          )}

          {currentPhase === 'buildup' && (
            <div className="text-center space-y-8">
              <motion.h2
                initial={{ y: -30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="text-4xl font-bold text-gradient-primary"
              >
                A Mysterious Loot Box Appears
              </motion.h2>
              
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ duration: 1.5, type: "spring" }}
                className="flex justify-center"
              >
                <div className="w-32 h-32 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-2xl glow-primary">
                  <Gift className="w-16 h-16 text-primary-foreground" />
                </div>
              </motion.div>
            </div>
          )}

          {currentPhase === 'mystery' && (
            <div className="text-center space-y-8">
              <motion.h2
                initial={{ y: -30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="text-4xl font-bold text-gradient-primary"
              >
                The Box Trembles with Power
              </motion.h2>
              
              <motion.div
                animate={{ 
                  scale: [1, 1.1, 1],
                  rotate: [0, 5, -5, 0],
                  boxShadow: [
                    '0 0 20px rgba(168,85,247,0.3)',
                    '0 0 40px rgba(168,85,247,0.6)',
                    '0 0 20px rgba(168,85,247,0.3)'
                  ]
                }}
                transition={{ 
                  duration: 2,
                  repeat: Infinity,
                  repeatType: "loop"
                }}
                className="flex justify-center"
              >
                <div className="w-32 h-32 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-2xl">
                  <Gift className="w-16 h-16 text-primary-foreground animate-pulse" />
                </div>
              </motion.div>
            </div>
          )}

          {currentPhase === 'opening' && (
            <div className="text-center space-y-8">
              <motion.h2
                initial={{ y: -30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="text-4xl font-bold text-gradient-primary"
              >
                The Seal is Breaking!
              </motion.h2>
              
              <motion.div
                animate={{ 
                  scale: [1, 1.5, 2],
                  rotate: [0, 180, 360],
                  opacity: [1, 0.8, 0]
                }}
                transition={{ duration: 2.5 }}
                className="flex justify-center"
              >
                <div className="w-32 h-32 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-2xl glow-primary">
                  <Gift className="w-16 h-16 text-primary-foreground" />
                </div>
              </motion.div>
            </div>
          )}

          {currentPhase === 'revealing' && displayResult && (
            <div className="text-center space-y-8">
              <motion.h2
                initial={{ y: -30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="text-4xl font-bold text-gradient-primary"
              >
                A Legend is Born!
              </motion.h2>
              
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ duration: 1, type: "spring", bounce: 0.5 }}
                className="flex justify-center"
              >
                <div className="text-6xl font-bold text-gradient-primary">
                  {displayResult.username}
                </div>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
                className="text-2xl text-muted-foreground"
              >
                {displayResult.tier} TIER
              </motion.div>
            </div>
          )}

          {currentPhase === 'character-intro' && displayResult && (
            <div className="text-center space-y-8">
              <motion.h2
                initial={{ y: -30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="text-4xl font-bold text-gradient-primary"
              >
                Meet Your Character
              </motion.h2>
              
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 1, type: "spring" }}
                  className="flex justify-center"
                >
                  {lastGeneratedCharacter ? (
                    <EnhancedCharacterFigurine
                      character={lastGeneratedCharacter}
                      className="scale-150"
                      showAnimation={true}
                    />
                  ) : (
                    <div className="text-center p-8 bg-card rounded-lg border">
                      <div className="text-4xl font-bold text-gradient-primary mb-2">
                        {displayResult.username}
                      </div>
                      <div className="text-lg text-muted-foreground">
                        {displayResult.tier} TIER
                      </div>
                    </div>
                  )}
                </motion.div>
              
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.5 }}
                className="text-center space-y-2"
              >
                <p className="text-lg text-muted-foreground">
                  {displayResult.description || "A legendary anime character with unique powers and personality."}
                </p>
                {displayResult.sourceAnime && (
                  <p className="text-sm text-muted-foreground">
                    From: {displayResult.sourceAnime}
                  </p>
                )}
              </motion.div>
            </div>
          )}

          {currentPhase === 'celebration' && (
            <div className="text-center space-y-8">
              <motion.h2
                initial={{ y: -30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="text-5xl font-bold text-gradient-primary"
              >
                You Are Now Legend!
              </motion.h2>
              
              <motion.div
                animate={{ 
                  scale: [1, 1.2, 1],
                  rotate: [0, 360, 720]
                }}
                transition={{ 
                  duration: 3,
                  repeat: Infinity,
                  repeatType: "loop"
                }}
                className="flex justify-center"
              >
                <Crown className="w-24 h-24 text-yellow-500 glow-primary" />
              </motion.div>
              
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
                className="text-xl text-muted-foreground"
              >
                Your epic journey begins now. Collect more legendary usernames!
              </motion.p>
            </div>
          )}

          {currentPhase === 'collection' && (
            <div className="text-center space-y-8">
              <motion.h2
                initial={{ y: -30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="text-4xl font-bold text-gradient-primary"
              >
                Added to Collection
              </motion.h2>
              
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 1, type: "spring" }}
                className="flex justify-center"
              >
                <div className="text-2xl text-muted-foreground">
                  Continue your legendary journey!
                </div>
              </motion.div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Controls */}
      <div className="absolute top-4 right-4 flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setSoundEnabled(!soundEnabled)}
          className="text-white hover:bg-white/10"
        >
          {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
        </Button>
        
        {showSkipButton && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSkip}
            className="text-white hover:bg-white/10"
          >
            Skip
          </Button>
        )}
      </div>

      {/* Progress Indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
        <div className="flex items-center gap-2">
          {Object.keys(phaseData).map((phase, index) => (
            <div
              key={phase}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                phase === currentPhase ? 'bg-primary scale-125' : 'bg-white/30'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Enhanced Loot Box Animation Overlay */}
      {showEnhancedAnimation && lastGeneratedCharacter && (
        <EnhancedLootBoxAnimation
          isOpen={showEnhancedAnimation}
          character={lastGeneratedCharacter}
          onAnimationComplete={() => setShowEnhancedAnimation(false)}
          onCharacterRevealed={() => console.log('Character revealed in enhanced animation')}
        />
      )}
    </div>
  );
};