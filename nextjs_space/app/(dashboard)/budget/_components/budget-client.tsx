"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import {
  PoundSterling, Plus, Search, TrendingUp, TrendingDown,
  FileText, Edit2, Trash2, Loader2, Building2, CheckCircle,
  AlertCircle, Clock, Package, Users, Wrench, Shield, Zap,
  LayoutGrid, List, BarChart3, Target, Wallet, Receipt, ArrowUpRight, ArrowDownRight
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { useRealtimeSubscription } from "@/components/realtime-provider";

interface CostItem {
  id: string;
  description: string;
  category: string;
  status: string;
  estimatedAmount: number;
  actualAmount: number;
  committedAmount: number;
  vendor?: string;
  notes?: string;
  invoiceNumber?: string;
  invoiceDate?: string;
  paidDate?: string;
  projectId: string;
  project?: { id: string; name: string };
  subcontractor?: { id: string; companyName: string };
  createdBy?: { id: string; name: string };
  createdAt: string;
}

interface Project {
  id: string;
  name: string;
  budget?: number;
}

interface Subcontractor {
  id: string;
  companyName: string;
}

interface BudgetSummary {
  totalEstimated: number;
  totalCommitted: number;
  totalActual: number;
}

const CATEGORIES = [
  { value: "LABOR", label: "Labor", icon: Users, color: "bg-blue-500", bgLight: "bg-blue-100 dark:bg-blue-900/30", textColor: "text-blue-600" },
  { value: "MATERIALS", label: "Materials", icon: Package, color: "bg-emerald-500", bgLight: "bg-emerald-100 dark:bg-emerald-900/30", textColor: "text-emerald-600" },
  { value: "EQUIPMENT", label: "Equipment", icon: Wrench, color: "bg-orange-500", bgLight: "bg-orange-100 dark:bg-orange-900/30", textColor: "text-orange-600" },
  { value: "SUBCONTRACTOR", label: "Subcontractor", icon: Building2, color: "bg-purple-500", bgLight: "bg-purple-100 dark:bg-purple-900/30", textColor: "text-purple-600" },
  { value: "PERMITS", label: "Permits", icon: FileText, color: "bg-amber-500", bgLight: "bg-amber-100 dark:bg-amber-900/30", textColor: "text-amber-600" },
  { value: "INSURANCE", label: "Insurance", icon: Shield, color: "bg-red-500", bgLight: "bg-red-100 dark:bg-red-900/30", textColor: "text-red-600" },
  { value: "UTILITIES", label: "Utilities", icon: Zap, color: "bg-cyan-500", bgLight: "bg-cyan-100 dark:bg-cyan-900/30", textColor: "text-cyan-600" },
  { value: "OVERHEAD", label: "Overhead", icon: TrendingUp, color: "bg-slate-500", bgLight: "bg-slate-100 dark:bg-slate-800", textColor: "text-slate-600" },
  { value: "CONTINGENCY", label: "Contingency", icon: AlertCircle, color: "bg-amber-500", bgLight: "bg-amber-100 dark:bg-amber-900/30", textColor: "text-amber-600" },
  { value: "OTHER", label: "Other", icon: FileText, color: "bg-slate-400", bgLight: "bg-slate-100 dark:bg-slate-800", textColor: "text-slate-500" },
];

const STATUS_CONFIG: Record<string, { label: string; bgColor: string; textColor: string; icon: any }> = {
  ESTIMATED: { label: "Estimated", bgColor: "bg-slate-100 dark:bg-slate-800", textColor: "text-slate-600", icon: Clock },
  COMMITTED: { label: "Committed", bgColor: "bg-blue-100 dark:bg-blue-900/30", textColor: "text-blue-600", icon: FileText },
  ACTUAL: { label: "Actual", bgColor: "bg-emerald-100 dark:bg-emerald-900/30", textColor: "text-emerald-600", icon: CheckCircle },
  INVOICED: { label: "Invoiced", bgColor: "bg-amber-100 dark:bg-amber-900/30", textColor: "text-amber-600", icon: Receipt },
  PAID: { label: "Paid", bgColor: "bg-emerald-100 dark:bg-emerald-900/30", textColor: "text-emerald-600", icon: CheckCircle },
};

