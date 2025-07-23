import React from 'react';
import { Navigation } from "@/components/Navigation";  // Add this first

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />  {/* Add component */}
      <h1 className="text-4xl font-bold p-8">Index with Navigation</h1>
    </div>
  );
};

export default Index;
