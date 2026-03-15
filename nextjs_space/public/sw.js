// Service Worker for CortexBuild Pro
// Provides offline capabilities and background sync

const CACHE_NAME = 'cortexbuild-pro-v1';
const OFFLINE_URL = '/offline.html';

// Install event - cache essential assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll([
        '/',
        OFFLINE_URL,
        '/manifest.json'
      ]))
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }
  
  event.respondWith(
    caches.match(event.request)
      .then((cachedResponse) => {
        // Return cached response if found
        if (cachedResponse) {
          return cachedResponse;
        }
        
        // Otherwise, go to network
        return fetch(event.request)
          .then((networkResponse) => {
            // Cache successful requests for future use
            if (networkResponse && networkResponse.status === 200 && 
                networkResponse.type === 'basic') {
              const responseToCache = networkResponse.clone();
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(event.request, responseToCache);
              });
            }
            
            return networkResponse;
          })
          .catch(() => {
            // If network fails, try to return offline page for navigation requests
            if (event.request.mode === 'navigate') {
              return caches.match(OFFLINE_URL);
            }
            return Response.error();
          });
      })
  );
});

// Handle messages from client
self.addEventListener('message', (event) => {
  if (event.data?.type === 'PROCESS_SYNC_QUEUE') {
    // In a real implementation, this would trigger sync processing
    // For now, we'll just acknowledge the message
    console.log('Service worker received sync queue processing request');
    
    // Notify clients that sync was processed
    self.clients.matchAll().then((clients) => {
      clients.forEach((client) => {
        client.postMessage({
          type: 'SYNC_PROCESSED',
          timestamp: Date.now()
        });
      });
    });
  }
});

// Background sync event listener
self.addEventListener('sync', (event) => {
  if (event.tag === 'offline-sync') {
    event.waitUntil(processSyncQueue());
  }
});

// Periodic background sync event listener
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'offline-sync') {
    event.waitUntil(processSyncQueue());
  }
});

// Helper function to process sync queue (would integrate with your sync logic)
async function processSyncQueue() {
  console.log('Processing sync queue...');
  // This would call your actual sync queue processing logic
  // For now, just return a resolved promise
  return Promise.resolve();
}