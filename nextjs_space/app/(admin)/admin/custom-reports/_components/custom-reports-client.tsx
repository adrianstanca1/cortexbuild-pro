"use client";

import { useState, useEffect } from "react";
import {
  FileText,
  Plus,
  Search,
  Download,
  Edit,
  Trash2,
  RefreshCw,
  Filter,
  BarChart3,
  Check
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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

interface CustomReport {
  id: string;
  name: string;
  description: string;
  reportType: "projects" | "users" | "tasks" | "budget" | "custom";
  filters: Record<string, any>;
  columns: string[];
  createdAt: string;
  updatedAt: string;
  lastGenerated: string | null;
  generationCount: number;
}

export function CustomReportsClient() {
  const [reports, setReports] = useState<CustomReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedReport, setSelectedReport] = useState<CustomReport | null>(null);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    reportType: "projects" as "projects" | "users" | "tasks" | "budget" | "custom",
    filters: {}
  });

  const fetchReports = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchQuery) params.set("search", searchQuery);

      const res = await fetch(`/api/admin/custom-reports?${params}`);
      if (res.ok) {
        const data = await res.json();
        setReports(data.reports || []);
      } else {
        toast.error("Failed to fetch reports");
      }
    } catch (error) {
      toast.error("Failed to fetch reports");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const debounce = setTimeout(() => {
      if (searchQuery !== undefined) {
        fetchReports();
      }
    }, 300);
    return () => clearTimeout(debounce);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

  const handleCreate = async () => {
    if (!formData.name) {
      toast.error("Please fill in report name");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/admin/custom-reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        toast.success("Report created successfully");
        setShowCreateModal(false);
        setFormData({ name: "", description: "", reportType: "projects", filters: {} });
        fetchReports();
      } else {
        toast.error("Failed to create report");
      }
    } catch (error) {
      toast.error("Failed to create report");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async () => {
    if (!selectedReport) return;

    setSaving(true);
    try {
      const res = await fetch(`/api/admin/custom-reports/${selectedReport.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        toast.success("Report updated successfully");
        setShowEditModal(false);
        setSelectedReport(null);
        fetchReports();
      } else {
        toast.error("Failed to update report");
      }
    } catch (error) {
      toast.error("Failed to update report");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (reportId: string) => {
    if (!confirm("Are you sure you want to delete this report?")) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/custom-reports/${reportId}`, {
        method: "DELETE"
      });

      if (res.ok) {
        toast.success("Report deleted successfully");
        fetchReports();
      } else {
        toast.error("Failed to delete report");
      }
    } catch (error) {
      toast.error("Failed to delete report");
    }
  };

  const handleGenerateReport = async (reportId: string) => {
    setGenerating(true);
    try {
      const res = await fetch(`/api/admin/custom-reports/${reportId}/generate`, {
        method: "POST"
      });

      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `report-${reportId}-${Date.now()}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        toast.success("Report generated and downloaded successfully");
        fetchReports();
      } else {
        toast.error("Failed to generate report");
      }
    } catch (error) {
      toast.error("Failed to generate report");
    } finally {
      setGenerating(false);
    }
  };

  const openEditModal = (report: CustomReport) => {
    setSelectedReport(report);
    setFormData({
      name: report.name,
      description: report.description,
      reportType: report.reportType,
      filters: report.filters
    });
    setShowEditModal(true);
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Custom Reports
          </h1>
          <p className="text-gray-500 mt-1">Build and generate custom reports</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Report
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Reports</p>
                <p className="text-2xl font-bold mt-1">{reports.length}</p>
              </div>
              <FileText className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Generated</p>
                <p className="text-2xl font-bold mt-1">
                  {reports.reduce((acc, r) => acc + r.generationCount, 0)}
                </p>
              </div>
              <BarChart3 className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Project Reports</p>
                <p className="text-2xl font-bold mt-1">
                  {reports.filter(r => r.reportType === "projects").length}
                </p>
              </div>
              <Filter className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Custom Reports</p>
                <p className="text-2xl font-bold mt-1">
                  {reports.filter(r => r.reportType === "custom").length}
                </p>
              </div>
              <FileText className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search reports..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Reports Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Last Generated</TableHead>
                <TableHead>Generated Count</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reports.map((report) => (
                <TableRow key={report.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{report.name}</p>
                      {report.description && (
                        <p className="text-xs text-gray-500 mt-0.5">{report.description}</p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">
                      {report.reportType}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {report.lastGenerated ? (
                      <span className="text-sm">
                        {format(new Date(report.lastGenerated), "MMM d, yyyy HH:mm")}
                      </span>
                    ) : (
                      <span className="text-gray-400 text-sm">Never</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">{report.generationCount}</span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleGenerateReport(report.id)}
                        disabled={generating}
                      >
                        <Download className="h-3 w-3 mr-1" />
                        Generate
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditModal(report)}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(report.id)}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {reports.length === 0 && (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 mx-auto text-gray-300" />
              <p className="mt-2 text-gray-500">No custom reports</p>
              <Button onClick={() => setShowCreateModal(true)} className="mt-4">
                Create Report
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Modal */}
      {[
        { open: showCreateModal, setOpen: setShowCreateModal, title: "Create Report", action: handleCreate },
        { open: showEditModal, setOpen: setShowEditModal, title: "Edit Report", action: handleUpdate }
      ].map(({ open, setOpen, title, action }, idx) => (
        <Dialog key={idx} open={open} onOpenChange={setOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {idx === 0 ? <Plus className="h-5 w-5" /> : <Edit className="h-5 w-5" />}
                {title}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Label>Report Name *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Monthly Project Summary"
                />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Summary of all active projects"
                  rows={2}
                />
              </div>
              <div>
                <Label>Report Type</Label>
                <Select
                  value={formData.reportType}
                  onValueChange={(value: any) => setFormData({ ...formData, reportType: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="projects">Projects</SelectItem>
                    <SelectItem value="users">Users</SelectItem>
                    <SelectItem value="tasks">Tasks</SelectItem>
                    <SelectItem value="budget">Budget</SelectItem>
                    <SelectItem value="custom">Custom Query</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2 pt-4">
                <Button variant="outline" className="flex-1" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button className="flex-1" onClick={action} disabled={saving}>
                  {saving ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : <Check className="h-4 w-4 mr-2" />}
                  {idx === 0 ? "Create" : "Update"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      ))}
    </div>
  );
}
