// Resource Allocation Engine Component for Project Management
import React, { useState, useMemo } from 'react';
import {
    Users,
    TrendingUp,
    AlertTriangle,
    CheckCircle,
    Settings,
    BarChart3,
    Calendar,
    Clock,
    DollarSign,
    Zap,
    Target
} from 'lucide-react';
import './ResourceAllocationEngine.css';

export interface Resource {
    id: string;
    name: string;
    type: 'person' | 'equipment' | 'material';
    role?: string;
    skills?: string[];
    availability: number; // hours per week or quantity
    costPerHour: number;
    currentAllocation: number; // percentage
    efficiency: number; // percentage
    avatar?: string;
}

export interface ResourceTask {
    taskId: string;
    taskName: string;
    resourceType: 'person' | 'equipment' | 'material';
    requiredSkills: string[];
    requiredQuantity: number;
    estimatedHours: number;
    priority: 'low' | 'medium' | 'high' | 'critical';
    startDate: Date;
    endDate: Date;
}

export interface ResourceAllocation {
    id: string;
    resourceId: string;
    taskId: string;
    projectId: string;
    allocationPercentage: number;
    startDate: Date;
    endDate: Date;
    conflicts: string[];
}

export interface OptimizationSuggestion {
    id: string;
    type: 'reallocation' | 'hire' | 'outsource' | 'reschedule';
    description: string;
    confidence: number;
    impact: {
        timeSaved?: number;
        costSaved?: number;
        efficiencyGain?: number;
    };
    resourceId?: string;
    taskId?: string;
}

export interface ResourceAllocationEngineProps {
    projectId: string;
    resources: Resource[];
    tasks: ResourceTask[];
    allocations: ResourceAllocation[];
    onOptimizationApply?: (suggestion: OptimizationSuggestion) => void;
    onResourceAllocate?: (allocation: ResourceAllocation) => void;
    onResourceDeallocate?: (allocationId: string) => void;
}

type ViewMode = 'overview' | 'timeline' | 'optimization';

