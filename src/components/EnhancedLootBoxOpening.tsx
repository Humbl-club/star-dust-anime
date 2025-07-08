import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { ParticleEffect } from '@/components/ParticleEffect';
import { PointAnimation } from '@/components/PointAnimation';
import { Gift, Crown, Sparkles, Star } from 'lucide-react';
import { useGameification } from '@/hooks/useGameification';
import { toast } from 'sonner';

interface LootBoxResult {
  username: string;
  tier: 'GOD' | 'LEGENDARY' | 'EPIC' | 'RARE' | 'UNCOMMON' | 'COMMON';
}

interface EnhancedLootBoxOpeningProps {
  isOpen: boolean;
  onClose: () => void;
  boxType?: string;
}

const tierConfigs = {
  GOD: {
    color: 'text-purple-600',
    bgColor: 'from-purple-600 to-pink-600',
    glow: 'shadow-purple-500/50',
    icon: Crown,
    particles: 'achievement'
  },
  LEGENDARY: {
    color: 'text-yellow-500',
    bgColor: 'from-yellow-500 to-orange-500',
    glow: 'shadow-yellow-500/50',
    icon: Star,
    particles: 'achievement'
  },
  EPIC: {
    color: 'text-blue-500',
    bgColor: 'from-blue-500 to-purple-500',
    glow: 'shadow-blue-500/50',
    icon: Sparkles,
    particles: 'celebration'
  },
  RARE: {
    color: 'text-green-500',
    bgColor: 'from-green-500 to-blue-500',
    glow: 'shadow-green-500/50',
    icon: Star,
    particles: 'points'
  },
  UNCOMMON: {
    color: 'text-gray-400',
    bgColor: 'from-gray-400 to-gray-600',
    glow: 'shadow-gray-500/50',
    icon: Sparkles,
    particles: 'points'
  },
  COMMON: {
    color: 'text-gray-600',
    bgColor: 'from-gray-600 to-gray-800',
    glow: 'shadow-gray-500/30',
    icon: Star,
    particles: 'points'
  }
};

export const EnhancedLootBoxOpening = ({
  isOpen,
  onClose,
  boxType = 'standard'
}: EnhancedLootBoxOpeningProps) => {
  const { openLootBox } = useGameification();
  const [isOpening, setIsOpening] = useState(false);
  const [result, setResult] = useState<LootBoxResult | null>(null);
  const [showParticles, setShowParticles] = useState(false);
  const [showPointAnimation, setShowPointAnimation] = useState(false);
  const [animationPhase, setAnimationPhase] = useState<'idle' | 'shaking' | 'opening' | 'revealing' | 'celebrating'>('idle');

  const handleOpenLootBox = async () => {
    setIsOpening(true);
    setAnimationPhase('shaking');

    // Shaking animation
    setTimeout(() => {
      setAnimationPhase('opening');
    }, 1000);

    // Opening animation  
    setTimeout(async () => {
      const lootResult = await openLootBox(boxType);
      if (lootResult) {
        setResult(lootResult);
        setAnimationPhase('revealing');
        
        // Show particles after reveal
        setTimeout(() => {
          setShowParticles(true);
          setAnimationPhase('celebrating');
          
          // Show point animation for epic+ tiers
          if (['GOD', 'LEGENDARY', 'EPIC'].includes(lootResult.tier)) {
            setShowPointAnimation(true);
          }
        }, 500);
      }
      setIsOpening(false);
    }, 2000);
  };

  const handleClose = () => {
    setResult(null);
    setShowParticles(false);
    setShowPointAnimation(false);
    setAnimationPhase('idle');
    onClose();
  };

  if (!isOpen) return null;

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
          <Card className="w-full max-w-md bg-gradient-to-br from-card/90 to-card/70 backdrop-blur-md border-2 border-primary/30">
            <CardContent className="p-8 text-center space-y-6">
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
                      <TierIcon className={`w-12 h-12 ${tierConfig?.color}`} />
                    </motion.div>
                  ) : (
                    <Gift className="w-12 h-12 text-primary-foreground" />
                  )}
                </motion.div>
              </div>

              {/* Content */}
              {!result ? (
                <div className="space-y-4">
                  <h2 className="text-2xl font-bold">
                    {isOpening ? 'Opening Loot Box...' : 'Ready to Open?'}
                  </h2>
                  <p className="text-muted-foreground">
                    {isOpening 
                      ? 'Unveiling your legendary username...' 
                      : 'Discover a new legendary anime character username!'
                    }
                  </p>
                  {!isOpening && (
                    <Button
                      onClick={handleOpenLootBox}
                      size="lg"
                      className="w-full bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90"
                    >
                      <Gift className="w-5 h-5 mr-2" />
                      Open Loot Box
                    </Button>
                  )}
                </div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4"
                >
                  <div className="space-y-2">
                    <h2 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                      Congratulations!
                    </h2>
                    <p className="text-muted-foreground">You received:</p>
                  </div>

                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.3, type: "spring", bounce: 0.5 }}
                    className={`p-6 rounded-lg bg-gradient-to-br ${tierConfig?.bgColor} text-white shadow-2xl ${tierConfig?.glow}`}
                  >
                    <div className="text-3xl font-bold mb-2">{result.username}</div>
                    <Badge variant="secondary" className="text-lg px-3 py-1">
                      {result.tier} TIER
                    </Badge>
                  </motion.div>

                  <Button
                    onClick={handleClose}
                    variant="outline"
                    className="w-full"
                  >
                    Awesome!
                  </Button>
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