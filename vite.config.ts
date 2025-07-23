import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { componentTagger } from "lovable-tagger";

export default defineConfig(({ mode }) => ({
  plugins: [
    react({
      babel: {
        plugins: ['@babel/plugin-transform-react-jsx']
      }
    }),
    mode === 'development' && componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react/jsx-runtime',
      '@tanstack/react-query',
      'zustand',
      'react-router-dom'
    ],
    exclude: ['@supabase/supabase-js'],
    esbuildOptions: {
      target: 'es2020',
    },
  },
  build: {
    target: 'es2020',
    sourcemap: true,
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
          // Feature chunks
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
