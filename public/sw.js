// Enhanced service worker for comprehensive caching
const CACHE_NAME = 'anithing-cache-v1';
const API_CACHE_NAME = 'anithing-api-cache-v1';
const IMAGE_CACHE_NAME = 'anithing-images-v1';

// Cache strategies
const CACHE_STRATEGIES = {
  CACHE_FIRST: 'cache-first',
  NETWORK_FIRST: 'network-first',
  STALE_WHILE_REVALIDATE: 'stale-while-revalidate',
  NETWORK_ONLY: 'network-only',
  CACHE_ONLY: 'cache-only'
};

// Resources to cache immediately
const STATIC_RESOURCES = [
  '/',
  '/anime',
  '/manga',
  '/manifest.json',
  '/offline.html'
];

// API endpoints with cache strategies
const API_CACHE_CONFIG = {
  '/rest/v1/titles': {
    strategy: CACHE_STRATEGIES.STALE_WHILE_REVALIDATE,
    maxAge: 30 * 60 * 1000, // 30 minutes
  },
  '/rest/v1/list_statuses': {
    strategy: CACHE_STRATEGIES.CACHE_FIRST,
    maxAge: 60 * 60 * 1000, // 1 hour (rarely changes)
  },
  '/rest/v1/genres': {
    strategy: CACHE_STRATEGIES.CACHE_FIRST,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
  },
  '/functions/v1/cached-content': {
    strategy: CACHE_STRATEGIES.STALE_WHILE_REVALIDATE,
    maxAge: 10 * 60 * 1000, // 10 minutes
  }
};

self.addEventListener('install', (event) => {
  console.log('🔧 Service Worker installing...');
  
  event.waitUntil(
    Promise.all([
      // Cache static resources
      caches.open(CACHE_NAME).then(cache => {
        console.log('📦 Caching static resources');
        return cache.addAll(STATIC_RESOURCES);
      }),
      
      // Initialize API cache
      caches.open(API_CACHE_NAME),
      
      // Initialize image cache
      caches.open(IMAGE_CACHE_NAME)
    ]).then(() => {
      console.log('✅ Service Worker installation complete');
      self.skipWaiting();
    })
  );
});

self.addEventListener('activate', (event) => {
  console.log('🚀 Service Worker activating...');
  
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== CACHE_NAME && 
                cacheName !== API_CACHE_NAME && 
                cacheName !== IMAGE_CACHE_NAME) {
              console.log('🗑️ Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      
      // Take control of all pages
      self.clients.claim()
    ]).then(() => {
      console.log('✅ Service Worker activation complete');
    })
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') return;
  
  // Handle different types of requests
  if (url.pathname.includes('/rest/v1/') || url.pathname.includes('/functions/v1/')) {
    // API requests
    event.respondWith(handleApiRequest(request));
  } else if (isImageRequest(request)) {
    // Image requests
    event.respondWith(handleImageRequest(request));
  } else if (isNavigationRequest(request)) {
    // Navigation requests
    event.respondWith(handleNavigationRequest(request));
  } else {
    // Static resources
    event.respondWith(handleStaticRequest(request));
  }
});

async function handleApiRequest(request) {
  const url = new URL(request.url);
  const pathname = url.pathname;
  
  // Find matching cache config
  let cacheConfig = null;
  for (const [pattern, config] of Object.entries(API_CACHE_CONFIG)) {
    if (pathname.includes(pattern)) {
      cacheConfig = config;
      break;
    }
  }
  
  if (!cacheConfig) {
    // No cache config, go to network
    return fetch(request);
  }
  
  const cache = await caches.open(API_CACHE_NAME);
  
  switch (cacheConfig.strategy) {
    case CACHE_STRATEGIES.CACHE_FIRST:
      return cacheFirstStrategy(request, cache, cacheConfig.maxAge);
      
    case CACHE_STRATEGIES.NETWORK_FIRST:
      return networkFirstStrategy(request, cache, cacheConfig.maxAge);
      
    case CACHE_STRATEGIES.STALE_WHILE_REVALIDATE:
      return staleWhileRevalidateStrategy(request, cache, cacheConfig.maxAge);
      
    default:
      return fetch(request);
  }
}

