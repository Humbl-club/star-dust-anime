import React from 'react';
import ReactDOM from 'react-dom/client';

// Ensure React is available globally
if (typeof window !== 'undefined') {
  (window as any).React = React;
  (window as any).ReactDOM = ReactDOM;
}

export { React, ReactDOM };