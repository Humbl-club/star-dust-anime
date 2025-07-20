# Architecture Overview

This document provides a comprehensive overview of the technical architecture for the Anime & Manga Discovery Platform.

## 🏗️ System Architecture

### High-Level Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   External      │
│   (React SPA)   │◄──►│   (Supabase)    │◄──►│   APIs          │
└─────────────────┘    └─────────────────┘    └─────────────────┘
│                      │                      │
├─ React 18           ├─ PostgreSQL         ├─ AniList API
├─ TypeScript         ├─ Authentication     ├─ MyAnimeList API
├─ Vite               ├─ Real-time          └─ External Content
├─ Tailwind CSS       ├─ Storage               Providers
├─ React Query        └─ Edge Functions
└─ Zustand
```

## 🎯 Frontend Architecture

### Component Architecture

```
src/components/
├── common/              # Shared utilities and wrappers
│   ├── FeatureWrapper   # Feature flag wrapper
│   ├── LazyComponents   # Code splitting utilities
│   └── InitWrapper     # App initialization
│
├── features/            # Business logic components
│   ├── AnimeCard        # Content display cards
│   ├── ContentGrid     # Virtualized content lists
│   ├── AddToListButton # User interaction components
│   └── Filtering       # Search and filter logic
│
├── layouts/             # Page structure components
│   ├── DetailPageLayout# Common page layouts
│   ├── Navigation      # App navigation
│   └── Grids           # Content organization
│
└── ui/                 # Base UI components (shadcn/ui)
    ├── Button          # Interactive elements
    ├── Card            # Content containers
    └── Form            # Input components
```

### State Management Strategy

```typescript
// Global State (Zustand)
interface AppState {
  user: UserState;        // Authentication
  preferences: UIState;   // User preferences
  search: SearchState;    // Search and filters
}

// Server State (React Query)
const queryKeys = {
  anime: (filters) => ['anime', filters],
  user: (userId) => ['user', userId],
  lists: (userId) => ['lists', userId]
};

// Local State (React useState/useReducer)
// Component-specific UI state
// Form state and validation
// Temporary interaction state
```

### Data Flow Architecture

```
User Action
    ↓
Component Event Handler
    ↓
State Update (Zustand/React Query)
    ↓
API Call (Services Layer)
    ↓
Supabase Client
    ↓
Database/External API
    ↓
Response Processing
    ↓
Cache Update (React Query)
    ↓
Component Re-render
```

## 🗄️ Backend Architecture

### Supabase Structure

```sql
-- Core Content Tables
titles              -- Anime/Manga metadata
anime_details       -- Anime-specific data
manga_details       -- Manga-specific data
genres             -- Genre taxonomy
studios            -- Animation studios
authors            -- Manga authors

-- User Management
profiles           -- User profiles
user_preferences   -- User settings
user_lists         -- User anime/manga lists
user_ratings       -- User scores and reviews

-- Gamification
user_points        -- Points system
user_achievements  -- Achievement tracking
user_loot_boxes   -- Reward system

-- System Tables
sync_status        -- Data synchronization
analytics_events   -- User analytics
```

### Database Relationships

```
titles (1:1) ←→ anime_details
titles (1:1) ←→ manga_details
titles (M:N) ←→ genres (via title_genres)
titles (M:N) ←→ studios (via title_studios)
titles (M:N) ←→ authors (via title_authors)

users (1:1) ←→ profiles
users (1:M) ←→ user_lists
users (1:M) ←→ user_ratings
users (1:1) ←→ user_preferences
```

### Row Level Security (RLS)

```sql
-- Example RLS Policies
CREATE POLICY "Users can view their own lists"
ON user_lists FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own data"
ON profiles FOR ALL
USING (auth.uid() = id);
```

## 🔄 Data Synchronization

### Query Optimization Strategy

```typescript
// High-performance queries with database-level filtering
const useSimpleNewApiData = ({
  contentType,
  limit = 50,
  filters = {}
}) => {
  return useQuery({
    queryKey: ['content', contentType, filters],
    queryFn: () => supabase
      .from('titles')
      .select(`
        *,
        ${contentType}_details!inner(*),
        title_genres(genres(*)),
        title_studios(studios(*))
      `)
      .eq(`${contentType}_details.type`, filters.type)
      .range(0, limit - 1)
      .order('score', { ascending: false }),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};
```

### Caching Strategy

```typescript
// React Query Configuration
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,      // 5 minutes fresh
      gcTime: 10 * 60 * 1000,       // 10 minutes cache
      retry: 2,
      refetchOnWindowFocus: false,
    }
  }
});
```

## 🎨 UI/UX Architecture

### Design System

```css
/* Semantic Design Tokens */
:root {
  /* Color System */
  --primary: 210 40% 98%;
  --primary-foreground: 222.2 84% 4.9%;
  
  /* Spacing Scale */
  --space-xs: 0.25rem;
  --space-sm: 0.5rem;
  --space-md: 1rem;
  
  /* Typography Scale */
  --text-xs: 0.75rem;
  --text-sm: 0.875rem;
  --text-base: 1rem;
}
```

### Responsive Breakpoints

```typescript
const breakpoints = {
  sm: '640px',   // Mobile landscape
  md: '768px',   // Tablet
  lg: '1024px',  // Desktop
  xl: '1280px',  // Large desktop
  '2xl': '1536px' // Extra large
};
```

### Theme Architecture

```typescript
// Theme Configuration
interface ThemeConfig {
  mode: 'light' | 'dark' | 'system';
  accent: string;
  animations: boolean;
  reducedMotion: boolean;
}

