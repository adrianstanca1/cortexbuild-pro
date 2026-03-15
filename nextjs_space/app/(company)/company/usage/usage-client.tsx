"use client";

import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DatePickerWithRange } from "@/components/ui/date-range-picker";
import { DateRange } from "react-day-picker";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";
import {
  AlertTriangle,
  CheckCircle,
  Info,
  CreditCard,
  Calendar,
  Users,
  FileText,
  Database,
} from "lucide-react";

// Define TypeScript interfaces for props
interface UsageMetrics {
  apiCalls: number;
  storageUsedMB: number;
  activeUsers: number;
  projectsCreated: number;
}

interface SubscriptionPlan {
  name: string;
  maxApiCalls: number;
  maxStorageMB: number;
  maxUsers: number;
  maxProjects: number;
  price: number;
  billingCycle: "monthly" | "annual";
}

interface BillingInfo {
  currentCycleStart: Date;
  currentCycleEnd: Date;
  paymentMethod: string;
  nextPaymentDate: Date;
}

interface UsageData {
  metrics: UsageMetrics;
  subscription: SubscriptionPlan;
  billing: BillingInfo;
  historicalUsage: Array<{
    date: string;
    apiCalls: number;
    storageUsedMB: number;
  }>;
}

interface CompanyUsageClientProps {
  usageData?: UsageData;
  error?: string;
}

