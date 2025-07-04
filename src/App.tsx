import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { useAgeVerification } from "@/hooks/useAgeVerification";
import { AgeVerificationModal } from "@/components/AgeVerificationModal";
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
import Social from "./pages/Social";
import DataSync from "./pages/DataSync";
import SyncDashboard from "./pages/SyncDashboard";
import LegalPages from "./pages/LegalPages";
import NotFound from "./pages/NotFound";
import AnimeDetail from "./pages/AnimeDetail";

const queryClient = new QueryClient();

const AutoSyncProvider = ({ children }: { children: React.ReactNode }) => {
  const { syncStatus } = useAutoSync();
  const { isVerified, loading, updatePreferences } = useAgeVerification();
  
  return (
    <>
      {syncStatus && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 max-w-md">
          <div className="bg-primary/90 text-primary-foreground px-4 py-2 rounded-lg shadow-lg backdrop-blur-sm border border-primary/20">
            <div className="flex items-center gap-2 text-sm">
              <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin"></div>
              <span>{syncStatus}</span>
            </div>
          </div>
        </div>
      )}
      
      <AgeVerificationModal 
        isOpen={!loading && !isVerified} 
        onComplete={() => {
          // Update preferences to mark as verified
          updatePreferences({ age_verified: true });
        }}
      />
      
      {children}
    </>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <AutoSyncProvider>
        <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
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
  </QueryClientProvider>
);

export default App;
