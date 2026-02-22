import React, { useState, useMemo, useCallback } from 'react';
import {
    Shield,
    AlertTriangle,
    Activity,
    BarChart3,
    Settings,
    Bell,
    Eye,
    Zap,
    Clock,
    MapPin,
    BrainCircuit
} from 'lucide-react';

interface RiskFactor {
    id: string;
    name: string;
    category: 'schedule' | 'resource' | 'technical' | 'environmental' | 'safety' | 'financial' | 'regulatory';
    probability: number;
    impact: 'low' | 'medium' | 'high' | 'critical';
    severity: number; // calculated score 0-100
    description: string;
    mitigation?: string;
    owner?: string;
    dueDate?: Date;
    status: 'active' | 'mitigated' | 'resolved';
    createdAt: Date;
    updatedAt: Date;
    confidence?: number; // ML confidence 0-100
}

interface RiskTrend {
    date: Date;
    overallRiskScore: number;
    criticalRisks: number;
    highRisks: number;
    mediumRisks: number;
    lowRisks: number;
    resolvedRisks: number;
    totalRisks: number;
}

interface ComplianceStandard {
    id: string;
    name: string;
    category: 'safety' | 'environmental' | 'quality' | 'regulatory';
    requirement: string;
    status: 'compliant' | 'warning' | 'non-compliant';
    lastAudit?: Date;
    nextAudit?: Date;
    dueDate?: Date;
    owner: string;
    score: number; // 0-100
}

interface RiskMetric {
    id: string;
    name: string;
    value: number;
    trend: 'up' | 'down' | 'stable';
    status: 'healthy' | 'warning' | 'critical';
    threshold: {
        warning: number;
        critical: number;
    };
    lastUpdated: Date;
    description: string;
}

interface RiskAssessmentDashboardProps {
    projectId?: string;
}

const RiskAssessmentDashboard: React.FC<RiskAssessmentDashboardProps> = ({ projectId }) => {
    const [alerts, setAlerts] = useState(true);
    const [isScanning, setIsScanning] = useState(false);

    const riskMetrics = useMemo(
        () => [
            {
                id: 'overall',
                name: 'Overall Risk Score',
                value: 67,
                trend: 'down',
                status: 'warning'
            },
            {
                id: 'critical',
                name: 'Critical Risks',
                value: 3,
                trend: 'up',
                status: 'critical'
            },
            {
                id: 'high',
                name: 'High Priority',
                value: 8,
                trend: 'up',
                status: 'critical'
            },
            {
                id: 'medium',
                name: 'Medium Priority',
                value: 15,
                trend: 'up',
                status: 'warning'
            },
            {
                id: 'low',
                name: 'Low Priority',
                value: 5,
                trend: 'stable',
                status: 'healthy'
            }
        ],
        []
    );

    const runRiskScan = useCallback(async () => {
        setIsScanning(true);
        setAlerts(true);

        // Simulate risk identification
        setTimeout(() => {
            // This would trigger the actual AI risk analysis
            setAlerts(false);
            setIsScanning(false);
        }, 1000);
    }, []);

    const getSeverityColor = (severity: number): string => {
        if (severity >= 80) return '#dc2626';
        if (severity >= 60) return '#f59e0b';
        if (severity >= 40) return '#f59e0b';
        if (severity >= 20) return '#ab308';
        return '#10b981';
    };

    const mockRiskFactors: RiskFactor[] = [
        {
            id: 'risk1',
            name: 'Schedule Delay Risk',
            category: 'schedule',
            probability: 75,
            impact: 'high',
            severity: 65,
            status: 'active',
            description: 'Risk of schedule delays due to resource constraints',
            mitigation: 'Reallocate resources and adjust timeline',
            owner: 'Project Manager',
            createdAt: new Date(),
            updatedAt: new Date()
        },
        {
            id: 'risk2',
            name: 'Resource Bottleneck',
            category: 'resource',
            probability: 60,
            impact: 'critical',
            severity: 80,
            status: 'active',
            description: 'Potential resource shortage in critical phase',
            mitigation: 'Cross-train team members and bring in contractors',
            owner: 'Resource Manager',
            createdAt: new Date(),
            updatedAt: new Date()
        },
        {
            id: 'risk3',
            name: 'Budget Overrun',
            category: 'financial',
            probability: 45,
            impact: 'medium',
            severity: 50,
            status: 'active',
            description: 'Risk of exceeding allocated budget',
            mitigation: 'Implement strict budget controls and regular reviews',
            owner: 'Finance Team',
            createdAt: new Date(),
            updatedAt: new Date()
        },
        {
            id: 'risk4',
            name: 'Safety Compliance',
            category: 'safety',
            probability: 30,
            impact: 'critical',
            severity: 75,
            status: 'active',
            description: 'New safety regulations may impact operations',
            mitigation: 'Update procedures and conduct training sessions',
            owner: 'Safety Officer',
            createdAt: new Date(),
            updatedAt: new Date()
        }
    ];

    const totalRisks = mockRiskFactors.length;

    return (
        <div className="risk-assessment-dashboard">
            <div className="dashboard-header">
                <h2>AI-Powered Risk Assessment</h2>
                <button className="analyze-btn" onClick={runRiskScan}>
                    {isScanning ? (
                        <>
                            <BarChart3 className="animate-spin" size={20} />
                            <span>Scanning...</span>
                        </>
                    ) : (
                        <>
                            <BrainCircuit size={20} />
                            <span>Run AI Analysis</span>
                        </>
                    )}
                </button>
            </div>

            {alerts && (
                <div className="alert-banner">
                    <div className="alert-content">
                        <AlertTriangle size={24} />
                        <h3>Risk Analysis Complete</h3>
                        <p>AI analysis identified 3 new critical risks requiring attention</p>
                    </div>
                    <button onClick={() => setAlerts(false)} className="dismiss-btn">
                        ×
                    </button>
                </div>
            )}

            <div className="risk-metrics-grid">
                {riskMetrics.map((metric) => (
                    <div key={metric.id} className={`metric-card ${metric.status}`}>
                        <h4>{metric.name}</h4>
                        <div className="metric-value">{metric.value}</div>
                        <div className="metric-trend">
                            <span className={`trend-indicator ${metric.trend}`}>
                                {metric.trend === 'up' && '↑'}
                                {metric.trend === 'down' && '↓'}
                                {metric.trend === 'stable' && '→'}
                            </span>
                            <span>
                                {metric.trend === 'up'
                                    ? '+2 this week'
                                    : metric.trend === 'down'
                                      ? '-1 this week'
                                      : 'Stable'}
                            </span>
                        </div>
                    </div>
                ))}
            </div>

            <div className="risk-factors-grid">
                {mockRiskFactors.map((factor) => (
                    <div key={factor.id} className="risk-factor-card">
                        <div className="factor-header">
                            <span className="category">{factor.category.toUpperCase()}</span>
                            <span className="severity" style={{ color: getSeverityColor(factor.severity) }}>
                                {factor.severity}
                            </span>
                        </div>
                        <h4>{factor.name}</h4>
                        <p>{factor.description}</p>
                        <div className="factor-meta">
                            <span>Owner: {factor.owner}</span>
                            <span>Impact: {factor.impact}</span>
                        </div>
                        <div className="factor-actions">
                            <button className="resolve-btn">Mark as Mitigated</button>
                            <button className="view-btn">View Details</button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default RiskAssessmentDashboard;
