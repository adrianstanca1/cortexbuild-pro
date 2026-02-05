"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Settings,
  Shield,
  Bell,
  Zap,
  Database,
  Globe,
  Lock,
  RefreshCw,
  Save,
  ArrowLeft,
  AlertTriangle,
  Users,
  FolderKanban,
  HardDrive,
  Palette,
  LayoutGrid,
  Server,
  Download,
  Upload,
  RotateCcw,
  Activity,
  Clock,
  Wrench
} from "lucide-react";
import {  Card, CardContent, CardDescription , CardHeader, CardTitle } from '@/components/ui/card'";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import Link from "next/link";
import { toast } from "sonner";

interface PlatformConfig {
  maintenanceMode: boolean;
  maintenanceMessage: string;
  allowSignups: boolean;
  maxProjectsPerOrg: number;
  maxUsersPerOrg: number;
  maxStoragePerOrg: number;
  features: {
    aiAssistant: boolean;
    realTimeUpdates: boolean;
    webhooks: boolean;
    apiAccess: boolean;
    advancedReports: boolean;
    documentViewer: boolean;
    ganttChart: boolean;
    timeTracking: boolean;
    budgetManagement: boolean;
    safetyModule: boolean;
  };
  notifications: {
    emailEnabled: boolean;
    slackEnabled: boolean;
    webhooksEnabled: boolean;
    pushEnabled: boolean;
  };
  security: {
    mfaRequired: boolean;
    sessionTimeout: number;
    passwordMinLength: number;
    maxLoginAttempts: number;
    passwordExpireDays: number;
    requireSpecialChars: boolean;
    ipWhitelist: string[];
    auditLogRetentionDays: number;
  };
  branding: {
    platformName: string;
    primaryColor: string;
    logoUrl: string;
    faviconUrl: string;
    supportEmail: string;
    supportUrl: string;
  };
  limits: {
    maxFileSize: number;
    maxDocumentsPerProject: number;
    maxTasksPerProject: number;
    maxTeamMembersPerProject: number;
    apiRateLimit: number;
    maxConcurrentUploads: number;
  };
  modules: {
    projects: boolean;
    tasks: boolean;
    documents: boolean;
    rfis: boolean;
    submittals: boolean;
    dailyReports: boolean;
    safety: boolean;
    changeOrders: boolean;
    punchLists: boolean;
    meetings: boolean;
    equipment: boolean;
    materials: boolean;
    budget: boolean;
    timeTracking: boolean;
  };
}

interface Usage {
  organizations: number;
  users: number;
  projects: number;
  documents: number;
  tasks: number;
  rfis: number;
  submittals: number;
  activeUsersToday: number;
  activeUsersWeek: number;
  recentActivities: number;
  storageUsed: number;
}

interface PlatformInfo {
  version: string;
  buildDate: string;
  environment: string;
  serverTime: string;
}