async function handleImageRequest(request) {
  const cache = await caches.open(IMAGE_CACHE_NAME);
  
  // Try cache first for images
  const cachedResponse = await cache.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const response = await fetch(request);
    if (response.ok) {
      // Cache successful image responses
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    // Return placeholder image on network failure
    return new Response(
      '<svg width="300" height="400" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="#f0f0f0"/><text x="50%" y="50%" text-anchor="middle" fill="#666">Image unavailable</text></svg>',
      { headers: { 'Content-Type': 'image/svg+xml' } }
    );
  }
}

async function handleNavigationRequest(request) {
  const cache = await caches.open(CACHE_NAME);
  
  try {
    // Try network first for navigation
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    // Fall back to cache
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Last resort: offline page
    return cache.match('/offline.html') || new Response('Offline', { status: 503 });
  }
}

async function handleStaticRequest(request) {
  const cache = await caches.open(CACHE_NAME);
  
  // Cache first for static resources
  const cachedResponse = await cache.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    return new Response('Resource unavailable', { status: 503 });
  }
}

// Cache strategies implementation
async function cacheFirstStrategy(request, cache, maxAge) {
  const cachedResponse = await cache.match(request);
  
  if (cachedResponse) {
    const cacheDate = new Date(cachedResponse.headers.get('date') || 0);
    const isExpired = (Date.now() - cacheDate.getTime()) > maxAge;
    
    if (!isExpired) {
      return cachedResponse;
    }
  }
  
  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    return cachedResponse || new Response('Service unavailable', { status: 503 });
  }
}

async function networkFirstStrategy(request, cache, maxAge) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      const cacheDate = new Date(cachedResponse.headers.get('date') || 0);
      const isExpired = (Date.now() - cacheDate.getTime()) > maxAge;
      
      if (!isExpired) {
        return cachedResponse;
      }
    }
    
    throw error;
  }
}

async function staleWhileRevalidateStrategy(request, cache, maxAge) {
  const cachedResponse = await cache.match(request);
  
  // Always try to fetch fresh data in background
  const fetchPromise = fetch(request).then(response => {
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  }).catch(() => null);
  
  // Return cached response immediately if available
  if (cachedResponse) {
    const cacheDate = new Date(cachedResponse.headers.get('date') || 0);
    const isExpired = (Date.now() - cacheDate.getTime()) > maxAge;
    
    if (!isExpired) {
      // Trigger background update but return cached version
      fetchPromise.catch(() => {}); // Ignore errors in background
      return cachedResponse;
    }
  }
  
  // Wait for network response if no valid cache
  return fetchPromise || cachedResponse || new Response('Service unavailable', { status: 503 });
}

// Helper functions
function isImageRequest(request) {
  return request.destination === 'image' || 
         /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(new URL(request.url).pathname);
}

function isNavigationRequest(request) {
  return request.mode === 'navigate';
}

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync());
  }
});

async function doBackgroundSync() {
  console.log('🔄 Performing background sync...');
  
  try {
    // Sync any pending offline actions
    const pendingActions = await getFromIndexedDB('pendingActions') || [];
    
    for (const action of pendingActions) {
      try {
        await fetch(action.url, {
          method: action.method,
          headers: action.headers,
          body: action.body
        });
        
        // Remove successful action
        await removeFromIndexedDB('pendingActions', action.id);
      } catch (error) {
        console.error('Failed to sync action:', action, error);
      }
    }
    
    console.log('✅ Background sync completed');
  } catch (error) {
    console.error('❌ Background sync failed:', error);
  }
}

// IndexedDB helpers for offline storage
async function getFromIndexedDB(storeName) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('AntithingDB', 1);
    
    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const getRequest = store.getAll();
      
      getRequest.onsuccess = () => resolve(getRequest.result);
      getRequest.onerror = () => reject(getRequest.error);
    };
    
    request.onerror = () => reject(request.error);
  });
}

async function removeFromIndexedDB(storeName, id) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('AntithingDB', 1);
    
    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const deleteRequest = store.delete(id);
      
      deleteRequest.onsuccess = () => resolve();
      deleteRequest.onerror = () => reject(deleteRequest.error);
    };
    
    request.onerror = () => reject(request.error);
  });
}