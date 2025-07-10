import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, X, Mail, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useEmailVerification } from '@/hooks/useEmailVerification';
import { toast } from '@/hooks/use-toast';

export const EmailVerificationBanner = () => {
  const { 
    showVerificationPrompt, 
    daysRemaining, 
    verifyEmail, 
    isLoading 
  } = useEmailVerification();
  const [isVisible, setIsVisible] = useState(true);
  const [isVerifying, setIsVerifying] = useState(false);

  const handleVerifyEmail = async () => {
    setIsVerifying(true);
    try {
      await verifyEmail();
      toast({
        title: "Email Verified!",
        description: "Your email has been successfully verified. You now have full access to all features.",
      });
      setIsVisible(false);
    } catch (error) {
      toast({
        title: "Verification Failed",
        description: "There was an error verifying your email. Please try again.",
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
        className="fixed top-0 left-0 right-0 z-40 p-4"
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