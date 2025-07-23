
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';
import { componentTagger } from "lovable-tagger";

// Force rebuild by adding this comment - bypassing Vite optimizations completely
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
    plugins: [
      react(),
      mode === 'development' && componentTagger(),
    ].filter(Boolean),
    
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        // Force specific React resolution
        'react$': path.resolve(__dirname, 'node_modules/react/index.js'),
        'react-dom$': path.resolve(__dirname, 'node_modules/react-dom/index.js'),
      },
    },
    
    optimizeDeps: env.VITE_OPTIMIZE_DEPS === 'false' ? undefined : {
      // If optimization is enabled, configure it properly
      entries: ['./src/main.tsx'],
      include: [
        'react',
        'react-dom',
        'react/jsx-runtime',
        'react/jsx-dev-runtime'
      ],
      exclude: [
        // Exclude all packages that depend on React
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
        '@hookform/resolvers',
        'react-hook-form',
        'framer-motion',
        '@supabase/auth-ui-react',
        '@supabase/supabase-js',
        '@supabase/postgrest-js',
        '@supabase/storage-js',
        '@supabase/realtime-js',
        '@supabase/gotrue-js'
      ],
      force: true,
    },
    
    esbuild: {
      jsx: 'automatic',
      jsxFactory: 'React.createElement',
      jsxFragment: 'React.Fragment',
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
            if (id.includes('node_modules/recharts')) {
              return 'charts';
            }
            if (id.includes('node_modules/react-hook-form') || id.includes('node_modules/@hookform/')) {
              return 'forms';
            }
            if (id.includes('node_modules/react-player') || id.includes('node_modules/react-image-gallery') || id.includes('node_modules/howler')) {
              return 'media';
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
      fs: {
        strict: false,
      },
      // Force full reload on changes
      watch: {
        usePolling: true,
      },
    },
  };
});
