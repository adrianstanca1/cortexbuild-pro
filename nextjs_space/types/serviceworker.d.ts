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

// Web Speech API type declarations
interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onstart: (() => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}

interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  isFinal: boolean;
  length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionConstructor {
  new (): SpeechRecognition;
}

interface Window {
  SpeechRecognition: SpeechRecognitionConstructor;
  webkitSpeechRecognition: SpeechRecognitionConstructor;
}