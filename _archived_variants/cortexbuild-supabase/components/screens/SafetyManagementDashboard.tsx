/**
 * Safety Management Dashboard - Industry-Leading Safety Control
 * Comprehensive safety tracking, incident management, and compliance monitoring
 */

import React, { useState, useEffect } from 'react';
import {
    Shield,
    AlertTriangle,
    CheckCircle,
    XCircle,
    Activity,
    TrendingUp,
    FileText,
    Users,
    Calendar,
    Award,
    AlertCircle,
    Download
} from 'lucide-react';
import { User } from '../../types';
import { supabase } from '../../supabaseClient';

interface SafetyIncident {
    id: string;
    type: 'near-miss' | 'injury' | 'property-damage' | 'violation';
    severity: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    project: string;
    date: Date;
    status: 'open' | 'investigating' | 'resolved';
    reportedBy: string;
}

interface SafetyMetric {
    label: string;
    value: number | string;
    target: number | string;
    status: 'good' | 'warning' | 'critical';
    trend: 'up' | 'down' | 'stable';
}

export const SafetyManagementDashboard: React.FC<{ currentUser: User; goBack: () => void }> = ({ currentUser, goBack }) => {
    const [incidents, setIncidents] = useState<SafetyIncident[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            try {
                if (!supabase) { setIncidents([]); return; }
                const { data } = await supabase
                    .from('incidents')
                    .select('id, severity, description, occurred_at, resolved, project:projects(name)')
                    .order('occurred_at', { ascending: false })
                    .limit(20);
                const mapped: SafetyIncident[] = (data || []).map((row: any) => ({
                    id: row.id,
                    type: 'violation',
                    severity: row.severity,
                    description: row.description || '',
                    project: row.project?.name || 'Project',
                    date: new Date(row.occurred_at),
                    status: row.resolved ? 'resolved' : 'open',
                    reportedBy: ''
                }));
                setIncidents(mapped);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    const safetyMetrics: SafetyMetric[] = [
        { label: 'Days Without Incident', value: 127, target: 365, status: 'good', trend: 'up' },
        { label: 'Safety Score', value: '98%', target: '95%', status: 'good', trend: 'up' },
        { label: 'Active Certifications', value: 42, target: 50, status: 'warning', trend: 'up' },
        { label: 'Toolbox Talks', value: 24, target: 52, status: 'warning', trend: 'stable' },
        { label: 'PPE Compliance', value: '99%', target: '100%', status: 'good', trend: 'stable' },
        { label: 'Inspections Passed', value: '96%', target: '95%', status: 'good', trend: 'up' }
    ];

    const getStatusColor = (status: string) => {
        const colors = {
            good: 'bg-green-100 text-green-800 border-green-200',
            warning: 'bg-yellow-100 text-yellow-800 border-yellow-200',
            critical: 'bg-red-100 text-red-800 border-red-200'
        };
        return colors[status as keyof typeof colors] || colors.good;
    };

    const getSeverityColor = (severity: string) => {
        const colors = {
            low: 'bg-blue-100 text-blue-800',
            medium: 'bg-yellow-100 text-yellow-800',
            high: 'bg-orange-100 text-orange-800',
            critical: 'bg-red-100 text-red-800'
        };
        return colors[severity as keyof typeof colors];
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <Shield className="h-8 w-8 text-green-600" />
                                <h1 className="text-4xl font-bold text-gray-900">Safety Management</h1>
                            </div>
                            <p className="text-gray-600 text-lg">
                                Industry-leading safety oversight and compliance tracking
                            </p>
                        </div>
                        <button className="flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 shadow-lg font-medium">
                            <AlertTriangle className="h-5 w-5" />
                            Report Incident
                        </button>
                    </div>
                </div>

                {/* Safety Score Card */}
                <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-8 shadow-xl text-white mb-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-2xl font-bold mb-2">Overall Safety Score</h2>
                            <div className="text-6xl font-bold mb-4">98%</div>
                            <div className="flex items-center gap-2">
                                <TrendingUp className="h-5 w-5" />
                                <span className="text-lg">+2.5% from last month</span>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="mb-4">
                                <div className="text-4xl font-bold">127</div>
                                <div className="text-sm text-green-100">Days without incident</div>
                            </div>
                            <div className="flex items-center gap-2 justify-end">
                                <Award className="h-6 w-6" />
                                <span>Industry Leader</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Safety Metrics Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    {safetyMetrics.map((metric, idx) => (
                        <div key={idx} className="bg-white rounded-xl p-6 shadow-md border border-gray-200">
                            <div className="flex items-center justify-between mb-4">
                                <span className="text-sm font-medium text-gray-600">{metric.label}</span>
                                <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(metric.status)}`}>
                                    {metric.status}
                                </span>
                            </div>
                            <div className="flex items-baseline gap-2 mb-2">
                                <div className="text-3xl font-bold text-gray-900">{metric.value}</div>
                                <div className="text-sm text-gray-500">/ {metric.target}</div>
                            </div>
                            <div className="flex items-center gap-1 text-sm">
                                {metric.trend === 'up' ? (
                                    <TrendingUp className="h-4 w-4 text-green-600" />
                                ) : metric.trend === 'down' ? (
                                    <TrendingUp className="h-4 w-4 text-red-600 rotate-180" />
                                ) : (
                                    <Activity className="h-4 w-4 text-gray-600" />
                                )}
                                <span className={metric.trend === 'up' ? 'text-green-600' : metric.trend === 'down' ? 'text-red-600' : 'text-gray-600'}>
                                    {metric.trend === 'stable' ? 'Stable' : metric.trend === 'up' ? 'Improving' : 'Declining'}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Recent Incidents */}
                <div className="bg-white rounded-xl shadow-md border border-gray-200">
                    <div className="p-6 border-b border-gray-200">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-bold text-gray-900">Recent Incidents</h2>
                            <button className="text-sm text-blue-600 hover:text-blue-800 font-medium">
                                View All →
                            </button>
                        </div>
                    </div>
                    <div className="divide-y divide-gray-200">
                        {incidents.map((incident) => (
                            <div key={incident.id} className="p-6 hover:bg-gray-50 transition-colors">
                                <div className="flex items-start gap-4">
                                    <AlertTriangle className={`h-5 w-5 flex-shrink-0 ${
                                        incident.severity === 'critical' ? 'text-red-600' :
                                        incident.severity === 'high' ? 'text-orange-600' :
                                        incident.severity === 'medium' ? 'text-yellow-600' :
                                        'text-blue-600'
                                    }`} />
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                            <h3 className="font-semibold text-gray-900">{incident.description}</h3>
                                            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${getSeverityColor(incident.severity)}`}>
                                                {incident.severity}
                                            </span>
                                        </div>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600 mb-2">
                                            <div>
                                                <span className="font-medium">Project:</span> {incident.project}
                                            </div>
                                            <div>
                                                <span className="font-medium">Type:</span> {incident.type}
                                            </div>
                                            <div>
                                                <span className="font-medium">Reported:</span> {incident.reportedBy}
                                            </div>
                                            <div>
                                                <span className="font-medium">Status:</span> {incident.status}
                                            </div>
                                        </div>
                                        <div className="text-xs text-gray-500">
                                            {incident.date.toLocaleDateString()} at {incident.date.toLocaleTimeString()}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

