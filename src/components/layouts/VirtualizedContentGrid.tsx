import { useMemo } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useRef } from 'react';
import { AnimeCard } from '@/components/features/AnimeCard';
import { type AnimeContent, type MangaContent } from '@/types/api.types';

interface VirtualizedContentGridProps {
  content: (AnimeContent | MangaContent)[];
  contentType: 'anime' | 'manga';
  containerHeight?: number;
  itemsPerRow?: number;
  itemHeight?: number;
  className?: string;
}

const DEFAULT_ITEM_HEIGHT = 420;
const DEFAULT_ITEMS_PER_ROW = 4;

export function VirtualizedContentGrid({
  content,
  contentType,
  containerHeight = 800,
  itemsPerRow = DEFAULT_ITEMS_PER_ROW,
  itemHeight = DEFAULT_ITEM_HEIGHT,
  className = ''
}: VirtualizedContentGridProps) {
  const parentRef = useRef<HTMLDivElement>(null);
  
  // Group content into rows for virtualization
  const rows = useMemo(() => {
    const rowsArray = [];
    for (let i = 0; i < content.length; i += itemsPerRow) {
      rowsArray.push(content.slice(i, i + itemsPerRow));
    }
    return rowsArray;
  }, [content, itemsPerRow]);

  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => itemHeight,
    overscan: 2,
  });

  const renderContentCard = (item: AnimeContent | MangaContent) => {
    // Use AnimeCard for both types for now (can be extended for manga)
    return <AnimeCard key={item.id} anime={item as any} />;
  };

  return (
    <div
      ref={parentRef}
      className={`w-full overflow-auto ${className}`}
      style={{ height: containerHeight }}
    >
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {virtualizer.getVirtualItems().map((virtualItem) => {
          const row = rows[virtualItem.index];
          return (
            <div
              key={virtualItem.index}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: `${virtualItem.size}px`,
                transform: `translateY(${virtualItem.start}px)`,
              }}
            >
              <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-${itemsPerRow} gap-6 p-4`}>
                {row.map(renderContentCard)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default VirtualizedContentGrid;