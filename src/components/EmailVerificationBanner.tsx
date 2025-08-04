import { useState } from 'react';
import { AlertCircle, X, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const EmailVerificationBanner = () => {
  const { user } = useAuth();
  const [isVisible, setIsVisible] = useState(true);
  const [isVerifying, setIsVerifying] = useState(false);

  // Only show if user exists and email is not confirmed
  if (!user || user.email_confirmed_at || !isVisible) return null;

  const handleVerifyEmail = async () => {
    setIsVerifying(true);
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: user.email!,
      });

      if (error) {
        toast.error(error.message);
      } else {
        toast.success("Verification email sent! Check your inbox.");
      }
    } catch (error) {
      toast.error("Failed to send verification email");
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <Card className="mx-auto max-w-4xl bg-yellow-50 border-yellow-200 shadow-lg mb-4">
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-600" />
            <div>
              <h3 className="font-semibold text-yellow-800">
                Verify Your Email Address
              </h3>
              <p className="text-sm text-yellow-700">
                Please verify your email to unlock all features.
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleVerifyEmail}
              disabled={isVerifying}
            >
              <Mail className="w-4 h-4 mr-2" />
              {isVerifying ? "Sending..." : "Resend Email"}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsVisible(false)}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};