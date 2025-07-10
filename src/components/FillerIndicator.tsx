import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { AlertTriangle, CheckCircle } from 'lucide-react';

interface FillerIndicatorProps {
  isFiller: boolean;
  episode?: number;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  showTooltip?: boolean;
}

export function FillerIndicator({ 
  isFiller, 
  episode, 
  size = 'sm', 
  showIcon = true,
  showTooltip = true 
}: FillerIndicatorProps) {
  const iconSize = size === 'sm' ? 'h-3 w-3' : size === 'md' ? 'h-4 w-4' : 'h-5 w-5';
  const textSize = size === 'sm' ? 'text-xs' : size === 'md' ? 'text-sm' : 'text-base';

  const badgeContent = (
    <Badge 
      variant={isFiller ? "destructive" : "default"}
      className={`${textSize} ${isFiller ? 'bg-orange-500 hover:bg-orange-600' : 'bg-green-600 hover:bg-green-700'}`}
    >
      {showIcon && (
        isFiller ? (
          <AlertTriangle className={`${iconSize} mr-1`} />
        ) : (
          <CheckCircle className={`${iconSize} mr-1`} />
        )
      )}
      {isFiller ? 'Filler' : 'Main Story'}
    </Badge>
  );

  if (!showTooltip) {
    return badgeContent;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {badgeContent}
        </TooltipTrigger>
        <TooltipContent>
          <p>
            {isFiller ? (
              <>
                Episode {episode} is filler content that can be skipped without missing main story elements.
              </>
            ) : (
              <>
                Episode {episode} contains important main story content.
              </>
            )}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}