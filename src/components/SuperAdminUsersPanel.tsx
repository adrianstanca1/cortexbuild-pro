import React, { useState, useEffect } from 'react';
import {
    Users,
    Search,
    Filter,
    Shield,
    UserX,
    UserCheck,
    Key,
    Trash2,
    CheckCircle2,
    XCircle,
    Clock,
    Building2,
    Mail,
    ChevronDown,
    RefreshCw,
    AlertTriangle
} from 'lucide-react';
import { db } from '../services/db';
import { useToast } from '../contexts/ToastContext';
import ConfirmationModal from './ConfirmationModal';

interface PlatformUser {
    id: string;
    email: string;
    name: string;
    role: string;
    status: string;
    companyId: string;
    companyName?: string;
    isActive: boolean;
    createdAt: string;
}

interface SuperAdminUsersPanelProps {
    className?: string;
}

const SuperAdminUsersPanel: React.FC<SuperAdminUsersPanelProps> = ({ className = "" }) => {
    const [users, setUsers] = useState<PlatformUser[]>([]);
    const [totalUsers, setTotalUsers] = useState(0);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [roleFilter, setRoleFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');
    const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
    const [confirmModal, setConfirmModal] = useState<{
        isOpen: boolean;
        action: 'suspend' | 'activate' | 'reset_password' | 'delete' | null;
        userIds: string[];
        title: string;
        message: string;
        variant: 'danger' | 'warning' | 'info';
    }>({
        isOpen: false,
        action: null,
        userIds: [],
        title: '',
        message: '',
        variant: 'info'
    });

    const { success, error, info } = useToast();

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const result = await db.searchPlatformUsers(searchQuery, roleFilter, statusFilter);
            setUsers(result.users);
            setTotalUsers(result.total);
        } catch (err) {
            error('Failed to fetch platform users');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const handler = setTimeout(() => {
            fetchUsers();
        }, 500);
        return () => clearTimeout(handler);
    }, [searchQuery, roleFilter, statusFilter]);

    const handleSelectUser = (userId: string) => {
        setSelectedUsers(prev =>
            prev.includes(userId)
                ? prev.filter(id => id !== userId)
                : [...prev, userId]
        );
    };

    const handleSelectAll = () => {
        if (selectedUsers.length === users.length) {
            setSelectedUsers([]);
        } else {
            setSelectedUsers(users.map(u => u.id));
        }
    };

    const initiateBulkAction = (action: 'suspend' | 'activate' | 'reset_password' | 'delete') => {
        if (selectedUsers.length === 0) {
            info('Please select at least one user');
            return;
        }

        const titles = {
            suspend: `Suspend ${selectedUsers.length} Users`,
            activate: `Activate ${selectedUsers.length} Users`,
            reset_password: `Reset Password for ${selectedUsers.length} Users`,
            delete: `Delete ${selectedUsers.length} Users`
        };

        const messages = {
            suspend: 'Are you sure you want to suspend the selected users? They will lose access to the platform immediately.',
            activate: 'Are you sure you want to activate the selected users?',
            reset_password: 'Are you sure you want to reset passwords for the selected users? They will receive an email with instructions.',
            delete: 'Are you sure you want to delete the selected users? This action is permanent and cannot be undone.'
        };

        const variants: Record<string, 'danger' | 'warning' | 'info'> = {
            suspend: 'danger',
            activate: 'info',
            reset_password: 'warning',
            delete: 'danger'
        };

        setConfirmModal({
            isOpen: true,
            action,
            userIds: selectedUsers,
            title: titles[action],
            message: messages[action],
            variant: variants[action] || 'info'
        });
    };

    const executeBulkAction = async () => {
        if (!confirmModal.action) return;

        try {
            const result = await db.bulkUserAction(confirmModal.userIds, confirmModal.action);
            if (result.success) {
                success(`Successfully performed ${confirmModal.action} on ${result.results.success} users`);
                if (result.results.failed > 0) {
                    error(`Failed to process ${result.results.failed} users`);
                }
                setSelectedUsers([]);
                fetchUsers();
            }
        } catch (err) {
            error(`Failed to execute bulk ${confirmModal.action}`);
        } finally {
            setConfirmModal(prev => ({ ...prev, isOpen: false }));
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status.toLowerCase()) {
            case 'active': return <CheckCircle2 className="w-4 h-4 text-green-500" />;
            case 'suspended': return <XCircle className="w-4 h-4 text-red-500" />;
            case 'invited': return <Clock className="w-4 h-4 text-blue-500" />;
            default: return <AlertTriangle className="w-4 h-4 text-gray-500" />;
        }
    };

    const getRoleBadge = (role: string) => {
        const roles: Record<string, { color: string, icon: any }> = {
            'admin': { color: 'bg-indigo-100 text-indigo-700', icon: Shield },
            'superadmin': { color: 'bg-purple-100 text-purple-700', icon: Shield },
            'user': { color: 'bg-gray-100 text-gray-700', icon: Users },
            'manager': { color: 'bg-blue-100 text-blue-700', icon: Users }
        };

        const config = roles[role.toLowerCase()] || roles['user'];
        const Icon = config.icon;

        return (
            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${config.color}`}>
                <Icon className="w-3 h-3 mr-1" />
                {role}
            </span>
        );
    };

    return (
        <div className={`bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden ${className}`}>
            {/* Header */}
            <div className="p-6 border-b border-slate-200">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center">
                            <Users className="w-6 h-6 text-indigo-600" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-slate-900">Platform User Management</h2>
                            <p className="text-sm text-slate-500">{totalUsers} users across all companies</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={fetchUsers}
                            className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                            title="Refresh users"
                        >
                            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                        </button>
                    </div>
                </div>

                {/* Filters & Search */}
                <div className="mt-6 flex flex-col lg:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search by name, email, or company..."
                            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg">
                            <Filter className="w-4 h-4 text-slate-400" />
                            <select
                                className="bg-transparent border-none text-sm focus:ring-0 text-slate-700"
                                value={roleFilter}
                                onChange={(e) => setRoleFilter(e.target.value)}
                            >
                                <option value="all">All Roles</option>
                                <option value="admin">Admin</option>
                                <option value="user">User</option>
                                <option value="superadmin">SuperAdmin</option>
                            </select>
                        </div>

                        <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg">
                            <ChevronDown className="w-4 h-4 text-slate-400" />
                            <select
                                className="bg-transparent border-none text-sm focus:ring-0 text-slate-700"
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                            >
                                <option value="all">All Status</option>
                                <option value="active">Active</option>
                                <option value="suspended">Suspended</option>
                                <option value="invited">Invited</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bulk Actions Toolbar */}
            {selectedUsers.length > 0 && (
                <div className="bg-indigo-50 px-6 py-3 border-b border-indigo-100 flex items-center justify-between animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-indigo-700">{selectedUsers.length} users selected</span>
                        <div className="h-4 w-px bg-indigo-200" />
                        <button
                            onClick={handleSelectAll}
                            className="text-xs font-medium text-indigo-600 hover:text-indigo-800 transition-colors"
                        >
                            {selectedUsers.length === users.length ? 'Deselect All' : 'Select All'}
                        </button>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => initiateBulkAction('activate')}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-white text-green-600 border border-green-200 rounded-lg text-xs font-semibold hover:bg-green-50 transition-all shadow-sm"
                        >
                            <UserCheck className="w-3.5 h-3.5" />
                            Activate
                        </button>
                        <button
                            onClick={() => initiateBulkAction('suspend')}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-white text-orange-600 border border-orange-200 rounded-lg text-xs font-semibold hover:bg-orange-50 transition-all shadow-sm"
                        >
                            <UserX className="w-3.5 h-3.5" />
                            Suspend
                        </button>
                        <button
                            onClick={() => initiateBulkAction('reset_password')}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-white text-blue-600 border border-blue-200 rounded-lg text-xs font-semibold hover:bg-blue-50 transition-all shadow-sm"
                        >
                            <Key className="w-3.5 h-3.5" />
                            Reset Pass
                        </button>
                        <button
                            onClick={() => initiateBulkAction('delete')}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-white text-red-600 border border-red-200 rounded-lg text-xs font-semibold hover:bg-red-50 transition-all shadow-sm"
                        >
                            <Trash2 className="w-3.5 h-3.5" />
                            Delete
                        </button>
                    </div>
                </div>
            )}

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                            <th className="pl-6 py-3 w-10">
                                <input
                                    type="checkbox"
                                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                                    checked={selectedUsers.length > 0 && selectedUsers.length === users.length}
                                    onChange={handleSelectAll}
                                />
                            </th>
                            <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">User</th>
                            <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Company</th>
                            <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Role</th>
                            <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                            <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right pr-6">Last Active</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {loading ? (
                            Array.from({ length: 5 }).map((_, i) => (
                                <tr key={i} className="animate-pulse">
                                    <td className="pl-6 py-4"><div className="w-4 h-4 bg-slate-100 rounded" /></td>
                                    <td className="px-4 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 bg-slate-100 rounded-full" />
                                            <div className="space-y-2">
                                                <div className="w-24 h-3 bg-slate-100 rounded" />
                                                <div className="w-32 h-2.5 bg-slate-50 rounded" />
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-4"><div className="w-20 h-4 bg-slate-50 rounded" /></td>
                                    <td className="px-4 py-4"><div className="w-16 h-5 bg-slate-50 rounded" /></td>
                                    <td className="px-4 py-4"><div className="w-12 h-4 bg-slate-50 rounded" /></td>
                                    <td className="px-4 py-4 text-right pr-6"><div className="w-20 h-3 bg-slate-50 rounded ml-auto" /></td>
                                </tr>
                            ))
                        ) : users.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="py-12 text-center">
                                    <div className="flex flex-col items-center justify-center text-slate-500 gap-2">
                                        <Users className="w-12 h-12 text-slate-200" />
                                        <p className="font-medium">No users found matching your criteria</p>
                                        <button
                                            onClick={() => { setSearchQuery(''); setRoleFilter('all'); setStatusFilter('all'); }}
                                            className="text-sm text-indigo-600 hover:underline"
                                        >
                                            Clear all filters
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            users.map((user) => (
                                <tr
                                    key={user.id}
                                    className={`hover:bg-slate-50 transition-colors group ${selectedUsers.includes(user.id) ? 'bg-indigo-50/30' : ''}`}
                                >
                                    <td className="pl-6 py-4">
                                        <input
                                            type="checkbox"
                                            className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                                            checked={selectedUsers.includes(user.id)}
                                            onChange={() => handleSelectUser(user.id)}
                                        />
                                    </td>
                                    <td className="px-4 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-600 border border-slate-200">
                                                {user.name.charAt(0).toUpperCase()}
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-sm font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">{user.name}</span>
                                                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                                                    <Mail className="w-3 h-3" />
                                                    {user.email}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-4">
                                        <div className="flex items-center gap-2 text-sm text-slate-600">
                                            <Building2 className="w-3.5 h-3.5 text-slate-400" />
                                            {user.companyName || 'Unassigned'}
                                        </div>
                                    </td>
                                    <td className="px-4 py-4">
                                        {getRoleBadge(user.role)}
                                    </td>
                                    <td className="px-4 py-4">
                                        <div className="flex items-center gap-1.5 text-sm font-medium text-slate-700">
                                            {getStatusIcon(user.status)}
                                            <span className="capitalize">{user.status}</span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-4 text-right pr-6">
                                        <span className="text-xs font-mono text-slate-500">
                                            {new Date(user.createdAt).toLocaleDateString()}
                                        </span>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Footer / Pagination */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
                <p className="text-xs text-slate-500">
                    Showing <span className="font-semibold">{users.length}</span> of <span className="font-semibold">{totalUsers}</span> users
                </p>

                {totalUsers > users.length && (
                    <p className="text-xs text-slate-400 italic">Scroll for more users (experimental)</p>
                )}
            </div>

            <ConfirmationModal
                isOpen={confirmModal.isOpen}
                onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                onConfirm={executeBulkAction}
                title={confirmModal.title}
                message={confirmModal.message}
                variant={confirmModal.variant}
            />
        </div>
    );
};

export default SuperAdminUsersPanel;
