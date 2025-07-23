import { useMemo, useState, useEffect } from 'react';
import { AnimeCard } from '@/components/features/AnimeCard';
import { VirtualizedList } from '@/components/VirtualizedList';
import { type AnimeContent, type MangaContent } from '@/types/api.types';
import { useInView } from 'framer-motion';
import { useRef } from 'react';

interface ContentGridProps {
  content: (AnimeContent | MangaContent)[];
  contentType: 'anime' | 'manga';
  loading?: boolean;
  hasMore?: boolean;
  onLoadMore?: () => void;
  className?: string;
  enableVirtualization?: boolean;
  gridCols?: number;
}

const ITEM_HEIGHT = 420; // Card height + margin
const ITEMS_PER_ROW = 4; // Default grid columns

export function ContentGrid({
  content,
  contentType,
  loading = false,
  hasMore = false,
  onLoadMore,
  className = '',
  enableVirtualization = true,
  gridCols = ITEMS_PER_ROW
}: ContentGridProps) {
  const loadMoreRef = useRef(null);
  const isInView = useInView(loadMoreRef);
  
  // Trigger load more when scroll reaches bottom
  useEffect(() => {
    if (isInView && hasMore && onLoadMore && !loading) {
      onLoadMore();
    }
  }, [isInView, hasMore, onLoadMore, loading]);

  // Group items into rows for virtualization
  const groupedContent = useMemo(() => {
    const rows = [];
    for (let i = 0; i < content.length; i += gridCols) {
      rows.push(content.slice(i, i + gridCols));
    }
    return rows;
  }, [content, gridCols]);

  const renderContentCard = (item: AnimeContent | MangaContent) => {
    const key = `${contentType}-${item.id}`;
    
    // For now, only render anime cards since MangaCard doesn't exist yet
    return <AnimeCard key={key} anime={item as any} />;
  };

  const renderRow = (row: (AnimeContent | MangaContent)[], index: number) => (
    <div 
      key={`row-${index}`}
      className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-${gridCols} gap-6 mb-6`}
    >
      {row.map(renderContentCard)}
    </div>
  );

  // Use virtualization for large lists
  const shouldVirtualize = enableVirtualization && content.length > 20;

  return (
    <div className={`w-full ${className}`}>
      {shouldVirtualize ? (
        <VirtualizedList
          items={groupedContent}
          renderItem={renderRow}
          itemHeight={ITEM_HEIGHT}
          containerHeight={800}
          overscan={2}
          className="w-full"
        />
      ) : (
        <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-${gridCols} gap-6`}>
          {content.map(renderContentCard)}
        </div>
      )}
      
      {/* Infinite scroll trigger */}
      {hasMore && (
        <div ref={loadMoreRef} className="h-20 flex items-center justify-center">
          {loading && (
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          )}
        </div>
      )}
    </div>
  );
}

// Optimized version for specific content types
export const AnimeGrid = (props: Omit<ContentGridProps, 'contentType'>) => (
  <ContentGrid {...props} contentType="anime" />
);

export const MangaGrid = (props: Omit<ContentGridProps, 'contentType'>) => (
  <ContentGrid {...props} contentType="manga" />
);

// Default export for lazy loading
export default ContentGrid;