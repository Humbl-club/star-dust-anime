import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Eye, EyeOff, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface Tag {
  id: string;
  name: string;
  slug: string;
  category: string;
  rank: number;
  votes: number;
  is_spoiler: boolean;
}

interface TagCloudProps {
  tags: Tag[];
  showSpoilers?: boolean;
  onTagClick?: (slug: string) => void;
  className?: string;
}

export const TagCloud: React.FC<TagCloudProps> = ({
  tags,
  showSpoilers = false,
  onTagClick,
  className
}) => {
  const [localShowSpoilers, setLocalShowSpoilers] = useState(showSpoilers);

  // Sort tags by rank and filter spoilers
  const displayTags = tags
    .filter(tag => !tag.is_spoiler || localShowSpoilers)
    .sort((a, b) => b.rank - a.rank);

  const spoilerCount = tags.filter(tag => tag.is_spoiler).length;

  // Calculate tag size based on rank
  const getTagSize = (rank: number) => {
    const maxRank = Math.max(...tags.map(t => t.rank));
    const normalized = rank / maxRank;
    
    if (normalized > 0.8) return 'text-base';
    if (normalized > 0.6) return 'text-sm';
    return 'text-xs';
  };

  const categoryStyles: Record<string, string> = {
    content_warning: 'border-destructive/30 bg-destructive/10 text-destructive-foreground',
    technical: 'border-muted/30 bg-muted/10 text-muted-foreground',
    narrative: 'border-primary/30 bg-primary/10 text-primary',
    aesthetic: 'border-secondary/30 bg-secondary/10 text-secondary-foreground',
    demographic: 'border-accent/30 bg-accent/10 text-accent-foreground',
    theme: 'border-primary/30 bg-primary/10 text-primary',
    setting: 'border-muted/30 bg-muted/10 text-muted-foreground',
  };

  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-muted-foreground">Tags</h3>
        {spoilerCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocalShowSpoilers(!localShowSpoilers)}
            className="h-7 text-xs"
          >
            {localShowSpoilers ? (
              <>
                <EyeOff className="w-3 h-3 mr-1" />
                Hide Spoilers ({spoilerCount})
              </>
            ) : (
              <>
                <Eye className="w-3 h-3 mr-1" />
                Show Spoilers ({spoilerCount})
              </>
            )}
          </Button>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {displayTags.map((tag) => (
          <TooltipProvider key={tag.id}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge
                  variant="outline"
                  className={cn(
                    'cursor-pointer transition-all hover:scale-105',
                    getTagSize(tag.rank),
                    categoryStyles[tag.category] || 'border-border bg-card/50',
                    tag.is_spoiler && 'border-dashed',
                    onTagClick && 'hover:shadow-md'
                  )}
                  onClick={() => onTagClick?.(tag.slug)}
                >
                  {tag.is_spoiler && <AlertTriangle className="w-3 h-3 mr-1" />}
                  {tag.name}
                  {tag.votes > 100 && (
                    <span className="ml-1 text-xs opacity-60">
                      {tag.votes}
                    </span>
                  )}
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                <div className="text-xs">
                  <p className="font-medium">{tag.category.replace('_', ' ')}</p>
                  <p>Rank: {tag.rank} | Votes: {tag.votes}</p>
                  {tag.is_spoiler && <p className="text-destructive">Contains spoilers</p>}
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ))}
      </div>
    </div>
  );
};