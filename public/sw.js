// Service Worker for offline support and caching
const CACHE_NAME = 'animehub-v1.0.0';
const STATIC_CACHE = 'animehub-static-v1.0.0';
const API_CACHE = 'animehub-api-v1.0.0';

// Resources to cache on install
const STATIC_RESOURCES = [
  '/',
  '/src/main.tsx',
  '/src/index.css',
  'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap',
  'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfMZ1k.woff2'
];

// API endpoints to cache
const API_PATTERNS = [
  /^https:\/\/axtpbgsjbmhbuqomarcr\.supabase\.co\/rest\/v1\/titles/,
  /^https:\/\/axtpbgsjbmhbuqomarcr\.supabase\.co\/rest\/v1\/anime_details/,
  /^https:\/\/axtpbgsjbmhbuqomarcr\.supabase\.co\/rest\/v1\/manga_details/,
  /^https:\/\/axtpbgsjbmhbuqomarcr\.supabase\.co\/rest\/v1\/genres/,
  /^https:\/\/axtpbgsjbmhbuqomarcr\.supabase\.co\/rest\/v1\/studios/,
  /^https:\/\/axtpbgsjbmhbuqomarcr\.supabase\.co\/rest\/v1\/authors/
];

// Install event - cache static resources
self.addEventListener('install', event => {
  console.log('[SW] Installing service worker');
  
  event.waitUntil(
    Promise.all([
      caches.open(STATIC_CACHE).then(cache => {
        return cache.addAll(STATIC_RESOURCES);
      }),
      caches.open(API_CACHE).then(cache => {
        // Pre-cache some essential API calls
        return Promise.resolve();
      })
    ]).then(() => {
      console.log('[SW] Installation complete');
      return self.skipWaiting();
    })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  console.log('[SW] Activating service worker');
  
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== STATIC_CACHE && cacheName !== API_CACHE) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('[SW] Activation complete');
      return self.clients.claim();
    })
  );
});

// Fetch event - implement caching strategies
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Handle API requests with stale-while-revalidate
  if (API_PATTERNS.some(pattern => pattern.test(request.url))) {
    event.respondWith(staleWhileRevalidate(request, API_CACHE));
    return;
  }

  // Handle static resources with cache-first
  if (STATIC_RESOURCES.some(resource => request.url.includes(resource)) ||
      request.destination === 'script' ||
      request.destination === 'style' ||
      request.destination === 'font') {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }

  // Handle images with cache-first
  if (request.destination === 'image') {
    event.respondWith(cacheFirst(request, STATIC_CACHE, { maxAge: 86400000 })); // 1 day
    return;
  }

  // Handle navigation requests with network-first
  if (request.mode === 'navigate') {
    event.respondWith(networkFirst(request, STATIC_CACHE));
    return;
  }
});

// Cache-first strategy
async function cacheFirst(request, cacheName, options = {}) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  
  if (cached) {
    // Check if cache is still valid
    const cacheTime = parseInt(cached.headers.get('sw-cache-time') || '0');
    const maxAge = options.maxAge || 3600000; // 1 hour default
    
    if (Date.now() - cacheTime < maxAge) {
      return cached;
    }
  }

  try {
    const response = await fetch(request);
    if (response.ok) {
      // Clone and add cache timestamp
      const responseToCache = response.clone();
      const headers = new Headers(responseToCache.headers);
      headers.set('sw-cache-time', Date.now().toString());
      
      const modifiedResponse = new Response(responseToCache.body, {
        status: responseToCache.status,
        statusText: responseToCache.statusText,
        headers
      });
      
      cache.put(request, modifiedResponse);
    }
    return response;
  } catch (error) {
    console.log('[SW] Network failed, serving from cache:', request.url);
    return cached || new Response('Offline', { status: 503 });
  }
}

// Network-first strategy
async function networkFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  
  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    console.log('[SW] Network failed, serving from cache:', request.url);
    const cached = await cache.match(request);
    return cached || new Response('Offline', { 
      status: 503,
      headers: { 'Content-Type': 'text/html' }
    });
  }
}

// Stale-while-revalidate strategy
async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  
  // Always try to fetch and update cache in background
  const fetchPromise = fetch(request).then(response => {
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  }).catch(error => {
    console.log('[SW] Background fetch failed:', error);
  });

  // Return cached version immediately if available, otherwise wait for network
  return cached || fetchPromise;
}

// Background sync for failed requests
self.addEventListener('sync', event => {
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync());
  }
});

async function doBackgroundSync() {
  // Handle any queued requests when back online
  console.log('[SW] Background sync triggered');
}

// Push notifications (for future use)
self.addEventListener('push', event => {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body,
      icon: '/icon-192x192.png',
      badge: '/badge-72x72.png',
      vibrate: [100, 50, 100],
      data: data.data
    };
    
    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
  }
});

// Handle notification clicks
self.addEventListener('notificationclick', event => {
  event.notification.close();
  
  event.waitUntil(
    self.clients.openWindow(event.notification.data.url || '/')
  );
});