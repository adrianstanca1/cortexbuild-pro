// Gantt Chart Component for Project Management
import React, { useState, useMemo } from 'react';
import { Calendar, Clock, Users } from 'lucide-react';

export type GanttTask = {
    id: string;
    title: string;
    start: Date;
    end: Date;
    progress: number;
    dependencies: string[];
    assignees?: string[];
    status: 'not-started' | 'in-progress' | 'completed' | 'delayed' | 'cancelled';
    priority: 'low' | 'medium' | 'high' | 'critical';
    color?: string;
    budget?: number;
    actualCost?: number;
};

export interface GanttChartProps {
    projectId?: string;
    tasks: GanttTask[];
    resources?: any[];
    viewMode?: string;
    zoomLevel?: string;
    onTaskUpdate?: (taskId: string, updates: any) => void;
    onTaskDependencyAdd?: (taskId: string, dependencyId: string) => void;
    onResourceAssign?: (taskId: string, resourceId: string) => void;
}

export type GanttView = {
    id: string;
    name: string;
    type: 'day' | 'week' | 'month';
    fromDate: Date;
    toDate: Date;
};

const GanttChart: React.FC<GanttChartProps> = ({
    tasks,
    projectId,
    resources = [],
    viewMode = 'gantt',
    zoomLevel = 'week',
    onTaskUpdate,
    onTaskDependencyAdd,
    onResourceAssign
}) => {
    const [view, setView] = useState<GanttView>({
        id: 'default',
        name: 'Default View',
        type: 'week',
        fromDate: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
        toDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
    });

    const ganttData = useMemo(() => {
        const sortedTasks = tasks.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
        return {
            tasks: sortedTasks,
            columns: sortedTasks.reduce((cols, task) => {
                const startDate = new Date(task.start);
                const date = startDate.toDateString().split('T')[0];

                if (!cols.find((col) => col.date === date)) {
                    cols.push({
                        id: date,
                        name: startDate.toLocaleDateString('en-US', {
                            weekday: 'short',
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                        }),
                        date: startDate,
                        tasks: []
                    });
                }

                const column = cols.find((col) => col.date === date);
                if (column) {
                    column.tasks.push(task);
                }

                return cols;
            }, [] as any[])
        };
    }, [tasks]);

    const getStatusColor = (status: GanttTask['status']) => {
        switch (status) {
            case 'completed':
                return 'bg-green-500';
            case 'in-progress':
                return 'bg-blue-500';
            case 'delayed':
                return 'bg-yellow-500';
            case 'cancelled':
                return 'bg-red-500';
            default:
                return 'bg-gray-400';
        }
    };

    const getPriorityColor = (priority: GanttTask['priority']) => {
        switch (priority) {
            case 'critical':
                return 'text-red-600 bg-red-50';
            case 'high':
                return 'text-orange-600 bg-orange-50';
            case 'medium':
                return 'text-yellow-600 bg-yellow-50';
            case 'low':
                return 'text-blue-600 bg-blue-50';
            default:
                return 'text-gray-600 bg-gray-50';
        }
    };

    const TaskBar = ({ task }: { task: GanttTask }) => (
        <div
            className={`w-full h-6 border-l-2 ${getStatusColor(task.status)} rounded-sm px-2 flex items-center transition-colors cursor-pointer hover:opacity-80`}
        >
            <div className="text-xs font-medium text-white truncate">{task.title}</div>
            <div className="flex items-center gap-2">
                {task.progress > 0 && (
                    <div className="w-20 bg-white rounded-sm p-1">
                        <div className="text-xs text-gray-600">Progress</div>
                        <div className="text-xs font-medium">{Math.round(task.progress)}%</div>
                    </div>
                )}
                {task.assignees && task.assignees.length > 0 && (
                    <div className="flex items-center">
                        <Users className="w-4 h-4 text-gray-600" />
                        <div className="text-xs text-gray-400 ml-1 truncate">{task.assignees.join(', ')}</div>
                    </div>
                )}
            </div>
        </div>
    );

    const formatDate = (date: Date) => {
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    return (
        <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="mb-6 flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Project Gantt Chart</h2>
                <div className="flex items-center gap-2">
                    <div className="text-sm text-gray-600">
                        <Calendar className="w-4 h-4" />
                        {formatDate(view.fromDate)} - {formatDate(view.toDate)}
                    </div>
                    <select
                        value={view.id}
                        onChange={(e) =>
                            setView({
                                id: e.target.value,
                                name:
                                    e.target.value === 'day'
                                        ? 'Day View'
                                        : e.target.value === 'week'
                                          ? 'Week View'
                                          : 'Month View',
                                type: e.target.value === 'day' ? 'day' : e.target.value === 'week' ? 'week' : 'month',
                                fromDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
                                toDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
                            })
                        }
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1"
                    >
                        <option value="day">Day View</option>
                        <option value="week">Week View</option>
                        <option value="month">Month View</option>
                    </select>
                </div>
            </div>

            <div className="overflow-x-auto">
                <div className="min-w-max">
                    <div className="flex border-b border-gray-200">
                        {ganttData.columns.map((column, columnIndex) => (
                            <div key={column.id} className="flex-shrink-0 w-40 p-4 border-r border-gray-200">
                                <div className="text-sm font-medium text-gray-700 mb-2">
                                    <div className="flex items-center gap-2">
                                        <Calendar className="w-4 h-4" />
                                        {column.name}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                        {column.tasks.length} task{column.tasks.length === 1 ? '' : 's'}
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    {column.tasks.map((task, index) => (
                                        <TaskBar key={task.id} task={task} />
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="mt-6">
                <div className="flex items-center gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-red-500" />
                        <span>Critical</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-orange-500" />
                        <span>High</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-yellow-500" />
                        <span>Medium</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-blue-500" />
                        <span>Low</span>
                    </div>
                </div>
                <div className="text-xs text-gray-500 mt-2">
                    {tasks.length} total tasks • {tasks.filter((t) => t.status === 'completed').length} completed
                </div>
            </div>
        </div>
    );
};

export default GanttChart;
