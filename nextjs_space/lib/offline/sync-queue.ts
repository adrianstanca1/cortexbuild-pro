// Simple offline sync queue implementation
interface QueuedRequest {
  id: string;
  method: "POST" | "PUT" | "PATCH" | "DELETE";
  url: string;
  body: any;
  headers?: Record<string, string>;
  timestamp: number;
  retries: number;
}

class SyncQueue {
  private queue: QueuedRequest[] = [];
  private readonly STORAGE_KEY = "offline-sync-queue";
  private readonly MAX_RETRIES = 3;

  constructor() {
    this.loadQueue();
  }

  private loadQueue() {
    try {
      const saved = localStorage.getItem(this.STORAGE_KEY);
      if (saved) {
        this.queue = JSON.parse(saved);
      }
    } catch (error) {
      console.error("Failed to load sync queue:", error);
      this.queue = [];
    }
  }

  private saveQueue() {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.queue));
    } catch (error) {
      console.error("Failed to save sync queue:", error);
    }
  }

  async queueRequest(
    method: "POST" | "PUT" | "PATCH" | "DELETE",
    url: string,
    body: any,
    headers?: Record<string, string>,
  ): Promise<{ queued: boolean; offline: boolean }> {
    try {
      const request: QueuedRequest = {
        id: Math.random().toString(36).substr(2, 9),
        method,
        url,
        body,
        headers,
        timestamp: Date.now(),
        retries: 0,
      };

      this.queue.push(request);
      this.saveQueue();

      return { queued: true, offline: !navigator.onLine };
    } catch (error) {
      console.error("Error queuing request:", error);
      return { queued: false, offline: false };
    }
  }

  async getQueueLength(): Promise<number> {
    return this.queue.length;
  }

  async processSyncQueue(): Promise<{ processed: number; failed: number }> {
    if (this.queue.length === 0) {
      return { processed: 0, failed: 0 };
    }

    if (!navigator.onLine) {
      return { processed: 0, failed: this.queue.length };
    }

    let processed = 0;
    let failed = 0;
    const requestsToProcess = [...this.queue];
    this.queue = [];
    this.saveQueue();

    for (const request of requestsToProcess) {
      try {
        const response = await fetch(request.url, {
          method: request.method,
          headers: request.headers,
          body: request.body ? JSON.stringify(request.body) : undefined,
        });

        if (response.ok) {
          processed++;
        } else {
          // Retry logic
          if (request.retries < this.MAX_RETRIES) {
            request.retries++;
            this.queue.push(request);
          } else {
            failed++;
          }
        }
      } catch (error) {
        // Retry logic for network errors
        if (request.retries < this.MAX_RETRIES) {
          request.retries++;
          this.queue.push(request);
        } else {
          failed++;
        }
      }
    }

    // Save any remaining requests that need retrying
    if (this.queue.length > 0) {
      this.saveQueue();
    }

    return { processed, failed };
  }

  clearQueue() {
    this.queue = [];
    this.saveQueue();
  }
}

// Export a singleton instance
export const syncQueue = new SyncQueue();

// Export individual functions for backward compatibility
export async function queueRequest(
  method: "POST" | "PUT" | "PATCH" | "DELETE",
  url: string,
  body: any,
  headers?: Record<string, string>,
): Promise<{ queued: boolean; offline: boolean }> {
  return syncQueue.queueRequest(method, url, body, headers);
}

export async function processSyncQueue(): Promise<{
  processed: number;
  failed: number;
}> {
  return syncQueue.processSyncQueue();
}

export async function getQueueLength(): Promise<number> {
  return syncQueue.getQueueLength();
}

// Alias for backward compatibility
export const processQueuedRequests = processSyncQueue;

// Get sync status helper
export function getSyncStatus() {
  return {
    isOnline: typeof navigator !== "undefined" ? navigator.onLine : true,
    serviceWorkerSupported:
      typeof navigator !== "undefined" && "serviceWorker" in navigator,
    syncSupported: typeof window !== "undefined" && "SyncManager" in window,
    periodicSyncSupported:
      typeof window !== "undefined" && "PeriodicSyncManager" in window,
  };
}

// Manual sync function
export async function manualSync(): Promise<{
  processed: number;
  failed: number;
}> {
  if (typeof window === "undefined" || !navigator.onLine) {
    return { processed: 0, failed: 0 };
  }
  return syncQueue.processSyncQueue();
}
