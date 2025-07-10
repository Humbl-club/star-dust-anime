import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, CheckCircle, AlertCircle, Send, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useEmailVerification } from '@/hooks/useEmailVerification';
import { toast } from '@/hooks/use-toast';

export const EmailVerificationPopup = () => {
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

  // Show popup when verification is needed
  useEffect(() => {
    if (showVerificationPrompt && !isDismissed && user) {
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  }, [showVerificationPrompt, isDismissed, user]);

  // Auto-dismiss after 10 seconds
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        setIsDismissed(true);
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, [isVisible]);

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
            duration: 0.4, 
            ease: [0.175, 0.885, 0.32, 1.275],
            type: "spring",
            damping: 25,
            stiffness: 300
          }}
          className="fixed top-4 right-4 z-[60] w-80 max-w-[calc(100vw-2rem)]"
          style={{ willChange: 'transform, opacity' }}
        >
          {/* Glass-morphism card with gradient border */}
          <div className="glass-card border-primary/30 overflow-hidden">
            {/* Gradient background overlay */}
            <div className="absolute inset-0 bg-gradient-primary opacity-5" />
            
            {/* Content */}
            <div className="relative p-4">
              {/* Header with close button */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Mail className="w-5 h-5 text-primary" />
                    <Sparkles className="w-3 h-3 text-accent absolute -top-1 -right-1 animate-pulse" />
                  </div>
                  <h3 className="font-semibold text-gradient-primary text-sm">
                    Verify Your Email
                  </h3>
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

              {/* Content */}
              <div className="space-y-3">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Unlock your full anime experience! Verify your email to access all features.
                  {daysRemaining && (
                    <span className="block mt-1 text-accent font-medium">
                      {daysRemaining} {daysRemaining === 1 ? 'day' : 'days'} remaining
                    </span>
                  )}
                </p>

                {/* Action buttons */}
                <div className="flex gap-2">
                  <Button
                    onClick={handleResendConfirmation}
                    disabled={isResending || resendSuccess}
                    size="sm"
                    className={`
                      flex-1 h-8 text-xs glass-button 
                      ${resendSuccess 
                        ? 'bg-green-500/20 text-green-400 border-green-500/30' 
                        : 'gradient-primary hover:glow-primary'
                      } 
                      transition-all duration-300 transform hover:scale-105
                    `}
                  >
                    {isResending ? (
                      <>
                        <Send className="w-3 h-3 mr-1 animate-pulse" />
                        Sending...
                      </>
                    ) : resendSuccess ? (
                      <>
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Sent!
                      </>
                    ) : (
                      <>
                        <Send className="w-3 h-3 mr-1" />
                        Resend
                      </>
                    )}
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleDismiss}
                    className="h-8 px-3 text-xs hover:bg-muted/20"
                  >
                    Later
                  </Button>
                </div>
              </div>
            </div>

            {/* Animated border glow */}
            <div className="absolute inset-0 border border-primary/20 rounded-2xl animate-glow-pulse" />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};