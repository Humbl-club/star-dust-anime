import { useState } from 'react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Info, Eye, EyeOff } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface FillerToggleProps {
  hideFillerContent: boolean;
  onToggle: (hide: boolean) => void;
  fillerCount?: number;
  mainStoryCount?: number;
  isLoading?: boolean;
}

export function FillerToggle({ 
  hideFillerContent, 
  onToggle, 
  fillerCount = 0, 
  mainStoryCount = 0,
  isLoading = false 
}: FillerToggleProps) {
  return (
    <div className="flex items-center justify-between p-4 rounded-lg border bg-card">
      <div className="flex items-center space-x-3">
        <div className="flex items-center space-x-2">
          <Switch
            id="hide-filler"
            checked={hideFillerContent}
            onCheckedChange={onToggle}
            disabled={isLoading}
          />
          <Label htmlFor="hide-filler" className="text-sm font-medium">
            Hide Filler Content
          </Label>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Info className="h-4 w-4 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-xs">
                  Filler episodes are not part of the main story and can typically be skipped without missing important plot points.
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      {!isLoading && (fillerCount > 0 || mainStoryCount > 0) && (
        <div className="flex items-center space-x-2">
          {hideFillerContent ? (
            <div className="flex items-center space-x-1">
              <Eye className="h-4 w-4 text-primary" />
              <Badge variant="secondary" className="text-xs">
                {mainStoryCount} Main Story
              </Badge>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-1">
                <Eye className="h-4 w-4 text-primary" />
                <Badge variant="secondary" className="text-xs">
                  {mainStoryCount} Main Story
                </Badge>
              </div>
              <div className="flex items-center space-x-1">
                <EyeOff className="h-4 w-4 text-muted-foreground" />
                <Badge variant="outline" className="text-xs">
                  {fillerCount} Filler
                </Badge>
              </div>
            </div>
          )}
        </div>
      )}

      {isLoading && (
        <Badge variant="outline" className="text-xs">
          Loading filler data...
        </Badge>
      )}
    </div>
  );
}