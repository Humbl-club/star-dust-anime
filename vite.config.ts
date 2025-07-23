import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';
import { componentTagger } from "lovable-tagger";
import { reactSingleton } from './vite-plugin-react-singleton';

export default defineConfig(({ mode }) => ({
  plugins: [
    reactSingleton(), // Must be first
    react(),
    mode === 'development' && componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  optimizeDeps: {
    // Exclude packages that depend on React from pre-bundling
    exclude: [
      '@tanstack/react-query',
      '@tanstack/react-query-devtools',
      '@tanstack/react-query-persist-client',
      '@radix-ui/react-tooltip',
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-select',
      '@radix-ui/react-tabs',
      '@radix-ui/react-avatar',
      '@radix-ui/react-popover',
      '@radix-ui/react-scroll-area',
      'zustand',
      'react-router-dom',
      'framer-motion',
      '@supabase/supabase-js',
      '@supabase/postgrest-js',
      '@supabase/storage-js',
      '@supabase/realtime-js',
      '@supabase/gotrue-js'
    ],
    // Force include React first
    include: ['react', 'react-dom', 'react/jsx-runtime'],
    force: true,
  },
  esbuild: {
    jsx: 'automatic',
    jsxDev: mode === 'development',
  },
  build: {
    target: 'es2020',
    sourcemap: true,
    commonjsOptions: {
      transformMixedEsModules: true,
      include: [/node_modules/],
    },
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Ensure React is in its own chunk
          if (id.includes('node_modules/react/')) {
            return 'react-vendor';
          }
          if (id.includes('node_modules/react-dom/')) {
            return 'react-dom-vendor';
          }
          // Vendor chunks
          if (id.includes('node_modules/@radix-ui/')) {
            return 'ui-vendor';
          }
          if (id.includes('node_modules/@tanstack/')) {
            return 'query-vendor';
          }
          if (id.includes('node_modules/framer-motion') || id.includes('node_modules/lottie-react')) {
            return 'animation-vendor';
          }
          if (id.includes('node_modules/@supabase/')) {
            return 'auth';
          }
        }
      }
    },
    chunkSizeWarningLimit: 1000,
  },
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
    // Force full reload on changes
    watch: {
      usePolling: true,
    },
  },
}));