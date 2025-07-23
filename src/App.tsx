
import React from 'react';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";  // ADD THIS
import { Navigation } from "@/components/Navigation";  // TEST THIS IMPORT

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30 * 60 * 1000,
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});

const TempIndex = () => (
  <div>
    <h1>Home Page + Navigation Test</h1>
    <p>Testing Navigation import specifically</p>
  </div>
);

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Toaster />  {/* ADD THIS */}
        <Routes>
          <Route path="*" element={<TempIndex />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

export default App;
