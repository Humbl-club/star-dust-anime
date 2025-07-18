
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/hooks/useAuth";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { Suspense, lazy } from "react";
import { FullPageLoadingFallback } from "@/components/LoadingFallback";

// Code splitting: Lazy load all route components
const Index = lazy(() => import("./pages/Index"));
const Auth = lazy(() => import("./pages/Auth"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const AnimeDetail = lazy(() => import("./pages/AnimeDetail"));
const MangaDetail = lazy(() => import("./pages/MangaDetail"));
const Settings = lazy(() => import("./pages/Settings"));
const EmailDebug = lazy(() => import("./pages/EmailDebug"));
const Trending = lazy(() => import("./pages/Trending"));
const Anime = lazy(() => import("./pages/Anime"));
const Manga = lazy(() => import("./pages/Manga"));

const queryClient = new QueryClient();

function App() {
  return (
    <ErrorBoundary>
      <HelmetProvider>
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            <Toaster />
            <SonnerToaster />
            <BrowserRouter>
              <ErrorBoundary>
                <AuthProvider>
                  <Routes>
                    <Route path="/" element={
                      <ErrorBoundary>
                        <Suspense fallback={<FullPageLoadingFallback message="Loading homepage..." />}>
                          <Index />
                        </Suspense>
                      </ErrorBoundary>
                    } />
                    <Route path="/trending" element={
                      <ErrorBoundary>
                        <Suspense fallback={<FullPageLoadingFallback message="Loading trending..." />}>
                          <Trending />
                        </Suspense>
                      </ErrorBoundary>
                    } />
                    <Route path="/anime" element={
                      <ErrorBoundary>
                        <Suspense fallback={<FullPageLoadingFallback message="Loading anime..." />}>
                          <Anime />
                        </Suspense>
                      </ErrorBoundary>
                    } />
                    <Route path="/manga" element={
                      <ErrorBoundary>
                        <Suspense fallback={<FullPageLoadingFallback message="Loading manga..." />}>
                          <Manga />
                        </Suspense>
                      </ErrorBoundary>
                    } />
                    <Route path="/auth" element={
                      <ErrorBoundary>
                        <Suspense fallback={<FullPageLoadingFallback message="Loading authentication..." />}>
                          <Auth />
                        </Suspense>
                      </ErrorBoundary>
                    } />
                    <Route path="/dashboard" element={
                      <ErrorBoundary>
                        <Suspense fallback={<FullPageLoadingFallback message="Loading dashboard..." />}>
                          <Dashboard />
                        </Suspense>
                      </ErrorBoundary>
                    } />
                    <Route path="/anime/:id" element={
                      <ErrorBoundary>
                        <Suspense fallback={<FullPageLoadingFallback message="Loading anime details..." />}>
                          <AnimeDetail />
                        </Suspense>
                      </ErrorBoundary>
                    } />
                    <Route path="/manga/:id" element={
                      <ErrorBoundary>
                        <Suspense fallback={<FullPageLoadingFallback message="Loading manga details..." />}>
                          <MangaDetail />
                        </Suspense>
                      </ErrorBoundary>
                    } />
                    <Route path="/settings" element={
                      <ErrorBoundary>
                        <Suspense fallback={<FullPageLoadingFallback message="Loading settings..." />}>
                          <Settings />
                        </Suspense>
                      </ErrorBoundary>
                    } />
                    <Route path="/email-debug" element={
                      <ErrorBoundary>
                        <Suspense fallback={<FullPageLoadingFallback message="Loading debug tools..." />}>
                          <EmailDebug />
                        </Suspense>
                      </ErrorBoundary>
                    } />
                  </Routes>
                </AuthProvider>
              </ErrorBoundary>
            </BrowserRouter>
          </TooltipProvider>
        </QueryClientProvider>
      </HelmetProvider>
    </ErrorBoundary>
  );
}

export default App;
