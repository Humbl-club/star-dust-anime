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

  const preventClose = (e: Event) => {
    console.log('🚫 AgeVerificationModal: Preventing close');
    e.preventDefault();
  };

  return (
    <Dialog 
      open={isOpen} 
      onOpenChange={() => {
        console.log('🚫 AgeVerificationModal: onOpenChange blocked');
      }}
    >
      <DialogContent 
        className="sm:max-w-md [&>button]:hidden" 
        onPointerDownOutside={preventClose}
        onEscapeKeyDown={preventClose}
        onInteractOutside={preventClose}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            Age Verification Required
          </DialogTitle>
          <DialogDescription>
            This app contains anime and manga content. Please confirm you are 16 years or older to continue.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex flex-col gap-3 mt-4">
          <Button 
            onClick={handleAgeConfirmation}
            className="w-full"
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
          >
            I am under 16
          </Button>
        </div>

        <div className="text-xs text-muted-foreground mt-4">
          <p>This verification helps us comply with content rating requirements and ensures appropriate content access.</p>
        </div>
      </DialogContent>
    </Dialog>
  );
};