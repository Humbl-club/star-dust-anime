import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Crown, 
  Trophy, 
  Star, 
  Sparkles, 
  Gift, 
  Package,
  Zap,
  Coins
} from "lucide-react";

interface LootBoxAnimationProps {
  isOpen: boolean;
  onClose: () => void;
  boxType: 'standard' | 'premium' | 'ultra';
  result?: {
    username: string;
    tier: 'GOD' | 'LEGENDARY' | 'EPIC' | 'RARE' | 'UNCOMMON' | 'COMMON';
    serverSeed?: string;
    nonce?: number;
    hash?: string;
  } | null;
  isOpening: boolean;
}

const getTierIcon = (tier: string) => {
  switch (tier) {
    case 'GOD': return <Crown className="w-8 h-8 text-yellow-500" />;
    case 'LEGENDARY': return <Trophy className="w-8 h-8 text-purple-500" />;
    case 'EPIC': return <Star className="w-8 h-8 text-blue-500" />;
    case 'RARE': return <Sparkles className="w-8 h-8 text-green-500" />;
    case 'UNCOMMON': return <Gift className="w-8 h-8 text-gray-500" />;
    default: return <Package className="w-8 h-8 text-gray-400" />;
  }
};

const getTierColor = (tier: string) => {
  switch (tier) {
    case 'GOD': return 'from-yellow-400 via-yellow-500 to-yellow-600';
    case 'LEGENDARY': return 'from-purple-400 via-purple-500 to-purple-600';
    case 'EPIC': return 'from-blue-400 via-blue-500 to-blue-600';
    case 'RARE': return 'from-green-400 via-green-500 to-green-600';
    case 'UNCOMMON': return 'from-gray-400 via-gray-500 to-gray-600';
    default: return 'from-gray-300 via-gray-400 to-gray-500';
  }
};

const getBoxColor = (boxType: string) => {
  switch (boxType) {
    case 'ultra': return 'from-yellow-400 to-yellow-600';
    case 'premium': return 'from-purple-400 to-purple-600';
    default: return 'from-blue-400 to-blue-600';
  }
};

