"use client";

import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useToast } from "@/hooks/useToast";
import { authService } from "@/auth/authService";
import { Variation } from "@/types/business";
import { User } from "@/types";

interface VariationWithProject extends Variation {
  projectName?: string;
}

export function VariationsManager() {
  const [variations, setVariations] = useState<VariationWithProject[]>([]);
  const [title, setTitle] = useState("");
  const [total, setTotal] = useState("");
  const [selectedProject, setSelectedProject] = useState("");
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const { showSuccess, showError } = useToast();

  // Load current user on mount
  React.useEffect(() => {
    const loadUser = async () => {
      const user = await authService.getCurrentUser();
      setCurrentUser(user);
    };
    loadUser();
  }, []);

  // Mock projects for selection (in production, load from projectService)
  const projects = useMemo(() => [
    { value: "proj-1", label: "Project Alpha" },
    { value: "proj-2", label: "Project Beta" },
    { value: "proj-3", label: "Project Gamma" },
  ], []);

  const handleAdd = () => {
    if (!title.trim() || !total || !selectedProject) {
      showError("Missing Information", "Please fill in all required fields.");
      return;
    }

    const newVariation: VariationWithProject = {
      id: Date.now().toString(),
      project_id: selectedProject,
      projectName: projects.find(p => p.value === selectedProject)?.label,
      title: title.trim(),
      total: parseFloat(total),
      status: "pending",
      created_by: currentUser?.id || "unknown",
      created_at: new Date().toISOString(),
    };

    setVariations(prev => [newVariation, ...prev]);
    setTitle("");
    setTotal("");
    setSelectedProject("");

    showSuccess("Variation Added", "The variation has been created successfully.");
  };

  const handleStatusChange = (variationId: string, newStatus: 'pending' | 'approved' | 'rejected') => {
    setVariations(prev => prev.map(v =>
      v.id === variationId
        ? { ...v, status: newStatus, approved_at: newStatus !== 'pending' ? new Date().toISOString() : undefined }
        : v
    ));

    showSuccess("Status Updated", `Variation marked as ${newStatus}.`);
  };

  const formatCurrency = (amount: number) => {
    return `£${amount.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      year: 'numeric',
    });
  };

  const stats = useMemo(() => ({
    total: variations.length,
    pending: variations.filter(v => v.status === 'pending').length,
    approved: variations.filter(v => v.status === 'approved').length,
    rejected: variations.filter(v => v.status === 'rejected').length,
    totalValue: variations.reduce((sum, v) => sum + v.total, 0),
  }), [variations]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Variations & Change Orders</h1>
        <p className="text-muted-foreground">Manage project variations and track change orders</p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Total</p>
              <p className="text-2xl font-bold">{stats.total}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Pending</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Approved</p>
              <p className="text-2xl font-bold text-green-600">{stats.approved}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Rejected</p>
              <p className="text-2xl font-bold text-red-600">{stats.rejected}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Total Value</p>
              <p className="text-lg font-bold">{formatCurrency(stats.totalValue)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add New Variation Form */}
      <Card>
        <CardHeader>
          <CardTitle>Add New Variation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="project" className="block text-sm font-medium mb-1">
                Project
              </label>
              <Select
                id="project"
                value={selectedProject}
                onChange={(e) => setSelectedProject(e.target.value)}
                options={[
                  { value: "", label: "Select a project", disabled: true },
                  ...projects,
                ]}
                placeholder="Choose project..."
              />
            </div>
            <div>
              <label htmlFor="title" className="block text-sm font-medium mb-1">
                Variation Title
              </label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Additional electrical work"
              />
            </div>
          </div>
          <div>
            <label htmlFor="total" className="block text-sm font-medium mb-1">
              Total Amount (£)
            </label>
            <Input
              id="total"
              type="number"
              value={total}
              onChange={(e) => setTotal(e.target.value)}
              placeholder="0.00"
              step="0.01"
            />
          </div>
          <div className="flex justify-end">
            <Button onClick={handleAdd} disabled={!title.trim() || !total || !selectedProject}>
              Add Variation
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Variations List */}
      <Card>
        <CardHeader>
          <CardTitle>Variations List</CardTitle>
        </CardHeader>
        <CardContent>
          {variations.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No variations found. Create your first variation above.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {variations.map((variation) => (
                <div
                  key={variation.id}
                  className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium">{variation.title}</h3>
                        <StatusBadge status={variation.status} size="sm" />
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>Project: {variation.projectName || 'Unknown'}</span>
                        <span>Date: {formatDate(variation.created_at)}</span>
                        <span>Created by: {variation.created_by}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="font-medium text-lg">{formatCurrency(variation.total)}</p>
                      </div>
                      {variation.status === 'pending' && (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleStatusChange(variation.id, 'approved')}
                            className="text-green-600 hover:text-green-700"
                          >
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleStatusChange(variation.id, 'rejected')}
                            className="text-red-600 hover:text-red-700"
                          >
                            Reject
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default VariationsManager;
