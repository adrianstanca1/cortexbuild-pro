import React, { useMemo } from 'react';

export interface ChartDataPoint {
    label: string;
    value: number;
    color?: string;
}

interface MiniChartProps {
    data: ChartDataPoint[];
    type: 'bar' | 'line' | 'pie';
    height?: number;
}

export const MiniChart: React.FC<MiniChartProps> = ({ data, type, height = 100 }) => {
    const maxValue = useMemo(() => Math.max(...data.map(d => d.value)), [data]);

    if (type === 'bar') {
        return (
            <div className="flex items-end justify-between gap-2" style={{ height }}>
                {data.map((point, idx) => (
                    <div key={idx} className="flex-1 flex flex-col items-center">
                        <div
                            className="w-full bg-cyan-500 rounded-t transition-all hover:bg-cyan-600"
                            style={{
                                height: `${(point.value / maxValue) * 100}%`,
                                minHeight: '4px'
                            }}
                        />
                        <span className="text-xs text-gray-600 dark:text-gray-400 mt-1 truncate w-full text-center">
                            {point.label}
                        </span>
                    </div>
                ))}
            </div>
        );
    }

    if (type === 'line') {
        const points = data.map((point, idx) => ({
            x: (idx / (data.length - 1)) * 100,
            y: 100 - (point.value / maxValue) * 100
        }));

        const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

        return (
            <div style={{ height }}>
                <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
                    <path
                        d={pathD}
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        className="text-cyan-500"
                    />
                    <path
                        d={`${pathD} L 100 100 L 0 100 Z`}
                        fill="currentColor"
                        className="text-cyan-500 opacity-20"
                    />
                </svg>
            </div>
        );
    }

    // Pie chart (simplified donut)
    const total = data.reduce((sum, d) => sum + d.value, 0);
    let currentAngle = 0;

    return (
        <div className="flex items-center justify-center" style={{ height }}>
            <svg width={height} height={height} viewBox="0 0 100 100">
                {data.map((point, idx) => {
                    const percentage = point.value / total;
                    const angle = percentage * 360;
                    const startAngle = currentAngle;
                    currentAngle += angle;

                    const startRad = (startAngle - 90) * (Math.PI / 180);
                    const endRad = (currentAngle - 90) * (Math.PI / 180);

                    const x1 = 50 + 40 * Math.cos(startRad);
                    const y1 = 50 + 40 * Math.sin(startRad);
                    const x2 = 50 + 40 * Math.cos(endRad);
                    const y2 = 50 + 40 * Math.sin(endRad);

                    const largeArc = angle > 180 ? 1 : 0;

                    return (
                        <path
                            key={idx}
                            d={`M 50 50 L ${x1} ${y1} A 40 40 0 ${largeArc} 1 ${x2} ${y2} Z`}
                            fill={point.color || `hsl(${idx * (360 / data.length)}, 70%, 50%)`}
                            opacity="0.8"
                        />
                    );
                })}
                <circle cx="50" cy="50" r="25" fill="white" className="dark:fill-gray-800" />
            </svg>
        </div>
    );
};

interface ProgressBarProps {
    value: number;
    max: number;
    label?: string;
    color?: 'blue' | 'green' | 'yellow' | 'red' | 'cyan';
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
    value,
    max,
    label,
    color = 'cyan'
}) => {
    const percentage = Math.min((value / max) * 100, 100);

    const colorClasses = {
        blue: 'bg-blue-500',
        green: 'bg-green-500',
        yellow: 'bg-yellow-500',
        red: 'bg-red-500',
        cyan: 'bg-cyan-500'
    };

    return (
        <div className="w-full">
            {label && (
                <div className="flex justify-between mb-1">
                    <span className="text-sm text-gray-700 dark:text-gray-300">{label}</span>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                        {value.toLocaleString()} / {max.toLocaleString()}
                    </span>
                </div>
            )}
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                    className={`${colorClasses[color]} h-2 rounded-full transition-all duration-300`}
                    style={{ width: `${percentage}%` }}
                />
            </div>
        </div>
    );
};
