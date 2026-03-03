/**
 * Advanced Charts Component
 * Provides interactive and responsive charts for analytics and reporting
 */

import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface DataPoint {
    label: string;
    value: number;
    color?: string;
}

interface LineChartProps {
    data: DataPoint[];
    title: string;
    height?: number;
    showGrid?: boolean;
}

export const LineChart: React.FC<LineChartProps> = ({ 
    data, 
    title, 
    height = 200,
    showGrid = true 
}) => {
    const maxValue = Math.max(...data.map(d => d.value));
    const minValue = Math.min(...data.map(d => d.value));
    const range = maxValue - minValue;
    const padding = range * 0.1;
    
    const chartHeight = height;
    const chartWidth = 100; // percentage
    
    const points = data.map((point, index) => {
        const x = (index / (data.length - 1)) * chartWidth;
        const y = chartHeight - ((point.value - minValue + padding) / (range + 2 * padding)) * chartHeight;
        return { x, y, ...point };
    });

    const pathD = points
        .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
        .join(' ');

    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
            <div className="relative" style={{ height: `${height}px` }}>
                <svg
                    viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                    className="w-full h-full"
                    preserveAspectRatio="none"
                >
                    {/* Grid lines */}
                    {showGrid && [0, 25, 50, 75, 100].map((y) => (
                        <line
                            key={y}
                            x1="0"
                            y1={y}
                            x2={chartWidth}
                            y2={y}
                            stroke="#e5e7eb"
                            strokeWidth="0.5"
                        />
                    ))}
                    
                    {/* Line path */}
                    <path
                        d={pathD}
                        fill="none"
                        stroke="#3b82f6"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                    
                    {/* Area under line */}
                    <path
                        d={`${pathD} L ${chartWidth} ${chartHeight} L 0 ${chartHeight} Z`}
                        fill="url(#gradient)"
                        opacity="0.2"
                    />
                    
                    {/* Points */}
                    {points.map((point, index) => (
                        <circle
                            key={index}
                            cx={point.x}
                            cy={point.y}
                            r="3"
                            fill="#3b82f6"
                            className="hover:r-4 transition-all cursor-pointer"
                        />
                    ))}
                    
                    <defs>
                        <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="#3b82f6" />
                            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
                        </linearGradient>
                    </defs>
                </svg>
            </div>
            
            {/* Labels */}
            <div className="flex justify-between mt-4 text-xs text-gray-600">
                {data.map((point, index) => (
                    <span key={index}>{point.label}</span>
                ))}
            </div>
        </div>
    );
};

interface BarChartProps {
    data: DataPoint[];
    title: string;
    horizontal?: boolean;
}

