# Component Organization

This project follows the recommended folder structure for better organization and maintainability:

## Structure

```
src/components/
├── common/          # Shared utility components
│   ├── FeatureWrapper.tsx
│   ├── InitializationWrapper.tsx
│   ├── DeepLinkHandler.tsx
│   ├── LazyComponents.tsx
│   └── index.ts     # Re-exports common components
├── features/        # Feature-specific components
│   ├── AddToListButton.tsx
│   ├── AdvancedFiltering.tsx
│   ├── AgeVerificationModal.tsx
│   ├── AnalyticsCharts.tsx
│   ├── AnimeCard.tsx
│   ├── ContentGrid.tsx
│   └── index.ts     # Re-exports feature components
├── layouts/         # Layout and navigation components
│   ├── DetailPageLayout.tsx
│   ├── VirtualizedContentGrid.tsx
│   └── index.ts     # Re-exports layout components
├── ui/             # Shadcn/ui components (read-only)
└── index.ts        # Main component exports
```

## Import Patterns

### From Pages:
```typescript
// Use specific paths for better tree-shaking
import { AnimeCard } from '@/components/features/AnimeCard';
import { DetailPageLayout } from '@/components/layouts/DetailPageLayout';
import { FeatureWrapper } from '@/components/common/FeatureWrapper';

// Or use barrel exports
import { AnimeCard } from '@/components/features';
import { DetailPageLayout } from '@/components/layouts';
```

### Category Guidelines:

**common/**: Shared utilities used across multiple features
- FeatureWrapper, InitializationWrapper
- DeepLinkHandler for URL tracking
- LazyComponents for code splitting

**features/**: Business logic components
- AddToListButton, AnimeCard, ContentGrid
- AdvancedFiltering, AnalyticsCharts
- Feature-specific modals and forms

**layouts/**: Page structure and navigation
- DetailPageLayout for detail pages
- Navigation components
- Grid and list layouts

## Benefits

1. **Clear separation of concerns**: Components are organized by their purpose
2. **Better maintainability**: Easy to find and modify related components
3. **Improved tree-shaking**: More granular imports reduce bundle size
4. **Scalability**: Easy to add new components to appropriate categories
5. **Developer experience**: Consistent import patterns across the codebase