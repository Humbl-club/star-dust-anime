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
  // BYPASS FEATURE RESTRICTIONS FOR TESTING - ALWAYS ALLOW ACCESS
  return <>{children}</>;
};