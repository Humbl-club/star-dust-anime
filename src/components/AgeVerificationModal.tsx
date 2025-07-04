import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Shield, AlertTriangle } from "lucide-react";

interface AgeVerificationModalProps {
  isOpen: boolean;
  onComplete: () => void;
}

export const AgeVerificationModal = ({ isOpen, onComplete }: AgeVerificationModalProps) => {
  const [ageRange, setAgeRange] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (!ageRange) return;

    setIsSubmitting(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const isAdult = ageRange === "18+" || ageRange === "25+";
      const contentRating = ageRange === "under13" ? "all" : 
                          ageRange === "13-17" ? "teen" : 
                          ageRange === "18+" ? "mature" : "adult";

      const { error } = await supabase
        .from('user_content_preferences')
        .upsert({
          user_id: user.id,
          age_verified: true,
          age_verification_date: new Date().toISOString(),
          show_adult_content: isAdult,
          content_rating_preference: contentRating
        });

      if (error) throw error;

      toast({
        title: "Age Verification Complete",
        description: "Your content preferences have been set based on your age group.",
      });

      onComplete();
    } catch (error: any) {
      console.error('Age verification error:', error);
      toast({
        title: "Error",
        description: "Failed to save age verification. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            Age Verification Required
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              This app contains anime and manga content with various age ratings. 
              Please verify your age to ensure appropriate content filtering.
            </AlertDescription>
          </Alert>

          <div className="space-y-4">
            <Label className="text-sm font-medium">Select your age group:</Label>
            <RadioGroup value={ageRange} onValueChange={setAgeRange}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="under13" id="under13" />
                <Label htmlFor="under13" className="text-sm">Under 13 (All ages content only)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="13-17" id="13-17" />
                <Label htmlFor="13-17" className="text-sm">13-17 (Teen content allowed)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="18+" id="18+" />
                <Label htmlFor="18+" className="text-sm">18+ (Mature content allowed)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="25+" id="25+" />
                <Label htmlFor="25+" className="text-sm">25+ (All content including adult)</Label>
              </div>
            </RadioGroup>
          </div>

          <div className="text-xs text-muted-foreground space-y-1">
            <p>• Content will be filtered based on your selection</p>
            <p>• You can change these preferences later in settings</p>
            <p>• This helps us comply with content rating requirements</p>
          </div>

          <Button 
            onClick={handleSubmit}
            disabled={!ageRange || isSubmitting}
            className="w-full"
          >
            {isSubmitting ? "Saving..." : "Continue"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};