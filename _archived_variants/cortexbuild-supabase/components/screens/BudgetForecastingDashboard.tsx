/**
 * Budget Forecasting Dashboard - Market-Leading Financial Intelligence
 * AI-powered budget tracking, forecasting, and cost optimization
 */

import React, { useState, useEffect } from 'react';
import {
    DollarSign,
    TrendingUp,
    TrendingDown,
    AlertTriangle,
    CheckCircle,
    Target,
    PieChart,
    BarChart3,
    Calendar,
    Download,
    RefreshCw
} from 'lucide-react';
import { User } from '../../types';
import { supabase } from '../../supabaseClient';

interface BudgetData {
    projectName: string;
    totalBudget: number;
    spent: number;
    committed: number;
    forecasted: number;
    variance: number;
    status: 'on-track' | 'at-risk' | 'over-budget';
}

interface BudgetForecastingDashboardProps {
    currentUser: User;
    goBack: () => void;
}

export const BudgetForecastingDashboard: React.FC<BudgetForecastingDashboardProps> = ({ currentUser, goBack }) => {
    const [projects, setProjects] = useState<BudgetData[]>([]);
    const [timeframe, setTimeframe] = useState<'month' | 'quarter' | 'year'>('month');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadBudgetData();
    }, [timeframe]);

    const loadBudgetData = async () => {
        try {
            if (!supabase) { setProjects([]); return; }

            // Join budgets with projects for names
            const { data } = await supabase
                .from('budgets')
                .select('total_budget, total_spent, forecast, period, project:projects(name)');

            const mapped: BudgetData[] = (data || []).map((row: any) => {
                const totalBudget = Number(row.total_budget || 0);
                const spent = Number(row.total_spent || 0);
                const committed = 0; // if you track committed separately, add a column and map it here
                const forecasted = Number(row.forecast || spent);
                const variance = forecasted - totalBudget;
                const utilization = totalBudget > 0 ? spent / totalBudget : 0;
                const status: BudgetData['status'] = variance > 0 ? 'over-budget' : (utilization > 0.85 ? 'at-risk' : 'on-track');
                return {
                    projectName: row.project?.name || 'Project',
                    totalBudget,
                    spent,
                    committed,
                    forecasted,
                    variance,
                    status
                };
            });

            setProjects(mapped);
        } finally {
            setLoading(false);
        }
    };

    const totalBudget = projects.reduce((sum, p) => sum + p.totalBudget, 0);
    const totalSpent = projects.reduce((sum, p) => sum + p.spent, 0);
    const totalForecasted = projects.reduce((sum, p) => sum + p.forecasted, 0);
    const totalVariance = totalForecasted - totalBudget;
    const utilizationRate = (totalSpent / totalBudget) * 100;

    const getStatusIcon = (status: BudgetData['status']) => {
        switch (status) {
            case 'on-track':
                return <CheckCircle className="h-5 w-5 text-green-600" />;
            case 'at-risk':
                return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
            case 'over-budget':
                return <AlertTriangle className="h-5 w-5 text-red-600" />;
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0
        }).format(amount);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <DollarSign className="h-8 w-8 text-green-600" />
                                <h1 className="text-4xl font-bold text-gray-900">Budget Forecasting</h1>
                            </div>
                            <p className="text-gray-600 text-lg">
                                AI-powered financial intelligence and cost optimization
                            </p>
                        </div>
                        <div className="flex gap-3">
                            <button className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">
                                <RefreshCw className="h-4 w-4" />
                                Refresh
                            </button>
                            <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                                <Download className="h-4 w-4" />
                                Export
                            </button>
                        </div>
                    </div>
                </div>

                {/* Timeframe Selector */}
                <div className="bg-white rounded-xl p-4 shadow-md border border-gray-200 mb-8">
                    <div className="flex items-center gap-4">
                        <Calendar className="h-5 w-5 text-gray-600" />
                        <span className="text-sm font-medium text-gray-700">Timeframe:</span>
                        <div className="flex gap-2">
                            {(['month', 'quarter', 'year'] as const).map((period) => (
                                <button
                                    key={period}
                                    onClick={() => setTimeframe(period)}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                        timeframe === period
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                                >
                                    {period.charAt(0).toUpperCase() + period.slice(1)}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Summary Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-xl">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-blue-100">Total Budget</span>
                            <DollarSign className="h-6 w-6 text-blue-100" />
                        </div>
                        <div className="text-3xl font-bold mb-1">{formatCurrency(totalBudget)}</div>
                        <div className="text-sm text-blue-100">Across {projects.length} projects</div>
                    </div>

                    <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white shadow-xl">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-green-100">Total Spent</span>
                            <TrendingUp className="h-6 w-6 text-green-100" />
                        </div>
                        <div className="text-3xl font-bold mb-1">{formatCurrency(totalSpent)}</div>
                        <div className="text-sm text-green-100">{utilizationRate.toFixed(1)}% utilized</div>
                    </div>

                    <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white shadow-xl">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-purple-100">Forecasted</span>
                            <Target className="h-6 w-6 text-purple-100" />
                        </div>
                        <div className="text-3xl font-bold mb-1">{formatCurrency(totalForecasted)}</div>
                        <div className="text-sm text-purple-100">AI prediction</div>
                    </div>

                    <div className={`bg-gradient-to-br ${totalVariance >= 0 ? 'from-red-500 to-red-600' : 'from-emerald-500 to-emerald-600'} rounded-xl p-6 text-white shadow-xl`}>
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-white/90">Variance</span>
                            {totalVariance >= 0 ? <TrendingUp className="h-6 w-6" /> : <TrendingDown className="h-6 w-6" />}
                        </div>
                        <div className="text-3xl font-bold mb-1">{formatCurrency(Math.abs(totalVariance))}</div>
                        <div className="text-sm text-white/90">{totalVariance >= 0 ? 'Over' : 'Under'} budget</div>
                    </div>
                </div>

                {/* Projects Table */}
                <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
                    <div className="p-6 border-b border-gray-200">
                        <h2 className="text-xl font-bold text-gray-900">Project Budget Overview</h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Project</th>
                                    <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900">Budget</th>
                                    <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900">Spent</th>
                                    <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900">Committed</th>
                                    <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900">Forecasted</th>
                                    <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900">Variance</th>
                                    <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {projects.map((project) => {
                                    const remaining = project.totalBudget - project.spent - project.committed;
                                    const percentSpent = (project.spent / project.totalBudget) * 100;
                                    
                                    return (
                                        <tr key={project.projectName} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="font-medium text-gray-900">{project.projectName}</div>
                                                <div className="text-sm text-gray-500">{percentSpent.toFixed(1)}% spent</div>
                                            </td>
                                            <td className="px-6 py-4 text-right font-medium text-gray-900">
                                                {formatCurrency(project.totalBudget)}
                                            </td>
                                            <td className="px-6 py-4 text-right text-green-600 font-medium">
                                                {formatCurrency(project.spent)}
                                            </td>
                                            <td className="px-6 py-4 text-right text-yellow-600 font-medium">
                                                {formatCurrency(project.committed)}
                                            </td>
                                            <td className="px-6 py-4 text-right text-purple-600 font-medium">
                                                {formatCurrency(project.forecasted)}
                                            </td>
                                            <td className={`px-6 py-4 text-right font-semibold ${project.variance >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                                                {project.variance >= 0 ? '+' : ''}{formatCurrency(project.variance)}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <div className="flex items-center justify-center gap-2">
                                                    {getStatusIcon(project.status)}
                                                    <span className="text-sm font-medium capitalize text-gray-700">
                                                        {project.status.replace('-', ' ')}
                                                    </span>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