const ResourceAllocationEngine: React.FC<ResourceAllocationEngineProps> = ({
    projectId,
    resources,
    tasks,
    allocations,
    onOptimizationApply,
    onResourceAllocate,
    onResourceDeallocate
}) => {
    const [viewMode, setViewMode] = useState<ViewMode>('overview');
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    // Calculate resource utilization
    const resourceUtilization = useMemo(() => {
        return resources.map((resource) => {
            const resourceAllocations = allocations.filter((a) => a.resourceId === resource.id);
            const totalAllocated = resourceAllocations.reduce((sum, a) => sum + a.allocationPercentage, 0);
            const utilizationPercentage = Math.min((totalAllocated / resource.availability) * 100, 100);

            return {
                ...resource,
                utilizationPercentage,
                status:
                    utilizationPercentage > 90
                        ? ('over-allocated' as const)
                        : utilizationPercentage > 75
                          ? ('high-usage' as const)
                          : utilizationPercentage > 50
                            ? ('moderate-usage' as const)
                            : ('under-utilized' as const)
            };
        });
    }, [resources, allocations]);

    // Generate optimization suggestions
    const optimizationSuggestions = useMemo((): OptimizationSuggestion[] => {
        const suggestions: OptimizationSuggestion[] = [];

        // Find over-allocated resources
        resourceUtilization.forEach((resource) => {
            if (resource.status === 'over-allocated') {
                suggestions.push({
                    id: `reallocate-${resource.id}`,
                    type: 'reallocation',
                    description: `Reallocate tasks from ${resource.name} to reduce over-allocation`,
                    confidence: 85,
                    impact: {
                        efficiencyGain: 15,
                        timeSaved: 8
                    },
                    resourceId: resource.id
                });
            }
        });

        // Find under-utilized resources with relevant skills
        resourceUtilization.forEach((resource) => {
            if (resource.status === 'under-utilized' && resource.skills) {
                const matchingTasks = tasks.filter(
                    (task) =>
                        task.resourceType === resource.type &&
                        task.requiredSkills.some((skill) => resource.skills?.includes(skill))
                );

                if (matchingTasks.length > 0) {
                    suggestions.push({
                        id: `utilize-${resource.id}`,
                        type: 'reallocation',
                        description: `Assign ${matchingTasks.length} available tasks to ${resource.name}`,
                        confidence: 75,
                        impact: {
                            efficiencyGain: 20,
                            timeSaved: 12
                        },
                        resourceId: resource.id
                    });
                }
            }
        });

        return suggestions;
    }, [resourceUtilization, tasks]);

    // Perform AI analysis
    const performAnalysis = async () => {
        setIsAnalyzing(true);
        // Simulate AI analysis
        await new Promise((resolve) => setTimeout(resolve, 3000));
        setIsAnalyzing(false);
    };

    const getUtilizationColor = (percentage: number) => {
        if (percentage > 90) return '#dc2626';
        if (percentage > 75) return '#f59e0b';
        if (percentage > 50) return '#3b82f6';
        return '#10b981';
    };

    const renderOverview = () => (
        <div className="resource-overview">
            <div className="overview-header">
                <h3>Resource Overview</h3>
                <div className="analysis-actions">
                    <button className="analyze-btn" onClick={performAnalysis} disabled={isAnalyzing}>
                        <Zap size={16} />
                        {isAnalyzing ? 'Analyzing...' : 'AI Analysis'}
                    </button>
                    <button className="settings-btn">
                        <Settings size={16} />
                    </button>
                </div>
            </div>

            {/* Utilization Grid */}
            <div className="utilization-grid">
                {resourceUtilization.map((resource) => (
                    <div key={resource.id} className="resource-card">
                        <div className="resource-header">
                            <div className="resource-info">
                                <h4>{resource.name}</h4>
                                <span className="resource-type">{resource.type}</span>
                            </div>
                            <div className={`utilization-status ${resource.status}`}>
                                {Math.round(resource.utilizationPercentage)}%
                            </div>
                        </div>

                        <div className="utilization-bar">
                            <div
                                className="utilization-fill"
                                style={{
                                    width: `${resource.utilizationPercentage}%`,
                                    backgroundColor: getUtilizationColor(resource.utilizationPercentage)
                                }}
                            />
                        </div>

                        <div className="resource-metrics">
                            <div className="metric">
                                <label>Available:</label>
                                <span>{resource.availability}h/week</span>
                            </div>
                            <div className="metric">
                                <label>Cost:</label>
                                <span>${resource.costPerHour}/h</span>
                            </div>
                            <div className="metric">
                                <label>Efficiency:</label>
                                <span>{resource.efficiency}%</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Optimization Suggestions */}
            <div className="optimization-suggestions">
                <div className="suggestions-header">
                    <BarChart3 className="chart-icon" size={20} />
                    <h4>AI Optimization Suggestions</h4>
                </div>

                {optimizationSuggestions.length === 0 ? (
                    <div className="no-suggestions">
                        <CheckCircle size={48} />
                        <p>No optimization suggestions available</p>
                    </div>
                ) : (
                    optimizationSuggestions.map((suggestion) => (
                        <div key={suggestion.id} className="suggestion-card">
                            <div className="suggestion-type">
                                <span className={`type-badge ${suggestion.type}`}>{suggestion.type}</span>
                                <span className="confidence">{suggestion.confidence}% confidence</span>
                            </div>

                            <div className="suggestion-content">
                                <h5>{suggestion.description}</h5>

                                <div className="impact-metrics">
                                    {suggestion.impact.timeSaved && (
                                        <div className="metric positive">
                                            <Clock size={16} />
                                            {suggestion.impact.timeSaved}h saved
                                        </div>
                                    )}
                                    {suggestion.impact.costSaved && (
                                        <div className="metric positive">
                                            <DollarSign size={16} />${suggestion.impact.costSaved} saved
                                        </div>
                                    )}
                                    {suggestion.impact.efficiencyGain && (
                                        <div className="metric positive">
                                            <TrendingUp size={16} />+{suggestion.impact.efficiencyGain}% efficiency
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="suggestion-actions">
                                <button className="apply-btn" onClick={() => onOptimizationApply?.(suggestion)}>
                                    <Target size={16} />
                                    Apply Suggestion
                                </button>
                                <button className="dismiss-btn">Dismiss</button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Quick Stats */}
            <div className="quick-stats">
                <div className="stat-card">
                    <h4>Total Resources</h4>
                    <span className="stat-value">{resources.length}</span>
                </div>
                <div className="stat-card">
                    <h4>Active Allocations</h4>
                    <span className="stat-value">{allocations.length}</span>
                </div>
                <div className="stat-card">
                    <h4>Over-Allocated</h4>
                    <span className="stat-value">
                        {resourceUtilization.filter((r) => r.status === 'over-allocated').length}
                    </span>
                </div>
                <div className="stat-card">
                    <h4>Under-Utilized</h4>
                    <span className="stat-value">
                        {resourceUtilization.filter((r) => r.status === 'under-utilized').length}
                    </span>
                </div>
            </div>
        </div>
    );

    const renderTimeline = () => (
        <div className="resource-timeline">
            <div className="timeline-header">
                <h3>Resource Timeline</h3>
                <div className="timeline-controls">
                    <button className="settings-btn">
                        <Calendar size={16} />
                    </button>
                </div>
            </div>
            <div className="timeline-content">
                <div className="timeline-placeholder">
                    <Calendar size={48} />
                    <p>Resource timeline view coming soon</p>
                </div>
            </div>
        </div>
    );

    const renderOptimization = () => (
        <div className="optimization-view">
            <div className="overview-header">
                <h3>Advanced Optimization</h3>
            </div>
            <div className="timeline-placeholder">
                <Target size={48} />
                <p>Advanced optimization tools coming soon</p>
            </div>
        </div>
    );

    return (
        <div className="resource-allocation-engine">
            {/* View Mode Tabs */}
            <div className="view-tabs">
                <button className={viewMode === 'overview' ? 'active' : ''} onClick={() => setViewMode('overview')}>
                    <BarChart3 size={16} />
                    Overview
                </button>
                <button className={viewMode === 'timeline' ? 'active' : ''} onClick={() => setViewMode('timeline')}>
                    <Calendar size={16} />
                    Timeline
                </button>
                <button
                    className={viewMode === 'optimization' ? 'active' : ''}
                    onClick={() => setViewMode('optimization')}
                >
                    <Zap size={16} />
                    Optimization
                </button>
            </div>

            {/* View Content */}
            <div className="view-content">
                {viewMode === 'overview' && renderOverview()}
                {viewMode === 'timeline' && renderTimeline()}
                {viewMode === 'optimization' && renderOptimization()}
            </div>
        </div>
    );
};

export default ResourceAllocationEngine;
