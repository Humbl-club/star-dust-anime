
import React from 'react';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30 * 60 * 1000,
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <div style={{ backgroundColor: 'white', padding: '20px' }}>
        <h1>✅ React Query + Router Test</h1>
        <BrowserRouter>
          <Routes>
            <Route path="*" element={
              <div>
                <h2 style={{ color: 'green' }}>All Systems Working!</h2>
                <p>Ready to add real components</p>
              </div>
            } />
          </Routes>
        </BrowserRouter>
      </div>
    </QueryClientProvider>
  );
};

export default App;
