import React, { useState, useEffect, useCallback } from 'react';
import {
    Search,
    Filter,
    Download,
    ChevronLeft,
    ChevronRight,
    Clock,
    User,
    Shield,
    Database,
    Info,
    ExternalLink,
    Calendar,
    Eye,
    FileJson,
    FileSpreadsheet
} from 'lucide-react';
import { db } from '../services/db';
import { useToast } from '../contexts/ToastContext';
import { format } from 'date-fns';

interface AuditLog {
    id: string;
    action: string;
    userId: string;
    userName: string;
    resource: string;
    resourceId: string;
    companyId: string;
    companyName?: string;
    metadata: any;
    createdAt: string;
    timestamp: string;
    status: string;
    ipAddress?: string;
}

const AuditLogViewer: React.FC = () => {
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        action: 'ALL',
        userId: '',
        companyId: 'all',
        startDate: '',
        endDate: '',
        search: ''
    });
    const [pagination, setPagination] = useState({
        limit: 20,
        offset: 0,
        total: 0
    });
    const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
    const [isFilterOpen, setIsFilterOpen] = useState(false);

    const { error } = useToast();

    const fetchLogs = useCallback(async () => {
        setLoading(true);
        try {
            const data = await db.getPlatformAuditLogs({
                ...filters,
                limit: pagination.limit,
                offset: pagination.offset
            });
            setLogs(data);
            // Since our simple backend doesn't return total count for audit logs yet, 
            // we'll estimate or just show "Next" if we got a full page
        } catch (err) {
            error('Failed to fetch audit logs');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [filters, pagination.limit, pagination.offset, error]);

    useEffect(() => {
        fetchLogs();
    }, [fetchLogs]);

    const handleExport = (formatType: 'csv' | 'json') => {
        // In a real app, this would call a backend endpoint that streams the file
        // For now, we'll generate a basic client-side export of the current view
        if (logs.length === 0) return;

        if (formatType === 'json') {
            const blob = new Blob([JSON.stringify(logs, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `audit-export-${format(new Date(), 'yyyy-MM-dd')}.json`;
            a.click();
        } else {
            const headers = ['Timestamp', 'Actor', 'Action', 'Resource', 'Company', 'ID'];
            const rows = logs.map(log => [
                log.timestamp || log.createdAt,
                log.userName || log.userId,
                log.action,
                log.resource,
                log.companyId,
                log.id
            ]);
            const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
            const blob = new Blob([csvContent], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `audit-export-${format(new Date(), 'yyyy-MM-dd')}.csv`;
            a.click();
        }
    };

    const getActionColor = (action: string) => {
        if (action.includes('DELETE') || action.includes('REVOKE') || action.includes('FAILED')) return 'text-red-600 bg-red-50';
        if (action.includes('UPDATE') || action.includes('CHANGE')) return 'text-amber-600 bg-amber-50';
        if (action.includes('CREATE') || action.includes('ADD')) return 'text-green-600 bg-green-50';
        return 'text-indigo-600 bg-indigo-50';
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-[700px]">
            {/* Header */}
            <div className="p-6 border-b border-slate-200 bg-slate-50/50">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-indigo-600 flex items-center justify-center">
                            <Shield className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-slate-900">Platform Audit Logs</h2>
                            <p className="text-sm text-slate-500">Track all administrative and system actions</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setIsFilterOpen(!isFilterOpen)}
                            className={`flex items-center gap-2 px-4 py-2 border rounded-lg text-sm font-medium transition-all ${isFilterOpen ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                                }`}
                        >
                            <Filter className="w-4 h-4" />
                            Filters
                        </button>

                        <div className="relative group">
                            <button className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 transition-all">
                                <Download className="w-4 h-4" />
                                Export
                            </button>
                            <div className="absolute right-0 mt-2 w-40 bg-white border border-slate-200 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-20">
                                <button
                                    onClick={() => handleExport('csv')}
                                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 text-left rounded-t-lg"
                                >
                                    <FileSpreadsheet className="w-4 h-4 text-green-600" />
                                    Excel (CSV)
                                </button>
                                <button
                                    onClick={() => handleExport('json')}
                                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 text-left rounded-b-lg"
                                >
                                    <FileJson className="w-4 h-4 text-amber-600" />
                                    JSON
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Filters Panel */}
                {isFilterOpen && (
                    <div className="mt-4 p-4 bg-white border border-slate-200 rounded-xl grid grid-cols-1 md:grid-cols-4 gap-4 animate-in fade-in slide-in-from-top-2">
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Search Actor/ID</label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="UserID / Name..."
                                    value={filters.userId}
                                    onChange={(e) => setFilters(prev => ({ ...prev, userId: e.target.value }))}
                                    className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 text-sm"
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Action Type</label>
                            <select
                                value={filters.action}
                                onChange={(e) => setFilters(prev => ({ ...prev, action: e.target.value }))}
                                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 text-sm"
                            >
                                <option value="ALL">All Actions</option>
                                <option value="LOGIN">Logins</option>
                                <option value="USER_CREATE">User Creations</option>
                                <option value="USER_UPDATE">User Updates</option>
                                <option value="USER_DELETE">User Deletions</option>
                                <option value="COMPANY_SUSPEND">Company Suspend</option>
                                <option value="CONFIG_UPDATE">Settings Changed</option>
                            </select>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Date Range</label>
                            <div className="flex items-center gap-2">
                                <input
                                    type="date"
                                    value={filters.startDate}
                                    onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500/10"
                                />
                                <span className="text-slate-300">-</span>
                                <input
                                    type="date"
                                    value={filters.endDate}
                                    onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500/10"
                                />
                            </div>
                        </div>

                        <div className="flex items-end">
                            <button
                                onClick={() => setFilters({ action: 'ALL', userId: '', companyId: 'all', startDate: '', endDate: '', search: '' })}
                                className="w-full px-4 py-2 text-sm font-medium text-slate-500 hover:text-slate-700 transition-colors"
                            >
                                Reset Filters
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Logs Table */}
            <div className="flex-1 overflow-auto relative">
                {loading && (
                    <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px] flex items-center justify-center z-10">
                        <div className="flex flex-col items-center gap-3">
                            <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                            <span className="text-sm font-medium text-slate-600">Refreshing logs...</span>
                        </div>
                    </div>
                )}

                <table className="w-full text-left border-collapse min-w-[800px]">
                    <thead className="sticky top-0 bg-white border-b border-slate-200 z-10">
                        <tr>
                            <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Time</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Actor</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Action</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Resource</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Company</th>
                            <th className="px-6 py-4 text-right text-xs font-bold text-slate-400 uppercase tracking-wider">Details</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {logs.length === 0 && !loading ? (
                            <tr>
                                <td colSpan={6} className="px-6 py-12 text-center">
                                    <div className="max-w-xs mx-auto text-slate-400">
                                        <Clock className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                        <p className="text-sm">No audit logs found matching your criteria.</p>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            logs.map((log) => (
                                <tr key={log.id} className="hover:bg-slate-50/50 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col">
                                            <span className="text-sm font-medium text-slate-900">
                                                {format(new Date(log.timestamp || log.createdAt), 'MMM dd, HH:mm:ss')}
                                            </span>
                                            <span className="text-[10px] text-slate-400">
                                                {format(new Date(log.timestamp || log.createdAt), 'yyyy')}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center">
                                                <User className="w-3.5 h-3.5 text-slate-500" />
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-sm font-medium text-slate-900 truncate max-w-[120px]">
                                                    {log.userName || 'System'}
                                                </span>
                                                <span className="text-[10px] text-slate-400 font-mono">
                                                    ID: {log.userId?.slice(0, 8)}...
                                                </span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-bold ${getActionColor(log.action)}`}>
                                            {log.action}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-1.5 text-slate-600">
                                            <Database className="w-3.5 h-3.5" />
                                            <span className="text-sm">{log.resource}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-sm text-slate-600 truncate max-w-[100px]">
                                            {log.companyId === 'system' ? (
                                                <span className="text-xs font-bold text-slate-400 tracking-tighter uppercase italic">Platform</span>
                                            ) : (
                                                log.companyName || log.companyId
                                            )}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button
                                            onClick={() => setSelectedLog(log)}
                                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                                        >
                                            <Eye className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination Container */}
            <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between bg-slate-50/50">
                <div className="text-xs text-slate-500 font-medium font-mono uppercase tracking-widest">
                    {logs.length} entries in view
                </div>
                <div className="flex items-center gap-2">
                    <button
                        disabled={pagination.offset === 0}
                        onClick={() => setPagination(prev => ({ ...prev, offset: Math.max(0, prev.offset - prev.limit) }))}
                        className="p-1.5 border border-slate-200 rounded-lg text-slate-600 hover:bg-white disabled:opacity-40 transition-all shadow-sm"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                        disabled={logs.length < pagination.limit}
                        onClick={() => setPagination(prev => ({ ...prev, offset: prev.offset + prev.limit }))}
                        className="p-1.5 border border-slate-200 rounded-lg text-slate-600 hover:bg-white disabled:opacity-40 transition-all shadow-sm"
                    >
                        <ChevronRight className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Detail Modal Overly Drawer */}
            {selectedLog && (
                <div className="absolute inset-0 z-30 flex justify-end animate-in fade-in duration-200">
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setSelectedLog(null)} />
                    <div className="relative w-full max-w-lg bg-white shadow-2xl h-full flex flex-col animate-in slide-in-from-right duration-300">
                        <div className="p-6 border-b border-slate-200 flex items-center justify-between bg-white sticky top-0 z-10">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
                                    <Info className="w-5 h-5 text-slate-600" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-slate-900">Event Details</h3>
                                    <p className="text-xs text-slate-500">ID: {selectedLog.id}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setSelectedLog(null)}
                                className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                            >
                                <ChevronRight className="w-6 h-6 text-slate-400" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-auto p-6 space-y-8">
                            {/* Event Metadata Cards */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                                    <div className="flex items-center gap-2 text-slate-400 mb-2">
                                        <Clock className="w-4 h-4" />
                                        <span className="text-[10px] font-bold uppercase tracking-wider">Timestamp</span>
                                    </div>
                                    <div className="text-sm font-medium text-slate-900">
                                        {format(new Date(selectedLog.timestamp || selectedLog.createdAt), 'yyyy-MM-dd HH:mm:ss')}
                                    </div>
                                </div>
                                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                                    <div className="flex items-center gap-2 text-slate-400 mb-2">
                                        <Shield className="w-4 h-4" />
                                        <span className="text-[10px] font-bold uppercase tracking-wider">Action</span>
                                    </div>
                                    <div className={`text-sm font-bold ${getActionColor(selectedLog.action)}`}>
                                        {selectedLog.action}
                                    </div>
                                </div>
                                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                                    <div className="flex items-center gap-2 text-slate-400 mb-2">
                                        <User className="w-4 h-4" />
                                        <span className="text-[10px] font-bold uppercase tracking-wider">Actor</span>
                                    </div>
                                    <div className="text-sm font-medium text-slate-900">{selectedLog.userName}</div>
                                    <div className="text-xs text-slate-400 font-mono truncate">{selectedLog.userId}</div>
                                </div>
                                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                                    <div className="flex items-center gap-2 text-slate-400 mb-2">
                                        <Database className="w-4 h-4" />
                                        <span className="text-[10px] font-bold uppercase tracking-wider">Resource</span>
                                    </div>
                                    <div className="text-sm font-medium text-slate-900">{selectedLog.resource}</div>
                                    <div className="text-xs text-slate-400 font-mono truncate">{selectedLog.resourceId || 'N/A'}</div>
                                </div>
                            </div>

                            {/* Data Diff / Metadata section */}
                            <div className="space-y-3">
                                <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                                    <FileJson className="w-4 h-4 text-indigo-500" />
                                    Meta Information & Change Data
                                </h4>
                                <div className="bg-slate-900 rounded-xl p-4 overflow-hidden shadow-inner">
                                    <pre className="text-xs text-indigo-300 font-mono overflow-auto max-h-[300px] scrollbar-thin scrollbar-thumb-indigo-900">
                                        {JSON.stringify(selectedLog.metadata || {}, null, 2)}
                                    </pre>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
                            <button className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-slate-600 uppercase tracking-widest transition-colors">
                                <ExternalLink className="w-3.5 h-3.5" />
                                View Full Context
                            </button>
                            <button
                                onClick={() => setSelectedLog(null)}
                                className="px-6 py-2 bg-slate-900 text-white rounded-lg text-sm font-bold hover:bg-slate-800 transition-all shadow-lg"
                            >
                                Close Details
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AuditLogViewer;
