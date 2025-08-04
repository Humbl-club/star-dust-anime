import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { ArrowLeft, CheckCircle, Lock, Sparkles } from "lucide-react";
import EnhancedPasswordInput from "@/components/auth/EnhancedPasswordInput";
import { useAuth } from "@/hooks/useAuth";

const ResetPassword = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { validatePasswordStrength } = useAuth();
  
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isValidToken, setIsValidToken] = useState(false);
  const [loading, setLoading] = useState(true);

  // Get token from URL
  const accessToken = searchParams.get('access_token');
  const refreshToken = searchParams.get('refresh_token');

  // Password validation
  const passwordValidation = password ? validatePasswordStrength(password) : { isValid: false, score: 0, errors: [] };
  const passwordsMatch = password === confirmPassword && confirmPassword.length > 0;
  const isFormValid = passwordValidation.isValid && passwordsMatch;

  // Verify tokens on component mount
  useEffect(() => {
    const verifyTokens = async () => {
      if (!accessToken || !refreshToken) {
        toast.error('Invalid or expired reset link');
        setLoading(false);
        return;
      }

      try {
        // Set the session with the tokens from URL
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });

        if (error) {
          console.error('Session error:', error);
          toast.error('Invalid or expired reset link');
        } else {
          setIsValidToken(true);
          toast.success('Ready to reset your password');
        }
      } catch (error) {
        console.error('Token verification error:', error);
        toast.error('Failed to verify reset link');
      } finally {
        setLoading(false);
      }
    };

    verifyTokens();
  }, [accessToken, refreshToken]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isFormValid) {
      toast.error('Please complete all required fields correctly.');
      return;
    }

    if (!isValidToken) {
      toast.error('Invalid or expired reset link');
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: password
      });

      if (error) {
        throw error;
      }

      toast.success('Password updated successfully! You can now sign in with your new password.');
      
      // Redirect to auth page after successful reset
      setTimeout(() => {
        navigate('/auth');
      }, 2000);
      
    } catch (error: any) {
      console.error('Password reset error:', error);
      toast.error(error.message || 'Failed to update password');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-secondary/5">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Verifying reset link...</p>
        </div>
      </div>
    );
  }

  if (!isValidToken) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 relative">
        {/* Back to Home Arrow */}
        <button
          onClick={() => navigate('/')}
          className="absolute top-6 left-6 p-3 glass-card border border-primary/20 rounded-full hover:bg-primary/10 transition-all duration-200 hover-scale group z-10"
          aria-label="Back to home"
        >
          <ArrowLeft className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
        </button>

        <div className="w-full max-w-md">
          <Card className="glass-card border border-red-500/20 glow-card">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl text-red-500">Invalid Reset Link</CardTitle>
              <CardDescription>
                This password reset link is invalid or has expired.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground text-center">
                Please request a new password reset email from the sign-in page.
              </p>
              <Button 
                onClick={() => navigate('/auth')}
                className="w-full"
              >
                Go to Sign In
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative">
      {/* Back to Home Arrow */}
      <button
        onClick={() => navigate('/')}
        className="absolute top-6 left-6 p-3 glass-card border border-primary/20 rounded-full hover:bg-primary/10 transition-all duration-200 hover-scale group z-10"
        aria-label="Back to home"
      >
        <ArrowLeft className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
      </button>

      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="p-3 bg-gradient-primary rounded-full glow-primary">
              <Lock className="w-8 h-8 text-primary-foreground" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gradient-primary mb-2">Reset Password</h1>
          <p className="text-muted-foreground mb-6">Enter your new password to complete the reset</p>
          
          <div className="glass-card p-4 border border-primary/20 glow-primary">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Sparkles className="w-5 h-5 text-green-500" />
              <span className="font-semibold text-gradient-primary">Reset Link Verified!</span>
            </div>
            <p className="text-sm text-muted-foreground">
              You can now set a new secure password for your account.
            </p>
          </div>
        </div>

        <Card className="glass-card border border-primary/20 glow-card">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Set New Password</CardTitle>
            <CardDescription>
              Choose a strong password to secure your account
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">New Password</Label>
                <div className="relative">
                  <EnhancedPasswordInput
                    value={password}
                    onChange={setPassword}
                    placeholder="Create a secure password"
                    showStrength={true}
                    showChecklist={true}
                    confirmPassword={confirmPassword}
                    className="glass-input"
                  />
                  {password && passwordValidation.isValid && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2"
                    >
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    </motion.div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <div className="relative">
                  <EnhancedPasswordInput
                    value={confirmPassword}
                    onChange={setConfirmPassword}
                    placeholder="Confirm your new password"
                    showStrength={false}
                    showChecklist={false}
                    className="glass-input"
                  />
                  {confirmPassword && passwordsMatch && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2"
                    >
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    </motion.div>
                  )}
                </div>
                {confirmPassword && !passwordsMatch && (
                  <p className="text-sm text-red-500">Passwords do not match</p>
                )}
              </div>

              <motion.div
                animate={{
                  opacity: isFormValid ? 1 : 0.5,
                  scale: isFormValid ? 1 : 0.98,
                }}
                transition={{ duration: 0.2 }}
              >
                <Button
                  type="submit"
                  variant={isFormValid ? "hero" : "secondary"}
                  className="w-full transition-all duration-300"
                  disabled={isSubmitting || !isFormValid}
                >
                  {isSubmitting ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground"></div>
                      Updating Password...
                    </div>
                  ) : (
                    <motion.span
                      key={isFormValid ? "valid" : "invalid"}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.2 }}
                    >
                      Update Password
                    </motion.span>
                  )}
                </Button>
              </motion.div>
            </form>

            <p className="text-center text-sm text-muted-foreground mt-6">
              After updating your password, you'll be redirected to sign in.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ResetPassword;