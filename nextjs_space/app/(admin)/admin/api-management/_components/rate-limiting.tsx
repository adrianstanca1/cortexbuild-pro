"use client";

import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Gauge,
  AlertTriangle,
  Settings,
  RefreshCw,
  Save,
  Trash2,
  Plus,
  Shield,
  Zap,
  Loader2
} from "lucide-react";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

interface RateLimitConfig {
  id: string;
  connectionId: string;
  connection: {
    id: string;
    name: string;
    serviceName: string;
    status: string;
  };
  requestsPerMinute: number;
  requestsPerHour: number;
  requestsPerDay: number;
  burstLimit: number;
  throttleOnLimit: boolean;
  alertOnThreshold: boolean;
  alertThreshold: number;
  currentMinuteUsage: number;
  currentHourUsage: number;
  currentDayUsage: number;
  minuteUsagePct: number;
  hourUsagePct: number;
  dayUsagePct: number;
  isNearLimit: boolean;
  isEnabled: boolean;
}

interface ApiConnection {
  id: string;
  name: string;
  serviceName: string;
  status: string;
}

export function RateLimiting() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [rateLimits, setRateLimits] = useState<RateLimitConfig[]>([]);
  const [connections, setConnections] = useState<ApiConnection[]>([]);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [selectedConfig, setSelectedConfig] = useState<RateLimitConfig | null>(null);
  const [selectedConnectionId, setSelectedConnectionId] = useState<string>("");
  const [formData, setFormData] = useState({
    requestsPerMinute: 60,
    requestsPerHour: 1000,
    requestsPerDay: 10000,
    burstLimit: 10,
    throttleOnLimit: true,
    alertOnThreshold: true,
    alertThreshold: 80,
    isEnabled: true
  });

  const fetchRateLimits = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/api-connections/rate-limits");
      if (res.ok) {
        const data = await res.json();
        setRateLimits(data.rateLimits || []);
      }
    } catch {
      console.error("Error fetching rate limits:", error);
      toast.error("Failed to fetch rate limits");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchConnections = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/api-connections");
      if (res.ok) {
        const data = await res.json();
        setConnections(data.connections || []);
      }
    } catch {
      console.error("Error fetching connections:", error);
    }
  }, []);

  useEffect(() => {
    fetchRateLimits();
    fetchConnections();
  }, [fetchRateLimits, fetchConnections]);

  const handleSaveConfig = async () => {
    const connectionId = selectedConfig?.connectionId || selectedConnectionId;
    if (!connectionId) {
      toast.error("Please select a connection");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/admin/api-connections/rate-limits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          connectionId,
          ...formData
        })
      });

      if (res.ok) {
        toast.success("Rate limit configuration saved");
        setShowConfigModal(false);
        setSelectedConfig(null);
        setSelectedConnectionId("");
        fetchRateLimits();
      } else {
        const error = await res.json();
        toast.error(error.error || "Failed to save configuration");
      }
    } catch {
      toast.error("Failed to save configuration");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteConfig = async (config: RateLimitConfig) => {
    if (!confirm(`Remove rate limit configuration for "${config.connection.name}"?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/api-connections/rate-limits?connectionId=${config.connectionId}`, {
        method: "DELETE"
      });

      if (res.ok) {
        toast.success("Rate limit configuration removed");
        fetchRateLimits();
      } else {
        toast.error("Failed to remove configuration");
      }
    } catch {
      toast.error("Failed to remove configuration");
    }
  };

  const openEditModal = (config: RateLimitConfig) => {
    setSelectedConfig(config);
    setFormData({
      requestsPerMinute: config.requestsPerMinute,
      requestsPerHour: config.requestsPerHour,
      requestsPerDay: config.requestsPerDay,
      burstLimit: config.burstLimit,
      throttleOnLimit: config.throttleOnLimit,
      alertOnThreshold: config.alertOnThreshold,
      alertThreshold: config.alertThreshold,
      isEnabled: config.isEnabled
    });
    setShowConfigModal(true);
  };

  const openNewModal = () => {
    setSelectedConfig(null);
    setSelectedConnectionId("");
    setFormData({
      requestsPerMinute: 60,
      requestsPerHour: 1000,
      requestsPerDay: 10000,
      burstLimit: 10,
      throttleOnLimit: true,
      alertOnThreshold: true,
      alertThreshold: 80,
      isEnabled: true
    });
    setShowConfigModal(true);
  };

  const getUsageColor = (pct: number, threshold: number) => {
    if (pct >= 100) return "bg-red-500";
    if (pct >= threshold) return "bg-yellow-500";
    return "bg-green-500";
  };

  // Get connections without rate limit configs
  const availableConnections = connections.filter(
    c => !rateLimits.some(rl => rl.connectionId === c.id)
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold">Rate Limiting Configuration</h3>
          <p className="text-sm text-muted-foreground">Manage request limits for your API integrations</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={fetchRateLimits}>
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button onClick={openNewModal} disabled={availableConnections.length === 0}>
            <Plus className="h-4 w-4 mr-2" />
            Configure Rate Limit
          </Button>
        </div>
      </div>

      {/* Rate Limit Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {rateLimits.map((config) => (
          <motion.div
            key={config.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className={config.isNearLimit ? "border-yellow-400" : ""}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Gauge className="h-4 w-4 text-muted-foreground" />
                    <CardTitle className="text-base">{config.connection.name}</CardTitle>
                  </div>
                  <div className="flex items-center gap-2">
                    {config.isNearLimit && (
                      <Badge variant="outline" className="text-yellow-600 border-yellow-400">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        Near Limit
                      </Badge>
                    )}
                    <Badge variant={config.isEnabled ? "default" : "secondary"}>
                      {config.isEnabled ? "Active" : "Disabled"}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Usage Meters */}
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-muted-foreground">Per Minute</span>
                        <span>{config.currentMinuteUsage} / {config.requestsPerMinute}</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all ${getUsageColor(config.minuteUsagePct, config.alertThreshold)}`}
                          style={{ width: `${Math.min(config.minuteUsagePct, 100)}%` }}
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-muted-foreground">Per Hour</span>
                        <span>{config.currentHourUsage} / {config.requestsPerHour}</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all ${getUsageColor(config.hourUsagePct, config.alertThreshold)}`}
                          style={{ width: `${Math.min(config.hourUsagePct, 100)}%` }}
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-muted-foreground">Per Day</span>
                        <span>{config.currentDayUsage} / {config.requestsPerDay}</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all ${getUsageColor(config.dayUsagePct, config.alertThreshold)}`}
                          style={{ width: `${Math.min(config.dayUsagePct, 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Settings Summary */}
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Zap className="h-3 w-3" />
                      Burst: {config.burstLimit}/s
                    </span>
                    <span className="flex items-center gap-1">
                      <Shield className="h-3 w-3" />
                      {config.throttleOnLimit ? "Throttle" : "No Throttle"}
                    </span>
                    <span className="flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      Alert @ {config.alertThreshold}%
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-2 border-t">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      onClick={() => openEditModal(config)}
                    >
                      <Settings className="h-3 w-3 mr-1" />
                      Configure
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-red-600"
                      onClick={() => handleDeleteConfig(config)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {rateLimits.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <Gauge className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No rate limit configurations</p>
          <p className="text-sm">Configure rate limits to protect your API integrations</p>
        </div>
      )}

      {/* Configure Modal */}
      <Dialog open={showConfigModal} onOpenChange={setShowConfigModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Gauge className="h-5 w-5" />
              {selectedConfig ? "Edit Rate Limit" : "Configure Rate Limit"}
            </DialogTitle>
            <DialogDescription>
              {selectedConfig
                ? `Update rate limit settings for ${selectedConfig.connection.name}`
                : "Set request limits to protect your API integration"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Connection Selector (only for new configs) */}
            {!selectedConfig && (
              <div className="space-y-2">
                <Label>API Connection</Label>
                <Select value={selectedConnectionId} onValueChange={setSelectedConnectionId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a connection" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableConnections.map((conn) => (
                      <SelectItem key={conn.id} value={conn.id}>
                        {conn.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Rate Limits */}
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="rpm">Per Minute</Label>
                <Input
                  id="rpm"
                  type="number"
                  value={formData.requestsPerMinute}
                  onChange={(e) => setFormData({ ...formData, requestsPerMinute: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="rph">Per Hour</Label>
                <Input
                  id="rph"
                  type="number"
                  value={formData.requestsPerHour}
                  onChange={(e) => setFormData({ ...formData, requestsPerHour: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="rpd">Per Day</Label>
                <Input
                  id="rpd"
                  type="number"
                  value={formData.requestsPerDay}
                  onChange={(e) => setFormData({ ...formData, requestsPerDay: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="burst">Burst Limit (per second)</Label>
                <Input
                  id="burst"
                  type="number"
                  value={formData.burstLimit}
                  onChange={(e) => setFormData({ ...formData, burstLimit: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="threshold">Alert Threshold (%)</Label>
                <Input
                  id="threshold"
                  type="number"
                  value={formData.alertThreshold}
                  onChange={(e) => setFormData({ ...formData, alertThreshold: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>

            {/* Toggles */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Throttle on Limit</Label>
                  <p className="text-xs text-muted-foreground">Slow down requests when limit is reached</p>
                </div>
                <Switch
                  checked={formData.throttleOnLimit}
                  onCheckedChange={(checked) => setFormData({ ...formData, throttleOnLimit: checked })}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Alert on Threshold</Label>
                  <p className="text-xs text-muted-foreground">Send alerts when approaching limit</p>
                </div>
                <Switch
                  checked={formData.alertOnThreshold}
                  onCheckedChange={(checked) => setFormData({ ...formData, alertOnThreshold: checked })}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Enable Rate Limiting</Label>
                  <p className="text-xs text-muted-foreground">Enforce configured limits</p>
                </div>
                <Switch
                  checked={formData.isEnabled}
                  onCheckedChange={(checked) => setFormData({ ...formData, isEnabled: checked })}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfigModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveConfig} disabled={saving}>
              {saving ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving...</>
              ) : (
                <><Save className="h-4 w-4 mr-2" /> Save Configuration</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
