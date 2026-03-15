"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./dialog";
import { Keyboard } from "lucide-react";

interface Shortcut {
  keys: string[];
  description: string;
  category: string;
}

const shortcuts: Shortcut[] = [
  // Navigation
  { keys: ["g", "d"], description: "Go to Dashboard", category: "Navigation" },
  { keys: ["g", "p"], description: "Go to Projects", category: "Navigation" },
  { keys: ["g", "t"], description: "Go to Team", category: "Navigation" },
  { keys: ["g", "s"], description: "Go to Settings", category: "Navigation" },

  // Actions
  { keys: ["c"], description: "Create new item", category: "Actions" },
  { keys: ["/"], description: "Focus search", category: "Actions" },
  {
    keys: ["Escape"],
    description: "Close modal / Clear search",
    category: "Actions",
  },

  // Views
  { keys: ["v", "l"], description: "List view", category: "Views" },
  { keys: ["v", "k"], description: "Kanban view", category: "Views" },
  { keys: ["v", "g"], description: "Gantt view", category: "Views" },

  // General
  { keys: ["?"], description: "Show keyboard shortcuts", category: "General" },
  { keys: ["Ctrl", "k"], description: "Command palette", category: "General" },
];

export function KeyboardShortcutsModal({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const categories = [...new Set(shortcuts.map((s) => s.category))];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Keyboard className="h-5 w-5" />
            Keyboard Shortcuts
          </DialogTitle>
        </DialogHeader>
        <div className="grid gap-6 py-4">
          {categories.map((category) => (
            <div key={category}>
              <h4 className="text-sm font-semibold text-muted-foreground mb-3">
                {category}
              </h4>
              <div className="space-y-2">
                {shortcuts
                  .filter((s) => s.category === category)
                  .map((shortcut, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-muted/50"
                    >
                      <span className="text-sm text-foreground">
                        {shortcut.description}
                      </span>
                      <div className="flex items-center gap-1">
                        {shortcut.keys.map((key, i) => (
                          <span key={i} className="flex items-center gap-1">
                            <kbd className="px-2 py-1 text-xs font-semibold text-muted-foreground bg-muted border border-border rounded">
                              {key}
                            </kbd>
                            {i < shortcut.keys.length - 1 && (
                              <span className="text-muted-foreground text-xs">
                                then
                              </span>
                            )}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Hook for keyboard shortcuts
export function useKeyboardShortcuts() {
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [pendingKey, setPendingKey] = useState<string | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in input
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      // Show shortcuts modal
      if (e.key === "?") {
        e.preventDefault();
        setShowShortcuts(true);
        return;
      }

      // Close modal on escape
      if (e.key === "Escape") {
        setShowShortcuts(false);
        setPendingKey(null);
        return;
      }

      // Focus search
      if (e.key === "/") {
        e.preventDefault();
        const searchInput = document.querySelector<HTMLInputElement>(
          "[data-search-input]",
        );
        searchInput?.focus();
        return;
      }

      // Handle two-key shortcuts
      if (pendingKey) {
        const combo = `${pendingKey}${e.key}`;
        if (combo === "gd") window.location.href = "/dashboard";
        else if (combo === "gp") window.location.href = "/projects";
        else if (combo === "gt") window.location.href = "/team";
        else if (combo === "gs") window.location.href = "/settings";
        setPendingKey(null);
        return;
      }

      // Start pending key sequence
      if (e.key === "g" || e.key === "v") {
        setPendingKey(e.key);
        setTimeout(() => setPendingKey(null), 1000); // Reset after 1 second
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [pendingKey]);

  return { showShortcuts, setShowShortcuts };
}
