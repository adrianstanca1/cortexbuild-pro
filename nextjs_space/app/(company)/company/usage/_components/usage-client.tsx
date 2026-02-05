"use client";

import {
  Users,
  FolderKanban,
  HardDrive,
  FileText,
  Image,
  File,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import type { Entitlements } from "@/lib/entitlements";

interface UsageClientProps {
  usageData: {
    teamMembers: number;
    maxUsers: number;
    projects: number;
    maxProjects: number;
    storageUsedBytes: number;
    storageGB: number;
    documentsCount: number;
    documentsByType: Record<string, number>;
    totalDocumentSize: number;
    projectsByStatus: Record<string, number>;
  };
  entitlements: Entitlements;
}

export function UsageClient({ usageData, entitlements }: UsageClientProps) {
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const storageUsedGB = usageData.storageUsedBytes / (1024 * 1024 * 1024);
  
  const usagePercent = {
    users: Math.round((usageData.teamMembers / usageData.maxUsers) * 100),
    projects: Math.round((usageData.projects / usageData.maxProjects) * 100),
    storage: Math.round((storageUsedGB / usageData.storageGB) * 100),
  };

  const getUsageStatus = (percent: number) => {
    if (percent >= 90) return { color: "text-red-600", bgColor: "bg-red-500", status: "Critical" };
    if (percent >= 75) return { color: "text-amber-600", bgColor: "bg-amber-500", status: "Warning" };
    return { color: "text-emerald-600", bgColor: "bg-emerald-500", status: "Healthy" };
  };

  const documentTypeIcons: Record<string, any> = {
    PLANS: FileText,
    PERMITS: File,
    PHOTOS: Image,
    REPORTS: FileText,
    OTHER: File,
  };

  const projectStatusColors: Record<string, string> = {
    PLANNING: "bg-blue-100 text-blue-700",
    IN_PROGRESS: "bg-amber-100 text-amber-700",
    ON_HOLD: "bg-gray-100 text-gray-700",
    COMPLETED: "bg-emerald-100 text-emerald-700",
    ARCHIVED: "bg-purple-100 text-purple-700",
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Usage & Limits</h1>
        <p className="text-gray-500 mt-1">Monitor your organization&apos;s resource usage</p>
      </div>

      {/* Main Usage Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Team Members */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-5 w-5 text-emerald-600" />
              Team Members
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-3xl font-bold text-gray-900">{usageData.teamMembers}</p>
                  <p className="text-sm text-gray-500">of {usageData.maxUsers} seats</p>
                </div>
                <Badge className={getUsageStatus(usagePercent.users).color === "text-red-600" ? "bg-red-100 text-red-700" : getUsageStatus(usagePercent.users).color === "text-amber-600" ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"}>
                  {getUsageStatus(usagePercent.users).status}
                </Badge>
              </div>
              <Progress value={usagePercent.users} className="h-2" />
              <p className="text-xs text-gray-400">
                {usageData.maxUsers - usageData.teamMembers} seats remaining
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Projects */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <FolderKanban className="h-5 w-5 text-blue-600" />
              Projects
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-3xl font-bold text-gray-900">{usageData.projects}</p>
                  <p className="text-sm text-gray-500">of {usageData.maxProjects} projects</p>
                </div>
                <Badge className={getUsageStatus(usagePercent.projects).color === "text-red-600" ? "bg-red-100 text-red-700" : getUsageStatus(usagePercent.projects).color === "text-amber-600" ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"}>
                  {getUsageStatus(usagePercent.projects).status}
                </Badge>
              </div>
              <Progress value={usagePercent.projects} className="h-2" />
              <p className="text-xs text-gray-400">
                {usageData.maxProjects - usageData.projects} projects remaining
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Storage */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <HardDrive className="h-5 w-5 text-purple-600" />
              Storage
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-3xl font-bold text-gray-900">{storageUsedGB.toFixed(2)} GB</p>
                  <p className="text-sm text-gray-500">of {usageData.storageGB} GB</p>
                </div>
                <Badge className={getUsageStatus(usagePercent.storage).color === "text-red-600" ? "bg-red-100 text-red-700" : getUsageStatus(usagePercent.storage).color === "text-amber-600" ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"}>
                  {getUsageStatus(usagePercent.storage).status}
                </Badge>
              </div>
              <Progress value={usagePercent.storage} className="h-2" />
              <p className="text-xs text-gray-400">
                {(usageData.storageGB - storageUsedGB).toFixed(2)} GB remaining
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Documents Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Documents by Type</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(usageData.documentsByType).length === 0 ? (
                <p className="text-gray-500 text-center py-4">No documents uploaded yet</p>
              ) : (
                Object.entries(usageData.documentsByType).map(([type, count]) => {
                  const Icon = documentTypeIcons[type] || File;
                  return (
                    <div key={type} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center">
                          <Icon className="h-5 w-5 text-gray-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{type.replace("_", " ")}</p>
                          <p className="text-xs text-gray-500">{count} files</p>
                        </div>
                      </div>
                      <Badge variant="outline">{count}</Badge>
                    </div>
                  );
                })
              )}
              <div className="pt-4 border-t">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Total Documents</span>
                  <span className="font-medium">{usageData.documentsCount}</span>
                </div>
                <div className="flex items-center justify-between text-sm mt-1">
                  <span className="text-gray-500">Total Size</span>
                  <span className="font-medium">{formatBytes(usageData.totalDocumentSize)}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Projects by Status */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Projects by Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(usageData.projectsByStatus).length === 0 ? (
                <p className="text-gray-500 text-center py-4">No projects created yet</p>
              ) : (
                Object.entries(usageData.projectsByStatus).map(([status, count]) => (
                  <div key={status} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Badge className={projectStatusColors[status] || "bg-gray-100"}>
                        {status.replace("_", " ")}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="w-32 bg-gray-100 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${projectStatusColors[status]?.includes("emerald") ? "bg-emerald-500" : projectStatusColors[status]?.includes("amber") ? "bg-amber-500" : projectStatusColors[status]?.includes("blue") ? "bg-blue-500" : "bg-gray-400"}`}
                          style={{ width: `${(count / usageData.projects) * 100}%` }}
                        />
                      </div>
                      <span className="font-medium w-8 text-right">{count}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Enabled Modules */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Enabled Modules</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {Object.entries(entitlements.modules).map(([key, enabled]) => (
              <div
                key={key}
                className={`flex items-center gap-2 p-3 rounded-lg border ${
                  enabled ? "bg-emerald-50 border-emerald-200" : "bg-gray-50 border-gray-200 opacity-50"
                }`}
              >
                {enabled ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-gray-400 flex-shrink-0" />
                )}
                <span className="text-sm font-medium capitalize">
                  {key.replace(/([A-Z])/g, " $1").trim()}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
