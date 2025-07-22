import React from 'react';

export function AnimeCardSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="glass-card rounded-lg overflow-hidden">
        {/* Image skeleton */}
        <div className="bg-muted/50 rounded-t-lg aspect-[3/4] mb-2"></div>
        
        {/* Content skeleton */}
        <div className="p-4">
          {/* Title skeleton */}
          <div className="h-4 bg-muted/50 rounded w-3/4 mb-2"></div>
          
          {/* Rating skeleton */}
          <div className="h-3 bg-muted/50 rounded w-1/2 mb-2"></div>
          
          {/* Genre skeleton */}
          <div className="h-3 bg-muted/50 rounded w-2/3"></div>
        </div>
      </div>
    </div>
  );
}

export function AnimeGridSkeleton({ count = 12 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <AnimeCardSkeleton key={i} />
      ))}
    </div>
  );
}