// This ensures React is loaded and available before any other modules
declare global {
  interface Window {
    __REACT_SHARED__: typeof import('react');
    __REACT_DOM_SHARED__: typeof import('react-dom');
  }
}

// Synchronously load React to ensure it's available
import * as React from 'react';
import * as ReactDOM from 'react-dom';

// Store references globally
window.__REACT_SHARED__ = React;
window.__REACT_DOM_SHARED__ = ReactDOM;

// Patch module system to use shared React
const originalRequire = (window as any).require;
if (originalRequire) {
  (window as any).require = function(id: string) {
    if (id === 'react') return window.__REACT_SHARED__;
    if (id === 'react-dom') return window.__REACT_DOM_SHARED__;
    return originalRequire.apply(this, arguments);
  };
}

export { React, ReactDOM };