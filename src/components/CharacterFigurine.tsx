import { motion } from 'framer-motion';
import { Crown, Star, Sparkles, Shield, Sword, Heart } from 'lucide-react';

interface CharacterFigurineProps {
  username: string;
  tier: 'GOD' | 'LEGENDARY' | 'EPIC' | 'RARE' | 'UNCOMMON' | 'COMMON';
  sourceAnime?: string;
  description?: string;
  personality?: string;
  className?: string;
}

const tierConfigs = {
  GOD: {
    color: 'from-purple-600 via-pink-500 to-yellow-500',
    glow: 'shadow-[0_0_50px_rgba(168,85,247,0.8)]',
    icon: Crown,
    particles: 'rgba(168,85,247,0.6)',
    animation: 'animate-pulse',
    textColor: 'text-purple-300'
  },
  LEGENDARY: {
    color: 'from-yellow-500 via-orange-500 to-red-500',
    glow: 'shadow-[0_0_40px_rgba(245,158,11,0.6)]',
    icon: Star,
    particles: 'rgba(245,158,11,0.5)',
    animation: 'animate-bounce',
    textColor: 'text-yellow-300'
  },
  EPIC: {
    color: 'from-blue-500 via-indigo-500 to-purple-500',
    glow: 'shadow-[0_0_30px_rgba(59,130,246,0.5)]',
    icon: Sparkles,
    particles: 'rgba(59,130,246,0.4)',
    animation: 'animate-pulse',
    textColor: 'text-blue-300'
  },
  RARE: {
    color: 'from-green-500 via-teal-500 to-blue-500',
    glow: 'shadow-[0_0_25px_rgba(34,197,94,0.4)]',
    icon: Shield,
    particles: 'rgba(34,197,94,0.3)',
    animation: '',
    textColor: 'text-green-300'
  },
  UNCOMMON: {
    color: 'from-gray-500 via-slate-500 to-gray-600',
    glow: 'shadow-[0_0_20px_rgba(107,114,128,0.3)]',
    icon: Sword,
    particles: 'rgba(107,114,128,0.2)',
    animation: '',
    textColor: 'text-gray-300'
  },
  COMMON: {
    color: 'from-gray-600 via-gray-700 to-gray-800',
    glow: 'shadow-[0_0_15px_rgba(75,85,99,0.2)]',
    icon: Heart,
    particles: 'rgba(75,85,99,0.1)',
    animation: '',
    textColor: 'text-gray-400'
  }
};

// Generate character appearance based on username
const generateCharacterTraits = (username: string, tier: string) => {
  const hash = username.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  
  const hairColors = ['#8B4513', '#FFD700', '#FF6347', '#4169E1', '#32CD32', '#FF69B4'];
  const eyeColors = ['#1E90FF', '#32CD32', '#FF6347', '#9370DB', '#FFD700', '#FF69B4'];
  const outfitColors = ['#FF4500', '#4169E1', '#32CD32', '#FF69B4', '#FFD700', '#8B4513'];
  
  return {
    hairColor: hairColors[hash % hairColors.length],
    eyeColor: eyeColors[(hash * 2) % eyeColors.length],
    outfitColor: outfitColors[(hash * 3) % outfitColors.length],
    pose: hash % 3, // 0: standing, 1: action, 2: peaceful
    accessory: tier === 'GOD' ? 'crown' : tier === 'LEGENDARY' ? 'cape' : tier === 'EPIC' ? 'aura' : 'none'
  };
};

