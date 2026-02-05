"use client";

import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "next-themes";
import { WebSocketProvider } from '@/contexts/WebSocketContext';
import { useState, useEffect, ReactNode } from "react";

/**
 * Wraps children with session, theme, and WebSocket providers and delays visible rendering until the component is mounted on the client.
 *
 * When mounted, returns a provider tree: SessionProvider -> ThemeProvider -> WebSocketProvider -> children. Before mount, renders the children inside a hidden container to avoid hydration mismatches.
 *
 * @param children - The React nodes to be wrapped by the providers.
 * @returns A React element that provides session, theme, and WebSocket contexts to `children`.
 */
export function Providers({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div style={{ visibility: 'hidden' }}>{children}</div>;
  }

  return (
    <SessionProvider>
      <ThemeProvider
        attribute="class"
        defaultTheme="light"
        enableSystem
        disableTransitionOnChange={false}
      >
        <WebSocketProvider>
          {children}
        </WebSocketProvider>
      </ThemeProvider>
    </SessionProvider>
  );
}