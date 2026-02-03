"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

interface SidebarContextType {
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
  toggleSidebar: () => void;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

const SIDEBAR_STORAGE_KEY = 'cortexbuild-sidebar-collapsed';

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsedState] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem(SIDEBAR_STORAGE_KEY);
    if (stored !== null) {
      setCollapsedState(stored === 'true');
    }
  }, []);

  const setCollapsed = useCallback((value: boolean) => {
    setCollapsedState(value);
    localStorage.setItem(SIDEBAR_STORAGEKEY, String(value));
  }, []);

  const toggleSidebar = useCallback(() => {
    setCollapsed(!collapsed);
  }, [collapsed, setCollapsed]);

  // Prevent hydration mismatch
  if (!mounted) {
    return React.createElement(React.Fragment, null, children);
  }

  return React.createElement(
    SidebarContext.Provider,
    { value: { collapsed, setCollapsed, toggleSidebar } },
    children
  );
}

export function useSidebar() {
  const context = useContext(SidebarContext);
  // Return default values if used outside provider (SSR safety)
  if (context === undefined) {
    return {
      collapsed: false,
      setCollapsed: () => {},
      toggleSidebar: () => {},
    };
  }
  return context;
}

// For components that may be outside provider
export function useSidebarOptional() {
  return useContext(SidebarContext);
}
