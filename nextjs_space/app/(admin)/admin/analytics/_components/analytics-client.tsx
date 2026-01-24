'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { Target, TrendingUp, Users, DollarSign, Activity, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface AnalyticsData {
    projects: Array<{ status: string; count: number }>;
    productivity: {
        total: number;
        completed: number;
        rate: number;
    };
    allocation: Array<{
        projectName: string;
        userName: string;
    }>;
    finances: Array<{
        amount: number;
        date: string;
        project: string;
    }>;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export function AnalyticsClient({ initialData }: { initialData: AnalyticsData }) {
    const [activeMetric, setActiveMetric] = useState<'productivity' | 'finances'>('productivity');

    // Process allocation data for heatmap-style display
    const projectSummaries = initialData.allocation.reduce((acc: any, curr) => {
        acc[curr.projectName] = (acc[curr.projectName] || 0) + 1;
        return acc;
    }, {});

    const distributionData: Array<{ name: string; value: number }> = Object.entries(projectSummaries).map(([name, count]) => ({
        name,
        value: count as number
    }));

    return (
        <div className="space-y-8">
            {/* Top Level KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="bg-blue-50 border-blue-100">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-blue-600">Productivity Index</p>
                                <h3 className="text-2xl font-bold text-blue-900">{initialData.productivity.rate.toFixed(1)}%</h3>
                            </div>
                            <Target className="h-8 w-8 text-blue-500 opacity-20" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-emerald-50 border-emerald-100">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-emerald-600">Task Completion</p>
                                <h3 className="text-2xl font-bold text-emerald-900">{initialData.productivity.completed}/{initialData.productivity.total}</h3>
                            </div>
                            <TrendingUp className="h-8 w-8 text-emerald-500 opacity-20" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-amber-50 border-amber-100">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-amber-600">Resource Load</p>
                                <h3 className="text-2xl font-bold text-amber-900">High</h3>
                            </div>
                            <Users className="h-8 w-8 text-amber-500 opacity-20" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-purple-50 border-purple-100">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-purple-600">Budget Volatility</p>
                                <h3 className="text-2xl font-bold text-purple-900">{initialData.finances.length} Δ</h3>
                            </div>
                            <DollarSign className="h-8 w-8 text-purple-500 opacity-20" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Chart Area */}
                <Card className="lg:col-span-2 shadow-sm">
                    <CardHeader>
                        <div className="flex justify-between items-center">
                            <CardTitle className="text-lg flex items-center">
                                <Activity className="h-5 w-5 mr-2 text-blue-500" />
                                Performance Trends
                            </CardTitle>
                            <div className="flex bg-gray-100 p-1 rounded-lg">
                                <button
                                    onClick={() => setActiveMetric('productivity')}
                                    className={`px-3 py-1 text-xs rounded-md transition-all ${activeMetric === 'productivity' ? 'bg-white shadow text-blue-600' : 'text-gray-500'}`}
                                >
                                    Productivity
                                </button>
                                <button
                                    onClick={() => setActiveMetric('finances')}
                                    className={`px-3 py-1 text-xs rounded-md transition-all ${activeMetric === 'finances' ? 'bg-white shadow text-blue-600' : 'text-gray-500'}`}
                                >
                                    Forecasting
                                </button>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="h-[400px]">
                        {activeMetric === 'productivity' ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={initialData.projects}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <XAxis dataKey="status" />
                                    <YAxis />
                                    <Tooltip cursor={{ fill: '#f3f4f6' }} />
                                    <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={40} />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={initialData.finances}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <XAxis dataKey="date" />
                                    <YAxis />
                                    <Tooltip />
                                    <Line type="monotone" dataKey="amount" stroke="#8b5cf6" strokeWidth={2} dot={{ r: 4 }} />
                                </LineChart>
                            </ResponsiveContainer>
                        )}
                    </CardContent>
                </Card>

                {/* Multi-Project Resource Heatmap */}
                <Card className="shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-lg">Resource Heatmap</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-6">
                            {distributionData.length === 0 ? (
                                <div className="text-center py-12">
                                    <AlertCircle className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                                    <p className="text-sm text-gray-500 font-medium">No team allocations found</p>
                                </div>
                            ) : (
                                <>
                                    <div className="h-[200px]">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={distributionData}
                                                    innerRadius={60}
                                                    outerRadius={80}
                                                    paddingAngle={5}
                                                    dataKey="value"
                                                >
                                                    {distributionData.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                    ))}
                                                </Pie>
                                                <Tooltip />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>
                                    <div className="space-y-3">
                                        {distributionData.map((item, index) => (
                                            <div key={item.name} className="flex items-center justify-between">
                                                <div className="flex items-center">
                                                    <div className={`h-2 w-2 rounded-full mr-3 ${index === 0 ? 'bg-blue-500' :
                                                            index === 1 ? 'bg-emerald-500' :
                                                                index === 2 ? 'bg-amber-500' :
                                                                    index === 3 ? 'bg-red-500' :
                                                                        'bg-purple-500'
                                                        }`} />
                                                    <span className="text-sm text-gray-600 font-medium">{item.name}</span>
                                                </div>
                                                <Badge variant="outline">{Math.round((item.value / initialData.allocation.length) * 100)}%</Badge>
                                            </div>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