export const BarChart: React.FC<BarChartProps> = ({ data, title, horizontal = false }) => {
    const maxValue = Math.max(...data.map(d => d.value));
    
    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
            <div className="space-y-4">
                {data.map((item, index) => {
                    const percentage = (item.value / maxValue) * 100;
                    const color = item.color || '#3b82f6';
                    
                    return (
                        <div key={index}>
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium text-gray-700">{item.label}</span>
                                <span className="text-sm font-semibold text-gray-900">{item.value}</span>
                            </div>
                            <div className="relative w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                                <div
                                    className="absolute left-0 top-0 h-full rounded-full transition-all duration-500"
                                    style={{ 
                                        width: `${percentage}%`,
                                        backgroundColor: color
                                    }}
                                />
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

interface PieChartProps {
    data: DataPoint[];
    title: string;
    size?: number;
}

export const PieChart: React.FC<PieChartProps> = ({ data, title, size = 200 }) => {
    const total = data.reduce((sum, item) => sum + item.value, 0);
    let currentAngle = -90;
    
    const slices = data.map((item, index) => {
        const percentage = (item.value / total) * 100;
        const angle = (item.value / total) * 360;
        const startAngle = currentAngle;
        const endAngle = currentAngle + angle;
        currentAngle = endAngle;
        
        const colors = [
            '#3b82f6', // blue
            '#10b981', // green
            '#f59e0b', // yellow
            '#ef4444', // red
            '#8b5cf6', // purple
            '#ec4899', // pink
        ];
        
        return {
            ...item,
            color: item.color || colors[index % colors.length],
            percentage,
            startAngle,
            endAngle
        };
    });
    
    const polarToCartesian = (centerX: number, centerY: number, radius: number, angleInDegrees: number) => {
        const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
        return {
            x: centerX + radius * Math.cos(angleInRadians),
            y: centerY + radius * Math.sin(angleInRadians)
        };
    };
    
    const describeArc = (x: number, y: number, radius: number, startAngle: number, endAngle: number) => {
        const start = polarToCartesian(x, y, radius, endAngle);
        const end = polarToCartesian(x, y, radius, startAngle);
        const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';
        
        return [
            'M', x, y,
            'L', start.x, start.y,
            'A', radius, radius, 0, largeArcFlag, 0, end.x, end.y,
            'Z'
        ].join(' ');
    };
    
    const centerX = size / 2;
    const centerY = size / 2;
    const radius = size / 2 - 10;
    
    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
            <div className="flex items-center gap-6">
                <div className="relative" style={{ width: size, height: size }}>
                    <svg width={size} height={size}>
                        {slices.map((slice, index) => (
                            <path
                                key={index}
                                d={describeArc(centerX, centerY, radius, slice.startAngle, slice.endAngle)}
                                fill={slice.color}
                                className="hover:opacity-80 transition-opacity cursor-pointer"
                            />
                        ))}
                        
                        {/* Center white circle */}
                        <circle
                            cx={centerX}
                            cy={centerY}
                            r={radius * 0.6}
                            fill="white"
                        />
                        
                        {/* Center text */}
                        <text
                            x={centerX}
                            y={centerY}
                            textAnchor="middle"
                            dominantBaseline="middle"
                            className="text-2xl font-bold fill-gray-900"
                        >
                            {total}
                        </text>
                        <text
                            x={centerX}
                            y={centerY + 20}
                            textAnchor="middle"
                            className="text-xs fill-gray-500"
                        >
                            Total
                        </text>
                    </svg>
                </div>
                
                <div className="flex-1 space-y-2">
                    {slices.map((slice, index) => (
                        <div key={index} className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div
                                    className="w-3 h-3 rounded-full"
                                    style={{ backgroundColor: slice.color }}
                                />
                                <span className="text-sm text-gray-700">{slice.label}</span>
                            </div>
                            <span className="text-sm font-semibold text-gray-900">
                                {slice.value} ({slice.percentage.toFixed(1)}%)
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

interface StatCardProps {
    title: string;
    value: number | string;
    change?: number;
    icon?: React.ReactNode;
    color?: 'blue' | 'green' | 'red' | 'yellow' | 'purple';
}

export const StatCard: React.FC<StatCardProps> = ({ 
    title, 
    value, 
    change, 
    icon,
    color = 'blue' 
}) => {
    const colorClasses = {
        blue: 'bg-blue-50 text-blue-600',
        green: 'bg-green-50 text-green-600',
        red: 'bg-red-50 text-red-600',
        yellow: 'bg-yellow-50 text-yellow-600',
        purple: 'bg-purple-50 text-purple-600',
    };
    
    const getTrendIcon = () => {
        if (change === undefined) return null;
        if (change > 0) return <TrendingUp className="h-4 w-4 text-green-600" />;
        if (change < 0) return <TrendingDown className="h-4 w-4 text-red-600" />;
        return <Minus className="h-4 w-4 text-gray-600" />;
    };
    
    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-start justify-between">
                <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600 mb-2">{title}</p>
                    <p className="text-3xl font-bold text-gray-900">{value}</p>
                    {change !== undefined && (
                        <div className="flex items-center gap-1 mt-2">
                            {getTrendIcon()}
                            <span className={`text-sm font-medium ${
                                change > 0 ? 'text-green-600' : 
                                change < 0 ? 'text-red-600' : 
                                'text-gray-600'
                            }`}>
                                {change > 0 ? '+' : ''}{change}%
                            </span>
                            <span className="text-sm text-gray-500 ml-1">vs last period</span>
                        </div>
                    )}
                </div>
                {icon && (
                    <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
                        {icon}
                    </div>
                )}
            </div>
        </div>
    );
};

interface ProgressRingProps {
    value: number;
    max: number;
    size?: number;
    strokeWidth?: number;
    label?: string;
    color?: string;
}

export const ProgressRing: React.FC<ProgressRingProps> = ({ 
    value, 
    max, 
    size = 120, 
    strokeWidth = 8,
    label,
    color = '#3b82f6'
}) => {
    const percentage = (value / max) * 100;
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (percentage / 100) * circumference;
    
    return (
        <div className="flex flex-col items-center">
            <div className="relative" style={{ width: size, height: size }}>
                <svg width={size} height={size} className="transform -rotate-90">
                    {/* Background circle */}
                    <circle
                        cx={size / 2}
                        cy={size / 2}
                        r={radius}
                        fill="none"
                        stroke="#e5e7eb"
                        strokeWidth={strokeWidth}
                    />
                    
                    {/* Progress circle */}
                    <circle
                        cx={size / 2}
                        cy={size / 2}
                        r={radius}
                        fill="none"
                        stroke={color}
                        strokeWidth={strokeWidth}
                        strokeDasharray={circumference}
                        strokeDashoffset={offset}
                        strokeLinecap="round"
                        className="transition-all duration-500"
                    />
                </svg>
                
                {/* Center text */}
                <div className="absolute inset-0 flex items-center justify-center flex-col">
                    <span className="text-2xl font-bold text-gray-900">
                        {percentage.toFixed(0)}%
                    </span>
                    {label && (
                        <span className="text-xs text-gray-500 mt-1">{label}</span>
                    )}
                </div>
            </div>
        </div>
    );
};

