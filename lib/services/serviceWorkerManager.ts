/**
 * Service Worker Manager
 * Handles registration, updates, and lifecycle management of the Service Worker
 */

interface ServiceWorkerConfig {
  enabled?: boolean;
  scope?: string;
  updateCheckInterval?: number;
}

class ServiceWorkerManager {
  private registration: ServiceWorkerRegistration | null = null;
  private updateCheckInterval: NodeJS.Timeout | null = null;
  private config: Required<ServiceWorkerConfig>;

  constructor(config: ServiceWorkerConfig = {}) {
    this.config = {
      enabled: config.enabled ?? true,
      scope: config.scope ?? '/',
      updateCheckInterval: config.updateCheckInterval ?? 60000, // 1 minute
    };
  }

  /**
   * Register the Service Worker
   */
  async register(): Promise<ServiceWorkerRegistration | null> {
    if (!this.config.enabled) {
      console.log('[ServiceWorkerManager] Service Worker disabled');
      return null;
    }

    // Proper type checking for navigator.serviceWorker
    if (!navigator || typeof navigator !== 'object' || !('serviceWorker' in navigator)) {
      console.warn('[ServiceWorkerManager] Service Workers not supported');
      return null;
    }

    try {
      console.log('[ServiceWorkerManager] Registering Service Worker...');
      this.registration = await navigator.serviceWorker.register('/service-worker.js', {
        scope: this.config.scope,
      });

      console.log('[ServiceWorkerManager] Service Worker registered successfully');

      // Listen for updates
      this.registration.addEventListener('updatefound', () => {
        this.handleUpdateFound();
      });

      // Start periodic update checks
      this.startUpdateChecks();

      return this.registration;
    } catch (error) {
      console.error('[ServiceWorkerManager] Failed to register Service Worker:', error);
      return null;
    }
  }

  /**
   * Unregister the Service Worker
   */
  async unregister(): Promise<boolean> {
    if (!this.registration) {
      return false;
    }

    try {
      this.stopUpdateChecks();
      const success = await this.registration.unregister();
      if (success) {
        console.log('[ServiceWorkerManager] Service Worker unregistered');
        this.registration = null;
      }
      return success;
    } catch (error) {
      console.error('[ServiceWorkerManager] Failed to unregister Service Worker:', error);
      return false;
    }
  }

  /**
   * Check for Service Worker updates
   */
  async checkForUpdates(): Promise<boolean> {
    if (!this.registration) {
      return false;
    }

    try {
      await this.registration.update();
      return true;
    } catch (error) {
      console.error('[ServiceWorkerManager] Failed to check for updates:', error);
      return false;
    }
  }

