import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from 'vite-plugin-pwa';
import { visualizer } from 'rollup-plugin-visualizer';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
    VitePWA({
      registerType: 'autoUpdate',
      devOptions: {
        enabled: true
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        // Increase cache limit and exclude large files
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024, // 5MB
        globIgnores: ['**/stats.html', '**/node_modules/**/*'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/axtpbgsjbmhbuqomarcr\.supabase\.co\/functions\/v1\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 // 24 hours
              }
            }
          },
          {
            urlPattern: /^https:\/\/axtpbgsjbmhbuqomarcr\.supabase\.co\/rest\/v1\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'supabase-api',
              expiration: {
                maxEntries: 200,
                maxAgeSeconds: 60 * 60 * 2 // 2 hours
              }
            }
          },
          {
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'images',
              expiration: {
                maxEntries: 500,
                maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
              }
            }
          },
          {
            urlPattern: /\.(?:js|css|woff2)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'static-resources',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 7 // 7 days
              }
            }
          }
        ],
        skipWaiting: true,
        clientsClaim: true,
        cleanupOutdatedCaches: true
      },
      includeAssets: ['favicon.ico', 'icon-192.png', 'icon-512.png', 'maskable-icon-192.png', 'maskable-icon-512.png'],
      manifest: {
        name: 'AniThing - Ultimate Anime & Manga Tracker',
        short_name: 'AniThing',
        description: 'The ultimate anime and manga tracking platform with offline support',
        theme_color: '#8b5cf6',
        background_color: '#0a0a0a',
        display: 'standalone',
        orientation: 'portrait-primary',
        scope: '/',
        start_url: '/?source=pwa',
        categories: ['entertainment', 'lifestyle'],
        screenshots: [
          {
            src: '/screenshot-wide.png',
            sizes: '1280x720',
            type: 'image/png',
            form_factor: 'wide'
          },
          {
            src: '/screenshot-narrow.png',
            sizes: '640x1136',
            type: 'image/png',
            form_factor: 'narrow'
          }
        ],
        icons: [
          {
            src: '/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/maskable-icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'maskable'
          },
          {
            src: '/maskable-icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          }
        ]
      }
    }),
    // Only generate stats in development
    mode === 'development' && visualizer({
      open: false,
      filename: 'dist/stats.html',
    }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Vendor chunks
          if (id.includes('node_modules')) {
            // React ecosystem
            if (id.includes('react') && !id.includes('query')) {
              return 'react-vendor';
            }
            // UI libraries
            if (id.includes('@radix-ui') || id.includes('lucide-react') || id.includes('cmdk')) {
              return 'ui-vendor';
            }
            // Query libraries  
            if (id.includes('@tanstack/react-query') || id.includes('query')) {
              return 'query-vendor';
            }
            // Supabase
            if (id.includes('@supabase') || id.includes('supabase')) {
              return 'supabase-vendor';
            }
            // Animation
            if (id.includes('framer-motion') || id.includes('lottie')) {
              return 'animation-vendor';
            }
            // Date utilities
            if (id.includes('date-fns')) {
              return 'date-vendor';
            }
            // Chart libraries
            if (id.includes('recharts') || id.includes('chart')) {
              return 'chart-vendor';
            }
            // Apollo/GraphQL
            if (id.includes('@apollo') || id.includes('graphql')) {
              return 'graphql-vendor';
            }
            // Large utility libraries
            if (id.includes('lodash') || id.includes('fuse.js') || id.includes('validator')) {
              return 'utils-vendor';
            }
            // Everything else goes to vendor
            return 'vendor';
          }
          
          // Page chunks
          if (id.includes('/pages/')) {
            if (id.includes('admin/')) return 'admin-pages';
            return 'pages';
          }
          
          // Feature components
          if (id.includes('/components/features/')) {
            return 'feature-components';
          }
          
          // UI components
          if (id.includes('/components/ui/')) {
            return 'ui-components';
          }
          
          // Other components
          if (id.includes('/components/')) {
            return 'components';
          }
          
          // Hooks
          if (id.includes('/hooks/')) {
            return 'hooks';
          }
          
          // Services
          if (id.includes('/services/')) {
            return 'services';
          }
        },
      },
    },
    chunkSizeWarningLimit: 2000, // Increase limit to 2MB
    sourcemap: false,
  },
}));
