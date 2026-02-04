"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Database,
  Plus,
  Search,
  Play,
  Download,
  Upload,
  RefreshCw,
  Check,
  Clock,
  AlertTriangle,
  Settings,
  History,
  Trash2,
  Eye,
  Calendar
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { format } from "date-fns";

interface BackupConfig {
  id: string;
  name: string;
  schedule: string;
  retention: number;
  enabled: boolean;
  lastRun: string | null;
  nextRun: string | null;
  backupType: "full" | "incremental" | "differential";
  createdAt: string;
}

interface BackupRecord {
  id: string;
  configId: string;
  configName: string;
  status: "success" | "failed" | "in_progress";
  size: number;
  startedAt: string;
  completedAt: string | null;
  errorMessage: string | null;
  backupType: string;
}

export function BackupRestoreClient() {
  const [configs, setConfigs] = useState<BackupConfig[]>([]);
  const [records, setRecords] = useState<BackupRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<BackupRecord | null>(null);
  const [activeTab, setActiveTab] = useState("configurations");
  const [saving, setSaving] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    schedule: "0 2 * * *",
    retention: 7,
    backupType: "full" as "full" | "incremental" | "differential",
    enabled: true
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [configsRes, recordsRes] = await Promise.all([
        fetch("/api/admin/backup/configs"),
        fetch("/api/admin/backup/records")
      ]);

      if (configsRes.ok) {
        const data = await configsRes.json();
        setConfigs(data.configs || []);
      }

      if (recordsRes.ok) {
        const data = await recordsRes.json();
        setRecords(data.records || []);
      }
    } catch (error) {
      toast.error("Failed to fetch backup data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateConfig = async () => {
    if (!formData.name) {
      toast.error("Please fill in configuration name");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/admin/backup/configs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        toast.success("Backup configuration created successfully");
        setShowCreateModal(false);
        setFormData({ name: "", schedule: "0 2 * * *", retention: 7, backupType: "full", enabled: true });
        fetchData();
      } else {
        toast.error("Failed to create backup configuration");
      }
    } catch (error) {
      toast.error("Failed to create backup configuration");
    } finally {
      setSaving(false);
    }
  };

  const handleTriggerBackup = async (configId: string) => {
    if (!confirm("Are you sure you want to trigger a backup now?")) {
      return;
    }

    setProcessing(true);
    try {
      const res = await fetch(`/api/admin/backup/configs/${configId}/trigger`, {
        method: "POST"
      });

      if (res.ok) {
        toast.success("Backup triggered successfully");
        fetchData();
      } else {
        toast.error("Failed to trigger backup");
      }
    } catch (error) {
      toast.error("Failed to trigger backup");
    } finally {
      setProcessing(false);
    }
  };

  const handleRestore = async () => {
    if (!selectedRecord) return;
    if (!confirm("Are you sure you want to restore from this backup? This will overwrite current data.")) {
      return;
    }

    setProcessing(true);
    try {
      const res = await fetch(`/api/admin/backup/restore/${selectedRecord.id}`, {
        method: "POST"
      });

      if (res.ok) {
        toast.success("Restore initiated successfully");
        setShowRestoreModal(false);
        setSelectedRecord(null);
        fetchData();
      } else {
        toast.error("Failed to initiate restore");
      }
    } catch (error) {
      toast.error("Failed to initiate restore");
    } finally {
      setProcessing(false);
    }
  };

  const handleDeleteConfig = async (configId: string) => {
    if (!confirm("Are you sure you want to delete this configuration?")) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/backup/configs/${configId}`, {
        method: "DELETE"
      });

      if (res.ok) {
        toast.success("Configuration deleted successfully");
        fetchData();
      } else {
        toast.error("Failed to delete configuration");
      }
    } catch (error) {
      toast.error("Failed to delete configuration");
    }
  };

  const handleToggleConfig = async (config: BackupConfig) => {
    try {
      const res = await fetch(`/api/admin/backup/configs/${config.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: !config.enabled })
      });

      if (res.ok) {
        toast.success(`Configuration ${!config.enabled ? "enabled" : "disabled"} successfully`);
        fetchData();
      } else {
        toast.error("Failed to update configuration");
      }
    } catch (error) {
      toast.error("Failed to update configuration");
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i];
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "success": return "bg-green-100 text-green-800";
      case "failed": return "bg-red-100 text-red-800";
      case "in_progress": return "bg-blue-100 text-blue-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <RefreshCw className="h-8 w-8 animate-spin text-purple-500" />
      </div>
    );
  }

  const successfulBackups = records.filter(r => r.status === "success").length;
  const failedBackups = records.filter(r => r.status === "failed").length;
  const totalBackupSize = records
    .filter(r => r.status === "success")
    .reduce((acc, r) => acc + r.size, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Backup & Restore
          </h1>
          <p className="text-gray-500 mt-1">Manage database backups and restore operations</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Configuration
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Active Configs</p>
                <p className="text-2xl font-bold mt-1">
                  {configs.filter(c => c.enabled).length}
                </p>
              </div>
              <Settings className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Successful Backups</p>
                <p className="text-2xl font-bold mt-1">{successfulBackups}</p>
              </div>
              <Check className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Failed Backups</p>
                <p className="text-2xl font-bold mt-1">{failedBackups}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Size</p>
                <p className="text-2xl font-bold mt-1">{formatBytes(totalBackupSize)}</p>
              </div>
              <Database className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="configurations">
            <Settings className="h-4 w-4 mr-2" />
            Configurations
          </TabsTrigger>
          <TabsTrigger value="history">
            <History className="h-4 w-4 mr-2" />
            Backup History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="configurations" className="space-y-4">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Schedule</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Retention</TableHead>
                    <TableHead>Last Run</TableHead>
                    <TableHead>Next Run</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {configs.map((config) => (
                    <TableRow key={config.id}>
                      <TableCell className="font-medium">{config.name}</TableCell>
                      <TableCell>
                        <code className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                          {config.schedule}
                        </code>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {config.backupType}
                        </Badge>
                      </TableCell>
                      <TableCell>{config.retention} days</TableCell>
                      <TableCell>
                        {config.lastRun ? (
                          <span className="text-sm">
                            {format(new Date(config.lastRun), "MMM d, HH:mm")}
                          </span>
                        ) : (
                          <span className="text-gray-400 text-sm">Never</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {config.nextRun ? (
                          <span className="text-sm">
                            {format(new Date(config.nextRun), "MMM d, HH:mm")}
                          </span>
                        ) : (
                          <span className="text-gray-400 text-sm">N/A</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge className={config.enabled ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>
                          {config.enabled ? "Enabled" : "Disabled"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleTriggerBackup(config.id)}
                            disabled={processing || !config.enabled}
                          >
                            <Play className="h-3 w-3 mr-1" />
                            Run
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleToggleConfig(config)}
                          >
                            {config.enabled ? "Disable" : "Enable"}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteConfig(config.id)}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {configs.length === 0 && (
                <div className="text-center py-12">
                  <Settings className="h-12 w-12 mx-auto text-gray-300" />
                  <p className="mt-2 text-gray-500">No backup configurations</p>
                  <Button onClick={() => setShowCreateModal(true)} className="mt-4">
                    Create Configuration
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Recent Backups</CardTitle>
                <Button variant="outline" size="sm" onClick={fetchData}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Configuration</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Size</TableHead>
                    <TableHead>Started</TableHead>
                    <TableHead>Completed</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {records.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell className="font-medium">{record.configName}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {record.backupType}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(record.status)}>
                          {record.status === "in_progress" && <Clock className="h-3 w-3 mr-1 animate-spin" />}
                          {record.status === "success" && <Check className="h-3 w-3 mr-1" />}
                          {record.status === "failed" && <AlertTriangle className="h-3 w-3 mr-1" />}
                          {record.status.replace("_", " ")}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatBytes(record.size)}</TableCell>
                      <TableCell>
                        <span className="text-sm">
                          {format(new Date(record.startedAt), "MMM d, HH:mm")}
                        </span>
                      </TableCell>
                      <TableCell>
                        {record.completedAt ? (
                          <span className="text-sm">
                            {format(new Date(record.completedAt), "MMM d, HH:mm")}
                          </span>
                        ) : (
                          <span className="text-gray-400 text-sm">In Progress</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          {record.status === "success" && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedRecord(record);
                                  setShowRestoreModal(true);
                                }}
                              >
                                <Upload className="h-3 w-3 mr-1" />
                                Restore
                              </Button>
                              <Button variant="ghost" size="sm">
                                <Download className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                          {record.status === "failed" && record.errorMessage && (
                            <Button variant="ghost" size="sm" title={record.errorMessage}>
                              <Eye className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {records.length === 0 && (
                <div className="text-center py-12">
                  <History className="h-12 w-12 mx-auto text-gray-300" />
                  <p className="mt-2 text-gray-500">No backup records</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create Configuration Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Create Backup Configuration
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label>Configuration Name *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Daily Database Backup"
              />
            </div>
            <div>
              <Label>Backup Type</Label>
              <Select
                value={formData.backupType}
                onValueChange={(value: any) => setFormData({ ...formData, backupType: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="full">Full Backup</SelectItem>
                  <SelectItem value="incremental">Incremental Backup</SelectItem>
                  <SelectItem value="differential">Differential Backup</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Schedule (Cron Expression)</Label>
              <Input
                value={formData.schedule}
                onChange={(e) => setFormData({ ...formData, schedule: e.target.value })}
                placeholder="0 2 * * *"
              />
              <p className="text-xs text-gray-500 mt-1">Example: "0 2 * * *" = Daily at 2 AM</p>
            </div>
            <div>
              <Label>Retention Period (Days)</Label>
              <Input
                type="number"
                value={formData.retention}
                onChange={(e) => setFormData({ ...formData, retention: parseInt(e.target.value) })}
                min="1"
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="enabled"
                checked={formData.enabled}
                onChange={(e) => setFormData({ ...formData, enabled: e.target.checked })}
                className="rounded"
              />
              <Label htmlFor="enabled">Enable configuration</Label>
            </div>
            <div className="flex gap-2 pt-4">
              <Button variant="outline" className="flex-1" onClick={() => setShowCreateModal(false)}>
                Cancel
              </Button>
              <Button className="flex-1" onClick={handleCreateConfig} disabled={saving}>
                {saving ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : <Check className="h-4 w-4 mr-2" />}
                Create
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Restore Modal */}
      <Dialog open={showRestoreModal} onOpenChange={setShowRestoreModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Restore from Backup
            </DialogTitle>
          </DialogHeader>
          {selectedRecord && (
            <div className="space-y-4 mt-4">
              <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-yellow-900 dark:text-yellow-100">Warning</p>
                    <p className="text-sm text-yellow-800 dark:text-yellow-200 mt-1">
                      This will restore the database to its state at the time of this backup. 
                      All current data will be overwritten. This action cannot be undone.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Configuration:</span>
                  <span className="font-medium">{selectedRecord.configName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Backup Type:</span>
                  <Badge variant="outline" className="capitalize">{selectedRecord.backupType}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Size:</span>
                  <span className="font-medium">{formatBytes(selectedRecord.size)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Created:</span>
                  <span className="font-medium">
                    {format(new Date(selectedRecord.startedAt), "MMM d, yyyy HH:mm")}
                  </span>
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button 
                  variant="outline" 
                  className="flex-1" 
                  onClick={() => {
                    setShowRestoreModal(false);
                    setSelectedRecord(null);
                  }}
                >
                  Cancel
                </Button>
                <Button 
                  className="flex-1 bg-yellow-600 hover:bg-yellow-700" 
                  onClick={handleRestore} 
                  disabled={processing}
                >
                  {processing ? (
                    <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Upload className="h-4 w-4 mr-2" />
                  )}
                  Restore
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
