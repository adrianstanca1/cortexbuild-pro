import React, { useState, useEffect } from 'react';
import { User, View } from '../../types';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { ViewHeader } from '../layout/ViewHeader';
import {
    reportsService,
    ReportData,
    ReportFilter,
    KPIMetric
} from '../../services/reportsService';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    LineChart,
    Line,
    PieChart,
    Pie,
    Cell,
    Area,
    AreaChart
} from 'recharts';
import {
    TrendingUp,
    TrendingDown,
    Download,
    Filter,
    RefreshCw,
    FileText,
    BarChart3,
    PieChart as PieChartIcon,
    Calendar,
    DollarSign,
    CheckCircle,
    Shield,
    Wrench,
    FolderOpen,
    AlertTriangle,
    ArrowUpRight,
    ArrowDownRight,
    Minus
} from 'lucide-react';

interface ReportsAnalyticsProps {
    user: User;
    addToast: (message: string, type: 'success' | 'error' | 'warning') => void;
    setActiveView: (view: View) => void;
}

interface KPICardProps {
    kpi: KPIMetric;
}

const KPICard: React.FC<KPICardProps> = ({ kpi }) => {
    const iconMap = {
        FolderOpen,
        CheckCircle,
        DollarSign,
        Shield,
        Wrench,
        TrendingUp
    };

    const Icon = iconMap[kpi.icon as keyof typeof iconMap] || TrendingUp;

    const formatValue = (value: number | string, format: string) => {
        if (typeof value === 'string') return value;

        switch (format) {
            case 'currency':
                return new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: 'USD'
                }).format(value);
            case 'percentage':
                return `${value.toFixed(1)}%`;
            case 'duration':
                return `${value}h`;
            default:
                return value.toLocaleString();
        }
    };

    const getChangeIcon = () => {
        switch (kpi.changeType) {
            case 'increase':
                return <ArrowUpRight className="w-4 h-4" />;
            case 'decrease':
                return <ArrowDownRight className="w-4 h-4" />;
            default:
                return <Minus className="w-4 h-4" />;
        }
    };

    const getChangeColor = () => {
        switch (kpi.changeType) {
            case 'increase':
                return 'text-green-600';
            case 'decrease':
                return 'text-red-600';
            default:
                return 'text-gray-500';
        }
    };

    const colorClasses = {
        blue: 'bg-blue-100 text-blue-600',
        green: 'bg-green-100 text-green-600',
        red: 'bg-red-100 text-red-600',
        yellow: 'bg-yellow-100 text-yellow-600',
        purple: 'bg-purple-100 text-purple-600',
        gray: 'bg-gray-100 text-gray-600'
    };

    return (
        <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-lg ${colorClasses[kpi.color]}`}>
                    <Icon className="w-6 h-6" />
                </div>
                {kpi.change !== undefined && (
                    <div className={`flex items-center gap-1 ${getChangeColor()}`}>
                        {getChangeIcon()}
                        <span className="text-sm font-medium">
                            {Math.abs(kpi.change)}%
                        </span>
                    </div>
                )}
            </div>

            <div className="space-y-1">
                <h3 className="text-sm font-medium text-gray-600">{kpi.title}</h3>
                <p className="text-2xl font-bold text-gray-900">
                    {formatValue(kpi.value, kpi.format)}
                </p>
                {kpi.description && (
                    <p className="text-xs text-gray-500">{kpi.description}</p>
                )}
            </div>
        </Card>
    );
};

const CustomTooltip: React.FC<any> = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
                <p className="font-medium text-gray-900">{label}</p>
                {payload.map((entry: any, index: number) => (
                    <p key={index} className="text-sm" data-color={entry.color}>
                        {entry.name}: {entry.value}
                    </p>
                ))}
            </div>
        );
    }
    return null;
};

export const ReportsAnalytics: React.FC<ReportsAnalyticsProps> = ({
    user,
    addToast,
    setActiveView
}) => {
    const [reportData, setReportData] = useState<ReportData | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<'overview' | 'projects' | 'expenses' | 'safety'>('overview');
    const [dateRange, setDateRange] = useState<ReportFilter['dateRange']>({
        start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        end: new Date().toISOString().split('T')[0]
    });

    useEffect(() => {
        loadReportData();
    }, [dateRange]);

    const loadReportData = async () => {
        setIsLoading(true);
        try {
            const filter: ReportFilter = { dateRange };
            const data = await reportsService.generateReport(filter);
            setReportData(data);
            addToast('Report data loaded successfully', 'success');
        } catch (error) {
            console.error('Failed to load report data:', error);
            addToast('Failed to load report data', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleExport = async (reportType: 'summary' | 'expenses' | 'projects' | 'safety') => {
        if (!reportData) return;

        try {
            const csvContent = await reportsService.exportToCSV(reportData, reportType);
            const blob = new Blob([csvContent], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${reportType}-report-${new Date().toISOString().split('T')[0]}.csv`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);

            addToast(`${reportType} report exported successfully`, 'success');
        } catch (error) {
            console.error('Failed to export report:', error);
            addToast('Failed to export report', 'error');
        }
    };

    const handleDateRangePreset = (preset: string) => {
        const presets = reportsService.getDateRangePresets();
        const selectedPreset = presets.find(p => p.label === preset);
        if (selectedPreset) {
            setDateRange(selectedPreset.range);
        }
    };

    const chartColors = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#F97316'];

    const transformChartData = (chartData: any) => {
        if (!chartData || !chartData.labels) return [];

        return chartData.labels.map((label: string, index: number) => ({
            name: label,
            value: chartData.datasets[0]?.data[index] || 0
        }));
    };

    if (!reportData && !isLoading) {
        return (
            <div className="p-6">
                <div className="text-center py-20">
                    <BarChart3 className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Reports & Analytics</h2>
                    <p className="text-gray-600 mb-6">Generate comprehensive reports and analyze your construction data</p>
                    <Button onClick={loadReportData}>
                        <FileText className="w-4 h-4 mr-2" />
                        Generate Report
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6">
            <ViewHeader
                title="Reports & Analytics"
                description="Comprehensive data analysis and reporting tools"
                actions={
                    <div className="flex items-center gap-3">
                        <select
                            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                            onChange={(e) => handleDateRangePreset(e.target.value)}
                            defaultValue=""
                            aria-label="Select date range preset"
                        >
                            <option value="" disabled>Quick Date Ranges</option>
                            {reportsService.getDateRangePresets().map(preset => (
                                <option key={preset.label} value={preset.label}>
                                    {preset.label}
                                </option>
                            ))}
                        </select>

                        <div className="flex items-center gap-2">
                            <input
                                type="date"
                                value={dateRange.start}
                                onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                                className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                                aria-label="Start date"
                            />
                            <span className="text-gray-500">to</span>
                            <input
                                type="date"
                                value={dateRange.end}
                                onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                                className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                                aria-label="End date"
                            />
                        </div>

                        <Button variant="outline" onClick={loadReportData} disabled={isLoading}>
                            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                            Refresh
                        </Button>
                    </div>
                }
            />

            {/* Tab Navigation */}
            <div className="flex border-b border-gray-200">
                {[
                    { id: 'overview', label: 'Overview', icon: BarChart3 },
                    { id: 'projects', label: 'Projects', icon: FolderOpen },
                    { id: 'expenses', label: 'Expenses', icon: DollarSign },
                    { id: 'safety', label: 'Safety', icon: Shield }
                ].map(tab => {
                    const Icon = tab.icon;
                    return (
                        <button
                            key={tab.id}
                            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === tab.id
                                    ? 'border-blue-500 text-blue-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700'
                                }`}
                            onClick={() => setActiveTab(tab.id as any)}
                        >
                            <Icon className="w-4 h-4 inline mr-2" />
                            {tab.label}
                        </button>
                    );
                })}
            </div>

            {isLoading ? (
                <div className="text-center py-20">
                    <RefreshCw className="w-12 h-12 mx-auto text-gray-300 animate-spin mb-4" />
                    <p className="text-gray-600">Generating report...</p>
                </div>
            ) : reportData ? (
                <div className="space-y-6">
                    {/* KPI Cards */}
                    {activeTab === 'overview' && (
                        <>
                            <div>
                                <h3 className="text-lg font-semibold mb-4">Key Performance Indicators</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {reportData.kpis.map(kpi => (
                                        <KPICard key={kpi.id} kpi={kpi} />
                                    ))}
                                </div>
                            </div>

                            {/* Charts Overview */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <Card className="p-6">
                                    <div className="flex justify-between items-center mb-4">
                                        <h3 className="text-lg font-semibold">Project Progress</h3>
                                        <PieChartIcon className="w-5 h-5 text-gray-400" />
                                    </div>
                                    <ResponsiveContainer width="100%" height={250}>
                                        <PieChart>
                                            <Pie
                                                data={transformChartData(reportData.charts.projectProgress)}
                                                cx="50%"
                                                cy="50%"
                                                outerRadius={80}
                                                dataKey="value"
                                                label={({ name, value }) => `${name}: ${value}`}
                                            >
                                                {transformChartData(reportData.charts.projectProgress).map((entry: any, index: number) => (
                                                    <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip content={<CustomTooltip />} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </Card>

                                <Card className="p-6">
                                    <div className="flex justify-between items-center mb-4">
                                        <h3 className="text-lg font-semibold">Task Completion Trend</h3>
                                        <TrendingUp className="w-5 h-5 text-gray-400" />
                                    </div>
                                    <ResponsiveContainer width="100%" height={250}>
                                        <AreaChart data={transformChartData(reportData.charts.taskCompletion)}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="name" />
                                            <YAxis />
                                            <Tooltip content={<CustomTooltip />} />
                                            <Area
                                                type="monotone"
                                                dataKey="value"
                                                stroke="#10B981"
                                                fill="#10B981"
                                                fillOpacity={0.3}
                                            />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </Card>
                            </div>
                        </>
                    )}

                    {/* Project Analytics */}
                    {activeTab === 'projects' && (
                        <div className="space-y-6">
                            <div className="flex justify-between items-center">
                                <h3 className="text-lg font-semibold">Project Analytics</h3>
                                <Button variant="outline" onClick={() => handleExport('projects')}>
                                    <Download className="w-4 h-4 mr-2" />
                                    Export Projects
                                </Button>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <Card className="p-6">
                                    <h4 className="text-md font-semibold mb-4">Project Status Distribution</h4>
                                    <ResponsiveContainer width="100%" height={300}>
                                        <BarChart data={transformChartData(reportData.charts.projectProgress)}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="name" />
                                            <YAxis />
                                            <Tooltip content={<CustomTooltip />} />
                                            <Bar dataKey="value" fill="#3B82F6" />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </Card>

                                <Card className="p-6">
                                    <h4 className="text-md font-semibold mb-4">Top Projects by Spending</h4>
                                    <div className="space-y-3 max-h-80 overflow-y-auto">
                                        {reportData.tables.topProjects.map((project, index) => (
                                            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                                <div className="flex-1">
                                                    <h5 className="font-medium text-sm">{project.name}</h5>
                                                    <p className="text-xs text-gray-500">{project.status}</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="font-medium text-sm">
                                                        ${project.spent.toLocaleString()}
                                                    </p>
                                                    <p className="text-xs text-gray-500">
                                                        {project.progress}% complete
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </Card>
                            </div>
                        </div>
                    )}

                    {/* Expense Analytics */}
                    {activeTab === 'expenses' && (
                        <div className="space-y-6">
                            <div className="flex justify-between items-center">
                                <h3 className="text-lg font-semibold">Expense Analytics</h3>
                                <Button variant="outline" onClick={() => handleExport('expenses')}>
                                    <Download className="w-4 h-4 mr-2" />
                                    Export Expenses
                                </Button>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <Card className="p-6">
                                    <h4 className="text-md font-semibold mb-4">Expense Breakdown by Category</h4>
                                    <ResponsiveContainer width="100%" height={300}>
                                        <BarChart data={transformChartData(reportData.charts.expenseBreakdown)}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="name" />
                                            <YAxis />
                                            <Tooltip content={<CustomTooltip />} />
                                            <Bar dataKey="value" fill="#10B981" />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </Card>

                                <Card className="p-6">
                                    <h4 className="text-md font-semibold mb-4">Recent Expenses</h4>
                                    <div className="space-y-3 max-h-80 overflow-y-auto">
                                        {reportData.tables.recentExpenses.map((expense, index) => (
                                            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                                <div className="flex-1">
                                                    <h5 className="font-medium text-sm">{expense.description}</h5>
                                                    <p className="text-xs text-gray-500">{expense.category} • {expense.date}</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="font-medium text-sm">
                                                        ${expense.amount.toLocaleString()}
                                                    </p>
                                                    <span className={`text-xs px-2 py-1 rounded-full ${expense.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                                                            expense.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                                                                'bg-red-100 text-red-800'
                                                        }`}>
                                                        {expense.status}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </Card>
                            </div>
                        </div>
                    )}

                    {/* Safety Analytics */}
                    {activeTab === 'safety' && (
                        <div className="space-y-6">
                            <div className="flex justify-between items-center">
                                <h3 className="text-lg font-semibold">Safety Analytics</h3>
                                <Button variant="outline" onClick={() => handleExport('safety')}>
                                    <Download className="w-4 h-4 mr-2" />
                                    Export Safety Data
                                </Button>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <Card className="p-6">
                                    <h4 className="text-md font-semibold mb-4">Safety Incident Trends</h4>
                                    <ResponsiveContainer width="100%" height={300}>
                                        <LineChart data={transformChartData(reportData.charts.safetyTrends)}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="name" />
                                            <YAxis />
                                            <Tooltip content={<CustomTooltip />} />
                                            <Line
                                                type="monotone"
                                                dataKey="value"
                                                stroke="#EF4444"
                                                strokeWidth={2}
                                                dot={{ fill: '#EF4444' }}
                                            />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </Card>

                                <Card className="p-6">
                                    <h4 className="text-md font-semibold mb-4">Safety Metrics by Type</h4>
                                    <div className="space-y-3 max-h-80 overflow-y-auto">
                                        {reportData.tables.safetyMetrics.map((metric, index) => (
                                            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                                <div className="flex-1">
                                                    <h5 className="font-medium text-sm">{metric.type}</h5>
                                                    <p className="text-xs text-gray-500">
                                                        Severity: {metric.severity}
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <span className="font-medium text-sm">
                                                        {metric.count} incidents
                                                    </span>
                                                    <div className={`flex items-center ${metric.trend === 'up' ? 'text-red-600' :
                                                            metric.trend === 'down' ? 'text-green-600' :
                                                                'text-gray-500'
                                                        }`}>
                                                        {metric.trend === 'up' ? <TrendingUp className="w-4 h-4" /> :
                                                            metric.trend === 'down' ? <TrendingDown className="w-4 h-4" /> :
                                                                <Minus className="w-4 h-4" />}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </Card>
                            </div>
                        </div>
                    )}
                </div>
            ) : null}
        </div>
    );
};