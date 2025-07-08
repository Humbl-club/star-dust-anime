import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  color: string;
  velocity: { x: number; y: number };
  life: number;
}

interface ParticleEffectProps {
  trigger: boolean;
  type?: 'celebration' | 'points' | 'achievement' | 'lootbox';
  intensity?: 'low' | 'medium' | 'high';
  colors?: string[];
  onComplete?: () => void;
}

const particleConfigs = {
  celebration: {
    count: 30,
    colors: ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4'],
    size: { min: 4, max: 12 },
    velocity: { min: -5, max: 5 },
    life: 2000
  },
  points: {
    count: 15,
    colors: ['#10b981', '#059669', '#34d399'],
    size: { min: 3, max: 8 },
    velocity: { min: -3, max: 3 },
    life: 1500
  },
  achievement: {
    count: 50,
    colors: ['#FFD700', '#FFA500', '#FF4500', '#8A2BE2'],
    size: { min: 6, max: 16 },
    velocity: { min: -8, max: 8 },
    life: 3000
  },
  lootbox: {
    count: 25,
    colors: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFD93D'],
    size: { min: 5, max: 14 },
    velocity: { min: -6, max: 6 },
    life: 2500
  }
};

export const ParticleEffect = ({
  trigger,
  type = 'celebration',
  intensity = 'medium',
  colors,
  onComplete
}: ParticleEffectProps) => {
  const [particles, setParticles] = useState<Particle[]>([]);

  const config = particleConfigs[type];
  const intensityMultiplier = { low: 0.5, medium: 1, high: 1.5 }[intensity];
  const particleCount = Math.floor(config.count * intensityMultiplier);
  const particleColors = colors || config.colors;

  useEffect(() => {
    if (!trigger) return;

    const newParticles: Particle[] = [];
    
    for (let i = 0; i < particleCount; i++) {
      newParticles.push({
        id: Math.random(),
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        size: Math.random() * (config.size.max - config.size.min) + config.size.min,
        color: particleColors[Math.floor(Math.random() * particleColors.length)],
        velocity: {
          x: (Math.random() - 0.5) * (config.velocity.max - config.velocity.min),
          y: (Math.random() - 0.5) * (config.velocity.max - config.velocity.min)
        },
        life: config.life
      });
    }

    setParticles(newParticles);

    const cleanup = setTimeout(() => {
      setParticles([]);
      onComplete?.();
    }, config.life);

    return () => clearTimeout(cleanup);
  }, [trigger, particleCount, config, particleColors, onComplete]);

  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      <AnimatePresence>
        {particles.map((particle) => (
          <motion.div
            key={particle.id}
            className="absolute rounded-full"
            style={{
              width: particle.size,
              height: particle.size,
              backgroundColor: particle.color,
              left: particle.x,
              top: particle.y,
            }}
            initial={{
              opacity: 1,
              scale: 0,
              x: 0,
              y: 0,
            }}
            animate={{
              opacity: [1, 1, 0],
              scale: [0, 1, 0],
              x: particle.velocity.x * 20,
              y: particle.velocity.y * 20,
            }}
            exit={{
              opacity: 0,
              scale: 0,
            }}
            transition={{
              duration: particle.life / 1000,
              ease: "easeOut",
            }}
          />
        ))}
      </AnimatePresence>
    </div>
  );
};