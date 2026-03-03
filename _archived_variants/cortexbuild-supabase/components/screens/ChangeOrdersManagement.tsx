/**
 * Change Orders Management - Professional Change Order System
 * Complete workflow for managing construction change orders
 */

import React, { useState } from 'react';
import {
    FileEdit,
    DollarSign,
    Clock,
    CheckCircle,
    XCircle,
    AlertCircle,
    TrendingUp,
    Calendar,
    User as UserIcon,
    Download,
    Plus
} from 'lucide-react';
import { User } from '../../types';

interface ChangeOrder {
    id: string;
    number: string;
    title: string;
    description: string;
    project: string;
    requestedBy: string;
    requestDate: Date;
    status: 'draft' | 'pending-review' | 'approved' | 'rejected' | 'implemented';
    costImpact: number;
    timeImpact: number; // days
    priority: 'low' | 'medium' | 'high' | 'critical';
    approvedBy?: string;
    approvalDate?: Date;
}

export const ChangeOrdersManagement: React.FC<{ currentUser: User; goBack: () => void }> = ({ currentUser, goBack }) => {
    const [changeOrders, setChangeOrders] = useState<ChangeOrder[]>([
        {
            id: '1',
            number: 'CO-2025-001',
            title: 'Additional Steel Reinforcement',
            description: 'Engineer requested additional structural support for main beam',
            project: 'Downtown Plaza',
            requestedBy: 'John Smith',
            requestDate: new Date(Date.now() - 259200000),
            status: 'pending-review',
            costImpact: 45000,
            timeImpact: 5,
            priority: 'high'
        },
        {
            id: '2',
            number: 'CO-2025-002',
            title: 'HVAC System Upgrade',
            description: 'Client requested upgrade to high-efficiency HVAC system',
            project: 'Riverside Complex',
            requestedBy: 'Sarah Johnson',
            requestDate: new Date(Date.now() - 432000000),
            status: 'approved',
            costImpact: 125000,
            timeImpact: 12,
            priority: 'medium',
            approvedBy: 'Mike Davis',
            approvalDate: new Date(Date.now() - 172800000)
        },
        {
            id: '3',
            number: 'CO-2025-003',
            title: 'Electrical Panel Relocation',
            description: 'Code compliance requires electrical panel relocation',
            project: 'Harbor Development',
            requestedBy: 'Mike Davis',
            requestDate: new Date(Date.now() - 86400000),
            status: 'draft',
            costImpact: 12000,
            timeImpact: 2,
            priority: 'critical'
        }
    ]);

    const [filterStatus, setFilterStatus] = useState<string>('all');

    const filteredOrders = filterStatus === 'all' 
        ? changeOrders 
        : changeOrders.filter(co => co.status === filterStatus);

    const totalCostImpact = changeOrders.reduce((sum, co) => sum + co.costImpact, 0);
    const pendingCount = changeOrders.filter(co => co.status === 'pending-review').length;
    const approvedCount = changeOrders.filter(co => co.status === 'approved').length;

    const getStatusColor = (status: ChangeOrder['status']) => {
        const colors = {
            'draft': 'bg-gray-100 text-gray-800',
            'pending-review': 'bg-yellow-100 text-yellow-800',
            'approved': 'bg-green-100 text-green-800',
            'rejected': 'bg-red-100 text-red-800',
            'implemented': 'bg-blue-100 text-blue-800'
        };
        return colors[status];
    };

    const getPriorityColor = (priority: string) => {
        const colors = {
            low: 'text-green-600',
            medium: 'text-yellow-600',
            high: 'text-orange-600',
            critical: 'text-red-600'
        };
        return colors[priority as keyof typeof colors];
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <FileEdit className="h-8 w-8 text-blue-600" />
                                <h1 className="text-4xl font-bold text-gray-900">Change Orders</h1>
                            </div>
                            <p className="text-gray-600 text-lg">
                                Professional change order management and tracking
                            </p>
                        </div>
                        <button className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-lg font-medium">
                            <Plus className="h-5 w-5" />
                            New Change Order
                        </button>
                    </div>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white rounded-xl p-6 shadow-md border border-gray-200">
                        <div className="flex items-center justify-between mb-2">
                            <FileEdit className="h-6 w-6 text-blue-600" />
                            <span className="text-2xl font-bold text-gray-900">{changeOrders.length}</span>
                        </div>
                        <p className="text-sm text-gray-600">Total Change Orders</p>
                    </div>

                    <div className="bg-white rounded-xl p-6 shadow-md border border-gray-200">
                        <div className="flex items-center justify-between mb-2">
                            <Clock className="h-6 w-6 text-yellow-600" />
                            <span className="text-2xl font-bold text-gray-900">{pendingCount}</span>
                        </div>
                        <p className="text-sm text-gray-600">Pending Review</p>
                    </div>

                    <div className="bg-white rounded-xl p-6 shadow-md border border-gray-200">
                        <div className="flex items-center justify-between mb-2">
                            <CheckCircle className="h-6 w-6 text-green-600" />
                            <span className="text-2xl font-bold text-gray-900">{approvedCount}</span>
                        </div>
                        <p className="text-sm text-gray-600">Approved</p>
                    </div>

                    <div className="bg-white rounded-xl p-6 shadow-md border border-gray-200">
                        <div className="flex items-center justify-between mb-2">
                            <DollarSign className="h-6 w-6 text-purple-600" />
                            <span className="text-2xl font-bold text-gray-900">${(totalCostImpact / 1000).toFixed(0)}K</span>
                        </div>
                        <p className="text-sm text-gray-600">Total Cost Impact</p>
                    </div>
                </div>

                {/* Filter Bar */}
                <div className="bg-white rounded-xl p-4 shadow-md border border-gray-200 mb-8">
                    <div className="flex gap-2">
                        {['all', 'draft', 'pending-review', 'approved', 'rejected', 'implemented'].map((status) => (
                            <button
                                key={status}
                                onClick={() => setFilterStatus(status)}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors capitalize ${
                                    filterStatus === status
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                            >
                                {status.replace('-', ' ')}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Change Orders List */}
                <div className="space-y-4">
                    {filteredOrders.map((order) => (
                        <div key={order.id} className="bg-white rounded-xl shadow-md border border-gray-200 p-6 hover:shadow-lg transition-all">
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <h3 className="text-lg font-bold text-gray-900">{order.number}</h3>
                                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(order.status)}`}>
                                            {order.status.replace('-', ' ')}
                                        </span>
                                        <span className={`text-sm font-semibold capitalize ${getPriorityColor(order.priority)}`}>
                                            {order.priority} priority
                                        </span>
                                    </div>
                                    <h4 className="text-xl font-semibold text-gray-900 mb-2">{order.title}</h4>
                                    <p className="text-gray-600 mb-4">{order.description}</p>
                                    
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                        <div>
                                            <span className="text-gray-500">Project:</span>
                                            <p className="font-medium text-gray-900">{order.project}</p>
                                        </div>
                                        <div>
                                            <span className="text-gray-500">Requested By:</span>
                                            <p className="font-medium text-gray-900">{order.requestedBy}</p>
                                        </div>
                                        <div>
                                            <span className="text-gray-500">Cost Impact:</span>
                                            <p className="font-bold text-purple-600">${order.costImpact.toLocaleString()}</p>
                                        </div>
                                        <div>
                                            <span className="text-gray-500">Time Impact:</span>
                                            <p className="font-bold text-orange-600">+{order.timeImpact} days</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex flex-col gap-2 ml-4">
                                    {order.status === 'pending-review' && (
                                        <>
                                            <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium">
                                                Approve
                                            </button>
                                            <button className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium">
                                                Reject
                                            </button>
                                        </>
                                    )}
                                    <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-medium">
                                        View Details
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

