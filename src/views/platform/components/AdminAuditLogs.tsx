import React, { useState, useEffect } from 'react';
import {
    Search, Filter, Calendar, Download,
    Shield, Activity, User, Building,
    RefreshCcw, AlertTriangle, CheckCircle2,
    Info, Clock, ChevronDown, PlusCircle
} from 'lucide-react';
import { db } from '@/services/db';
import { useToast } from '@/contexts/ToastContext';
import { Tenant } from '@/types';

export const AdminAuditLogs: React.FC = () => {
    const { addToast } = useToast();
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [companies, setCompanies] = useState<Tenant[]>([]);
    const [users, setUsers] = useState<any[]>([]);

    // Filters
    const [filters, setFilters] = useState({
        companyId: '',
        userId: '',
        action: 'ALL',
        resource: 'ALL',
        startDate: '',
        endDate: '',
        search: ''
    });

    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);

    useEffect(() => {
        loadInitialData();
        loadLogs(true);
    }, []);

    const loadInitialData = async () => {
        try {
            const [companyList, userList] = await Promise.all([
                db.getCompanies(),
                db.getAllPlatformUsers()
            ]);
            setCompanies(companyList);
            setUsers(userList);
        } catch (error) {
            console.error('Failed to load filter data', error);
        }
    };

    const loadLogs = async (refresh = false) => {
        try {
            setLoading(true);
            const currentOffset = refresh ? 0 : page * 50;
            const data = await db.getPlatformAuditLogs({
                ...filters,
                limit: 50,
                offset: currentOffset
            });

            if (refresh) {
                setLogs(data);
                setPage(1);
            } else {
                setLogs(prev => [...prev, ...data]);
                setPage(prev => prev + 1);
            }

            setHasMore(data.length === 50);
        } catch (error) {
            addToast('Failed to load audit logs', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleFilterChange = (key: string, value: string) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    const applyFilters = () => {
        loadLogs(true);
    };

    const resetFilters = () => {
        setFilters({
            companyId: '',
            userId: '',
            action: 'ALL',
            resource: 'ALL',
            startDate: '',
            endDate: '',
            search: ''
        });
        loadLogs(true);
    };

    const getActionIcon = (action: string) => {
        switch (action.toLowerCase()) {
            case 'create': return <PlusCircle className="text-emerald-500" size={16} />;
            case 'update': return <RefreshCcw className="text-blue-500" size={16} />;
            case 'delete': return <AlertTriangle className="text-red-500" size={16} />;
            case 'login': return <Shield className="text-indigo-500" size={16} />;
            default: return <Info className="text-zinc-400" size={16} />;
        }
    };

    const getActionColor = (action: string) => {
        switch (action.toLowerCase()) {
            case 'create': return 'bg-emerald-50 text-emerald-700 border-emerald-100';
            case 'update': return 'bg-blue-50 text-blue-700 border-blue-100';
            case 'delete': return 'bg-red-50 text-red-700 border-red-100';
            case 'login': return 'bg-indigo-50 text-indigo-700 border-indigo-100';
            default: return 'bg-zinc-50 text-zinc-700 border-zinc-100';
        }
    };

    return (
        <div className="space-y-6">
            {/* Header & Main Actions */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                        <Activity className="text-indigo-600" /> Platform Audit Trail
                    </h2>
                    <p className="text-zinc-500 text-sm">Security events and system-wide activity logs</p>
                </div>
                <div className="flex items-center gap-2">
                    <button className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm font-bold text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 transition-all">
                        <Download size={16} /> Export CSV
                    </button>
                    <button onClick={() => loadLogs(true)} className="p-2 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-100 transition-all">
                        <RefreshCcw size={20} className={loading ? 'animate-spin' : ''} />
                    </button>
                </div>
            </div>

            {/* Filter Bar */}
            <div className="bg-white dark:bg-zinc-800 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-700 shadow-sm space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest px-1">Company</label>
                        <select
                            value={filters.companyId}
                            onChange={(e) => handleFilterChange('companyId', e.target.value)}
                            className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20"
                        >
                            <option value="">All Companies</option>
                            {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest px-1">User</label>
                        <select
                            value={filters.userId}
                            onChange={(e) => handleFilterChange('userId', e.target.value)}
                            className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20"
                        >
                            <option value="">All Users</option>
                            {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                        </select>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest px-1">Action Type</label>
                        <select
                            value={filters.action}
                            onChange={(e) => handleFilterChange('action', e.target.value)}
                            className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20"
                        >
                            <option value="ALL">All Actions</option>
                            <option value="CREATE">Create</option>
                            <option value="UPDATE">Update</option>
                            <option value="DELETE">Delete</option>
                            <option value="LOGIN">Login</option>
                        </select>
                    </div>

                    <div className="flex items-end gap-2">
                        <button
                            onClick={applyFilters}
                            className="flex-1 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 h-10 px-4 py-2 rounded-xl text-sm font-bold hover:opacity-90 transition-all"
                        >
                            Apply Filters
                        </button>
                        <button
                            onClick={resetFilters}
                            className="bg-zinc-100 dark:bg-zinc-700 h-10 px-3 py-2 rounded-xl text-sm font-bold text-zinc-600 dark:text-zinc-200 hover:bg-zinc-200 transition-all"
                        >
                            Reset
                        </button>
                    </div>
                </div>

                <div className="pt-2 border-t border-zinc-100 dark:border-zinc-700 flex flex-col md:flex-row gap-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
                        <input
                            type="text"
                            placeholder="Search by keywords, IP address, or specific resource ID..."
                            className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl pl-10 pr-4 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20"
                            value={filters.search}
                            onChange={(e) => handleFilterChange('search', e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
                        />
                    </div>
                </div>
            </div>

            {/* Logs Table */}
            <div className="bg-white dark:bg-zinc-800 rounded-2xl border border-zinc-200 dark:border-zinc-700 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-700">
                            <tr>
                                <th className="px-6 py-4 text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">Time</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">User</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">Action</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">Resource</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">Company</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest text-right">Details</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100 dark:divide-zinc-700">
                            {logs.length > 0 ? logs.map((log) => (
                                <tr key={log.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-700/30 transition-all group">
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col">
                                            <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                                                {new Date(log.timestamp).toLocaleTimeString()}
                                            </span>
                                            <span className="text-[10px] text-zinc-500">
                                                {new Date(log.timestamp).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-700 flex items-center justify-center text-xs font-bold text-zinc-600 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-600">
                                                {log.userName?.[0]?.toUpperCase() || 'U'}
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-sm font-bold text-zinc-800 dark:text-zinc-200">{log.userName || 'Unknown User'}</span>
                                                <span className="text-[10px] text-zinc-500 font-mono">{log.userId?.split('-')[0]}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-bold border uppercase tracking-wider ${getActionColor(log.action)}`}>
                                            {log.action}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col">
                                            <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{log.resource}</span>
                                            <span className="text-[10px] text-zinc-500 font-mono">{log.resourceId}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-sm text-zinc-600 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-md border border-zinc-200 dark:border-zinc-700">
                                            {companies.find(c => c.id === log.tenantId)?.name || log.tenantId || 'Platform'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button className="p-2 text-zinc-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-xl transition-all">
                                            <ChevronDown size={18} />
                                        </button>
                                    </td>
                                </tr>
                            )) : !loading && (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center">
                                        <div className="flex flex-col items-center justify-center space-y-2 text-zinc-400">
                                            <Clock size={40} className="opacity-20 mb-2" />
                                            <p className="font-bold">No activity logs found</p>
                                            <p className="text-sm">Try adjusting your filters or search keywords</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {hasMore && (
                    <div className="p-4 border-t border-zinc-100 dark:border-zinc-700 flex justify-center">
                        <button
                            onClick={() => loadLogs()}
                            disabled={loading}
                            className="px-6 py-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm font-bold text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 transition-all flex items-center gap-2"
                        >
                            {loading ? <RefreshCcw size={16} className="animate-spin" /> : 'Load More Entries'}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};
