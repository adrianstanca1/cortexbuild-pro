/**
 * Project Calendar Screen
 * Interactive calendar view for project deadlines, tasks, and milestones
 */

import React, { useState, useEffect } from 'react';
import { 
    ChevronLeft, 
    ChevronRight, 
    Calendar as CalendarIcon,
    Clock,
    CheckCircle,
    AlertCircle,
    Plus
} from 'lucide-react';
import { User } from '../../types';

interface CalendarEvent {
    id: string;
    title: string;
    date: Date;
    type: 'task' | 'deadline' | 'milestone' | 'meeting';
    project?: string;
    completed?: boolean;
    priority?: 'low' | 'medium' | 'high';
}

interface ProjectCalendarScreenProps {
    currentUser: User;
    goBack: () => void;
}

export const ProjectCalendarScreen: React.FC<ProjectCalendarScreenProps> = ({ 
    currentUser, 
    goBack 
}) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [events, setEvents] = useState<CalendarEvent[]>([]);
    const [viewMode, setViewMode] = useState<'month' | 'week' | 'day'>('month');

    useEffect(() => {
        loadEvents();
    }, [currentDate]);

    const loadEvents = async () => {
        // Mock events for demonstration
        const mockEvents: CalendarEvent[] = [
            {
                id: '1',
                title: 'Foundation inspection',
                date: new Date(2025, 9, 15),
                type: 'task',
                project: 'Downtown Plaza',
                completed: false,
                priority: 'high'
            },
            {
                id: '2',
                title: 'Client meeting',
                date: new Date(2025, 9, 18),
                type: 'meeting',
                project: 'Riverside Complex',
                priority: 'medium'
            },
            {
                id: '3',
                title: 'Project deadline',
                date: new Date(2025, 9, 30),
                type: 'deadline',
                project: 'Harbor Development',
                priority: 'high'
            },
            {
                id: '4',
                title: 'Phase 1 completion',
                date: new Date(2025, 9, 25),
                type: 'milestone',
                project: 'Downtown Plaza',
                completed: true
            }
        ];
        setEvents(mockEvents);
    };

    const getDaysInMonth = (date: Date): Date[] => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        
        const days: Date[] = [];
        
        // Add days from previous month to fill the week
        const firstDayOfWeek = firstDay.getDay();
        for (let i = firstDayOfWeek - 1; i >= 0; i--) {
            const prevDate = new Date(year, month, -i);
            days.push(prevDate);
        }
        
        // Add days of current month
        for (let i = 1; i <= daysInMonth; i++) {
            days.push(new Date(year, month, i));
        }
        
        // Add days from next month to fill the week
        const remainingDays = 7 - (days.length % 7);
        if (remainingDays < 7) {
            for (let i = 1; i <= remainingDays; i++) {
                days.push(new Date(year, month + 1, i));
            }
        }
        
        return days;
    };

    const getEventsForDate = (date: Date): CalendarEvent[] => {
        return events.filter(event => 
            event.date.toDateString() === date.toDateString()
        );
    };

    const isToday = (date: Date): boolean => {
        const today = new Date();
        return date.toDateString() === today.toDateString();
    };

    const isCurrentMonth = (date: Date): boolean => {
        return date.getMonth() === currentDate.getMonth();
    };

    const goToPreviousMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    };

    const goToNextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    };

    const goToToday = () => {
        setCurrentDate(new Date());
    };

    const getEventIcon = (type: CalendarEvent['type']) => {
        switch (type) {
            case 'task':
                return <CheckCircle className="h-3 w-3" />;
            case 'deadline':
                return <AlertCircle className="h-3 w-3" />;
            case 'milestone':
                return <CalendarIcon className="h-3 w-3" />;
            case 'meeting':
                return <Clock className="h-3 w-3" />;
        }
    };

    const getEventColor = (type: CalendarEvent['type'], priority?: string) => {
        if (type === 'deadline' || priority === 'high') {
            return 'bg-red-100 text-red-700 border-red-200';
        }
        if (type === 'milestone') {
            return 'bg-purple-100 text-purple-700 border-purple-200';
        }
        if (type === 'meeting') {
            return 'bg-blue-100 text-blue-700 border-blue-200';
        }
        return 'bg-green-100 text-green-700 border-green-200';
    };

    const days = getDaysInMonth(currentDate);
    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8 flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Project Calendar</h1>
                        <p className="mt-2 text-gray-600">View and manage project deadlines and events</p>
                    </div>
                    <button
                        onClick={goBack}
                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                        Back
                    </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    {/* Calendar */}
                    <div className="lg:col-span-3 bg-white rounded-lg shadow-sm border border-gray-200">
                        {/* Calendar Header */}
                        <div className="p-6 border-b border-gray-200">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <button
                                        onClick={goToPreviousMonth}
                                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                    >
                                        <ChevronLeft className="h-5 w-5 text-gray-600" />
                                    </button>
                                    <h2 className="text-2xl font-bold text-gray-900">
                                        {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                                    </h2>
                                    <button
                                        onClick={goToNextMonth}
                                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                    >
                                        <ChevronRight className="h-5 w-5 text-gray-600" />
                                    </button>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={goToToday}
                                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
                                    >
                                        Today
                                    </button>
                                    <button className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                                        <Plus className="h-5 w-5" />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Calendar Grid */}
                        <div className="p-6">
                            {/* Week day headers */}
                            <div className="grid grid-cols-7 gap-2 mb-2">
                                {weekDays.map(day => (
                                    <div key={day} className="text-center text-sm font-semibold text-gray-600 py-2">
                                        {day}
                                    </div>
                                ))}
                            </div>

                            {/* Calendar days */}
                            <div className="grid grid-cols-7 gap-2">
                                {days.map((date, index) => {
                                    const dayEvents = getEventsForDate(date);
                                    const isTodayDate = isToday(date);
                                    const isCurrentMonthDate = isCurrentMonth(date);

                                    return (
                                        <div
                                            key={index}
                                            onClick={() => setSelectedDate(date)}
                                            className={`min-h-[100px] p-2 rounded-lg border transition-all cursor-pointer ${
                                                isTodayDate
                                                    ? 'bg-blue-50 border-blue-300 ring-2 ring-blue-500'
                                                    : selectedDate?.toDateString() === date.toDateString()
                                                    ? 'bg-gray-100 border-gray-300'
                                                    : 'border-gray-200 hover:bg-gray-50'
                                            } ${!isCurrentMonthDate ? 'opacity-50' : ''}`}
                                        >
                                            <div className={`text-sm font-semibold mb-1 ${
                                                isTodayDate ? 'text-blue-600' : 'text-gray-900'
                                            }`}>
                                                {date.getDate()}
                                            </div>
                                            <div className="space-y-1">
                                                {dayEvents.slice(0, 2).map(event => (
                                                    <div
                                                        key={event.id}
                                                        className={`px-2 py-1 rounded text-xs font-medium border truncate ${getEventColor(event.type, event.priority)}`}
                                                    >
                                                        <div className="flex items-center gap-1">
                                                            {getEventIcon(event.type)}
                                                            <span className="truncate">{event.title}</span>
                                                        </div>
                                                    </div>
                                                ))}
                                                {dayEvents.length > 2 && (
                                                    <div className="text-xs text-gray-500 px-2">
                                                        +{dayEvents.length - 2} more
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Selected Date Events */}
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">
                                {selectedDate ? selectedDate.toLocaleDateString('en-US', { 
                                    month: 'long', 
                                    day: 'numeric',
                                    year: 'numeric'
                                }) : 'Select a date'}
                            </h3>
                            {selectedDate && (
                                <div className="space-y-3">
                                    {getEventsForDate(selectedDate).map(event => (
                                        <div
                                            key={event.id}
                                            className={`p-3 rounded-lg border ${getEventColor(event.type, event.priority)}`}
                                        >
                                            <div className="flex items-start gap-2">
                                                {getEventIcon(event.type)}
                                                <div className="flex-1">
                                                    <p className="font-medium text-sm">{event.title}</p>
                                                    {event.project && (
                                                        <p className="text-xs mt-1 opacity-75">{event.project}</p>
                                                    )}
                                                </div>
                                                {event.completed && (
                                                    <CheckCircle className="h-4 w-4 text-green-600" />
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                    {getEventsForDate(selectedDate).length === 0 && (
                                        <p className="text-sm text-gray-500 text-center py-4">
                                            No events on this date
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Upcoming Events */}
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Upcoming</h3>
                            <div className="space-y-3">
                                {events
                                    .filter(event => event.date >= new Date())
                                    .sort((a, b) => a.date.getTime() - b.date.getTime())
                                    .slice(0, 5)
                                    .map(event => (
                                        <div key={event.id} className="flex items-start gap-3 p-2 hover:bg-gray-50 rounded-lg transition-colors">
                                            <div className="flex-shrink-0">
                                                {getEventIcon(event.type)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-gray-900 truncate">
                                                    {event.title}
                                                </p>
                                                <p className="text-xs text-gray-500">
                                                    {event.date.toLocaleDateString('en-US', { 
                                                        month: 'short', 
                                                        day: 'numeric' 
                                                    })}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                            </div>
                        </div>

                        {/* Legend */}
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Legend</h3>
                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 bg-green-500 rounded-full" />
                                    <span className="text-sm text-gray-700">Tasks</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 bg-red-500 rounded-full" />
                                    <span className="text-sm text-gray-700">Deadlines</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 bg-purple-500 rounded-full" />
                                    <span className="text-sm text-gray-700">Milestones</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 bg-blue-500 rounded-full" />
                                    <span className="text-sm text-gray-700">Meetings</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

