import { useVirtualizer } from '@tanstack/react-virtual';
import { RefObject } from 'react';

interface UseVirtualListOptions {
  items: any[];
  containerRef: RefObject<HTMLElement>;
  estimateSize?: () => number;
  overscan?: number;
  scrollPaddingStart?: number;
  scrollPaddingEnd?: number;
}

export const useVirtualList = ({
  items,
  containerRef,
  estimateSize = () => 300,
  overscan = 5,
  scrollPaddingStart = 80,
  scrollPaddingEnd = 80,
}: UseVirtualListOptions) => {
  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => containerRef.current,
    estimateSize,
    overscan,
    scrollPaddingStart,
    scrollPaddingEnd,
  });

  return virtualizer;
};