export function PlatformSettingsClient() {
  const [config, setConfig] = useState<PlatformConfig | null>(null);
  const [usage, setUsage] = useState<Usage | null>(null);
  const [platformInfo, setPlatformInfo] = useState<PlatformInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importData, setImportData] = useState("");
  const [activeTab, setActiveTab] = useState("general");

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const res = await fetch("/api/admin/platform-config");
      if (res.ok) {
        const data = await res.json();
        setConfig(data.config);
        setUsage(data.usage);
        setPlatformInfo({
          version: data.version,
          buildDate: data.buildDate,
          environment: data.environment,
          serverTime: data.serverTime
        });
      }
    } catch {
      console.error("Error fetching config:", error);
      toast.error("Failed to load platform configuration");
    } finally {
      setLoading(false);
    }
  };

  const updateConfig = (path: string, value: any) => {
    if (!config) return;
    
    const newConfig = JSON.parse(JSON.stringify(config));
    const keys = path.split(".");
    let current: any = newConfig;
    
    for (let i = 0; i < keys.length - 1; i++) {
      if (!current[keys[i]]) current[keys[i]] = {};
      current = current[keys[i]];
    }
    current[keys[keys.length - 1]] = value;
    
    setConfig(newConfig);
    setHasChanges(true);
  };

  const saveConfig = async () => {
    if (!config) return;
    
    setSaving(true);
    try {
      const res = await fetch("/api/admin/platform-config", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config)
      });
      
      if (res.ok) {
        toast.success("Platform configuration saved successfully");
        setHasChanges(false);
      } else {
        const error = await res.json();
        toast.error(error.error || "Failed to save configuration");
      }
    } catch {
      console.error("Error saving config:", error);
      toast.error("Failed to save configuration");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/platform-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reset" })
      });
      
      if (res.ok) {
        const data = await res.json();
        setConfig(data.config);
        setHasChanges(false);
        toast.success("Configuration reset to defaults");
      }
    } catch {
      toast.error("Failed to reset configuration");
    } finally {
      setSaving(false);
      setShowResetModal(false);
    }
  };

  const handleExport = async () => {
    try {
      const res = await fetch("/api/admin/platform-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "export" })
      });
      
      if (res.ok) {
        const data = await res.json();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `platform-config-${new Date().toISOString().split("T")[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success("Configuration exported");
      }
    } catch {
      toast.error("Failed to export configuration");
    }
    setShowExportModal(false);
  };

  const handleImport = async () => {
    try {
      const parsed = JSON.parse(importData);
      const configData = parsed.config || parsed;
      
      const res = await fetch("/api/admin/platform-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "import", data: configData })
      });
      
      if (res.ok) {
        const data = await res.json();
        setConfig(data.config);
        setHasChanges(false);
        toast.success("Configuration imported successfully");
      }
    } catch {
      toast.error("Invalid configuration format");
    }
    setShowImportModal(false);
    setImportData("");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <RefreshCw className="h-8 w-8 animate-spin text-purple-500" />
      </div>
    );
  }

  if (!config) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Failed to load platform configuration</p>
        <Button onClick={fetchConfig} className="mt-4">Retry</Button>
      </div>
    );
  }

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  };

  const formatNumber = (num: number) => num.toLocaleString();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <Link href="/admin">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Platform Settings</h1>
            <p className="text-gray-500 mt-1">Configure platform-wide settings, features, and security</p>
          </div>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {hasChanges && (
            <Badge variant="outline" className="animate-pulse bg-yellow-50 text-yellow-700 border-yellow-300">
              <AlertTriangle className="h-3 w-3 mr-1" />
              Unsaved changes
            </Badge>
          )}
          <Button variant="outline" onClick={() => setShowExportModal(true)} size="sm">
            <Download className="h-4 w-4 mr-2" />Export
          </Button>
          <Button variant="outline" onClick={() => setShowImportModal(true)} size="sm">
            <Upload className="h-4 w-4 mr-2" />Import
          </Button>
          <Button variant="outline" onClick={() => setShowResetModal(true)} size="sm">
            <RotateCcw className="h-4 w-4 mr-2" />Reset
          </Button>
          <Button onClick={saveConfig} disabled={saving || !hasChanges}>
            {saving ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            Save Changes
          </Button>
        </div>
      </div>

      {/* Platform Info Bar */}
      {platformInfo && (
        <Card className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950/30 dark:to-blue-950/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <Server className="h-4 w-4 text-purple-600" />
                  <span className="text-sm text-gray-600 dark:text-gray-300">Version:</span>
                  <Badge variant="secondary">{platformInfo.version}</Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-gray-600 dark:text-gray-300">Environment:</span>
                  <Badge variant="outline" className="capitalize">{platformInfo.environment}</Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-blue-600" />
                  <span className="text-sm text-gray-600 dark:text-gray-300">Build:</span>
                  <span className="text-sm font-medium">{platformInfo.buildDate}</span>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={fetchConfig}>
                <RefreshCw className="h-4 w-4 mr-1" />Refresh
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Usage Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">Organizations</p>
                <p className="text-xl font-bold">{formatNumber(usage?.organizations ?? 0)}</p>
              </div>
              <Globe className="h-6 w-6 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">Users</p>
                <p className="text-xl font-bold">{formatNumber(usage?.users ?? 0)}</p>
              </div>
              <Users className="h-6 w-6 text-purple-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">Projects</p>
                <p className="text-xl font-bold">{formatNumber(usage?.projects ?? 0)}</p>
              </div>
              <FolderKanban className="h-6 w-6 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">Tasks</p>
                <p className="text-xl font-bold">{formatNumber(usage?.tasks ?? 0)}</p>
              </div>
              <LayoutGrid className="h-6 w-6 text-orange-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">Active Today</p>
                <p className="text-xl font-bold">{formatNumber(usage?.activeUsersToday ?? 0)}</p>
              </div>
              <Activity className="h-6 w-6 text-emerald-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">Storage</p>
                <p className="text-xl font-bold">{formatBytes(usage?.storageUsed ?? 0)}</p>
              </div>
              <HardDrive className="h-6 w-6 text-pink-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Maintenance Mode Warning */}
      {config.maintenanceMode && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="border-red-500 bg-red-50 dark:bg-red-950/20">
            <CardContent className="p-4 flex items-center gap-4">
              <AlertTriangle className="h-8 w-8 text-red-500 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="font-semibold text-red-700 dark:text-red-400">Maintenance Mode Active</h3>
                <p className="text-sm text-red-600 dark:text-red-300">{config.maintenanceMessage}</p>
              </div>
              <Button variant="destructive" size="sm" onClick={() => updateConfig("maintenanceMode", false)}>
                Disable
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Settings Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-3 lg:grid-cols-7 mb-6">
          <TabsTrigger value="general"><Settings className="h-4 w-4 mr-2" />General</TabsTrigger>
          <TabsTrigger value="features"><Zap className="h-4 w-4 mr-2" />Features</TabsTrigger>
          <TabsTrigger value="modules"><LayoutGrid className="h-4 w-4 mr-2" />Modules</TabsTrigger>
          <TabsTrigger value="security"><Shield className="h-4 w-4 mr-2" />Security</TabsTrigger>
          <TabsTrigger value="limits"><Database className="h-4 w-4 mr-2" />Limits</TabsTrigger>
          <TabsTrigger value="notifications"><Bell className="h-4 w-4 mr-2" />Notifications</TabsTrigger>
          <TabsTrigger value="branding"><Palette className="h-4 w-4 mr-2" />Branding</TabsTrigger>
        </TabsList>

        {/* General Tab */}
        <TabsContent value="general">
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wrench className="h-5 w-5" />Maintenance
                </CardTitle>
                <CardDescription>Control platform availability and maintenance mode</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Maintenance Mode</Label>
                    <p className="text-sm text-gray-500">Take platform offline for maintenance</p>
                  </div>
                  <Switch
                    checked={config.maintenanceMode}
                    onCheckedChange={(checked) => updateConfig("maintenanceMode", checked)}
                  />
                </div>
                <div>
                  <Label>Maintenance Message</Label>
                  <Textarea
                    value={config.maintenanceMessage}
                    onChange={(e) => updateConfig("maintenanceMessage", e.target.value)}
                    placeholder="Message shown to users during maintenance"
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />Registration
                </CardTitle>
                <CardDescription>Control user registration and signup settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Allow Signups</Label>
                    <p className="text-sm text-gray-500">Allow new user registrations</p>
                  </div>
                  <Switch
                    checked={config.allowSignups}
                    onCheckedChange={(checked) => updateConfig("allowSignups", checked)}
                  />
                </div>
                <div>
                  <Label>Max Users Per Organization</Label>
                  <Input
                    type="number"
                    value={config.maxUsersPerOrg}
                    onChange={(e) => updateConfig("maxUsersPerOrg", parseInt(e.target.value) || 0)}
                    min={1}
                    max={10000}
                  />
                </div>
                <div>
                  <Label>Max Projects Per Organization</Label>
                  <Input
                    type="number"
                    value={config.maxProjectsPerOrg}
                    onChange={(e) => updateConfig("maxProjectsPerOrg", parseInt(e.target.value) || 0)}
                    min={1}
                    max={10000}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Features Tab */}
        <TabsContent value="features">
          <Card>
            <CardHeader>
              <CardTitle>Platform Features</CardTitle>
              <CardDescription>Enable or disable platform-wide features</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Object.entries(config.features).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <Label className="capitalize">{key.replace(/([A-Z])/g, " $1").trim()}</Label>
                    </div>
                    <Switch
                      checked={value}
                      onCheckedChange={(checked) => updateConfig(`features.${key}`, checked)}
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Modules Tab */}
        <TabsContent value="modules">
          <Card>
            <CardHeader>
              <CardTitle>Platform Modules</CardTitle>
              <CardDescription>Enable or disable construction management modules</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Object.entries(config.modules).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <Label className="capitalize">{key.replace(/([A-Z])/g, " $1").trim()}</Label>
                    </div>
                    <Switch
                      checked={value}
                      onCheckedChange={(checked) => updateConfig(`modules.${key}`, checked)}
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security">
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="h-5 w-5" />Authentication
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Require MFA</Label>
                    <p className="text-sm text-gray-500">Enforce multi-factor authentication</p>
                  </div>
                  <Switch
                    checked={config.security.mfaRequired}
                    onCheckedChange={(checked) => updateConfig("security.mfaRequired", checked)}
                  />
                </div>
                <div>
                  <Label>Session Timeout (seconds)</Label>
                  <Input
                    type="number"
                    value={config.security.sessionTimeout}
                    onChange={(e) => updateConfig("security.sessionTimeout", parseInt(e.target.value) || 3600)}
                    min={300}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {Math.floor(config.security.sessionTimeout / 3600)}h {Math.floor((config.security.sessionTimeout % 3600) / 60)}m
                  </p>
                </div>
                <div>
                  <Label>Max Login Attempts</Label>
                  <Input
                    type="number"
                    value={config.security.maxLoginAttempts}
                    onChange={(e) => updateConfig("security.maxLoginAttempts", parseInt(e.target.value) || 5)}
                    min={3}
                    max={20}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />Password Policy
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Minimum Password Length</Label>
                  <Input
                    type="number"
                    value={config.security.passwordMinLength}
                    onChange={(e) => updateConfig("security.passwordMinLength", parseInt(e.target.value) || 8)}
                    min={6}
                    max={32}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Require Special Characters</Label>
                    <p className="text-sm text-gray-500">Require @, #, $, etc. in passwords</p>
                  </div>
                  <Switch
                    checked={config.security.requireSpecialChars}
                    onCheckedChange={(checked) => updateConfig("security.requireSpecialChars", checked)}
                  />
                </div>
                <div>
                  <Label>Password Expiry (days)</Label>
                  <Input
                    type="number"
                    value={config.security.passwordExpireDays}
                    onChange={(e) => updateConfig("security.passwordExpireDays", parseInt(e.target.value) || 0)}
                    min={0}
                  />
                  <p className="text-xs text-gray-500 mt-1">0 = Never expires</p>
                </div>
                <div>
                  <Label>Audit Log Retention (days)</Label>
                  <Input
                    type="number"
                    value={config.security.auditLogRetentionDays}
                    onChange={(e) => updateConfig("security.auditLogRetentionDays", parseInt(e.target.value) || 90)}
                    min={30}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Limits Tab */}
        <TabsContent value="limits">
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Storage Limits</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Max Storage Per Org (bytes)</Label>
                  <Input
                    type="number"
                    value={config.maxStoragePerOrg}
                    onChange={(e) => updateConfig("maxStoragePerOrg", parseInt(e.target.value) || 10737418240)}
                  />
                  <p className="text-xs text-gray-500 mt-1">{formatBytes(config.maxStoragePerOrg)}</p>
                </div>
                <div>
                  <Label>Max File Size (bytes)</Label>
                  <Input
                    type="number"
                    value={config.limits.maxFileSize}
                    onChange={(e) => updateConfig("limits.maxFileSize", parseInt(e.target.value) || 104857600)}
                  />
                  <p className="text-xs text-gray-500 mt-1">{formatBytes(config.limits.maxFileSize)}</p>
                </div>
                <div>
                  <Label>Max Concurrent Uploads</Label>
                  <Input
                    type="number"
                    value={config.limits.maxConcurrentUploads}
                    onChange={(e) => updateConfig("limits.maxConcurrentUploads", parseInt(e.target.value) || 5)}
                    min={1}
                    max={20}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Resource Limits</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Max Documents Per Project</Label>
                  <Input
                    type="number"
                    value={config.limits.maxDocumentsPerProject}
                    onChange={(e) => updateConfig("limits.maxDocumentsPerProject", parseInt(e.target.value) || 1000)}
                    min={100}
                  />
                </div>
                <div>
                  <Label>Max Tasks Per Project</Label>
                  <Input
                    type="number"
                    value={config.limits.maxTasksPerProject}
                    onChange={(e) => updateConfig("limits.maxTasksPerProject", parseInt(e.target.value) || 5000)}
                    min={100}
                  />
                </div>
                <div>
                  <Label>Max Team Members Per Project</Label>
                  <Input
                    type="number"
                    value={config.limits.maxTeamMembersPerProject}
                    onChange={(e) => updateConfig("limits.maxTeamMembersPerProject", parseInt(e.target.value) || 100)}
                    min={5}
                  />
                </div>
                <div>
                  <Label>API Rate Limit (requests/hour)</Label>
                  <Input
                    type="number"
                    value={config.limits.apiRateLimit}
                    onChange={(e) => updateConfig("limits.apiRateLimit", parseInt(e.target.value) || 1000)}
                    min={100}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Notification Channels</CardTitle>
              <CardDescription>Configure notification delivery channels</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                {Object.entries(config.notifications).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <Label className="capitalize">{key.replace(/([A-Z])/g, " $1").replace("Enabled", "").trim()}</Label>
                      <p className="text-sm text-gray-500">Enable {key.replace(/([A-Z])/g, " $1").toLowerCase().replace("enabled", "notifications")}</p>
                    </div>
                    <Switch
                      checked={value}
                      onCheckedChange={(checked) => updateConfig(`notifications.${key}`, checked)}
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Branding Tab */}
        <TabsContent value="branding">
          <Card>
            <CardHeader>
              <CardTitle>Platform Branding</CardTitle>
              <CardDescription>Customize platform appearance and contact information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <Label>Platform Name</Label>
                  <Input
                    value={config.branding.platformName}
                    onChange={(e) => updateConfig("branding.platformName", e.target.value)}
                    placeholder="CortexBuild Pro"
                  />
                </div>
                <div>
                  <Label>Primary Color</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={config.branding.primaryColor}
                      onChange={(e) => updateConfig("branding.primaryColor", e.target.value)}
                      className="w-16 h-10 p-1"
                    />
                    <Input
                      value={config.branding.primaryColor}
                      onChange={(e) => updateConfig("branding.primaryColor", e.target.value)}
                      placeholder="#7c3aed"
                    />
                  </div>
                </div>
                <div>
                  <Label>Logo URL</Label>
                  <Input
                    value={config.branding.logoUrl}
                    onChange={(e) => updateConfig("branding.logoUrl", e.target.value)}
                    placeholder="https://lookaside.instagram.com/seo/google_widget/crawler/?media_id=3500049644225635282"
                  />
                </div>
                <div>
                  <Label>Favicon URL</Label>
                  <Input
                    value={config.branding.faviconUrl}
                    onChange={(e) => updateConfig("branding.faviconUrl", e.target.value)}
                    placeholder="https://upload.wikimedia.org/wikipedia/commons/2/22/Wikipedia_favicon_in_Firefox_on_KDE_%282023%29.png"
                  />
                </div>
                <div>
                  <Label>Support Email</Label>
                  <Input
                    type="email"
                    value={config.branding.supportEmail}
                    onChange={(e) => updateConfig("branding.supportEmail", e.target.value)}
                    placeholder="support@example.com"
                  />
                </div>
                <div>
                  <Label>Support URL</Label>
                  <Input
                    value={config.branding.supportUrl}
                    onChange={(e) => updateConfig("branding.supportUrl", e.target.value)}
                    placeholder="https://support.example.com"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Reset Confirmation Modal */}
      <Dialog open={showResetModal} onOpenChange={setShowResetModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset Configuration</DialogTitle>
            <DialogDescription>
              Are you sure you want to reset all settings to their default values? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowResetModal(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleReset} disabled={saving}>
              {saving ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <RotateCcw className="h-4 w-4 mr-2" />}
              Reset to Defaults
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Export Modal */}
      <Dialog open={showExportModal} onOpenChange={setShowExportModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Export Configuration</DialogTitle>
            <DialogDescription>
              Export the current platform configuration as a JSON file for backup or migration.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowExportModal(false)}>Cancel</Button>
            <Button onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" />Download JSON
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Import Modal */}
      <Dialog open={showImportModal} onOpenChange={setShowImportModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Import Configuration</DialogTitle>
            <DialogDescription>
              Paste a previously exported configuration JSON to import settings.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={importData}
            onChange={(e) => setImportData(e.target.value)}
            placeholder="Paste JSON configuration here..."
            rows={10}
            className="font-mono text-sm"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowImportModal(false); setImportData(""); }}>Cancel</Button>
            <Button onClick={handleImport} disabled={!importData.trim()}>
              <Upload className="h-4 w-4 mr-2" />Import Configuration
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}