export const LootBoxAnimation = ({ 
  isOpen, 
  onClose, 
  boxType, 
  result, 
  isOpening 
}: LootBoxAnimationProps) => {
  const [animationStage, setAnimationStage] = useState<'box' | 'opening' | 'reveal'>('box');
  const [showParticles, setShowParticles] = useState(false);

  useEffect(() => {
    if (isOpening) {
      setAnimationStage('opening');
      setShowParticles(true);
      
      // After 3 seconds, show the reveal
      const timer = setTimeout(() => {
        if (result) {
          setAnimationStage('reveal');
        }
      }, 3000);
      
      return () => clearTimeout(timer);
    } else if (isOpen) {
      setAnimationStage('box');
      setShowParticles(false);
    }
  }, [isOpening, result, isOpen]);

  const particles = Array.from({ length: 20 }, (_, i) => (
    <motion.div
      key={i}
      className="absolute w-2 h-2 bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-full"
      initial={{ 
        opacity: 0,
        scale: 0,
        x: 0,
        y: 0,
      }}
      animate={{ 
        opacity: showParticles ? [0, 1, 0] : 0,
        scale: showParticles ? [0, 1, 0] : 0,
        x: showParticles ? Math.random() * 400 - 200 : 0,
        y: showParticles ? Math.random() * 400 - 200 : 0,
      }}
      transition={{ 
        duration: 2,
        delay: Math.random() * 0.5,
        repeat: showParticles ? Infinity : 0,
        repeatDelay: Math.random() * 2
      }}
    />
  ));

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md w-full p-0 bg-transparent border-none overflow-hidden">
        <div className="relative w-full h-96 flex items-center justify-center">
          {/* Particles */}
          <div className="absolute inset-0 pointer-events-none">
            {particles}
          </div>

          <AnimatePresence mode="wait">
            {animationStage === 'box' && (
              <motion.div
                key="box"
                initial={{ scale: 0, rotateY: 0 }}
                animate={{ scale: 1, rotateY: 360 }}
                exit={{ scale: 0.5, opacity: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="flex flex-col items-center space-y-4"
              >
                <motion.div
                  animate={{ 
                    y: [0, -10, 0],
                    rotateZ: [0, 5, -5, 0]
                  }}
                  transition={{ 
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  className={`w-32 h-32 bg-gradient-to-br ${getBoxColor(boxType)} rounded-xl shadow-2xl flex items-center justify-center border-4 border-white/30`}
                >
                  <Package className="w-16 h-16 text-white" />
                </motion.div>
                <div className="text-center">
                  <h3 className="text-xl font-bold capitalize text-white mb-2">
                    {boxType} Loot Box
                  </h3>
                  <p className="text-white/80 text-sm">Ready to open!</p>
                </div>
              </motion.div>
            )}

            {animationStage === 'opening' && (
              <motion.div
                key="opening"
                initial={{ scale: 1 }}
                animate={{ 
                  scale: [1, 1.2, 0.8, 1.5],
                  rotateZ: [0, 10, -10, 0],
                  opacity: [1, 1, 1, 0]
                }}
                transition={{ duration: 3, ease: "easeInOut" }}
                className="flex flex-col items-center space-y-4"
              >
                <motion.div
                  animate={{ 
                    scale: [1, 1.1, 1],
                    rotate: [0, 360]
                  }}
                  transition={{ 
                    duration: 0.5,
                    repeat: Infinity,
                    ease: "linear"
                  }}
                  className={`w-32 h-32 bg-gradient-to-br ${getBoxColor(boxType)} rounded-xl shadow-2xl flex items-center justify-center border-4 border-white/30 relative overflow-hidden`}
                >
                  <motion.div
                    animate={{ opacity: [0, 1, 0] }}
                    transition={{ duration: 0.5, repeat: Infinity }}
                    className="absolute inset-0 bg-white/20"
                  />
                  <Zap className="w-16 h-16 text-white" />
                </motion.div>
                <div className="text-center">
                  <h3 className="text-xl font-bold text-white mb-2">
                    Opening...
                  </h3>
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 1, repeat: Infinity }}
                    className="text-white/80 text-sm"
                  >
                    ✨ Magic is happening ✨
                  </motion.div>
                </div>
              </motion.div>
            )}

            {animationStage === 'reveal' && result && (
              <motion.div
                key="reveal"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ 
                  duration: 0.8, 
                  ease: "backOut",
                  delay: 0.2
                }}
                className="flex flex-col items-center space-y-6 max-w-sm"
              >
                {/* Tier Icon with Glow */}
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ duration: 0.8, delay: 0.4 }}
                  className="relative"
                >
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className={`w-24 h-24 bg-gradient-to-br ${getTierColor(result.tier)} rounded-full flex items-center justify-center shadow-2xl relative`}
                  >
                    <motion.div
                      animate={{ opacity: [0.5, 0.8, 0.5] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                      className={`absolute inset-0 bg-gradient-to-br ${getTierColor(result.tier)} rounded-full blur-lg opacity-50`}
                    />
                    {getTierIcon(result.tier)}
                  </motion.div>
                </motion.div>

                {/* Username */}
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.6, delay: 0.8 }}
                  className="text-center space-y-3"
                >
                  <h2 className="text-2xl font-bold text-white">Congratulations!</h2>
                  <div className={`px-6 py-3 bg-gradient-to-r ${getTierColor(result.tier)} rounded-full text-white font-bold text-lg shadow-lg`}>
                    {result.username}
                  </div>
                  <Badge variant="secondary" className="text-lg px-4 py-1">
                    {result.tier} TIER
                  </Badge>
                </motion.div>

                {/* Provably Fair Info */}
                {result.hash && (
                  <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.6, delay: 1.2 }}
                    className="bg-white/10 backdrop-blur-sm rounded-lg p-3 space-y-2"
                  >
                    <div className="flex items-center gap-2 text-white/80 text-xs">
                      <Coins className="w-3 h-3" />
                      <span>Provably Fair: {result.hash}</span>
                    </div>
                  </motion.div>
                )}

                {/* Close Button */}
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.6, delay: 1.4 }}
                  className="pt-4"
                >
                  <Button
                    onClick={onClose}
                    variant="hero"
                    className="px-8 py-2"
                  >
                    Awesome!
                  </Button>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  );
};