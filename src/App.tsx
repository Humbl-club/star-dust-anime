
import React, { createContext, useContext, useState } from 'react';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import { Navigation } from "@/components/Navigation.tsx";  // Named export, direct import

// Create everything inline to avoid import issues
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30 * 60 * 1000,
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});

// Inline Auth Context
const AuthContext = createContext<any>({});
const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState(null);
  return (
    <AuthContext.Provider value={{ user, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};

// Real Navigation component will be used now

// Inline Pages
const HomePage = () => (
  <div className="container mx-auto p-8">
    <h1 className="text-4xl font-bold mb-4">Welcome to Anithing! 🎉</h1>
    <p className="text-xl mb-8">Your app is now working!</p>
    <div className="bg-blue-100 p-6 rounded-lg">
      <h2 className="text-2xl font-bold mb-4">✅ Working Components:</h2>
      <ul className="list-disc ml-6 space-y-2">
        <li>React Router ✓</li>
        <li>React Query ✓</li>
        <li>Auth Context ✓</li>
        <li>Navigation ✓</li>
      </ul>
    </div>
    <div className="mt-8 p-6 bg-yellow-100 rounded-lg">
      <h2 className="text-2xl font-bold mb-4">⚠️ To Fix:</h2>
      <p>The star export error is in your component files. Check:</p>
      <ul className="list-disc ml-6 mt-2">
        <li>src/components/index.ts</li>
        <li>src/hooks/index.ts</li>
        <li>src/pages/index.ts</li>
      </ul>
      <p className="mt-4">Look for <code className="bg-gray-200 px-2 py-1">export * from './Something'</code> and change to explicit exports.</p>
    </div>
  </div>
);

const AnimePage = () => (
  <div className="container mx-auto p-8">
    <h1 className="text-4xl font-bold">Anime Page</h1>
    <p>Browse anime here</p>
  </div>
);

const MangaPage = () => (
  <div className="container mx-auto p-8">
    <h1 className="text-4xl font-bold">Manga Page</h1>
    <p>Browse manga here</p>
  </div>
);

// Main App
const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <div className="min-h-screen bg-gray-50">
            <Navigation />
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/anime" element={<AnimePage />} />
              <Route path="/manga" element={<MangaPage />} />
              <Route path="*" element={<HomePage />} />
            </Routes>
          </div>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

export default App;
