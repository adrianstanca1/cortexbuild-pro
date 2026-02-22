import React, { useState, useEffect } from 'react';
import { Brain, TrendingUp, AlertTriangle, Activity, BarChart3, RefreshCw } from 'lucide-react';
import './PredictiveAnalyticsEngine.css';

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

interface PredictionModel {
    id: string;
    name: string;
    type: 'schedule' | 'budget' | 'quality' | 'safety';
    accuracy: number;
    confidence: number;
    status: 'training' | 'ready' | 'deployed';
    lastUpdated: Date;
    nextPrediction: Date;
}

interface AIInsight {
    id: string;
    type: 'warning' | 'recommendation' | 'opportunity';
    title: string;
    description: string;
    impact: 'low' | 'medium' | 'high' | 'critical';
    confidence: number;
    suggestedActions: string[];
}

const PredictiveAnalyticsEngine: React.FC = () => {
    const [isLoading, setIsLoading] = useState(true);
    const [selectedModel, setSelectedModel] = useState<string | null>(null);
    const [riskTrends, setRiskTrends] = useState<RiskTrend[]>([]);
    const [models, setModels] = useState<PredictionModel[]>([]);
    const [insights, setInsights] = useState<AIInsight[]>([]);

    useEffect(() => {
        // Simulate data loading
        setTimeout(() => {
            const mockTrends: RiskTrend[] = Array.from({ length: 30 }, (_, i) => ({
                date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000),
                overallRiskScore: Math.max(20, Math.min(95, 65 + Math.sin(i / 5) * 15 + Math.random() * 10)),
                criticalRisks: Math.floor(Math.random() * 5),
                highRisks: Math.floor(Math.random() * 8) + 2,
                mediumRisks: Math.floor(Math.random() * 12) + 5,
                lowRisks: Math.floor(Math.random() * 15) + 8,
                resolvedRisks: Math.floor(Math.random() * 10),
                totalRisks: Math.floor(Math.random() * 20) + 15
            }));

            const mockModels: PredictionModel[] = [
                {
                    id: 'schedule-predictor',
                    name: 'Schedule Forecast Model',
                    type: 'schedule',
                    accuracy: 92,
                    confidence: 88,
                    status: 'deployed',
                    lastUpdated: new Date(),
                    nextPrediction: new Date(Date.now() + 60 * 60 * 1000)
                },
                {
                    id: 'budget-predictor',
                    name: 'Budget Variance Model',
                    type: 'budget',
                    accuracy: 87,
                    confidence: 82,
                    status: 'deployed',
                    lastUpdated: new Date(),
                    nextPrediction: new Date(Date.now() + 30 * 60 * 1000)
                },
                {
                    id: 'quality-predictor',
                    name: 'Quality Assessment Model',
                    type: 'quality',
                    accuracy: 94,
                    confidence: 91,
                    status: 'deployed',
                    lastUpdated: new Date(),
                    nextPrediction: new Date(Date.now() + 45 * 60 * 1000)
                },
                {
                    id: 'safety-predictor',
                    name: 'Safety Incident Predictor',
                    type: 'safety',
                    accuracy: 86,
                    confidence: 79,
                    status: 'training',
                    lastUpdated: new Date(),
                    nextPrediction: new Date(Date.now() + 90 * 60 * 1000)
                }
            ];

            const mockInsights: AIInsight[] = [
                {
                    id: '1',
                    type: 'warning',
                    title: 'Schedule Risk Increasing',
                    description:
                        'Machine learning model detects 75% probability of schedule delay in Project A due to weather patterns',
                    impact: 'high',
                    confidence: 78,
                    suggestedActions: [
                        'Review critical path dependencies',
                        'Prepare contingency resources',
                        'Update weather monitoring protocols'
                    ]
                },
                {
                    id: '2',
                    type: 'recommendation',
                    title: 'Resource Optimization Opportunity',
                    description:
                        'AI analysis suggests reallocating 3 workers from Project C to Project B for optimal efficiency',
                    impact: 'medium',
                    confidence: 85,
                    suggestedActions: [
                        'Evaluate current resource allocation',
                        'Review project dependencies',
                        'Coordinate with team managers'
                    ]
                }
            ];

            setRiskTrends(mockTrends);
            setModels(mockModels);
            setInsights(mockInsights);
            setIsLoading(false);
        }, 2000);
    }, []);

    const getTrendDirection = (trend: RiskTrend[]): 'improving' | 'stable' | 'declining' | 'volatile' => {
        if (trend.length < 7) return 'stable';

        const recent = trend.slice(-7);
        const scores = recent.map((t) => t.overallRiskScore);
        const avgChange = scores[scores.length - 1] - scores[0];

        if (Math.abs(avgChange) < 5) return 'stable';
        if (avgChange > 10) return 'declining';
        if (avgChange < -10) return 'improving';
        return 'volatile';
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'training':
                return '#f59e0b';
            case 'ready':
                return '#3b82f6';
            case 'deployed':
                return '#10b981';
            default:
                return '#6b7280';
        }
    };

    const getImpactColor = (impact: string) => {
        switch (impact) {
            case 'low':
                return '#10b981';
            case 'medium':
                return '#f59e0b';
            case 'high':
                return '#f97316';
            case 'critical':
                return '#ef4444';
            default:
                return '#6b7280';
        }
    };

    if (isLoading) {
        return (
            <div className="predictive-analytics-engine">
                <div className="loading-state">
                    <Brain className="animate-pulse" size={48} />
                    <h3>Initializing AI Predictive Engine</h3>
                    <p>Training models and analyzing project data...</p>
                </div>
            </div>
        );
    }

    const trendDirection = getTrendDirection(riskTrends);

    return (
        <div className="predictive-analytics-engine">
            <div className="engine-header">
                <h2>🧠 Predictive Analytics Engine</h2>
                <p>AI-powered risk forecasting and predictive insights for project optimization</p>
            </div>

            <div className="analytics-overview">
                <div className="overview-card">
                    <div className="card-icon">
                        <TrendingUp />
                    </div>
                    <div className="card-content">
                        <h4>Risk Trend</h4>
                        <span className="trend-indicator" data-trend={trendDirection}>
                            {trendDirection.toUpperCase()}
                        </span>
                    </div>
                </div>

                <div className="overview-card">
                    <div className="card-icon">
                        <Brain />
                    </div>
                    <div className="card-content">
                        <h4>Active Models</h4>
                        <span className="model-count">
                            {models.filter((m) => m.status === 'deployed').length}/{models.length}
                        </span>
                    </div>
                </div>

                <div className="overview-card">
                    <div className="card-icon">
                        <AlertTriangle />
                    </div>
                    <div className="card-content">
                        <h4>Active Insights</h4>
                        <span className="insight-count">{insights.filter((i) => i.type === 'warning').length}</span>
                    </div>
                </div>
            </div>

            <div className="models-section">
                <div className="section-header">
                    <h3>Prediction Models</h3>
                    <button className="refresh-btn">
                        <RefreshCw size={16} />
                        Refresh
                    </button>
                </div>

                <div className="models-grid">
                    {models.map((model) => (
                        <div
                            key={model.id}
                            className={`model-card ${selectedModel === model.id ? 'selected' : ''}`}
                            onClick={() => setSelectedModel(model.id)}
                        >
                            <div className="model-header">
                                <h4>{model.name}</h4>
                                <span
                                    className="status-badge"
                                    style={{ backgroundColor: getStatusColor(model.status) }}
                                >
                                    {model.status.toUpperCase()}
                                </span>
                            </div>
                            <div className="model-metrics">
                                <div className="metric">
                                    <span className="label">Accuracy</span>
                                    <span className="value">{model.accuracy}%</span>
                                </div>
                                <div className="metric">
                                    <span className="label">Confidence</span>
                                    <span className="value">{model.confidence}%</span>
                                </div>
                                <div className="metric">
                                    <span className="label">Type</span>
                                    <span className="value">{model.type}</span>
                                </div>
                            </div>
                            <div className="model-timeline">
                                <div className="timeline-item">
                                    <span className="label">Last Updated</span>
                                    <span className="value">{model.lastUpdated.toLocaleDateString()}</span>
                                </div>
                                <div className="timeline-item">
                                    <span className="label">Next Prediction</span>
                                    <span className="value">{model.nextPrediction.toLocaleDateString()}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="insights-section">
                <div className="section-header">
                    <h3>AI Insights & Recommendations</h3>
                </div>

                <div className="insights-grid">
                    {insights.map((insight) => (
                        <div key={insight.id} className="insight-card">
                            <div className="insight-header">
                                <div className="insight-type">
                                    {insight.type === 'warning' && <AlertTriangle size={20} />}
                                    {insight.type === 'recommendation' && <Activity size={20} />}
                                    {insight.type === 'opportunity' && <TrendingUp size={20} />}
                                </div>
                                <h4>{insight.title}</h4>
                                <div className="insight-meta">
                                    <span
                                        className="impact-badge"
                                        style={{ backgroundColor: getImpactColor(insight.impact) }}
                                    >
                                        {insight.impact.toUpperCase()}
                                    </span>
                                    <span className="confidence">Confidence: {insight.confidence}%</span>
                                </div>
                            </div>
                            <div className="insight-content">
                                <p>{insight.description}</p>
                                {insight.suggestedActions.length > 0 && (
                                    <div className="suggested-actions">
                                        <h5>Recommended Actions:</h5>
                                        <ul>
                                            {insight.suggestedActions.map((action, index) => (
                                                <li key={index}>{action}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default PredictiveAnalyticsEngine;
