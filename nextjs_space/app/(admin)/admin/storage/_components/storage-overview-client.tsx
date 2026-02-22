"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Database,
  HardDrive,
  FileText,
  Image,
  Paperclip,
  RefreshCw,
  Building2,
  FolderKanban,
  Users,
  ListTodo,
  Server,
  Cloud,
  Shield
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

interface StorageStats {
  totals: {
    users: number;
    organizations: number;
    projects: number;
    tasks: number;
    documents: number;
    rfis: number;
    submittals: number;
    changeOrders: number;
    safetyIncidents: number;
    dailyReports: number;
    activities: number;
  };
  storage: {
    totalDocuments: number;
    totalPhotos: number;
    totalAttachments: number;
  };
  organizations: {
    id: string;
    name: string;
    userCount: number;
    projectCount: number;
  }[];
}

export function StorageOverviewClient() {
  const [stats, setStats] = useState<StorageStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStats = async () => {
    try {
      const res = await fetch("/api/admin/stats");
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchStats();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <RefreshCw className="h-8 w-8 animate-spin text-purple-500" />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Failed to load storage data</p>
        <Button onClick={fetchStats} className="mt-4">Retry</Button>
      </div>
    );
  }

  const totalFiles = stats.storage.totalDocuments + stats.storage.totalPhotos + stats.storage.totalAttachments;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Storage & Data Overview
          </h1>
          <p className="text-gray-500 mt-1">Platform storage and database statistics</p>
        </div>
        <Button onClick={handleRefresh} variant="outline" disabled={refreshing}>
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Storage Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm">S3 Cloud Storage</p>
                  <p className="text-3xl font-bold mt-1">{totalFiles}</p>
                  <p className="text-blue-200 text-sm mt-2">Total Files Stored</p>
                </div>
                <Cloud className="h-12 w-12 text-blue-300" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm">Database Records</p>
                  <p className="text-3xl font-bold mt-1">
                    {Object.values(stats.totals).reduce((a, b) => a + b, 0).toLocaleString()}
                  </p>
                  <p className="text-purple-200 text-sm mt-2">PostgreSQL</p>
                </div>
                <Database className="h-12 w-12 text-purple-300" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm">Organizations</p>
                  <p className="text-3xl font-bold mt-1">{stats.totals.organizations}</p>
                  <p className="text-green-200 text-sm mt-2">Multi-tenant Isolation</p>
                </div>
                <Shield className="h-12 w-12 text-green-300" />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* File Storage Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HardDrive className="h-5 w-5 text-blue-500" />
              File Storage Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-blue-500" />
                    <span className="font-medium">Documents</span>
                  </div>
                  <span className="text-gray-500">{stats.storage.totalDocuments}</span>
                </div>
                <Progress 
                  value={totalFiles > 0 ? (stats.storage.totalDocuments / totalFiles) * 100 : 0} 
                  className="h-3" 
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Image className="h-4 w-4 text-green-500" />
                    <span className="font-medium">Photos</span>
                  </div>
                  <span className="text-gray-500">{stats.storage.totalPhotos}</span>
                </div>
                <Progress 
                  value={totalFiles > 0 ? (stats.storage.totalPhotos / totalFiles) * 100 : 0} 
                  className="h-3" 
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Paperclip className="h-4 w-4 text-orange-500" />
                    <span className="font-medium">Attachments</span>
                  </div>
                  <span className="text-gray-500">{stats.storage.totalAttachments}</span>
                </div>
                <Progress 
                  value={totalFiles > 0 ? (stats.storage.totalAttachments / totalFiles) * 100 : 0} 
                  className="h-3" 
                />
              </div>

              <div className="pt-4 border-t">
                <div className="flex items-center justify-between">
                  <span className="font-semibold">Total Files</span>
                  <Badge variant="secondary" className="text-lg px-3 py-1">{totalFiles}</Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5 text-purple-500" />
              Database Tables
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: "Users", value: stats.totals.users, icon: Users, color: "text-purple-500" },
                { label: "Organizations", value: stats.totals.organizations, icon: Building2, color: "text-blue-500" },
                { label: "Projects", value: stats.totals.projects, icon: FolderKanban, color: "text-green-500" },
                { label: "Tasks", value: stats.totals.tasks, icon: ListTodo, color: "text-orange-500" },
                { label: "Documents", value: stats.totals.documents, icon: FileText, color: "text-blue-500" },
                { label: "RFIs", value: stats.totals.rfis, icon: FileText, color: "text-purple-500" },
                { label: "Submittals", value: stats.totals.submittals, icon: FileText, color: "text-green-500" },
                { label: "Change Orders", value: stats.totals.changeOrders, icon: FileText, color: "text-red-500" },
                { label: "Safety Incidents", value: stats.totals.safetyIncidents, icon: Shield, color: "text-red-500" },
                { label: "Daily Reports", value: stats.totals.dailyReports, icon: FileText, color: "text-teal-500" },
                { label: "Activity Logs", value: stats.totals.activities, icon: Server, color: "text-gray-500" }
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.label} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Icon className={`h-4 w-4 ${item.color}`} />
                      <span className="text-sm">{item.label}</span>
                    </div>
                    <Badge variant="outline">{item.value}</Badge>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Storage by Organization */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-blue-500" />
            Storage by Organization
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-medium text-gray-500">Organization</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-500">Users</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-500">Projects</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-500">Status</th>
                </tr>
              </thead>
              <tbody>
                {stats.organizations.map((org) => (
                  <tr key={org.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                          <Building2 className="h-4 w-4 text-blue-600" />
                        </div>
                        <span className="font-medium">{org.name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Badge variant="secondary">{org.userCount}</Badge>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Badge variant="outline">{org.projectCount}</Badge>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Badge className="bg-green-100 text-green-800">Active</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Infrastructure Info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Cloud className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold">AWS S3</h3>
                <p className="text-sm text-gray-500">Cloud File Storage</p>
                <Badge className="mt-2 bg-green-100 text-green-800">Connected</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-100 rounded-lg">
                <Database className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold">PostgreSQL</h3>
                <p className="text-sm text-gray-500">Database Server</p>
                <Badge className="mt-2 bg-green-100 text-green-800">Healthy</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <Server className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold">Next.js Server</h3>
                <p className="text-sm text-gray-500">Application Runtime</p>
                <Badge className="mt-2 bg-green-100 text-green-800">Running</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
