import React, { useState, useEffect } from 'react';
import { Activity, Users, Zap, AlertTriangle, Globe } from 'lucide-react';
import { useWebSocket } from '@/contexts/WebSocketContext';

interface ActivityMetrics {
    activeUsers: number;
    totalSessions: number;
    apiRequestsPerMinute: number;
    errorRate: number;
    companiesOnline: number;
}

interface ActivityMonitorProps {
    className?: string;
}

const ActivityMonitor: React.FC<ActivityMonitorProps> = ({ className = '' }) => {
    const { socket } = useWebSocket();
    const [metrics, setMetrics] = useState<ActivityMetrics>({
        activeUsers: 0,
        totalSessions: 0,
        apiRequestsPerMinute: 0,
        errorRate: 0,
        companiesOnline: 0,
    });
    const [isLive, setIsLive] = useState(false);

    useEffect(() => {
        if (!socket) return;

        setIsLive(true);

        // Listen for real-time activity updates
        socket.on('activity:metrics', (data: ActivityMetrics) => {
            setMetrics(data);
        });

        // Request initial metrics
        socket.emit('activity:subscribe');

        return () => {
            socket.off('activity:metrics');
            socket.emit('activity:unsubscribe');
            setIsLive(false);
        };
    }, [socket]);

    const getErrorRateColor = (rate: number) => {
        if (rate < 1) return 'text-green-600';
        if (rate < 5) return 'text-yellow-600';
        return 'text-red-600';
    };

    const getErrorRateBg = (rate: number) => {
        if (rate < 1) return 'bg-green-50 border-green-200';
        if (rate < 5) return 'bg-yellow-50 border-yellow-200';
        return 'bg-red-50 border-red-200';
    };

    return (
        <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}>
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Activity className="w-5 h-5 text-blue-600" />
                    <h3 className="text-lg font-semibold text-gray-900">Real-Time Activity</h3>
                </div>
                <div className="flex items-center gap-2">
                    <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${isLive
                                ? 'bg-green-100 text-green-700'
                                : 'bg-gray-100 text-gray-600'
                            }`}
                    >
                        <span
                            className={`w-2 h-2 rounded-full ${isLive ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
                                }`}
                        />
                        {isLive ? 'Live' : 'Offline'}
                    </span>
                </div>
            </div>

            {/* Metrics Grid */}
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                {/* Active Users */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                        <Users className="w-5 h-5 text-blue-600" />
                        <span className="text-xs text-blue-600 font-medium">NOW</span>
                    </div>
                    <div className="text-2xl font-bold text-blue-900">{metrics.activeUsers}</div>
                    <div className="text-xs text-blue-600 mt-1">Active Users</div>
                </div>

                {/* Total Sessions */}
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                        <Globe className="w-5 h-5 text-purple-600" />
                        <span className="text-xs text-purple-600 font-medium">TOTAL</span>
                    </div>
                    <div className="text-2xl font-bold text-purple-900">{metrics.totalSessions}</div>
                    <div className="text-xs text-purple-600 mt-1">Sessions</div>
                </div>

                {/* API Requests */}
                <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                        <Zap className="w-5 h-5 text-indigo-600" />
                        <span className="text-xs text-indigo-600 font-medium">RPM</span>
                    </div>
                    <div className="text-2xl font-bold text-indigo-900">
                        {metrics.apiRequestsPerMinute}
                    </div>
                    <div className="text-xs text-indigo-600 mt-1">API Requests/min</div>
                </div>

                {/* Error Rate */}
                <div className={`rounded-lg p-4 border ${getErrorRateBg(metrics.errorRate)}`}>
                    <div className="flex items-center justify-between mb-2">
                        <AlertTriangle className={`w-5 h-5 ${getErrorRateColor(metrics.errorRate)}`} />
                        <span className={`text-xs font-medium ${getErrorRateColor(metrics.errorRate)}`}>
                            RATE
                        </span>
                    </div>
                    <div className={`text-2xl font-bold ${getErrorRateColor(metrics.errorRate)}`}>
                        {metrics.errorRate.toFixed(2)}%
                    </div>
                    <div className={`text-xs mt-1 ${getErrorRateColor(metrics.errorRate)}`}>
                        Error Rate
                    </div>
                </div>

                {/* Companies Online */}
                <div className="bg-teal-50 border border-teal-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                        <Activity className="w-5 h-5 text-teal-600" />
                        <span className="text-xs text-teal-600 font-medium">LIVE</span>
                    </div>
                    <div className="text-2xl font-bold text-teal-900">{metrics.companiesOnline}</div>
                    <div className="text-xs text-teal-600 mt-1">Companies Online</div>
                </div>
            </div>

            {/* Status Message */}
            {!isLive && (
                <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
                    <p className="text-sm text-gray-600">
                        <span className="font-medium">Offline:</span> Connect to WebSocket to see live metrics
                    </p>
                </div>
            )}
        </div>
    );
};

export default ActivityMonitor;
