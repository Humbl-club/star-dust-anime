import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Star, Trophy, Gift } from 'lucide-react';

interface PointAnimationProps {
  points: number;
  type?: 'points' | 'achievement' | 'lootbox' | 'streak';
  position?: { x: number; y: number };
  onComplete?: () => void;
}

const animationConfigs = {
  points: {
    icon: Zap,
    color: 'text-primary',
    bgColor: 'bg-primary/20',
    prefix: '+',
    suffix: ' pts'
  },
  achievement: {
    icon: Trophy,
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-500/20',
    prefix: '+',
    suffix: ' pts'
  },
  lootbox: {
    icon: Gift,
    color: 'text-purple-500',
    bgColor: 'bg-purple-500/20',
    prefix: '',
    suffix: ' username!'
  },
  streak: {
    icon: Star,
    color: 'text-orange-500',
    bgColor: 'bg-orange-500/20',
    prefix: '',
    suffix: ' day streak!'
  }
};

export const PointAnimation = ({
  points,
  type = 'points',
  position,
  onComplete
}: PointAnimationProps) => {
  const [isVisible, setIsVisible] = useState(true);
  const config = animationConfigs[type];
  const Icon = config.icon;

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      onComplete?.();
    }, 2000);

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className={`fixed z-50 pointer-events-none`}
          style={{
            left: position?.x || '50%',
            top: position?.y || '50%',
            transform: 'translate(-50%, -50%)'
          }}
          initial={{
            opacity: 0,
            scale: 0.5,
            y: 20
          }}
          animate={{
            opacity: [0, 1, 1, 0],
            scale: [0.5, 1.2, 1, 0.8],
            y: [20, -10, -20, -40]
          }}
          exit={{
            opacity: 0,
            scale: 0
          }}
          transition={{
            duration: 2,
            times: [0, 0.2, 0.8, 1],
            ease: "easeOut"
          }}
        >
          <div className={`flex items-center gap-2 px-4 py-2 rounded-full ${config.bgColor} backdrop-blur-sm border border-white/20 shadow-lg`}>
            <Icon className={`w-5 h-5 ${config.color}`} />
            <span className={`font-bold text-lg ${config.color}`}>
              {config.prefix}{points}{config.suffix}
            </span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};