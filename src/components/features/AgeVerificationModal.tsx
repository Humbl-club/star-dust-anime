import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Shield } from "lucide-react";

interface AgeVerificationModalProps {
  isOpen: boolean;
  onComplete: () => void;
}

export const AgeVerificationModal = ({ isOpen, onComplete }: AgeVerificationModalProps) => {
  console.log('🔍 AgeVerificationModal: isOpen =', isOpen);

  const handleAgeConfirmation = () => {
    console.log('✅ AgeVerificationModal: Age confirmed');
    onComplete();
  };

  if (!isOpen) {
    console.log('🔍 AgeVerificationModal: Not rendering - isOpen is false');
    return null;
  }

  console.log('🔍 AgeVerificationModal: Rendering modal');

  return (
    <div 
      className="fixed inset-0 z-[9999] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4"
      style={{ zIndex: 99999 }}
    >
      <div className="bg-background border border-border rounded-lg shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in-95">
        <div className="flex items-center gap-2 mb-4">
          <Shield className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold">Age Verification Required</h2>
        </div>
        
        <p className="text-sm text-muted-foreground mb-6">
          This app contains anime and manga content. Please confirm you are 16 years or older to continue.
        </p>
        
        <div className="flex flex-col gap-3">
          <Button 
            onClick={handleAgeConfirmation}
            className="w-full"
            size="lg"
          >
            I am 16 years or older
          </Button>
          
          <Button 
            variant="outline"
            onClick={() => {
              console.log('🚫 AgeVerificationModal: Redirecting to Google');
              window.location.href = 'https://www.google.com';
            }}
            className="w-full"
            size="lg"
          >
            I am under 16
          </Button>
        </div>

        <p className="text-xs text-muted-foreground mt-4">
          This verification helps us comply with content rating requirements and ensures appropriate content access.
        </p>
      </div>
    </div>
  );
};