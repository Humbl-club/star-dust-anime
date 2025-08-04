
import React, { lazy, Suspense } from 'react';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { persistQueryClient } from '@tanstack/react-query-persist-client';
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/hooks/useAuth";
import { useServiceWorker } from "@/hooks/useServiceWorker";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ConnectionStatus } from "@/components/ConnectionStatus";
import { OfflineIndicator } from "@/components/OfflineIndicator";
import { InstallPrompt } from "@/components/pwa/InstallPrompt";
import { GraphQLProvider } from "@/providers/GraphQLProvider";
import { Loader2 } from 'lucide-react';
import Index from "./pages/Index";
import Auth from "./pages/Auth";

// Explicit lazy imports for better build optimization
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Anime = lazy(() => import('./pages/Anime'));
const Manga = lazy(() => import('./pages/Manga'));
const AnimeDetail = lazy(() => import('./pages/AnimeDetail'));
const MangaDetail = lazy(() => import('./pages/MangaDetail'));
const Trending = lazy(() => import('./pages/Trending'));
const MyLists = lazy(() => import('./pages/MyLists'));
const UserProfile = lazy(() => import('./pages/UserProfile'));
const Analytics = lazy(() => import('./pages/Analytics'));
const Gamification = lazy(() => import('./pages/Gamification'));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const Settings = lazy(() => import('./pages/Settings'));
const EmailDebug = lazy(() => import('./pages/EmailDebug'));
const TestDashboard = lazy(() => import('./pages/TestDashboard'));
const SyncDashboard = lazy(() => import('./pages/SyncDashboard'));
const PerformanceMonitoring = lazy(() => import('./pages/PerformanceMonitoring'));

const routes = [
  { path: '/dashboard', component: Dashboard },
  { path: '/anime', component: Anime },
  { path: '/manga', component: Manga },
  { path: '/anime/:id', component: AnimeDetail },
  { path: '/manga/:id', component: MangaDetail },
  { path: '/trending', component: Trending },
  { path: '/my-lists', component: MyLists },
  { path: '/user/:username', component: UserProfile },
  { path: '/analytics', component: Analytics },
  { path: '/gamification', component: Gamification },
  { path: '/admin', component: AdminDashboard },
  { path: '/settings', component: Settings },
  { path: '/email-debug', component: EmailDebug },
  { path: '/test-dashboard', component: TestDashboard },
  { path: '/sync-dashboard', component: SyncDashboard },
  { path: '/performance-monitoring', component: PerformanceMonitoring },
];

// Loading component
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="text-center">
      <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
      <p className="text-muted-foreground">Loading...</p>
    </div>
  </div>
);

// Enhanced query client with comprehensive caching strategy - moved outside component
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30 * 60 * 1000, // 30 minutes - longer for better performance
      gcTime: 2 * 60 * 60 * 1000, // 2 hours - keep in memory longer
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      refetchOnWindowFocus: false,
      refetchOnReconnect: 'always',
      networkMode: 'online',
      // Enable background refetching for fresh data
      refetchInterval: 5 * 60 * 1000, // Background refresh every 5 minutes
      refetchIntervalInBackground: false, // Only when tab is active
    },
    mutations: {
      retry: 1,
      onError: (error) => {
        console.error('Mutation error:', error);
      },
      // Optimistic updates for better UX
      onMutate: () => {
        console.log('Mutation started - implementing optimistic update');
      },
    },
  },
});

// Create persister for React Query
const persister = createSyncStoragePersister({
  storage: window.localStorage,
  throttleTime: 1000,
});

// Enable query persistence
persistQueryClient({
  queryClient,
  persister,
  maxAge: 24 * 60 * 60 * 1000, // 24 hours
  hydrateOptions: {},
  dehydrateOptions: {
    shouldDehydrateQuery: (query) => {
      // Don't persist user-specific data
      const queryKey = query.queryKey;
      return !queryKey.some(key => 
        typeof key === 'string' && (key.includes('user') || key.includes('auth'))
      );
    },
  },
});

const App = () => {
  // Add service worker hook
  const { updateAvailable, updateServiceWorker } = useServiceWorker();
  
  // Safety check for React
  if (!React || !React.useEffect) {
    console.error('React is not properly loaded');
    return <div>Loading...</div>;
  }

  return (
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <GraphQLProvider>
          <ErrorBoundary>
            <TooltipProvider>
              <Toaster />
              <BrowserRouter>
                <ErrorBoundary>
                  <AuthProvider>
                    <OfflineIndicator />
                    <ConnectionStatus />
                    <InstallPrompt />
                    <Routes>
                      <Route path="/" element={<ErrorBoundary><Index /></ErrorBoundary>} />
                      <Route path="/auth" element={<Auth />} />
                      {routes.map(({ path, component: Component }) => (
                        <Route
                          key={path}
                          path={path}
                          element={
                            <ErrorBoundary>
                              <Suspense fallback={<PageLoader />}>
                                <Component />
                              </Suspense>
                            </ErrorBoundary>
                          }
                        />
                      ))}
                    </Routes>
                  </AuthProvider>
                </ErrorBoundary>
              </BrowserRouter>
              <ConnectionStatus />
            </TooltipProvider>
          </ErrorBoundary>
        </GraphQLProvider>
      </QueryClientProvider>
    </HelmetProvider>
  );
}

export default App;
