'use client';

import { useState, useEffect, useCallback } from 'react';

interface SidebarState {
  isOpen: boolean;
  isCollapsed: boolean;
  isMobileOpen: boolean;
}

export function useSidebar() {
  const [state, setState] = useState<SidebarState>({
    isOpen: true,
    isCollapsed: false,
    isMobileOpen: false,
  });

  const toggleSidebar = useCallback(() => {
    setState((prev) => ({ ...prev, isOpen: !prev.isOpen }));
  }, []);

  const collapseSidebar = useCallback(() => {
    setState((prev) => ({ ...prev, isCollapsed: !prev.isCollapsed }));
  }, []);

  const openMobileSidebar = useCallback(() => {
    setState((prev) => ({ ...prev, isMobileOpen: true }));
  }, []);

  const closeMobileSidebar = useCallback(() => {
    setState((prev) => ({ ...prev, isMobileOpen: false }));
  }, []);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setState((prev) => ({ ...prev, isOpen: false, isMobileOpen: false }));
      } else {
        setState((prev) => ({ ...prev, isMobileOpen: false }));
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return {
    ...state,
    toggleSidebar,
    collapseSidebar,
    openMobileSidebar,
    closeMobileSidebar,
  };
}
