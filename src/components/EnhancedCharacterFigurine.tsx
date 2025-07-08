import { motion } from 'framer-motion';
import { Crown, Star, Sparkles, Shield, Sword, Heart } from 'lucide-react';
import type { GeneratedCharacter } from '@/types/character';

interface EnhancedCharacterFigurineProps {
  character: GeneratedCharacter;
  className?: string;
  showAnimation?: boolean;
  onAnimationComplete?: () => void;
}

const tierConfigs = {
  GOD: {
    borderGradient: 'from-purple-500 via-pink-500 to-yellow-500',
    glowColor: 'shadow-[0_0_30px_rgba(168,85,247,0.8)]',
    icon: Crown,
    particles: true,
    pulseSpeed: 2
  },
  LEGENDARY: {
    borderGradient: 'from-yellow-500 via-orange-500 to-red-500',
    glowColor: 'shadow-[0_0_25px_rgba(245,158,11,0.6)]',
    icon: Star,
    particles: true,
    pulseSpeed: 2.5
  },
  EPIC: {
    borderGradient: 'from-blue-500 via-indigo-500 to-purple-500',
    glowColor: 'shadow-[0_0_20px_rgba(59,130,246,0.5)]',
    icon: Sparkles,
    particles: true,
    pulseSpeed: 3
  },
  RARE: {
    borderGradient: 'from-green-500 via-teal-500 to-blue-500',
    glowColor: 'shadow-[0_0_15px_rgba(34,197,94,0.4)]',
    icon: Shield,
    particles: false,
    pulseSpeed: 3.5
  },
  UNCOMMON: {
    borderGradient: 'from-gray-400 via-slate-500 to-gray-600',
    glowColor: 'shadow-[0_0_10px_rgba(107,114,128,0.3)]',
    icon: Sword,
    particles: false,
    pulseSpeed: 4
  },
  COMMON: {
    borderGradient: 'from-gray-500 via-gray-600 to-gray-700',
    glowColor: 'shadow-[0_0_8px_rgba(75,85,99,0.2)]',
    icon: Heart,
    particles: false,
    pulseSpeed: 4
  }
};