export const CharacterFigurine = ({ 
  username, 
  tier, 
  sourceAnime, 
  description, 
  personality,
  className = ""
}: CharacterFigurineProps) => {
  const config = tierConfigs[tier];
  const traits = generateCharacterTraits(username, tier);
  const TierIcon = config.icon;

  return (
    <motion.div 
      className={`relative ${className}`}
      initial={{ scale: 0, rotate: -180 }}
      animate={{ scale: 1, rotate: 0 }}
      transition={{ duration: 0.8, type: "spring", bounce: 0.4 }}
    >
      {/* Character Container */}
      <div className={`relative w-32 h-40 rounded-2xl bg-gradient-to-br ${config.color} p-1 ${config.glow} ${config.animation}`}>
        {/* Inner Character Space */}
        <div className="w-full h-full rounded-xl bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm relative overflow-hidden">
          
          {/* Tier Icon */}
          <div className="absolute top-2 left-2 z-10">
            <TierIcon className={`w-4 h-4 ${config.textColor}`} />
          </div>
          
          {/* Character SVG */}
          <div className="absolute inset-0 flex items-center justify-center">
            <svg width="80" height="100" viewBox="0 0 80 100" className="drop-shadow-lg">
              {/* Head */}
              <circle cx="40" cy="25" r="12" fill="#FDBCB4" stroke="#E8B4B8" strokeWidth="1"/>
              
              {/* Hair */}
              <path d="M28 20 Q40 10 52 20 L50 15 Q40 8 30 15 Z" fill={traits.hairColor} />
              
              {/* Eyes */}
              <circle cx="36" cy="23" r="2" fill={traits.eyeColor} />
              <circle cx="44" cy="23" r="2" fill={traits.eyeColor} />
              
              {/* Body */}
              <rect x="32" y="37" width="16" height="25" rx="8" fill={traits.outfitColor} />
              
              {/* Arms */}
              <rect x="24" y="40" width="8" height="15" rx="4" fill="#FDBCB4" />
              <rect x="48" y="40" width="8" height="15" rx="4" fill="#FDBCB4" />
              
              {/* Legs */}
              <rect x="34" y="62" width="6" height="20" rx="3" fill="#4A5568" />
              <rect x="40" y="62" width="6" height="20" rx="3" fill="#4A5568" />
              
              {/* Accessories */}
              {traits.accessory === 'crown' && (
                <path d="M30 15 L35 10 L40 12 L45 10 L50 15 L48 18 L32 18 Z" fill="#FFD700" />
              )}
              {traits.accessory === 'cape' && (
                <path d="M25 45 Q40 40 55 45 L50 70 Q40 65 30 70 Z" fill="#8B0000" opacity="0.8" />
              )}
              {traits.accessory === 'aura' && (
                <circle cx="40" cy="50" r="35" fill="none" stroke={config.particles} strokeWidth="2" opacity="0.6" />
              )}
              
              {/* Pose variations */}
              {traits.pose === 1 && (
                <g transform="rotate(10 40 50)">
                  <rect x="48" y="35" width="8" height="15" rx="4" fill="#FDBCB4" />
                </g>
              )}
            </svg>
          </div>
          
          {/* Floating particles */}
          {tier !== 'COMMON' && tier !== 'UNCOMMON' && (
            <div className="absolute inset-0 pointer-events-none">
              {[...Array(tier === 'GOD' ? 8 : tier === 'LEGENDARY' ? 6 : 4)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-1 h-1 rounded-full"
                  animate={{
                    y: [-10, -20, -10],
                    x: [0, Math.sin(i) * 10, 0],
                    opacity: [0.3, 0.8, 0.3]
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    delay: i * 0.3
                  }}
                  style={{
                    backgroundColor: config.particles,
                    left: `${20 + (i * 10)}%`,
                    top: `${20 + (i % 2) * 10}%`
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </div>
      
      {/* Character Info */}
      <div className="mt-3 text-center">
        <div className={`font-bold text-sm ${config.textColor}`}>
          {username}
        </div>
        {sourceAnime && (
          <div className="text-xs text-muted-foreground mt-1">
            from {sourceAnime}
          </div>
        )}
        {description && (
          <div className="text-xs text-muted-foreground mt-1 max-w-32 mx-auto">
            {description}
          </div>
        )}
      </div>
    </motion.div>
  );
};