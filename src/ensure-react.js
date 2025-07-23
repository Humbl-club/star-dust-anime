// ensure-react.js - Plain JS to avoid any compilation issues
if (typeof window !== 'undefined' && !window.React) {
  console.error('React not found, attempting to load...');
  import('react').then(module => {
    window.React = module.default || module;
    console.log('React loaded:', !!window.React);
  });
}