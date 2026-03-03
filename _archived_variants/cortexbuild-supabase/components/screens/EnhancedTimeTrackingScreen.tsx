/**
 * Enhanced Time Tracking Screen
 * Comprehensive time tracking with real-time timer, reports, and analytics
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
    Play, 
    Pause, 
    Square, 
    Clock, 
    Calendar,
    TrendingUp, 
    Download,
    Filter,
    PieChart as PieChartIcon,
    BarChart3
} from 'lucide-react';
import { User } from '../../types';

interface TimeEntry {
    id: string;
    task: string;
    project: string;
    duration: number; // in seconds
    startTime: Date;
    endTime?: Date;
    notes?: string;
    billable: boolean;
    status: 'running' | 'paused' | 'completed';
}

interface EnhancedTimeTrackingScreenProps {
    currentUser: User;
    goBack: () => void;
}

export const EnhancedTimeTrackingScreen: React.FC<EnhancedTimeTrackingScreenProps> = ({ 
    currentUser, 
    goBack 
}) => {
    const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
    const [activeEntry, setActiveEntry] = useState<TimeEntry | null>(null);
    const [currentTime, setCurrentTime] = useState(0);
    const [isRunning, setIsRunning] = useState(false);
    const [selectedTask, setSelectedTask] = useState('');
    const [selectedProject, setSelectedProject] = useState('');
    const [notes, setNotes] = useState('');
    const [isBillable, setIsBillable] = useState(true);
    const [viewMode, setViewMode] = useState<'timer' | 'entries' | 'reports'>('timer');
    const [filterDate, setFilterDate] = useState(new Date());
    
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (isRunning && activeEntry) {
            timerRef.current = setInterval(() => {
                setCurrentTime(prev => prev + 1);
            }, 1000);
        } else {
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
        }

        return () => {
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
        };
    }, [isRunning, activeEntry]);

    useEffect(() => {
        // Load time entries from API
        loadTimeEntries();
    }, [filterDate]);

    const loadTimeEntries = async () => {
        // Mock data for demonstration
        const mockEntries: TimeEntry[] = [
            {
                id: '1',
                task: 'Foundation inspection',
                project: 'Downtown Plaza',
                duration: 7200, // 2 hours
                startTime: new Date(Date.now() - 7200000),
                endTime: new Date(),
                billable: true,
                status: 'completed'
            },
            {
                id: '2',
                task: 'Steel frame review',
                project: 'Riverside Complex',
                duration: 5400, // 1.5 hours
                startTime: new Date(Date.now() - 86400000),
                endTime: new Date(Date.now() - 81000000),
                billable: true,
                status: 'completed'
            }
        ];
        setTimeEntries(mockEntries);
    };

    const startTimer = () => {
        if (!selectedTask || !selectedProject) {
            alert('Please select a task and project');
            return;
        }

        const newEntry: TimeEntry = {
            id: Date.now().toString(),
            task: selectedTask,
            project: selectedProject,
            duration: 0,
            startTime: new Date(),
            notes,
            billable: isBillable,
            status: 'running'
        };

        setActiveEntry(newEntry);
        setIsRunning(true);
        setCurrentTime(0);
    };

    const pauseTimer = () => {
        setIsRunning(false);
        if (activeEntry) {
            setActiveEntry({
                ...activeEntry,
                status: 'paused',
                duration: currentTime
            });
        }
    };

    const resumeTimer = () => {
        setIsRunning(true);
        if (activeEntry) {
            setActiveEntry({
                ...activeEntry,
                status: 'running'
            });
        }
    };

    const stopTimer = () => {
        if (activeEntry) {
            const completedEntry: TimeEntry = {
                ...activeEntry,
                duration: currentTime,
                endTime: new Date(),
                status: 'completed'
            };

            setTimeEntries(prev => [completedEntry, ...prev]);
            setActiveEntry(null);
            setIsRunning(false);
            setCurrentTime(0);
            setSelectedTask('');
            setSelectedProject('');
            setNotes('');
        }
    };

    const formatDuration = (seconds: number): string => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const calculateTotalTime = (): string => {
        const total = timeEntries.reduce((sum, entry) => sum + entry.duration, 0);
        const hours = Math.floor(total / 3600);
        const minutes = Math.floor((total % 3600) / 60);
        return `${hours}h ${minutes}m`;
    };

    const calculateBillableTime = (): string => {
        const total = timeEntries
            .filter(entry => entry.billable)
            .reduce((sum, entry) => sum + entry.duration, 0);
        const hours = Math.floor(total / 3600);
        const minutes = Math.floor((total % 3600) / 60);
        return `${hours}h ${minutes}m`;
    };

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Time Tracking</h1>
                    <p className="mt-2 text-gray-600">Track your work time and generate detailed reports</p>
                </div>

                {/* View Mode Toggle */}
                <div className="mb-6 bg-white rounded-lg shadow-sm p-4 border border-gray-200">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setViewMode('timer')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                                viewMode === 'timer'
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                        >
                            <Clock className="h-4 w-4" />
                            Timer
                        </button>
                        <button
                            onClick={() => setViewMode('entries')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                                viewMode === 'entries'
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                        >
                            <Calendar className="h-4 w-4" />
                            Entries
                        </button>
                        <button
                            onClick={() => setViewMode('reports')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                                viewMode === 'reports'
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                        >
                            <BarChart3 className="h-4 w-4" />
                            Reports
                        </button>
                    </div>
                </div>

                {/* Timer View */}
                {viewMode === 'timer' && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Timer Widget */}
                        <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border border-gray-200 p-8">
                            <div className="text-center mb-8">
                                <div className="text-6xl font-mono font-bold text-gray-900 mb-4">
                                    {formatDuration(currentTime)}
                                </div>
                                {activeEntry && (
                                    <div className="text-sm text-gray-600">
                                        <p className="font-medium text-gray-900">{activeEntry.task}</p>
                                        <p>{activeEntry.project}</p>
                                    </div>
                                )}
                            </div>

                            {/* Timer Controls */}
                            {!activeEntry ? (
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Task
                                        </label>
                                        <input
                                            type="text"
                                            value={selectedTask}
                                            onChange={(e) => setSelectedTask(e.target.value)}
                                            placeholder="What are you working on?"
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Project
                                        </label>
                                        <select
                                            value={selectedProject}
                                            onChange={(e) => setSelectedProject(e.target.value)}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        >
                                            <option value="">Select project</option>
                                            <option value="Downtown Plaza">Downtown Plaza</option>
                                            <option value="Riverside Complex">Riverside Complex</option>
                                            <option value="Harbor Development">Harbor Development</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Notes (optional)
                                        </label>
                                        <textarea
                                            value={notes}
                                            onChange={(e) => setNotes(e.target.value)}
                                            rows={3}
                                            placeholder="Add notes about this time entry..."
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            id="billable"
                                            checked={isBillable}
                                            onChange={(e) => setIsBillable(e.target.checked)}
                                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                        />
                                        <label htmlFor="billable" className="text-sm font-medium text-gray-700">
                                            Billable
                                        </label>
                                    </div>
                                    <button
                                        onClick={startTimer}
                                        className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                                    >
                                        <Play className="h-5 w-5" />
                                        Start Timer
                                    </button>
                                </div>
                            ) : (
                                <div className="flex items-center justify-center gap-4">
                                    {isRunning ? (
                                        <button
                                            onClick={pauseTimer}
                                            className="flex items-center gap-2 px-8 py-3 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors font-medium"
                                        >
                                            <Pause className="h-5 w-5" />
                                            Pause
                                        </button>
                                    ) : (
                                        <button
                                            onClick={resumeTimer}
                                            className="flex items-center gap-2 px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                                        >
                                            <Play className="h-5 w-5" />
                                            Resume
                                        </button>
                                    )}
                                    <button
                                        onClick={stopTimer}
                                        className="flex items-center gap-2 px-8 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                                    >
                                        <Square className="h-5 w-5" />
                                        Stop
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Summary Stats */}
                        <div className="space-y-6">
                            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                                <h3 className="text-sm font-medium text-gray-600 mb-4">Today's Summary</h3>
                                <div className="space-y-4">
                                    <div>
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-sm text-gray-600">Total Time</span>
                                            <Clock className="h-4 w-4 text-gray-400" />
                                        </div>
                                        <div className="text-2xl font-bold text-gray-900">{calculateTotalTime()}</div>
                                    </div>
                                    <div>
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-sm text-gray-600">Billable Time</span>
                                            <TrendingUp className="h-4 w-4 text-green-600" />
                                        </div>
                                        <div className="text-2xl font-bold text-green-600">{calculateBillableTime()}</div>
                                    </div>
                                    <div>
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-sm text-gray-600">Entries</span>
                                            <Calendar className="h-4 w-4 text-gray-400" />
                                        </div>
                                        <div className="text-2xl font-bold text-gray-900">{timeEntries.length}</div>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-blue-50 rounded-lg border border-blue-200 p-4">
                                <h4 className="text-sm font-medium text-blue-900 mb-2">Pro Tip</h4>
                                <p className="text-sm text-blue-800">
                                    Use keyboard shortcuts: <kbd className="px-2 py-1 bg-white rounded text-xs">Ctrl+Space</kbd> to start/pause timer
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Entries View */}
                {viewMode === 'entries' && (
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                        <div className="p-6 border-b border-gray-200">
                            <div className="flex items-center justify-between">
                                <h2 className="text-lg font-semibold text-gray-900">Time Entries</h2>
                                <div className="flex items-center gap-4">
                                    <input
                                        type="date"
                                        value={filterDate.toISOString().split('T')[0]}
                                        onChange={(e) => setFilterDate(new Date(e.target.value))}
                                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                    <button className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
                                        <Filter className="h-4 w-4" />
                                        Filter
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="divide-y divide-gray-200">
                            {timeEntries.map((entry) => (
                                <div key={entry.id} className="p-6 hover:bg-gray-50 transition-colors">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <h3 className="font-medium text-gray-900">{entry.task}</h3>
                                            <p className="text-sm text-gray-600 mt-1">{entry.project}</p>
                                            {entry.notes && (
                                                <p className="text-sm text-gray-500 mt-2">{entry.notes}</p>
                                            )}
                                        </div>
                                        <div className="text-right">
                                            <div className="text-lg font-semibold text-gray-900">
                                                {formatDuration(entry.duration)}
                                            </div>
                                            <div className="flex items-center gap-2 mt-1">
                                                {entry.billable && (
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                                        Billable
                                                    </span>
                                                )}
                                                <span className="text-xs text-gray-500">
                                                    {entry.startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}

                            {timeEntries.length === 0 && (
                                <div className="p-12 text-center">
                                    <Clock className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                                    <p className="text-sm text-gray-500">No time entries for this date</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Reports View */}
                {viewMode === 'reports' && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Weekly Summary</h3>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-600">Monday</span>
                                    <span className="text-sm font-medium text-gray-900">8h 30m</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-600">Tuesday</span>
                                    <span className="text-sm font-medium text-gray-900">7h 45m</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-600">Wednesday</span>
                                    <span className="text-sm font-medium text-gray-900">9h 15m</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-600">Thursday</span>
                                    <span className="text-sm font-medium text-gray-900">8h 00m</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-600">Friday</span>
                                    <span className="text-sm font-medium text-gray-900">7h 30m</span>
                                </div>
                                <div className="pt-4 border-t border-gray-200">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-medium text-gray-900">Total</span>
                                        <span className="text-lg font-bold text-blue-600">41h 00m</span>
                                    </div>
                                </div>
                            </div>
                            <button className="mt-6 w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                                <Download className="h-4 w-4" />
                                Export Report
                            </button>
                        </div>

                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Project Breakdown</h3>
                            <div className="space-y-4">
                                {['Downtown Plaza', 'Riverside Complex', 'Harbor Development'].map((project, index) => {
                                    const hours = [25, 12, 4][index];
                                    const percentage = (hours / 41) * 100;
                                    return (
                                        <div key={project}>
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-sm font-medium text-gray-900">{project}</span>
                                                <span className="text-sm text-gray-600">{hours}h ({percentage.toFixed(0)}%)</span>
                                            </div>
                                            <div className="w-full bg-gray-200 rounded-full h-2">
                                                <div
                                                    className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                                                    style={{ width: `${percentage}%` }}
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