export function BudgetClient({
  initialCostItems,
  initialSummary,
  projects,
  subcontractors
}: {
  initialCostItems: CostItem[];
  initialSummary: BudgetSummary;
  projects: Project[];
  subcontractors: Subcontractor[];
}) {
  const router = useRouter();
  const [costItems] = useState<CostItem[]>(initialCostItems);
  const [summary] = useState<BudgetSummary>(initialSummary);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [projectFilter, setProjectFilter] = useState("all");
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [showNewModal, setShowNewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<CostItem | null>(null);
  const [loading, setLoading] = useState(false);
  const [newItem, setNewItem] = useState({
    projectId: "",
    description: "",
    category: "OTHER",
    status: "ESTIMATED",
    estimatedAmount: "",
    actualAmount: "",
    committedAmount: "",
    vendor: "",
    notes: "",
    subcontractorId: ""
  });

  const handleBudgetEvent = useCallback(() => {
    router.refresh();
  }, [router]);

  useRealtimeSubscription(
    ["cost_item_created", "cost_item_updated", "cost_item_deleted"],
    handleBudgetEvent
  );

  const filteredItems = costItems.filter((item) => {
    const matchesSearch = item.description?.toLowerCase().includes(search.toLowerCase()) ||
      item.vendor?.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter === "all" || item.category === categoryFilter;
    const matchesStatus = statusFilter === "all" || item.status === statusFilter;
    const matchesProject = projectFilter === "all" || item.projectId === projectFilter;
    return matchesSearch && matchesCategory && matchesStatus && matchesProject;
  });

  const handleCreate = async () => {
    if (!newItem.projectId || !newItem.description) {
      toast.error("Project and description are required");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/budget", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newItem)
      });
      if (!res.ok) throw new Error("Failed to create cost item");
      toast.success("Cost item created successfully");
      setShowNewModal(false);
      setNewItem({
        projectId: "", description: "", category: "OTHER", status: "ESTIMATED",
        estimatedAmount: "", actualAmount: "", committedAmount: "",
        vendor: "", notes: "", subcontractorId: ""
      });
      router.refresh();
    } catch (error) {
      toast.error("Failed to create cost item");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (!selectedItem) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/budget/${selectedItem.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(selectedItem)
      });
      if (!res.ok) throw new Error("Failed to update cost item");
      toast.success("Cost item updated successfully");
      setShowEditModal(false);
      router.refresh();
    } catch (error) {
      toast.error("Failed to update cost item");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this cost item?")) return;
    try {
      const res = await fetch(`/api/budget/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete cost item");
      toast.success("Cost item deleted");
      router.refresh();
    } catch (error) {
      toast.error("Failed to delete cost item");
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: "GBP"
    }).format(amount);
  };

  const variance = summary.totalEstimated - summary.totalActual;
  const variancePercent = summary.totalEstimated > 0 
    ? ((variance / summary.totalEstimated) * 100).toFixed(1) 
    : "0";
  const budgetUsedPercent = summary.totalEstimated > 0
    ? Math.min(100, (summary.totalActual / summary.totalEstimated) * 100)
    : 0;

  // Category breakdown
  const categoryBreakdown = CATEGORIES.map(cat => {
    const items = costItems.filter(i => i.category === cat.value);
    const estimated = items.reduce((sum, i) => sum + i.estimatedAmount, 0);
    const actual = items.reduce((sum, i) => sum + i.actualAmount, 0);
    return { ...cat, estimated, actual, count: items.length };
  }).filter(c => c.count > 0);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl shadow-lg shadow-emerald-500/25">
              <PoundSterling className="w-6 h-6 text-white" />
            </div>
            Budget Management
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Track project costs and financial performance</p>
        </div>
        <Button onClick={() => setShowNewModal(true)} className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-lg shadow-emerald-500/25">
          <Plus className="w-4 h-4 mr-2" />
          Add Cost Item
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 border-0 shadow-md hover:shadow-lg transition-all">
          <CardContent className="pt-5 pb-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600/70 dark:text-blue-400/70">Estimated Budget</p>
                <p className="text-2xl font-bold text-blue-700 dark:text-blue-300 mt-1">{formatCurrency(summary.totalEstimated)}</p>
              </div>
              <div className="p-3 bg-blue-200 dark:bg-blue-800 rounded-xl">
                <Target className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/30 dark:to-orange-800/30 border-0 shadow-md hover:shadow-lg transition-all">
          <CardContent className="pt-5 pb-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-orange-600/70 dark:text-orange-400/70">Committed</p>
                <p className="text-2xl font-bold text-orange-700 dark:text-orange-300 mt-1">{formatCurrency(summary.totalCommitted)}</p>
              </div>
              <div className="p-3 bg-orange-200 dark:bg-orange-800 rounded-xl">
                <FileText className="w-6 h-6 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/30 dark:to-emerald-800/30 border-0 shadow-md hover:shadow-lg transition-all">
          <CardContent className="pt-5 pb-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-emerald-600/70 dark:text-emerald-400/70">Actual Spent</p>
                <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-300 mt-1">{formatCurrency(summary.totalActual)}</p>
              </div>
              <div className="p-3 bg-emerald-200 dark:bg-emerald-800 rounded-xl">
                <Wallet className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={`border-0 shadow-md hover:shadow-lg transition-all ${variance >= 0 ? 'bg-gradient-to-br from-emerald-50 to-teal-100 dark:from-emerald-900/30 dark:to-teal-800/30' : 'bg-gradient-to-br from-red-50 to-rose-100 dark:from-red-900/30 dark:to-rose-800/30'}`}>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-start justify-between">
              <div>
                <p className={`text-sm font-medium ${variance >= 0 ? 'text-emerald-600/70 dark:text-emerald-400/70' : 'text-red-600/70 dark:text-red-400/70'}`}>Variance</p>
                <p className={`text-2xl font-bold mt-1 ${variance >= 0 ? 'text-emerald-700 dark:text-emerald-300' : 'text-red-700 dark:text-red-300'}`}>
                  {formatCurrency(Math.abs(variance))}
                </p>
                <p className={`text-xs mt-1 flex items-center gap-1 ${variance >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                  {variance >= 0 ? <ArrowDownRight className="w-3 h-3" /> : <ArrowUpRight className="w-3 h-3" />}
                  {variance >= 0 ? 'Under' : 'Over'} by {variancePercent}%
                </p>
              </div>
              <div className={`p-3 rounded-xl ${variance >= 0 ? 'bg-emerald-200 dark:bg-emerald-800' : 'bg-red-200 dark:bg-red-800'}`}>
                {variance >= 0 ? (
                  <TrendingDown className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <TrendingUp className="w-6 h-6 text-red-600 dark:text-red-400" />
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Budget Progress & Category Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Budget Progress */}
        <Card className="border-0 shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-emerald-600" />
              Budget Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-slate-600 dark:text-slate-400">Budget Utilization</span>
                  <span className="font-semibold text-slate-900 dark:text-white">{budgetUsedPercent.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-3">
                  <div 
                    className={`h-3 rounded-full transition-all duration-500 ${
                      budgetUsedPercent > 90 ? 'bg-gradient-to-r from-red-500 to-rose-500' : 
                      budgetUsedPercent > 70 ? 'bg-gradient-to-r from-amber-500 to-orange-500' : 
                      'bg-gradient-to-r from-emerald-500 to-teal-500'
                    }`}
                    style={{ width: `${budgetUsedPercent}%` }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                <div className="text-center">
                  <p className="text-xs text-slate-500 dark:text-slate-400">Remaining</p>
                  <p className={`text-lg font-bold ${variance >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                    {formatCurrency(Math.max(0, summary.totalEstimated - summary.totalActual))}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-slate-500 dark:text-slate-400">Cost Items</p>
                  <p className="text-lg font-bold text-slate-900 dark:text-white">{costItems.length}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-slate-500 dark:text-slate-400">Avg. Item</p>
                  <p className="text-lg font-bold text-slate-900 dark:text-white">
                    {formatCurrency(costItems.length > 0 ? summary.totalActual / costItems.length : 0)}
                  </p>
                </div>
              </div>

              {/* Budget Alert */}
              {budgetUsedPercent > 80 && (
                <div className={`p-3 rounded-lg flex items-center gap-3 ${budgetUsedPercent > 90 ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800' : 'bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800'}`}>
                  <AlertCircle className={`w-5 h-5 ${budgetUsedPercent > 90 ? 'text-red-600' : 'text-amber-600'}`} />
                  <div>
                    <p className={`font-medium text-sm ${budgetUsedPercent > 90 ? 'text-red-800 dark:text-red-300' : 'text-amber-800 dark:text-amber-300'}`}>Budget Alert</p>
                    <p className={`text-xs ${budgetUsedPercent > 90 ? 'text-red-700 dark:text-red-400' : 'text-amber-700 dark:text-amber-400'}`}>
                      {budgetUsedPercent > 90 ? 'Critical: ' : ''}{budgetUsedPercent.toFixed(0)}% of budget has been utilized
                    </p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Category Breakdown */}
        <Card className="border-0 shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Package className="w-5 h-5 text-emerald-600" />
              Cost by Category
            </CardTitle>
          </CardHeader>
          <CardContent>
            {categoryBreakdown.length > 0 ? (
              <div className="space-y-3">
                {categoryBreakdown.map((cat) => {
                  const Icon = cat.icon;
                  const percent = summary.totalActual > 0 ? ((cat.actual / summary.totalActual) * 100).toFixed(0) : 0;
                  return (
                    <div key={cat.value} className="flex items-center gap-3">
                      <div className={`p-2 ${cat.bgLight} rounded-lg`}>
                        <Icon className={`w-4 h-4 ${cat.textColor}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{cat.label}</span>
                          <span className="text-sm font-bold text-slate-900 dark:text-white">{formatCurrency(cat.actual)}</span>
                        </div>
                        <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5">
                          <div className={`h-1.5 rounded-full ${cat.color}`} style={{ width: `${percent}%` }} />
                        </div>
                      </div>
                      <span className="text-xs text-slate-500 w-10 text-right">{percent}%</span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                <Package className="w-12 h-12 mx-auto mb-2 text-slate-300" />
                <p>No cost items yet</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="border-0 shadow-md">
        <CardContent className="py-4">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-3 flex-1 w-full lg:w-auto">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Search cost items..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                />
              </div>
              <Select value={projectFilter} onValueChange={setProjectFilter}>
                <SelectTrigger className="w-[180px] bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                  <SelectValue placeholder="Project" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Projects</SelectItem>
                  {projects.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[150px] bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px] bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  {Object.entries(STATUS_CONFIG).map(([key, val]) => (
                    <SelectItem key={key} value={key}>{val.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setViewMode('list')}
                className={viewMode === 'list' ? 'bg-white dark:bg-slate-700 shadow-sm' : ''}
              >
                <List className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setViewMode('grid')}
                className={viewMode === 'grid' ? 'bg-white dark:bg-slate-700 shadow-sm' : ''}
              >
                <LayoutGrid className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cost Items */}
      {filteredItems.length === 0 ? (
        <Card className="border-0 shadow-md">
          <CardContent className="py-16 text-center">
            <div className="p-4 bg-emerald-100 dark:bg-emerald-900/30 rounded-full w-fit mx-auto mb-4">
              <PoundSterling className="w-12 h-12 text-emerald-500" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">No cost items found</h3>
            <p className="text-slate-500 dark:text-slate-400 mb-4">Start tracking your project costs</p>
            <Button onClick={() => setShowNewModal(true)} className="bg-emerald-600 hover:bg-emerald-700">
              <Plus className="w-4 h-4 mr-2" /> Add Cost Item
            </Button>
          </CardContent>
        </Card>
      ) : viewMode === 'list' ? (
        <Card className="border-0 shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                  <th className="text-left p-4 font-semibold text-slate-600 dark:text-slate-400 text-sm">Description</th>
                  <th className="text-left p-4 font-semibold text-slate-600 dark:text-slate-400 text-sm">Project</th>
                  <th className="text-left p-4 font-semibold text-slate-600 dark:text-slate-400 text-sm">Category</th>
                  <th className="text-left p-4 font-semibold text-slate-600 dark:text-slate-400 text-sm">Status</th>
                  <th className="text-right p-4 font-semibold text-slate-600 dark:text-slate-400 text-sm">Estimated</th>
                  <th className="text-right p-4 font-semibold text-slate-600 dark:text-slate-400 text-sm">Actual</th>
                  <th className="text-center p-4 font-semibold text-slate-600 dark:text-slate-400 text-sm">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((item) => {
                  const statusConf = STATUS_CONFIG[item.status] || STATUS_CONFIG.ESTIMATED;
                  const categoryConf = CATEGORIES.find(c => c.value === item.category);
                  const CategoryIcon = categoryConf?.icon || FileText;
                  return (
                    <tr
                      key={item.id}
                      className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      <td className="p-4">
                        <p className="font-medium text-slate-900 dark:text-white">{item.description}</p>
                        {item.vendor && <p className="text-sm text-slate-500 dark:text-slate-400">{item.vendor}</p>}
                      </td>
                      <td className="p-4">
                        <span className="text-sm text-slate-600 dark:text-slate-400">{item.project?.name}</span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <div className={`p-1.5 rounded-lg ${categoryConf?.bgLight || 'bg-slate-100'}`}>
                            <CategoryIcon className={`w-3.5 h-3.5 ${categoryConf?.textColor || 'text-slate-500'}`} />
                          </div>
                          <span className="text-sm text-slate-700 dark:text-slate-300">{categoryConf?.label || item.category}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <Badge className={`${statusConf.bgColor} ${statusConf.textColor} border-0`}>
                          {statusConf.label}
                        </Badge>
                      </td>
                      <td className="p-4 text-right">
                        <span className="font-medium text-slate-700 dark:text-slate-300">{formatCurrency(item.estimatedAmount)}</span>
                      </td>
                      <td className="p-4 text-right">
                        <span className="font-bold text-slate-900 dark:text-white">{formatCurrency(item.actualAmount)}</span>
                      </td>
                      <td className="p-4">
                        <div className="flex justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-slate-500 hover:text-emerald-600"
                            onClick={() => {
                              setSelectedItem(item);
                              setShowEditModal(true);
                            }}
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-slate-500 hover:text-red-600"
                            onClick={() => handleDelete(item.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems.map((item) => {
            const statusConf = STATUS_CONFIG[item.status] || STATUS_CONFIG.ESTIMATED;
            const categoryConf = CATEGORIES.find(c => c.value === item.category);
            const CategoryIcon = categoryConf?.icon || FileText;
            return (
              <Card key={item.id} className="border-0 shadow-md hover:shadow-lg transition-all group">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className={`p-2 rounded-lg ${categoryConf?.bgLight || 'bg-slate-100'}`}>
                      <CategoryIcon className={`w-4 h-4 ${categoryConf?.textColor || 'text-slate-500'}`} />
                    </div>
                    <Badge className={`${statusConf.bgColor} ${statusConf.textColor} border-0`}>
                      {statusConf.label}
                    </Badge>
                  </div>
                  <h3 className="font-semibold text-slate-900 dark:text-white line-clamp-2 mb-1">{item.description}</h3>
                  {item.vendor && <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">{item.vendor}</p>}
                  <div className="flex items-center justify-between text-sm mb-3">
                    <span className="text-slate-500">Est.</span>
                    <span className="font-medium text-slate-700 dark:text-slate-300">{formatCurrency(item.estimatedAmount)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm mb-4">
                    <span className="text-slate-500">Actual</span>
                    <span className="font-bold text-emerald-600">{formatCurrency(item.actualAmount)}</span>
                  </div>
                  <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
                    <span className="text-xs text-slate-500 truncate max-w-[60%]">{item.project?.name}</span>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => {
                          setSelectedItem(item);
                          setShowEditModal(true);
                        }}
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-red-500"
                        onClick={() => handleDelete(item.id)}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* New Cost Item Modal */}
      <Dialog open={showNewModal} onOpenChange={setShowNewModal}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                <PoundSterling className="w-5 h-5 text-emerald-600" />
              </div>
              Add Cost Item
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Project *</label>
              <Select value={newItem.projectId} onValueChange={(v) => setNewItem({ ...newItem, projectId: v })}>
                <SelectTrigger className="mt-1.5"><SelectValue placeholder="Select project" /></SelectTrigger>
                <SelectContent>
                  {projects.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Description *</label>
              <Input
                className="mt-1.5"
                value={newItem.description}
                onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                placeholder="e.g., Concrete for foundation"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Category</label>
                <Select value={newItem.category} onValueChange={(v) => setNewItem({ ...newItem, category: v })}>
                  <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Status</label>
                <Select value={newItem.status} onValueChange={(v) => setNewItem({ ...newItem, status: v })}>
                  <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(STATUS_CONFIG).map(([key, val]) => (
                      <SelectItem key={key} value={key}>{val.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Estimated (£)</label>
                <Input
                  type="number"
                  className="mt-1.5"
                  value={newItem.estimatedAmount}
                  onChange={(e) => setNewItem({ ...newItem, estimatedAmount: e.target.value })}
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Committed (£)</label>
                <Input
                  type="number"
                  className="mt-1.5"
                  value={newItem.committedAmount}
                  onChange={(e) => setNewItem({ ...newItem, committedAmount: e.target.value })}
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Actual (£)</label>
                <Input
                  type="number"
                  className="mt-1.5"
                  value={newItem.actualAmount}
                  onChange={(e) => setNewItem({ ...newItem, actualAmount: e.target.value })}
                  placeholder="0.00"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Vendor</label>
                <Input
                  className="mt-1.5"
                  value={newItem.vendor}
                  onChange={(e) => setNewItem({ ...newItem, vendor: e.target.value })}
                  placeholder="Supplier name"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Subcontractor</label>
                <Select value={newItem.subcontractorId} onValueChange={(v) => setNewItem({ ...newItem, subcontractorId: v })}>
                  <SelectTrigger className="mt-1.5"><SelectValue placeholder="Select (optional)" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {subcontractors.map((s) => (
                      <SelectItem key={s.id} value={s.id}>{s.companyName}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Notes</label>
              <Textarea
                className="mt-1.5"
                value={newItem.notes}
                onChange={(e) => setNewItem({ ...newItem, notes: e.target.value })}
                placeholder="Additional details..."
                rows={2}
              />
            </div>
          </div>
          <DialogFooter className="mt-6">
            <Button variant="outline" onClick={() => setShowNewModal(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={loading} className="bg-emerald-600 hover:bg-emerald-700">
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                <Edit2 className="w-5 h-5 text-emerald-600" />
              </div>
              Edit Cost Item
            </DialogTitle>
          </DialogHeader>
          {selectedItem && (
            <div className="space-y-4 mt-4">
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Description</label>
                <Input
                  className="mt-1.5"
                  value={selectedItem.description}
                  onChange={(e) => setSelectedItem({ ...selectedItem, description: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Category</label>
                  <Select value={selectedItem.category} onValueChange={(v) => setSelectedItem({ ...selectedItem, category: v })}>
                    <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((c) => (
                        <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Status</label>
                  <Select value={selectedItem.status} onValueChange={(v) => setSelectedItem({ ...selectedItem, status: v })}>
                    <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(STATUS_CONFIG).map(([key, val]) => (
                        <SelectItem key={key} value={key}>{val.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Estimated (£)</label>
                  <Input
                    type="number"
                    className="mt-1.5"
                    value={selectedItem.estimatedAmount}
                    onChange={(e) => setSelectedItem({ ...selectedItem, estimatedAmount: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Committed (£)</label>
                  <Input
                    type="number"
                    className="mt-1.5"
                    value={selectedItem.committedAmount}
                    onChange={(e) => setSelectedItem({ ...selectedItem, committedAmount: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Actual (£)</label>
                  <Input
                    type="number"
                    className="mt-1.5"
                    value={selectedItem.actualAmount}
                    onChange={(e) => setSelectedItem({ ...selectedItem, actualAmount: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Vendor</label>
                <Input
                  className="mt-1.5"
                  value={selectedItem.vendor || ""}
                  onChange={(e) => setSelectedItem({ ...selectedItem, vendor: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Notes</label>
                <Textarea
                  className="mt-1.5"
                  value={selectedItem.notes || ""}
                  onChange={(e) => setSelectedItem({ ...selectedItem, notes: e.target.value })}
                  rows={2}
                />
              </div>
            </div>
          )}
          <DialogFooter className="mt-6">
            <Button variant="outline" onClick={() => setShowEditModal(false)}>Cancel</Button>
            <Button onClick={handleUpdate} disabled={loading} className="bg-emerald-600 hover:bg-emerald-700">
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
