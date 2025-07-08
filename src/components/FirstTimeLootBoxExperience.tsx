import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { ParticleEffect } from '@/components/ParticleEffect';
import { useSimpleGameification } from '@/hooks/useSimpleGameification';
import { useAuth } from '@/hooks/useAuth';
import { Gift, Sparkles, Star, Crown, Play, Volume2, VolumeX } from 'lucide-react';

interface FirstTimeLootBoxExperienceProps {
  isOpen: boolean;
  onComplete: () => void;
}

export const FirstTimeLootBoxExperience = ({ isOpen, onComplete }: FirstTimeLootBoxExperienceProps) => {
  const { stats } = useSimpleGameification();
  const [step, setStep] = useState<'intro' | 'opening' | 'result'>('intro');

  const handleStart = () => {
    setStep('opening');
    // Simulate opening process
    setTimeout(() => {
      setStep('result');
    }, 3000);
  };

  const handleComplete = () => {
    onComplete();
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen}>
      <DialogContent className="max-w-4xl h-[80vh] p-0 bg-gradient-to-br from-primary/10 via-background to-secondary/10">
        <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
          {step === 'intro' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center space-y-6 p-8"
            >
              <div className="space-y-4">
                <motion.div
                  animate={{ rotate: [0, 5, -5, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="mx-auto w-24 h-24 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center"
                >
                  <Gift className="w-12 h-12 text-white" />
                </motion.div>
                
                <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
                  Welcome to Your First Loot Box!
                </h1>
                
                <p className="text-xl text-muted-foreground max-w-2xl">
                  You've been given a special starter loot box! This contains your first anime username and some bonus points to get you started.
                </p>
              </div>

              <Button
                onClick={handleStart}
                size="lg"
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold px-8 py-4 text-lg"
              >
                <Play className="w-5 h-5 mr-2" />
                Open Your First Loot Box!
              </Button>
            </motion.div>
          )}

          {step === 'opening' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center space-y-6"
            >
              <motion.div
                animate={{ 
                  scale: [1, 1.2, 1],
                  rotate: [0, 360],
                }}
                transition={{ 
                  duration: 1,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="mx-auto w-32 h-32 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center"
              >
                <Gift className="w-16 h-16 text-white" />
              </motion.div>
              
              <motion.h2
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
                className="text-3xl font-bold text-white"
              >
                Opening...
              </motion.h2>
              
              <motion.div
                animate={{ opacity: [0, 1, 0] }}
                transition={{ duration: 1, repeat: Infinity }}
                className="text-white/80"
              >
                ✨ Magic is happening ✨
              </motion.div>
            </motion.div>
          )}

          {step === 'result' && (
            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center space-y-6 p-8"
            >
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
              >
                <div className="mx-auto w-24 h-24 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center">
                  <Crown className="w-12 h-12 text-white" />
                </div>
              </motion.div>

              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="space-y-4"
              >
                <h2 className="text-3xl font-bold text-white">Congratulations!</h2>
                <div className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-white px-6 py-3 rounded-full font-bold text-xl">
                  {stats?.currentUsername || 'AnimeExplorer'}
                </div>
                <Badge variant="secondary" className="text-lg px-4 py-1">
                  {stats?.usernameTier || 'COMMON'} TIER
                </Badge>
              </motion.div>

              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.8 }}
              >
                <Button
                  onClick={handleComplete}
                  variant="hero"
                  size="lg"
                  className="px-8 py-3"
                >
                  Start Your Anime Journey!
                </Button>
              </motion.div>
            </motion.div>
          )}

          <ParticleEffect
            trigger={step === 'result'}
            type="celebration"
            intensity="high"
            onComplete={() => {}}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};