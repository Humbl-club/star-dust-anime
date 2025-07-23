
// Force all Radix UI to use window React
if (typeof window !== 'undefined') {
  const originalRequire = (window as any).require;
  const originalImport = (window as any).__vite_import__;
  
  // Intercept any Radix UI imports
  if (originalImport) {
    (window as any).__vite_import__ = function(path: string) {
      if (path.includes('@radix-ui') && (window as any).React) {
        // Return a module that uses window.React
        return Promise.resolve({
          ...(window as any).React,
          default: (window as any).React
        });
      }
      return originalImport.apply(this, arguments);
    };
  }
}
