// ServiceWorker type declarations for Background Sync and Periodic Sync APIs

interface SyncEvent extends ExtendableEvent {
  tag: string;
  lastChance: boolean;
}

interface PeriodicSyncEvent extends ExtendableEvent {
  tag: string;
}

interface SyncManager {
  register(tag: string): Promise<void>;
  getTags(): Promise<string[]>;
}

interface PeriodicSyncManager {
  register(tag: string, options?: { minInterval: number }): Promise<void>;
  unregister(tag: string): Promise<void>;
  getTags(): Promise<string[]>;
}

interface ServiceWorkerRegistration {
  sync: SyncManager;
  periodicSync: PeriodicSyncManager;
}

interface ExtendableEvent extends Event {
  waitUntil(promise: Promise<any>): void;
}

interface FetchEvent extends Event {
  request: Request;
  respondWith(response: Promise<Response> | Response): void;
  clientId: string;
  handled: Promise<void>;
  preloadResponse: Promise<Response | undefined>;
}

declare function addEventListener(type: 'sync', listener: (event: SyncEvent) => void): void;
declare function addEventListener(type: 'periodicsync', listener: (event: PeriodicSyncEvent) => void): void;