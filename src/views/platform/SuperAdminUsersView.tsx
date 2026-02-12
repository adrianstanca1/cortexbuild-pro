import React, { useState, useEffect } from 'react';
import {
    Users, UserPlus, Shield, Mail, Phone,
    MoreVertical, Search, Filter, RefreshCw,
    UserCheck, UserMinus, Key, Trash2, Building2,
    CheckCircle, AlertCircle, XCircle, ChevronRight
} from 'lucide-react';
import { db } from '@/services/db';
import { useToast } from '@/contexts/ToastContext';
import { UserRole, Tenant } from '@/types';

export const SuperAdminUsersView: React.FC = () => {
    const { addToast } = useToast();
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [companies, setCompanies] = useState<Tenant[]>([]);
    const [showProvisionModal, setShowProvisionModal] = useState(false);

    // Filters & Pagination
    const [filters, setFilters] = useState({
        role: 'all',
        status: 'all',
        companyId: '',
        search: ''
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [userList, companyList] = await Promise.all([
                db.getAllPlatformUsers(filters.companyId, filters),
                db.getCompanies()
            ]);
            setUsers(userList);
            setCompanies(companyList);
        } catch (error) {
            addToast('Failed to load users', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateStatus = async (userId: string, currentStatus: string) => {
        const nextStatus = currentStatus === 'active' ? 'suspended' : 'active';
        try {
            await db.updateUserStatus(userId, nextStatus);
            addToast(`User ${nextStatus === 'active' ? 'activated' : 'suspended'}`, 'success');
            loadData();
        } catch (error) {
            addToast('Failed to update user status', 'error');
        }
    };

    const handleResetPassword = async (userId: string) => {
        if (!confirm('Send a password reset link to this user?')) return;
        try {
            await db.resetUserPassword(userId);
            addToast('Password reset link sent', 'success');
        } catch (error) {
            addToast('Failed to send reset link', 'error');
        }
    };

    const handleDeleteUser = async (userId: string) => {
        if (!confirm('Are you sure you want to PERMANENTLY delete this user? This action is irreversible.')) return;
        try {
            await db.deleteUser(userId);
            addToast('User deleted successfully', 'success');
            loadData();
        } catch (error) {
            addToast('Failed to delete user', 'error');
        }
    };

    const getStatusStyles = (status: string) => {
        switch (status.toLowerCase()) {
            case 'active': return 'bg-emerald-50 text-emerald-700 border-emerald-100';
            case 'suspended': return 'bg-red-50 text-red-700 border-red-100';
            case 'pending': return 'bg-amber-50 text-amber-700 border-amber-100';
            default: return 'bg-zinc-50 text-zinc-700 border-zinc-100';
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                        <Users className="text-indigo-600" /> User Management
                    </h2>
                    <p className="text-zinc-500 text-sm">Monitor and manage access across all organizations</p>
                </div>
                <button
                    onClick={() => setShowProvisionModal(true)}
                    className="flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/20 active:scale-95"
                >
                    <UserPlus size={18} /> Provision User
                </button>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[
                    { label: 'Total Users', value: users.length, icon: Users, color: 'blue' },
                    { label: 'Active Now', value: users.filter(u => u.status === 'active').length, icon: UserCheck, color: 'emerald' },
                    { label: 'Platform Admins', value: users.filter(u => u.role === 'superadmin').length, icon: Shield, color: 'indigo' },
                    { label: 'Suspended', value: users.filter(u => u.status === 'suspended').length, icon: UserMinus, color: 'red' },
                ].map((stat, i) => (
                    <div key={i} className="bg-white dark:bg-zinc-800 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-700 shadow-sm flex items-center gap-4">
                        <div className={`p-3 rounded-xl bg-${stat.color}-50 dark:bg-${stat.color}-900/20 text-${stat.color}-600 dark:text-${stat.color}-400`}>
                            <stat.icon size={24} />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{stat.label}</p>
                            <p className="text-xl font-black text-zinc-900 dark:text-white">{stat.value}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Filters */}
            <div className="bg-white dark:bg-zinc-800 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-700 shadow-sm flex flex-col md:flex-row gap-4 items-end">
                <div className="flex-1 space-y-1.5 w-full">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest px-1">Global Search</label>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
                        <input
                            type="text"
                            placeholder="Search by name, email, or user ID..."
                            className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl pl-10 pr-4 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-medium"
                            value={filters.search}
                            onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                            onKeyDown={(e) => e.key === 'Enter' && loadData()}
                        />
                    </div>
                </div>

                <div className="w-full md:w-48 space-y-1.5">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest px-1">Organization</label>
                    <select
                        value={filters.companyId}
                        onChange={(e) => setFilters(prev => ({ ...prev, companyId: e.target.value }))}
                        className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-sm outline-none font-medium"
                    >
                        <option value="">All Organizations</option>
                        {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                </div>

                <div className="w-full md:w-40 space-y-1.5">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest px-1">Global Role</label>
                    <select
                        value={filters.role}
                        onChange={(e) => setFilters(prev => ({ ...prev, role: e.target.value }))}
                        className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-sm outline-none font-medium text-indigo-600 font-bold"
                    >
                        <option value="all">All Roles</option>
                        <option value="superadmin">Super Admin</option>
                        <option value="company_admin">Company Admin</option>
                        <option value="manager">Manager</option>
                        <option value="operative">Operative</option>
                    </select>
                </div>

                <button
                    onClick={loadData}
                    className="bg-indigo-50 text-indigo-600 h-10 px-4 rounded-xl hover:bg-indigo-100 transition-all flex items-center justify-center"
                >
                    <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                </button>
            </div>

            {/* Users Table */}
            <div className="bg-white dark:bg-zinc-800 rounded-2xl border border-zinc-200 dark:border-zinc-700 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-700">
                            <tr>
                                <th className="px-6 py-4 text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">User Profile</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">Main Organization</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">Access Role</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">Account Status</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100 dark:divide-zinc-700 font-medium">
                            {users.length > 0 ? users.map((user) => (
                                <tr key={user.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-700/30 transition-all group">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="relative">
                                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-sm font-black text-white border-2 border-white shadow-sm overflow-hidden">
                                                    {user.avatar ? <img src={user.avatar} className="w-full h-full object-cover" /> : (user.name?.[0]?.toUpperCase() || 'U')}
                                                </div>
                                                <div className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white dark:border-zinc-800 ${user.status === 'active' ? 'bg-emerald-500' : 'bg-zinc-300'}`} />
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-sm font-bold text-zinc-800 dark:text-zinc-200">{user.name || 'Unnamed'}</span>
                                                <span className="text-[10px] text-zinc-500 flex items-center gap-1"><Mail size={10} /> {user.email}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400 text-sm">
                                            <Building2 size={16} className="text-zinc-400" />
                                            <span>{companies.find(c => c.id === user.companyId)?.name || 'Direct / Platform'}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${user.role === 'superadmin' ? 'bg-indigo-50 text-indigo-700 border-indigo-100' : 'bg-zinc-50 text-zinc-700 border-zinc-100'}`}>
                                                {user.role}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${getStatusStyles(user.status)}`}>
                                            {user.status === 'active' ? <CheckCircle size={10} className="mr-1" /> : <XCircle size={10} className="mr-1" />}
                                            {user.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => handleUpdateStatus(user.id, user.status)} className="p-2 text-zinc-400 hover:text-indigo-600 hover:bg-white rounded-xl shadow-sm border border-transparent hover:border-zinc-100 transition-all" title={user.status === 'active' ? 'Suspend Account' : 'Activate Account'}>
                                                {user.status === 'active' ? <UserMinus size={18} /> : <UserCheck size={18} />}
                                            </button>
                                            <button onClick={() => handleResetPassword(user.id)} className="p-2 text-zinc-400 hover:text-indigo-600 hover:bg-white rounded-xl shadow-sm border border-transparent hover:border-zinc-100 transition-all" title="Reset Password">
                                                <Key size={18} />
                                            </button>
                                            <button onClick={() => handleDeleteUser(user.id)} className="p-2 text-zinc-400 hover:text-red-600 hover:bg-white rounded-xl shadow-sm border border-transparent hover:border-zinc-100 transition-all" title="Delete User">
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            )) : !loading && (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-zinc-500 italic">No users matching current filters found.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
