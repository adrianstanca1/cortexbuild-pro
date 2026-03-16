"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

interface PayrollSummary {
  totalPayrolls: number;
  draftCount: number;
  processedCount: number;
  paidCount: number;
  totalNetPay: number;
}

export function PayrollWidget() {
  const [summary, setSummary] = useState<PayrollSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard/summary")
      .then((res) => res.json())
      .then((data) => {
        setSummary(data.payroll);
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
    <Link href="/payroll">
      <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
        <h3 className="text-sm font-medium text-gray-500 mb-2">Payroll</h3>
        <p className="text-2xl font-bold text-gray-900">
          {summary?.draftCount ?? 0}
        </p>
        <p className="text-sm text-gray-500 mt-1">
          Draft | Paid: £{(summary?.totalNetPay ?? 0).toLocaleString()}
        </p>
      </div>
    </Link>
  );
}
