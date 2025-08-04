
import React, { lazy, Suspense } from 'react';
import { QueryClientProvider } from "@tanstack/react-query";
import { persistQueryClient } from '@tanstack/react-query-persist-client';
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { useServiceWorker } from "@/hooks/useServiceWorker";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ConnectionStatus } from "@/components/ConnectionStatus";
import { OfflineIndicator } from "@/components/OfflineIndicator";
import { InstallPrompt } from "@/components/pwa/InstallPrompt";
import { GraphQLProvider } from "@/providers/GraphQLProvider";
import { Loader2 } from 'lucide-react';
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import ResetPassword from "./pages/ResetPassword";
import NotFound from "./pages/NotFound";

// Lazy load routes
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
const StreamingSearch = lazy(() => import('./pages/StreamingSearch'));

const routes = [
  { path: '/', element: Index, protected: false },
  { path: '/auth', element: Auth, protected: false },
  { path: '/auth/reset-password', element: ResetPassword, protected: false },
  { path: '/dashboard', element: Dashboard, protected: true },
  { path: '/anime', element: Anime, protected: false },
  { path: '/anime/:id', element: AnimeDetail, protected: false },
  { path: '/manga', element: Manga, protected: false },
  { path: '/manga/:id', element: MangaDetail, protected: false },
  { path: '/trending', element: Trending, protected: false },
  { path: '/my-lists', element: MyLists, protected: true },
  { path: '/user/:username', element: UserProfile, protected: false },
  { path: '/analytics', element: Analytics, protected: true },
  { path: '/gamification', element: Gamification, protected: true },
  { path: '/admin', element: AdminDashboard, protected: true },
  { path: '/settings', element: Settings, protected: true },
  { path: '/email-debug', element: EmailDebug, protected: true },
  { path: '/test-dashboard', element: TestDashboard, protected: true },
  { path: '/sync-dashboard', element: SyncDashboard, protected: true },
  { path: '/performance-monitoring', element: PerformanceMonitoring, protected: true },
  { path: '/streaming-search', element: StreamingSearch, protected: false },
  { path: '/404', element: NotFound, protected: false },
  { path: '*', element: NotFound, protected: false } // Catch-all
];

// PageLoader component
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="text-center">
      <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
      <p className="text-muted-foreground">Loading...</p>
    </div>
  </div>
);

// Protected Route Component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  const location = useLocation();
  
  if (loading) {
    return <PageLoader />;
  }
  
  if (!user) {
    // Save attempted location for redirect after login
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }
  
  return <>{children}</>;
};

import { queryClient } from '@/lib/queryClient';

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
                      {routes.map(({ path, element: Component, protected: isProtected }) => (
                        <Route
                          key={path}
                          path={path}
                          element={
                            <ErrorBoundary>
                              <Suspense fallback={<PageLoader />}>
                                {isProtected ? (
                                  <ProtectedRoute>
                                    <Component />
                                  </ProtectedRoute>
                                ) : (
                                  <Component />
                                )}
                              </Suspense>
                            </ErrorBoundary>
                          }
                        />
                      ))}
                    </Routes>
                  </AuthProvider>
                </ErrorBoundary>
              </BrowserRouter>
            </TooltipProvider>
          </ErrorBoundary>
        </GraphQLProvider>
      </QueryClientProvider>
    </HelmetProvider>
  );
}

export default App;
