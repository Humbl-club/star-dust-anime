import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
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
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/anime" element={<Anime />} />
            <Route path="/anime/:id" element={<AnimeDetail />} />
            <Route path="/manga" element={<Manga />} />
            <Route path="/trending" element={<Trending />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/my-lists" element={<MyLists />} />
            <Route path="/recommendations" element={<Recommendations />} />
            <Route path="/social" element={<Social />} />
            <Route path="/data-sync" element={<DataSync />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
