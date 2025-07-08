import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { useGameification } from '@/hooks/useGameification';
import { UltraEnhancedLootBoxOpening } from '@/components/UltraEnhancedLootBoxOpening';
import { ParticleEffect } from '@/components/ParticleEffect';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Crown, Gift, Zap } from 'lucide-react';

interface WelcomeModalProps {
  open: boolean;
  onClose: () => void;
}

export function WelcomeModal({ open, onClose }: WelcomeModalProps) {
  const { stats, lootBoxes, openLootBox } = useGameification();
  const [currentStep, setCurrentStep] = useState(0);
  const [showLootBoxModal, setShowLootBoxModal] = useState(false);
  const [showParticles, setShowParticles] = useState(false);
  const [openedResult, setOpenedResult] = useState<any>(null);

  const handleOpenStarterBox = async () => {
    if (lootBoxes.length === 0) return;
    setShowLootBoxModal(true);
  };

  const handleLootBoxComplete = (result: any) => {
    setOpenedResult(result);
    setShowLootBoxModal(false);
    setShowParticles(true);
    setCurrentStep(2);
  };

  const steps = [
    // Welcome Step
    {
      title: "Welcome to AnimeHub!",
      content: (
        <div className="text-center space-y-6">
          <div className="flex justify-center">
            <div className="w-24 h-24 bg-gradient-primary rounded-full flex items-center justify-center">
              <Sparkles className="w-12 h-12 text-primary-foreground" />
            </div>
          </div>
          <div>
            <h3 className="text-2xl font-bold mb-2">You've been assigned a legendary username!</h3>
            <div className="flex items-center justify-center gap-2 mb-4">
              <Crown className="w-5 h-5 text-yellow-500" />
              <span className="text-xl font-bold">{stats?.currentUsername}</span>
              <Badge variant="secondary" className="ml-2">
                {stats?.usernameTier}
              </Badge>
            </div>
            <p className="text-muted-foreground">
              Your username has been randomly assigned from our collection of anime character names. 
              Collect more through loot boxes and trading!
            </p>
          </div>
        </div>
      )
    },
    // Gamification Step
    {
      title: "Gamification System",
      content: (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <Card className="text-center">
              <CardContent className="p-4">
                <Zap className="w-8 h-8 text-primary mx-auto mb-2" />
                <div className="text-2xl font-bold text-primary">{stats?.totalPoints}</div>
                <div className="text-sm text-muted-foreground">Points Earned</div>
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardContent className="p-4">
                <Gift className="w-8 h-8 text-secondary mx-auto mb-2" />
                <div className="text-2xl font-bold text-secondary">{lootBoxes.reduce((sum, box) => sum + box.quantity, 0)}</div>
                <div className="text-sm text-muted-foreground">Loot Boxes</div>
              </CardContent>
            </Card>
          </div>
          <div className="text-center">
            <h3 className="text-lg font-semibold mb-2">How it works:</h3>
            <ul className="text-left text-sm text-muted-foreground space-y-1">
              <li>• Earn points by rating anime, adding to lists, and daily logins</li>
              <li>• Use points to buy loot boxes with rare usernames</li>
              <li>• Collect legendary anime character names</li>
              <li>• Trade usernames with other users</li>
            </ul>
          </div>
        </div>
      )
    },
    // Loot Box Step
    {
      title: "Your First Loot Box!",
      content: (
        <div className="text-center space-y-6">
          {!openedResult ? (
            <>
              <div className="flex justify-center">
                <Gift className="w-24 h-24 text-primary animate-bounce" />
              </div>
              <div>
                <h3 className="text-xl font-bold mb-2">Open your starter loot box!</h3>
                <p className="text-muted-foreground mb-4">
                  You've received a free standard loot box as a welcome gift.
                </p>
                <Button 
                  onClick={handleOpenStarterBox}
                  disabled={lootBoxes.length === 0}
                  size="lg"
                  className="min-w-32"
                >
                  Open Loot Box
                </Button>
              </div>
            </>
          ) : (
            <div className="space-y-4">
              <div className="text-6xl mb-4">🎉</div>
              <h3 className="text-2xl font-bold">Congratulations!</h3>
              <div className="flex items-center justify-center gap-2">
                <span className="text-xl">You got:</span>
                <Badge variant="default" className="text-lg px-3 py-1">
                  {openedResult.username}
                </Badge>
                <Badge variant="outline">
                  {openedResult.tier}
                </Badge>
              </div>
              <p className="text-muted-foreground">
                This username has been added to your collection!
              </p>
            </div>
          )}
        </div>
      )
    }
  ];

  const currentStepData = steps[currentStep];

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              {currentStepData.title}
            </DialogTitle>
          </DialogHeader>
          
          <motion.div 
            className="py-4"
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
          >
            {currentStepData.content}
          </motion.div>

          <div className="flex justify-between items-center">
            <div className="flex space-x-1">
              {steps.map((_, index) => (
                <motion.div
                  key={index}
                  className={`w-2 h-2 rounded-full ${
                    index === currentStep ? 'bg-primary' : 'bg-muted'
                  }`}
                  animate={index === currentStep ? { scale: [1, 1.2, 1] } : {}}
                  transition={{ duration: 0.3 }}
                />
              ))}
            </div>
            
            <div className="flex gap-2">
              {currentStep > 0 && (
                <Button 
                  variant="outline" 
                  onClick={() => setCurrentStep(currentStep - 1)}
                >
                  Back
                </Button>
              )}
              {currentStep < steps.length - 1 ? (
                <Button 
                  onClick={() => setCurrentStep(currentStep + 1)}
                  disabled={currentStep === 1 && !openedResult}
                >
                  Next
                </Button>
              ) : (
                <Button onClick={onClose}>
                  Get Started!
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Ultra Enhanced Loot Box Opening */}
      <UltraEnhancedLootBoxOpening
        isOpen={showLootBoxModal}
        onClose={() => {
          setShowLootBoxModal(false);
          if (openedResult) {
            setCurrentStep(2);
          }
        }}
        boxType="standard"
      />

      {/* Welcome Celebration Particles */}
      <ParticleEffect
        trigger={showParticles}
        type="celebration"
        intensity="high"
        onComplete={() => setShowParticles(false)}
      />
    </>
  );
}