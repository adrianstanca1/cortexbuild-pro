"use client";

import { useEffect, useState } from "react";

interface VersionInfo {
  version: string;
  name: string;
  environment: string;
}

export function DashboardFooter() {
  const [versionInfo, setVersionInfo] = useState<VersionInfo | null>(null);

  useEffect(() => {
    fetch("/api/version")
      .then((res) => {
        if (!res.ok) {
          throw new Error(`Failed to fetch version: ${res.status} ${res.statusText}`);
        }
        return res.json();
      })
      .then((data) => setVersionInfo(data))
      .catch((err) => {
        console.error("Failed to fetch version:", err);
        // Set a fallback version on error
        setVersionInfo({
          version: "2.1.0",
          name: "CortexBuild Pro",
          environment: "unknown",
        });
      });
  }, []);

  if (!versionInfo) return null;

  // Format environment display
  const formatEnvironment = (env: string) => {
    if (env === 'unknown') return 'Unknown';
    return env.charAt(0).toUpperCase() + env.slice(1);
  };

  return (
    <footer className="border-t bg-background py-4 px-6 text-sm text-muted-foreground">
      <div className="flex items-center justify-between">
        <div>
          {versionInfo.name} v{versionInfo.version}
        </div>
        <div className="text-xs">
          {formatEnvironment(versionInfo.environment)}
        </div>
      </div>
    </footer>
  );
}
