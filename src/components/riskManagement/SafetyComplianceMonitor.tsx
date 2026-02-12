import React from 'react';
import './SafetyComplianceMonitor.css';

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
    score: number;
}

interface SafetyIncident {
    id: string;
    type: 'injury' | 'near-miss' | 'property-damage' | 'environmental';
    severity: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    location: string;
    date: Date;
    reportedBy: string;
    resolved: boolean;
    actions: string[];
}

const SafetyComplianceMonitor: React.FC = () => {
    const [activeTab, setActiveTab] = React.useState<'compliance' | 'incidents' | 'training'>('compliance');

    const complianceStandards: ComplianceStandard[] = [
        {
            id: '1',
            name: 'OSHA General Industry',
            category: 'safety',
            requirement: 'All safety protocols and documentation',
            status: 'compliant',
            lastAudit: new Date('2024-12-01'),
            nextAudit: new Date('2025-03-01'),
            owner: 'Safety Manager',
            score: 95
        },
        {
            id: '2',
            name: 'EPA Environmental Compliance',
            category: 'environmental',
            requirement: 'Environmental protection and waste management',
            status: 'warning',
            lastAudit: new Date('2024-11-15'),
            nextAudit: new Date('2025-02-15'),
            owner: 'Environmental Officer',
            score: 78
        },
        {
            id: '3',
            name: 'ISO 9001 Quality Management',
            category: 'quality',
            requirement: 'Quality control and process management',
            status: 'compliant',
            lastAudit: new Date('2024-10-20'),
            nextAudit: new Date('2025-01-20'),
            owner: 'Quality Manager',
            score: 88
        }
    ];

    const safetyIncidents: SafetyIncident[] = [
        {
            id: '1',
            type: 'near-miss',
            severity: 'medium',
            description: 'Falling debris near work zone',
            location: 'Building A - Floor 3',
            date: new Date('2024-12-28'),
            reportedBy: 'John Smith',
            resolved: false,
            actions: ['Install protective barriers', 'Safety briefing scheduled']
        },
        {
            id: '2',
            type: 'injury',
            severity: 'low',
            description: 'Minor cut while handling materials',
            location: 'Warehouse - Loading Dock',
            date: new Date('2024-12-22'),
            reportedBy: 'Mike Johnson',
            resolved: true,
            actions: ['First aid provided', 'PPE training refreshed']
        }
    ];

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'compliant':
                return '#10b981';
            case 'warning':
                return '#f59e0b';
            case 'non-compliant':
                return '#ef4444';
            default:
                return '#6b7280';
        }
    };

    const getSeverityColor = (severity: string) => {
        switch (severity) {
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

    return (
        <div className="safety-compliance-monitor">
            <div className="monitor-header">
                <h2>⚠️ Safety & Compliance Monitor</h2>
                <p>Real-time safety tracking and regulatory compliance management</p>
            </div>

            <div className="tab-navigation">
                <button
                    className={`tab ${activeTab === 'compliance' ? 'active' : ''}`}
                    onClick={() => setActiveTab('compliance')}
                >
                    📋 Compliance
                </button>
                <button
                    className={`tab ${activeTab === 'incidents' ? 'active' : ''}`}
                    onClick={() => setActiveTab('incidents')}
                >
                    🚨 Incidents
                </button>
                <button
                    className={`tab ${activeTab === 'training' ? 'active' : ''}`}
                    onClick={() => setActiveTab('training')}
                >
                    🎓 Training
                </button>
            </div>

            <div className="content-area">
                {activeTab === 'compliance' && (
                    <div className="compliance-content">
                        <h3>Regulatory Compliance Status</h3>
                        <div className="compliance-grid">
                            {complianceStandards.map((standard) => (
                                <div key={standard.id} className="compliance-card">
                                    <div className="card-header">
                                        <h4>{standard.name}</h4>
                                        <span
                                            className="status-badge"
                                            style={{ backgroundColor: getStatusColor(standard.status) }}
                                        >
                                            {standard.status.toUpperCase()}
                                        </span>
                                    </div>
                                    <div className="card-content">
                                        <p>{standard.requirement}</p>
                                        <div className="compliance-metrics">
                                            <div className="metric">
                                                <span className="label">Score:</span>
                                                <span className="value">{standard.score}%</span>
                                            </div>
                                            <div className="metric">
                                                <span className="label">Owner:</span>
                                                <span className="value">{standard.owner}</span>
                                            </div>
                                            <div className="metric">
                                                <span className="label">Next Audit:</span>
                                                <span className="value">
                                                    {standard.nextAudit?.toLocaleDateString()}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === 'incidents' && (
                    <div className="incidents-content">
                        <h3>Safety Incident Tracking</h3>
                        <div className="incidents-grid">
                            {safetyIncidents.map((incident) => (
                                <div key={incident.id} className="incident-card">
                                    <div className="card-header">
                                        <h4>{incident.type.replace('-', ' ').toUpperCase()}</h4>
                                        <span
                                            className="severity-badge"
                                            style={{ backgroundColor: getSeverityColor(incident.severity) }}
                                        >
                                            {incident.severity.toUpperCase()}
                                        </span>
                                    </div>
                                    <div className="card-content">
                                        <p>{incident.description}</p>
                                        <div className="incident-details">
                                            <div className="detail">
                                                <span className="label">Location:</span>
                                                <span className="value">{incident.location}</span>
                                            </div>
                                            <div className="detail">
                                                <span className="label">Date:</span>
                                                <span className="value">{incident.date.toLocaleDateString()}</span>
                                            </div>
                                            <div className="detail">
                                                <span className="label">Reported By:</span>
                                                <span className="value">{incident.reportedBy}</span>
                                            </div>
                                        </div>
                                        {incident.actions.length > 0 && (
                                            <div className="actions-list">
                                                <h5>Actions Taken:</h5>
                                                <ul>
                                                    {incident.actions.map((action, index) => (
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
                )}

                {activeTab === 'training' && (
                    <div className="training-content">
                        <h3>Safety Training Programs</h3>
                        <div className="training-grid">
                            <div className="training-card">
                                <h4>OSHA 10-Hour Construction</h4>
                                <div className="training-status">
                                    <span className="status completed">Completed: 85%</span>
                                    <span className="due-date">Due: Jan 15, 2025</span>
                                </div>
                                <div className="progress-bar">
                                    <div className="progress" style={{ width: '85%' }}></div>
                                </div>
                            </div>
                            <div className="training-card">
                                <h4>Fall Protection Training</h4>
                                <div className="training-status">
                                    <span className="status in-progress">In Progress: 60%</span>
                                    <span className="due-date">Due: Jan 20, 2025</span>
                                </div>
                                <div className="progress-bar">
                                    <div className="progress" style={{ width: '60%' }}></div>
                                </div>
                            </div>
                            <div className="training-card">
                                <h4>Environmental Safety</h4>
                                <div className="training-status">
                                    <span className="status pending">Scheduled: Jan 25, 2025</span>
                                    <span className="participants">Participants: 25</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SafetyComplianceMonitor;
