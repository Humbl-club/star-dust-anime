import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, X, Mail, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useEmailVerification } from '@/hooks/useEmailVerification';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';

export const EmailVerificationBanner = () => {
  const { 
    showVerificationPrompt, 
    daysRemaining, 
    isLoading 
  } = useEmailVerification();
  const { user, resendConfirmation } = useAuth();
  const [isVisible, setIsVisible] = useState(true);
  const [isVerifying, setIsVerifying] = useState(false);

  const handleVerifyEmail = async () => {
    if (!user?.email) {
      toast({
        title: "Error",
        description: "User email not found. Please try signing in again.",
        variant: "destructive",
      });
      return;
    }
    
    setIsVerifying(true);
    try {
      const result = await resendConfirmation(user.email);
      if (result.error) {
        // Handle specific error cases
        if (result.error.message.includes('Rate limit exceeded')) {
          toast({
            title: "Rate Limit Exceeded",
            description: "Please wait before requesting another verification email.",
            variant: "destructive",
          });
        } else if (result.error.message.includes('already verified')) {
          toast({
            title: "Already Verified",
            description: "Your email is already verified! Refreshing page...",
          });
          // Refresh the page to update the verification status
          setTimeout(() => window.location.reload(), 1500);
        } else {
          toast({
            title: "Failed to Send Email",
            description: result.error.message || "There was an error sending the verification email.",
            variant: "destructive",
          });
        }
      } else {
        toast({
          title: "Verification Email Sent!",
          description: result.message || "Please check your inbox and click the verification link.",
        });
      }
    } catch (error) {
      console.error('Error sending verification email:', error);
      toast({
        title: "Verification Failed",
        description: "There was an error sending the verification email. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
  };

  if (!showVerificationPrompt || !isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -100 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -100 }}
        className="fixed top-0 left-0 right-0 z-sticky p-4"
      >
        <Card className="mx-auto max-w-4xl bg-yellow-50 border-yellow-200 shadow-lg">
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-100 rounded-full">
                  <AlertCircle className="w-5 h-5 text-yellow-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-yellow-800">
                    Verify Your Email Address
                  </h3>
                  <p className="text-sm text-yellow-700">
                    {daysRemaining !== null ? (
                      <>
                        You have {daysRemaining} day{daysRemaining !== 1 ? 's' : ''} left to verify your email. 
                        Some features are restricted until verification.
                      </>
                    ) : (
                      "Please verify your email address to unlock all features."
                    )}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleVerifyEmail}
                  disabled={isVerifying}
                  className="bg-yellow-100 hover:bg-yellow-200 text-yellow-800 border-yellow-300"
                >
                  {isVerifying ? (
                    <Clock className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Mail className="w-4 h-4 mr-2" />
                  )}
                  {isVerifying ? 'Verifying...' : 'Verify Now'}
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDismiss}
                  className="text-yellow-600 hover:text-yellow-800 hover:bg-yellow-100"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
};