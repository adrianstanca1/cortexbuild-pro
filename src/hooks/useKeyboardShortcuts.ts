import { useEffect, useCallback } from 'react';

export interface KeyboardShortcut {
    key: string;
    ctrl?: boolean;
    shift?: boolean;
    alt?: boolean;
    meta?: boolean;
    description: string;
    action: () => void;
}

export const useKeyboardShortcuts = (shortcuts: KeyboardShortcut[]) => {
    const handleKeyDown = useCallback((event: KeyboardEvent) => {
        for (const shortcut of shortcuts) {
            const ctrlMatch = shortcut.ctrl ? event.ctrlKey : !event.ctrlKey;
            const shiftMatch = shortcut.shift ? event.shiftKey : !event.shiftKey;
            const altMatch = shortcut.alt ? event.altKey : !event.altKey;
            const metaMatch = shortcut.meta ? event.metaKey : !event.metaKey;

            if (
                event.key.toLowerCase() === shortcut.key.toLowerCase() &&
                ctrlMatch &&
                shiftMatch &&
                altMatch &&
                metaMatch
            ) {
                event.preventDefault();
                shortcut.action();
                break;
            }
        }
    }, [shortcuts]);

    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleKeyDown]);
};

// Predefined shortcuts
export const SHORTCUTS = {
    SEARCH: { key: 'k', ctrl: true, description: 'Open search' },
    NEW_PROJECT: { key: 'n', ctrl: true, shift: true, description: 'New project' },
    SAVE: { key: 's', ctrl: true, description: 'Save' },
    HELP: { key: '/', shift: true, description: 'Show help' },
    DASHBOARD: { key: 'd', ctrl: true, description: 'Go to dashboard' },
    PROJECTS: { key: 'p', ctrl: true, description: 'Go to projects' },
    TASKS: { key: 't', ctrl: true, description: 'Go to tasks' },
};

// Example usage:
// const navigate = useNavigate();
// useKeyboardShortcuts([
//   { ...SHORTCUTS.DASHBOARD, action: () => navigate('/dashboard') },
//   { ...SHORTCUTS.SEARCH, action: () => setSearchOpen(true) }
// ]);
