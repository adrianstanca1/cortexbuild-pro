import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import {
    TrendingUp,
    Users,
    Building,
    AlertTriangle,
    DollarSign,
    CheckCircle,
    Clock,
    Zap,
    Activity
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { backendApi } from '../../services/backendApiService';

interface DashboardMetrics {
    activeProjects: number;
    pendingTasks: number;
    teamSize: number;
    totalBudget: number;
    monthlyExpenses: number;
    recentActivity: Array<{
        type: string;
        description: string;
        timestamp: string;
    }>;
}

export const EnhancedExecutiveDashboard: React.FC = () => {
    const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [dataSource, setDataSource] = useState<'backend' | 'mock'>('mock');
    const { user } = useAuth();

    useEffect(() => {
        loadDashboardMetrics();
    }, []);

    const loadDashboardMetrics = async () => {
        try {
            setLoading(true);
            setError(null);

            // Try to get real data from backend
            console.log('🔄 Attempting to load dashboard data from backend...');
            const response = await backendApi.getDashboardData();

            if (response.success && response.data) {
                console.log('✅ Successfully loaded real backend data');
                const backendData = response.data;

                setMetrics({
                    activeProjects: backendData.portfolioSummary?.activeProjects || 0,
                    pendingTasks: backendData.operationalInsights?.pendingTasks || 0,
                    teamSize: backendData.team?.length || 0,
                    totalBudget: backendData.portfolioSummary?.totalBudget || 0,
                    monthlyExpenses: backendData.operationalInsights?.monthlyExpenses || 0,
                    recentActivity: backendData.projects?.slice(0, 5).map((project: any) => ({
                        type: 'project',
                        description: `Project ${project.name} updated`,
                        timestamp: project.updated_at || new Date().toISOString()
                    })) || []
                });
                setDataSource('backend');
            } else {
                console.warn('⚠️ Backend unavailable, using mock data');
                setMetrics({
                    activeProjects: 15,
                    pendingTasks: 42,
                    teamSize: 28,
                    totalBudget: 2400000,
                    monthlyExpenses: 185000,
                    recentActivity: [
                        { type: 'project', description: 'Project Alpha milestone reached', timestamp: new Date().toISOString() },
                        { type: 'task', description: 'Design review completed', timestamp: new Date().toISOString() },
                        { type: 'team', description: 'New team member onboarded', timestamp: new Date().toISOString() }
                    ]
                });
                setDataSource('mock');
            }
        } catch (error) {
            console.error('❌ Error loading dashboard data:', error);
            setError('Failed to load dashboard data');
            setMetrics({
                activeProjects: 0,
                pendingTasks: 0,
                teamSize: 0,
                totalBudget: 0,
                monthlyExpenses: 0,
                recentActivity: []
            });
            setDataSource('mock');
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                <span className="ml-3 text-gray-600">Loading dashboard...</span>
            </div>
        );
    }

    if (error || !metrics) {
        return (
            <div className="flex flex-col items-center justify-center h-96">
                <AlertTriangle className="h-16 w-16 text-red-500 mb-4" />
                <p className="text-lg text-gray-600">{error}</p>
                <Button onClick={loadDashboardMetrics} className="mt-4">
                    Try Again
                </Button>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Enhanced Executive Dashboard</h1>
                    <p className="text-gray-600">Welcome back, {user?.email}</p>
                    <div className="flex items-center mt-2">
                        <Badge variant={dataSource === 'backend' ? 'default' : 'secondary'} className="mr-2">
                            {dataSource === 'backend' ? '🟢 Live Data' : '🟡 Mock Data'}
                        </Badge>
                        <span className="text-sm text-gray-500">
                            {dataSource === 'backend' ? 'Connected to backend' : 'Backend unavailable'}
                        </span>
                    </div>
                </div>
                <Button onClick={loadDashboardMetrics} className="flex items-center space-x-2">
                    <Zap className="h-4 w-4" />
                    <span>Refresh</span>
                </Button>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-blue-100 text-sm font-medium">Active Projects</p>
                                <p className="text-3xl font-bold">{metrics.activeProjects}</p>
                                <p className="text-blue-200 text-xs mt-1">Currently running</p>
                            </div>
                            <Building className="h-8 w-8 text-blue-200" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-green-100 text-sm font-medium">Pending Tasks</p>
                                <p className="text-3xl font-bold">{metrics.pendingTasks}</p>
                                <p className="text-green-200 text-xs mt-1">Awaiting action</p>
                            </div>
                            <Clock className="h-8 w-8 text-green-200" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-purple-100 text-sm font-medium">Team Size</p>
                                <p className="text-3xl font-bold">{metrics.teamSize}</p>
                                <p className="text-purple-200 text-xs mt-1">Active members</p>
                            </div>
                            <Users className="h-8 w-8 text-purple-200" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-yellow-100 text-sm font-medium">Total Budget</p>
                                <p className="text-2xl font-bold">{formatCurrency(metrics.totalBudget)}</p>
                                <p className="text-yellow-200 text-xs mt-1">Allocated funds</p>
                            </div>
                            <DollarSign className="h-8 w-8 text-yellow-200" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-r from-red-500 to-red-600 text-white">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-red-100 text-sm font-medium">Monthly Expenses</p>
                                <p className="text-2xl font-bold">{formatCurrency(metrics.monthlyExpenses)}</p>
                                <p className="text-red-200 text-xs mt-1">Current month</p>
                            </div>
                            <TrendingUp className="h-8 w-8 text-red-200" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Recent Activity */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                        <Activity className="h-5 w-5" />
                        <span>Recent Activity</span>
                        <Badge variant="outline" className="ml-2">
                            {dataSource === 'backend' ? 'Real-time' : 'Demo'}
                        </Badge>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {metrics.recentActivity.length > 0 ? (
                            metrics.recentActivity.map((activity, index) => (
                                <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                                    <div className="flex-shrink-0">
                                        <CheckCircle className="h-5 w-5 text-green-500" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm font-medium text-gray-900">{activity.description}</p>
                                        <p className="text-xs text-gray-500">
                                            {new Date(activity.timestamp).toLocaleString()}
                                        </p>
                                    </div>
                                    <Badge variant="secondary" className="text-xs">
                                        {activity.type}
                                    </Badge>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-8 text-gray-500">
                                <Activity className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                                <p>No recent activity</p>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Integration Status */}
            <Card className="border-l-4 border-l-blue-500">
                <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-lg font-semibold mb-2">Backend Integration Status</h3>
                            <p className="text-gray-600">
                                {dataSource === 'backend'
                                    ? '✅ Successfully connected to backend APIs and loading real data'
                                    : '⚠️ Backend unavailable - displaying mock data with intelligent fallback'
                                }
                            </p>
                        </div>
                        <div className="flex items-center space-x-2">
                            <div className={`w-3 h-3 rounded-full ${dataSource === 'backend' ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                            <span className="text-sm font-medium">
                                {dataSource === 'backend' ? 'Connected' : 'Fallback Mode'}
                            </span>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default EnhancedExecutiveDashboard;