import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useEmailVerification } from '@/hooks/useEmailVerification';
import { toast } from '@/hooks/use-toast';

// Email provider detection utility
const getEmailProvider = (email: string) => {
  const domain = email.toLowerCase().split('@')[1];
  
  if (domain?.includes('gmail')) {
    return { name: 'Gmail', url: 'https://mail.google.com', icon: '📧' };
  } else if (domain?.includes('outlook') || domain?.includes('hotmail') || domain?.includes('live')) {
    return { name: 'Outlook', url: 'https://outlook.live.com', icon: '📨' };
  } else if (domain?.includes('yahoo')) {
    return { name: 'Yahoo Mail', url: 'https://mail.yahoo.com', icon: '📮' };
  } else if (domain?.includes('icloud') || domain?.includes('me.com')) {
    return { name: 'iCloud Mail', url: 'https://www.icloud.com/mail', icon: '📧' };
  }
  
  return { name: 'Email', url: `https://${domain}`, icon: '📬' };
};

interface EmailVerificationPopupProps {
  triggerShow?: boolean;
}

export const EmailVerificationPopup = ({ triggerShow }: EmailVerificationPopupProps) => {
  const { user, resendConfirmation } = useAuth();
  const { showVerificationPrompt } = useEmailVerification();
  
  const [isVisible, setIsVisible] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  // Show popup when verification is needed OR when triggered by welcome animation
  useEffect(() => {
    if ((showVerificationPrompt || triggerShow) && !isDismissed && user) {
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  }, [showVerificationPrompt, triggerShow, isDismissed, user]);

  const handleVerifyNow = async () => {
    if (!user) return;
    
    setIsResending(true);
    try {
      const result = await resendConfirmation(user.email!);
      
      if (result.error) {
        toast({
          title: "Failed to Send Email",
          description: result.error.message || "There was an error sending the verification email.",
          variant: "destructive",
        });
        return;
      }
      
      const provider = getEmailProvider(user.email!);
      
      toast({
        title: "Email sent!",
        description: `Check your ${provider.name}`,
      });
      
      // Open email provider
      window.open(provider.url, '_blank', 'noopener,noreferrer');
      
    } catch (error) {
      toast({
        title: "Error",
        description: "Please try again.",
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
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.2 }}
          className="fixed top-16 right-4 z-[300] w-48 pointer-events-auto"
        >
          <div className="bg-background border border-border rounded-lg shadow-lg p-2">
            {/* Header */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium">Verify Email</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDismiss}
                className="h-6 w-6 p-0 hover:bg-muted rounded-full"
              >
                <X className="w-3 h-3" />
              </Button>
            </div>

            {/* Content */}
            <p className="text-xs text-muted-foreground mb-3">
              Check your email
            </p>

            {/* Buttons */}
            <div className="flex gap-1">
              <Button
                onClick={handleVerifyNow}
                disabled={isResending}
                size="sm"
                className="flex-1 h-7 text-xs"
              >
                {isResending ? "..." : "Open Email"}
                <ExternalLink className="w-3 h-3 ml-1" />
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDismiss}
                className="h-7 px-2 text-xs"
              >
                X
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};