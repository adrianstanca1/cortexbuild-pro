"use client";

import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "next-themes";
import { WebSocketProvider } from '@/contexts/WebSocketContext';
import { ReactNode } from "react";

/**
 * Wraps children with session, theme, and WebSocket providers.
 *
 * Returns a provider tree: SessionProvider -> ThemeProvider -> WebSocketProvider -> children.
 *
 * @param children - The React nodes to be wrapped by the providers.
 * @returns A React element that provides session, theme, and WebSocket contexts to `children`.
 */
export function Providers({ children }: { children: ReactNode }) {
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