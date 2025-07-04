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
import { HelmetProvider } from "react-helmet-async";
import useAutoSync from "@/hooks/useAutoSync";
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
import Social from "./pages/Social";
import DataSync from "./pages/DataSync";
import SyncDashboard from "./pages/SyncDashboard";
import LegalPages from "./pages/LegalPages";
import NotFound from "./pages/NotFound";
import AnimeDetail from "./pages/AnimeDetail";

const queryClient = new QueryClient();

const AutoSyncProvider = ({ children }: { children: React.ReactNode }) => {
  const { syncStatus } = useAutoSync();
  const { isVerified, loading, showModal, setVerified } = useAgeVerification();
  
  return (
    <>
      <AgeVerificationModal 
        isOpen={showModal && !isVerified} 
        onComplete={setVerified}
      />
      
      {children}
    </>
  );
};

const App = () => {
  const { isNative } = useNativeSetup();
  
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
            <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/anime" element={<Anime />} />
            <Route path="/anime/:id" element={<AnimeDetail />} />
            <Route path="/manga" element={<Manga />} />
            <Route path="/manga/:id" element={<MangaDetail />} />
            <Route path="/trending" element={<Trending />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/my-lists" element={<MyLists />} />
            <Route path="/recommendations" element={<Recommendations />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/social" element={<Social />} />
            <Route path="/data-sync" element={<DataSync />} />
            <Route path="/sync-dashboard" element={<SyncDashboard />} />
            <Route path="/legal/:pageType" element={<LegalPages />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
        </TooltipProvider>
        </AutoSyncProvider>
      </AuthProvider>
      </HelmetProvider>
    </QueryClientProvider>
  );
};

export default App;
