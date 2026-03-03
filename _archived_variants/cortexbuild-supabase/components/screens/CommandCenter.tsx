/**
 * Command Center - Market-Leading Central Hub
 * The ultimate control panel for construction management
 */

import React, { useState, useEffect } from 'react';
import {
    Activity,
    TrendingUp,
    AlertCircle,
    CheckCircle,
    Clock,
    DollarSign,
    Users,
    Briefcase,
    Target,
    Zap,
    BarChart3,
    PieChart,
    Calendar,
    FileText,
    Shield,
    Wrench,
    Package,
    MapPin
} from 'lucide-react';
import { User } from '../../types';
import { supabase } from '../../supabaseClient';

interface CommandCenterProps {
    currentUser: User;
    navigateTo: (screen: string, params?: any) => void;
}

interface MetricCard {
    title: string;
    value: string | number;
    change: number;
    trend: 'up' | 'down' | 'stable';
    icon: any;
    color: string;
    onClick?: () => void;
}

interface Alert {
    id: string;
    type: 'critical' | 'warning' | 'info';
    title: string;
    message: string;
    timestamp: Date;
    action?: string;
}

export const CommandCenter: React.FC<CommandCenterProps> = ({ currentUser, navigateTo }) => {
    const [metrics, setMetrics] = useState<MetricCard[]>([]);
    const [alerts, setAlerts] = useState<Alert[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadCommandCenterData();
    }, []);

    const loadCommandCenterData = async () => {
        try {
            if (!supabase) {
                setLoading(false);
                return;
            }

            // Projects count
            const { count: projectsCount } = await supabase
                .from('projects')
                .select('id', { count: 'exact', head: true });

            // Users count
            const { count: usersCount } = await supabase
                .from('users')
                .select('id', { count: 'exact', head: true });

            // Tasks completion
            const [{ count: totalTasks }, { count: completedTasks }] = await Promise.all([
                supabase.from('tasks').select('id', { count: 'exact', head: true }),
                supabase.from('tasks').select('id', { count: 'exact', head: true }).eq('status', 'completed')
            ]);
            const completion = totalTasks && completedTasks ? Math.round((completedTasks / Math.max(totalTasks, 1)) * 100) : 0;

            // Recent notifications as alerts (last 10)
            const { data: notif } = await supabase
                .from('notifications')
                .select('id, type, message, created_at')
                .eq('user_id', currentUser.id)
                .order('created_at', { ascending: false })
                .limit(10);

            const mappedAlerts = (notif || []).map(n => ({
                id: n.id,
                type: (n.type as 'critical' | 'warning' | 'info') || 'info',
                title: n.type ? n.type.charAt(0).toUpperCase() + n.type.slice(1) : 'Info',
                message: n.message || '',
                timestamp: new Date(n.created_at),
                action: undefined
            }));

            setMetrics([
                {
                    title: 'Active Projects',
                    value: projectsCount ?? 0,
                    change: 0,
                    trend: 'stable',
                    icon: Briefcase,
                    color: 'blue',
                    onClick: () => navigateTo('projects')
                },
                {
                    title: 'Team Members',
                    value: usersCount ?? 0,
                    change: 0,
                    trend: 'stable',
                    icon: Users,
                    color: 'purple',
                    onClick: () => navigateTo('enhanced-team-collaboration')
                },
                {
                    title: 'Tasks Completion',
                    value: `${completion}%`,
                    change: 0,
                    trend: 'stable',
                    icon: Target,
                    color: 'orange',
                    onClick: () => navigateTo('tasks')
                }
            ]);

            setAlerts(mappedAlerts);
        } finally {
            setLoading(false);
        }
    };

    const getMetricColor = (color: string) => {
        const colors: Record<string, string> = {
            blue: 'from-blue-500 to-blue-600',
            green: 'from-green-500 to-green-600',
            purple: 'from-purple-500 to-purple-600',
            orange: 'from-orange-500 to-orange-600',
            red: 'from-red-500 to-red-600',
            cyan: 'from-cyan-500 to-cyan-600'
        };
        return colors[color] || colors.blue;
    };

    const getAlertColor = (type: Alert['type']) => {
        const colors = {
            critical: 'bg-red-50 border-red-200 text-red-900',
            warning: 'bg-yellow-50 border-yellow-200 text-yellow-900',
            info: 'bg-blue-50 border-blue-200 text-blue-900'
        };
        return colors[type];
    };

    const getAlertIcon = (type: Alert['type']) => {
        const icons = {
            critical: <AlertCircle className="h-5 w-5 text-red-600" />,
            warning: <AlertCircle className="h-5 w-5 text-yellow-600" />,
            info: <CheckCircle className="h-5 w-5 text-blue-600" />
        };
        return icons[type];
    };

    const formatTimestamp = (date: Date): string => {
        const now = new Date();
        const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
        
        if (diffInSeconds < 60) return 'Just now';
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
        return `${Math.floor(diffInSeconds / 86400)}d ago`;
    };

    if (loading) {
        return (
            <div className="flex h-full items-center justify-center">
                <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center gap-3 mb-2">
                        <Zap className="h-8 w-8 text-blue-600" />
                        <h1 className="text-4xl font-bold text-gray-900">Command Center</h1>
                    </div>
                    <p className="text-gray-600 text-lg">
                        Real-time oversight of all construction operations
                    </p>
                </div>

                {/* Key Metrics Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                    {metrics.map((metric, index) => {
                        const Icon = metric.icon;
                        return (
                            <div
                                key={index}
                                onClick={metric.onClick}
                                className={`relative overflow-hidden rounded-xl bg-gradient-to-br ${getMetricColor(metric.color)} p-6 text-white shadow-lg hover:shadow-xl transition-all cursor-pointer transform hover:scale-105`}
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <p className="text-sm font-medium text-white/80 mb-1">
                                            {metric.title}
                                        </p>
                                        <p className="text-3xl font-bold mb-2">{metric.value}</p>
                                        <div className="flex items-center gap-2">
                                            <TrendingUp className={`h-4 w-4 ${metric.trend === 'down' ? 'rotate-180' : ''}`} />
                                            <span className="text-sm font-medium">
                                                {metric.trend === 'up' ? '+' : metric.trend === 'down' ? '-' : ''}{metric.change}%
                                            </span>
                                            <span className="text-xs text-white/70">vs last month</span>
                                        </div>
                                    </div>
                                    <div className="ml-4 p-3 bg-white/20 rounded-lg backdrop-blur-sm">
                                        <Icon className="h-8 w-8" />
                                    </div>
                                </div>
                                <div className="absolute bottom-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mb-16" />
                            </div>
                        );
                    })}
                </div>

                {/* Alerts Section */}
                <div className="bg-white rounded-xl shadow-lg border border-gray-200 mb-8">
                    <div className="p-6 border-b border-gray-200">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <AlertCircle className="h-6 w-6 text-orange-600" />
                                <h2 className="text-xl font-bold text-gray-900">Critical Alerts</h2>
                            </div>
                            <span className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm font-medium">
                                {alerts.length} Active
                            </span>
                        </div>
                    </div>
                    <div className="divide-y divide-gray-200">
                        {alerts.map((alert) => (
                            <div
                                key={alert.id}
                                className={`p-6 border-l-4 ${alert.type === 'critical' ? 'border-red-500' : alert.type === 'warning' ? 'border-yellow-500' : 'border-blue-500'} hover:bg-gray-50 transition-colors`}
                            >
                                <div className="flex items-start gap-4">
                                    {getAlertIcon(alert.type)}
                                    <div className="flex-1">
                                        <h3 className="font-semibold text-gray-900 mb-1">{alert.title}</h3>
                                        <p className="text-sm text-gray-600 mb-2">{alert.message}</p>
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs text-gray-500">
                                                {formatTimestamp(alert.timestamp)}
                                            </span>
                                            {alert.action && (
                                                <button className="text-sm font-medium text-blue-600 hover:text-blue-800">
                                                    {alert.action} →
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Quick Actions Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[
                        { title: 'Reports', icon: FileText, screen: 'analytics-dashboard', color: 'blue' },
                        { title: 'Team', icon: Users, screen: 'enhanced-team-collaboration', color: 'purple' },
                        { title: 'Calendar', icon: Calendar, screen: 'time-tracking', color: 'green' },
                        { title: 'Equipment', icon: Wrench, screen: 'project-operations', color: 'orange' },
                        { title: 'Budget', icon: DollarSign, screen: 'financial-management', color: 'emerald' },
                        { title: 'Quality', icon: Shield, screen: 'quality-control-vision', color: 'red' },
                        { title: 'Resources', icon: Package, screen: 'project-operations', color: 'indigo' },
                        { title: 'Sites', icon: MapPin, screen: 'mobile-tools', color: 'cyan' }
                    ].map((action, index) => {
                        const Icon = action.icon;
                        return (
                            <button
                                key={index}
                                onClick={() => navigateTo(action.screen)}
                                className="group relative overflow-hidden bg-white rounded-xl p-6 shadow-md hover:shadow-xl transition-all border border-gray-200 hover:border-blue-300"
                            >
                                <div className="flex flex-col items-center text-center gap-3">
                                    <div className={`p-4 bg-${action.color}-50 rounded-xl group-hover:scale-110 transition-transform`}>
                                        <Icon className={`h-8 w-8 text-${action.color}-600`} />
                                    </div>
                                    <span className="font-semibold text-gray-900">{action.title}</span>
                                </div>
                                <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-blue-50 to-transparent rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity" />
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

