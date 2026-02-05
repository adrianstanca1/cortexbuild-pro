"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Gauge, RefreshCw, Edit, Save, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";

interface Quota {
  id: string;
  organizationId: string;
  organizationName: string;
  maxUsers: number;
  maxProjects: number;
  maxStorage: number;
  currentUsers: number;
  currentProjects: number;
  currentStorage: number;
}

export function QuotasClient() {
  const [quotas, setQuotas] = useState<Quota[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Partial<Quota>>({});

  const fetchQuotas = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/quotas");
      if (res.ok) {
        const data = await res.json();
        setQuotas(data.quotas || []);
      } else {
        toast.error("Failed to fetch quotas");
      }
    } catch {
      toast.error("Failed to fetch quotas");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuotas();
  }, []);

  const handleEdit = (quota: Quota) => {
    setEditingId(quota.id);
    setEditValues({ maxUsers: quota.maxUsers, maxProjects: quota.maxProjects, maxStorage: quota.maxStorage });
  };

  const handleSave = async (quotaId: string) => {
    try {
      const res = await fetch(`/api/admin/quotas/${quotaId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editValues)
      });

      if (res.ok) {
        toast.success("Quota updated successfully");
        setEditingId(null);
        fetchQuotas();
      } else {
        toast.error("Failed to update quota");
      }
    } catch {
      toast.error("Failed to update quota");
    }
  };

  const getUsagePercentage = (current: number, max: number) => {
    return max > 0 ? (current / max) * 100 : 0;
  };

  const getUsageColor = (percentage: number) => {
    if (percentage >= 90) return "text-red-500";
    if (percentage >= 75) return "text-orange-500";
    return "text-green-500";
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
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Resource Quotas</h1>
          <p className="text-gray-500 mt-1">Manage organization resource limits</p>
        </div>
        <Button onClick={fetchQuotas} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {quotas.map((quota) => {
          const isEditing = editingId === quota.id;
          const userPercentage = getUsagePercentage(quota.currentUsers, quota.maxUsers);
          const projectPercentage = getUsagePercentage(quota.currentProjects, quota.maxProjects);
          const storagePercentage = getUsagePercentage(quota.currentStorage, quota.maxStorage);

          return (
            <motion.div key={quota.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Gauge className="h-5 w-5 text-purple-500" />
                      {quota.organizationName}
                    </CardTitle>
                    {isEditing ? (
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => handleSave(quota.id)}>
                          <Save className="h-4 w-4 mr-1" />
                          Save
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>
                          Cancel
                        </Button>
                      </div>
                    ) : (
                      <Button size="sm" variant="outline" onClick={() => handleEdit(quota)}>
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label>Users</Label>
                      <div className="flex items-center gap-2">
                        {userPercentage >= 90 && <AlertTriangle className="h-4 w-4 text-red-500" />}
                        <span className={`font-medium ${getUsageColor(userPercentage)}`}>
                          {quota.currentUsers} / {isEditing ? (
                            <Input
                              type="number"
                              value={editValues.maxUsers}
                              onChange={(e) => setEditValues({ ...editValues, maxUsers: parseInt(e.target.value) })}
                              className="inline-block w-20 h-6 px-2 text-sm"
                            />
                          ) : quota.maxUsers}
                        </span>
                      </div>
                    </div>
                    <Progress value={userPercentage} className="h-2" />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label>Projects</Label>
                      <div className="flex items-center gap-2">
                        {projectPercentage >= 90 && <AlertTriangle className="h-4 w-4 text-red-500" />}
                        <span className={`font-medium ${getUsageColor(projectPercentage)}`}>
                          {quota.currentProjects} / {isEditing ? (
                            <Input
                              type="number"
                              value={editValues.maxProjects}
                              onChange={(e) => setEditValues({ ...editValues, maxProjects: parseInt(e.target.value) })}
                              className="inline-block w-20 h-6 px-2 text-sm"
                            />
                          ) : quota.maxProjects}
                        </span>
                      </div>
                    </div>
                    <Progress value={projectPercentage} className="h-2" />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label>Storage (GB)</Label>
                      <div className="flex items-center gap-2">
                        {storagePercentage >= 90 && <AlertTriangle className="h-4 w-4 text-red-500" />}
                        <span className={`font-medium ${getUsageColor(storagePercentage)}`}>
                          {quota.currentStorage} / {isEditing ? (
                            <Input
                              type="number"
                              value={editValues.maxStorage}
                              onChange={(e) => setEditValues({ ...editValues, maxStorage: parseInt(e.target.value) })}
                              className="inline-block w-20 h-6 px-2 text-sm"
                            />
                          ) : quota.maxStorage}
                        </span>
                      </div>
                    </div>
                    <Progress value={storagePercentage} className="h-2" />
                  </div>

                  {(userPercentage >= 75 || projectPercentage >= 75 || storagePercentage >= 75) && (
                    <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                      <p className="text-sm text-yellow-800 dark:text-yellow-200">
                        <AlertTriangle className="h-4 w-4 inline mr-1" />
                        Organization is approaching quota limits
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {quotas.length === 0 && (
        <div className="text-center py-12">
          <Gauge className="h-12 w-12 mx-auto text-gray-300" />
          <p className="mt-2 text-gray-500">No quotas configured</p>
        </div>
      )}
    </div>
  );
}
