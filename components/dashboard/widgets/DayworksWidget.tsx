"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

interface DayworksSummary {
  totalReports: number;
  reportsThisWeek: number;
  avgCrewSize: number;
  lastReportDate: string | null;
}

export function DayworksWidget() {
  const [summary, setSummary] = useState<DayworksSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard/summary")
      .then((res) => res.json())
      .then((data) => {
        setSummary(data.dayworks);
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

  return (
    <Link href="/dayworks">
      <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
        <h3 className="text-sm font-medium text-gray-500 mb-2">Dayworks</h3>
        <p className="text-2xl font-bold text-gray-900">
          {summary?.reportsThisWeek ?? 0}
        </p>
        <p className="text-sm text-gray-500 mt-1">
          Reports this week | Avg crew: {summary?.avgCrewSize ?? 0}
        </p>
      </div>
    </Link>
  );
}