export function CompanyUsageClient({
  usageData,
  error,
}: CompanyUsageClientProps) {
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(new Date().setDate(new Date().getDate() - 30)),
    to: new Date(),
  });
  const [_isLoading, _setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "overview" | "history" | "billing"
  >("overview");

  // Filter historical data based on date range
  const filteredHistory =
    usageData?.historicalUsage.filter((item) => {
      if (!dateRange?.from || !dateRange?.to) return true;
      const itemDate = new Date(item.date);
      return itemDate >= dateRange.from && itemDate <= dateRange.to;
    }) || [];

  // Calculate billing cycle progress
  const billingCycleProgress = usageData
    ? {
        daysPassed: Math.min(
          99,
          Math.max(
            0,
            Math.floor(
              ((new Date().getTime() -
                new Date(usageData.billing.currentCycleStart).getTime()) /
                (new Date(usageData.billing.currentCycleEnd).getTime() -
                  new Date(usageData.billing.currentCycleStart).getTime())) *
                100,
            ),
          ),
        ),
        daysRemaining: Math.max(
          0,
          Math.floor(
            (new Date(usageData.billing.currentCycleEnd).getTime() -
              new Date().getTime()) /
              (1000 * 60 * 60 * 24),
          ),
        ),
      }
    : { daysPassed: 0, daysRemaining: 0 };

  // Calculate usage percentages
  const apiUsagePercentage = usageData
    ? Math.min(
        100,
        (usageData.metrics.apiCalls / usageData.subscription.maxApiCalls) * 100,
      )
    : 0;
  const storageUsagePercentage = usageData
    ? Math.min(
        100,
        (usageData.metrics.storageUsedMB /
          usageData.subscription.maxStorageMB) *
          100,
      )
    : 0;
  const usersUsagePercentage = usageData
    ? Math.min(
        100,
        (usageData.metrics.activeUsers / usageData.subscription.maxUsers) * 100,
      )
    : 0;
  const projectsUsagePercentage = usageData
    ? Math.min(
        100,
        (usageData.metrics.projectsCreated /
          usageData.subscription.maxProjects) *
          100,
      )
    : 0;

  if (error) {
    return (
      <div
        className="container mx-auto py-8"
        role="alert"
        aria-live="assertive"
      >
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md flex items-start">
          <AlertTriangle
            className="h-5 w-5 text-red-500 mr-3 mt-0.5"
            aria-hidden="true"
          />
          <div>
            <h3 className="font-medium text-red-800">
              Error Loading Usage Data
            </h3>
            <p className="text-red-600 mt-1">{error}</p>
            <Button
              variant="outline"
              className="mt-3"
              onClick={() => window.location.reload()}
              aria-label="Retry loading data"
            >
              Retry
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!usageData) {
    return (
      <div className="container mx-auto py-8" aria-busy="true">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          <span className="ml-3 text-gray-600">Loading usage data...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Company Usage Dashboard
          </h1>
          <p className="text-gray-600">
            Monitor your usage, track limits, and manage your subscription
          </p>
        </div>
        <div className="flex items-center space-x-4 mt-4 md:mt-0">
          <DatePickerWithRange
            value={dateRange}
            onChange={setDateRange}
            className="w-full md:w-auto"
          />
          <Select
            value={activeTab}
            onValueChange={(value: any) => setActiveTab(value)}
          >
            <SelectTrigger className="w-[180px]" aria-label="Select view mode">
              <SelectValue placeholder="View Mode" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="overview">Overview</SelectItem>
              <SelectItem value="history">History</SelectItem>
              <SelectItem value="billing">Billing</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200 mb-8">
        <nav
          className="-mb-px flex space-x-8"
          aria-label="Usage dashboard tabs"
        >
          <button
            onClick={() => setActiveTab("overview")}
            className={`${
              activeTab === "overview"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            aria-current={activeTab === "overview" ? "page" : undefined}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`${
              activeTab === "history"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            aria-current={activeTab === "history" ? "page" : undefined}
          >
            Usage History
          </button>
          <button
            onClick={() => setActiveTab("billing")}
            className={`${
              activeTab === "billing"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            aria-current={activeTab === "billing" ? "page" : undefined}
          >
            Billing
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === "overview" && (
        <div className="space-y-8">
          {/* Current Plan Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                  Current Plan: {usageData.subscription.name}
                </span>
                <span className="text-2xl font-bold">
                  ${usageData.subscription.price}/
                  {usageData.subscription.billingCycle === "monthly"
                    ? "month"
                    : "year"}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* API Calls Usage */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center">
                      <Info className="h-4 w-4 text-blue-500 mr-2" />
                      <span className="text-sm font-medium text-gray-500">
                        API Calls
                      </span>
                    </div>
                    <span className="text-sm font-semibold">
                      {usageData.metrics.apiCalls} /{" "}
                      {usageData.subscription.maxApiCalls}
                    </span>
                  </div>
                  <Progress
                    value={apiUsagePercentage}
                    className={`h-2 ${apiUsagePercentage > 90 ? "bg-red-500" : apiUsagePercentage > 75 ? "bg-yellow-500" : "bg-blue-500"}`}
                    aria-label={`API calls usage: ${apiUsagePercentage}%`}
                  />
                  {apiUsagePercentage > 90 && (
                    <p className="text-xs text-red-500 mt-1">
                      Approaching limit!
                    </p>
                  )}
                </div>

                {/* Storage Usage */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center">
                      <Database className="h-4 w-4 text-blue-500 mr-2" />
                      <span className="text-sm font-medium text-gray-500">
                        Storage
                      </span>
                    </div>
                    <span className="text-sm font-semibold">
                      {usageData.metrics.storageUsedMB.toFixed(2)} /{" "}
                      {usageData.subscription.maxStorageMB} MB
                    </span>
                  </div>
                  <Progress
                    value={storageUsagePercentage}
                    className={`h-2 ${storageUsagePercentage > 90 ? "bg-red-500" : storageUsagePercentage > 75 ? "bg-yellow-500" : "bg-blue-500"}`}
                    aria-label={`Storage usage: ${storageUsagePercentage}%`}
                  />
                  {storageUsagePercentage > 90 && (
                    <p className="text-xs text-red-500 mt-1">
                      Approaching limit!
                    </p>
                  )}
                </div>

                {/* Users Usage */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center">
                      <Users className="h-4 w-4 text-blue-500 mr-2" />
                      <span className="text-sm font-medium text-gray-500">
                        Active Users
                      </span>
                    </div>
                    <span className="text-sm font-semibold">
                      {usageData.metrics.activeUsers} /{" "}
                      {usageData.subscription.maxUsers}
                    </span>
                  </div>
                  <Progress
                    value={usersUsagePercentage}
                    className={`h-2 ${usersUsagePercentage > 90 ? "bg-red-500" : usersUsagePercentage > 75 ? "bg-yellow-500" : "bg-blue-500"}`}
                    aria-label={`Users usage: ${usersUsagePercentage}%`}
                  />
                  {usersUsagePercentage > 90 && (
                    <p className="text-xs text-red-500 mt-1">
                      Approaching limit!
                    </p>
                  )}
                </div>

                {/* Projects Usage */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center">
                      <FileText className="h-4 w-4 text-blue-500 mr-2" />
                      <span className="text-sm font-medium text-gray-500">
                        Projects
                      </span>
                    </div>
                    <span className="text-sm font-semibold">
                      {usageData.metrics.projectsCreated} /{" "}
                      {usageData.subscription.maxProjects}
                    </span>
                  </div>
                  <Progress
                    value={projectsUsagePercentage}
                    className={`h-2 ${projectsUsagePercentage > 90 ? "bg-red-500" : projectsUsagePercentage > 75 ? "bg-yellow-500" : "bg-blue-500"}`}
                    aria-label={`Projects usage: ${projectsUsagePercentage}%`}
                  />
                  {projectsUsagePercentage > 90 && (
                    <p className="text-xs text-red-500 mt-1">
                      Approaching limit!
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button className="w-full" variant="outline">
                  <CreditCard className="h-4 w-4 mr-2" />
                  Update Payment Method
                </Button>
                <Button className="w-full" variant="outline">
                  <Users className="h-4 w-4 mr-2" />
                  Manage Team Members
                </Button>
                <Button className="w-full" variant="outline">
                  <Database className="h-4 w-4 mr-2" />
                  Upgrade Plan
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === "history" && (
        <div className="space-y-8">
          {/* Usage Charts */}
          <Card>
            <CardHeader>
              <CardTitle>Usage History</CardTitle>
            </CardHeader>
            <CardContent className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={filteredHistory}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-white p-3 border rounded-lg shadow-sm">
                            <p className="font-semibold">{label}</p>
                            {payload.map((item: any) => (
                              <p key={item.dataKey} className="text-sm">
                                <span
                                  style={{ color: item.stroke }}
                                  className="mr-2"
                                >
                                  ●
                                </span>
                                {item.dataKey}: {item.value}
                              </p>
                            ))}
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="apiCalls"
                    name="API Calls"
                    stroke="#3b82f6"
                    activeDot={{ r: 8 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="storageUsedMB"
                    name="Storage (MB)"
                    stroke="#10b981"
                    activeDot={{ r: 8 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Summary Statistics */}
          <Card>
            <CardHeader>
              <CardTitle>Summary Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold">{filteredHistory.length}</p>
                  <p className="text-sm text-gray-500">Days Tracked</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">
                    {filteredHistory.reduce(
                      (sum, day) => sum + day.apiCalls,
                      0,
                    )}
                  </p>
                  <p className="text-sm text-gray-500">Total API Calls</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">
                    {filteredHistory
                      .reduce((sum, day) => sum + day.storageUsedMB, 0)
                      .toFixed(2)}
                  </p>
                  <p className="text-sm text-gray-500">Total Storage (MB)</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">
                    {filteredHistory.length > 0
                      ? (
                          filteredHistory.reduce(
                            (sum, day) => sum + day.apiCalls,
                            0,
                          ) / filteredHistory.length
                        ).toFixed(1)
                      : "0"}
                  </p>
                  <p className="text-sm text-gray-500">Avg Daily Calls</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === "billing" && (
        <div className="space-y-8">
          {/* Billing Cycle Progress */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calendar className="h-5 w-5 text-blue-500 mr-2" />
                Billing Cycle Progress
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-500">
                      Cycle:{" "}
                      {new Date(
                        usageData.billing.currentCycleStart,
                      ).toLocaleDateString()}{" "}
                      to{" "}
                      {new Date(
                        usageData.billing.currentCycleEnd,
                      ).toLocaleDateString()}
                    </span>
                    <span className="text-sm font-semibold">
                      {billingCycleProgress.daysPassed}% Complete
                    </span>
                  </div>
                  <Progress
                    value={billingCycleProgress.daysPassed}
                    className="h-3 bg-blue-500"
                  />
                  <p className="text-sm text-gray-500 mt-2">
                    {billingCycleProgress.daysRemaining} days remaining in this
                    billing cycle
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">
                      Payment Method
                    </p>
                    <div className="flex items-center">
                      <CreditCard className="h-4 w-4 text-gray-400 mr-2" />
                      <span>{usageData.billing.paymentMethod}</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">
                      Next Payment
                    </p>
                    <p>
                      {new Date(
                        usageData.billing.nextPaymentDate,
                      ).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Plan Comparison */}
          <Card>
            <CardHeader>
              <CardTitle>Plan Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h3 className="font-semibold mb-3">
                    Current Plan: {usageData.subscription.name}
                  </h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="font-medium">Included Features:</p>
                      <ul className="space-y-1 mt-2 text-gray-600">
                        <li>
                          •{" "}
                          {usageData.subscription.maxApiCalls.toLocaleString()}{" "}
                          API calls/month
                        </li>
                        <li>
                          • {usageData.subscription.maxStorageMB} MB storage
                        </li>
                        <li>
                          • {usageData.subscription.maxUsers} team members
                        </li>
                        <li>• {usageData.subscription.maxProjects} projects</li>
                      </ul>
                    </div>
                    <div>
                      <p className="font-medium">Billing:</p>
                      <ul className="space-y-1 mt-2 text-gray-600">
                        <li>
                          • ${usageData.subscription.price} per{" "}
                          {usageData.subscription.billingCycle}
                        </li>
                        <li>
                          •{" "}
                          {usageData.subscription.billingCycle === "annual"
                            ? "10%"
                            : "0"}{" "}
                          discount for annual billing
                        </li>
                        <li>• Cancel anytime</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end space-x-3">
                  <Button variant="outline">Downgrade Plan</Button>
                  <Button>Upgrade Plan</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
