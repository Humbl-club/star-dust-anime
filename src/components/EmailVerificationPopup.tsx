import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, CheckCircle, AlertCircle, Send, Sparkles, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useEmailVerification } from '@/hooks/useEmailVerification';
import { toast } from '@/hooks/use-toast';

interface EmailVerificationPopupProps {
  triggerShow?: boolean;
}

export const EmailVerificationPopup = ({ triggerShow }: EmailVerificationPopupProps) => {
  const { user, resendConfirmation } = useAuth();
  const { 
    showVerificationPrompt, 
    daysRemaining, 
    verifyEmail, 
    isLoading 
  } = useEmailVerification();
  
  const [isVisible, setIsVisible] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number }>>([]);

  // Show popup when verification is needed OR when triggered by welcome animation
  useEffect(() => {
    if ((showVerificationPrompt || triggerShow) && !isDismissed && user) {
      setIsVisible(true);
      // Create floating particles for premium effect
      const newParticles = Array.from({ length: 8 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100
      }));
      setParticles(newParticles);
    } else {
      setIsVisible(false);
    }
  }, [showVerificationPrompt, triggerShow, isDismissed, user]);

  // No auto-dismiss - popup stays until manually dismissed for perfect visibility

  const handleResendConfirmation = async () => {
    if (!user) return;
    
    setIsResending(true);
    try {
      await resendConfirmation(user.email!);
      setResendSuccess(true);
      
      toast({
        title: "✨ Verification email sent!",
        description: "Check your inbox and click the magic link to unlock all features.",
      });
      
      setTimeout(() => setResendSuccess(false), 3000);
    } catch (error) {
      toast({
        title: "Oops! Something went wrong",
        description: "Please try again in a moment.",
        variant: "destructive",
      });
    } finally {
      setIsResending(false);
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    setIsDismissed(true);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, x: 100, scale: 0.9 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: 100, scale: 0.9 }}
          transition={{ 
            duration: 0.5, 
            ease: [0.175, 0.885, 0.32, 1.275],
            type: "spring",
            damping: 20,
            stiffness: 200
          }}
          className="fixed top-1 right-4 z-[100] w-80 max-w-[calc(100vw-2rem)]"
          style={{ willChange: 'transform, opacity' }}
        >
          {/* Floating particles for premium effect */}
          {particles.map((particle) => (
            <motion.div
              key={particle.id}
              className="absolute w-1 h-1 bg-primary/60 rounded-full pointer-events-none"
              style={{ left: `${particle.x}%`, top: `${particle.y}%` }}
              animate={{
                y: [0, -20, 0],
                opacity: [0, 1, 0],
                scale: [0, 1, 0]
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                delay: particle.id * 0.2,
                ease: "easeInOut"
              }}
            />
          ))}

          {/* Glass-morphism card with enhanced gradient border */}
          <div className="glass-card border-primary/40 overflow-hidden relative">
            {/* Enhanced gradient background overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-accent/5 to-primary/10" />
            
            {/* Content */}
            <div className="relative p-5">
              {/* Header with close button */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <motion.div
                      className="p-2 gradient-primary rounded-full"
                      animate={{ rotate: [0, 360] }}
                      transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    >
                      <Mail className="w-5 h-5 text-primary-foreground" />
                    </motion.div>
                    <motion.div
                      className="absolute -top-1 -right-1"
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <Star className="w-3 h-3 text-accent animate-pulse" />
                    </motion.div>
                  </div>
                  <div>
                    <h3 className="font-bold text-gradient-primary text-base">
                      🚀 Unlock Your Potential!
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Become a verified legend
                    </p>
                  </div>
                </div>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDismiss}
                  className="h-6 w-6 p-0 hover:bg-muted/20 rounded-full"
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>

              {/* Enhanced content */}
              <div className="space-y-4">
                <div className="p-3 glass-card border border-primary/20 bg-gradient-to-r from-primary/5 to-accent/5">
                  <p className="text-sm text-foreground leading-relaxed">
                    <span className="font-semibold text-primary">Your anime journey awaits!</span>
                    <br />
                    Verify your email to unlock exclusive features and join our legendary community.
                    {daysRemaining && (
                      <span className="block mt-2 text-accent font-medium text-xs">
                        ⏰ {daysRemaining} {daysRemaining === 1 ? 'day' : 'days'} remaining
                      </span>
                    )}
                  </p>
                </div>

                {/* Enhanced action buttons */}
                <div className="flex gap-2">
                  <Button
                    onClick={handleResendConfirmation}
                    disabled={isResending || resendSuccess}
                    size="sm"
                    className={`
                      flex-1 h-9 text-sm glass-button relative overflow-hidden
                      ${resendSuccess 
                        ? 'bg-green-500/20 text-green-400 border-green-500/30' 
                        : 'gradient-primary hover:glow-primary'
                      } 
                      transition-all duration-300 transform hover:scale-105
                    `}
                  >
                    <span className="relative z-10 flex items-center">
                      {isResending ? (
                        <>
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          >
                            <Send className="w-3 h-3 mr-2" />
                          </motion.div>
                          Sending...
                        </>
                      ) : resendSuccess ? (
                        <>
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", stiffness: 500 }}
                          >
                            <CheckCircle className="w-3 h-3 mr-2" />
                          </motion.div>
                          Sent! ✨
                        </>
                      ) : (
                        <>
                          <Send className="w-3 h-3 mr-2" />
                          Verify Now 🎯
                        </>
                      )}
                    </span>
                    {!resendSuccess && (
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full hover:translate-x-full transition-transform duration-1000" />
                    )}
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleDismiss}
                    className="h-9 px-4 text-sm hover:bg-muted/30 border border-muted/20"
                  >
                    Later
                  </Button>
                </div>
              </div>
            </div>

            {/* Enhanced animated border glow */}
            <motion.div 
              className="absolute inset-0 border-2 border-primary/30 rounded-2xl" 
              animate={{ 
                borderColor: ["hsl(var(--primary) / 0.3)", "hsl(var(--accent) / 0.5)", "hsl(var(--primary) / 0.3)"]
              }}
              transition={{ 
                duration: 3, 
                repeat: Infinity, 
                ease: "easeInOut" 
              }}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};