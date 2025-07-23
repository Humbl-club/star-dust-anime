const CACHE_NAME = 'anithing-v1';
const DYNAMIC_CACHE = 'anithing-dynamic-v1';

// Assets to cache on install
const STATIC_ASSETS = [
  '/',
  '/offline.html',
  '/manifest.json',
  '/favicon.ico'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate event - clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME && name !== DYNAMIC_CACHE)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// Fetch event - network first, fallback to cache
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') return;
  
  // Skip Supabase API calls
  if (url.href.includes('supabase.co')) return;
  
  // HTML requests - network first
  if (request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const clonedResponse = response.clone();
          caches.open(DYNAMIC_CACHE).then((cache) => {
            cache.put(request, clonedResponse);
          });
          return response;
        })
        .catch(() => {
          return caches.match(request).then((response) => {
            return response || caches.match('/offline.html');
          });
        })
    );
    return;
  }
  
  // Static assets - cache first
  if (url.href.match(/\.(js|css|png|jpg|jpeg|svg|ico|webp)$/)) {
    event.respondWith(
      caches.match(request).then((response) => {
        if (response) return response;
        
        return fetch(request).then((response) => {
          if (response.status === 200) {
            const clonedResponse = response.clone();
            caches.open(DYNAMIC_CACHE).then((cache) => {
              cache.put(request, clonedResponse);
            });
          }
          return response;
        });
      })
    );
    return;
  }
  
  // Default - network first
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.status === 200) {
          const clonedResponse = response.clone();
          caches.open(DYNAMIC_CACHE).then((cache) => {
            cache.put(request, clonedResponse);
          });
        }
        return response;
      })
      .catch(() => caches.match(request))
  );
});

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-user-lists') {
    event.waitUntil(syncUserLists());
  }
});

async function syncUserLists() {
  // Get pending updates from IndexedDB
  const db = await openDB();
  const tx = db.transaction('pendingUpdates', 'readonly');
  const updates = await tx.objectStore('pendingUpdates').getAll();
  
  for (const update of updates) {
    try {
      await fetch(update.url, {
        method: update.method,
        headers: update.headers,
        body: update.body
      });
      
      // Remove from pending after successful sync
      const deleteTx = db.transaction('pendingUpdates', 'readwrite');
      await deleteTx.objectStore('pendingUpdates').delete(update.id);
    } catch (error) {
      console.error('Sync failed:', error);
    }
  }
}

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('anithing-offline', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('pendingUpdates')) {
        db.createObjectStore('pendingUpdates', { keyPath: 'id' });
      }
    };
  });
}