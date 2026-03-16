'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import {
  FileText,
  Search,
  Filter,
  ChevronRight,
  ChevronDown,
  Clock,
  User,
  Activity,
  AlertCircle,
  CheckCircle,
  XCircle,
  Edit,
  Trash2,
  Plus,
  ArrowUpRight,
  Diff
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { useRouter } from 'next/navigation';

interface AuditLog {
  id: string;
  entity: string;
  entityId: string;
  action: string;
  userId: string;
  oldValues: Record<string, unknown> | null;
  newValues: Record<string, unknown> | null;
  changes: Array<{
    field: string;
    old: unknown;
    new: unknown;
  }> | null;
  timestamp: string;
  ipAddress: string | null;
  userAgent: string | null;
  metadata: Record<string, unknown> | null;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    organization?: { id: string; name: string };
  } | null;
}

interface AuditLogViewerProps {
  initialLogs: AuditLog[];
  initialTotal: number;
  entityTypes: Array<{ entity: string; _count: number }>;
  actionTypes: Array<{ action: string; _count: number }>;
  userRole: string;
}

const actionConfig: Record<string, { color: string; icon: React.ReactNode; label: string }> = {
  CREATE: { color: 'bg-green-100 text-green-700', icon: <Plus className="w-3 h-3" />, label: 'Created' },
  UPDATE: { color: 'bg-blue-100 text-blue-700', icon: <Edit className="w-3 h-3" />, label: 'Updated' },
  DELETE: { color: 'bg-red-100 text-red-700', icon: <Trash2 className="w-3 h-3" />, label: 'Deleted' },
  STATUS_CHANGE: { color: 'bg-yellow-100 text-yellow-700', icon: <ArrowUpRight className="w-3 h-3" />, label: 'Status Changed' },
};

const entityConfig: Record<string, { color: string }> = {
  Variation: { color: 'bg-indigo-500' },
  DailyReport: { color: 'bg-emerald-500' },
  Payroll: { color: 'bg-amber-500' },
  RiskAssessment: { color: 'bg-orange-500' },
  Project: { color: 'bg-blue-500' },
  Task: { color: 'bg-purple-500' },
  RFI: { color: 'bg-cyan-500' },
  Submittal: { color: 'bg-pink-500' },
  SafetyIncident: { color: 'bg-red-500' },
  PunchList: { color: 'bg-yellow-500' },
  Inspection: { color: 'bg-teal-500' },
};

