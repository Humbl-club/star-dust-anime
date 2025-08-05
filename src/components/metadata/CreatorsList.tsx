import React from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { User, Pen, Palette, Film } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Creator {
  id: string;
  name: string;
  slug: string;
  role: string;
  is_main: boolean;
  image_url?: string;
}

interface CreatorsListProps {
  creators: Creator[];
  variant?: 'compact' | 'detailed';
  onCreatorClick?: (slug: string) => void;
  className?: string;
}

const roleIcons: Record<string, React.ElementType> = {
  author: Pen,
  artist: Palette,
  director: Film,
  default: User,
};

export const CreatorsList: React.FC<CreatorsListProps> = ({
  creators,
  variant = 'compact',
  onCreatorClick,
  className
}) => {
  // Group creators by role
  const groupedCreators = creators.reduce((acc, creator) => {
    if (!acc[creator.role]) acc[creator.role] = [];
    acc[creator.role].push(creator);
    return acc;
  }, {} as Record<string, Creator[]>);

  // Sort main creators first
  const sortedCreators = creators.sort((a, b) => {
    if (a.is_main && !b.is_main) return -1;
    if (!a.is_main && b.is_main) return 1;
    return 0;
  });

  if (variant === 'compact') {
    const mainCreators = sortedCreators.filter(c => c.is_main).slice(0, 2);
    
    return (
      <div className={cn('flex items-center gap-2 text-sm', className)}>
        <span className="text-muted-foreground">By</span>
        {mainCreators.map((creator, index) => (
          <React.Fragment key={creator.id}>
            {index > 0 && <span className="text-muted-foreground">&</span>}
            <button
              onClick={() => onCreatorClick?.(creator.slug)}
              className="font-medium hover:underline text-foreground hover:text-primary transition-colors"
            >
              {creator.name}
            </button>
          </React.Fragment>
        ))}
        {creators.length > mainCreators.length && (
          <span className="text-muted-foreground">
            +{creators.length - mainCreators.length} more
          </span>
        )}
      </div>
    );
  }

  return (
    <div className={cn('space-y-3', className)}>
      <h3 className="text-sm font-medium text-muted-foreground">Creators & Staff</h3>
      <div className="space-y-4">
        {Object.entries(groupedCreators).map(([role, roleCreators]) => {
          const Icon = roleIcons[role] || roleIcons.default;
          
          return (
            <div key={role} className="space-y-2">
              <div className="flex items-center gap-2">
                <Icon className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium capitalize">{role}</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {roleCreators.map((creator) => (
                  <button
                    key={creator.id}
                    onClick={() => onCreatorClick?.(creator.slug)}
                    className={cn(
                      'flex items-center gap-2 p-2 rounded-lg transition-colors',
                      'hover:bg-muted/50',
                      creator.is_main && 'bg-muted/30'
                    )}
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>
                        {creator.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 text-left">
                      <p className="text-sm font-medium line-clamp-1">{creator.name}</p>
                      {creator.is_main && (
                        <Badge variant="secondary" className="text-xs h-4">
                          Main
                        </Badge>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};