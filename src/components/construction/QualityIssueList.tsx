import React from 'react';
import { AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { QualityIssue } from '../../services/constructionApi';

interface QualityIssueListProps {
    issues: QualityIssue[];
    onUpdate: () => void;
}

const QualityIssueList: React.FC<QualityIssueListProps> = ({ issues }) => {
    const getSeverityColor = (severity: QualityIssue['severity']) => {
        switch (severity) {
            case 'critical': return 'bg-red-100 text-red-800 border-red-200';
            case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
            case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            case 'low': return 'bg-blue-100 text-blue-800 border-blue-200';
            default: return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    const getStatusIcon = (status: QualityIssue['status']) => {
        switch (status) {
            case 'resolved': return <CheckCircle className="h-5 w-5 text-green-600" />;
            case 'in_progress': return <Clock className="h-5 w-5 text-yellow-600" />;
            default: return <AlertTriangle className="h-5 w-5 text-red-600" />;
        }
    };

    return (
        <div className="space-y-4">
            {issues.map((issue) => (
                <div key={issue.id} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <div className="flex items-start justify-between mb-4">
                        <div className="flex items-start gap-3">
                            {getStatusIcon(issue.status)}
                            <div>
                                <h3 className="font-semibold text-gray-900">{issue.description}</h3>
                                <p className="text-sm text-gray-600 mt-1">
                                    Location: {issue.location} • Assigned to: {issue.assignedTo}
                                </p>
                            </div>
                        </div>
                        <div className={`px-3 py-1 rounded-full text-xs font-medium border ${getSeverityColor(issue.severity)}`}>
                            {issue.severity.toUpperCase()}
                        </div>
                    </div>

                    <div className="flex items-center gap-2 text-sm">
                        <span className={`px-2 py-1 rounded ${issue.status === 'resolved' ? 'bg-green-100 text-green-700' :
                                issue.status === 'in_progress' ? 'bg-yellow-100 text-yellow-700' :
                                    'bg-gray-100 text-gray-700'
                            }`}>
                            {issue.status.replace('_', ' ').toUpperCase()}
                        </span>
                        <span className="text-gray-500">•</span>
                        <span className="text-gray-600">
                            Created {new Date(issue.createdAt).toLocaleDateString()}
                        </span>
                    </div>
                </div>
            ))}

            {issues.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                    No quality issues found
                </div>
            )}
        </div>
    );
};

export default QualityIssueList;
