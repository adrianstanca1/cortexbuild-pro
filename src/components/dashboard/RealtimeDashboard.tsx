import React, { useEffect, useState } from 'react';

interface RealtimeMetric {
    label: string;
    value: number | string;
    unit?: string;
    refreshInterval?: number;
}

interface RealtimeDashboardProps {
    metrics: RealtimeMetric[];
    onRefresh?: () => Promise<RealtimeMetric[]>;
}

export const RealtimeDashboard: React.FC<RealtimeDashboardProps> = ({
    metrics: initialMetrics,
    onRefresh
}) => {
    const [metrics, setMetrics] = useState(initialMetrics);
    const [lastUpdate, setLastUpdate] = useState(new Date());
    const [isRefreshing, setIsRefreshing] = useState(false);

    useEffect(() => {
        if (!onRefresh) return;

        const interval = setInterval(async () => {
            setIsRefreshing(true);
            try {
                const newMetrics = await onRefresh();
                setMetrics(newMetrics);
                setLastUpdate(new Date());
            } catch (error) {
                console.error('Failed to refresh metrics:', error);
            } finally {
                setIsRefreshing(false);
            }
        }, 30000); // Refresh every 30 seconds

        return () => clearInterval(interval);
    }, [onRefresh]);

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Real-time Metrics
                </h3>
                <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${isRefreshing ? 'bg-yellow-500 animate-pulse' : 'bg-green-500'}`} />
                    <span className="text-xs text-gray-500">
                        Updated {lastUpdate.toLocaleTimeString()}
                    </span>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {metrics.map((metric, idx) => (
                    <div key={idx} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
                        <p className="text-sm text-gray-600 dark:text-gray-400">{metric.label}</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                            {metric.value}
                            {metric.unit && <span className="text-lg ml-1">{metric.unit}</span>}
                        </p>
                    </div>
                ))}
            </div>
        </div>
    );
};

interface ActivityFeedItem {
    id: string;
    user: string;
    action: string;
    timestamp: Date;
    icon?: React.ReactNode;
}

interface ActivityFeedProps {
    items: ActivityFeedItem[];
    maxItems?: number;
}

export const ActivityFeed: React.FC<ActivityFeedProps> = ({ items, maxItems = 10 }) => {
    const displayItems = items.slice(0, maxItems);

    const getTimeAgo = (date: Date) => {
        const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);

        if (seconds < 60) return `${seconds}s ago`;
        if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
        if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
        return `${Math.floor(seconds / 86400)}d ago`;
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Activity Feed
            </h3>
            <div className="space-y-3">
                {displayItems.map((item) => (
                    <div key={item.id} className="flex items-start gap-3 pb-3 border-b border-gray-200 dark:border-gray-700 last:border-0">
                        {item.icon && (
                            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-cyan-100 dark:bg-cyan-900 flex items-center justify-center">
                                {item.icon}
                            </div>
                        )}
                        <div className="flex-1 min-w-0">
                            <p className="text-sm text-gray-900 dark:text-white">
                                <span className="font-semibold">{item.user}</span> {item.action}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                                {getTimeAgo(item.timestamp)}
                            </p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
