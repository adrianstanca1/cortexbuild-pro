import {
  queueRequest,
  processSyncQueue,
  getQueueLength,
} from "./offline/sync-queue";

// Register service worker and set up message handling
export function registerServiceWorker() {
  if (typeof window === "undefined") return;

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker
      .register("/sw.js")
      .then((registration) => {
        console.log("SW registered:", registration.scope);

        // Set up message listener from service worker
        navigator.serviceWorker.addEventListener("message", (event) => {
          if (event.data?.type === "PROCESS_SYNC_QUEUE") {
            processQueuedRequests();
          } else if (event.data?.type === "NETWORK_RESTORED") {
            // Optionally show notification that network is restored
            console.log("Network restored, processing queue...");
            processQueuedRequests();
          }
        });

        // Check for existing sync registration
        if ("SyncManager" in window && "sync" in registration) {
          (
            registration as ServiceWorkerRegistration & { sync: SyncManager }
          ).sync
            .register("offline-sync")
            .catch((error) => {
              console.log("Background sync registration failed:", error);
            });
        }

        // Periodic background sync (if supported)
        if ("PeriodicSyncManager" in window && "periodicSync" in registration) {
          // Request permission for periodic background sync with proper type checking
          if (navigator.permissions) {
            navigator.permissions
              .query({ name: "periodic-background-sync" as PermissionName })
              .then((permissionState) => {
                if (permissionState?.state === "granted") {
                  (
                    registration as ServiceWorkerRegistration & {
                      periodicSync: PeriodicSyncManager;
                    }
                  ).periodicSync
                    .register("offline-sync", {
                      minInterval: 12 * 60 * 60 * 1000,
                    })
                    .catch((error) => {
                      console.log("Periodic sync registration failed:", error);
                    });
                }
              })
              .catch((error) => {
                console.log("Permission query failed:", error);
              });
          }
        }
      })
      .catch((error) => {
        console.log("SW registration failed:", error);
      });
  }
}
export function unregisterServiceWorker() {
  if (typeof window === "undefined") return;

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.ready.then((registration) => {
      registration.unregister();
    });
  }
}

// Process queued requests when network is available
export async function processQueuedRequests() {
  if (typeof window === "undefined" || !navigator.onLine) return;

  try {
    const queueLength = await getQueueLength();
    if (queueLength === 0) {
      console.log("Sync queue is empty");
      return { processed: 0, failed: 0 };
    }

    console.log(`Processing ${queueLength} queued requests...`);
    const result = await processSyncQueue();
    console.log(
      `Sync complete: ${result.processed} processed, ${result.failed} failed`,
    );

    // Optionally notify user of sync results
    if (result.processed > 0 || result.failed > 0) {
      // In a real app, you might show a toast or notification here
      console.log(
        `Sync completed: ${result.processed} successful, ${result.failed} failed`,
      );
    }

    return result;
  } catch (error) {
    console.error("Error processing queued requests:", error);
    return { processed: 0, failed: 1 };
  }
}

// Enhanced queueRequest function with better error handling
export async function enhancedQueueRequest(
  method: "POST" | "PUT" | "PATCH" | "DELETE",
  url: string,
  body: any,
  headers?: Record<string, string>,
): Promise<{ queued: boolean; offline: boolean; queueLength?: number }> {
  try {
    const result = await queueRequest(method, url, body, headers);
    const queueLength = await getQueueLength();

    return { ...result, queueLength };
  } catch (error) {
    console.error("Error queuing request:", error);
    return { queued: false, offline: false, queueLength: 0 };
  }
}

// Manual sync trigger (for user-initiated sync)
export async function manualSync() {
  if (typeof window === "undefined") return;

  const registration = await navigator.serviceWorker.ready;
  if ("SyncManager" in window && "sync" in registration) {
    return (
      registration as ServiceWorkerRegistration & { sync: SyncManager }
    ).sync.register("offline-sync");
  } else {
    // Fallback to manual processing
    return processQueuedRequests();
  }
}

// Get current sync status
export function getSyncStatus() {
  return {
    isOnline: typeof navigator !== "undefined" && navigator.onLine,
    serviceWorkerSupported: "serviceWorker" in navigator,
    syncSupported: "SyncManager" in window,
    periodicSyncSupported: "PeriodicSyncManager" in window,
  };
}
