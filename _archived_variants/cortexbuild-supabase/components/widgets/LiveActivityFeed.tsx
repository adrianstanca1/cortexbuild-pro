/**
 * Live Activity Feed Component
 * Displays real-time activity updates across the platform
 */

import React, { useState, useEffect } from 'react';
import { Activity, Clock, CheckCircle, AlertCircle, User, FileText, MessageSquare } from 'lucide-react';
import { realtimeService } from '../../utils/realtime';

interface ActivityItem {
    id: string;
    type: 'task' | 'comment' | 'file' | 'status' | 'assignment';
    action: string;
    user: {
        name: string;
        avatar?: string;
    };
    resource: {
        type: string;
        name: string;
        id: string;
    };
    timestamp: string;
    metadata?: any;
}

interface LiveActivityFeedProps {
    projectId?: string;
    userId?: string;
    limit?: number;
    className?: string;
}

export const LiveActivityFeed: React.FC<LiveActivityFeedProps> = ({ 
    projectId, 
    userId, 
    limit = 50,
    className = '' 
}) => {
    const [activities, setActivities] = useState<ActivityItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadInitialActivities();

        // Subscribe to real-time updates
        const unsubscribe = subscribeToUpdates();

        return () => {
            unsubscribe();
        };
    }, [projectId, userId]);

    const loadInitialActivities = async () => {
        setLoading(true);
        try {
            // Load initial activities from API
            // This would be replaced with actual API call
            const mockActivities: ActivityItem[] = [
                {
                    id: '1',
                    type: 'task',
                    action: 'completed',
                    user: { name: 'John Doe', avatar: undefined },
                    resource: { type: 'task', name: 'Foundation inspection', id: 't1' },
                    timestamp: new Date().toISOString(),
                },
                {
                    id: '2',
                    type: 'comment',
                    action: 'added',
                    user: { name: 'Jane Smith', avatar: undefined },
                    resource: { type: 'task', name: 'Steel frame installation', id: 't2' },
                    timestamp: new Date(Date.now() - 300000).toISOString(),
                },
                {
                    id: '3',
                    type: 'file',
                    action: 'uploaded',
                    user: { name: 'Mike Johnson', avatar: undefined },
                    resource: { type: 'document', name: 'Blueprint revision 3.pdf', id: 'd1' },
                    timestamp: new Date(Date.now() - 600000).toISOString(),
                }
            ];
            
            setActivities(mockActivities.slice(0, limit));
            setError(null);
        } catch (err) {
            setError('Failed to load activities');
            console.error('Error loading activities:', err);
        } finally {
            setLoading(false);
        }
    };

    const subscribeToUpdates = (): (() => void) => {
        if (projectId) {
            // Subscribe to project-specific updates
            const unsubTasks = realtimeService.subscribeToProjectTasks(projectId, (payload) => {
                handleRealtimeUpdate(payload);
            });

            const unsubProject = realtimeService.subscribeToProject(projectId, (payload) => {
                handleRealtimeUpdate(payload);
            });

            return () => {
                unsubTasks();
                unsubProject();
            };
        }

        return () => {};
    };

    const handleRealtimeUpdate = (payload: any) => {
        // Convert realtime payload to activity item
        const newActivity: ActivityItem = {
            id: payload.new?.id || Date.now().toString(),
            type: determineActivityType(payload),
            action: payload.eventType === 'INSERT' ? 'created' : payload.eventType === 'UPDATE' ? 'updated' : 'deleted',
            user: { 
                name: payload.new?.updated_by || 'System',
                avatar: undefined 
            },
            resource: {
                type: payload.table,
                name: payload.new?.name || payload.new?.title || 'Unknown',
                id: payload.new?.id || ''
            },
            timestamp: new Date().toISOString(),
            metadata: payload.new
        };

        setActivities(prev => {
            const updated = [newActivity, ...prev];
            return updated.slice(0, limit);
        });
    };

    const determineActivityType = (payload: any): ActivityItem['type'] => {
        const table = payload.table?.toLowerCase() || '';
        if (table.includes('task')) return 'task';
        if (table.includes('comment')) return 'comment';
        if (table.includes('file') || table.includes('document')) return 'file';
        if (table.includes('assignment')) return 'assignment';
        return 'status';
    };

    const getActivityIcon = (type: ActivityItem['type']) => {
        switch (type) {
            case 'task':
                return <CheckCircle className="h-5 w-5 text-green-600" />;
            case 'comment':
                return <MessageSquare className="h-5 w-5 text-blue-600" />;
            case 'file':
                return <FileText className="h-5 w-5 text-purple-600" />;
            case 'assignment':
                return <User className="h-5 w-5 text-orange-600" />;
            case 'status':
                return <AlertCircle className="h-5 w-5 text-yellow-600" />;
        }
    };

    const getActionText = (activity: ActivityItem): string => {
        const actionVerbs: Record<string, string> = {
            completed: 'completed',
            created: 'created',
            updated: 'updated',
            deleted: 'deleted',
            added: 'added',
            uploaded: 'uploaded',
            assigned: 'assigned to'
        };

        return `${actionVerbs[activity.action] || activity.action} ${activity.resource.type}`;
    };

    const formatTimestamp = (timestamp: string): string => {
        const date = new Date(timestamp);
        const now = new Date();
        const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

        if (diffInSeconds < 60) return 'Just now';
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
        return `${Math.floor(diffInSeconds / 86400)}d ago`;
    };

    if (loading) {
        return (
            <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${className}`}>
                <div className="flex items-center justify-center py-12">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${className}`}>
                <div className="flex flex-col items-center justify-center py-12 text-center">
                    <AlertCircle className="h-12 w-12 text-red-300 mb-4" />
                    <p className="text-sm font-medium text-red-900">{error}</p>
                    <button 
                        onClick={loadInitialActivities}
                        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}>
            {/* Header */}
            <div className="border-b border-gray-200 px-6 py-4">
                <div className="flex items-center gap-3">
                    <Activity className="h-5 w-5 text-gray-600" />
                    <h2 className="text-lg font-semibold text-gray-900">Live Activity</h2>
                    <div className="ml-auto flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                        <span className="text-xs text-gray-500">Live</span>
                    </div>
                </div>
            </div>

            {/* Activity List */}
            <div className="divide-y divide-gray-100 max-h-[600px] overflow-y-auto">
                {activities.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                        <Activity className="h-12 w-12 text-gray-300 mb-4" />
                        <p className="text-sm font-medium text-gray-500">No recent activity</p>
                        <p className="text-xs text-gray-400 mt-1">Activity will appear here as it happens</p>
                    </div>
                ) : (
                    activities.map((activity) => (
                        <div 
                            key={activity.id}
                            className="px-6 py-4 hover:bg-gray-50 transition-colors cursor-pointer"
                        >
                            <div className="flex items-start gap-4">
                                {/* Icon */}
                                <div className="flex-shrink-0 mt-1">
                                    {getActivityIcon(activity.type)}
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm text-gray-900">
                                        <span className="font-medium">{activity.user.name}</span>
                                        {' '}
                                        <span className="text-gray-600">{getActionText(activity)}</span>
                                        {' '}
                                        <span className="font-medium text-blue-600">{activity.resource.name}</span>
                                    </p>
                                    <div className="flex items-center gap-2 mt-1">
                                        <Clock className="h-3 w-3 text-gray-400" />
                                        <span className="text-xs text-gray-500">
                                            {formatTimestamp(activity.timestamp)}
                                        </span>
                                    </div>
                                </div>

                                {/* Status indicator for new items */}
                                {Date.now() - new Date(activity.timestamp).getTime() < 60000 && (
                                    <div className="flex-shrink-0">
                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                            New
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Footer */}
            {activities.length > 0 && (
                <div className="border-t border-gray-200 px-6 py-3 bg-gray-50">
                    <button className="text-sm text-blue-600 hover:text-blue-800 font-medium">
                        View all activity
                    </button>
                </div>
            )}
        </div>
    );
};