  /**
   * Handle when a new Service Worker is found
   */
  private handleUpdateFound(): void {
    const newWorker = this.registration?.installing;

    if (!newWorker) {
      return;
    }

    newWorker.addEventListener('statechange', () => {
      if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
        // New Service Worker is ready
        console.log('[ServiceWorkerManager] New Service Worker available');
        this.notifyUpdate();
      }
    });
  }

  /**
   * Notify about Service Worker update
   */
  private notifyUpdate(): void {
    // Dispatch custom event that the app can listen to
    const event = new CustomEvent('service-worker-update', {
      detail: { registration: this.registration },
    });
    window.dispatchEvent(event);
  }

  /**
   * Skip waiting and activate new Service Worker
   */
  async skipWaiting(): Promise<void> {
    if (!this.registration?.waiting) {
      return;
    }

    this.registration.waiting.postMessage({ type: 'SKIP_WAITING' });

    // Reload the page when the new Service Worker takes control
    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!refreshing) {
        refreshing = true;
        window.location.reload();
      }
    });
  }

  /**
   * Clear all caches
   */
  async clearCache(): Promise<void> {
    if (!this.registration?.active) {
      return;
    }

    this.registration.active.postMessage({ type: 'CLEAR_CACHE' });

    try {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map((name) => caches.delete(name)));
      console.log('[ServiceWorkerManager] All caches cleared');
    } catch (error) {
      console.error('[ServiceWorkerManager] Failed to clear caches:', error);
    }
  }

  /**
   * Get cache statistics
   */
  async getCacheStats(): Promise<{ name: string; size: number }[]> {
    try {
      const cacheNames = await caches.keys();
      const stats: { name: string; size: number }[] = [];

      for (const name of cacheNames) {
        const cache = await caches.open(name);
        const keys = await cache.keys();
        stats.push({
          name,
          size: keys.length,
        });
      }

      return stats;
    } catch (error) {
      console.error('[ServiceWorkerManager] Failed to get cache stats:', error);
      return [];
    }
  }

  /**
   * Start periodic update checks
   */
  private startUpdateChecks(): void {
    if (this.updateCheckInterval) {
      this.updateCheckInterval = setInterval(() => {
        this.checkForUpdates();
      }, this.config.updateCheckInterval);
    }
  }

  /**
   * Stop periodic update checks
   */
  private stopUpdateChecks(): void {
    if (this.updateCheckInterval) {
      clearInterval(this.updateCheckInterval);
      this.updateCheckInterval = null;
    }
  }

  /**
   * Get registration status
   */
  getStatus(): {
    registered: boolean;
    active: boolean;
    waiting: boolean;
    installing: boolean;
  } {
    return {
      registered: !!this.registration,
      active: !!this.registration?.active,
      waiting: !!this.registration?.waiting,
      installing: !!this.registration?.installing,
    };
  }

  /**
   * Check if background sync is supported
   */
  isSyncSupported(): boolean {
    return !!this.registration && 
           ('sync' in this.registration) && 
           this.registration.sync !== undefined;
  }

  /**
   * Check if periodic background sync is supported
   */
  isPeriodicSyncSupported(): boolean {
    return !!this.registration && 
           ('periodicSync' in this.registration) && 
           this.registration.periodicSync !== undefined;
  }

  /**
   * Register a background sync task
   */
  async registerSync(tag: string): Promise<boolean> {
    if (!this.isSyncSupported()) {
      console.warn('[ServiceWorkerManager] Background sync not supported');
      return false;
    }

    try {
      // Type guard for sync property using any to avoid TS errors
      const registration = this.registration as ServiceWorkerRegistration & { sync: any };
      await registration.sync.register(tag);
      console.log(`[ServiceWorkerManager] Background sync registered: ${tag}`);
      return true;
    } catch (error) {
      console.error('[ServiceWorkerManager] Failed to register background sync:', error);
      return false;
    }
  }

  /**
   * Register a periodic background sync task
   */
  async registerPeriodicSync(tag: string, options: { minPeriod: number; }): Promise<boolean> {
    if (!this.isPeriodicSyncSupported()) {
      console.warn('[ServiceWorkerManager] Periodic background sync not supported');
      return false;
    }

    try {
      // Type guard for periodicSync property using any to avoid TS errors
      const registration = this.registration as ServiceWorkerRegistration & { periodicSync: any };
      await registration.periodicSync.register(tag, options);
      console.log(`[ServiceWorkerManager] Periodic background sync registered: ${tag}`);
      return true;
    } catch (error) {
      console.error('[ServiceWorkerManager] Failed to register periodic background sync:', error);
      return false;
    }
  }

  /**
   * Get registered sync registrations
   */
  async getSyncRegistrations(): Promise<string[]> {
    if (!this.isSyncSupported()) {
      return [];
    }

    try {
      // Type guard for sync property using any to avoid TS errors
      const registration = this.registration as ServiceWorkerRegistration & { sync: any };
      const registrations = await registration.sync.getTags();
      return Array.from(registrations);
    } catch (error) {
      console.error('[ServiceWorkerManager] Failed to get sync registrations:', error);
      return [];
    }
  }

  /**
   * Get registered periodic sync registrations
   */
  async getPeriodicSyncRegistrations(): Promise<string[]> {
    if (!this.isPeriodicSyncSupported()) {
      return [];
    }

    try {
      // Type guard for periodicSync property using any to avoid TS errors
      const registration = this.registration as ServiceWorkerRegistration & { periodicSync: any };
      const registrations = await registration.periodicSync.getTags();
      return Array.from(registrations);
    } catch (error) {
      console.error('[ServiceWorkerManager] Failed to get periodic sync registrations:', error);
      return [];
    }
  }
}

// Export singleton instance
export const serviceWorkerManager = new ServiceWorkerManager({
  enabled: true,
  scope: '/',
  updateCheckInterval: 60000,
});

export default ServiceWorkerManager;

