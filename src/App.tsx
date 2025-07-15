import { Toaster } from "@/components/ui/toaster";
import { useNativeSetup } from "@/hooks/useNativeSetup";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { useAgeVerification } from "@/hooks/useAgeVerification";
import { AgeVerificationModal } from "@/components/AgeVerificationModal";
import { DeepLinkHandler } from "@/components/DeepLinkHandler";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { InitializationWrapper } from "@/components/InitializationWrapper";
import { MobileNavigation } from "@/components/MobileNavigation";
import { EmailVerificationBanner } from "@/components/EmailVerificationBanner";
import { HelmetProvider } from "react-helmet-async";
import { Shield } from "lucide-react";

import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Anime from "./pages/Anime";
import Manga from "./pages/Manga"; 
import MangaDetail from "./pages/MangaDetail";
import Trending from "./pages/Trending";
import Dashboard from "./pages/Dashboard";
import MyLists from "./pages/MyLists";
import Recommendations from "./pages/Recommendations";
import Analytics from "./pages/Analytics";
import Gamification from "./pages/Gamification";
import Settings from "./pages/Settings";


import SyncDashboard from "./pages/SyncDashboard";
import LegalPages from "./pages/LegalPages";
import NotFound from "./pages/NotFound";
import AnimeDetail from "./pages/AnimeDetail";

const queryClient = new QueryClient();

const AutoSyncProvider = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>;
};

const AppContent = () => {
  const { isReady } = useNativeSetup();
  const { isVerified, loading, showModal, setVerified } = useAgeVerification();

  if (!isReady) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  return (
    <>
      {/* Single age verification modal */}
      <AgeVerificationModal 
        isOpen={showModal} 
        onComplete={setVerified}
      />
      
      <div className="min-h-screen bg-background pb-16 lg:pb-0">
      <EmailVerificationBanner />
      <Routes>
        <Route path="/" element={
          <InitializationWrapper>
            <Index />
          </InitializationWrapper>
        } />
        <Route path="/auth" element={<Auth />} />
        <Route path="/anime" element={<Anime />} />
        <Route path="/anime/:id" element={<AnimeDetail />} />
        <Route path="/manga" element={<Manga />} />
        <Route path="/manga/:id" element={<MangaDetail />} />
        <Route path="/trending" element={<Trending />} />
        
        {/* Protected Routes - Require Authentication */}
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <InitializationWrapper>
              <Dashboard />
            </InitializationWrapper>
          </ProtectedRoute>
        } />
        <Route path="/my-lists" element={
          <ProtectedRoute>
            <InitializationWrapper>
              <MyLists />
            </InitializationWrapper>
          </ProtectedRoute>
        } />            
        <Route path="/recommendations" element={
          <ProtectedRoute>
            <InitializationWrapper>
              <Recommendations />
            </InitializationWrapper>
          </ProtectedRoute>
        } />
        <Route path="/analytics" element={
          <ProtectedRoute>
            <InitializationWrapper>
              <Analytics />
            </InitializationWrapper>
          </ProtectedRoute>
        } />
        <Route path="/gamification" element={
          <ProtectedRoute>
            <InitializationWrapper>
              <Gamification />
            </InitializationWrapper>
          </ProtectedRoute>
        } />
        <Route path="/settings" element={
          <ProtectedRoute>
            <InitializationWrapper>
              <Settings />
            </InitializationWrapper>
          </ProtectedRoute>
        } />
        
        {/* Admin Routes - Make sync dashboard admin only */}
        <Route path="/sync-dashboard" element={
          <ProtectedRoute>
            <InitializationWrapper>
              <SyncDashboard />
            </InitializationWrapper>
          </ProtectedRoute>
        } />
        <Route path="/legal/:pageType" element={<LegalPages />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      <MobileNavigation />
      </div>
    </>
  );
};

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <HelmetProvider>
        <AuthProvider>
          <AutoSyncProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <BrowserRouter>
                <DeepLinkHandler />
                <AppContent />
              </BrowserRouter>
            </TooltipProvider>
          </AutoSyncProvider>
        </AuthProvider>
      </HelmetProvider>
    </QueryClientProvider>
  );
};

export default App;
