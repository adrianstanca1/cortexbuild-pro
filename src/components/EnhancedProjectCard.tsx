import React, { useState } from 'react';
import {
    MapPin, Calendar, Users, CheckSquare, Activity, Briefcase,
    AlertTriangle, Sparkles, BrainCircuit, Archive, Clock, Tag,
    TrendingUp, AlertCircle, WifiOff, Wifi
} from 'lucide-react';
import { Project } from '@/types';
import { useWebSocket } from '@/contexts/WebSocketContext';
import { Can } from '@/components/Can';

interface EnhancedProjectCardProps {
    project: Project;
    onSelect?: (projectId: string) => void;
    onEdit?: (project: Project) => void;
    onArchive?: (project: Project) => void;
    onDelete?: (project: Project) => void;
    photoCount?: number;
    showArchived?: boolean;
}

export const EnhancedProjectCard: React.FC<EnhancedProjectCardProps> = ({
    project,
    onSelect,
    onEdit,
    onArchive,
    onDelete,
    photoCount = 0,
    showArchived = false
}) => {
    const { isConnected } = useWebSocket();
    const [isHovered, setIsHovered] = useState(false);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Active': return 'bg-green-100 text-green-700';
            case 'Planning': return 'bg-blue-100 text-blue-700';
            case 'Delayed': return 'bg-red-100 text-red-700';
            case 'Completed': return 'bg-gray-100 text-gray-700';
            case 'On Hold': return 'bg-yellow-100 text-yellow-700';
            default: return 'bg-zinc-100 text-zinc-600';
        }
    };

    const getHealthColor = (health: string) => {
        switch (health) {
            case 'Good': return 'text-green-600';
            case 'At Risk': return 'text-yellow-600';
            case 'Critical': return 'text-red-600';
            default: return 'text-zinc-400';
        }
    };

    const getPriorityColor = (priority?: string) => {
        switch (priority) {
            case 'high': return 'bg-red-50 text-red-700 border-red-200';
            case 'medium': return 'bg-yellow-50 text-yellow-700 border-yellow-200';
            case 'low': return 'bg-blue-50 text-blue-700 border-blue-200';
            default: return 'bg-zinc-50 text-zinc-600 border-zinc-200';
        }
    };

    const getRiskScoreColor = (score?: number) => {
        if (!score) return 'bg-zinc-100';
        if (score < 30) return 'bg-green-500';
        if (score < 60) return 'bg-yellow-500';
        return 'bg-red-500';
    };

    const progressColor = project.health === 'At Risk' || project.health === 'Critical'
        ? 'bg-red-500'
        : project.health === 'Good'
            ? 'bg-green-500'
            : 'bg-yellow-500';

    const budgetPercentage = project.budget > 0 ? (project.spent / project.budget) * 100 : 0;
    const isOverBudget = budgetPercentage > 100;

    return (
        <div
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onClick={() => onSelect && onSelect(project.id)}
            className={`bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm hover:shadow-lg hover:border-blue-200 transition-all cursor-pointer group flex flex-col h-full relative ${project.archived ? 'opacity-70' : ''
                }`}
        >
            {/* Real-time Connection Indicator */}
            <div className="absolute top-4 right-4 z-10">
                {isConnected ? (
                    <div className="flex items-center gap-1 text-[10px] text-green-600 bg-green-50 px-2 py-1 rounded-full">
                        <Wifi size={10} />
                        <span className="font-medium">Live</span>
                    </div>
                ) : (
                    <div className="flex items-center gap-1 text-[10px] text-zinc-400 bg-zinc-50 px-2 py-1 rounded-full">
                        <WifiOff size={10} />
                    </div>
                )}
            </div>

            {/* Header */}
            <div className="flex justify-between items-start mb-4 pr-16">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-zinc-100 rounded-xl overflow-hidden border border-zinc-200 flex items-center justify-center">
                        {project.image ? (
                            <img src={project.image} alt={project.name} className="w-full h-full object-cover" />
                        ) : (
                            <Briefcase size={20} className="text-zinc-400" />
                        )}
                    </div>
                    <div className="flex-1">
                        <div className="flex items-center gap-2">
                            <h3 className="font-bold text-zinc-900 leading-tight line-clamp-1 group-hover:text-[#0f5c82] transition-colors">
                                {project.name}
                            </h3>
                            {project.archived && (
                                <Archive size={14} className="text-zinc-400" />
                            )}
                        </div>
                        <p className="text-xs text-zinc-500 mt-0.5 flex items-center gap-1">
                            <MapPin size={10} /> {project.location}
                        </p>
                        {project.code && (
                            <p className="text-[10px] text-zinc-400 mt-0.5 font-mono">
                                {project.code}
                            </p>
                        )}
                    </div>
                </div>
            </div>

            {/* Tags & Priority Row */}
            <div className="flex flex-wrap gap-2 mb-3">
                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${getStatusColor(project.status)}`}>
                    {project.status}
                </span>
                {project.priority && (
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase border ${getPriorityColor(project.priority)}`}>
                        {project.priority}
                    </span>
                )}
                {project.tags && project.tags.slice(0, 2).map((tag, idx) => (
                    <span key={idx} className="flex items-center gap-1 px-2 py-1 bg-indigo-50 text-indigo-700 rounded-full text-[10px] font-medium">
                        <Tag size={10} />
                        {tag}
                    </span>
                ))}
                {project.tags && project.tags.length > 2 && (
                    <span className="px-2 py-1 bg-zinc-100 text-zinc-600 rounded-full text-[10px] font-medium">
                        +{project.tags.length - 2}
                    </span>
                )}
            </div>

            {/* Description */}
            <div className="mb-4 flex-1">
                <p className="text-sm text-zinc-600 line-clamp-2">
                    {project.aiExecutiveSummary || project.description}
                </p>

                {/* Risk Score */}
                {typeof project.riskScore === 'number' && project.riskScore >= 0 && (
                    <div className="mt-2 flex items-center gap-2 text-xs">
                        <span className="text-zinc-500">Risk Score:</span>
                        <div className="flex-1 max-w-[100px] bg-zinc-100 h-2 rounded-full overflow-hidden">
                            <div
                                className={`h-full ${getRiskScoreColor(project.riskScore)} transition-all`}
                                style={{ width: `${project.riskScore}%` }}
                            />
                        </div>
                        <span className={`font-bold ${project.riskScore > 60 ? 'text-red-600' : project.riskScore > 30 ? 'text-yellow-600' : 'text-green-600'}`}>
                            {project.riskScore}%
                        </span>
                    </div>
                )}

                {/* AI Optimizations Badge */}
                {(project.timelineOptimizations || []).length > 0 && (
                    <div className="mt-2 flex items-center gap-2 text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-lg w-fit">
                        <Sparkles size={12} />
                        {(project.timelineOptimizations || []).length} AI Optimizations
                    </div>
                )}
            </div>

            {/* Progress Bar */}
            <div className="space-y-3 mb-4">
                <div className="flex justify-between text-xs text-zinc-500 mb-1">
                    <span>Progress</span>
                    <span className="font-bold text-zinc-700">{project.progress}%</span>
                </div>
                <div className="w-full bg-zinc-100 h-2 rounded-full overflow-hidden">
                    <div
                        className={`h-full rounded-full ${progressColor} transition-all`}
                        style={{ width: `${project.progress}%` }}
                    />
                </div>
            </div>

            {/* Budget & Team Info */}
            <div className="grid grid-cols-2 gap-4 py-4 border-t border-zinc-100">
                <div>
                    <div className="text-[10px] text-zinc-400 uppercase font-bold">Manager</div>
                    <div className="text-sm font-medium text-zinc-800 flex items-center gap-1.5 mt-0.5">
                        <div className="w-5 h-5 bg-[#0f5c82] rounded-full text-white text-[8px] flex items-center justify-center">
                            {(project.manager || 'U').split(' ').map(n => n[0]).join('')}
                        </div>
                        {project.manager || 'Unassigned'}
                    </div>
                </div>
                <div>
                    <div className="text-[10px] text-zinc-400 uppercase font-bold">Timeline</div>
                    <div className="text-sm font-medium text-zinc-800 flex items-center gap-1.5 mt-0.5">
                        <Calendar size={12} className="text-zinc-400" />
                        {new Date(project.endDate).toLocaleDateString(undefined, { month: 'short', year: '2-digit' })}
                    </div>
                </div>
            </div>

            {/* Budget Warning */}
            {isOverBudget && (
                <div className="mb-3 flex items-center gap-2 text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg border border-red-200">
                    <AlertTriangle size={14} className="flex-shrink-0" />
                    <span className="font-medium">Over budget by ${((project.spent - project.budget) / 1000).toFixed(0)}k</span>
                </div>
            )}

            {/* Active Collaborators */}
            {project.activeCollaborators && project.activeCollaborators.length > 0 && (
                <div className="mb-3 flex items-center gap-2 text-xs text-emerald-600 bg-emerald-50 px-3 py-2 rounded-lg">
                    <Users size={14} className="flex-shrink-0" />
                    <span className="font-medium">
                        {project.activeCollaborators.length} active {project.activeCollaborators.length === 1 ? 'collaborator' : 'collaborators'}
                    </span>
                </div>
            )}

            {/* AI Analysis */}
            {project.aiAnalysis && (
                <div className="mb-4 px-3 py-2 bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-100 rounded-lg flex items-start gap-2">
                    <BrainCircuit size={14} className="text-indigo-500 mt-0.5 flex-shrink-0" />
                    <p className="text-[10px] text-zinc-600 leading-snug">
                        <span className="font-bold text-indigo-700">AI Insight:</span> {project.aiAnalysis}
                    </p>
                </div>
            )}

            {/* Last Activity */}
            {project.lastActivity && (
                <div className="text-[10px] text-zinc-400 flex items-center gap-1 mb-3">
                    <Clock size={10} />
                    Last activity: {new Date(project.lastActivity).toLocaleDateString()}
                </div>
            )}

            {/* Quick Action Buttons (Visible on Hover) */}
            {isHovered && (
                <div className="absolute bottom-6 left-6 right-6 flex gap-2 transition-all duration-300 z-30">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            if (onSelect) onSelect(project.id);
                        }}
                        className="flex-1 py-2.5 bg-zinc-50 hover:bg-zinc-100 text-zinc-700 text-[10px] font-bold rounded-lg transition-colors border border-zinc-200 flex items-center justify-center gap-1.5 shadow-sm"
                    >
                        <CheckSquare size={14} className="text-zinc-400" /> Tasks
                    </button>
                    <Can permission="projects.update">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                if (onEdit) onEdit(project);
                            }}
                            className="flex-1 py-2.5 bg-white border border-zinc-200 hover:border-[#0f5c82] hover:text-[#0f5c82] text-zinc-600 text-[10px] font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                        >
                            <Activity size={14} /> Status
                        </button>
                    </Can>
                    <Can permission="projects.update">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                if (onArchive) onArchive(project);
                            }}
                            className="py-2.5 px-3 bg-white border border-zinc-200 hover:border-orange-500 hover:text-orange-600 text-zinc-600 text-[10px] font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                            title={project.archived ? 'Unarchive project' : 'Archive project'}
                        >
                            <Archive size={14} />
                        </button>
                    </Can>
                </div>
            )}
        </div>
    );
};
