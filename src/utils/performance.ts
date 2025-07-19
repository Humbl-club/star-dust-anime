// Performance utilities and optimizations

// Debounce function for search inputs
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

// Throttle function for scroll events
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

// Image lazy loading with intersection observer
export function createImageLazyLoader(threshold = 0.1) {
  const imageObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const img = entry.target as HTMLImageElement;
          if (img.dataset.src) {
            img.src = img.dataset.src;
            img.removeAttribute('data-src');
            imageObserver.unobserve(img);
          }
        }
      });
    },
    { threshold }
  );

  return {
    observe: (img: HTMLImageElement) => imageObserver.observe(img),
    disconnect: () => imageObserver.disconnect()
  };
}

// Memory usage monitoring
export function getMemoryUsage() {
  if ('memory' in performance) {
    const memory = (performance as any).memory;
    return {
      used: Math.round(memory.usedJSHeapSize / 1048576), // MB
      allocated: Math.round(memory.totalJSHeapSize / 1048576), // MB
      limit: Math.round(memory.jsHeapSizeLimit / 1048576) // MB
    };
  }
  return null;
}

// Bundle size analysis helper
export function analyzeBundleSize() {
  if (process.env.NODE_ENV === 'development') {
    console.log('🔍 Bundle Analysis:');
    console.log('Memory Usage:', getMemoryUsage());
    
    // Log largest imports (development only)
    if (import.meta.hot) {
      console.log('📦 Large Dependencies Loaded:');
      // This would be enhanced with actual bundle analyzer data
    }
  }
}

// Performance measurement utilities
export class PerformanceTracker {
  private marks: Map<string, number> = new Map();

  mark(name: string) {
    this.marks.set(name, performance.now());
  }

  measure(name: string, startMark?: string): number {
    const endTime = performance.now();
    const startTime = startMark ? this.marks.get(startMark) : this.marks.get(name);
    
    if (startTime === undefined) {
      console.warn(`Performance mark "${startMark || name}" not found`);
      return 0;
    }

    const duration = endTime - startTime;
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`⏱️ ${name}: ${duration.toFixed(2)}ms`);
    }

    return duration;
  }

  clear() {
    this.marks.clear();
  }
}

export const performanceTracker = new PerformanceTracker();

// React Query optimization helpers
export const queryDefaults = {
  staleTime: 5 * 60 * 1000, // 5 minutes
  gcTime: 10 * 60 * 1000, // 10 minutes
  retry: 2,
  retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 30000),
  refetchOnWindowFocus: false,
  refetchOnReconnect: 'always' as const,
};

// Memoization helper for expensive calculations
export function memoizeOne<Args extends any[], Return>(
  fn: (...args: Args) => Return,
  isEqual?: (newArgs: Args, lastArgs: Args) => boolean
): (...args: Args) => Return {
  let lastArgs: Args;
  let lastResult: Return;
  let hasResult = false;

  const defaultIsEqual = (a: Args, b: Args) => {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (a[i] !== b[i]) return false;
    }
    return true;
  };

  const areEqual = isEqual || defaultIsEqual;

  return (...args: Args): Return => {
    if (!hasResult || !areEqual(args, lastArgs)) {
      lastResult = fn(...args);
      lastArgs = args;
      hasResult = true;
    }
    return lastResult;
  };
}