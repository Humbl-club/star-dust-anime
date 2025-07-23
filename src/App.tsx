
import React from 'react';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";  // Add this
import { Toaster } from "@/components/ui/toaster";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30 * 60 * 1000,
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});

// Temporary minimal Index
const Index = () => {
  return (
    <div className="min-h-screen bg-background p-8">
      <h1 className="text-4xl font-bold">Anithing</h1>
      <p>Home Page (without Navigation for now)</p>
    </div>
  );
};

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>  {/* Add AuthProvider here */}
          <Toaster />
          <Routes>
            <Route path="*" element={<Index />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

export default App;
