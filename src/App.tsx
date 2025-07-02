import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { AppLayout } from "@/components/AppLayout";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Anime from "./pages/Anime";
import Manga from "./pages/Manga"; 
import Trending from "./pages/Trending";
import Dashboard from "./pages/Dashboard";
import MyLists from "./pages/MyLists";
import Recommendations from "./pages/Recommendations";
import Social from "./pages/Social";
import DataSync from "./pages/DataSync";
import NotFound from "./pages/NotFound";
import AnimeDetail from "./pages/AnimeDetail";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Auth route without layout */}
            <Route path="/auth" element={<Auth />} />
            
            {/* All other routes with sidebar layout */}
            <Route path="/" element={<AppLayout />}>
              <Route index element={<Index />} />
              <Route path="anime" element={<Anime />} />
              <Route path="anime/:id" element={<AnimeDetail />} />
              <Route path="manga" element={<Manga />} />
              <Route path="trending" element={<Trending />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="my-lists" element={<MyLists />} />
              <Route path="recommendations" element={<Recommendations />} />
              <Route path="social" element={<Social />} />
              <Route path="data-sync" element={<DataSync />} />
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
