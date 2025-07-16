
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
      // Get parameters from URL
      const token = searchParams.get('token');
      const type = searchParams.get('type');
      const email = searchParams.get('email');
      const userId = searchParams.get('user_id');
      
      console.log('Email confirmation - parameters:', {
        token,
        type,
        email,
        userId
      });

      // Validate required parameters
      if (!token || !type || !email || !userId) {
        console.error('Missing required parameters');
        setStatus('error');
        setMessage('Invalid confirmation link. Please check the URL or request a new verification email.');
        return;
      }

      if (type !== 'signup') {
        console.error('Invalid confirmation type:', type);
        setStatus('error');
        setMessage('Invalid confirmation link type.');
        return;
      }

      try {
        console.log('Verifying token in database...');
        
        // Verify the token with our database
        const { data: verificationData, error: verificationError } = await supabase
          .from('email_verification_status')
          .select('*')
          .eq('user_id', userId)
          .eq('email', email)
          .eq('verification_token', token)
          .eq('verification_status', 'pending')
          .single();

        console.log('Verification query result:', { verificationData, verificationError });

        if (verificationError || !verificationData) {
          console.error('Token verification error:', verificationError);
          setStatus('error');
          setMessage('Invalid or expired verification link. Please request a new verification email.');
          return;
        }

        // Check if token has expired
        const expiresAt = new Date(verificationData.verification_expires_at);
        const now = new Date();
        console.log('Token expiry check:', { expiresAt, now, expired: expiresAt < now });
        
        if (expiresAt < now) {
          setStatus('error');
          setMessage('Verification link has expired. Please request a new verification email.');
          return;
        }

        console.log('Token is valid, updating verification status...');

        // Mark email as verified in our database
        const { error: updateError } = await supabase
          .from('email_verification_status')
          .update({
            verification_status: 'verified',
            updated_at: new Date().toISOString()
          })
          .eq('id', verificationData.id);

        if (updateError) {
          console.error('Update verification status error:', updateError);
          setStatus('error');
          setMessage('Failed to update verification status. Please try again.');
          return;
        }

        console.log('Verification status updated, updating profile...');

        // Update profile verification status
        const { error: profileError } = await supabase
          .from('profiles')
          .update({
            verification_status: 'verified',
            verification_required_until: null
          })
          .eq('id', userId);

        if (profileError) {
          console.error('Profile update error:', profileError);
          // Continue anyway as the main verification worked
        }

        console.log('Email verification completed successfully');

        setStatus('success');
        setMessage('Email confirmed successfully! You can now sign in to your account.');
        toast.success('Email confirmed successfully!');
        
        // Redirect to auth page for sign in after a short delay
        setTimeout(() => {
          navigate('/auth?message=verified');
        }, 2000);

      } catch (error: any) {
        console.error('Email confirmation exception:', error);
        setStatus('error');
        setMessage('An unexpected error occurred during email confirmation. Please try again.');
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
            {status !== 'loading' && message}
          </p>
          
          {status === 'success' && (
            <p className="text-sm text-muted-foreground mb-4">
              Redirecting you to the sign in page...
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
