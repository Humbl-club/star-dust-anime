import React from 'react';
import { Building2, Star } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface Studio {
  id: string;
  name: string;
  slug: string;
  is_main: boolean;
  role: string;
  logo_url?: string;
}

interface StudiosListProps {
  studios: Studio[];
  onStudioClick?: (slug: string) => void;
  className?: string;
}

export const StudiosList: React.FC<StudiosListProps> = ({
  studios,
  onStudioClick,
  className
}) => {
  const mainStudios = studios.filter(s => s.is_main);
  const otherStudios = studios.filter(s => !s.is_main);

  return (
    <div className={cn('space-y-3', className)}>
      <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
        <Building2 className="w-4 h-4" />
        Studios
      </h3>
      
      <div className="space-y-2">
        {mainStudios.length > 0 && (
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Main Production</p>
            <div className="flex flex-wrap gap-2">
              {mainStudios.map((studio) => (
                <Badge
                  key={studio.id}
                  variant="default"
                  className="cursor-pointer transition-all hover:scale-105"
                  onClick={() => onStudioClick?.(studio.slug)}
                >
                  <Star className="w-3 h-3 mr-1" />
                  {studio.name}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {otherStudios.length > 0 && (
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Other Studios</p>
            <div className="flex flex-wrap gap-2">
              {otherStudios.map((studio) => (
                <Badge
                  key={studio.id}
                  variant="outline"
                  className="cursor-pointer transition-all hover:scale-105"
                  onClick={() => onStudioClick?.(studio.slug)}
                >
                  {studio.name}
                  {studio.role !== 'animation' && (
                    <span className="ml-1 text-xs opacity-60">
                      ({studio.role})
                    </span>
                  )}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};