// Emergency React fix - ensures React is available globally
import React from 'react';
import ReactDOM from 'react-dom/client';

// Make React available globally for problematic dependencies
if (typeof window !== 'undefined') {
  (window as any).React = React;
  (window as any).ReactDOM = ReactDOM;
  
  // Patch for libraries that expect React in different ways
  if (!(globalThis as any).React) {
    (globalThis as any).React = React;
  }
}

// Debug logging in development
if (process.env.NODE_ENV === 'development') {
  console.log('🔧 React Fix Applied - React available:', !!React);
  console.log('React version:', React.version);
  console.log('useState available:', !!React.useState);
  console.log('Window React:', !!(window as any).React);
}

// Do not re-export React to avoid module resolution conflicts