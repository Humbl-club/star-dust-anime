
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/hooks/useAuth";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { lazy, Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import Index from "./pages/Index";
import Auth from "./pages/Auth";

// Lazy load heavy components
const Dashboard = lazy(() => import("./pages/Dashboard"));
const AnimeDetail = lazy(() => import("./pages/AnimeDetail"));
const MangaDetail = lazy(() => import("./pages/MangaDetail"));
const Settings = lazy(() => import("./pages/Settings"));
const EmailDebug = lazy(() => import("./pages/EmailDebug"));
const TestDashboard = lazy(() => import("./pages/TestDashboard"));

// Loading component
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="text-center">
      <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
      <p className="text-muted-foreground">Loading...</p>
    </div>
  </div>
);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes 
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      refetchOnWindowFocus: false,
      refetchOnReconnect: 'always',
      networkMode: 'online',
    },
    mutations: {
      retry: 1,
      onError: (error) => {
        console.error('Mutation error:', error);
      },
    },
  },
});

function App() {
  return (
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <ErrorBoundary>
          <TooltipProvider>
            <Toaster />
            <BrowserRouter>
              <ErrorBoundary>
                <AuthProvider>
                  <Routes>
                    <Route path="/" element={<ErrorBoundary><Index /></ErrorBoundary>} />
                    <Route path="/auth" element={<Auth />} />
                    <Route 
                      path="/dashboard" 
                      element={
                        <ErrorBoundary>
                          <Suspense fallback={<PageLoader />}>
                            <Dashboard />
                          </Suspense>
                        </ErrorBoundary>
                      } 
                    />
                    <Route 
                      path="/anime/:id" 
                      element={
                        <ErrorBoundary>
                          <Suspense fallback={<PageLoader />}>
                            <AnimeDetail />
                          </Suspense>
                        </ErrorBoundary>
                      } 
                    />
                    <Route 
                      path="/manga/:id" 
                      element={
                        <ErrorBoundary>
                          <Suspense fallback={<PageLoader />}>
                            <MangaDetail />
                          </Suspense>
                        </ErrorBoundary>
                      } 
                    />
                    <Route 
                      path="/settings" 
                      element={
                        <ErrorBoundary>
                          <Suspense fallback={<PageLoader />}>
                            <Settings />
                          </Suspense>
                        </ErrorBoundary>
                      } 
                    />
                    <Route 
                      path="/email-debug" 
                      element={
                        <ErrorBoundary>
                          <Suspense fallback={<PageLoader />}>
                            <EmailDebug />
                          </Suspense>
                        </ErrorBoundary>
                      } 
                    />
                    <Route 
                      path="/test-dashboard" 
                      element={
                        <ErrorBoundary>
                          <Suspense fallback={<PageLoader />}>
                            <TestDashboard />
                          </Suspense>
                        </ErrorBoundary>
                      } 
                    />
                  </Routes>
                </AuthProvider>
              </ErrorBoundary>
            </BrowserRouter>
          </TooltipProvider>
        </ErrorBoundary>
      </QueryClientProvider>
    </HelmetProvider>
  );
}

export default App;
