// AsyncLocalStorage implementation for Node.js
export interface RequestContext {
    requestId?: string;
    userId?: string;
    tenantId?: string;
    startTime?: number;
    [key: string]: any;
}

export interface AsyncLocalStorage {
    run<T>(store: RequestContext, callback: () => T): T;
    getStore(): RequestContext;
}

export class AsyncLocalStorageImpl implements AsyncLocalStorage {
    private static currentContext: RequestContext | null = null;

    run<T>(store: RequestContext, callback: () => T): T {
        const previousContext = AsyncLocalStorageImpl.currentContext;
        AsyncLocalStorageImpl.currentContext = store;

        try {
            return callback();
        } finally {
            AsyncLocalStorageImpl.currentContext = previousContext;
        }
    }

    getStore(): RequestContext {
        if (!AsyncLocalStorageImpl.currentContext) {
            throw new Error('AsyncLocalStorage context not available. Use asyncLocalStorage.run()');
        }
        return AsyncLocalStorageImpl.currentContext;
    }
}

export const asyncLocalStorage: AsyncLocalStorage = new AsyncLocalStorageImpl();