// Dynamic Theme Application
const applyTheme = (theme: ThemeConfig) => {
  document.documentElement.dataset.theme = theme.mode;
  document.documentElement.style.setProperty('--accent', theme.accent);
};
```

## ⚡ Performance Architecture

### Code Splitting Strategy

```typescript
// Route-level splitting
const LazyAnimeDetail = lazy(() => import('@/pages/AnimeDetail'));
const LazyMangaDetail = lazy(() => import('@/pages/MangaDetail'));

// Component-level splitting
const LazyContentGrid = lazy(() => 
  import('@/components/features/ContentGrid')
);

// Bundle analysis and optimization
const bundleConfig = {
  chunkSizeWarningLimit: 1000,
  manualChunks: {
    'react-vendor': ['react', 'react-dom'],
    'ui-vendor': ['@radix-ui/*'],
    'query-vendor': ['@tanstack/react-query']
  }
};
```

### Virtual Scrolling

```typescript
// Efficient rendering of large lists
const VirtualizedContentGrid = ({ items, itemHeight = 300 }) => {
  const { scrollElementRef, virtualItems } = useVirtual({
    size: items.length,
    estimateSize: () => itemHeight,
    overscan: 5
  });

  return (
    <div ref={scrollElementRef}>
      {virtualItems.map(virtualItem => (
        <div key={virtualItem.index}>
          <AnimeCard anime={items[virtualItem.index]} />
        </div>
      ))}
    </div>
  );
};
```

### Image Optimization

```typescript
// Responsive image loading
const OptimizedImage = ({ src, alt, sizes }) => (
  <img
    src={src}
    alt={alt}
    sizes={sizes}
    loading="lazy"
    decoding="async"
    onError={(e) => {
      e.currentTarget.src = '/placeholder.svg';
    }}
  />
);
```

## 🔒 Security Architecture

### Authentication Flow

```
User Login Request
    ↓
Supabase Auth
    ↓
JWT Token Generation
    ↓
Row Level Security Policies
    ↓
Authorized Data Access
```

### Data Protection

```sql
-- RLS Policy Examples
CREATE POLICY "Users can only see public content or their own data"
ON user_lists FOR SELECT
USING (
  is_public = true OR 
  auth.uid() = user_id
);

-- Input Validation
CREATE FUNCTION validate_user_input(input text)
RETURNS boolean AS $$
BEGIN
  RETURN length(input) <= 1000 AND input !~ '[<>]';
END;
$$ LANGUAGE plpgsql;
```

## 📊 Analytics Architecture

### Event Tracking

```typescript
// Analytics Event System
interface AnalyticsEvent {
  event: string;
  properties: Record<string, any>;
  timestamp: number;
  userId?: string;
}

const trackEvent = (event: string, properties = {}) => {
  analytics.track(event, {
    ...properties,
    timestamp: Date.now(),
    page: window.location.pathname
  });
};
```

### Performance Monitoring

```typescript
// Performance Metrics Collection
const performanceMonitor = {
  trackPageLoad: () => {
    const navigation = performance.getEntriesByType('navigation')[0];
    trackEvent('page_load', {
      loadTime: navigation.loadEventEnd - navigation.loadEventStart,
      domContentLoaded: navigation.domContentLoadedEventEnd
    });
  },
  
  trackUserInteraction: (action: string) => {
    trackEvent('user_interaction', { action });
  }
};
```

## 🚀 Deployment Architecture

### Build Process

```typescript
// Vite Configuration
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          utils: ['date-fns', 'clsx']
        }
      }
    },
    sourcemap: false,
    minify: 'terser'
  }
});
```

### Environment Configuration

```bash
# Development
VITE_SUPABASE_URL=dev_url
VITE_ANALYTICS_ENABLED=false

# Production
VITE_SUPABASE_URL=prod_url
VITE_ANALYTICS_ENABLED=true
VITE_CDN_URL=cdn_url
```

## 🔧 Development Tools Architecture

### Code Quality Pipeline

```yaml
# CI/CD Pipeline
Quality Checks:
  - TypeScript compilation
  - ESLint linting
  - Prettier formatting
  - Unit test execution
  - Build verification
  - Bundle size analysis
```

### Development Workflow

```
Feature Development
    ↓
Local Testing (Storybook/Jest)
    ↓
Pre-commit Hooks (Husky)
    ↓
Pull Request
    ↓
Automated Testing (CI)
    ↓
Code Review
    ↓
Merge to Main
    ↓
Automated Deployment
```

## 📈 Scalability Considerations

### Frontend Scaling

- **Code Splitting**: Lazy load routes and components
- **Virtual Scrolling**: Handle large datasets efficiently
- **Caching Strategy**: Minimize API calls with React Query
- **Bundle Optimization**: Minimize JavaScript payload

### Backend Scaling

- **Database Indexing**: Optimize query performance
- **Connection Pooling**: Efficient database connections
- **Edge Functions**: Distribute compute closer to users
- **CDN Integration**: Cache static assets globally

### Monitoring and Observability

```typescript
// Performance Monitoring
const monitor = {
  trackRender: (componentName: string) => {
    const start = performance.now();
    return () => {
      const duration = performance.now() - start;
      if (duration > 16) { // > 1 frame
        console.warn(`Slow render: ${componentName} took ${duration}ms`);
      }
    };
  }
};
```

This architecture provides a solid foundation for a scalable, maintainable, and performant anime/manga discovery platform while ensuring good developer experience and code quality.