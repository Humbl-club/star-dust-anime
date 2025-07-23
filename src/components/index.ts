// Explicit component exports instead of star exports
export * from './common';
export * from './features';
export * from './layouts';

// Backwards compatibility exports for components that exist
export { Navigation } from './Navigation';
export { ProfileMenu } from './ProfileMenu';
export { RatingComponent } from './RatingComponent';
export { ShareButton } from './ShareButton';
export { VirtualizedList } from './VirtualizedList';

// Add the unified search bar export
export { UnifiedSearchBar } from './UnifiedSearchBar';

// Mark old search components as deprecated
export { SearchBar } from './SearchBar'; // @deprecated - use UnifiedSearchBar
export { OptimizedSearchBar } from './OptimizedSearchBar'; // @deprecated - use UnifiedSearchBar
export { WorkingSearchDropdown } from './WorkingSearchDropdown'; // @deprecated - use UnifiedSearchBar