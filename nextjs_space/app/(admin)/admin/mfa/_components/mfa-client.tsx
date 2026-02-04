"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Zap, RefreshCw, Edit, Save, TrendingUp, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { toast } from "sonner";

interface RateLimit {
  id: string;
  organizationId: string;
  organizationName: string;
  endpoint: string;
  maxRequests: number;
  windowSeconds: number;
  currentUsage: number;
  resetAt: string;
}

export function RateLimitsClient() {
  const [rateLimits, setRateLimits] = useState<RateLimit[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Partial<RateLimit>>({});

  const fetchRateLimits = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/rate-limits");
      if (res.ok) {
        const data = await res.json();
        setRateLimits(data.rateLimits || []);
      } else {
        toast.error("Failed to fetch rate limits");
      }
    } catch (error) {
      toast.error("Failed to fetch rate limits");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRateLimits();
  }, []);

  const handleEdit = (limit: RateLimit) => {
    setEditingId(limit.id);
    setEditValues({ maxRequests: limit.maxRequests, windowSeconds: limit.windowSeconds });
  };

  const handleSave = async (limitId: string) => {
    try {
      const res = await fetch(`/api/admin/rate-limits/${limitId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editValues)
      });

      if (res.ok) {
        toast.success("Rate limit updated successfully");
        setEditingId(null);
        fetchRateLimits();
      } else {
        toast.error("Failed to update rate limit");
      }
    } catch (error) {
      toast.error("Failed to update rate limit");
    }
  };

  const getUsagePercentage = (current: number, max: number) => {
    return max > 0 ? (current / max) * 100 : 0;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <RefreshCw className="h-8 w-8 animate-spin text-purple-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Rate Limits</h1>
          <p className="text-gray-500 mt-1">Configure and monitor API rate limits</p>
        </div>
        <Button onClick={fetchRateLimits} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {rateLimits.map((limit) => {
          const isEditing = editingId === limit.id;
          const usagePercentage = getUsagePercentage(limit.currentUsage, limit.maxRequests);
          const isNearLimit = usagePercentage >= 80;

          return (
            <motion.div key={limit.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Zap className="h-5 w-5 text-blue-500" />
                        {limit.organizationName}
                      </CardTitle>
                      <p className="text-sm text-gray-500 mt-1">Endpoint: {limit.endpoint}</p>
                    </div>
                    {isEditing ? (
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => handleSave(limit.id)}>
                          <Save className="h-4 w-4 mr-1" />
                          Save
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>
                          Cancel
                        </Button>
                      </div>
                    ) : (
                      <Button size="sm" variant="outline" onClick={() => handleEdit(limit)}>
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label className="text-xs text-gray-500">Max Requests</Label>
                      {isEditing ? (
                        <Input
                          type="number"
                          value={editValues.maxRequests}
                          onChange={(e) => setEditValues({ ...editValues, maxRequests: parseInt(e.target.value) })}
                          className="h-8 mt-1"
                        />
                      ) : (
                        <p className="text-lg font-bold mt-1">{limit.maxRequests}</p>
                      )}
                    </div>
                    <div>
                      <Label className="text-xs text-gray-500">Window (seconds)</Label>
                      {isEditing ? (
                        <Input
                          type="number"
                          value={editValues.windowSeconds}
                          onChange={(e) => setEditValues({ ...editValues, windowSeconds: parseInt(e.target.value) })}
                          className="h-8 mt-1"
                        />
                      ) : (
                        <p className="text-lg font-bold mt-1">{limit.windowSeconds}s</p>
                      )}
                    </div>
                    <div>
                      <Label className="text-xs text-gray-500">Current Usage</Label>
                      <p className={`text-lg font-bold mt-1 ${isNearLimit ? "text-red-500" : "text-green-500"}`}>
                        {limit.currentUsage}
                      </p>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label>Usage ({usagePercentage.toFixed(1)}%)</Label>
                      {isNearLimit && (
                        <Badge variant="destructive">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          Near Limit
                        </Badge>
                      )}
                    </div>
                    <Progress value={usagePercentage} className="h-3" />
                  </div>

                  <div className="text-sm text-gray-500">
                    Resets at: {new Date(limit.resetAt).toLocaleString()}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
