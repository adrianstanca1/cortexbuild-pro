import React, { useState, useMemo } from 'react';
import { AlertTriangle, Activity, BarChart3, TrendingUp, Eye, RefreshCw, Download } from 'lucide-react';

interface RiskFactor {
    id: string;
    name: string;
    category: 'schedule' | 'resource' | 'technical' | 'environmental' | 'safety' | 'financial' | 'regulatory';
    probability: number;
    impact: 'low' | 'medium' | 'high' | 'critical';
    severity: number;
    description: string;
    mitigation?: string;
    owner?: string;
    dueDate?: Date;
    status: 'active' | 'mitigated' | 'resolved';
    createdAt: Date;
    updatedAt: Date;
    confidence?: number;
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
}

const PredictiveRiskEngine: React.FC = () => {
    const [riskFactors, setRiskFactors] = useState<RiskFactor[]>([
        {
            id: '1',
            name: 'Schedule Delay Risk',
            category: 'schedule',
            probability: 85,
            impact: 'high',
            severity: 75,
            description: 'Potential delay due to resource constraints and weather conditions',
            mitigation: 'Allocate additional resources and adjust timeline',
            owner: 'Project Manager',
            status: 'active',
            createdAt: new Date(),
            updatedAt: new Date(),
            confidence: 85
        },
        {
            id: '2',
            name: 'Budget Overrun',
            category: 'financial',
            probability: 60,
            impact: 'medium',
            severity: 55,
            description: 'Material cost increases may impact project budget',
            mitigation: 'Review supplier contracts and consider alternatives',
            owner: 'Finance Team',
            status: 'active',
            createdAt: new Date(),
            updatedAt: new Date(),
            confidence: 70
        },
        {
            id: '3',
            name: 'Safety Compliance',
            category: 'safety',
            probability: 45,
            impact: 'critical',
            severity: 80,
            description: 'New safety regulations require additional training',
            mitigation: 'Schedule compliance training and update procedures',
            owner: 'Safety Officer',
            status: 'active',
            createdAt: new Date(),
            updatedAt: new Date(),
            confidence: 90
        }
    ]);

    const [selectedRisk, setSelectedRisk] = useState<RiskFactor | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    const getRiskColor = (severity: number): string => {
        if (severity >= 80) return '#dc2626';
        if (severity >= 60) return '#f59e0b';
        if (severity >= 40) return '#eab308';
        if (severity >= 20) return '#84cc16';
        return '#10b981';
    };

    const getRiskTrendIcon = (trend: string): React.ReactElement => {
        switch (trend) {
            case 'up':
                return <TrendingUp size={16} className="trend-up" />;
            case 'down':
                return <TrendingUp size={16} className="trend-down rotate-180" />;
            default:
                return <Activity size={16} />;
        }
    };

    const calculateRiskScore = (risk: RiskFactor): number => {
        return Math.round((risk.probability * risk.severity) / 100);
    };

    const analyzeRisks = () => {
        setIsAnalyzing(true);
        setTimeout(() => {
            setIsAnalyzing(false);
        }, 2000);
    };

    const criticalRisks = riskFactors.filter((r) => r.severity >= 80).length;
    const highRisks = riskFactors.filter((r) => r.severity >= 60 && r.severity < 80).length;
    const mediumRisks = riskFactors.filter((r) => r.severity >= 40 && r.severity < 60).length;
    const lowRisks = riskFactors.filter((r) => r.severity < 40).length;

    return (
        <div className="predictive-risk-engine">
            {/* AI Analysis Header */}
            <div className="ai-header">
                <div className="ai-header-content">
                    <div className="ai-title">
                        <AlertTriangle size={24} className="ai-icon" />
                        <h3>🧠 AI-Powered Risk Analysis</h3>
                    </div>
                    <p>Real-time risk assessment with machine learning predictions</p>
                </div>

                <div className="ai-status">
                    <div className={`status-indicator ${isAnalyzing ? 'analyzing' : 'ready'}`}></div>
                    <span className="status-text">{isAnalyzing ? 'Analyzing...' : 'Ready'}</span>
                </div>
            </div>

            {/* AI Analysis Controls */}
            <div className="ai-controls">
                <button onClick={analyzeRisks} className="analyze-btn primary" disabled={isAnalyzing}>
                    {isAnalyzing ? (
                        <>
                            <RefreshCw size={16} className="animate-spin" />
                            Analyzing...
                        </>
                    ) : (
                        <>
                            <AlertTriangle size={16} />
                            Analyze Risks
                        </>
                    )}
                </button>

                <button className="models-btn secondary">
                    <BarChart3 size={16} />
                    Train Models
                </button>
            </div>

            {/* Risk Summary */}
            <div className="risk-summary">
                <div className="summary-header">
                    <h3>Risk Overview</h3>
                    <div className="risk-count critical">{criticalRisks}</div>
                </div>
                <p>{criticalRisks} critical risks identified requiring attention</p>

                <div className="risk-stats">
                    <div className="stat-item critical">
                        <span className="stat-number">{criticalRisks}</span>
                        <span className="stat-label">Critical</span>
                    </div>
                    <div className="stat-item high">
                        <span className="stat-number">{highRisks}</span>
                        <span className="stat-label">High</span>
                    </div>
                    <div className="stat-item medium">
                        <span className="stat-number">{mediumRisks}</span>
                        <span className="stat-label">Medium</span>
                    </div>
                    <div className="stat-item low">
                        <span className="stat-number">{lowRisks}</span>
                        <span className="stat-label">Low</span>
                    </div>
                    <div className="stat-item total">
                        <span className="stat-number">{riskFactors.length}</span>
                        <span className="stat-label">Total</span>
                    </div>
                </div>
            </div>

            {/* Risk Factors Grid */}
            <div className="risk-factors">
                {riskFactors.map((risk) => (
                    <div key={risk.id} className="risk-factor" onClick={() => setSelectedRisk(risk)}>
                        <div className="factor-category">
                            <span className={`category-badge ${risk.category}`}>
                                {risk.category.charAt(0).toUpperCase()}
                            </span>
                        </div>

                        <div className="factor-content">
                            <h4>{risk.name}</h4>
                            <div className="factor-risk">Risk Score: {calculateRiskScore(risk)}</div>
                            <p>{risk.description}</p>
                        </div>

                        <div className="factor-actions">
                            <button className="action-btn">
                                <Eye size={16} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* AI Insights */}
            <div className="ai-insights">
                <h3>🔍 AI Insights</h3>
                <ul>
                    <li>Top risk factors: schedule delays ({riskFactors[0]?.probability}% probability)</li>
                    <li>Resource bottlenecks detected in 3 projects</li>
                    <li>Weather sensitivity increasing safety risks by 40%</li>
                    <li>Budget variance alerts (45% accuracy)</li>
                    <li>Overall prediction accuracy: 85%</li>
                </ul>
            </div>

            {/* Risk Details Modal */}
            {selectedRisk && (
                <div className="risk-detail-modal">
                    <div className="modal-overlay" onClick={() => setSelectedRisk(null)}></div>
                    <div className="modal-content">
                        <div className="modal-header">
                            <h3>Risk Details: {selectedRisk.name}</h3>
                            <button className="close-btn" onClick={() => setSelectedRisk(null)}>
                                ×
                            </button>
                        </div>

                        <div className="modal-body">
                            <div className="detail-section">
                                <h4>Risk Assessment</h4>
                                <div className="detail-grid">
                                    <div className="detail-item">
                                        <label>Risk Score:</label>
                                        <span style={{ color: getRiskColor(selectedRisk.severity) }}>
                                            {calculateRiskScore(selectedRisk)}
                                        </span>
                                    </div>
                                    <div className="detail-item">
                                        <label>Category:</label>
                                        <span>{selectedRisk.category}</span>
                                    </div>
                                    <div className="detail-item">
                                        <label>Impact:</label>
                                        <span className={`impact-${selectedRisk.impact}`}>{selectedRisk.impact}</span>
                                    </div>
                                    <div className="detail-item">
                                        <label>Confidence:</label>
                                        <span>{selectedRisk.confidence}%</span>
                                    </div>
                                </div>
                            </div>

                            <div className="detail-section">
                                <h4>Description</h4>
                                <p>{selectedRisk.description}</p>
                            </div>

                            <div className="detail-section">
                                <h4>Mitigation Strategy</h4>
                                <p>{selectedRisk.mitigation || 'No mitigation strategy defined'}</p>
                                <div className="mitigation-owner">
                                    <strong>Owner:</strong> {selectedRisk.owner || 'Unassigned'}
                                </div>
                            </div>

                            <div className="detail-section">
                                <h4>Action Plan:</h4>
                                <div className="action-plan">
                                    <textarea
                                        defaultValue={`1. ${selectedRisk.mitigation}\n2. Assign to ${selectedRisk.owner}\n3. Monitor progress\n4. Review effectiveness`}
                                        rows={4}
                                        placeholder="Define action steps..."
                                    />
                                </div>
                                <div className="action-buttons">
                                    <button className="primary-btn">Save Plan</button>
                                    <button className="secondary-btn" onClick={() => setSelectedRisk(null)}>
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* AI Actions */}
            <div className="ai-actions">
                <button className="primary-btn" onClick={analyzeRisks}>
                    <RefreshCw size={20} />
                    Refresh Analysis
                </button>
                <button className="secondary-btn">
                    <Download size={16} />
                    Export Report
                </button>
            </div>

            <style>{`
                .predictive-risk-engine {
                    padding: 20px;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
                    background: #f8fafc;
                    min-height: 100vh;
                }

                .ai-header {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    padding: 24px;
                    border-radius: 12px;
                    margin-bottom: 24px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }

                .ai-header-content h3 {
                    margin: 0 0 8px 0;
                    font-size: 24px;
                    font-weight: 600;
                }

                .ai-title {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }

                .ai-icon {
                    color: #fbbf24;
                }

                .ai-header-content p {
                    margin: 0;
                    opacity: 0.9;
                }

                .ai-status {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }

                .status-indicator {
                    width: 12px;
                    height: 12px;
                    border-radius: 50%;
                    background: #10b981;
                }

                .status-indicator.analyzing {
                    background: #f59e0b;
                    animation: pulse 2s infinite;
                }

                .status-indicator.ready {
                    background: #10b981;
                }

                @keyframes pulse {
                    0%,
                    100% {
                        opacity: 1;
                    }
                    50% {
                        opacity: 0.5;
                    }
                }

                .ai-controls {
                    display: flex;
                    gap: 12px;
                    margin-bottom: 24px;
                }

                .analyze-btn.primary {
                    background: #3b82f6;
                    color: white;
                    border: none;
                    padding: 12px 24px;
                    border-radius: 8px;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    cursor: pointer;
                    font-weight: 500;
                    transition: all 0.2s;
                }

                .analyze-btn.primary:hover:not(:disabled) {
                    background: #2563eb;
                }

                .analyze-btn.primary:disabled {
                    opacity: 0.6;
                    cursor: not-allowed;
                }

                .models-btn.secondary {
                    background: #64748b;
                    color: white;
                    border: none;
                    padding: 12px 24px;
                    border-radius: 8px;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    cursor: pointer;
                    font-weight: 500;
                }

                .models-btn.secondary:hover {
                    background: #475569;
                }

                .risk-summary {
                    background: white;
                    padding: 24px;
                    border-radius: 12px;
                    margin-bottom: 24px;
                    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
                }

                .summary-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 12px;
                }

                .summary-header h3 {
                    margin: 0;
                    font-size: 20px;
                    font-weight: 600;
                }

                .risk-count {
                    font-size: 32px;
                    font-weight: bold;
                    color: #dc2626;
                }

                .risk-count.critical {
                    color: #dc2626;
                }

                .risk-stats {
                    display: flex;
                    gap: 20px;
                    margin-top: 16px;
                }

                .stat-item {
                    text-align: center;
                    padding: 16px;
                    border-radius: 8px;
                    background: #f8fafc;
                    min-width: 80px;
                }

                .stat-item.critical {
                    background: #fef2f2;
                }
                .stat-item.high {
                    background: #fff7ed;
                }
                .stat-item.medium {
                    background: #fefce8;
                }
                .stat-item.low {
                    background: #f0fdf4;
                }
                .stat-item.total {
                    background: #f0f9ff;
                }

                .stat-number {
                    display: block;
                    font-size: 24px;
                    font-weight: bold;
                    margin-bottom: 4px;
                }

                .stat-item.critical .stat-number {
                    color: #dc2626;
                }
                .stat-item.high .stat-number {
                    color: #ea580c;
                }
                .stat-item.medium .stat-number {
                    color: #ca8a04;
                }
                .stat-item.low .stat-number {
                    color: #16a34a;
                }
                .stat-item.total .stat-number {
                    color: #0369a1;
                }

                .stat-label {
                    font-size: 12px;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                    color: #64748b;
                }

                .risk-factors {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
                    gap: 16px;
                    margin-bottom: 24px;
                }

                .risk-factor {
                    background: white;
                    border: 1px solid #e2e8f0;
                    border-radius: 8px;
                    padding: 16px;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .risk-factor:hover {
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
                    transform: translateY(-2px);
                }

                .factor-category {
                    margin-bottom: 12px;
                }

                .category-badge {
                    display: inline-block;
                    padding: 4px 8px;
                    border-radius: 4px;
                    font-size: 12px;
                    font-weight: 600;
                    text-transform: uppercase;
                }

                .category-badge.schedule {
                    background: #dbeafe;
                    color: #1e40af;
                }
                .category-badge.financial {
                    background: #fef3c7;
                    color: #92400e;
                }
                .category-badge.safety {
                    background: #fee2e2;
                    color: #991b1b;
                }
                .category-badge.resource {
                    background: #d1fae5;
                    color: #065f46;
                }
                .category-badge.technical {
                    background: #ede9fe;
                    color: #5b21b6;
                }
                .category-badge.environmental {
                    background: #ecfdf5;
                    color: #047857;
                }
                .category-badge.regulatory {
                    background: #f3e8ff;
                    color: #6b21a8;
                }

                .factor-content h4 {
                    margin: 0 0 8px 0;
                    font-size: 16px;
                    font-weight: 600;
                }

                .factor-risk {
                    font-weight: 500;
                    margin-bottom: 8px;
                }

                .factor-content p {
                    margin: 0;
                    color: #64748b;
                    font-size: 14px;
                }

                .factor-actions {
                    margin-top: 12px;
                    text-align: right;
                }

                .action-btn {
                    background: #f1f5f9;
                    border: none;
                    padding: 6px;
                    border-radius: 4px;
                    cursor: pointer;
                    color: #64748b;
                }

                .action-btn:hover {
                    background: #e2e8f0;
                }

                .ai-insights {
                    background: white;
                    padding: 24px;
                    border-radius: 12px;
                    margin-bottom: 24px;
                    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
                }

                .ai-insights h3 {
                    margin: 0 0 16px 0;
                    font-size: 18px;
                    font-weight: 600;
                }

                .ai-insights ul {
                    margin: 0;
                    padding-left: 20px;
                }

                .ai-insights li {
                    margin-bottom: 8px;
                    color: #475569;
                }

                .risk-detail-modal {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    z-index: 1000;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .modal-overlay {
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0, 0, 0, 0.5);
                }

                .modal-content {
                    background: white;
                    border-radius: 12px;
                    width: 90%;
                    max-width: 600px;
                    max-height: 90vh;
                    overflow-y: auto;
                    position: relative;
                    z-index: 1;
                }

                .modal-header {
                    padding: 24px;
                    border-bottom: 1px solid #e2e8f0;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }

                .modal-header h3 {
                    margin: 0;
                    font-size: 20px;
                    font-weight: 600;
                }

                .close-btn {
                    background: none;
                    border: none;
                    font-size: 24px;
                    cursor: pointer;
                    color: #64748b;
                }

                .modal-body {
                    padding: 24px;
                }

                .detail-section {
                    margin-bottom: 24px;
                }

                .detail-section h4 {
                    margin: 0 0 12px 0;
                    font-size: 16px;
                    font-weight: 600;
                }

                .detail-grid {
                    display: grid;
                    grid-template-columns: repeat(2, 1fr);
                    gap: 12px;
                }

                .detail-item {
                    display: flex;
                    justify-content: space-between;
                }

                .detail-item label {
                    font-weight: 500;
                    color: #64748b;
                }

                .impact-low {
                    color: #16a34a;
                }
                .impact-medium {
                    color: #ca8a04;
                }
                .impact-high {
                    color: #ea580c;
                }
                .impact-critical {
                    color: #dc2626;
                }

                .mitigation-owner {
                    margin-top: 8px;
                    padding: 8px;
                    background: #f8fafc;
                    border-radius: 4px;
                }

                .action-plan textarea {
                    width: 100%;
                    padding: 12px;
                    border: 1px solid #d1d5db;
                    border-radius: 6px;
                    font-family: inherit;
                    resize: vertical;
                }

                .action-buttons {
                    display: flex;
                    gap: 12px;
                    margin-top: 16px;
                }

                .primary-btn {
                    background: #3b82f6;
                    color: white;
                    border: none;
                    padding: 10px 20px;
                    border-radius: 6px;
                    cursor: pointer;
                    font-weight: 500;
                }

                .primary-btn:hover {
                    background: #2563eb;
                }

                .secondary-btn {
                    background: #f1f5f9;
                    color: #64748b;
                    border: 1px solid #d1d5db;
                    padding: 10px 20px;
                    border-radius: 6px;
                    cursor: pointer;
                    font-weight: 500;
                }

                .secondary-btn:hover {
                    background: #e2e8f0;
                }

                .ai-actions {
                    display: flex;
                    gap: 12px;
                    justify-content: center;
                }

                .ai-actions .primary-btn,
                .ai-actions .secondary-btn {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }

                .animate-spin {
                    animation: spin 1s linear infinite;
                }

                @keyframes spin {
                    from {
                        transform: rotate(0deg);
                    }
                    to {
                        transform: rotate(360deg);
                    }
                }

                .rotate-180 {
                    transform: rotate(180deg);
                }
            `}</style>
        </div>
    );
};

export default PredictiveRiskEngine;