export const EnhancedCharacterFigurine = ({ 
  character, 
  className = "",
  showAnimation = true,
  onAnimationComplete
}: EnhancedCharacterFigurineProps) => {
  const config = tierConfigs[character.tier];
  const TierIcon = config.icon;
  const { visual_data, template, variation, animation } = character.character_data;

  // Animation variants based on character's animation set
  const getAnimationVariants = () => {
    const animConfig = animation.animation_config;
    
    switch (animConfig.movement) {
      case 'floating':
        return {
          initial: { scale: 0, y: -100, opacity: 0, rotate: -180 },
          animate: { 
            scale: 1, 
            y: [0, -10, 0], 
            opacity: 1, 
            rotate: 0
          }
        };
      
      case 'confident_stride':
        return {
          initial: { scale: 0, x: -100, opacity: 0 },
          animate: { 
            scale: 1, 
            x: 0, 
            opacity: 1
          }
        };
      
      case 'ethereal_float':
        return {
          initial: { scale: 0, opacity: 0 },
          animate: { 
            scale: 1, 
            opacity: 1,
            y: [0, -5, 0]
          }
        };
      
      default:
        return {
          initial: { scale: 0, opacity: 0, rotate: -90 },
          animate: { 
            scale: 1, 
            opacity: 1, 
            rotate: 0
          }
        };
    }
  };

  const animationVariants = showAnimation ? getAnimationVariants() : {
    initial: { scale: 1, opacity: 1 },
    animate: { scale: 1, opacity: 1 }
  };

  return (
    <motion.div 
      className={`relative ${className}`}
      variants={animationVariants}
      initial="initial"
      animate="animate"
      onAnimationComplete={onAnimationComplete}
    >
      {/* Character Container */}
      <div className={`relative w-40 h-48 rounded-2xl bg-gradient-to-br ${config.borderGradient} p-1 ${config.glowColor}`}>
        {/* Inner Character Space */}
        <div className="w-full h-full rounded-xl bg-gradient-to-br from-background/95 to-background/90 backdrop-blur-sm relative overflow-hidden">
          
          {/* Tier Icon */}
          <div className="absolute top-2 left-2 z-10">
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: config.pulseSpeed, repeat: Infinity }}
            >
              <TierIcon className="w-5 h-5 text-primary" />
            </motion.div>
          </div>

          {/* Character Name */}
          <div className="absolute top-2 right-2 text-xs font-bold text-primary truncate max-w-24">
            {character.username}
          </div>
          
          {/* Character Visual */}
          <div className="absolute inset-0 flex items-center justify-center">
            {character.image_url ? (
              // AI-generated image
              <motion.img
                src={character.image_url}
                alt={character.username}
                className="w-32 h-36 object-cover rounded-lg"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 }}
              />
            ) : (
              // Procedural SVG character
              <motion.svg 
                width="100" 
                height="120" 
                viewBox="0 0 100 120" 
                className="drop-shadow-lg"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                {/* Character Body */}
                <g transform={`scale(${template.base_config.pose === 'commanding' ? '1.1' : '1'})`}>
                  {/* Head */}
                  <circle 
                    cx="50" 
                    cy="30" 
                    r="15" 
                    fill={visual_data.skin_tone} 
                    stroke="#E8B4B8" 
                    strokeWidth="1"
                  />
                  
                  {/* Hair */}
                  <path 
                    d={variation.variation_config.hair_style === 'long' 
                      ? "M35 25 Q50 15 65 25 L63 20 Q50 10 37 20 Z M35 25 L35 35 Q50 30 65 35 L65 25"
                      : variation.variation_config.hair_style === 'spiky'
                      ? "M35 25 L40 15 L45 20 L50 12 L55 20 L60 15 L65 25 L60 22 L50 18 L40 22 Z"
                      : "M35 25 Q50 15 65 25 L63 20 Q50 12 37 20 Z"
                    }
                    fill={visual_data.hair_color} 
                  />
                  
                  {/* Eyes */}
                  <circle cx="44" cy="28" r="2.5" fill={visual_data.eye_color} />
                  <circle cx="56" cy="28" r="2.5" fill={visual_data.eye_color} />
                  <circle cx="44" cy="28" r="1" fill="white" />
                  <circle cx="56" cy="28" r="1" fill="white" />
                  
                  {/* Body */}
                  <rect 
                    x="38" 
                    y="45" 
                    width="24" 
                    height="35" 
                    rx="12" 
                    fill={visual_data.outfit_color} 
                  />
                  
                  {/* Arms */}
                  <rect 
                    x={template.base_config.pose === 'commanding' ? "28" : "30"} 
                    y="50" 
                    width="12" 
                    height="20" 
                    rx="6" 
                    fill={visual_data.skin_tone}
                    transform={template.base_config.pose === 'commanding' ? "rotate(-15 34 60)" : ""}
                  />
                  <rect 
                    x={template.base_config.pose === 'commanding' ? "60" : "58"} 
                    y="50" 
                    width="12" 
                    height="20" 
                    rx="6" 
                    fill={visual_data.skin_tone}
                    transform={template.base_config.pose === 'commanding' ? "rotate(15 66 60)" : ""}
                  />
                  
                  {/* Legs */}
                  <rect x="42" y="80" width="8" height="25" rx="4" fill="#4A5568" />
                  <rect x="50" y="80" width="8" height="25" rx="4" fill="#4A5568" />
                  
                  {/* Accessories */}
                  {template.base_config.accessories.includes('crown') && (
                    <path 
                      d="M38 20 L42 15 L46 18 L50 14 L54 18 L58 15 L62 20 L60 24 L40 24 Z" 
                      fill={visual_data.accessory_color}
                    />
                  )}
                  {template.base_config.accessories.includes('cape') && (
                    <path 
                      d="M30 55 Q50 50 70 55 L68 85 Q50 80 32 85 Z" 
                      fill={visual_data.accessory_color} 
                      opacity="0.8" 
                    />
                  )}
                  {template.base_config.accessories.includes('weapon') && (
                    <rect 
                      x="70" 
                      y="40" 
                      width="3" 
                      height="20" 
                      fill={visual_data.accessory_color}
                      transform="rotate(45 71.5 50)"
                    />
                  )}
                </g>
              </motion.svg>
            )}
          </div>
          
          {/* Floating particles for high-tier characters */}
          {config.particles && (
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              {[...Array(character.tier === 'GOD' ? 12 : 8)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-1 h-1 rounded-full bg-primary"
                  animate={{
                    y: [-10, -30, -10],
                    x: [0, Math.sin(i) * 15, 0],
                    opacity: [0.3, 0.8, 0.3],
                    scale: [0.5, 1, 0.5]
                  }}
                  transition={{
                    duration: 3 + (i * 0.2),
                    repeat: Infinity,
                    delay: i * 0.3
                  }}
                  style={{
                    left: `${15 + (i * 8)}%`,
                    top: `${20 + (i % 3) * 15}%`
                  }}
                />
              ))}
            </div>
          )}

          {/* Tier badge */}
          <div className="absolute bottom-2 left-2 right-2">
            <div className={`text-xs font-bold text-center p-1 rounded bg-gradient-to-r ${config.borderGradient} text-white`}>
              {character.tier}
            </div>
          </div>
        </div>
      </div>
      
      {/* Character Info */}
      <motion.div 
        className="mt-3 text-center space-y-1"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <div className="font-bold text-sm text-foreground">
          {character.username}
        </div>
        <div className="text-xs text-muted-foreground">
          {template.template_name}
        </div>
        {character.character_data.personality_traits && (
          <div className="text-xs text-muted-foreground">
            {character.character_data.personality_traits.slice(0, 2).join(', ')}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};