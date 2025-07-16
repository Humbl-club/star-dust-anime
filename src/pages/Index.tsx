import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import EmailConfirmation from "@/components/auth/EmailConfirmation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  // Check if this is an email confirmation callback
  const isEmailConfirmation = searchParams.get('type') === 'signup' && searchParams.get('token');
  
  // If this is an email confirmation, show the confirmation component
  if (isEmailConfirmation) {
    return <EmailConfirmation />;
  }

  useEffect(() => {
    if (sessionStorage.getItem('justSignedUp') === 'true') {
      // Show welcome popup
      sessionStorage.removeItem('justSignedUp');
      // You can trigger a state update here to show a welcome modal/toast
      alert('Welcome to Anithing! Please explore our platform.');
    }
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/5">
      <div className="container mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <Card className="max-w-md mx-auto">
          <CardContent className="text-center">
            <h1 className="text-2xl font-semibold mb-4">Welcome to Anithing!</h1>
            <p className="text-gray-600 mb-4">
              Explore a vast collection of anime and manga, track your progress, and discover new favorites.
            </p>
            {user ? (
              <>
                <p className="text-green-500 font-semibold mb-4">You are signed in!</p>
                <Button onClick={() => navigate('/dashboard')}>Go to Dashboard</Button>
              </>
            ) : (
              <>
                <p className="text-gray-600 mb-4">Sign up or sign in to get started.</p>
                <Button onClick={() => navigate('/auth')}>Get Started</Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Index;
