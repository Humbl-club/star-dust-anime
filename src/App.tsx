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
  const { isVerified, loading, showModal, setVerified } = useAgeVerification();
  
  return (
    <>
      <AgeVerificationModal 
        isOpen={showModal} 
        onComplete={setVerified}
      />
      {children}
    </>
  );
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
  
  // Render age verification modal at the very top level
  if (showModal) {
    return (
      <div className="fixed inset-0 z-[99999] bg-black flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg shadow-2xl max-w-md w-full p-6">
          <div className="flex items-center gap-2 mb-4">
            <Shield className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Age Verification Required</h2>
          </div>
          
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-6">
            This app contains anime and manga content. Please confirm you are 16 years or older to continue.
          </p>
          
          <div className="flex flex-col gap-3">
            <button 
              onClick={() => setVerified()}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg font-medium transition-colors"
            >
              I am 16 years or older
            </button>
            
            <button 
              onClick={() => window.location.href = 'https://www.google.com'}
              className="w-full border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 px-4 py-3 rounded-lg font-medium transition-colors hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              I am under 16
            </button>
          </div>

          <p className="text-xs text-gray-500 dark:text-gray-400 mt-4">
            This verification helps us comply with content rating requirements and ensures appropriate content access.
          </p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-background pb-16 lg:pb-0">
      <Routes>
        <Route path="/" element={<Index />} />
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
