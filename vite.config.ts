import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';
import { componentTagger } from "lovable-tagger";

export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    mode === 'development' && componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      // Force single React instance
      'react': path.resolve(__dirname, 'node_modules/react/index.js'),
      'react-dom': path.resolve(__dirname, 'node_modules/react-dom/index.js'),
    },
  },
  optimizeDeps: {
    include: ['react', 'react-dom'],
    exclude: [],
    esbuildOptions: {
      // Ensure React is available globally
      define: {
        global: 'globalThis',
      },
      loader: {
        '.js': 'jsx',
      },
    },
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
        manualChunks: {
          // Vendor chunks
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui-vendor': [
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-select',
            '@radix-ui/react-tabs',
            '@radix-ui/react-tooltip'
          ],
          'query-vendor': ['@tanstack/react-query', '@tanstack/react-virtual'],
          'animation-vendor': ['framer-motion', 'lottie-react'],
          'utility-vendor': ['date-fns', 'clsx', 'zod', 'sonner'],
          'auth': ['@supabase/supabase-js'],
          'charts': ['recharts'],
          'forms': ['react-hook-form', '@hookform/resolvers'],
          'media': ['react-player', 'react-image-gallery', 'howler'],
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
  },
}));