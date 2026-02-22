import React from 'react';

export interface DashboardWidgetProps {
    title: string;
    value: string | number;
    change?: number;
    trend?: 'up' | 'down' | 'neutral';
    icon?: React.ReactNode;
    className?: string;
}

export const DashboardWidget: React.FC<DashboardWidgetProps> = ({
    title,
    value,
    change,
    trend,
    icon,
    className = ''
}) => {
    const getTrendColor = () => {
        if (!trend) return 'text-gray-500';
        if (trend === 'up') return 'text-green-500';
        if (trend === 'down') return 'text-red-500';
        return 'text-gray-500';
    };

    const getTrendIcon = () => {
        if (trend === 'up') return '↑';
        if (trend === 'down') return '↓';
        return '→';
    };

    return (
        <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 ${className}`}>
            <div className="flex items-center justify-between">
                <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        {title}
                    </p>
                    <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
                        {value}
                    </p>
                    {change !== undefined && (
                        <div className={`mt-2 flex items-center text-sm ${getTrendColor()}`}>
                            <span className="font-semibold">{getTrendIcon()}</span>
                            <span className="ml-1">{Math.abs(change)}%</span>
                            <span className="ml-2 text-gray-500">vs last period</span>
                        </div>
                    )}
                </div>
                {icon && (
                    <div className="flex-shrink-0 text-cyan-500 dark:text-cyan-400">
                        {icon}
                    </div>
                )}
            </div>
        </div>
    );
};

interface StatCardProps {
    label: string;
    value: string | number;
    color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'cyan';
}

export const StatCard: React.FC<StatCardProps> = ({ label, value, color = 'blue' }) => {
    const colorClasses = {
        blue: 'bg-blue-500',
        green: 'bg-green-500',
        yellow: 'bg-yellow-500',
        red: 'bg-red-500',
        purple: 'bg-purple-500',
        cyan: 'bg-cyan-500'
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 border-l-4 border-solid"
            style={{ borderLeftColor: `var(--${color}-500)` }}>
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{label}</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{value}</p>
                </div>
                <div className={`w-12 h-12 ${colorClasses[color]} rounded-full opacity-20`}></div>
            </div>
        </div>
    );
};
