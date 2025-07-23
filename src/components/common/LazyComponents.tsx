import { lazy, Suspense } from 'react';
import { Loader2 } from 'lucide-react';

// Lazy load heavy components
export const LazyAnimeDetail = lazy(() => import('@/pages/AnimeDetail'));
export const LazyMangaDetail = lazy(() => import('@/pages/MangaDetail'));
export const LazySettings = lazy(() => import('@/pages/Settings'));
export const LazyMyLists = lazy(() => import('@/pages/MyLists'));
export const LazyTrending = lazy(() => import('@/pages/Trending'));

// Lazy load heavy UI components - use direct default imports
export const LazyAdvancedFiltering = lazy(() => import('@/components/features/AdvancedFiltering'));
export const LazyContentGrid = lazy(() => import('@/components/features/ContentGrid'));
export const LazySearchWithFilters = lazy(() => import('@/components/SearchWithFilters'));

// Loading fallback component
const LoadingFallback = ({ text = "Loading..." }: { text?: string }) => (
  <div className="flex items-center justify-center min-h-[200px] w-full">
    <div className="flex flex-col items-center gap-3">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="text-sm text-muted-foreground">{text}</p>
    </div>
  </div>
);

// HOC for lazy loading with consistent fallback
export const withLazyLoading = <P extends object>(
  Component: React.ComponentType<P>,
  fallbackText?: string
) => {
  return (props: P) => (
    <Suspense fallback={<LoadingFallback text={fallbackText} />}>
      <Component {...props} />
    </Suspense>
  );
};

// Pre-configured lazy components with loading states
export const LazyAnimeDetailWithLoading = withLazyLoading(LazyAnimeDetail, "Loading anime details...");
export const LazyMangaDetailWithLoading = withLazyLoading(LazyMangaDetail, "Loading manga details...");
export const LazySettingsWithLoading = withLazyLoading(LazySettings, "Loading settings...");
export const LazyMyListsWithLoading = withLazyLoading(LazyMyLists, "Loading your lists...");
export const LazyTrendingWithLoading = withLazyLoading(LazyTrending, "Loading trending content...");

export const LazyAdvancedFilteringWithLoading = withLazyLoading(LazyAdvancedFiltering, "Loading filters...");
export const LazyContentGridWithLoading = withLazyLoading(LazyContentGrid, "Loading content...");
export const LazySearchWithFiltersWithLoading = withLazyLoading(LazySearchWithFilters, "Loading search...");