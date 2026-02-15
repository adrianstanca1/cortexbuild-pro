"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  BarChart3,
  Plus,
  Search,
  Eye,
  Edit,
  Trash2,
  RefreshCw,
  Download,
  Share2,
  TrendingUp
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface Dashboard {
  id: string;
  name: string;
  description: string;
  chartType: "line" | "bar" | "pie" | "area";
  dataSource: string;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: { name: string };
}

interface ChartData {
  name: string;
  value: number;
  [key: string]: string | number;
}

const COLORS = ["#8b5cf6", "#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#ec4899"];

export function AnalyticsClient() {
  const [dashboards, setDashboards] = useState<Dashboard[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedDashboard, setSelectedDashboard] = useState<Dashboard | null>(null);
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    chartType: "bar" as "line" | "bar" | "pie" | "area",
    dataSource: "projects",
    isPublic: false
  });

  const fetchDashboards = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchQuery) params.set("search", searchQuery);

      const res = await fetch(`/api/admin/analytics/dashboards?${params}`);
      if (res.ok) {
        const data = await res.json();
        setDashboards(data.dashboards || []);
      } else {
        toast.error("Failed to fetch dashboards");
      }
    } catch (error) {
      toast.error("Failed to fetch dashboards");
    } finally {
      setLoading(false);
    }
  };

  const fetchChartData = async (dashboardId: string) => {
    try {
      const res = await fetch(`/api/admin/analytics/dashboards/${dashboardId}/data`);
      if (res.ok) {
        const data = await res.json();
        setChartData(data.data || []);
      }
    } catch (error) {
      console.error("Failed to fetch chart data:", error);
      // Generate mock data for demonstration
      setChartData([
        { name: "Jan", value: 400, projects: 24, users: 40 },
        { name: "Feb", value: 300, projects: 18, users: 45 },
        { name: "Mar", value: 600, projects: 32, users: 60 },
        { name: "Apr", value: 800, projects: 45, users: 75 },
        { name: "May", value: 700, projects: 38, users: 68 },
        { name: "Jun", value: 900, projects: 52, users: 82 },
      ]);
    }
  };

  useEffect(() => {
    fetchDashboards();
  }, []);

  useEffect(() => {
    const debounce = setTimeout(() => {
      if (searchQuery !== undefined) {
        fetchDashboards();
      }
    }, 300);
    return () => clearTimeout(debounce);
  }, [searchQuery]);

  const handleCreate = async () => {
    if (!formData.name) {
      toast.error("Please fill in dashboard name");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/admin/analytics/dashboards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        toast.success("Dashboard created successfully");
        setShowCreateModal(false);
        setFormData({ name: "", description: "", chartType: "bar", dataSource: "projects", isPublic: false });
        fetchDashboards();
      } else {
        toast.error("Failed to create dashboard");
      }
    } catch (error) {
      toast.error("Failed to create dashboard");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async () => {
    if (!selectedDashboard) return;

    setSaving(true);
    try {
      const res = await fetch(`/api/admin/analytics/dashboards/${selectedDashboard.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        toast.success("Dashboard updated successfully");
        setShowEditModal(false);
        setSelectedDashboard(null);
        fetchDashboards();
      } else {
        toast.error("Failed to update dashboard");
      }
    } catch (error) {
      toast.error("Failed to update dashboard");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (dashboard: Dashboard) => {
    if (!confirm(`Are you sure you want to delete ${dashboard.name}?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/analytics/dashboards/${dashboard.id}`, {
        method: "DELETE"
      });

      if (res.ok) {
        toast.success("Dashboard deleted successfully");
        fetchDashboards();
      } else {
        toast.error("Failed to delete dashboard");
      }
    } catch (error) {
      toast.error("Failed to delete dashboard");
    }
  };

  const openEditModal = (dashboard: Dashboard) => {
    setSelectedDashboard(dashboard);
    setFormData({
      name: dashboard.name,
      description: dashboard.description,
      chartType: dashboard.chartType,
      dataSource: dashboard.dataSource,
      isPublic: dashboard.isPublic
    });
    setShowEditModal(true);
  };

  const openViewModal = (dashboard: Dashboard) => {
    setSelectedDashboard(dashboard);
    fetchChartData(dashboard.id);
    setShowViewModal(true);
  };

  const renderChart = () => {
    if (!selectedDashboard) return null;

    switch (selectedDashboard.chartType) {
      case "line":
        return (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="value" stroke="#8b5cf6" strokeWidth={2} />
              <Line type="monotone" dataKey="projects" stroke="#3b82f6" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        );
      case "bar":
        return (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="value" fill="#8b5cf6" />
              <Bar dataKey="projects" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        );
      case "pie":
        return (
          <ResponsiveContainer width="100%" height={400}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={120}
                fill="#8884d8"
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        );
      default:
        return (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="value" fill="#8b5cf6" />
            </BarChart>
          </ResponsiveContainer>
        );
    }
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
            Analytics Dashboards
          </h1>
          <p className="text-gray-500 mt-1">Create and manage analytics dashboards</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Dashboard
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Dashboards</p>
                <p className="text-2xl font-bold mt-1">{dashboards.length}</p>
              </div>
              <BarChart3 className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Public Dashboards</p>
                <p className="text-2xl font-bold mt-1">
                  {dashboards.filter(d => d.isPublic).length}
                </p>
              </div>
              <Share2 className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Line Charts</p>
                <p className="text-2xl font-bold mt-1">
                  {dashboards.filter(d => d.chartType === "line").length}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Bar Charts</p>
                <p className="text-2xl font-bold mt-1">
                  {dashboards.filter(d => d.chartType === "bar").length}
                </p>
              </div>
              <BarChart3 className="h-8 w-8 text-orange-500" />
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
              placeholder="Search dashboards..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Dashboards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {dashboards.map((dashboard) => (
          <motion.div
            key={dashboard.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-lg">{dashboard.name}</CardTitle>
                      {dashboard.isPublic && (
                        <Badge variant="outline" className="text-xs">
                          <Share2 className="h-3 w-3 mr-1" />
                          Public
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                      {dashboard.description}
                    </p>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => openViewModal(dashboard)}>
                        <Eye className="h-4 w-4 mr-2" />
                        View
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => openEditModal(dashboard)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => handleDelete(dashboard)}
                        className="text-red-600"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="capitalize">
                      {dashboard.chartType}
                    </Badge>
                    <Badge variant="outline">{dashboard.dataSource}</Badge>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => openViewModal(dashboard)}>
                    <Eye className="h-4 w-4 mr-1" />
                    View
                  </Button>
                </div>
                <div className="mt-4 pt-4 border-t text-xs text-gray-500">
                  <div className="flex justify-between">
                    <span>Created by {dashboard.createdBy.name}</span>
                    <span>{format(new Date(dashboard.createdAt), "MMM d, yyyy")}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {dashboards.length === 0 && (
        <div className="text-center py-12">
          <BarChart3 className="h-12 w-12 mx-auto text-gray-300" />
          <p className="mt-2 text-gray-500">No dashboards found</p>
          <Button onClick={() => setShowCreateModal(true)} className="mt-4">
            Create First Dashboard
          </Button>
        </div>
      )}

      {/* Create Dashboard Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Create Dashboard
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label>Dashboard Name *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Project Performance Dashboard"
              />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Track project metrics and KPIs"
                rows={3}
              />
            </div>
            <div>
              <Label>Chart Type</Label>
              <Select
                value={formData.chartType}
                onValueChange={(value: any) => setFormData({ ...formData, chartType: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="line">Line Chart</SelectItem>
                  <SelectItem value="bar">Bar Chart</SelectItem>
                  <SelectItem value="pie">Pie Chart</SelectItem>
                  <SelectItem value="area">Area Chart</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Data Source</Label>
              <Select
                value={formData.dataSource}
                onValueChange={(value) => setFormData({ ...formData, dataSource: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="projects">Projects</SelectItem>
                  <SelectItem value="users">Users</SelectItem>
                  <SelectItem value="tasks">Tasks</SelectItem>
                  <SelectItem value="budget">Budget</SelectItem>
                  <SelectItem value="activity">Activity</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isPublic"
                checked={formData.isPublic}
                onChange={(e) => setFormData({ ...formData, isPublic: e.target.checked })}
                className="rounded"
              />
              <Label htmlFor="isPublic">Make dashboard public</Label>
            </div>
            <div className="flex gap-2 pt-4">
              <Button variant="outline" className="flex-1" onClick={() => setShowCreateModal(false)}>
                Cancel
              </Button>
              <Button className="flex-1" onClick={handleCreate} disabled={saving}>
                {saving ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                Create
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Dashboard Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5" />
              Edit Dashboard
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label>Dashboard Name *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>
            <div>
              <Label>Chart Type</Label>
              <Select
                value={formData.chartType}
                onValueChange={(value: any) => setFormData({ ...formData, chartType: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="line">Line Chart</SelectItem>
                  <SelectItem value="bar">Bar Chart</SelectItem>
                  <SelectItem value="pie">Pie Chart</SelectItem>
                  <SelectItem value="area">Area Chart</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Data Source</Label>
              <Select
                value={formData.dataSource}
                onValueChange={(value) => setFormData({ ...formData, dataSource: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="projects">Projects</SelectItem>
                  <SelectItem value="users">Users</SelectItem>
                  <SelectItem value="tasks">Tasks</SelectItem>
                  <SelectItem value="budget">Budget</SelectItem>
                  <SelectItem value="activity">Activity</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isPublicEdit"
                checked={formData.isPublic}
                onChange={(e) => setFormData({ ...formData, isPublic: e.target.checked })}
                className="rounded"
              />
              <Label htmlFor="isPublicEdit">Make dashboard public</Label>
            </div>
            <div className="flex gap-2 pt-4">
              <Button variant="outline" className="flex-1" onClick={() => setShowEditModal(false)}>
                Cancel
              </Button>
              <Button className="flex-1" onClick={handleUpdate} disabled={saving}>
                {saving ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : <Edit className="h-4 w-4 mr-2" />}
                Update
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Dashboard Modal */}
      <Dialog open={showViewModal} onOpenChange={setShowViewModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              {selectedDashboard?.name}
            </DialogTitle>
          </DialogHeader>
          {selectedDashboard && (
            <div className="space-y-6 mt-4">
              <div>
                <p className="text-sm text-gray-500">{selectedDashboard.description}</p>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="secondary" className="capitalize">
                    {selectedDashboard.chartType}
                  </Badge>
                  <Badge variant="outline">{selectedDashboard.dataSource}</Badge>
                  {selectedDashboard.isPublic && (
                    <Badge variant="outline">
                      <Share2 className="h-3 w-3 mr-1" />
                      Public
                    </Badge>
                  )}
                </div>
              </div>

              <div className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-900">
                {renderChart()}
              </div>

              <div className="flex gap-2">
                <Button variant="outline" className="flex-1">
                  <Download className="h-4 w-4 mr-2" />
                  Export Data
                </Button>
                <Button variant="outline" className="flex-1">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
                <Button variant="outline" className="flex-1" onClick={() => setShowViewModal(false)}>
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
