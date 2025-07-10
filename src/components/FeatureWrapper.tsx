import { ReactNode } from 'react';
import { useEmailVerification } from '@/hooks/useEmailVerification';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Lock, Mail } from 'lucide-react';

interface FeatureWrapperProps {
  children: ReactNode;
  feature: string;
  fallbackText?: string;
  showTooltip?: boolean;
}

export const FeatureWrapper = ({ 
  children, 
  feature, 
  fallbackText = "Email verification required",
  showTooltip = true 
}: FeatureWrapperProps) => {
  const { canUseFeature, isVerified } = useEmailVerification();

  const canAccess = canUseFeature(feature);

  if (canAccess) {
    return <>{children}</>;
  }

  // Feature is restricted
  const restrictedContent = (
    <div className="relative">
      <div className="opacity-50 pointer-events-none">
        {children}
      </div>
      <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm rounded-md">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Lock className="w-4 h-4" />
          <span>Restricted</span>
        </div>
      </div>
    </div>
  );

  if (!showTooltip) {
    return restrictedContent;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {restrictedContent}
        </TooltipTrigger>
        <TooltipContent>
          <div className="flex items-center gap-2">
            <Mail className="w-4 h-4" />
            <span>{fallbackText}</span>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};