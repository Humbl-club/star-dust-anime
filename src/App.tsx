
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/hooks/useAuth";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import AnimeDetail from "./pages/AnimeDetail";
import MangaDetail from "./pages/MangaDetail";
import Settings from "./pages/Settings";
import EmailDebug from "./pages/EmailDebug";

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
                        <Index />
                      </ErrorBoundary>
                    } />
                    <Route path="/auth" element={
                      <ErrorBoundary>
                        <Auth />
                      </ErrorBoundary>
                    } />
                    <Route path="/dashboard" element={
                      <ErrorBoundary>
                        <Dashboard />
                      </ErrorBoundary>
                    } />
                    <Route path="/anime/:id" element={
                      <ErrorBoundary>
                        <AnimeDetail />
                      </ErrorBoundary>
                    } />
                    <Route path="/manga/:id" element={
                      <ErrorBoundary>
                        <MangaDetail />
                      </ErrorBoundary>
                    } />
                    <Route path="/settings" element={
                      <ErrorBoundary>
                        <Settings />
                      </ErrorBoundary>
                    } />
                    <Route path="/email-debug" element={
                      <ErrorBoundary>
                        <EmailDebug />
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
