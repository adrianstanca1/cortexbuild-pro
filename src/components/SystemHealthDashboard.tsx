import React, { useState, useEffect } from 'react';
import { Server, Database, Wifi, HardDrive, Activity, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

interface HealthMetrics {
    api: {
        status: 'healthy' | 'degraded' | 'down';
        responseTime: number;
        uptime: number;
    };
    database: {
        status: 'healthy' | 'degraded' | 'down';
        connections: number;
        queryTime: number;
    };
    cache: {
        status: 'healthy' | 'degraded' | 'down';
        hitRate: number;
        memoryUsed: number;
    };
    websocket: {
        status: 'healthy' | 'degraded' | 'down';
        connections: number;
    };
}

interface SystemHealthDashboardProps {
    className?: string;
}

const SystemHealthDashboard: React.FC<SystemHealthDashboardProps> = ({ className = '' }) => {
    const [health, setHealth] = useState<HealthMetrics>({
        api: { status: 'healthy', responseTime: 0, uptime: 100 },
        database: { status: 'healthy', connections: 0, queryTime: 0 },
        cache: { status: 'healthy', hitRate: 0, memoryUsed: 0 },
        websocket: { status: 'healthy', connections: 0 },
    });
    const [loading, setLoading] = useState(true);
    const [lastUpdate, setLastUpdate] = useState(new Date());

    useEffect(() => {
        const fetchHealthMetrics = async () => {
            try {
                setLoading(true);
                const response = await fetch('/api/v1/platform/health/detailed', {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('authToken')}`,
                    },
                });

                if (response.ok) {
                    const data = await response.json();
                    setHealth(data);
                }
            } catch (error) {
                console.error('Failed to fetch health metrics:', error);
            } finally {
                setLoading(false);
                setLastUpdate(new Date());
            }
        };

        fetchHealthMetrics();
        const interval = setInterval(fetchHealthMetrics, 30000); // Update every 30s

        return () => clearInterval(interval);
    }, []);

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'healthy':
                return <CheckCircle className="w-5 h-5 text-green-600" />;
            case 'degraded':
                return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
            case 'down':
                return <XCircle className="w-5 h-5 text-red-600" />;
            default:
                return <Activity className="w-5 h-5 text-gray-400" />;
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'healthy':
                return 'bg-green-50 border-green-200';
            case 'degraded':
                return 'bg-yellow-50 border-yellow-200';
            case 'down':
                return 'bg-red-50 border-red-200';
            default:
                return 'bg-gray-50 border-gray-200';
        }
    };

    const getStatusText = (status: string) => {
        switch (status) {
            case 'healthy':
                return 'text-green-700';
            case 'degraded':
                return 'text-yellow-700';
            case 'down':
                return 'text-red-700';
            default:
                return 'text-gray-600';
        }
    };

    if (loading) {
        return (
            <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${className}`}>
                <div className="animate-pulse space-y-4">
                    <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="h-32 bg-gray-200 rounded"></div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    const overallStatus = Object.values(health).every((service) => service.status === 'healthy')
        ? 'healthy'
        : Object.values(health).some((service) => service.status === 'down')
            ? 'down'
            : 'degraded';

    return (
        <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}>
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Server className="w-5 h-5 text-blue-600" />
                        <h3 className="text-lg font-semibold text-gray-900">System Health</h3>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${overallStatus === 'healthy'
                                ? 'bg-green-100 text-green-700'
                                : overallStatus === 'degraded'
                                    ? 'bg-yellow-100 text-yellow-700'
                                    : 'bg-red-100 text-red-700'
                            }`}>
                            {getStatusIcon(overallStatus)}
                            {overallStatus.charAt(0).toUpperCase() + overallStatus.slice(1)}
                        </span>
                        <span className="text-xs text-gray-500">
                            Updated {lastUpdate.toLocaleTimeString()}
                        </span>
                    </div>
                </div>
            </div>

            {/* Health Cards Grid */}
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* API Health */}
                <div className={`rounded-lg p-4 border ${getStatusColor(health.api.status)}`}>
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                            <Server className={`w-5 h-5 ${getStatusText(health.api.status)}`} />
                            <h4 className={`font-medium ${getStatusText(health.api.status)}`}>API</h4>
                        </div>
                        {getStatusIcon(health.api.status)}
                    </div>
                    <div className="space-y-1.5 text-sm">
                        <div className="flex justify-between">
                            <span className="text-gray-600">Response Time</span>
                            <span className="font-medium">{health.api.responseTime}ms</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-600">Uptime</span>
                            <span className="font-medium">{health.api.uptime.toFixed(2)}%</span>
                        </div>
                    </div>
                </div>

                {/* Database Health */}
                <div className={`rounded-lg p-4 border ${getStatusColor(health.database.status)}`}>
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                            <Database className={`w-5 h-5 ${getStatusText(health.database.status)}`} />
                            <h4 className={`font-medium ${getStatusText(health.database.status)}`}>Database</h4>
                        </div>
                        {getStatusIcon(health.database.status)}
                    </div>
                    <div className="space-y-1.5 text-sm">
                        <div className="flex justify-between">
                            <span className="text-gray-600">Connections</span>
                            <span className="font-medium">{health.database.connections}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-600">Query Time</span>
                            <span className="font-medium">{health.database.queryTime}ms</span>
                        </div>
                    </div>
                </div>

                {/* Cache Health */}
                <div className={`rounded-lg p-4 border ${getStatusColor(health.cache.status)}`}>
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                            <HardDrive className={`w-5 h-5 ${getStatusText(health.cache.status)}`} />
                            <h4 className={`font-medium ${getStatusText(health.cache.status)}`}>Cache</h4>
                        </div>
                        {getStatusIcon(health.cache.status)}
                    </div>
                    <div className="space-y-1.5 text-sm">
                        <div className="flex justify-between">
                            <span className="text-gray-600">Hit Rate</span>
                            <span className="font-medium">{health.cache.hitRate.toFixed(1)}%</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-600">Memory</span>
                            <span className="font-medium">{health.cache.memoryUsed}MB</span>
                        </div>
                    </div>
                </div>

                {/* WebSocket Health */}
                <div className={`rounded-lg p-4 border ${getStatusColor(health.websocket.status)}`}>
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                            <Wifi className={`w-5 h-5 ${getStatusText(health.websocket.status)}`} />
                            <h4 className={`font-medium ${getStatusText(health.websocket.status)}`}>WebSocket</h4>
                        </div>
                        {getStatusIcon(health.websocket.status)}
                    </div>
                    <div className="space-y-1.5 text-sm">
                        <div className="flex justify-between">
                            <span className="text-gray-600">Connections</span>
                            <span className="font-medium">{health.websocket.connections}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-600">Status</span>
                            <span className={`font-medium capitalize ${getStatusText(health.websocket.status)}`}>
                                {health.websocket.status}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SystemHealthDashboard;