export function AuditLogViewer({
  initialLogs,
  initialTotal,
  entityTypes,
  actionTypes,
  userRole
}: AuditLogViewerProps) {
  const router = useRouter();
  const [logs, setLogs] = useState<AuditLog[]>(initialLogs);
  const [total, setTotal] = useState(initialTotal);
  const [loading, setLoading] = useState(false);
  const [showDiffModal, setShowDiffModal] = useState(false);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [entityFilter, setEntityFilter] = useState<string>('all');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const limit = 50;

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', page.toString());
      params.set('limit', limit.toString());
      if (entityFilter !== 'all') params.set('entity', entityFilter);
      if (actionFilter !== 'all') params.set('action', actionFilter);
      if (searchQuery) params.set('search', searchQuery);

      const res = await fetch(`/api/audit-logs?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs);
        setTotal(data.pagination.total);
      }
    } catch (error) {
      console.error('Failed to fetch audit logs:', error);
    } finally {
      setLoading(false);
    }
  }, [page, entityFilter, actionFilter, searchQuery]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const handleViewDiff = (log: AuditLog) => {
    setSelectedLog(log);
    setShowDiffModal(true);
  };

  const formatValue = (value: unknown): string => {
    if (value === null || value === undefined) return '—';
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
  };

  const renderDiffCell = (oldValue: unknown, newValue: unknown) => {
    if (oldValue === newValue) {
      return <span className="text-gray-500">{formatValue(oldValue)}</span>;
    }
    return (
      <div className="space-y-1">
        <div className="text-red-600 bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded text-sm line-through">
          {formatValue(oldValue)}
        </div>
        <div className="text-green-600 bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded text-sm">
          {formatValue(newValue)}
        </div>
      </div>
    );
  };

  const getActionIcon = (action: string) => {
    return actionConfig[action.toUpperCase()]?.icon || <Activity className="w-3 h-3" />;
  };

  const getActionConfig = (action: string) => {
    return actionConfig[action.toUpperCase()] || { color: 'bg-gray-100 text-gray-700', icon: <Activity className="w-3 h-3" />, label: action };
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <FileText className="w-7 h-7 text-indigo-600" />
            Audit Log Viewer
          </h1>
          <p className="text-gray-500 mt-1">Track all system changes and user actions</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{total}</div>
            <div className="text-sm text-gray-500">Total Logs</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-green-600">
              {entityTypes.length}
            </div>
            <div className="text-sm text-gray-500">Entity Types</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-blue-600">
              {actionTypes.length}
            </div>
            <div className="text-sm text-gray-500">Action Types</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-indigo-600">{logs.length}</div>
            <div className="text-sm text-gray-500">Showing</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search by entity ID, user..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={entityFilter} onValueChange={setEntityFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Entity Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Entities</SelectItem>
            {entityTypes.map((et) => (
              <SelectItem key={et.entity} value={et.entity}>
                {et.entity} ({et._count})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={actionFilter} onValueChange={setActionFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Action" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Actions</SelectItem>
            {actionTypes.map((at) => (
              <SelectItem key={at.action} value={at.action}>
                {at.action} ({at._count})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Audit Logs Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="text-center py-12 text-gray-500">
              <Activity className="w-6 h-6 mx-auto animate-spin mb-2" />
              <p>Loading audit logs...</p>
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <FileText className="w-12 h-12 mx-auto opacity-30 mb-4" />
              <p>No audit logs found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[100px]">Action</TableHead>
                    <TableHead>Entity</TableHead>
                    <TableHead>Changes</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead className="w-[150px]">Timestamp</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log, index) => (
                    <React.Fragment key={log.id}>
                      <motion.tr
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.02 }}
                        className="border-b hover:bg-gray-50 dark:hover:bg-gray-800"
                      >
                        <TableCell>
                          <Badge className={getActionConfig(log.action).color}>
                            {getActionIcon(log.action)}
                            <span className="ml-1">{getActionConfig(log.action).label}</span>
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div
                              className={`w-2 h-2 rounded-full ${entityConfig[log.entity]?.color || 'bg-gray-500'}`}
                            />
                            <div>
                              <div className="font-medium">{log.entity}</div>
                              <div className="text-xs text-gray-500 font-mono">
                                {log.entityId?.slice(0, 8) || 'N/A'}...
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {log.changes && log.changes.length > 0 ? (
                              <div className="flex items-center gap-1 text-blue-600">
                                <Diff className="w-4 h-4" />
                                <span>{log.changes.length} field(s) changed</span>
                              </div>
                            ) : (
                              <span className="text-gray-500">No field changes</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {log.user ? (
                            <div>
                              <div className="font-medium">{log.user.name}</div>
                              <div className="text-xs text-gray-500">{log.user.role}</div>
                            </div>
                          ) : (
                            <span className="text-gray-500">System</span>
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-gray-500">
                          {format(new Date(log.timestamp), 'MMM d, HH:mm')}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewDiff(log)}
                          >
                            View Diff
                          </Button>
                        </TableCell>
                      </motion.tr>
                      {/* Expanded row showing quick preview */}
                      {expandedLogId === log.id && log.changes && log.changes.length > 0 && (
                        <tr className="bg-gray-50 dark:bg-gray-800/50">
                          <TableCell colSpan={6} className="p-4">
                            <div className="space-y-2">
                              <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Field Changes:
                              </div>
                              {log.changes.map((change, idx) => (
                                <div key={idx} className="text-sm">
                                  <span className="font-medium">{change.field}:</span>
                                  <span className="text-red-600 ml-2 line-through">
                                    {formatValue(change.old)}
                                  </span>
                                  <ArrowUpRight className="inline w-3 h-3 mx-1" />
                                  <span className="text-green-600">
                                    {formatValue(change.new)}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </TableCell>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-500">
            Showing {(page - 1) * limit + 1} to {Math.min(page * limit, total)} of {total} logs
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Diff Modal */}
      <Dialog open={showDiffModal} onOpenChange={setShowDiffModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Diff className="w-5 h-5" />
              Audit Log Details - {selectedLog?.entity}
            </DialogTitle>
          </DialogHeader>
          {selectedLog && (
            <div className="space-y-6 mt-4">
              {/* Log Info */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div>
                  <div className="text-sm text-gray-500">Entity ID</div>
                  <div className="font-mono text-sm">{selectedLog.entityId}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Action</div>
                  <Badge className={getActionConfig(selectedLog.action).color}>
                    {getActionConfig(selectedLog.action).label}
                  </Badge>
                </div>
                <div>
                  <div className="text-sm text-gray-500">User</div>
                  <div className="font-medium">
                    {selectedLog.user?.name || 'System'}
                  </div>
                  <div className="text-xs text-gray-500">
                    {selectedLog.user?.email || ''}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Timestamp</div>
                  <div className="font-medium">
                    {format(new Date(selectedLog.timestamp), 'MMM d, yyyy HH:mm:ss')}
                  </div>
                </div>
                {selectedLog.ipAddress && (
                  <div>
                    <div className="text-sm text-gray-500">IP Address</div>
                    <div className="font-mono text-sm">{selectedLog.ipAddress}</div>
                  </div>
                )}
              </div>

              {/* Changes Table */}
              {selectedLog.changes && selectedLog.changes.length > 0 ? (
                <div>
                  <h3 className="font-semibold mb-3">Field Changes</h3>
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[150px]">Field</TableHead>
                          <TableHead>Old Value</TableHead>
                          <TableHead>New Value</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedLog.changes.map((change, idx) => (
                          <TableRow key={idx}>
                            <TableCell className="font-medium">{change.field}</TableCell>
                            <TableCell className="text-red-600 bg-red-50 dark:bg-red-900/20">
                              {formatValue(change.old)}
                            </TableCell>
                            <TableCell className="text-green-600 bg-green-50 dark:bg-green-900/20">
                              {formatValue(change.new)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              ) : (
                <div className="p-4 border rounded-lg text-center text-gray-500">
                  <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p>No field-level changes recorded for this action</p>
                </div>
              )}

              {/* Old Values */}
              {selectedLog.oldValues && Object.keys(selectedLog.oldValues).length > 0 && (
                <div>
                  <h3 className="font-semibold mb-3">Old Values (JSON)</h3>
                  <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg text-sm overflow-auto max-h-64">
                    {JSON.stringify(selectedLog.oldValues, null, 2)}
                  </pre>
                </div>
              )}

              {/* New Values */}
              {selectedLog.newValues && Object.keys(selectedLog.newValues).length > 0 && (
                <div>
                  <h3 className="font-semibold mb-3">New Values (JSON)</h3>
                  <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg text-sm overflow-auto max-h-64">
                    {JSON.stringify(selectedLog.newValues, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
