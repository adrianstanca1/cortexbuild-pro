// Kanban Card Component for Project Management
import React, { useState } from 'react';
import { Calendar, Clock, MessageSquare, User, AlertCircle, CheckCircle, Circle, Tag, Archive } from 'lucide-react';

export interface TaskComment {
    id: string;
    taskId: string;
    userId: string;
    userName: string;
    content: string;
    createdAt: Date;
    updatedAt: Date;
}

export type KanbanTask = {
    id: string;
    title: string;
    description: string;
    status: 'todo' | 'in-progress' | 'review' | 'done';
    assignee?: string;
    priority: 'low' | 'medium' | 'high' | 'critical';
    dueDate?: Date;
    tags: string[];
    comments: TaskComment[];
    attachments: string[];
    createdAt: Date;
    updatedAt: Date;
};

export type KanbanCardProps = {
    task: KanbanTask;
    onTaskUpdate?: (task: KanbanTask) => void;
    onStatusChange?: (newStatus: KanbanTask['status']) => void;
};

const KanbanCard: React.FC<KanbanCardProps> = ({ task, onTaskUpdate, onStatusChange }) => {
    return (
        <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-200 p-4 mb-4 relative">
            <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center`}>
                        {task.status === 'done' && <CheckCircle className="w-5 h-5 text-white" />}
                        {task.status === 'in-progress' && <Clock className="w-4 h-4 animate-pulse" />}
                        {task.status === 'review' && <AlertCircle className="w-4 h-4 text-white" />}
                    </div>

                    <div className="flex-1">
                        <div className="font-medium text-gray-900">{task.title}</div>
                        {task.priority === 'critical' && (
                            <span className="px-2 py-1 bg-red-100 text-red-600 text-xs rounded-full">Critical</span>
                        )}
                    </div>
                </div>
            </div>

            <div className="text-sm text-gray-600 line-clamp-2 mb-2">{task.description}</div>

            <div className="flex items-center gap-2 mt-3 mb-2">
                {task.assignee && (
                    <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-500" />
                        <span className="text-gray-400 truncate">{task.assignee}</span>
                    </div>
                )}
            </div>

            <div className="flex items-center gap-2 mt-2 mb-2">
                <div className="text-xs text-gray-400">
                    <User className="w-4 h-4 text-gray-400" />
                    <span className="ml-1 text-gray-500">{task.createdAt.toLocaleDateString()}</span>
                </div>

                {task.dueDate && (
                    <div className="text-xs text-gray-400">
                        <Clock className="w-3 h-3 text-gray-400" />
                        <span className="ml-1 text-gray-500">Due: {new Date(task.dueDate).toLocaleDateString()}</span>
                    </div>
                )}
            </div>

            {task.tags.length > 0 && (
                <div className="flex items-center gap-2 mt-2 mb-2">
                    <div className="flex gap-1">
                        <Tag className="w-3 h-3 text-gray-400" />
                        <div className="flex flex-wrap gap-1">
                            {task.tags.slice(0, 3).map((tag, index) => (
                                <span key={index} className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                                    {tag}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            <div className="flex items-center gap-2 mt-3">
                <div className="text-xs text-gray-400">
                    <Archive className="w-3 h-3 text-gray-400" />
                    <span className="text-gray-400">{task.attachments.length}</span>
                </div>

                <div className="flex items-center gap-2">
                    <div className="text-xs text-gray-400">
                        <MessageSquare className="w-3 h-3 text-gray-400" />
                        <span>{task.comments.length}</span>
                    </div>
                </div>
            </div>

            {onStatusChange && (
                <div className="absolute top-2 right-2">
                    <button
                        onClick={() => onStatusChange(task.status)}
                        className={`px-2 py-1 rounded-lg text-sm font-medium transition-colors ${
                            task.status === 'done'
                                ? 'bg-green-600 text-white hover:bg-green-700'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                    >
                        {task.status === 'done' ? <CheckCircle className="w-4 h-4" /> : <Circle className="w-4 h-4" />}
                    </button>
                </div>
            )}
        </div>
    );
};

export default KanbanCard;
