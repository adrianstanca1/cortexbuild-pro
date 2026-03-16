"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

interface DeploymentSummary {
  pm2Processes: number;
  pm2Running: number;
  dockerContainers: number;
  dockerRunning: number;
  healthStatus: "healthy" | "warning" | "error";
}

export function DeploymentWidget() {
  const [summary, setSummary] = useState<DeploymentSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard/summary")
      .then((res) => res.json())
      .then((data) => {
        setSummary(data.deployment);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6 animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
        <div className="h-8 bg-gray-200 rounded w-3/4 mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-1/3"></div>
      </div>
    );
  }

  const statusColor = {
    healthy: "text-green-600",
    warning: "text-yellow-600",
    error: "text-red-600",
  };

  return (
    <Link href="/deployment">
      <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
        <h3 className="text-sm font-medium text-gray-500 mb-2">Deployment</h3>
        <p className={`text-2xl font-bold ${statusColor[summary?.healthStatus ?? "healthy"]}`}>
          {summary?.pm2Running ?? 0}/{summary?.pm2Processes ?? 0}
        </p>
        <p className="text-sm text-gray-500 mt-1">
          PM2 running | Docker: {summary?.dockerRunning ?? 0}
        </p>
      </div>
    </Link>
  );
}
