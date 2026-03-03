/**
 * Resource Optimization Dashboard - AI-Powered Resource Management
 * Intelligent resource allocation, equipment tracking, and workforce optimization
 */

import React, { useState, useEffect } from 'react';
import {
    Package,
    Wrench,
    Truck,
    Users,
    TrendingUp,
    AlertCircle,
    CheckCircle,
    Clock,
    DollarSign,
    Activity,
    Zap,
    BarChart3
} from 'lucide-react';
import { User } from '../../types';
import { supabase } from '../../supabaseClient';

interface Resource {
    id: string;
    name: string;
    type: 'equipment' | 'material' | 'labor';
    status: 'available' | 'in-use' | 'maintenance' | 'reserved';
    location: string;
    project?: string;
    utilizationRate: number;
    costPerDay: number;
    nextMaintenance?: Date;
}

interface ResourceOptimizationDashboardProps {
    currentUser: User;
    goBack: () => void;
}

export const ResourceOptimizationDashboard: React.FC<ResourceOptimizationDashboardProps> = ({ currentUser, goBack }) => {
    const [resources, setResources] = useState<Resource[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            try {
                if (!supabase) { setResources([]); return; }
                const { data } = await supabase
                    .from('resources')
                    .select('id, name, type, status, location, utilization, daily_cost, project:projects(name)')
                    .order('name', { ascending: true });
                const mapped: Resource[] = (data || []).map((row: any) => ({
                    id: row.id,
                    name: row.name,
                    type: row.type,
                    status: row.status,
                    location: row.location || '',
                    project: row.project?.name || undefined,
                    utilizationRate: Number(row.utilization || 0),
                    costPerDay: Number(row.daily_cost || 0),
                    nextMaintenance: undefined
                }));
                setResources(mapped);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    const [viewMode, setViewMode] = useState<'overview' | 'equipment' | 'materials' | 'labor'>('overview');

    const totalCostPerDay = resources.reduce((sum, r) => sum + r.costPerDay, 0);
    const avgUtilization = resources.reduce((sum, r) => sum + r.utilizationRate, 0) / resources.length;
    const resourcesInUse = resources.filter(r => r.status === 'in-use').length;

    const getStatusColor = (status: Resource['status']) => {
        const colors = {
            available: 'bg-green-100 text-green-800',
            'in-use': 'bg-blue-100 text-blue-800',
            maintenance: 'bg-yellow-100 text-yellow-800',
            reserved: 'bg-purple-100 text-purple-800'
        };
        return colors[status];
    };

    const getTypeIcon = (type: Resource['type']) => {
        const icons = {
            equipment: <Wrench className="h-6 w-6 text-blue-600" />,
            material: <Package className="h-6 w-6 text-green-600" />,
            labor: <Users className="h-6 w-6 text-purple-600" />
        };
        return icons[type];
    };

    const getUtilizationColor = (rate: number) => {
        if (rate >= 85) return 'text-green-600';
        if (rate >= 65) return 'text-yellow-600';
        return 'text-red-600';
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center gap-3 mb-2">
                        <Zap className="h-8 w-8 text-orange-600" />
                        <h1 className="text-4xl font-bold text-gray-900">Resource Optimization</h1>
                    </div>
                    <p className="text-gray-600 text-lg">
                        AI-powered resource allocation and utilization tracking
                    </p>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-xl">
                        <div className="flex items-center justify-between mb-4">
                            <Package className="h-8 w-8" />
                            <TrendingUp className="h-5 w-5" />
                        </div>
                        <div className="text-3xl font-bold mb-1">{resources.length}</div>
                        <div className="text-sm text-blue-100">Total Resources</div>
                    </div>

                    <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white shadow-xl">
                        <div className="flex items-center justify-between mb-4">
                            <Activity className="h-8 w-8" />
                            <CheckCircle className="h-5 w-5" />
                        </div>
                        <div className="text-3xl font-bold mb-1">{resourcesInUse}</div>
                        <div className="text-sm text-green-100">Currently In Use</div>
                    </div>

                    <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white shadow-xl">
                        <div className="flex items-center justify-between mb-4">
                            <BarChart3 className="h-8 w-8" />
                            <TrendingUp className="h-5 w-5" />
                        </div>
                        <div className="text-3xl font-bold mb-1">{avgUtilization.toFixed(0)}%</div>
                        <div className="text-sm text-purple-100">Avg Utilization</div>
                    </div>

                    <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-6 text-white shadow-xl">
                        <div className="flex items-center justify-between mb-4">
                            <DollarSign className="h-8 w-8" />
                            <Activity className="h-5 w-5" />
                        </div>
                        <div className="text-3xl font-bold mb-1">${totalCostPerDay.toLocaleString()}</div>
                        <div className="text-sm text-orange-100">Daily Cost</div>
                    </div>
                </div>

                {/* View Mode Toggle */}
                <div className="bg-white rounded-xl p-4 shadow-md border border-gray-200 mb-8">
                    <div className="flex gap-2">
                        {(['overview', 'equipment', 'materials', 'labor'] as const).map((mode) => (
                            <button
                                key={mode}
                                onClick={() => setViewMode(mode)}
                                className={`px-6 py-2 rounded-lg font-medium transition-colors capitalize ${
                                    viewMode === mode
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                            >
                                {mode}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Resources Table */}
                <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
                    <div className="p-6 border-b border-gray-200">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-bold text-gray-900">Resource Inventory</h2>
                            <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                                <Download className="h-4 w-4" />
                                Export Report
                            </button>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Resource</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Type</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Status</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Location</th>
                                    <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900">Utilization</th>
                                    <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900">Cost/Day</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {(loading ? [] : resources)
                                    .filter(r => viewMode === 'overview' || r.type === viewMode.slice(0, -1))
                                    .map((resource) => (
                                        <tr key={resource.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    {getTypeIcon(resource.type)}
                                                    <div>
                                                        <div className="font-medium text-gray-900">{resource.name}</div>
                                                        {resource.project && (
                                                            <div className="text-sm text-gray-500">{resource.project}</div>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-gray-900 capitalize">{resource.type}</td>
                                            <td className="px-6 py-4">
                                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(resource.status)}`}>
                                                    {resource.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-gray-900">{resource.location}</td>
                                            <td className="px-6 py-4 text-right">
                                                <span className={`text-lg font-semibold ${getUtilizationColor(resource.utilizationRate)}`}>
                                                    {resource.utilizationRate}%
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right font-medium text-gray-900">
                                                ${resource.costPerDay.toLocaleString()}
                                            </td>
                                        </tr>
                                    ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

