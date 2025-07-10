import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, X, AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { toast } from "sonner";

interface EmailVerificationBannerProps {
  isVisible: boolean;
  onDismiss: () => void;
}

export const EmailVerificationBanner = ({ isVisible, onDismiss }: EmailVerificationBannerProps) => {
  const { user, resendConfirmation } = useAuth();
  const [isResending, setIsResending] = useState(false);

  const handleResendEmail = async () => {
    if (!user?.email) return;
    
    setIsResending(true);
    try {
      const result = await resendConfirmation(user.email);
      if (result.error) {
        toast.error(result.error.message || 'Failed to resend email');
      } else {
        toast.success('Verification email sent! Check your inbox.');
      }
    } catch (error) {
      toast.error('Failed to resend verification email');
    } finally {
      setIsResending(false);
    }
  };

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ height: 0, opacity: 0 }}
        animate={{ height: "auto", opacity: 1 }}
        exit={{ height: 0, opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="bg-gradient-to-r from-orange-500/10 via-yellow-500/10 to-orange-500/10 border-b border-orange-500/20"
      >
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0">
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <AlertCircle className="w-5 h-5 text-orange-500" />
                </motion.div>
              </div>
              
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">
                  Please verify your email to unlock all features
                </p>
                <p className="text-xs text-muted-foreground">
                  Some features are limited until you verify your account
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleResendEmail}
                disabled={isResending}
                className="bg-background/50 border-orange-500/30 hover:bg-orange-500/10"
              >
                {isResending ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Mail className="w-4 h-4" />
                )}
                <span className="hidden sm:inline ml-2">
                  {isResending ? 'Sending...' : 'Resend Email'}
                </span>
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={onDismiss}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};