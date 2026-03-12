"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global error:", error);
  }, [error]);

  return (
    <html>
      <body>
        <div className="flex min-h-screen flex-col items-center justify-center bg-background p-6">
          <div className="w-full max-w-md space-y-6 text-center">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold tracking-tight text-foreground">
                Something went wrong
              </h1>
              <p className="text-muted-foreground">
                An unexpected error occurred. Our team has been notified.
              </p>
              {error?.digest && (
                <p className="text-xs text-muted-foreground font-mono">
                  Error ID: {error.digest}
                </p>
              )}
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Button onClick={reset} variant="default">
                Try again
              </Button>
              <Button
                variant="outline"
                onClick={() => (window.location.href = "/dashboard")}
              >
                Go to Dashboard
              </Button>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
