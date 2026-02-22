import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';

// Cleanup after each test
afterEach(() => {
    cleanup();
});

// Global mock for lucide-react to prevent missing icon errors
jest.mock('lucide-react', () => {
    return {
        Loader2: () => 'Loader2Icon',
        Send: () => 'SendIcon',
        MessageCircle: () => 'MessageCircleIcon',
        Settings: () => 'SettingsIcon',
        User: () => 'UserIcon',
        Search: () => 'SearchIcon',
        Bell: () => 'BellIcon',
        Plus: () => 'PlusIcon',
        ChevronDown: () => 'ChevronDownIcon',
        ChevronUp: () => 'ChevronUpIcon',
        X: () => 'XIcon',
        Check: () => 'CheckIcon',
        AlertTriangle: () => 'AlertTriangleIcon',
        Clock: () => 'ClockIcon',
        Calendar: () => 'CalendarIcon',
        FileText: () => 'FileTextIcon',
        History: () => 'HistoryIcon',
        Shield: () => 'ShieldIcon',
        ExternalLink: () => 'ExternalLinkIcon',
    };
});

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: () => { },
        removeListener: () => { },
        addEventListener: () => { },
        removeEventListener: () => { },
        dispatchEvent: () => false,
    }),
});

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
    constructor() { }
    disconnect() { }
    observe() { }
    takeRecords() { return []; }
    unobserve() { }
} as any;
