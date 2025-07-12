import { useState, useEffect } from "react";
import { Navigate, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { motion, AnimatePresence } from "framer-motion";
import { useDebounce } from "use-debounce";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Sparkles, Crown, CheckCircle, AlertCircle, Mail } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import EnhancedEmailInput from "@/components/auth/EnhancedEmailInput";
import EnhancedPasswordInput from "@/components/auth/EnhancedPasswordInput";

interface FormData {
  email: string;
  password: string;
  confirmPassword: string;
}

const Auth = () => {
  const { user, signUp, signIn, signInWithGoogle, resendConfirmation, validateEmailFormat, validatePasswordStrength, loading } = useAuth();
  const [searchParams] = useSearchParams();
  const [isSignUp, setIsSignUp] = useState(searchParams.get('tab') === 'signup');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showResendConfirmation, setShowResendConfirmation] = useState(false);
  const [lastSignupEmail, setLastSignupEmail] = useState("");
  const [emailExists, setEmailExists] = useState(false);
  const [checkingEmail, setCheckingEmail] = useState(false);

  const { watch, setValue, getValues } = useForm<FormData>({
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: ""
    },
    mode: "onChange"
  });

  const watchedValues = watch();
  
  // Debounce email for checking existence
  const [debouncedEmail] = useDebounce(watchedValues.email, 500);

  // Validation states
  const emailValidation = watchedValues.email ? validateEmailFormat(watchedValues.email) : { isValid: false, errors: [] };
  
  // Different password validation for sign-up vs sign-in
  const passwordValidation = isSignUp 
    ? (watchedValues.password ? validatePasswordStrength(watchedValues.password) : { isValid: false, score: 0, errors: [] })
    : { isValid: watchedValues.password.length > 0, score: 0, errors: [] }; // Sign-in: just check if not empty
    
  const passwordsMatch = isSignUp ? watchedValues.password === watchedValues.confirmPassword && watchedValues.confirmPassword.length > 0 : true;

  // Form completion state for dynamic button
  const isFormValid = emailValidation.isValid && 
                     passwordValidation.isValid && 
                     passwordsMatch &&
                     watchedValues.email.length > 0 &&
                     watchedValues.password.length > 0 &&
                     (!isSignUp || watchedValues.confirmPassword.length > 0) &&
                     (!isSignUp || !emailExists); // Prevent signup if email exists

  // Check if email exists when user is signing up
  useEffect(() => {
    const checkEmailExists = async () => {
      if (!isSignUp || !debouncedEmail || !emailValidation.isValid) {
        setEmailExists(false);
        setCheckingEmail(false);
        return;
      }

      setCheckingEmail(true);
      
      try {
        const { data, error } = await supabase.functions.invoke('check-email-exists', {
          body: { email: debouncedEmail }
        });

        if (error) {
          console.error('Error checking email:', error);
          setEmailExists(false);
        } else {
          setEmailExists(data.exists);
        }
      } catch (error) {
        console.error('Error checking email existence:', error);
        setEmailExists(false);
      } finally {
        setCheckingEmail(false);
      }
    };

    checkEmailExists();
  }, [debouncedEmail, emailValidation.isValid, isSignUp]);

  // Redirect if already authenticated
  if (user && !loading) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('Form submitted. isSignUp:', isSignUp, 'isFormValid:', isFormValid);
    
    if (!isFormValid) {
      toast.error('Please complete all required fields correctly.');
      return;
    }

    setIsSubmitting(true);

    try {
      if (isSignUp) {
        if (watchedValues.password !== watchedValues.confirmPassword) {
          toast.error('Passwords do not match. Please confirm your password correctly.');
          setIsSubmitting(false);
          return;
        }

        console.log('Calling signUp with email:', watchedValues.email);
        const result = await signUp(watchedValues.email, watchedValues.password);
        
        console.log('Signup result:', result);
        
        if (result.error) {
          const errorMessage = result.error.message || 'An error occurred during signup';
          console.log('Signup error:', errorMessage);
          if (errorMessage.includes('already registered') || errorMessage.includes('already exists')) {
            toast.error('This email is already registered. Try signing in instead.');
            setShowResendConfirmation(true);
            setLastSignupEmail(watchedValues.email);
          } else {
            toast.error(errorMessage);
          }
        } else if (result.needsConfirmation) {
          console.log('Signup needs confirmation, redirecting to home');
          // Redirect to home page to show welcome popup
          window.location.href = '/';
        } else {
          console.log('Signup successful, redirecting to home');
          // Redirect to home page to show welcome popup  
          window.location.href = '/';
        }
      } else {
        const { error } = await signIn(watchedValues.email, watchedValues.password);
        
        if (error) {
          const errorMessage = error.message || 'An error occurred during signin';
          if (errorMessage.includes('Invalid login credentials')) {
            toast.error('Invalid email or password. Please check your credentials.');
          } else if (errorMessage.includes('Email not confirmed')) {
            toast.error('Please check your email and click the confirmation link first.');
            setShowResendConfirmation(true);
            setLastSignupEmail(watchedValues.email);
          } else {
            toast.error(errorMessage);
          }
        } else {
          toast.success("Welcome back to AnimeHub!");
        }
      }
    } catch (error: any) {
      console.error('Auth error:', error);
      toast.error("An unexpected error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setIsSubmitting(true);
      const { error } = await signInWithGoogle();
      
      if (error) {
        toast.error(error.message);
      }
    } catch (error: any) {
      toast.error("Failed to sign in with Google");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendConfirmation = async () => {
    if (!lastSignupEmail) return;
    
    try {
      const result = await resendConfirmation(lastSignupEmail);
      if (result.error) {
        toast.error(result.error.message);
      } else {
        toast.success(result.message);
      }
    } catch (error: any) {
      toast.error("Failed to resend confirmation email");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-secondary/5">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="p-3 bg-gradient-primary rounded-full glow-primary">
              <Sparkles className="w-8 h-8 text-primary-foreground" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gradient-primary mb-2">Welcome to Anithing</h1>
          <p className="text-muted-foreground mb-6">Your ultimate anime & manga tracking platform</p>
          
          <div className="glass-card p-4 border border-primary/20 glow-primary">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Crown className="w-5 h-5 text-yellow-500" />
              <span className="font-semibold text-gradient-primary">Get Your Legendary Username!</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Get a random legendary anime character username automatically! No choosing required.
            </p>
          </div>
        </div>

        <Card className="glass-card border border-primary/20 glow-card">
          <CardHeader className="text-center">
            <Tabs value={isSignUp ? "signup" : "signin"} onValueChange={(value) => setIsSignUp(value === "signup")}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="signin">Sign In</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>
              
              <TabsContent value="signin">
                <CardTitle className="text-2xl">Welcome Back</CardTitle>
                <CardDescription>Sign in to continue your anime journey</CardDescription>
              </TabsContent>
              
              <TabsContent value="signup">
                <CardTitle className="text-2xl">Join AnimeHub</CardTitle>
                <CardDescription>Get your legendary anime username automatically!</CardDescription>
              </TabsContent>
            </Tabs>
          </CardHeader>

          <CardContent>
            <div className="space-y-4 mb-6">
              <Button 
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isSubmitting}
                className="w-full"
                variant="outline"
              >
                <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continue with Google
              </Button>
              
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">Or continue with email</span>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {isSignUp && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="glass-card p-4 border border-primary/20 glow-card mb-4"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium text-gradient-primary">Automatic Username Assignment</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    You'll receive a random anime character username automatically!
                  </p>
                </motion.div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <EnhancedEmailInput
                    value={watchedValues.email}
                    onChange={(value) => setValue("email", value)}
                    placeholder="your@email.com"
                    className="glass-input"
                  />
                  <AnimatePresence>
                    {checkingEmail && watchedValues.email && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0 }}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2"
                      >
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                      </motion.div>
                    )}
                    {!checkingEmail && watchedValues.email && emailValidation.isValid && !emailExists && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0 }}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2"
                      >
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      </motion.div>
                    )}
                    {!checkingEmail && watchedValues.email && emailValidation.isValid && emailExists && isSignUp && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0 }}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2"
                      >
                        <AlertCircle className="w-4 h-4 text-red-500" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                
                {/* Email exists error message */}
                <AnimatePresence>
                  {!checkingEmail && emailExists && isSignUp && emailValidation.isValid && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="text-sm text-red-500 mt-1 flex items-center gap-2"
                    >
                      <AlertCircle className="w-3 h-3" />
                      This email already has an account. Try signing in instead.
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <EnhancedPasswordInput
                    value={watchedValues.password}
                    onChange={(value) => setValue("password", value)}
                    placeholder={isSignUp ? "Create a secure password" : "Enter your password"}
                    showStrength={isSignUp}
                    showChecklist={isSignUp}
                    confirmPassword={isSignUp ? watchedValues.confirmPassword : undefined}
                    className="glass-input"
                  />
                  <AnimatePresence>
                    {watchedValues.password && passwordValidation.isValid && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0 }}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2"
                      >
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              <AnimatePresence>
                {isSignUp && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-2"
                  >
                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                    <div className="relative">
                      <EnhancedPasswordInput
                        value={watchedValues.confirmPassword}
                        onChange={(value) => setValue("confirmPassword", value)}
                        placeholder="Confirm your password"
                        showStrength={false}
                        showChecklist={false}
                        className="glass-input"
                      />
                      <AnimatePresence>
                        {watchedValues.confirmPassword && passwordsMatch && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0 }}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2"
                          >
                            <CheckCircle className="w-4 h-4 text-green-500" />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

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
                      {isSignUp ? "Creating Account..." : "Signing In..."}
                    </div>
                  ) : (
                    <motion.span
                      key={isFormValid ? "valid" : "invalid"}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.2 }}
                    >
                      {isSignUp ? "Create Account" : "Sign In"}
                    </motion.span>
                  )}
                </Button>
              </motion.div>
            </form>

            <AnimatePresence>
              {showResendConfirmation && lastSignupEmail && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mt-4 p-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Mail className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-700 dark:text-blue-300">Need to confirm your email?</span>
                  </div>
                  <p className="text-xs text-blue-600 dark:text-blue-400 mb-2">
                    Didn't receive the confirmation email for {lastSignupEmail}?
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleResendConfirmation}
                    className="w-full text-blue-600 border-blue-200 hover:bg-blue-50"
                  >
                    Resend Confirmation Email
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-muted-foreground mt-6">
          By continuing, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  );
};

export default Auth;