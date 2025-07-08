import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CharacterFigurine } from '@/components/CharacterFigurine';
import { FirstTimeLootBoxExperience } from '@/components/FirstTimeLootBoxExperience';
import { ParticleEffect } from '@/components/ParticleEffect';
import { PointAnimation } from '@/components/PointAnimation';
import { Gift, Crown, Sparkles, Star, Volume2, VolumeX } from 'lucide-react';
import { useGameification } from '@/hooks/useGameification';
import { toast } from 'sonner';

interface LootBoxResult {
  username: string;
  tier: 'GOD' | 'LEGENDARY' | 'EPIC' | 'RARE' | 'UNCOMMON' | 'COMMON';
  sourceAnime?: string;
  description?: string;
  personality?: string;
  isFirstTime?: boolean;
}

interface UltraEnhancedLootBoxOpeningProps {
  isOpen: boolean;
  onClose: () => void;
  boxType?: string;
}

const tierConfigs = {
  GOD: {
    color: 'from-purple-600 via-pink-500 to-yellow-500',
    bgColor: 'from-purple-600 to-pink-600',
    glow: 'shadow-[0_0_50px_rgba(168,85,247,0.8)]',
    icon: Crown,
    particles: 'achievement',
    textColor: 'text-purple-300'
  },
  LEGENDARY: {
    color: 'from-yellow-500 via-orange-500 to-red-500',
    bgColor: 'from-yellow-500 to-orange-500',
    glow: 'shadow-[0_0_40px_rgba(245,158,11,0.6)]',
    icon: Star,
    particles: 'achievement',
    textColor: 'text-yellow-300'
  },
  EPIC: {
    color: 'from-blue-500 via-indigo-500 to-purple-500',
    bgColor: 'from-blue-500 to-purple-500',
    glow: 'shadow-[0_0_30px_rgba(59,130,246,0.5)]',
    icon: Sparkles,
    particles: 'celebration',
    textColor: 'text-blue-300'
  },
  RARE: {
    color: 'from-green-500 via-teal-500 to-blue-500',
    bgColor: 'from-green-500 to-blue-500',
    glow: 'shadow-[0_0_25px_rgba(34,197,94,0.4)]',
    icon: Star,
    particles: 'points',
    textColor: 'text-green-300'
  },
  UNCOMMON: {
    color: 'from-gray-500 via-slate-500 to-gray-600',
    bgColor: 'from-gray-400 to-gray-600',
    glow: 'shadow-[0_0_20px_rgba(107,114,128,0.3)]',
    icon: Sparkles,
    particles: 'points',
    textColor: 'text-gray-300'
  },
  COMMON: {
    color: 'from-gray-600 via-gray-700 to-gray-800',
    bgColor: 'from-gray-600 to-gray-800',
    glow: 'shadow-[0_0_15px_rgba(75,85,99,0.2)]',
    icon: Star,
    particles: 'points',
    textColor: 'text-gray-400'
  }
};

