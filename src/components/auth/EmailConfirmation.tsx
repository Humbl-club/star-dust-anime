
import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";

const EmailConfirmation = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const handleEmailConfirmation = async () => {
      const token = searchParams.get('token');
      const type = searchParams.get('type');
      
      console.log('Email confirmation - token:', token, 'type:', type);

      if (!token || type !== 'signup') {
        setStatus('error');
        setMessage('Invalid confirmation link. The link may be expired or malformed.');
        return;
      }

      try {
        // Verify the email using the token
        const { data, error } = await supabase.auth.verifyOtp({
          token_hash: token,
          type: 'signup'
        });

        console.log('Email verification result:', { data, error });

        if (error) {
          console.error('Email verification error:', error);
          setStatus('error');
          setMessage(error.message || 'Failed to confirm email. The link may be expired.');
          return;
        }

        if (data.user) {
          setStatus('success');
          setMessage('Email confirmed successfully! You can now sign in to your account.');
          toast.success('Email confirmed successfully!');
          
          // Redirect to home page after a short delay
          setTimeout(() => {
            navigate('/');
          }, 2000);
        } else {
          setStatus('error');
          setMessage('Email confirmation failed. Please try again.');
        }
      } catch (error: any) {
        console.error('Email confirmation exception:', error);
        setStatus('error');
        setMessage('An unexpected error occurred during email confirmation.');
      }
    };

    handleEmailConfirmation();
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/5 flex items-center justify-center">
      <Card className="max-w-md mx-4 border-border/50 bg-card/80 backdrop-blur-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl flex items-center justify-center gap-2">
            {status === 'loading' && <Loader2 className="w-6 h-6 animate-spin" />}
            {status === 'success' && <CheckCircle className="w-6 h-6 text-green-500" />}
            {status === 'error' && <AlertCircle className="w-6 h-6 text-red-500" />}
            Email Confirmation
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-muted-foreground mb-6">
            {status === 'loading' && 'Confirming your email address...'}
            {status === 'success' && message}
            {status === 'error' && message}
          </p>
          
          {status === 'success' && (
            <p className="text-sm text-muted-foreground mb-4">
              Redirecting you to the home page...
            </p>
          )}
          
          {status === 'error' && (
            <div className="space-y-3">
              <Button onClick={() => navigate('/auth')} className="w-full">
                Go to Sign In
              </Button>
              <Button variant="outline" onClick={() => navigate('/')} className="w-full">
                Back to Home
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default EmailConfirmation;
