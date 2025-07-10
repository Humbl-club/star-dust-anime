import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { X, Mail, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';

interface EmailVerificationCornerPopupProps {
  isVisible: boolean;
  onDismiss: () => void;
}

export const EmailVerificationCornerPopup = ({ isVisible, onDismiss }: EmailVerificationCornerPopupProps) => {
  const { resendConfirmation } = useAuth();
  const [isResending, setIsResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  const handleResendConfirmation = async () => {
    setIsResending(true);
    try {
      await resendConfirmation('');
      setResendSuccess(true);
      setTimeout(() => setResendSuccess(false), 3000);
    } catch (error) {
      console.error('Failed to resend confirmation:', error);
    } finally {
      setIsResending(false);
    }
  };

  if (!isVisible) return null;

  return (
    <div className={cn(
      "fixed bottom-4 left-4 z-50 max-w-sm animate-slide-in-left",
      "glass-card border border-orange-200/50 bg-orange-50/90 dark:bg-orange-900/20",
      "shadow-lg backdrop-blur-md rounded-lg p-4"
    )}>
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          <div className="w-8 h-8 bg-orange-100 dark:bg-orange-900/50 rounded-full flex items-center justify-center">
            <AlertCircle className="w-4 h-4 text-orange-600 dark:text-orange-400" />
          </div>
        </div>
        
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold text-orange-800 dark:text-orange-200 mb-1">
            Verify Your Email
          </h4>
          <p className="text-xs text-orange-700 dark:text-orange-300 mb-3 leading-relaxed">
            Some features are limited until you verify your email address.
          </p>
          
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handleResendConfirmation}
              disabled={isResending}
              className="h-7 px-3 text-xs border-orange-200 hover:bg-orange-100 dark:border-orange-700 dark:hover:bg-orange-800"
            >
              {isResending ? (
                'Sending...'
              ) : resendSuccess ? (
                <>
                  <Mail className="w-3 h-3 mr-1" />
                  Sent!
                </>
              ) : (
                <>
                  <Mail className="w-3 h-3 mr-1" />
                  Resend
                </>
              )}
            </Button>
            
            <Button
              size="sm"
              variant="ghost"
              onClick={onDismiss}
              className="h-7 w-7 p-0 text-orange-600 hover:bg-orange-100 dark:text-orange-400 dark:hover:bg-orange-800"
            >
              <X className="w-3 h-3" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};