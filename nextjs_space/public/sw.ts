/// <reference lib="webworker" />
/// <reference lib="serviceworker" />

const CACHE_NAME = "cortexbuild-v1";
const STATIC_ASSETS = [
  "/",
  "/dashboard",
  "/manifest.json",
  "/icons/icon-192x192.png",
  "/icons/icon-512x512.png",
];

// Install: cache static assets
self.addEventListener("install", (event: ExtendableEvent) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  (self as any).skipWaiting();
});

// Activate: clean old caches
self.addEventListener("activate", (event: ExtendableEvent) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  (self as any).clients.claim();
});

// Fetch: cache-first strategy for static assets, network-first for API
self.addEventListener("fetch", (event: FetchEvent) => {
  const { request } = event;

  // Skip non-GET requests
  if (request.method !== "GET") return;

  // Cache-first for static assets
  if (request.url.includes("/api/")) {
    // For API requests, try network first, fall back to cache
    event.respondWith(
      fetch(request).catch(() => caches.match(request))
    );
    return;
  }

  // For static assets, cache-first strategy
  event.respondWith(
    caches.match(request).then((response) => {
      if (response) {
        return response;
      }
      return fetch(request).then((networkResponse) => {
        if (networkResponse.status === 200) {
          const cloned = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, cloned);
          });
        }
        return networkResponse;
      });
    })
  );
});

// Background sync for processing offline queue
self.addEventListener("sync", (event: SyncEvent) => {
  if (event.tag === "offline-sync") {
    event.waitUntil(processOfflineQueue());
  }
});

// Periodic background sync (if supported)
self.addEventListener("periodicsync", (event: PeriodicSyncEvent) => {
  if (event.tag === "offline-sync") {
    event.waitUntil(processOfflineQueue());
  }
});

// Message handling for communication with client
self.addEventListener("message", (event: ExtendableEvent) => {
  if (event.data && event.data.type === "TRIGGER_SYNC") {
    event.waitUntil(processOfflineQueue());
  }
});

async function processOfflineQueue() {
  try {
    // Import the sync queue functions dynamically to avoid SSR issues
    // In a real service worker, we'd need to import these differently
    // For now, we'll post a message to the client to process the queue

    // Notify all clients to process the sync queue
    const clients = await self.clients.matchAll({ includeUncontrolled: true });
    for (const client of clients) {
      client.postMessage({
        type: "PROCESS_SYNC_QUEUE",
        timestamp: Date.now()
      });
    }

    console.log("Background sync triggered, notified clients to process queue");
  } catch (error) {
    console.error("Error processing offline queue:", error);
  }
}

// Fallback: if background sync is not supported, we can still notify clients on online event
self.addEventListener("online", () => {
  self.clients.matchAll().then(clients => {
    clients.forEach(client => {
      client.postMessage({
        type: "NETWORK_RESTORED",
        timestamp: Date.now()
      });
    });
  });
});

export {};