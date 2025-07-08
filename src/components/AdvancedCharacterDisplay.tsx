import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Sparkles, Crown, Sword, Book, Star, Gem } from 'lucide-react';
import type { GeneratedCharacter } from '@/types/character';

interface AdvancedCharacterDisplayProps {
  character: GeneratedCharacter;
  showDetails?: boolean;
  showAnimation?: boolean;
  size?: 'small' | 'medium' | 'large';
  className?: string;
}

export const AdvancedCharacterDisplay = ({
  character,
  showDetails = true,
  showAnimation = true,
  size = 'medium',
  className = ''
}: AdvancedCharacterDisplayProps) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const [showSpecialEffects, setShowSpecialEffects] = useState(false);

  useEffect(() => {
    if (showAnimation) {
      setIsAnimating(true);
      setShowSpecialEffects(true);
      
      const timer = setTimeout(() => {
        setIsAnimating(false);
      }, character.character_data.animation.duration_ms);
      
      return () => clearTimeout(timer);
    }
  }, [showAnimation, character]);

  const tierConfig = {
    GOD: {
      gradient: 'from-purple-600 via-pink-500 to-yellow-500',
      icon: Crown,
      glow: 'shadow-2xl shadow-purple-500/50',
      border: 'border-4 border-purple-400'
    },
    LEGENDARY: {
      gradient: 'from-yellow-500 via-orange-500 to-red-500',
      icon: Star,
      glow: 'shadow-xl shadow-yellow-500/40',
      border: 'border-4 border-yellow-400'
    },
    EPIC: {
      gradient: 'from-blue-500 via-indigo-500 to-purple-500',
      icon: Sparkles,
      glow: 'shadow-lg shadow-blue-500/30',
      border: 'border-2 border-blue-400'
    },
    RARE: {
      gradient: 'from-green-500 via-teal-500 to-blue-500',
      icon: Sword,
      glow: 'shadow-md shadow-green-500/20',
      border: 'border-2 border-green-400'
    },
    UNCOMMON: {
      gradient: 'from-gray-400 via-slate-500 to-gray-600',
      icon: Book,
      glow: 'shadow-sm shadow-gray-500/10',
      border: 'border border-gray-400'
    },
    COMMON: {
      gradient: 'from-gray-500 via-gray-600 to-gray-700',
      icon: Gem,
      glow: '',
      border: 'border border-gray-500'
    }
  };

  const config = tierConfig[character.tier];
  const TierIcon = config.icon;

  const sizeClasses = {
    small: 'w-32 h-40',
    medium: 'w-48 h-60',
    large: 'w-64 h-80'
  };

  const visualData = character.character_data.visual_data;
  const specialEffects = visualData.special_effects || [];

  return (
    <motion.div
      className={`relative ${className}`}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.05 }}
      transition={{ duration: 0.3 }}
    >
      <Card className={`${sizeClasses[size]} ${config.border} ${config.glow} overflow-hidden relative`}>
        
        {/* Background Gradient */}
        <div className={`absolute inset-0 bg-gradient-to-br ${config.gradient} opacity-20`} />
        
        {/* Character Image/Visual Representation */}
        <CardContent className="relative h-full p-4 flex flex-col">
          
          {/* Character Avatar/Image Area */}
          <div className="flex-1 relative rounded-lg overflow-hidden mb-4">
            {character.image_url ? (
              <motion.img
                src={character.image_url}
                alt={character.username}
                className="w-full h-full object-cover"
                animate={isAnimating ? {
                  scale: [1, 1.1, 1],
                  rotate: [0, 2, 0, -2, 0]
                } : {}}
                transition={{ duration: 2, repeat: isAnimating ? 2 : 0 }}
              />
            ) : (
              <div 
                className="w-full h-full rounded-lg flex items-center justify-center text-6xl"
                style={{
                  background: `linear-gradient(135deg, ${visualData.hair_color}20, ${visualData.outfit_color}20)`,
                  color: visualData.accessory_color
                }}
              >
                <motion.div
                  animate={isAnimating ? {
                    rotate: [0, 360],
                    scale: [1, 1.2, 1]
                  } : {}}
                  transition={{ duration: 2 }}
                >
                  <TierIcon size={size === 'small' ? 32 : size === 'medium' ? 48 : 64} />
                </motion.div>
              </div>
            )}
            
            {/* Special Effects Overlay */}
            {showSpecialEffects && specialEffects.map((effect, index) => (
              <motion.div
                key={effect}
                className="absolute inset-0 pointer-events-none"
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 0.6, 0] }}
                transition={{ 
                  duration: 2, 
                  delay: index * 0.3,
                  repeat: showAnimation ? 2 : 0 
                }}
              >
                <div className={`w-full h-full bg-gradient-radial from-current to-transparent opacity-30`} 
                     style={{ color: visualData.accessory_color }} />
              </motion.div>
            ))}
          </div>
          
          {/* Character Info */}
          {showDetails && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Badge 
                  variant="secondary" 
                  className={`bg-gradient-to-r ${config.gradient} text-white font-bold`}
                >
                  <TierIcon size={12} className="mr-1" />
                  {character.tier}
                </Badge>
                
                {character.generation_method === 'ai' && (
                  <Badge variant="outline" className="text-xs">
                    <Sparkles size={10} className="mr-1" />
                    AI
                  </Badge>
                )}
              </div>
              
              <h3 className="font-bold text-sm truncate">{character.username}</h3>
              
              <div className="flex flex-wrap gap-1">
                {character.character_data.personality_traits.slice(0, 2).map((trait) => (
                  <Badge key={trait} variant="outline" className="text-xs">
                    {trait}
                  </Badge>
                ))}
              </div>
              
              {size === 'large' && (
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {character.character_data.description}
                </p>
              )}
            </div>
          )}
          
          {/* Tier-specific decorative elements */}
          {['GOD', 'LEGENDARY'].includes(character.tier) && (
            <div className="absolute top-2 right-2">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                className="w-6 h-6 rounded-full bg-gradient-to-r from-yellow-400 to-yellow-600 opacity-70"
              />
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Animation Particles for High Tiers */}
      {showAnimation && ['GOD', 'LEGENDARY', 'EPIC'].includes(character.tier) && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {[...Array(8)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-yellow-400 rounded-full"
              animate={{
                y: [0, -50, -100],
                x: [0, Math.sin(i) * 20, Math.sin(i) * 40],
                opacity: [0, 1, 0],
                scale: [0, 1, 0]
              }}
              transition={{
                duration: 3,
                delay: i * 0.2,
                repeat: isAnimating ? 3 : 0
              }}
              style={{
                left: `${20 + (i * 10)}%`,
                top: '100%'
              }}
            />
          ))}
        </div>
      )}
    </motion.div>
  );
};