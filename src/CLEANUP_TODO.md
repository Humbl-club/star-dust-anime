# Search Component Cleanup Task

## Overview
After migrating to the unified search system, we need to clean up old search components once all functionality is confirmed to work correctly.

## Files to Delete After Testing

### Search Components (Deprecated)
- [ ] `src/components/SearchBar.tsx` - Legacy search bar component
- [ ] `src/components/OptimizedSearchBar.tsx` - Previous optimized search component  
- [ ] `src/components/WorkingSearchDropdown.tsx` - Old dropdown search component
- [ ] `src/components/SearchAutocomplete.tsx` - Old autocomplete component (if unused)
- [ ] `src/components/SmartSearchBar.tsx` - Smart search component (if unused)

### Search Hooks (Potentially Deprecated)
- [ ] Check if `src/hooks/useSearch.ts` can be fully replaced (currently re-exports UnifiedSearch)
- [ ] Review `src/hooks/useSearchHistory.ts` - may need to be integrated or removed
- [ ] Check for any other search-related hooks that are no longer needed

### Search Components Index
- [ ] Remove deprecated component exports from `src/components/search/index.ts` (if exists)
- [ ] Clean up deprecated exports in `src/components/index.ts` 

## Testing Checklist
Before removing files, confirm all functionality works:

### Navigation Search
- [ ] Desktop navigation search works
- [ ] Mobile navigation search works  
- [ ] Search dropdown appears with results
- [ ] Search history is preserved
- [ ] Popular searches show when appropriate

### Page-Specific Search  
- [ ] Homepage search (if applicable)
- [ ] Anime page search
- [ ] Manga page search
- [ ] Search results navigation works

### Search Features
- [ ] Real-time search suggestions
- [ ] Search history functionality
- [ ] Popular search terms
- [ ] Content type filtering (anime/manga/all)
- [ ] Search result navigation
- [ ] Clear search functionality

## Migration Notes
- All search functionality has been consolidated into `UnifiedSearchBar`
- Search state management is handled by `useUnifiedSearch` hook
- Global search state is managed by `useSearchStore`

## Completion Steps
1. Test all search functionality thoroughly
2. Remove deprecated files listed above
3. Update any remaining imports that reference old components
4. Run full application test to ensure no broken references
5. Delete this cleanup file once complete