import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AdvancedCharacterDisplay } from '@/components/AdvancedCharacterDisplay';
import { ParticleEffect } from '@/components/ParticleEffect';
import type { GeneratedCharacter } from '@/types/character';

interface EnhancedLootBoxAnimationProps {
  isOpen: boolean;
  character: GeneratedCharacter | null;
  onAnimationComplete: () => void;
  onCharacterRevealed: () => void;
}

type AnimationPhase = 
  | 'box_shake' 
  | 'box_open' 
  | 'light_burst' 
  | 'character_emerge' 
  | 'character_showcase' 
  | 'particles_celebration' 
  | 'complete';

export const EnhancedLootBoxAnimation = ({
  isOpen,
  character,
  onAnimationComplete,
  onCharacterRevealed
}: EnhancedLootBoxAnimationProps) => {
  const [currentPhase, setCurrentPhase] = useState<AnimationPhase>('box_shake');
  const [showParticles, setShowParticles] = useState(false);
  const [showCharacter, setShowCharacter] = useState(false);

  useEffect(() => {
    if (!isOpen || !character) return;

    const sequence = async () => {
      const animConfig = character.character_data.animation.animation_config;
      const totalDuration = character.character_data.animation.duration_ms;
      
      // Phase 1: Box shake (20% of animation)
      setCurrentPhase('box_shake');
      await delay(totalDuration * 0.2);
      
      // Phase 2: Box opening (15% of animation)
      setCurrentPhase('box_open');
      await delay(totalDuration * 0.15);
      
      // Phase 3: Light burst (10% of animation)
      setCurrentPhase('light_burst');
      setShowParticles(true);
      await delay(totalDuration * 0.1);
      
      // Phase 4: Character emergence (25% of animation)
      setCurrentPhase('character_emerge');
      setShowCharacter(true);
      onCharacterRevealed();
      await delay(totalDuration * 0.25);
      
      // Phase 5: Character showcase (20% of animation)
      setCurrentPhase('character_showcase');
      await delay(totalDuration * 0.2);
      
      // Phase 6: Celebration particles (10% of animation)
      setCurrentPhase('particles_celebration');
      await delay(totalDuration * 0.1);
      
      // Complete
      setCurrentPhase('complete');
      onAnimationComplete();
    };

    sequence();
  }, [isOpen, character, onAnimationComplete, onCharacterRevealed]);

  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  if (!isOpen || !character) return null;

  const tierConfig = {
    GOD: {
      boxGradient: 'from-purple-600 via-pink-500 to-yellow-500',
      lightColor: 'rgba(255, 215, 0, 0.8)',
      particleType: 'achievement' as const,
      glowIntensity: 'high' as const
    },
    LEGENDARY: {
      boxGradient: 'from-yellow-500 via-orange-500 to-red-500',
      lightColor: 'rgba(255, 165, 0, 0.7)',
      particleType: 'achievement' as const,
      glowIntensity: 'high' as const
    },
    EPIC: {
      boxGradient: 'from-blue-500 via-indigo-500 to-purple-500',
      lightColor: 'rgba(138, 43, 226, 0.6)',
      particleType: 'celebration' as const,
      glowIntensity: 'medium' as const
    },
    RARE: {
      boxGradient: 'from-green-500 via-teal-500 to-blue-500',
      lightColor: 'rgba(34, 197, 94, 0.5)',
      particleType: 'points' as const,
      glowIntensity: 'medium' as const
    },
    UNCOMMON: {
      boxGradient: 'from-gray-400 via-slate-500 to-gray-600',
      lightColor: 'rgba(107, 114, 128, 0.4)',
      particleType: 'points' as const,
      glowIntensity: 'low' as const
    },
    COMMON: {
      boxGradient: 'from-gray-500 via-gray-600 to-gray-700',
      lightColor: 'rgba(75, 85, 99, 0.3)',
      particleType: 'points' as const,
      glowIntensity: 'low' as const
    }
  };

  const config = tierConfig[character.tier];

  const getBoxAnimation = () => {
    switch (currentPhase) {
      case 'box_shake':
        return {
          x: [-3, 3, -3, 3, 0],
          y: [-2, 2, -2, 2, 0],
          rotate: [-1, 1, -1, 1, 0],
          transition: { duration: 0.5, repeat: 3 }
        };
      
      case 'box_open':
        return {
          scale: [1, 1.2, 1.4],
          rotateY: [0, 180, 360],
          transition: { duration: 1 }
        };
      
      case 'light_burst':
        return {
          scale: [1.4, 2, 3],
          opacity: [1, 0.7, 0],
          transition: { duration: 0.8 }
        };
      
      default:
        return { opacity: 0 };
    }
  };

  const getLightBurstAnimation = () => {
    if (currentPhase !== 'light_burst') return { opacity: 0 };
    
    return {
      scale: [0, 1.5, 2],
      opacity: [0, 0.8, 0],
      transition: { duration: 0.8 }
    };
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center">
      <div className="relative w-full h-full flex items-center justify-center">
        
        {/* Loot Box */}
        <AnimatePresence>
          {currentPhase !== 'complete' && !showCharacter && (
            <motion.div
              className={`w-32 h-32 rounded-2xl bg-gradient-to-br ${config.boxGradient} shadow-2xl flex items-center justify-center`}
              animate={getBoxAnimation()}
              exit={{ opacity: 0, scale: 0 }}
            >
              <div className="w-16 h-16 bg-white/20 rounded-lg flex items-center justify-center">
                <div className="w-8 h-8 bg-white/40 rounded"></div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Light Burst Effect */}
        <motion.div
          className="absolute inset-0 flex items-center justify-center pointer-events-none"
          animate={getLightBurstAnimation()}
        >
          <div 
            className="w-64 h-64 rounded-full"
            style={{
              background: `radial-gradient(circle, ${config.lightColor} 0%, transparent 70%)`,
              filter: 'blur(10px)'
            }}
          />
        </motion.div>

        {/* Character */}
        <AnimatePresence>
          {showCharacter && (
            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              className="relative z-10"
            >
              <AdvancedCharacterDisplay
                character={character}
                showAnimation={true}
                size="large"
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tier Announcement */}
        <AnimatePresence>
          {currentPhase === 'character_showcase' && (
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -50 }}
              className="absolute top-1/4 left-1/2 transform -translate-x-1/2"
            >
              <div className={`px-8 py-4 rounded-2xl bg-gradient-to-r ${config.boxGradient} text-white text-center shadow-2xl`}>
                <div className="text-3xl font-bold mb-2">{character.tier} TIER</div>
                <div className="text-lg">{character.username}</div>
                <div className="text-sm opacity-90">{character.character_data.template.template_name}</div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Floating Character Details */}
        <AnimatePresence>
          {currentPhase === 'particles_celebration' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="absolute bottom-1/4 left-1/2 transform -translate-x-1/2 text-center"
            >
              <div className="bg-background/90 backdrop-blur-sm rounded-xl p-4 shadow-xl border border-border">
                <div className="text-sm text-muted-foreground mb-2">
                  {character.character_data.personality_traits.join(' • ')}
                </div>
                <div className="text-xs text-muted-foreground">
                  {character.character_data.description}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Particle Effects */}
        <ParticleEffect
          trigger={showParticles}
          type={config.particleType}
          intensity={config.glowIntensity}
          onComplete={() => setShowParticles(false)}
        />

        {/* Background Environment Effects */}
        {['GOD', 'LEGENDARY'].includes(character.tier) && currentPhase === 'character_showcase' && (
          <div className="absolute inset-0 pointer-events-none">
            {[...Array(20)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-2 h-2 bg-primary rounded-full opacity-60"
                animate={{
                  y: [0, -100, -200],
                  x: [0, Math.sin(i) * 50, Math.sin(i) * 100],
                  opacity: [0, 0.8, 0],
                  scale: [0, 1, 0]
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  delay: i * 0.1
                }}
                style={{
                  left: `${Math.random() * 100}%`,
                  top: '100%'
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};