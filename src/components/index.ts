// Main component exports organized by category
// EXPLICIT EXPORTS to avoid circular dependencies

// Common utilities
export { FeatureWrapper } from './common/FeatureWrapper';
export { InitializationWrapper } from './common/InitializationWrapper'; 
export { DeepLinkHandler, useTrackingData } from './common/DeepLinkHandler';

// Features
export { AddToListButton } from './features/AddToListButton';
export { AdvancedFiltering } from './features/AdvancedFiltering';
export { AnimeCard } from './features/AnimeCard';
export { ContentGrid, AnimeGrid, MangaGrid } from './features/ContentGrid';

// Layouts
export { DetailPageLayout } from './layouts/DetailPageLayout';
export { VirtualizedContentGrid } from './layouts/VirtualizedContentGrid';

// Root level components
export { ErrorBoundary } from './ErrorBoundary';
export { Navigation } from './Navigation';
export { ProfileMenu } from './ProfileMenu'; 
export { RatingComponent } from './RatingComponent';
export { ShareButton } from './ShareButton';
export { VirtualizedList } from './VirtualizedList';
export { WorkingSearchDropdown } from './WorkingSearchDropdown';