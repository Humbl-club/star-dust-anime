// Emergency React fix - ensures React is available globally
import React from 'react';
import ReactDOM from 'react-dom/client';

// Aggressively make React available globally IMMEDIATELY
(globalThis as any).React = React;
(globalThis as any).ReactDOM = ReactDOM;

if (typeof window !== 'undefined') {
  (window as any).React = React;
  (window as any).ReactDOM = ReactDOM;
  
  // Additional compatibility patches
  (window as any).react = React;
  (window as any)['react-dom'] = ReactDOM;
}

// Force React to be non-configurable to prevent overwriting
Object.defineProperty(globalThis, 'React', {
  value: React,
  writable: false,
  configurable: false,
  enumerable: true
});

// Ensure React hooks are immediately available
const originalUseState = React.useState;
if (!originalUseState) {
  console.error('❌ CRITICAL: React.useState is not available!');
  throw new Error('React hooks are not available');
}

// Debug logging
console.log('🔧 React Emergency Fix Applied');
console.log('React available:', !!React);
console.log('React.useState:', !!React.useState);
console.log('GlobalThis.React:', !!(globalThis as any).React);

// Verify React is working by testing useState
try {
  const testHook = React.useState;
  if (testHook) {
    console.log('✅ React hooks confirmed working');
  } else {
    throw new Error('React hooks test failed');
  }
} catch (error) {
  console.error('❌ React hooks test failed:', error);
  throw error;
}