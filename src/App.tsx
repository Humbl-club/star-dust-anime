
import React from 'react';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { ErrorBoundary } from "@/components/ErrorBoundary";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30 * 60 * 1000,
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});

// Inline components to avoid import issues
const TempIndex = () => <div><h1>Home Page</h1></div>;
const TempAuth = () => <div><h1>Auth Page</h1></div>;

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <ErrorBoundary>
        <BrowserRouter>
          <Toaster />
          <Routes>
            <Route path="/" element={<TempIndex />} />
            <Route path="/auth" element={<TempAuth />} />
            <Route path="*" element={<TempIndex />} />
          </Routes>
        </BrowserRouter>
      </ErrorBoundary>
    </QueryClientProvider>
  );
};

export default App;
