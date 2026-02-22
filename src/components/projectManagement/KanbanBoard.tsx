import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import update from 'immutability-helper';
import KanbanCard, { TaskComment } from '@/components/projectManagement/KanbanCard';
import { Plus, MoreVertical, Users, Calendar, Clock, AlertTriangle, Filter, Search, SortAsc } from 'lucide-react';
import './KanbanBoard.css';

export interface KanbanTask {
    id: string;
    title: string;
    description: string;
    status: 'todo' | 'in-progress' | 'review' | 'done';
    priority: 'low' | 'medium' | 'high' | 'critical';
    assignee?: string;
    assigneeId?: string;
    assignees: string[];
    dueDate?: Date;
    estimatedHours?: number;
    actualHours?: number;
    tags: string[];
    dependencies: string[];
    attachments: string[];
    comments: TaskComment[];
    projectId: string;
    phase?: string;
    blocked: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export interface KanbanColumn {
    id: string;
    title: string;
    status: KanbanTask['status'];
    tasks: KanbanTask[];
    wipLimit: number;
    color: string;
}

export interface KanbanBoardProps {
    projectId: string;
    tasks: KanbanTask[];
    onTaskUpdate: (taskId: string, updates: Partial<KanbanTask>) => void;
    onTaskMove: (taskId: string, newStatus: KanbanTask['status']) => void;
    onTaskCreate: (status: KanbanTask['status']) => void;
    teamMembers: Array<{ id: string; name: string; avatar?: string; role: string }>;
    currentUser: { id: string; name: string; role: string };
}

// Draggable Card Component
const DraggableCard: React.FC<{ task: KanbanTask; index: number }> = ({ task, index }) => {
    const [{ isDragging }, drag] = useDrag({
        type: 'task',
        item: { id: task.id, status: task.status },
        collect: (monitor) => ({
            isDragging: monitor.isDragging()
        })
    });

    return (
        <div ref={drag as any} style={{ opacity: isDragging ? 0.5 : 1 }} className="kanban-card-container">
            <KanbanCard task={task} />
        </div>
    );
};

// Droppable Column Component
const DroppableColumn: React.FC<{
    column: KanbanColumn;
    onDrop: (taskId: string, newStatus: KanbanTask['status']) => void;
    onTaskCreate: (status: KanbanTask['status']) => void;
    teamMembers: KanbanBoardProps['teamMembers'];
}> = ({ column, onDrop, onTaskCreate, teamMembers }) => {
    const [{ isOver }, dropRef] = useDrop({
        accept: 'task',
        drop: (item: { id: string; status: KanbanTask['status'] }) => {
            if (item.status !== column.status) {
                onDrop(item.id, column.status);
            }
        },
        collect: (monitor) => ({
            isOver: monitor.isOver()
        })
    });

    const getAssigneeInfo = (assigneeId?: string) => {
        if (!assigneeId) return null;
        return teamMembers.find((member) => member.id === assigneeId);
    };

    const getPriorityColor = (priority: KanbanTask['priority']) => {
        switch (priority) {
            case 'critical':
                return '#dc2626';
            case 'high':
                return '#f59e0b';
            case 'medium':
                return '#3b82f6';
            case 'low':
                return '#10b981';
            default:
                return '#6b7280';
        }
    };

    const isOverLimit = column.tasks.length >= column.wipLimit;

    return (
        <div
            ref={dropRef as any}
            className={`kanban-column ${isOver ? 'drag-over' : ''} ${isOverLimit ? 'over-limit' : ''}`}
        >
            <div className="column-header">
                <div className="column-title">
                    <div className="status-indicator" style={{ backgroundColor: column.color }} />
                    <h3>{column.title}</h3>
                    <span className="task-count">
                        {column.tasks.length}/{column.wipLimit}
                    </span>
                </div>

                <div className="column-actions">
                    <button className="icon-btn" title="Add Task">
                        <Plus
                            size={16}
                            onClick={() => {
                                // Add task action
                                onTaskCreate(column.status);
                            }}
                        />
                    </button>
                    <button className="icon-btn" title="Column Settings">
                        <MoreVertical size={16} />
                    </button>
                </div>
            </div>

            {isOverLimit && (
                <div className="wip-warning">
                    <AlertTriangle size={14} />
                    <span>WIP Limit Exceeded</span>
                </div>
            )}

            <div className="tasks-container">
                {column.tasks.map((task, index) => (
                    <div key={task.id} className="kanban-task-wrapper">
                        <DraggableCard task={task} index={index} />

                        {/* Task Meta Info */}
                        <div className="task-meta">
                            {task.assigneeId && (
                                <div className="assignee-avatar">
                                    {getAssigneeInfo(task.assigneeId)?.avatar ? (
                                        <img
                                            src={getAssigneeInfo(task.assigneeId)?.avatar}
                                            alt={getAssigneeInfo(task.assigneeId)?.name}
                                        />
                                    ) : (
                                        <div className="avatar-placeholder">
                                            {getAssigneeInfo(task.assigneeId)?.name?.charAt(0) || 'U'}
                                        </div>
                                    )}
                                </div>
                            )}

                            {task.dueDate && (
                                <div className={`due-date ${new Date(task.dueDate) < new Date() ? 'overdue' : ''}`}>
                                    <Calendar size={12} />
                                    <span>{new Date(task.dueDate).toLocaleDateString()}</span>
                                </div>
                            )}

                            {task.priority && (
                                <div
                                    className="priority-indicator"
                                    style={{ backgroundColor: getPriorityColor(task.priority) }}
                                />
                            )}
                        </div>

                        {/* Task Stats */}
                        <div className="task-stats">
                            {task.comments && task.comments.length > 0 && (
                                <div className="stat-item">
                                    <span className="stat-count">{task.comments.length}</span>
                                </div>
                            )}
                            {task.attachments && task.attachments.length > 0 && (
                                <div className="stat-item">
                                    <span className="stat-count">{task.attachments.length}</span>
                                </div>
                            )}
                            {task.estimatedHours && (
                                <div className="time-tracking">
                                    <Clock size={12} />
                                    <span>
                                        {task.actualHours || 0}h / {task.estimatedHours}h
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            <div className="column-footer">
                <button
                    className="add-task-btn"
                    onClick={() => {
                        // Add task to this column
                        onTaskCreate(column.status);
                    }}
                >
                    <Plus size={16} />
                    <span>Add Task</span>
                </button>
            </div>
        </div>
    );
};

// Main Kanban Board Component
const KanbanBoard: React.FC<KanbanBoardProps> = ({
    projectId,
    tasks,
    onTaskUpdate,
    onTaskMove,
    onTaskCreate,
    teamMembers,
    currentUser
}) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [filterAssignee, setFilterAssignee] = useState<string>('all');
    const [filterPriority, setFilterPriority] = useState<string>('all');
    const [sortBy, setSortBy] = useState<string>('priority');
    const [showFilters, setShowFilters] = useState(false);

    // Organize tasks into columns
    const organizeTasksIntoColumns = useCallback(() => {
        const columns: KanbanColumn[] = [
            {
                id: 'todo',
                title: 'To Do',
                status: 'todo',
                tasks: [],
                wipLimit: 10,
                color: '#6b7280'
            },
            {
                id: 'in-progress',
                title: 'In Progress',
                status: 'in-progress',
                tasks: [],
                wipLimit: 5,
                color: '#3b82f6'
            },
            {
                id: 'review',
                title: 'Review',
                status: 'review',
                tasks: [],
                wipLimit: 3,
                color: '#f59e0b'
            },
            {
                id: 'done',
                title: 'Done',
                status: 'done',
                tasks: [],
                wipLimit: 20,
                color: '#10b981'
            }
        ];

        // Filter tasks
        let filteredTasks = tasks.filter((task) => {
            if (searchQuery && !task.title.toLowerCase().includes(searchQuery.toLowerCase())) {
                return false;
            }

            if (filterAssignee !== 'all' && task.assigneeId !== filterAssignee) {
                return false;
            }

            if (filterPriority !== 'all' && task.priority !== filterPriority) {
                return false;
            }

            return true;
        });

        // Sort tasks
        filteredTasks.sort((a, b) => {
            switch (sortBy) {
                case 'priority': {
                    const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
                    return priorityOrder[a.priority] - priorityOrder[b.priority];
                }
                case 'dueDate':
                    return (a.dueDate?.getTime() || 0) - (b.dueDate?.getTime() || 0);
                case 'title':
                    return a.title.localeCompare(b.title);
                case 'createdAt':
                    return b.createdAt.getTime() - a.createdAt.getTime();
                default:
                    return 0;
            }
        });

        // Organize into columns
        filteredTasks.forEach((task) => {
            const column = columns.find((col) => col.status === task.status);
            if (column) {
                column.tasks.push(task);
            }
        });

        return columns;
    }, [tasks, searchQuery, filterAssignee, filterPriority, sortBy]);

    const [columns, setColumns] = useState<KanbanColumn[]>(organizeTasksIntoColumns);

    // Update columns when tasks or filters change
    useEffect(() => {
        setColumns(organizeTasksIntoColumns());
    }, [organizeTasksIntoColumns]);

    const handleTaskMove = useCallback(
        (taskId: string, newStatus: KanbanTask['status']) => {
            onTaskMove(taskId, newStatus);
        },
        [onTaskMove]
    );

    const handleQuickTaskCreate = useCallback(
        (status: KanbanTask['status']) => {
            onTaskCreate(status);
        },
        [onTaskCreate]
    );

    // Calculate board statistics
    const boardStats = useMemo(() => {
        const totalTasks = tasks.length;
        const completedTasks = tasks.filter((t) => t.status === 'done').length;
        const inProgressTasks = tasks.filter((t) => t.status === 'in-progress').length;
        const overdueTasks = tasks.filter(
            (t) => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'done'
        ).length;

        return {
            totalTasks,
            completedTasks,
            inProgressTasks,
            overdueTasks,
            completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
        };
    }, [tasks]);

    return (
        <DndProvider backend={HTML5Backend}>
            <div className="kanban-board">
                {/* Board Header */}
                <div className="kanban-header">
                    <div className="header-left">
                        <h2>Project Kanban Board</h2>
                        <div className="board-stats">
                            <div className="stat">
                                <span className="stat-value">{boardStats.totalTasks}</span>
                                <span className="stat-label">Total</span>
                            </div>
                            <div className="stat">
                                <span className="stat-value">{boardStats.inProgressTasks}</span>
                                <span className="stat-label">In Progress</span>
                            </div>
                            <div className="stat">
                                <span className="stat-value">{boardStats.completedTasks}</span>
                                <span className="stat-label">Completed</span>
                            </div>
                            <div className="stat overdue">
                                <span className="stat-value">{boardStats.overdueTasks}</span>
                                <span className="stat-label">Overdue</span>
                            </div>
                        </div>
                    </div>

                    <div className="header-right">
                        {/* Search */}
                        <div className="search-container">
                            <Search size={16} className="search-icon" />
                            <input
                                type="text"
                                placeholder="Search tasks..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="search-input"
                            />
                        </div>

                        {/* Filters Toggle */}
                        <button
                            className={`filter-toggle ${showFilters ? 'active' : ''}`}
                            onClick={() => setShowFilters(!showFilters)}
                        >
                            <Filter size={16} />
                            <span>Filters</span>
                        </button>
                    </div>
                </div>

                {/* Filters Panel */}
                {showFilters && (
                    <div className="filters-panel">
                        <div className="filter-group">
                            <label>Assignee:</label>
                            <select value={filterAssignee} onChange={(e) => setFilterAssignee(e.target.value)}>
                                <option value="all">All Team Members</option>
                                {teamMembers.map((member) => (
                                    <option key={member.id} value={member.id}>
                                        {member.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="filter-group">
                            <label>Priority:</label>
                            <select value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)}>
                                <option value="all">All Priorities</option>
                                <option value="critical">Critical</option>
                                <option value="high">High</option>
                                <option value="medium">Medium</option>
                                <option value="low">Low</option>
                            </select>
                        </div>

                        <div className="filter-group">
                            <label>Sort By:</label>
                            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                                <option value="priority">Priority</option>
                                <option value="dueDate">Due Date</option>
                                <option value="title">Title</option>
                                <option value="createdAt">Created Date</option>
                            </select>
                        </div>
                    </div>
                )}

                {/* Progress Bar */}
                <div className="progress-section">
                    <div className="progress-bar">
                        <div className="progress-fill" style={{ width: `${boardStats.completionRate}%` }} />
                    </div>
                    <span className="progress-text">{boardStats.completionRate}% Complete</span>
                </div>

                {/* Kanban Columns */}
                <div className="kanban-columns">
                    {columns.map((column) => (
                        <DroppableColumn
                            key={column.id}
                            column={column}
                            onDrop={handleTaskMove}
                            onTaskCreate={handleQuickTaskCreate}
                            teamMembers={teamMembers}
                        />
                    ))}
                </div>

                {/* Floating Action Button */}
                <button className="fab" onClick={() => handleQuickTaskCreate('todo')}>
                    <Plus size={24} />
                </button>
            </div>
        </DndProvider>
    );
};

export default KanbanBoard;
