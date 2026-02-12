import React, { useState, useEffect, useMemo } from 'react';
import {
    Calendar,
    BarChart3,
    Users,
    GanttChartSquare,
    Kanban,
    BrainCircuit,
    Settings,
    TrendingUp,
    Filter,
    AlertTriangle,
    Target,
    Zap,
    Clock,
    ArrowRight
} from 'lucide-react';
import GanttChart, { GanttTask } from '@/components/projectManagement/GanttChart';
import KanbanBoard, { KanbanTask } from '@/components/projectManagement/KanbanBoard';
import ResourceAllocationEngine from '@/components/projectManagement/ResourceAllocationEngine';
import { useProjects } from '@/contexts/ProjectContext';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import './EnhancedProjectManagementView.css';

interface EnhancedProjectManagementViewProps {
    projectId?: string;
}

type ViewMode = 'gantt' | 'kanban' | 'resources' | 'combined' | 'analytics';

const EnhancedProjectManagementView: React.FC<EnhancedProjectManagementViewProps> = ({ projectId }) => {
    const { projects, updateProject } = useProjects();
    const { user } = useAuth();
    const { addToast } = useToast();

    const [viewMode, setViewMode] = useState<ViewMode>('combined');
    const [showAdvancedFeatures, setShowAdvancedFeatures] = useState(false);
    const [autoOptimize, setAutoOptimize] = useState(false);

    const handleTaskUpdate = async (taskId: string, updates: any) => {
        addToast(`Task ${taskId} updated`, 'info');
        console.debug('[Gantt] Task update', taskId, updates);
    };

    const handleTaskDependencyAdd = async (taskId: string, dependencyId: string) => {
        addToast(`Added dependency ${dependencyId} to ${taskId}`, 'success');
        console.debug('[Gantt] Dependency add', taskId, dependencyId);
    };

    const handleResourceAssign = async (taskId: string, resourceId: string) => {
        addToast(`Assigned resource ${resourceId} to ${taskId}`, 'success');
        console.debug('[Gantt] Resource assign', taskId, resourceId);
    };

    const handleKanbanTaskUpdate = async (taskId: string, payload: any) => {
        addToast(`Kanban task ${taskId} updated`, 'info');
        console.debug('[Kanban] Update', taskId, payload);
    };

    const handleKanbanTaskMove = async (taskId: string, newStatus: KanbanTask['status']) => {
        addToast(`Moved task ${taskId} to ${newStatus}`, 'success');
        console.debug('[Kanban] Move', taskId, newStatus);
    };

    const handleKanbanTaskCreate = async (status: KanbanTask['status']) => {
        addToast(`Created task with status ${status}`, 'success');
        console.debug('[Kanban] Create', status);
    };

    // Get current project data
    const currentProject = useMemo(() => {
        if (!projectId) return null;
        return projects.find((p) => p.id === projectId) || null;
    }, [projectId, projects]);

    // Mock data for demonstration
    const baseTasks = useMemo(
        () => [
            {
                id: '1',
                title: 'Foundation Excavation',
                start: new Date('2024-01-10'),
                end: new Date('2024-01-20'),
                progress: 75,
                priority: 'high' as const,
                assignees: ['John Smith'],
                status: 'in-progress' as const,
                estimatedHours: 80,
                actualHours: 60,
                dependencies: [],
                attachments: 3,
                comments: 5
            },
            {
                id: '2',
                title: 'Structural Steel Installation',
                start: new Date('2024-01-15'),
                end: new Date('2024-02-05'),
                progress: 30,
                priority: 'medium' as const,
                assignees: ['Mike Johnson'],
                status: 'not-started' as const,
                estimatedHours: 120,
                actualHours: 0,
                dependencies: ['1'],
                attachments: 1,
                comments: 2
            },
            {
                id: '3',
                title: 'Interior Electrical Work',
                start: new Date('2024-02-01'),
                end: new Date('2024-02-15'),
                progress: 0,
                priority: 'medium' as const,
                assignees: ['Sarah Chen'],
                status: 'not-started' as const,
                estimatedHours: 60,
                actualHours: 0,
                dependencies: ['2'],
                attachments: 0,
                comments: 0
            }
        ],
        []
    );

    // Transform tasks for different components
    const ganttTasks: GanttTask[] = useMemo(
        () =>
            baseTasks.map(
                (task) =>
                    ({
                        id: task.id,
                        title: task.title,
                        start: task.start,
                        end: task.end,
                        progress: task.progress,
                        dependencies: task.dependencies,
                        assignees: task.assignees,
                        priority: task.priority,
                        status:
                            task.status === 'not-started'
                                ? 'not-started'
                                : task.status === 'in-progress'
                                  ? 'in-progress'
                                  : 'completed',
                        budget: task.estimatedHours * 50, // mock hourly rate
                        actualCost: task.actualHours * 50
                    }) as GanttTask
            ),
        [baseTasks]
    );

    const kanbanTasks: KanbanTask[] = useMemo(
        () =>
            baseTasks.map(
                (task) =>
                    ({
                        id: task.id,
                        title: task.title,
                        description: `Task for ${task.title}`,
                        status:
                            task.status === 'not-started'
                                ? 'todo'
                                : task.status === 'in-progress'
                                  ? 'in-progress'
                                  : 'done',
                        priority: task.priority,
                        assignees: task.assignees,
                        assignee: task.assignees[0],
                        assigneeId: task.assignees[0],
                        dueDate: task.end,
                        estimatedHours: task.estimatedHours,
                        actualHours: task.actualHours,
                        tags: [task.priority],
                        dependencies: task.dependencies,
                        attachments: task.attachments > 0 ? [`attachment-${task.attachments}`] : [],
                        comments:
                            task.comments > 0
                                ? [
                                      {
                                          id: `comment-${task.comments}`,
                                          taskId: task.id,
                                          userId: '1',
                                          userName: 'User',
                                          content: 'Comment',
                                          createdAt: new Date(),
                                          updatedAt: new Date()
                                      }
                                  ]
                                : [],
                        projectId: projectId || 'demo',
                        blocked: false,
                        createdAt: new Date(),
                        updatedAt: new Date()
                    }) as KanbanTask
            ),
        [baseTasks, projectId]
    );

    const mockResources = useMemo(
        () => [
            {
                id: 'r1',
                name: 'John Smith',
                type: 'person' as const,
                role: 'Site Manager',
                skills: ['Project Management', 'Construction', 'Safety'],
                availability: 40, // hours per week
                costPerHour: 85,
                currentAllocation: 60,
                efficiency: 92,
                avatar: '/avatars/john.jpg'
            },
            {
                id: 'r2',
                name: 'Excavator Team',
                type: 'equipment' as const,
                availability: 80,
                costPerHour: 150,
                currentAllocation: 70,
                efficiency: 88
            },
            {
                id: 'r3',
                name: 'Steel Materials',
                type: 'material' as const,
                availability: 1000, // kg
                costPerHour: 5, // per kg
                currentAllocation: 800,
                efficiency: 95
            }
        ],
        []
    );

    const mockAllocations = useMemo(
        () => [
            {
                id: 'a1',
                resourceId: 'r1',
                taskId: '1',
                projectId: projectId || 'proj1',
                allocationPercentage: 75,
                startDate: new Date('2024-01-10'),
                endDate: new Date('2024-01-20'),
                conflicts: []
            }
        ],
        []
    );

    // Calculate project metrics
    const projectMetrics = useMemo(() => {
        if (!currentProject) return null;

        const totalTasks = baseTasks.length;
        const completedTasks = baseTasks.filter((t) => t.status === 'not-started').length;
        const inProgressTasks = baseTasks.filter((t) => t.status === 'in-progress').length;
        const totalBudget = 500000; // mock
        const actualCost = 275000; // mock
        const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

        return {
            totalTasks,
            completedTasks,
            inProgressTasks,
            completionRate,
            totalBudget,
            actualCost,
            budgetUtilization: totalBudget > 0 ? Math.round((actualCost / totalBudget) * 100) : 0,
            estimatedCompletion: new Date('2024-03-01'),
            daysRemaining: Math.ceil((new Date('2024-03-01').getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
        };
    }, [baseTasks, currentProject]);

    const handleViewModeChange = (mode: ViewMode) => {
        setViewMode(mode);
        addToast(`Switched to ${mode} view`, 'info');
    };

    const handleAutoOptimize = () => {
        setAutoOptimize(true);
        // Simulate AI optimization
        setTimeout(() => {
            setAutoOptimize(false);
            addToast('AI optimization completed - Resources allocated optimally', 'success');
        }, 3000);
    };

    const renderViewModeSelector = () => (
        <div className="view-mode-selector">
            <h3>Project Management Views</h3>
            <div className="view-buttons">
                <button className={viewMode === 'gantt' ? 'active' : ''} onClick={() => handleViewModeChange('gantt')}>
                    <GanttChartSquare size={20} />
                    <span>Gantt Chart</span>
                </button>
                <button
                    className={viewMode === 'kanban' ? 'active' : ''}
                    onClick={() => handleViewModeChange('kanban')}
                >
                    <Kanban size={20} />
                    <span>Kanban Board</span>
                </button>
                <button
                    className={viewMode === 'resources' ? 'active' : ''}
                    onClick={() => handleViewModeChange('resources')}
                >
                    <Users size={20} />
                    <span>Resources</span>
                </button>
                <button
                    className={viewMode === 'combined' ? 'active' : ''}
                    onClick={() => handleViewModeChange('combined')}
                >
                    <BarChart3 size={20} />
                    <span>Combined View</span>
                </button>
                <button
                    className={viewMode === 'analytics' ? 'active' : ''}
                    onClick={() => handleViewModeChange('analytics')}
                >
                    <TrendingUp size={20} />
                    <span>Analytics</span>
                </button>
            </div>

            <div className="advanced-controls">
                <label className="toggle-switch">
                    <input
                        type="checkbox"
                        checked={showAdvancedFeatures}
                        onChange={(e) => setShowAdvancedFeatures(e.target.checked)}
                    />
                    <span>Advanced Features</span>
                </label>

                <button onClick={handleAutoOptimize} disabled={autoOptimize} className="optimize-btn">
                    {autoOptimize ? (
                        <>
                            <div className="spinner" />
                            Optimizing...
                        </>
                    ) : (
                        <>
                            <BrainCircuit size={16} />
                            AI Optimize
                        </>
                    )}
                </button>
            </div>
        </div>
    );

    const renderProjectMetrics = () => (
        <div className="project-metrics">
            <h3>Project Performance</h3>
            {projectMetrics && (
                <div className="metrics-grid">
                    <div className="metric-card">
                        <div className="metric-icon">
                            <Target size={24} />
                        </div>
                        <div className="metric-data">
                            <h4>{projectMetrics.completionRate}%</h4>
                            <span>Completion Rate</span>
                            <p>
                                {projectMetrics.completedTasks} / {projectMetrics.totalTasks} tasks
                            </p>
                        </div>
                    </div>

                    <div className="metric-card">
                        <div className="metric-icon">
                            <TrendingUp size={24} />
                        </div>
                        <div className="metric-data">
                            <h4>{projectMetrics.daysRemaining}</h4>
                            <span>Days Remaining</span>
                            <p>Est. {projectMetrics.estimatedCompletion.toLocaleDateString()}</p>
                        </div>
                    </div>

                    <div className="metric-card">
                        <div className="metric-icon budget">
                            <div
                                className="budget-fill"
                                style={{
                                    width: `${projectMetrics.budgetUtilization}%`
                                }}
                            />
                        </div>
                        <div className="metric-data">
                            <h4>{projectMetrics.budgetUtilization}%</h4>
                            <span>Budget Used</span>
                            <p>
                                ${projectMetrics.actualCost.toLocaleString()} / $
                                {projectMetrics.totalBudget.toLocaleString()}
                            </p>
                        </div>
                    </div>

                    <div className="metric-card">
                        <div className="metric-icon">
                            <Zap size={24} />
                        </div>
                        <div className="metric-data">
                            <h4>{projectMetrics.inProgressTasks}</h4>
                            <span>In Progress</span>
                            <p>Active tasks</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );

    const renderCombinedView = () => (
        <div className="combined-view">
            <div className="view-header">
                <h2>Advanced Project Management</h2>
                <div className="view-info">
                    <span className="project-name">{currentProject?.name || 'All Projects'}</span>
                    <div className="status-indicators">
                        <div className="indicator active"></div>
                        <span>Real-time sync enabled</span>
                    </div>
                </div>
            </div>

            <div className="combined-content">
                {/* Top Section: Gantt + Key Metrics */}
                <div className="top-section">
                    <div className="gantt-section">
                        <GanttChart
                            projectId={projectId || 'demo'}
                            tasks={ganttTasks}
                            resources={mockResources}
                            viewMode="gantt"
                            zoomLevel="week"
                            onTaskUpdate={handleTaskUpdate}
                            onTaskDependencyAdd={handleTaskDependencyAdd}
                            onResourceAssign={handleResourceAssign}
                        />
                    </div>

                    <div className="metrics-sidebar">{renderProjectMetrics()}</div>
                </div>

                {/* Bottom Section: Kanban + Resource Allocation */}
                <div className="bottom-section">
                    <div className="kanban-section">
                        <div className="section-header">
                            <Kanban size={18} />
                            <h3>Task Management</h3>
                            <span>Drag & Drop Workflow</span>
                        </div>
                        <KanbanBoard
                            projectId={projectId || 'demo'}
                            tasks={kanbanTasks}
                            teamMembers={[
                                { id: 'r1', name: 'John Smith', role: 'Manager' },
                                { id: 'r2', name: 'Mike Johnson', role: 'Worker' },
                                { id: 'r3', name: 'Sarah Chen', role: 'Electrician' }
                            ]}
                            currentUser={{ id: 'user1', name: 'Current User', role: 'Admin' }}
                            onTaskUpdate={handleKanbanTaskUpdate}
                            onTaskMove={handleKanbanTaskMove}
                            onTaskCreate={handleKanbanTaskCreate}
                        />
                    </div>

                    <div className="resource-section">
                        <div className="section-header">
                            <Users size={18} />
                            <h3>Resource Allocation</h3>
                            <span>AI-Optimized Assignment</span>
                        </div>
                        <ResourceAllocationEngine
                            projectId={projectId || 'demo'}
                            resources={mockResources}
                            tasks={baseTasks.map((t) => ({
                                taskId: t.id,
                                taskName: t.title,
                                resourceType: 'person' as const,
                                requiredSkills: [],
                                requiredQuantity: 1,
                                estimatedHours: t.estimatedHours || 0,
                                priority: t.priority,
                                startDate: t.start,
                                endDate: t.end
                            }))}
                            allocations={mockAllocations}
                            onOptimizationApply={(suggestion) => {
                                addToast(`Applied optimization: ${suggestion.description}`, 'success');
                            }}
                            onResourceAllocate={(allocation) => {
                                addToast(`Resource allocated: ${allocation.resourceId}`, 'info');
                            }}
                            onResourceDeallocate={(allocationId) => {
                                addToast(`Resource deallocated: ${allocationId}`, 'info');
                            }}
                        />
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <div className="enhanced-project-management">
            {/* View Mode Selector */}
            {renderViewModeSelector()}

            {/* Main Content Based on View Mode */}
            {viewMode === 'combined' && renderCombinedView()}
            {viewMode === 'gantt' && (
                <div className="single-view">
                    <GanttChart
                        projectId={projectId || 'demo'}
                        tasks={ganttTasks}
                        resources={mockResources}
                        viewMode="gantt"
                        zoomLevel="week"
                        onTaskUpdate={handleTaskUpdate}
                        onTaskDependencyAdd={handleTaskDependencyAdd}
                        onResourceAssign={handleResourceAssign}
                    />
                </div>
            )}
            {viewMode === 'kanban' && (
                <div className="single-view">
                    <KanbanBoard
                        projectId={projectId || 'demo'}
                        tasks={kanbanTasks}
                        teamMembers={[
                            { id: 'r1', name: 'John Smith', role: 'Manager' },
                            { id: 'r2', name: 'Mike Johnson', role: 'Worker' },
                            { id: 'r3', name: 'Sarah Chen', role: 'Electrician' }
                        ]}
                        currentUser={{ id: 'user1', name: 'Current User', role: 'Admin' }}
                        onTaskUpdate={handleKanbanTaskUpdate}
                        onTaskMove={handleKanbanTaskMove}
                        onTaskCreate={handleKanbanTaskCreate}
                    />
                </div>
            )}
            {viewMode === 'resources' && (
                <div className="single-view">
                    <ResourceAllocationEngine
                        projectId={projectId || 'demo'}
                        resources={mockResources}
                        tasks={baseTasks.map((t) => ({
                            taskId: t.id,
                            taskName: t.title,
                            resourceType: 'person' as const,
                            requiredSkills: [],
                            requiredQuantity: 1,
                            estimatedHours: t.estimatedHours || 0,
                            priority: t.priority,
                            startDate: t.start,
                            endDate: t.end
                        }))}
                        allocations={mockAllocations}
                        onOptimizationApply={(suggestion) => {
                            addToast(`Applied optimization: ${suggestion.description}`, 'success');
                        }}
                        onResourceAllocate={(allocation) => {
                            addToast(`Resource allocated: ${allocation.resourceId}`, 'info');
                        }}
                        onResourceDeallocate={(allocationId) => {
                            addToast(`Resource deallocated: ${allocationId}`, 'info');
                        }}
                    />
                </div>
            )}
            {viewMode === 'analytics' && renderProjectMetrics()}

            {/* Advanced Features Panel */}
            {showAdvancedFeatures && (
                <div className="advanced-features-panel">
                    <div className="features-header">
                        <Settings size={20} />
                        <h3>Advanced Features</h3>
                        <button onClick={() => setShowAdvancedFeatures(false)}>×</button>
                    </div>

                    <div className="features-content">
                        <div className="feature-group">
                            <h4>AI-Powered Automation</h4>
                            <div className="feature-item">
                                <BrainCircuit size={16} />
                                <span>Smart Task Scheduling</span>
                                <button className="feature-toggle" />
                            </div>
                            <div className="feature-item">
                                <Zap size={16} />
                                <span>Risk Prediction</span>
                                <button className="feature-toggle" />
                            </div>
                        </div>

                        <div className="feature-group">
                            <h4>Collaboration Tools</h4>
                            <div className="feature-item">
                                <AlertTriangle size={16} />
                                <span>Conflict Resolution</span>
                                <button className="feature-toggle" />
                            </div>
                            <div className="feature-item">
                                <Clock size={16} />
                                <span>Time Tracking</span>
                                <button className="feature-toggle" />
                            </div>
                        </div>

                        <div className="feature-group">
                            <h4>Integration Hub</h4>
                            <div className="feature-item">
                                <ArrowRight size={16} />
                                <span>API Connections</span>
                                <button className="feature-toggle" />
                            </div>
                            <div className="feature-item">
                                <Filter size={16} />
                                <span>Custom Workflows</span>
                                <button className="feature-toggle" />
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EnhancedProjectManagementView;