export const UltraEnhancedLootBoxOpening = ({
  isOpen,
  onClose,
  boxType = 'standard'
}: UltraEnhancedLootBoxOpeningProps) => {
  const { openLootBox, isFirstTime } = useGameification();
  const [isOpening, setIsOpening] = useState(false);
  const [result, setResult] = useState<LootBoxResult | null>(null);
  const [showParticles, setShowParticles] = useState(false);
  const [showPointAnimation, setShowPointAnimation] = useState(false);
  const [showSkipButton, setShowSkipButton] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showFirstTimeExperience, setShowFirstTimeExperience] = useState(false);
  const [animationPhase, setAnimationPhase] = useState<'idle' | 'shaking' | 'opening' | 'revealing' | 'celebrating'>('idle');

  const handleOpenLootBox = async () => {
    console.log('Opening loot box, isFirstTime:', isFirstTime);
    
    setIsOpening(true);
    setAnimationPhase('shaking');

    // Shaking animation
    setTimeout(() => {
      setAnimationPhase('opening');
    }, 1000);

    // Opening animation  
    setTimeout(async () => {
      try {
        const lootResult = await openLootBox(boxType);
        console.log('Loot result received:', lootResult);
        
        if (lootResult) {
          const enhancedResult = {
            ...lootResult,
            sourceAnime: lootResult.sourceAnime || `${lootResult.username} Anime`,
            description: lootResult.description || `A ${lootResult.tier.toLowerCase()} tier character with unique abilities and personality traits.`
          };
          
          setResult(enhancedResult);
          setAnimationPhase('revealing');
          
          // Check if this should show first-time experience
          if (lootResult.isFirstTime) {
            console.log('Showing first-time experience');
            setShowFirstTimeExperience(true);
            setIsOpening(false);
            return;
          }
          
          // Show particles after reveal (regular experience)
          setTimeout(() => {
            setShowParticles(true);
            setAnimationPhase('celebrating');
            
            // Show point animation for epic+ tiers
            if (['GOD', 'LEGENDARY', 'EPIC'].includes(lootResult.tier)) {
              setShowPointAnimation(true);
            }
          }, 500);
        } else {
          toast.error('Failed to open loot box');
        }
      } catch (error) {
        console.error('Error in loot box opening:', error);
        toast.error('Failed to open loot box');
      } finally {
        setIsOpening(false);
      }
    }, 2000);
  };

  const handleClose = () => {
    setResult(null);
    setShowParticles(false);
    setShowPointAnimation(false);
    setShowFirstTimeExperience(false);
    setAnimationPhase('idle');
    setShowSkipButton(false);
    onClose();
  };

  const handleFirstTimeClose = () => {
    setShowFirstTimeExperience(false);
    // Show regular celebration
    setTimeout(() => {
      setShowParticles(true);
      setAnimationPhase('celebrating');
    }, 500);
  };

  // Enable skip button after 5 seconds for regular experience
  useEffect(() => {
    if (isOpen && !result?.isFirstTime && result) {
      const timer = setTimeout(() => setShowSkipButton(true), 5000);
      return () => clearTimeout(timer);
    }
  }, [isOpen, result]);

  if (!isOpen) return null;

  // Show first-time experience if it's the user's first loot box
  if (showFirstTimeExperience && result) {
    return (
      <FirstTimeLootBoxExperience
        isOpen={true}
        onClose={handleFirstTimeClose}
        result={result}
      />
    );
  }

  const tierConfig = result ? tierConfigs[result.tier] : null;
  const TierIcon = tierConfig?.icon || Gift;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.5 }}
          className="relative"
        >
          <Card className="glass-card border-2 border-primary/30 w-full max-w-md">
            <CardContent className="p-8 text-center space-y-6">
              {/* Sound Toggle */}
              <div className="absolute top-4 right-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSoundEnabled(!soundEnabled)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                </Button>
              </div>

              {/* Loot Box Animation */}
              <div className="relative flex justify-center">
                <motion.div
                  animate={
                    animationPhase === 'shaking' 
                      ? { 
                          x: [-5, 5, -5, 5, 0],
                          rotate: [-2, 2, -2, 2, 0] 
                        }
                      : animationPhase === 'opening'
                      ? {
                          scale: [1, 1.2, 1.5],
                          rotateY: [0, 180, 360]
                        }
                      : {}
                  }
                  transition={{
                    duration: animationPhase === 'shaking' ? 0.5 : 1,
                    repeat: animationPhase === 'shaking' ? 2 : 0
                  }}
                  className={`w-24 h-24 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center ${
                    result ? `shadow-2xl ${tierConfig?.glow}` : 'shadow-lg'
                  }`}
                >
                  {result && animationPhase === 'revealing' ? (
                    <motion.div
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.2 }}
                    >
                      <TierIcon className={`w-12 h-12 ${tierConfig?.textColor}`} />
                    </motion.div>
                  ) : (
                    <Gift className="w-12 h-12 text-primary-foreground" />
                  )}
                </motion.div>
              </div>

              {/* Content */}
              {!result ? (
                <div className="space-y-4">
                  <h2 className="text-2xl font-bold text-gradient-primary">
                    {isOpening ? 'Opening Loot Box...' : 'Ready to Open?'}
                  </h2>
                  <p className="text-muted-foreground">
                    {isOpening 
                      ? 'Unveiling your legendary username...' 
                      : result?.isFirstTime 
                      ? 'Your first legendary username awaits! This will be an incredible experience!'
                      : 'Discover a new legendary anime character username!'
                    }
                  </p>
                  {!isOpening && (
                    <Button
                      onClick={handleOpenLootBox}
                      size="lg"
                      variant="hero"
                      className="w-full"
                    >
                      <Gift className="w-5 h-5 mr-2" />
                      {result?.isFirstTime ? 'Begin Your Journey' : 'Open Loot Box'}
                    </Button>
                  )}
                </div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6"
                >
                  <div className="space-y-2">
                    <h2 className="text-3xl font-bold text-gradient-primary">
                      {result?.isFirstTime ? 'Your Legend Begins!' : 'Congratulations!'}
                    </h2>
                    <p className="text-muted-foreground">You received:</p>
                  </div>

                  {/* Character Figurine */}
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ delay: 0.3, type: "spring", bounce: 0.5 }}
                    className="flex justify-center"
                  >
                    <CharacterFigurine
                      username={result.username}
                      tier={result.tier}
                      sourceAnime={result.sourceAnime}
                      description={result.description}
                    />
                  </motion.div>

                  {/* Tier Badge */}
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.5, type: "spring", bounce: 0.5 }}
                    className={`p-4 rounded-lg bg-gradient-to-br ${tierConfig?.bgColor} text-white shadow-2xl ${tierConfig?.glow}`}
                  >
                    <div className="text-2xl font-bold mb-2">{result.tier} TIER</div>
                    <div className="text-sm opacity-90">
                      {result.tier === 'GOD' && 'Legendary main character - Ultra rare!'}
                      {result.tier === 'LEGENDARY' && 'Fan favorite character - Very rare!'}
                      {result.tier === 'EPIC' && 'Memorable character - Rare!'}
                      {result.tier === 'RARE' && 'Supporting character - Uncommon!'}
                      {result.tier === 'UNCOMMON' && 'Anime enthusiast - Common!'}
                      {result.tier === 'COMMON' && 'Anime fan - Standard!'}
                    </div>
                  </motion.div>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    {showSkipButton && (
                      <Button
                        variant="outline"
                        onClick={handleClose}
                        className="flex-1"
                      >
                        Collect Another
                      </Button>
                    )}
                    <Button
                      onClick={handleClose}
                      variant="hero"
                      className="flex-1"
                    >
                      {result?.isFirstTime ? 'Continue Journey' : 'Awesome!'}
                    </Button>
                  </div>
                </motion.div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </AnimatePresence>

      {/* Particle Effects */}
      <ParticleEffect
        trigger={showParticles}
        type={tierConfig?.particles as any || 'celebration'}
        intensity={result?.tier === 'GOD' ? 'high' : result?.tier === 'LEGENDARY' ? 'medium' : 'low'}
        onComplete={() => setShowParticles(false)}
      />

      {/* Point Animation */}
      {showPointAnimation && result && (
        <PointAnimation
          points={0}
          type="lootbox"
          onComplete={() => setShowPointAnimation(false)}
        />
      )}
    </div>
  );
};