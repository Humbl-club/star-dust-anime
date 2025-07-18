import React from 'react';
import { Card } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

interface LoadingFallbackProps {
  message?: string;
  showSpinner?: boolean;
  className?: string;
}

/**
 * Loading fallback component using existing UI components
 * Maintains glass-card styling and current theme
 */
export const LoadingFallback: React.FC<LoadingFallbackProps> = ({
  message = "Loading...",
  showSpinner = true,
  className = ""
}) => {
  return (
    <div className={`flex items-center justify-center p-8 ${className}`}>
      <Card className="glass-card p-6 text-center">
        {showSpinner && (
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
        )}
        <p className="text-muted-foreground">{message}</p>
      </Card>
    </div>
  );
};

/**
 * Minimal loading fallback for critical sections
 */
export const MinimalLoadingFallback: React.FC<{ message?: string }> = ({ 
  message = "Loading..." 
}) => (
  <div className="flex items-center justify-center gap-2 p-4">
    <Loader2 className="h-4 w-4 animate-spin text-primary" />
    <span className="text-sm text-muted-foreground">{message}</span>
  </div>
);

/**
 * Full page loading fallback
 */
export const FullPageLoadingFallback: React.FC<{ message?: string }> = ({ 
  message = "Loading..." 
}) => (
  <div className="min-h-screen flex items-center justify-center">
    <LoadingFallback message={message} />
  </div>
);

/**
 * Skeleton loading component using existing patterns
 */
export const SkeletonCard: React.FC<{ className?: string }> = ({ 
  className = "" 
}) => (
  <Card className={`glass-card p-4 ${className}`}>
    <div className="animate-pulse space-y-3">
      <div className="h-4 bg-muted-foreground/20 rounded w-3/4"></div>
      <div className="h-3 bg-muted-foreground/20 rounded w-1/2"></div>
      <div className="h-3 bg-muted-foreground/20 rounded w-5/6"></div>
    </div>
  </Card>
);