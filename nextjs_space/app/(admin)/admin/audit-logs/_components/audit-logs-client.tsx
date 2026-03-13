"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Search,
  Filter,
  RefreshCw,
  Download,
  Eye,
  ChevronLeft,
  ChevronRight,
  User,
  Building2,
  Activity,
  FileText,
  FolderKanban,
  ListTodo,
  ShieldAlert,
  X,
  ArrowLeft
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import Link from "next/link";
import { formatDistanceToNow, format } from "date-fns";

interface AuditLog {
  id: string;
  action: string;
  entityType: string | null;
  entityId: string | null;
  details: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
  user: { id: string; name: string; email: string; role: string } | null;
  project: { id: string; name: string } | null;
  organization: { id: string; name: string } | null;
}

interface Filters {
  actionTypes: { action: string; count: number }[];
  entityTypes: { type: string; count: number }[];
}

export function AuditLogsClient() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 50, total: 0, totalPages: 0 });
  const [filters, setFilters] = useState<Filters>({ actionTypes: [], entityTypes: [] });
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("all");
  const [entityFilter, setEntityFilter] = useState("all");
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString()
      });
      if (search) params.append("search", search);
      if (actionFilter && actionFilter !== "all") params.append("action", actionFilter);
      if (entityFilter && entityFilter !== "all") params.append("entityType", entityFilter);

      const res = await fetch(`/api/admin/audit-logs?${params}`);
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs);
        setPagination(prev => ({ ...prev, ...data.pagination }));
        setFilters(data.filters);
      }
    } catch (error) {
      console.error("Error fetching audit logs:", error);
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, search, actionFilter, entityFilter]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPagination(prev => ({ ...prev, page: 1 }));
    fetchLogs();
  };

  const getActionColor = (action: string) => {
    if (action.includes("created") || action.includes("added")) return "bg-green-500/10 text-green-600";
    if (action.includes("updated") || action.includes("modified")) return "bg-blue-500/10 text-blue-600";
    if (action.includes("deleted") || action.includes("removed")) return "bg-red-500/10 text-red-600";
    if (action.includes("login") || action.includes("auth")) return "bg-purple-500/10 text-purple-600";
    return "bg-gray-500/10 text-gray-600";
  };

  const getEntityIcon = (entityType: string | null) => {
    switch (entityType?.toLowerCase()) {
      case "project": return FolderKanban;
      case "task": return ListTodo;
      case "document": return FileText;
      case "user": return User;
      case "safety": return ShieldAlert;
      default: return Activity;
    }
  };

  const exportLogs = () => {
    const csv = [
      ["Timestamp", "Action", "User", "Organization", "Entity Type", "Details"].join(","),
      ...logs.map(log => [
        format(new Date(log.createdAt), "yyyy-MM-dd HH:mm:ss"),
        log.action,
        log.user?.name || "System",
        log.organization?.name || "-",
        log.entityType || "-",
        `"${(log.details || "").replace(/"/g, '""')}"`
      ].join(","))
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `audit-logs-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Audit Logs</h1>
            <p className="text-gray-500 mt-1">Track all platform activity</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={exportLogs} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <Button onClick={fetchLogs} variant="outline" disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Logs</p>
                <p className="text-2xl font-bold">{pagination.total.toLocaleString()}</p>
              </div>
              <Activity className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Action Types</p>
                <p className="text-2xl font-bold">{filters.actionTypes.length}</p>
              </div>
              <Filter className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Entity Types</p>
                <p className="text-2xl font-bold">{filters.entityTypes.length}</p>
              </div>
              <FolderKanban className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Current Page</p>
                <p className="text-2xl font-bold">{pagination.page} / {pagination.totalPages}</p>
              </div>
              <FileText className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <form onSubmit={handleSearch} className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input placeholder="Search logs..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
              </div>
            </div>
            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filter by action" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                {filters.actionTypes.slice(0, 15).map(a => (
                  <SelectItem key={a.action} value={a.action}>
                    {a.action.replace(/_/g, " ")} ({a.count})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={entityFilter} onValueChange={setEntityFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filter by entity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Entities</SelectItem>
                {filters.entityTypes.map(e => (
                  <SelectItem key={e.type} value={e.type || ""}>
                    {e.type || "Unknown"} ({e.count})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button type="submit">Apply Filters</Button>
            {(search || actionFilter || entityFilter) && (
              <Button type="button" variant="ghost" onClick={() => { setSearch(""); setActionFilter("all"); setEntityFilter("all"); setPagination(prev => ({ ...prev, page: 1 })); }}>
                <X className="h-4 w-4 mr-1" /> Clear
              </Button>
            )}
          </form>
        </CardContent>
      </Card>

      {/* Logs Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-gray-50 dark:bg-gray-800">
                  <th className="text-left py-3 px-4 font-medium text-gray-500">Timestamp</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">Action</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">User</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">Organization</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">Entity</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={6} className="py-12 text-center"><RefreshCw className="h-8 w-8 animate-spin mx-auto text-purple-500" /></td></tr>
                ) : logs.length === 0 ? (
                  <tr><td colSpan={6} className="py-12 text-center text-gray-500">No audit logs found</td></tr>
                ) : (
                  logs.map((log, idx) => {
                    const EntityIcon = getEntityIcon(log.entityType);
                    return (
                      <motion.tr key={log.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: idx * 0.02 }} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800">
                        <td className="py-3 px-4">
                          <div>
                            <p className="text-sm">{format(new Date(log.createdAt), "MMM d, HH:mm:ss")}</p>
                            <p className="text-xs text-gray-500">{formatDistanceToNow(new Date(log.createdAt), { addSuffix: true })}</p>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <Badge className={getActionColor(log.action)}>{log.action.replace(/_/g, " ")}</Badge>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                              <User className="h-4 w-4 text-purple-600" />
                            </div>
                            <div>
                              <p className="text-sm font-medium">{log.user?.name || "System"}</p>
                              <p className="text-xs text-gray-500">{log.user?.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          {log.organization ? (
                            <Badge variant="outline"><Building2 className="h-3 w-3 mr-1" />{log.organization.name}</Badge>
                          ) : (<span className="text-gray-400">-</span>)}
                        </td>
                        <td className="py-3 px-4">
                          {log.entityType ? (
                            <div className="flex items-center gap-2"><EntityIcon className="h-4 w-4 text-gray-500" /><span className="text-sm">{log.entityType}</span></div>
                          ) : (<span className="text-gray-400">-</span>)}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <Button variant="ghost" size="sm" onClick={() => setSelectedLog(log)}><Eye className="h-4 w-4" /></Button>
                        </td>
                      </motion.tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between p-4 border-t">
            <p className="text-sm text-gray-500">
              Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total.toLocaleString()} entries
            </p>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))} disabled={pagination.page === 1}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm">Page {pagination.page} of {pagination.totalPages}</span>
              <Button variant="outline" size="sm" onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))} disabled={pagination.page >= pagination.totalPages}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Log Detail Dialog */}
      <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Audit Log Details</DialogTitle></DialogHeader>
          {selectedLog && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><p className="text-sm text-gray-500">Timestamp</p><p className="font-medium">{format(new Date(selectedLog.createdAt), "PPpp")}</p></div>
                <div><p className="text-sm text-gray-500">Action</p><Badge className={getActionColor(selectedLog.action)}>{selectedLog.action.replace(/_/g, " ")}</Badge></div>
                <div><p className="text-sm text-gray-500">User</p><p className="font-medium">{selectedLog.user?.name || "System"}</p><p className="text-sm text-gray-500">{selectedLog.user?.email}</p></div>
                <div><p className="text-sm text-gray-500">Role</p><Badge variant="outline">{selectedLog.user?.role || "N/A"}</Badge></div>
                <div><p className="text-sm text-gray-500">Organization</p><p className="font-medium">{selectedLog.organization?.name || "-"}</p></div>
                <div><p className="text-sm text-gray-500">Entity Type</p><p className="font-medium">{selectedLog.entityType || "-"}</p></div>
              </div>
              {selectedLog.details && (
                <div><p className="text-sm text-gray-500 mb-2">Details</p><pre className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg text-sm overflow-auto max-h-48">{selectedLog.details}</pre></div>
              )}
              {selectedLog.ipAddress && (
                <div className="grid grid-cols-2 gap-4">
                  <div><p className="text-sm text-gray-500">IP Address</p><p className="font-mono text-sm">{selectedLog.ipAddress}</p></div>
                  {selectedLog.userAgent && (<div><p className="text-sm text-gray-500">User Agent</p><p className="text-sm text-gray-600 truncate">{selectedLog.userAgent}</p></div>)}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
